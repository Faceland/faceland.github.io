import React, {
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Context } from '../../Store';
import { HeaderBar } from '../../components/HeaderBar/HeaderBar';
import { SEO } from '../../components/SEO/SEO';
import {
  MAX_CHAT_LENGTH,
  chatProblem,
  nameProblem,
  rateLimitWait,
} from './chatRules';
import { DJScreen } from './DJScreen';
import { useDJRoom } from './useDJRoom';
import './dj.scss';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const formatTime = (seconds) => {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

// Stable per-user number, so everyone's dance bob starts out of step.
const hash = (text) =>
  [...text].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

// Fanned and increasingly spaced lines: a cheap vanishing-point dance floor.
// Purely decorative; avatars sit wherever the floor was clicked.
const FloorGrid = () => (
  <svg
    className="djFloor__grid"
    viewBox="0 0 100 100"
    preserveAspectRatio="none"
    aria-hidden="true"
  >
    {Array.from({ length: 17 }, (_, i) => i - 8).map((i) => (
      <line
        key={`v${i}`}
        x1={50 + i * 4}
        y1="0"
        x2={50 + i * 16}
        y2="100"
        vectorEffect="non-scaling-stroke"
      />
    ))}
    {Array.from({ length: 9 }, (_, i) => 100 * ((i + 1) / 9) ** 1.7).map(
      (y) => (
        <line
          key={`h${y}`}
          x1="0"
          y1={y}
          x2="100"
          y2={y}
          vectorEffect="non-scaling-stroke"
        />
      ),
    )}
  </svg>
);

const CONFETTI_COLORS = [
  '#8f5cff',
  '#48ba3b',
  '#f4e4bf',
  '#ff6fae',
  '#4fd1ff',
  '#ffd23f',
];

// Confetti bursting out of an emoji, plus the reaction's own emoji floating
// up. The burst is aimed between two angles (degrees; 0 = right, 90 = up),
// which lets the DJ's confetti fly away from the video, never over it.
const Confetti = ({ kind, fromAngle = 20, toAngle = 160 }) => {
  const pieces = useMemo(
    () =>
      CONFETTI_COLORS.concat(CONFETTI_COLORS.slice(0, 4)).map((color, i) => {
        const degrees =
          fromAngle + ((toAngle - fromAngle) * (i + Math.random() * 0.8)) / 10;
        const radians = (degrees * Math.PI) / 180;
        const distance = 0.7 + Math.random() * 0.5;
        return {
          color,
          dx: `${(Math.cos(radians) * distance).toFixed(2)}em`,
          dy: `${(-Math.sin(radians) * distance).toFixed(2)}em`,
          spin: `${Math.round(Math.random() * 540 - 270)}deg`,
          delay: `${Math.round(Math.random() * 120)}ms`,
        };
      }),
    [fromAngle, toAngle],
  );
  return (
    <span className="djConfetti" aria-hidden="true">
      {pieces.map((piece, i) => (
        <span
          key={i}
          className="djConfetti__piece"
          style={{
            '--dx': piece.dx,
            '--dy': piece.dy,
            '--spin': piece.spin,
            background: piece.color,
            animationDelay: piece.delay,
          }}
        />
      ))}
      <span className="djConfetti__icon">{kind === 'like' ? '👍' : '🎉'}</span>
    </span>
  );
};

// An emoji that hops and spins, with confetti, whenever its person reacts.
// Keying on the reaction restarts the animation for every new one.
const ReactiveEmoji = ({ emoji, reaction, className, style, burst }) => (
  <>
    <span
      key={reaction ? `hop-${reaction.at}` : 'idle'}
      className={`djHop${reaction ? ' djHop--go' : ''}`}
    >
      <span className={className} style={style}>
        {emoji}
      </span>
    </span>
    {reaction && (
      <Confetti
        key={`confetti-${reaction.at}`}
        kind={reaction.kind}
        {...burst}
      />
    )}
  </>
);

const Avatar = ({ user, self, reaction }) => {
  // Faked perspective: the nearer the bottom of the floor, the nearer the
  // viewer, so the bigger the emoji (and the later it's painted).
  const scale = 0.55 + user.y;
  return (
    <div
      className={`djAvatar${self ? ' djAvatar--self' : ''}`}
      style={{
        left: `${user.x * 100}%`,
        top: `${user.y * 100}%`,
        zIndex: 1 + Math.round(user.y * 1000),
      }}
    >
      <div
        className="djAvatar__body"
        style={{ fontSize: `calc(var(--dj-emoji-size) * ${scale})` }}
      >
        <ReactiveEmoji
          emoji={user.emoji}
          reaction={reaction}
          className="djAvatar__emoji"
          style={{ animationDelay: `-${hash(user.id) % 700}ms` }}
        />
      </div>
      <div className="djAvatar__name" style={{ fontSize: 10 + 4 * user.y }}>
        {user.name}
      </div>
    </div>
  );
};

const DJFloor = ({ users, meId, reactions, playing, canMove, onMove }) => {
  const floorRef = useRef(null);

  const handlePointerDown = (event) => {
    if (!canMove) return;
    const rect = floorRef.current.getBoundingClientRect();
    // Keep a margin so the emoji and its name label stay on screen and
    // clear of the floating cards, even at front-row (largest) size.
    onMove(
      clamp((event.clientX - rect.left) / rect.width, 0.05, 0.95),
      clamp((event.clientY - rect.top) / rect.height, 0, 0.9),
    );
  };

  // The floor and its grid run full width (under the floating cards on wide
  // screens); the area inside is where avatars stand and clicks count, and
  // the CSS keeps it clear of the cards.
  return (
    <div
      className={`djFloor${canMove ? ' djFloor--walkable' : ''}${
        playing ? ' djFloor--playing' : ''
      }`}
    >
      <FloorGrid />
      <div
        ref={floorRef}
        className="djFloor__area"
        onPointerDown={handlePointerDown}
      >
        {users.map((user) => (
          <Avatar
            key={user.id}
            user={user}
            self={user.id === meId}
            reaction={reactions[user.id]}
          />
        ))}
      </div>
    </div>
  );
};

// The room's position, as a bar that runs itself to the end of the song in
// CSS. Its timing is worked out once when it mounts and never touched again;
// the parent re-keys it to restart (new song, length learned, pause/play).
const LiveBar = ({ startPerf, duration, snapTarget }) => {
  const [timing] = useState(() => {
    const elapsed = (performance.now() - startPerf) / 1000;
    return {
      from: clamp(elapsed / duration, 0, 1),
      remaining: Math.max(0, duration - elapsed),
    };
  });
  return (
    <div
      className={`djProgress__live${snapTarget ? ' djProgress__live--snap' : ''}`}
      style={{
        '--from': timing.from,
        animationDuration: `${timing.remaining}s`,
      }}
    />
  );
};

// `pausedAt`: where this listener's own video is stopped (seconds), or null
// while they're listening along with the room.
const NowPlaying = ({ current, dj, pausedAt }) => {
  // Only the clock text ticks each second; the bars animate on their own.
  const [, tick] = useState(0);
  useEffect(() => {
    if (!current) return undefined;
    const interval = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(interval);
  }, [current]);

  if (!current) return <div className="djNowPlaying" />;
  const elapsed = (performance.now() - current.startPerf) / 1000;
  const paused = pausedAt !== null && pausedAt !== undefined;
  return (
    <div className="djNowPlaying">
      <p className="djNowPlaying__title" title={current.title}>
        {current.title}
      </p>
      <p className="djNowPlaying__meta">
        {dj ? `${dj.emoji} ${dj.name}` : 'Someone'} &middot;{' '}
        {formatTime(elapsed)}
        {current.duration ? ` / ${formatTime(current.duration)}` : ''}
      </p>
      <div className="djNowPlaying__bar">
        {current.duration ? (
          <>
            {/* Paused: white is where Play will snap you to (the room). */}
            <LiveBar
              key={`${current.playId}-${current.duration}-${paused}`}
              startPerf={current.startPerf}
              duration={current.duration}
              snapTarget={paused}
            />
            {paused && (
              <div
                className="djProgress__mine"
                style={{
                  transform: `scaleX(${clamp(pausedAt / current.duration, 0, 1)})`,
                }}
              />
            )}
          </>
        ) : null}
      </div>
    </div>
  );
};

const JoinOverlay = ({ status, room, savedName, onJoin }) => {
  const [name, setName] = useState(savedName || 'Guest');
  const [problem, setProblem] = useState(null);
  const count = room.users.length;
  const lines = {
    offline: "The DJ room isn't open right now.",
    connecting: 'Connecting…',
    reconnecting: "Can't reach the DJ room. Retrying…",
    open: `${count} ${count === 1 ? 'person' : 'people'} on the floor`,
  };

  return (
    <div className="djJoin">
      <form
        className="djJoin__card"
        onSubmit={(event) => {
          event.preventDefault();
          const next = name.trim() || 'Guest';
          const why = nameProblem(next);
          if (why) setProblem(why);
          else onJoin(next);
        }}
      >
        <h1>DJ Room</h1>
        <p className="djJoin__status">{lines[status]}</p>
        {room.current && (
          <p className="djJoin__playing">
            Now playing: <strong>{room.current.title}</strong>
          </p>
        )}
        <label className="djJoin__label" htmlFor="djJoinName">
          Your name
        </label>
        <input
          id="djJoinName"
          className="djInput"
          value={name}
          maxLength={20}
          onChange={(event) => {
            setName(event.target.value);
            setProblem(null);
          }}
          onFocus={(event) => event.target.select()}
        />
        {problem && (
          <p className="djError" role="alert">
            {problem}
          </p>
        )}
        <button
          type="submit"
          className="djButton djButton--primary"
          disabled={status !== 'open'}
        >
          Join the party
        </button>
      </form>
    </div>
  );
};

const NameField = ({ name, onCommit }) => {
  const [value, setValue] = useState(name);
  const [problem, setProblem] = useState(null);
  useEffect(() => setValue(name), [name]);
  const commit = () => {
    const next = value.trim() || 'Guest';
    const why = nameProblem(next);
    if (why) {
      setProblem(why);
      setValue(name);
      return;
    }
    setValue(next);
    if (next !== name) onCommit(next);
  };
  return (
    <div className="djPanel__name">
      <input
        className="djInput"
        aria-label="Your name"
        value={value}
        maxLength={20}
        onChange={(event) => {
          setValue(event.target.value);
          setProblem(null);
        }}
        onBlur={commit}
        onKeyDown={(event) => event.key === 'Enter' && event.target.blur()}
      />
      {problem && (
        <p className="djError" role="alert">
          {problem}
        </p>
      )}
    </div>
  );
};

// A card's title row; in a mobile pop-out it also gets a minimize button.
const CardHead = ({ title, onMinimize }) => (
  <div className="djCard__head">
    <h2>{title}</h2>
    {onMinimize && (
      <button
        className="djCard__minimize"
        onClick={onMinimize}
        aria-label={`Minimize ${title}`}
        title="Minimize"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7.4 8.6 12 13.2l4.6-4.6L18 10l-6 6-6-6z" />
        </svg>
      </button>
    )}
  </div>
);

// `visible` is false while it sits minimized in a mobile pop-out.
const DJChat = ({
  messages,
  meId,
  notice,
  onSend,
  onMinimize,
  visible = true,
}) => {
  const logRef = useRef(null);
  // Follow new messages only while the reader is at (or near) the bottom.
  const pinnedRef = useRef(true);
  const sentRef = useRef([]); // this tab's send times, for the rate limit
  const lastRef = useRef({ text: '', at: 0 });
  const [draft, setDraft] = useState('');
  const [problem, setProblem] = useState(null);

  // (Also on being shown again: a hidden log can't scroll.)
  useLayoutEffect(() => {
    const log = logRef.current;
    if (log && visible && pinnedRef.current) log.scrollTop = log.scrollHeight;
  }, [messages, visible]);

  // The server runs the same checks; its rare refusals show here too.
  useEffect(() => {
    if (notice) setProblem(notice.message);
  }, [notice]);

  const submit = (event) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    const now = Date.now();
    const wait = rateLimitWait(sentRef.current, now);
    const why =
      (wait > 0 && `Slow down: wait ${Math.ceil(wait / 1000)}s.`) ||
      chatProblem(text) ||
      (text === lastRef.current.text &&
        now - lastRef.current.at < 30000 &&
        'You just said that.');
    if (why) {
      setProblem(why);
      return;
    }
    sentRef.current = sentRef.current
      .filter((at) => now - at < 60000)
      .concat(now);
    lastRef.current = { text, at: now };
    onSend(text);
    setDraft('');
    setProblem(null);
  };

  return (
    <aside className="djChat" aria-label="Chat">
      <CardHead title="Chat" onMinimize={onMinimize} />
      <ol
        ref={logRef}
        className="djChat__log djScroll"
        role="log"
        onScroll={() => {
          const log = logRef.current;
          pinnedRef.current =
            log.scrollHeight - log.scrollTop - log.clientHeight < 40;
        }}
      >
        {messages.length ? (
          messages.map((message) => (
            <li key={message.id}>
              <span className="djChat__emoji">{message.emoji}</span>
              <span
                className={`djChat__name${
                  message.userId === meId ? ' djChat__name--self' : ''
                }`}
              >
                {message.name}
              </span>
              : {message.text}
            </li>
          ))
        ) : (
          <li className="djHint">
            Say hi! Chat isn&apos;t saved anywhere, so you only see what&apos;s
            said while you&apos;re here.
          </li>
        )}
      </ol>
      <form className="djChat__form" onSubmit={submit}>
        <input
          className="djInput"
          aria-label="Chat message"
          placeholder={meId ? 'Say something' : 'Reconnecting…'}
          value={draft}
          maxLength={MAX_CHAT_LENGTH}
          disabled={!meId}
          onChange={(event) => {
            setDraft(event.target.value);
            setProblem(null);
          }}
        />
        <button
          type="submit"
          className="djButton"
          disabled={!meId || !draft.trim()}
        >
          Send
        </button>
      </form>
      {problem && (
        <p className="djError djChat__problem" role="alert">
          {problem}
        </p>
      )}
    </aside>
  );
};

