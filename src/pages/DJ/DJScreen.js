import React, { useCallback, useEffect, useRef, useState } from 'react';

// A listener more than this far from the room's position gets seeked back to
// it. Generous on purpose: small drift is inaudible, seeks are not.
const DRIFT_LIMIT_S = 2;
// After a seek the player buffers; give it time to settle before judging
// drift again, or a slow connection would chase the target forever.
const SEEK_COOLDOWN_MS = 3000;

const VOLUME_KEY = 'faceland.dj.volume';

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

// Volume is a per-browser preference, so it survives reloads.
const loadVolume = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(VOLUME_KEY));
    if (saved && saved.level >= 0 && saved.level <= 100) {
      return { level: saved.level, muted: !!saved.muted };
    }
  } catch {
    // Unreadable or blocked storage: fall through to the default.
  }
  return { level: 70, muted: false };
};

const applyVolume = (player, { level, muted }) => {
  player.setVolume(level);
  if (muted || level === 0) player.mute();
  else player.unMute();
};

const Icon = ({ name }) => {
  const paths = {
    play: 'M8 5v14l11-7z',
    pause: 'M6 5h4v14H6zM14 5h4v14h-4z',
    volume:
      'M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 8v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z',
    muted:
      'M3 9v6h4l5 5V4L7 9H3zm13.6 3 2.7-2.7-1.4-1.4-2.7 2.7-2.7-2.7-1.4 1.4 2.7 2.7-2.7 2.7 1.4 1.4 2.7-2.7 2.7 2.7 1.4-1.4z',
  };
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={paths[name]} />
    </svg>
  );
};

// The booth's video. Every listener plays the room's song from YouTube on
// their own and keeps nudging themselves to where the room is. Ads need no
// special handling: while one plays, this listener just falls behind, and the
// first check after the song starts jumps them forward to the room.
//
// YouTube's own control bar is turned off (controls=0, a documented player
// parameter); the bar under the video drives the player through its API.
// Nothing is ever drawn over the player itself.
export const DJScreen = ({
  current,
  joined,
  onDuration,
  onEnded,
  onError,
  onPauseChange,
}) => {
  const hostRef = useRef(null);
  const playerRef = useRef(null);
  const currentRef = useRef(current);
  const loadedRef = useRef(null); // playId the player was last told to load
  const reportedRef = useRef(0);
  const lastSeekRef = useRef(0);
  const callbacksRef = useRef();
  const [problem, setProblem] = useState(null);
  const [volume, setVolume] = useState(loadVolume);
  const volumeRef = useRef(volume);
  // The listener's own pause. It only affects this browser: the room plays
  // on, and pressing play again jumps back to where the room is.
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);

  currentRef.current = current;
  callbacksRef.current = { onDuration, onEnded, onError, onPauseChange };
  volumeRef.current = volume;

  // Also tells the page where this listener's video stopped (seconds), so
  // the progress bar can show it against the room's live position.
  const markPaused = useCallback((value) => {
    pausedRef.current = value;
    setPaused(value);
    const player = playerRef.current;
    callbacksRef.current.onPauseChange(
      value && player ? player.getCurrentTime() : null,
    );
  }, []);

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
    const video = {
      videoId: cur.videoId,
      startSeconds: Math.max(0, targetTime(cur)),
    };
    // Paused listeners get the new song loaded but not playing.
    if (pausedRef.current) {
      player.cueVideoById(video);
      callbacksRef.current.onPauseChange(video.startSeconds);
    } else {
      player.loadVideoById(video);
    }
  }, []);

  const resync = useCallback(() => {
    const player = playerRef.current;
    const cur = currentRef.current;
    if (!player || !cur || loadedRef.current !== cur.playId) return;
    if (player.getPlayerState() !== window.YT.PlayerState.PLAYING) return;

    // Only report a length the room doesn't already have, so a crowd
    // doesn't send the server the same number once each per song.
    const duration = player.getDuration();
    const known = cur.duration && Math.abs(cur.duration - duration) <= 1;
    if (
      duration > 0 &&
      !known &&
      Math.abs(duration - reportedRef.current) > 1
    ) {
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
            controls: 0,
            disablekb: 1,
            fs: 0,
            iv_load_policy: 3,
            playsinline: 1,
            rel: 0,
            origin: window.location.origin,
          },
          events: {
            onReady: () => {
              playerRef.current = player;
              applyVolume(player, volumeRef.current);
              syncTrack();
            },
            onStateChange: ({ data }) => {
              const cur = currentRef.current;
              if (data === YT.PlayerState.PLAYING) {
                setProblem((p) => (p === 'blocked' ? null : p));
                markPaused(false);
                resync();
              } else if (data === YT.PlayerState.PAUSED) {
                // Also catches a click on the video itself.
                markPaused(true);
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
  }, [joined, syncTrack, resync, markPaused]);

  useEffect(syncTrack, [current && current.playId, syncTrack]);

  useEffect(() => {
    if (playerRef.current) applyVolume(playerRef.current, volume);
    try {
      localStorage.setItem(VOLUME_KEY, JSON.stringify(volume));
    } catch {
      // Private mode / blocked storage: the volume just isn't remembered.
    }
  }, [volume]);

  const togglePlay = () => {
    const player = playerRef.current;
    const cur = currentRef.current;
    if (!player || !cur) return;
    if (pausedRef.current) {
      markPaused(false);
      player.seekTo(Math.max(0, targetTime(cur)), true);
      player.playVideo();
    } else {
      markPaused(true);
      player.pauseVideo();
    }
  };

  const silent = volume.muted || volume.level === 0;
  const shownLevel = silent ? 0 : volume.level;
  const messages = {
    blocked:
      'Your browser blocked autoplay. Press play below (or tap the video) to listen.',
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
      {joined && (
        <div className="djScreen__bar">
          <button
            className="djScreen__button"
            onClick={togglePlay}
            disabled={!current}
            aria-label={paused ? 'Play' : 'Pause'}
            title={paused ? 'Play (rejoins the room live)' : 'Pause'}
          >
            <Icon name={paused ? 'play' : 'pause'} />
          </button>
          <button
            className="djScreen__button"
            onClick={() => {
              // Unmuting from zero would stay silent, so bring it back up.
              setVolume((v) =>
                silent
                  ? { level: v.level || 50, muted: false }
                  : { ...v, muted: true },
              );
            }}
            aria-label={silent ? 'Unmute' : 'Mute'}
            title={silent ? 'Unmute' : 'Mute'}
          >
            <Icon name={silent ? 'muted' : 'volume'} />
          </button>
          <input
            type="range"
            className="djScreen__volume"
            min="0"
            max="100"
            step="1"
            value={shownLevel}
            aria-label="Volume"
            style={{ '--fill': `${shownLevel}%` }}
            onChange={(event) =>
              setVolume({ level: Number(event.target.value), muted: false })
            }
          />
          {paused && current && <span className="djScreen__state">Paused</span>}
        </div>
      )}
      {joined && current && problem && (
        <p className="djScreen__problem">{messages[problem]}</p>
      )}
    </div>
  );
};
