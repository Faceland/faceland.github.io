import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
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

const Avatar = ({ user, self }) => {
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
        <span
          className="djAvatar__emoji"
          style={{ animationDelay: `-${hash(user.id) % 700}ms` }}
        >
          {user.emoji}
        </span>
      </div>
      <div className="djAvatar__name" style={{ fontSize: 10 + 4 * user.y }}>
        {user.name}
      </div>
    </div>
  );
};

const DJFloor = ({ users, meId, playing, canMove, onMove }) => {
  const floorRef = useRef(null);

  const handlePointerDown = (event) => {
    if (!canMove) return;
    const rect = floorRef.current.getBoundingClientRect();
    // Keep a margin so the emoji and its name label stay on screen.
    onMove(
      clamp((event.clientX - rect.left) / rect.width, 0.03, 0.97),
      clamp((event.clientY - rect.top) / rect.height, 0, 0.9),
    );
  };

  return (
    <div
      ref={floorRef}
      className={`djFloor${canMove ? ' djFloor--walkable' : ''}${
        playing ? ' djFloor--playing' : ''
      }`}
      onPointerDown={handlePointerDown}
    >
      <FloorGrid />
      {users.map((user) => (
        <Avatar key={user.id} user={user} self={user.id === meId} />
      ))}
    </div>
  );
};

const NowPlaying = ({ current, dj }) => {
  const [, tick] = useState(0);
  useEffect(() => {
    if (!current) return undefined;
    const interval = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(interval);
  }, [current]);

  if (!current) return <div className="djNowPlaying" />;
  const elapsed = (performance.now() - current.startPerf) / 1000;
  const progress = current.duration
    ? clamp(elapsed / current.duration, 0, 1)
    : 0;
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
        <div style={{ width: `${progress * 100}%` }} />
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

const DJChat = ({ messages, meId, notice, onSend }) => {
  const logRef = useRef(null);
  // Follow new messages only while the reader is at (or near) the bottom.
  const pinnedRef = useRef(true);
  const sentRef = useRef([]); // this tab's send times, for the rate limit
  const lastRef = useRef({ text: '', at: 0 });
  const [draft, setDraft] = useState('');
  const [problem, setProblem] = useState(null);

  useLayoutEffect(() => {
    const log = logRef.current;
    if (log && pinnedRef.current) log.scrollTop = log.scrollHeight;
  }, [messages]);

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
      <h2>Chat</h2>
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

const Panel = ({ me, room, list, adding, actions }) => {
  if (!me) {
    return (
      <aside className="djPanel djScroll">
        <p className="djHint">Reconnecting&hellip;</p>
      </aside>
    );
  }
  const byId = Object.fromEntries(room.users.map((user) => [user.id, user]));
  const self = byId[me.id] || me;

  return (
    <aside className="djPanel djScroll">
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
    </aside>
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
    actions,
  } = useDJRoom();
  const { users, current } = room;
  const dj = current && users.find((user) => user.id === current.djId);
  const amDJ = !!(me && current && current.djId === me.id);

  return (
    <div className="App DJPage">
      <SEO
        title="DJ Room"
        description="Take turns DJing YouTube music with the Faceland community."
        noindex
      />
      <HeaderBar fancy={false} />
      <div className={`djRoom${entered ? ' djRoom--entered' : ''}`}>
        {entered && (
          <DJChat
            messages={chat}
            meId={me && me.id}
            notice={chatNotice}
            onSend={actions.sendChat}
          />
        )}
        <section className="djStage" aria-label="DJ room">
          <div className="djBooth">
            <div className="djBooth__dj">
              {dj && (
                <>
                  <span className="djBooth__djEmoji">{dj.emoji}</span>
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
            />
            <div className="djBooth__spacer" />
          </div>
          <NowPlaying current={current} dj={dj} />
          <DJFloor
            users={users.filter((user) => !current || user.id !== current.djId)}
            meId={me && me.id}
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
        {entered && (
          <Panel
            me={me}
            room={room}
            list={list}
            adding={adding}
            actions={actions}
          />
        )}
      </div>
      <Toast notice={notice} />
    </div>
  );
};