const AddTrackForm = ({ adding, onAdd }) => {
  const [url, setUrl] = useState('');
  return (
    <form
      className="djAddTrack"
      onSubmit={(event) => {
        event.preventDefault();
        if (!url.trim() || adding) return;
        onAdd(url.trim());
        setUrl('');
      }}
    >
      <input
        className="djInput"
        placeholder="Paste a YouTube link"
        aria-label="YouTube link"
        value={url}
        onChange={(event) => setUrl(event.target.value)}
      />
      <button type="submit" className="djButton" disabled={adding}>
        {adding ? '…' : 'Add'}
      </button>
    </form>
  );
};

const DJControls = ({ me, room, list, actions }) => {
  const { current, djQueue } = room;
  const place = djQueue.indexOf(me.id);

  if (current && current.djId === me.id) {
    return (
      <div className="djControls">
        <p>You&apos;re on the decks! 🎧</p>
        <div className="djControls__row">
          <button className="djButton" onClick={actions.skip}>
            Skip song
          </button>
          <button className="djButton" onClick={() => actions.setDJ(false)}>
            Leave booth
          </button>
        </div>
      </div>
    );
  }
  if (place >= 0) {
    return (
      <div className="djControls">
        <p>
          You&apos;re up after {place} {place === 1 ? 'song' : 'songs'}.
        </p>
        <button className="djButton" onClick={() => actions.setDJ(false)}>
          Leave the queue
        </button>
      </div>
    );
  }
  return (
    <div className="djControls">
      <button
        className="djButton djButton--primary"
        onClick={() => actions.setDJ(true)}
        disabled={!list.length}
      >
        Start DJing
      </button>
      {!list.length && <p className="djHint">Add a song to your list first.</p>}
    </div>
  );
};

