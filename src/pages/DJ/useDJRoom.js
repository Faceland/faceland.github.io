import { useCallback, useEffect, useRef, useState } from 'react';

// The room server lives outside GitHub Pages (see dj-server/). In development
// it defaults to port 8787 on whatever host served the page, so phones on the
// LAN can join a dev session (start dj-server with HOST=0.0.0.0 for that).
// "localhost" is pinned to IPv4 because dj-server binds 127.0.0.1 by default.
const devHost =
  window.location.hostname === 'localhost'
    ? '127.0.0.1'
    : window.location.hostname;
const SERVER_URL =
  process.env.REACT_APP_DJ_SERVER_URL ||
  (process.env.NODE_ENV === 'development' ? `ws://${devHost}:8787` : '');

const STORAGE_KEY = 'faceland.dj';

// No accounts: name, look and song list just live in this browser.
const loadSaved = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
};

const save = (patch) => {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...loadSaved(), ...patch }),
    );
  } catch {
    // Private mode / blocked storage: the room still works, it just forgets.
  }
};

const EMPTY_ROOM = { users: [], djQueue: [], current: null };

// Chat is never stored anywhere: this tab only shows what was said while it
// was open, and only the most recent lines of that.
const CHAT_LINES_KEPT = 150;

// How long a like/cheer animation plays (matches the CSS in dj.scss).
export const REACTION_MS = 1100;

