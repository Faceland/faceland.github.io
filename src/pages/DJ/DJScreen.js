import React, { useCallback, useEffect, useRef, useState } from 'react';

// A listener more than this far from the room's position gets seeked back to
// it. Generous on purpose: small drift is inaudible, seeks are not.
const DRIFT_LIMIT_S = 2;
// After a seek the player buffers; give it time to settle before judging
// drift again, or a slow connection would chase the target forever.
const SEEK_COOLDOWN_MS = 3000;

let apiPromise = null;

const loadYouTubeApi = () => {
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
  if (!apiPromise) {
    apiPromise = new Promise((resolve, reject) => {
      const previous = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (previous) previous();
        resolve(window.YT);
      };
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      script.onerror = () => {
        apiPromise = null;
        reject(new Error('Could not load the YouTube player'));
      };
      document.head.appendChild(script);
    });
  }
  return apiPromise;
};

const targetTime = (current) => (performance.now() - current.startPerf) / 1000;

// The booth's video. Every listener plays the room's song from YouTube on
// their own and keeps nudging themselves to where the room is. Ads need no
// special handling: while one plays, this listener just falls behind, and the
// first check after the song starts jumps them forward to the room.
export const DJScreen = ({ current, joined, onDuration, onEnded, onError }) => {
  const hostRef = useRef(null);
  const playerRef = useRef(null);
  const currentRef = useRef(current);
  const loadedRef = useRef(null); // playId the player was last told to load
  const reportedRef = useRef(0);
  const lastSeekRef = useRef(0);
  const callbacksRef = useRef();
  const [problem, setProblem] = useState(null);

  currentRef.current = current;
  callbacksRef.current = { onDuration, onEnded, onError };

  const syncTrack = useCallback(() => {
    const player = playerRef.current;
    const cur = currentRef.current;
    if (!player) return;
    if (!cur) {
      if (loadedRef.current) player.stopVideo();
      loadedRef.current = null;
      return;
    }
    if (loadedRef.current === cur.playId) return;
    loadedRef.current = cur.playId;
    reportedRef.current = 0;
    setProblem(null);
    player.loadVideoById({
      videoId: cur.videoId,
      startSeconds: Math.max(0, targetTime(cur)),
    });
  }, []);

  const resync = useCallback(() => {
    const player = playerRef.current;
    const cur = currentRef.current;
    if (!player || !cur || loadedRef.current !== cur.playId) return;
    if (player.getPlayerState() !== window.YT.PlayerState.PLAYING) return;

    const duration = player.getDuration();
    if (duration > 0 && Math.abs(duration - reportedRef.current) > 1) {
      reportedRef.current = duration;
      callbacksRef.current.onDuration(cur.playId, duration);
    }

    if (performance.now() - lastSeekRef.current < SEEK_COOLDOWN_MS) return;
    const target = targetTime(cur);
    if (Math.abs(player.getCurrentTime() - target) > DRIFT_LIMIT_S) {
      lastSeekRef.current = performance.now();
      player.seekTo(target, true);
    }
  }, []);

  // The player is only created once the visitor has joined: their Join click
  // is the user gesture browsers want before video may autoplay with sound.
  useEffect(() => {
    if (!joined) return undefined;
    const host = hostRef.current;
    // YouTube replaces this element with its iframe, so React must never own
    // it; it lives inside a host div React leaves empty.
    const mount = document.createElement('div');
    host.appendChild(mount);
    let player = null;
    let cancelled = false;

    loadYouTubeApi()
      .then((YT) => {
        if (cancelled) return;
        player = new YT.Player(mount, {
          width: '100%',
          height: '100%',
          playerVars: {
            autoplay: 1,
            playsinline: 1,
            rel: 0,
            origin: window.location.origin,
          },
          events: {
            onReady: () => {
              playerRef.current = player;
              syncTrack();
            },
            onStateChange: ({ data }) => {
              const cur = currentRef.current;
              if (data === YT.PlayerState.PLAYING) {
                setProblem((p) => (p === 'blocked' ? null : p));
                resync();
              } else if (
                data === YT.PlayerState.ENDED &&
                cur &&
                loadedRef.current === cur.playId
              ) {
                callbacksRef.current.onEnded(cur.playId);
              }
            },
            onError: ({ data }) => {
              const cur = currentRef.current;
              setProblem('error');
              if (cur) callbacksRef.current.onError(cur.playId, data);
            },
            onAutoplayBlocked: () => setProblem('blocked'),
          },
        });
      })
      .catch(() => setProblem('api'));

    const interval = setInterval(resync, 1000);
    return () => {
      cancelled = true;
      clearInterval(interval);
      playerRef.current = null;
      loadedRef.current = null;
      if (player) player.destroy();
      host.innerHTML = '';
    };
  }, [joined, syncTrack, resync]);

  useEffect(syncTrack, [current && current.playId, syncTrack]);

  const messages = {
    blocked:
      'Your browser blocked autoplay. Press play on the video to listen.',
    error: "This video won't play for you here. The next song will.",
    api: "Couldn't load the YouTube player. Check your connection or ad blocker.",
  };

  return (
    <div className="djScreen">
      <div className="djScreen__frame">
        {/* The player is hidden only while nothing is queued, never while a
            song plays: YouTube's terms forbid background (audio-only) play. */}
        <div
          ref={hostRef}
          className="djScreen__player"
          style={{ visibility: joined && current ? 'visible' : 'hidden' }}
        />
        {!(joined && current) && (
          <div className="djScreen__idle">
            {current ? (
              <img
                src={`https://i.ytimg.com/vi/${current.videoId}/mqdefault.jpg`}
                alt=""
                className="djScreen__thumb"
              />
            ) : (
              <span>
                Nobody&apos;s DJing.
                <br />
                Hop in the queue!
              </span>
            )}
          </div>
        )}
      </div>
      {joined && current && problem && (
        <p className="djScreen__problem">{messages[problem]}</p>
      )}
    </div>
  );
};