// On desktop the panel has no title; as a mobile pop-out it gets one, with
// the minimize button.
const Panel = ({ me, room, list, adding, actions, onMinimize }) => {
  const head = onMinimize && <CardHead title="You" onMinimize={onMinimize} />;
  if (!me) {
    return (
      <aside className="djPanel">
        {head}
        <div className="djPanel__scroll djScroll">
          <p className="djHint">Reconnecting&hellip;</p>
        </div>
      </aside>
    );
  }
  const byId = Object.fromEntries(room.users.map((user) => [user.id, user]));
  const self = byId[me.id] || me;

  return (
    // The card itself doesn't scroll (its glow never repaints); this does.
    <aside className="djPanel">
      {head}
      <div className="djPanel__scroll djScroll">
        <section className="djPanel__section djPanel__me">
          <span className="djPanel__meEmoji">{self.emoji}</span>
          <NameField name={self.name} onCommit={actions.setName} />
        </section>

        <section className="djPanel__section">
          <DJControls me={me} room={room} list={list} actions={actions} />
        </section>

        <section className="djPanel__section">
          <h2>DJ queue</h2>
          {room.djQueue.length ? (
            <ol className="djQueue">
              {room.djQueue.map((id, index) => {
                const user = byId[id];
                if (!user) return null;
                const onDecks = index === 0 && room.current;
                return (
                  <li key={id} className={id === me.id ? 'djQueue--self' : ''}>
                    <span>{user.emoji}</span> {user.name}
                    {onDecks && <span className="djQueue__now">🎧 now</span>}
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="djHint">Nobody yet. Be the first!</p>
          )}
        </section>

        <section className="djPanel__section djPanel__list">
          <h2>Your list</h2>
          <AddTrackForm adding={adding} onAdd={actions.addTrack} />
          {list.length ? (
            <ol className="djTracks">
              {list.map((track, index) => (
                <li key={track.key}>
                  <span className="djTracks__title" title={track.title}>
                    {track.title}
                  </span>
                  {track.duration ? (
                    <span className="djTracks__time">
                      {formatTime(track.duration)}
                    </span>
                  ) : null}
                  <button
                    className="djIconButton"
                    title="Play next"
                    aria-label={`Play ${track.title} next`}
                    disabled={index === 0}
                    onClick={() => actions.bumpTrack(track.key)}
                  >
                    ⤒
                  </button>
                  <button
                    className="djIconButton"
                    title="Remove"
                    aria-label={`Remove ${track.title}`}
                    onClick={() => actions.removeTrack(track.key)}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ol>
          ) : (
            <p className="djHint">
              Your top song plays when it&apos;s your turn, then moves to the
              bottom.
            </p>
          )}
        </section>
      </div>
    </aside>
  );
};

const CHEER_COOLDOWN_MS = 3000;

// Beside the screen: Like / Cheer (pure fun: your emoji hops for everyone)
// and the room's vote to skip.
const BoothControls = ({ me, current, actions }) => {
  const [liked, setLiked] = useState(false);
  const [cheerCooling, setCheerCooling] = useState(false);
  const playId = current && current.playId;

  // A like is for a song, so a new song starts un-liked.
  useEffect(() => setLiked(false), [playId]);

  useEffect(() => {
    if (!cheerCooling) return undefined;
    const timer = setTimeout(() => setCheerCooling(false), CHEER_COOLDOWN_MS);
    return () => clearTimeout(timer);
  }, [cheerCooling]);

  const skip = current && current.skip;
  const voted = !!(me && skip && skip.voters.includes(me.id));
  const amDJ = !!(me && current && current.djId === me.id);

  return (
    <div className="djBooth__controls">
      <div className="djBooth__row">
        <button
          className={`djReact${liked ? ' djReact--on' : ''}`}
          aria-pressed={liked}
          disabled={!me || !current}
          onClick={() => {
            setLiked(!liked);
            actions.react('like', !liked);
          }}
        >
          <span aria-hidden="true">👍</span>Like
        </button>
        <button
          className="djReact"
          disabled={!me || cheerCooling}
          onClick={() => {
            setCheerCooling(true);
            actions.react('cheer');
          }}
        >
          <span aria-hidden="true">🎉</span>Cheer
        </button>
      </div>
      <div className="djBooth__row djBooth__row--skip">
        <button
          className={`djReact djReact--skip${voted ? ' djReact--on' : ''}`}
          aria-pressed={voted}
          disabled={!me || !current || amDJ}
          title={amDJ ? 'Use Skip song in the panel instead' : undefined}
          onClick={() => actions.voteSkip(!voted)}
        >
          {voted ? 'Voted to skip' : 'Vote to skip'}
        </button>
        <span className="djBooth__votes">
          {skip
            ? `${skip.votes}/${skip.needed} votes to skip`
            : 'Nothing playing'}
        </span>
      </div>
    </div>
  );
};

const Toast = ({ notice }) => {
  const [visible, setVisible] = useState(null);
  useEffect(() => {
    if (!notice) return undefined;
    setVisible(notice);
    const timer = setTimeout(() => setVisible(null), 4000);
    return () => clearTimeout(timer);
  }, [notice]);
  return visible ? (
    <div className="djToast" role="status">
      {visible.message}
    </div>
  ) : null;
};

// Phones: chat and the panel live in two pop-out cards, opened from bubbles
// on the floor and minimized back to them, so the page itself never scrolls.
// Both stay mounted while minimized, so a half-typed message survives.
// While a song plays, a pop-out stops just below the video and its controls
// and never covers the player (YouTube's terms forbid anything in front of
// it); with nothing playing it takes the whole screen under the header.
const MobileSheets = ({ stageRef, playing, me, chat, chatNotice, panel }) => {
  const [open, setOpen] = useState(null); // 'chat' | 'panel' | null
  const [lastSeen, setLastSeen] = useState(null); // last chat id read
  const [top, setTop] = useState(null);

  useEffect(() => {
    if (open === 'chat' && chat.length) setLastSeen(chat[chat.length - 1].id);
  }, [open, chat]);

  useLayoutEffect(() => {
    if (!open) return undefined;
    const measure = () => {
      const screen =
        playing &&
        stageRef.current &&
        stageRef.current.querySelector('.djScreen');
      setTop(
        screen ? Math.round(screen.getBoundingClientRect().bottom + 8) : null,
      );
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [open, playing, stageRef]);

  const unread =
    open === 'chat'
      ? 0
      : chat
          .slice(chat.findIndex((message) => message.id === lastSeen) + 1)
          .filter((message) => !me || message.userId !== me.id).length;
  const sheetStyle = top === null ? undefined : { top };
  const close = () => setOpen(null);

  return (
    <>
      {!open && (
        <div className="djBubbles">
          <button
            className="djBubble"
            onClick={() => setOpen('panel')}
            aria-label="Open your name, DJ controls and song list"
          >
            <span aria-hidden="true">{me ? me.emoji : '🎧'}</span>
          </button>
          <button
            className="djBubble"
            onClick={() => setOpen('chat')}
            aria-label={unread ? `Open chat (${unread} new)` : 'Open chat'}
          >
            <span aria-hidden="true">💬</span>
            {unread > 0 && (
              <span className="djBubble__badge">
                {unread > 99 ? '99+' : unread}
              </span>
            )}
          </button>
        </div>
      )}
      <div
        className="djSheet"
        hidden={open !== 'chat'}
        style={sheetStyle}
        role="dialog"
        aria-label="Chat"
      >
        <DJChat
          messages={chat}
          meId={me && me.id}
          notice={chatNotice}
          onSend={panel.actions.sendChat}
          onMinimize={close}
          visible={open === 'chat'}
        />
      </div>
      <div
        className="djSheet"
        hidden={open !== 'panel'}
        style={sheetStyle}
        role="dialog"
        aria-label="Your DJ panel"
      >
        <Panel {...panel} onMinimize={close} />
      </div>
    </>
  );
};

export const DJ = () => {
  const {
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
  } = useDJRoom();
  const [pausedAt, setPausedAt] = useState(null);
  const [{ mobile }] = useContext(Context);
  const stageRef = useRef(null);
  const { users, current } = room;
  const dj = current && users.find((user) => user.id === current.djId);
  const amDJ = !!(me && current && current.djId === me.id);

  // Phones: the page is exactly one screen and never scrolls (only the
  // pop-outs do); no rubber-banding or pull-to-refresh moving it either.
  useEffect(() => {
    if (!mobile) return undefined;
    const { documentElement: html, body } = document;
    const before = [
      html.style.overflow,
      body.style.overflow,
      html.style.overscrollBehavior,
    ];
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    html.style.overscrollBehavior = 'none';
    return () => {
      [
        html.style.overflow,
        body.style.overflow,
        html.style.overscrollBehavior,
      ] = before;
    };
  }, [mobile]);

  return (
    <div className={`App DJPage${mobile ? ' DJPage--mobile' : ''}`}>
      <SEO
        title="DJ Room"
        description="Take turns DJing YouTube music with the Faceland community."
        noindex
      />
      <HeaderBar fancy={false} />
      <div className={`djRoom${entered ? ' djRoom--entered' : ''}`}>
        {entered && !mobile && (
          <DJChat
            messages={chat}
            meId={me && me.id}
            notice={chatNotice}
            onSend={actions.sendChat}
          />
        )}
        <section ref={stageRef} className="djStage" aria-label="DJ room">
          <div className="djBooth">
            <div className="djBooth__dj">
              {dj && (
                <>
                  <span className="djBooth__djBody">
                    {/* Confetti flies up and left, away from the video. */}
                    <ReactiveEmoji
                      emoji={dj.emoji}
                      reaction={reactions[dj.id]}
                      className="djBooth__djEmoji"
                      burst={{ fromAngle: 95, toAngle: 175 }}
                    />
                  </span>
                  <span className="djBooth__djName">🎧 {dj.name}</span>
                </>
              )}
            </div>
            <DJScreen
              current={current}
              joined={entered}
              onDuration={actions.reportDuration}
              onEnded={actions.reportEnded}
              onError={actions.reportError}
              onPauseChange={setPausedAt}
            />
            <BoothControls me={me} current={current} actions={actions} />
          </div>
          <NowPlaying current={current} dj={dj} pausedAt={pausedAt} />
          <DJFloor
            users={users.filter((user) => !current || user.id !== current.djId)}
            meId={me && me.id}
            reactions={reactions}
            playing={!!current}
            canMove={!!me && !amDJ}
            onMove={actions.move}
          />
          {entered && status !== 'open' && (
            <p className="djBanner">
              Lost the connection. Reconnecting&hellip;
            </p>
          )}
          {!entered && (
            <JoinOverlay
              status={status}
              room={room}
              savedName={savedName}
              onJoin={actions.join}
            />
          )}
        </section>
        {entered && !mobile && (
          <Panel
            me={me}
            room={room}
            list={list}
            adding={adding}
            actions={actions}
          />
        )}
      </div>
      {entered && mobile && (
        <MobileSheets
          stageRef={stageRef}
          playing={!!current}
          me={me}
          chat={chat}
          chatNotice={chatNotice}
          panel={{ me, room, list, adding, actions }}
        />
      )}
      <Toast notice={notice} />
    </div>
  );
};
