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
import { lookImage } from './avatarArt';
import { EYES, FACES, HATS } from './avatarParts';
import { DJScreen } from './DJScreen';
import { formatTime } from './format';
import { PlaylistCard, usePlaylistKeys } from './Playlists';
import { useDJRoom } from './useDJRoom';
import './dj.scss';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const pick = (items) => items[Math.floor(Math.random() * items.length)];

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

// Someone's face with their eyes and hat, drawn as one image (see
// avatarArt.js). It lays out like a 1em emoji, the hat spilling over the
// top; `djArt--fit` instead fits the whole picture in its box. Without
// canvas it's just the face.
const AvatarArt = ({ look, className = '', style }) => {
  const src = lookImage(look);
  return src ? (
    <img
      className={`djArt ${className}`}
      style={style}
      src={src}
      alt=""
      draggable="false"
    />
  ) : (
    <span className={className} style={style}>
      {look.emoji}
    </span>
  );
};

// An avatar that hops and spins, with confetti, whenever its person reacts.
// Keying on the reaction restarts the animation for every new one.
const ReactiveAvatar = ({ look, reaction, className, style, burst }) => (
  <>
    <span
      key={reaction ? `hop-${reaction.at}` : 'idle'}
      className={`djHop${reaction ? ' djHop--go' : ''}`}
    >
      <AvatarArt look={look} className={className} style={style} />
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

const Avatar = ({ user, self, reaction, dancing }) => {
  // Faked perspective: the nearer the bottom of the floor, the nearer the
  // viewer, so the bigger the emoji (and the later it's painted).
  const scale = 0.55 + user.y;
  return (
    <div
      className={`djAvatar${self ? ' djAvatar--self' : ''}${
        dancing ? ' djAvatar--dancing' : ''
      }`}
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
        <ReactiveAvatar
          look={user}
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

// Only people who like the current song dance (the DJ always does, up in
// the booth).
const DJFloor = ({ users, meId, reactions, likes, canMove, onMove }) => {
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
    <div className={`djFloor${canMove ? ' djFloor--walkable' : ''}`}>
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
            dancing={likes.includes(user.id)}
          />
        ))}
      </div>
    </div>
  );
};

// Seconds per character for the title ticker: a steady reading speed
// whatever the title's length (a pixel-measured speed would shift as the
// clock's digits change, and changing a running animation's duration jumps).
const TICKER_S_PER_CHAR = 0.22;