export const useDJRoom = () => {
  const [status, setStatus] = useState(SERVER_URL ? 'connecting' : 'offline');
  // Clicked Join this visit. Stays true through reconnects, unlike `me`.
  const [entered, setEntered] = useState(false);
  const [room, setRoom] = useState(EMPTY_ROOM);
  const [me, setMe] = useState(null);
  const [list, setList] = useState(() => loadSaved().list || []);
  const [savedName] = useState(() => loadSaved().name);
  const [notice, setNotice] = useState(null);
  const [adding, setAdding] = useState(false);
  const [chat, setChat] = useState([]);
  const [chatNotice, setChatNotice] = useState(null);
  // user id -> { kind, at } for avatars mid-animation.
  const [reactions, setReactions] = useState({});

  const wsRef = useRef(null);
  // Whether we've joined, so a reconnect can rejoin without asking again.
  const joinedRef = useRef(false);

  const send = useCallback((message) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN)
      ws.send(JSON.stringify(message));
  }, []);

  const hello = useCallback(() => {
    const saved = loadSaved();
    send({
      t: 'hello',
      // Protocol 2: floor moves arrive as compact [id, x, y] triples.
      v: 2,
      name: saved.name,
      emoji: saved.emoji,
      eyes: saved.eyes,
      hat: saved.hat,
      list: saved.list,
    });
    // Background tabs skip the floor's animation traffic (see below).
    if (document.hidden) send({ t: 'visibility', hidden: true });
  }, [send]);

  // While this tab is in the background the server stops sending floor
  // moves and reactions (the music and room state keep coming); coming back
  // fetches a fresh snapshot. Saves bandwidth for everyone listening in a tab
  // they aren't looking at.
  useEffect(() => {
    const report = () => {
      if (joinedRef.current) send({ t: 'visibility', hidden: document.hidden });
    };
    document.addEventListener('visibilitychange', report);
    return () => document.removeEventListener('visibilitychange', report);
  }, [send]);

  useEffect(() => {
    // Not during the build's react-snap pre-render: the static /dj page
    // should say "Connecting…", exactly what a browser renders first.
    if (!SERVER_URL || navigator.userAgent.includes('ReactSnap')) {
      return undefined;
    }
    let ws;
    let retryTimer;
    let retryDelay = 1000;
    let disposed = false;

    const onMessage = (event) => {
      let msg;
      try {
        msg = JSON.parse(event.data);
      } catch {
        return;
      }
      switch (msg.t) {
        case 'state':
          setRoom({
            users: msg.users,
            djQueue: msg.djQueue,
            current: msg.current && {
              ...msg.current,
              // Anchor the song to this browser's clock: where the song should
              // be is always (performance.now() - startPerf).
              startPerf: performance.now() - msg.current.elapsed,
              // When the DJ's Skip / Leave booth open up, on the same clock.
              unlockPerf: performance.now() + (msg.current.skipLock || 0),
            },
          });
          break;
        case 'moves': {
          // The server batches everyone's steps into one message per tick,
          // as compact [id, x, y] triples in thousandths. (Objects are the
          // older format, still accepted while the server updates.)
          const moved = new Map(
            msg.moves.map((move) =>
              Array.isArray(move)
                ? [move[0], { x: move[1] / 1000, y: move[2] / 1000 }]
                : [move.id, move],
            ),
          );
          setRoom((prev) => ({
            ...prev,
            users: prev.users.map((user) => {
              const move = moved.get(user.id);
              return move ? { ...user, x: move.x, y: move.y } : user;
            }),
          }));
          break;
        }
        case 'welcome':
          setMe({ id: msg.id, name: msg.name });
          save({
            name: msg.name,
            emoji: msg.emoji,
            eyes: msg.eyes,
            hat: msg.hat,
          });
          break;
        case 'list':
          setList(msg.list);
          setAdding(false);
          save({ list: msg.list });
          break;
        case 'chat':
          setChat((prev) => prev.concat(msg.messages).slice(-CHAT_LINES_KEPT));
          break;
        case 'reactions': {
          // `at` doubles as a React key, so a new reaction restarts the
          // animation even if the last one hasn't finished.
          const now = performance.now();
          const batch = {};
          msg.reactions.forEach(({ id, kind }, i) => {
            batch[id] = { kind, at: now + i };
          });
          setReactions((prev) => ({ ...prev, ...batch }));
          setTimeout(() => {
            setReactions((prev) => {
              const next = { ...prev };
              Object.keys(batch).forEach((id) => {
                if (next[id] && next[id].at === batch[id].at) delete next[id];
              });
              return next;
            });
          }, REACTION_MS);
          break;
        }
        case 'notice':
          if (msg.scope === 'chat') {
            setChatNotice({ message: msg.message, at: Date.now() });
            break;
          }
          setNotice({ message: msg.message, at: Date.now() });
          setAdding(false);
          break;
        default:
          break;
      }
    };

    const connect = () => {
      setStatus('connecting');
      ws = new WebSocket(SERVER_URL);
      wsRef.current = ws;
      ws.onopen = () => {
        retryDelay = 1000;
        setStatus('open');
        if (joinedRef.current) hello();
      };
      ws.onmessage = onMessage;
      ws.onclose = () => {
        if (disposed) return;
        // A restarted server hands out new ids; ours is stale until we rejoin.
        setMe(null);
        setAdding(false);
        setStatus('reconnecting');
        retryTimer = setTimeout(connect, retryDelay);
        retryDelay = Math.min(retryDelay * 2, 15000);
      };
    };
    connect();

    return () => {
      disposed = true;
      clearTimeout(retryTimer);
      ws.close();
    };
  }, [hello]);

  const join = useCallback(
    (name) => {
      save({ name });
      joinedRef.current = true;
      setEntered(true);
      hello();
    },
    [hello],
  );

  const actions = {
    join,
    setName: (name) => {
      save({ name });
      send({ t: 'setName', name });
    },
    // { emoji, eyes, hat }; no eyes or hat is null.
    setLook: (look) => {
      save(look);
      send({ t: 'setLook', ...look });
    },
    addTrack: (url) => {
      setAdding(true);
      send({ t: 'addTrack', url });
    },
    removeTrack: (key) => send({ t: 'removeTrack', key }),
    bumpTrack: (key) => send({ t: 'bumpTrack', key }),
    setDJ: (on) => send({ t: 'setDJ', on }),
    skip: () => send({ t: 'skip' }),
    sendChat: (text) => send({ t: 'chat', text }),
    react: (kind, on) => send({ t: 'react', kind, on }),
    voteSkip: (on) => send({ t: 'voteSkip', on }),
    move: (x, y) => {
      // Step locally right away; the server echoes the same spot back.
      setRoom((prev) => ({
        ...prev,
        users: prev.users.map((user) =>
          me && user.id === me.id ? { ...user, x, y } : user,
        ),
      }));
      send({ t: 'move', x, y });
    },
    reportDuration: (playId, seconds) =>
      send({ t: 'duration', playId, seconds }),
    reportEnded: (playId) => send({ t: 'ended', playId }),
    reportError: (playId, code) => send({ t: 'trackError', playId, code }),
  };

  return {
    status,
    entered,
    savedName,
    room,
    me,
    list,
    notice,
    adding,
    chat,
    chatNotice,
    reactions,
    actions,
  };
};