// Above the video: "Now Playing: Title (1:02/3:45)", or "Waiting for a
// DJ..." with nothing playing. Only this line ticks each second (the
// progress bar under the video animates itself). It's always one line: if
// the title doesn't fit its space (the screen on phones, the whole stretch
// between the cards on desktop) it scrolls by as a ticker with faded edges:
// two copies of the text slide left by exactly one copy's width and loop,
// all in CSS.
const NowPlayingTitle = ({ current }) => {
  const [, tick] = useState(0);
  const boxRef = useRef(null);
  const copyRef = useRef(null);
  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => {
    if (!current) return undefined;
    const interval = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(interval);
  }, [current]);

  const title = current && current.title;
  useLayoutEffect(() => {
    if (!title) return undefined;
    const box = boxRef.current;
    const measure = () => {
      if (box && copyRef.current) {
        setOverflowing(copyRef.current.offsetWidth > box.clientWidth);
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    observer.observe(copyRef.current);
    return () => observer.disconnect();
  }, [title, overflowing]);

  if (!current) return <p className="djNowTitle">Waiting for a DJ...</p>;
  const elapsed = clamp(
    (performance.now() - current.startPerf) / 1000,
    0,
    current.duration || Infinity,
  );
  const text = (
    <>
      Now Playing: {current.title}{' '}
      <span className="djNowTitle__time">
        ({formatTime(elapsed)}
        {current.duration ? `/${formatTime(current.duration)}` : ''})
      </span>
    </>
  );

  const ticker = overflowing;
  return (
    <p
      ref={boxRef}
      className={`djNowTitle${ticker ? ' djNowTitle--ticker' : ''}`}
    >
      <span
        className="djNowTitle__track"
        style={
          ticker
            ? {
                animationDuration: `${(current.title.length + 30) * TICKER_S_PER_CHAR}s`,
              }
            : undefined
        }
      >
        <span ref={copyRef} className="djNowTitle__copy">
          {text}
        </span>
        {ticker && (
          <span className="djNowTitle__copy" aria-hidden="true">
            {text}
          </span>
        )}
      </span>
    </p>
  );
};

const JoinOverlay = ({ status, room, savedName, onJoin }) => {
  // 'Guest' first, matching the pre-rendered page, then the saved name.
  const [name, setName] = useState('Guest');
  const [problem, setProblem] = useState(null);
  useEffect(() => {
    if (savedName) setName(savedName);
  }, [savedName]);
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
    <div className="djAccount__name">
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
    <aside className="djCard djChat" aria-label="Chat">
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

// True until performance.now() reaches `until`; re-renders once, right when
// it does (a single timer, no ticking).
const useLockedUntil = (until) => {
  const [, wake] = useState(0);
  const remaining = until ? until - performance.now() : 0;
  useEffect(() => {
    if (!(remaining > 0)) return undefined;
    const timer = setTimeout(() => wake((n) => n + 1), remaining + 30);
    return () => clearTimeout(timer);
    // `remaining` changes every render; the timer only needs re-arming when
    // `until` does.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [until]);
  return remaining > 0;
};

// How many of the people up next the queue lists by name.
const QUEUE_SHOWN = 3;

// Left of the DJ in the booth: who's up next (the next three, plus you,
// numbered by your place, if you're further back), how many more are
// waiting, and your Join / Leave DJ Queue (and, on the decks, Skip Turn).
const DJQueue = ({ me, room, list, actions }) => {
  const { current, djQueue, users } = room;
  const byId = Object.fromEntries(users.map((user) => [user.id, user]));
  const onDecks = !!(me && current && current.djId === me.id);
  const inQueue = !!(me && djQueue.includes(me.id));
  // Skipping or leaving starts a new video for everyone, so (like a vote
  // skip) the server only allows it 10s into your song; dimmed until then.
  const locked = useLockedUntil(onDecks ? current.unlockPerf : 0);
  const lockedTitle = locked ? 'Available 10 seconds into your song' : '';

  // While a song plays its DJ is djQueue[0] (and already in the booth).
  const upNext = (current ? djQueue.slice(1) : djQueue).filter(
    (id) => byId[id],
  );
  const shown = upNext
    .slice(0, QUEUE_SHOWN)
    .map((id, index) => ({ id, place: index + 1 }));
  const myPlace = me ? upNext.indexOf(me.id) : -1;
  if (myPlace >= QUEUE_SHOWN) shown.push({ id: me.id, place: myPlace + 1 });
  const others = upNext.length - shown.length;

  const leave = (
    <button
      className="djButton djButton--danger"
      onClick={() => actions.setDJ(false)}
      disabled={!me || (onDecks && locked)}
      title={onDecks ? lockedTitle : ''}
    >
      Leave DJ Queue
    </button>
  );

  return (
    <section className="djQueueBox" aria-label="DJ queue">
      <h2>DJ queue</h2>
      {shown.length ? (
        <ol className="djQueue">
          {shown.map(({ id, place }) => (
            <li
              key={id}
              className={me && id === me.id ? 'djQueue--self' : undefined}
            >
              <span className="djQueue__place">{place}</span>
              <span className="djQueue__emoji">{byId[id].emoji}</span>
              <span className="djQueue__name">{byId[id].name}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="djHint">
          {current ? 'Nobody up next.' : 'Nobody yet. Be the first!'}
        </p>
      )}
      {others > 0 && (
        <p className="djQueue__others">
          ...and {others} {others === 1 ? 'other' : 'others'}!
        </p>
      )}
      <div className="djQueue__buttons">
        {onDecks && (
          <button
            className="djButton"
            onClick={actions.skip}
            disabled={locked}
            title={lockedTitle}
          >
            Skip Turn
          </button>
        )}
        {inQueue ? (
          leave
        ) : (
          <button
            className="djButton djButton--primary"
            onClick={() => actions.setDJ(true)}
            disabled={!me || !list.length}
            title={me && !list.length ? 'Add a song to your list first' : ''}
          >
            Join DJ Queue
          </button>
        )}
      </div>
    </section>
  );
};

const LOOK_TABS = [
  { key: 'emoji', label: 'Face', options: FACES.map((emoji) => ({ emoji })) },
  { key: 'eyes', label: 'Eyes', options: EYES, optional: true },
  { key: 'hat', label: 'Hat', options: HATS, optional: true },
];

// An accessory at random, but now and then none.
const maybePick = (parts) => (Math.random() < 0.25 ? null : pick(parts).emoji);

const lookOf = (user) => ({
  emoji: user.emoji,
  eyes: user.eyes || null,
  hat: user.hat || null,
});

// Pick a face, eyes and a hat, previewed as you go; Done sends it to the
// room. Opens in your name card, which takes over your list's space while
// it's open; just the options scroll.
const LookEditor = ({ look, onDone, onCancel }) => {
  const [draft, setDraft] = useState(look);
  const [tab, setTab] = useState('emoji');
  const shown = LOOK_TABS.find((entry) => entry.key === tab);
  const option = (emoji, label, content = emoji) => (
    <button
      key={emoji || 'none'}
      className={`djLook__option${emoji ? '' : ' djLook__option--none'}${
        draft[tab] === emoji ? ' djLook__option--on' : ''
      }`}
      aria-pressed={draft[tab] === emoji}
      aria-label={label}
      title={label}
      onClick={() => setDraft({ ...draft, [tab]: emoji })}
    >
      {content}
    </button>
  );

  return (
    <section className="djLook" aria-label="Your look">
      <div className="djLook__preview">
        <AvatarArt look={draft} className="djArt--fit" />
      </div>
      <div className="djLook__tabs" role="tablist">
        {LOOK_TABS.map((entry) => (
          <button
            key={entry.key}
            role="tab"
            aria-selected={entry.key === tab}
            className={`djLook__tab${
              entry.key === tab ? ' djLook__tab--on' : ''
            }`}
            onClick={() => setTab(entry.key)}
          >
            {entry.label}
          </button>
        ))}
      </div>
      <div
        className="djLook__grid djScroll"
        role="tabpanel"
        aria-label={shown.label}
      >
        {shown.optional && option(null, 'None', 'None')}
        {shown.options.map((entry) => option(entry.emoji, entry.name))}
      </div>
      <div className="djLook__actions">
        <button
          className="djButton"
          title="Random look"
          aria-label="Random look"
          onClick={() =>
            setDraft({
              emoji: pick(FACES),
              eyes: maybePick(EYES),
              hat: maybePick(HATS),
            })
          }
        >
          🎲
        </button>
        <button className="djButton" onClick={onCancel}>
          Cancel
        </button>
        <button
          className="djButton djButton--primary"
          onClick={() => onDone(draft)}
        >
          Done
        </button>
      </div>
    </section>
  );
};

// Your name and look on one card, your playlists on another below it (on
// desktop, and stacked the same way in the mobile pop-out, where the first
// card gets the title and minimize button). Only the playlist scrolls;
// while the look editor is open it takes the playlist's space instead.
const Panel = ({ me, room, playlists, outcomes, actions, onMinimize }) => {
  const [editing, setEditing] = useState(false);
  const self = me && (room.users.find((user) => user.id === me.id) || me);

  return (
    <div className="djSide">
      <aside
        className={`djCard djAccount${editing ? ' djAccount--editing' : ''}`}
        aria-label="You"
      >
        {onMinimize && <CardHead title="You" onMinimize={onMinimize} />}
        {self ? (
          <div className="djAccount__me">
            <button
              className={`djAccount__look${
                editing ? ' djAccount__look--on' : ''
              }`}
              onClick={() => setEditing(!editing)}
              disabled={!self.emoji}
              aria-expanded={editing}
              aria-label="Change your look"
              title="Change your look"
            >
              {self.emoji && <AvatarArt look={self} className="djArt--fit" />}
            </button>
            <NameField name={self.name} onCommit={actions.setName} />
          </div>
        ) : (
          <p className="djHint djAccount__me">Reconnecting&hellip;</p>
        )}
        {self && editing && (
          <LookEditor
            look={lookOf(self)}
            onCancel={() => setEditing(false)}
            onDone={(look) => {
              const before = lookOf(self);
              if (Object.keys(look).some((key) => look[key] !== before[key]))
                actions.setLook(look);
              setEditing(false);
            }}
          />
        )}
      </aside>

      {/* Hidden rather than unmounted, so a half-pasted link survives. */}
      <PlaylistCard
        playlists={playlists}
        outcomes={outcomes}
        addSong={actions.addSong}
        hidden={editing}
      />
    </div>
  );
};

const CHEER_COOLDOWN_MS = 3000;

// Beside the screen: Like (every 2 likes make the song one vote harder to
// skip), Cheer (just your emoji hopping for everyone) and the vote to skip,
// whose light red fill shows how close the room is. Likes and votes are
// server state; the DJ can't like or cheer their own song.
const BoothControls = ({ me, current, actions }) => {
  const [cheerCooling, setCheerCooling] = useState(false);

  useEffect(() => {
    if (!cheerCooling) return undefined;
    const timer = setTimeout(() => setCheerCooling(false), CHEER_COOLDOWN_MS);
    return () => clearTimeout(timer);
  }, [cheerCooling]);

  const skip = current && current.skip;
  const liked = !!(me && current && (current.likes || []).includes(me.id));
  const voted = !!(me && skip && skip.voters.includes(me.id));
  const amDJ = !!(me && current && current.djId === me.id);
  const progress = skip ? clamp(skip.votes / skip.needed, 0, 1) : 0;

  return (
    <div className="djBooth__controls">
      <div className="djBooth__row">
        <button
          className={`djReact${liked ? ' djReact--on' : ''}`}
          aria-pressed={liked}
          disabled={!me || !current || amDJ}
          onClick={() => actions.react('like', !liked)}
        >
          <span aria-hidden="true">👍</span>Like
        </button>
        <button
          className="djReact"
          disabled={!me || cheerCooling || amDJ}
          onClick={() => {
            setCheerCooling(true);
            actions.react('cheer');
          }}
        >
          <span aria-hidden="true">🎉</span>Cheer
        </button>
      </div>
      <button
        className={`djReact djReact--skip${voted ? ' djReact--voted' : ''}`}
        aria-pressed={voted}
        disabled={!me || !current || amDJ}
        title={amDJ ? 'Use Skip song in the panel instead' : undefined}
        onClick={() => actions.voteSkip(!voted)}
      >
        <span
          className="djReact__fill"
          aria-hidden="true"
          style={{ transform: `scaleX(${progress})` }}
        />
        <span className="djReact__label">Vote to skip</span>
      </button>
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
const MobileSheets = ({
  stageRef,
  playing,
  me,
  self,
  chat,
  chatNotice,
  panel,
}) => {
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
            aria-label="Open your name, look and song list"
          >
            {self ? (
              <AvatarArt look={self} className="djArt--fit" />
            ) : (
              <span aria-hidden="true">🎧</span>
            )}
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
    playlists,
    notice,
    chat,
    chatNotice,
    reactions,
    outcomes,
    actions,
  } = useDJRoom();
  const [{ mobile }] = useContext(Context);
  const stageRef = useRef(null);
  const { users, current } = room;
  const dj = current && users.find((user) => user.id === current.djId);
  const amDJ = !!(me && current && current.djId === me.id);
  const self = me && users.find((user) => user.id === me.id);
  usePlaylistKeys(playlists, entered);

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
          <NowPlayingTitle current={current} />
          <div className="djBooth">
            <div className="djBooth__side">
              {entered && (
                <DJQueue
                  me={me}
                  room={room}
                  list={playlists.active.tracks}
                  actions={actions}
                />
              )}
              <div className="djBooth__dj">
                {dj && (
                  <>
                    <span className="djBooth__djBody">
                      {/* Confetti flies up and left, away from the video. */}
                      <ReactiveAvatar
                        look={dj}
                        reaction={reactions[dj.id]}
                        className="djBooth__djEmoji"
                        burst={{ fromAngle: 95, toAngle: 175 }}
                      />
                    </span>
                    <span className="djBooth__djName">🎧 {dj.name}</span>
                  </>
                )}
              </div>
            </div>
            <DJScreen
              current={current}
              joined={entered}
              onDuration={actions.reportDuration}
              onEnded={actions.reportEnded}
              onError={actions.reportError}
            />
            <BoothControls me={me} current={current} actions={actions} />
          </div>
          <DJFloor
            users={users.filter((user) => !current || user.id !== current.djId)}
            meId={me && me.id}
            reactions={reactions}
            likes={(current && current.likes) || []}
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
            playlists={playlists}
            outcomes={outcomes}
            actions={actions}
          />
        )}
      </div>
      {entered && mobile && (
        <MobileSheets
          stageRef={stageRef}
          playing={!!current}
          me={me}
          self={self}
          chat={chat}
          chatNotice={chatNotice}
          panel={{ me, room, playlists, outcomes, actions }}
        />
      )}
      <Toast notice={notice} />
    </div>
  );
};
