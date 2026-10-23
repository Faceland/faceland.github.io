import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { formatTime } from './format';
import { MAX_PLAYLISTS, MAX_PLAYLIST_NAME, MAX_TRACKS } from './playlistModel';

// Your songs that didn't play out last time (outlined in the list).
const OUTCOME_WARNINGS = {
  skipped: 'This song skipped last time it was played!',
  failed: 'This song failed to play last time!',
};

// How long the Undo button stays up after a removal.
const UNDO_SHOWN_MS = 5000;
// Within this of a scroller's top or bottom edge, a drag scrolls it.
const AUTO_SCROLL_EDGE = 40;

// Drag-to-reorder by each row's handle, with a mouse, finger or pen
// (pointer events: HTML drag and drop doesn't work on phones). The row
// follows the pointer and the rows it passes slide out of its way; letting
// go makes one move. Near the scroller's top or bottom it scrolls along.
const useSortable = (listRef, scrollRef, onMove) => {
  const [drag, setDrag] = useState(null); // { index, target, offset, size }
  const stopRef = useRef(null);
  useEffect(() => () => stopRef.current && stopRef.current(false), []);

  const begin = (event, index, trackId) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    event.preventDefault();
    const rows = [...listRef.current.children].filter(
      (row) => row.dataset.track,
    );
    const rects = rows.map((row) => row.getBoundingClientRect());
    const gap = rects.length > 1 ? rects[1].top - rects[0].bottom : 0;
    const scroller = scrollRef.current;
    const scrollTop = () => (scroller ? scroller.scrollTop : 0);
    const session = {
      startY: event.clientY,
      y: event.clientY,
      scroll0: scrollTop(),
      mids: rects.map((rect) => rect.top + rect.height / 2),
      size: rects[index].height + gap,
      target: index,
      frame: 0,
    };
    const update = () => {
      const offset = session.y - session.startY + scrollTop() - session.scroll0;
      const center = session.mids[index] + offset;
      let target = index;
      session.mids.forEach((mid, i) => {
        if (i < index && center < mid) target = Math.min(target, i);
        if (i > index && center > mid) target = Math.max(target, i);
      });
      session.target = target;
      setDrag({ index, target, offset, size: session.size });
    };
    const tick = () => {
      if (scroller) {
        const box = scroller.getBoundingClientRect();
        const above = box.top + AUTO_SCROLL_EDGE - session.y;
        const below = session.y - (box.bottom - AUTO_SCROLL_EDGE);
        const speed =
          above > 0
            ? -Math.ceil(above / 3)
            : below > 0
              ? Math.ceil(below / 3)
              : 0;
        if (speed) {
          scroller.scrollTop += speed;
          update();
        }
      }
      session.frame = requestAnimationFrame(tick);
    };
    const onPointerMove = (moveEvent) => {
      session.y = moveEvent.clientY;
      update();
    };
    const stop = (commit) => {
      cancelAnimationFrame(session.frame);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerCancel);
      stopRef.current = null;
      setDrag(null);
      if (commit && session.target !== index) {
        onMove(trackId, index, session.target);
      }
    };
    const onPointerUp = () => stop(true);
    const onPointerCancel = () => stop(false);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerCancel);
    stopRef.current = stop;
    session.frame = requestAnimationFrame(tick);
    update();
  };

  // Where each row is drawn mid-drag.
  const styleFor = (i) => {
    if (!drag) return undefined;
    const { index, target, offset, size } = drag;
    if (i === index) return { transform: `translateY(${offset}px)` };
    if (index < i && i <= target)
      return { transform: `translateY(${-size}px)` };
    if (target <= i && i < index) return { transform: `translateY(${size}px)` };
    return undefined;
  };

  return { dragging: drag ? drag.index : -1, begin, styleFor };
};

const GripIcon = () => (
  <svg viewBox="0 0 10 16" aria-hidden="true">
    {[3, 8, 13].map((y) => (
      <React.Fragment key={y}>
        <circle cx="2.5" cy={y} r="1.4" />
        <circle cx="7.5" cy={y} r="1.4" />
      </React.Fragment>
    ))}
  </svg>
);

// "Paste video link [Add]", always the list's last row.
const AddSongField = ({ onAdd, label }) => {
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState(null);
  const mountedRef = useRef(true);
  useEffect(
    () => () => {
      mountedRef.current = false;
    },
    [],
  );

  const submit = async (event) => {
    event.preventDefault();
    const text = url.trim();
    if (!text || busy) return;
    setBusy(true);
    setProblem(null);
    const why = await onAdd(text);
    if (!mountedRef.current) return;
    setBusy(false);
    if (why) setProblem(why);
    else setUrl('');
  };

  return (
    <>
      <form className="djAddTrack" onSubmit={submit}>
        <input
          className="djInput"
          placeholder="Paste video link"
          aria-label="YouTube video link"
          value={url}
          onChange={(event) => {
            setUrl(event.target.value);
            setProblem(null);
          }}
        />
        <button type="submit" className="djButton" disabled={busy}>
          {busy ? '…' : label}
        </button>
      </form>
      {problem && (
        <p className="djError" role="alert">
          {problem}
        </p>
      )}
    </>
  );
};

// A playlist's songs: drag a row's handle (or focus it and use the arrow
// keys) to move it, ✕ to remove it; the editor also has a "to the top"
// button. `children` is the last row (the add field).
const TrackList = ({
  playlist,
  outcomes,
  actions,
  scrollRef,
  withTop,
  children,
}) => {
  const listRef = useRef(null);
  const [refocus, setRefocus] = useState(null);
  const move = (trackId, from, to) =>
    actions.moveTrack(playlist.id, trackId, from, to);
  const { dragging, begin, styleFor } = useSortable(listRef, scrollRef, move);

  // Moving a row re-orders the DOM, which can drop focus from its handle.
  useEffect(() => {
    if (!refocus) return;
    const handle = listRef.current.querySelector(
      `[data-track="${refocus}"] .djTracks__grip`,
    );
    if (handle) handle.focus();
    setRefocus(null);
  }, [refocus]);

  const { tracks } = playlist;
  return (
    <ol
      ref={listRef}
      className={`djTracks${dragging >= 0 ? ' djTracks--sorting' : ''}`}
    >
      {tracks.map((track, index) => {
        const outcome = outcomes[track.videoId];
        const warning = OUTCOME_WARNINGS[outcome];
        const classes = [
          outcome && `djTracks--${outcome}`,
          index === dragging && 'djTracks--dragging',
        ].filter(Boolean);
        return (
          <li
            key={track.id}
            data-track={track.id}
            className={classes.join(' ') || undefined}
            style={styleFor(index)}
            title={warning}
          >
            <button
              className="djTracks__grip"
              aria-label={`Move ${track.title} (arrow keys)`}
              title="Drag to reorder"
              onPointerDown={(event) => begin(event, index, track.id)}
              onKeyDown={(event) => {
                const to =
                  event.key === 'ArrowUp'
                    ? index - 1
                    : event.key === 'ArrowDown'
                      ? index + 1
                      : -1;
                if (to < 0 || to >= tracks.length) return;
                event.preventDefault();
                move(track.id, index, to);
                setRefocus(track.id);
              }}
            >
              <GripIcon />
            </button>
            <span className="djTracks__num">{index + 1}</span>
            <span
              className="djTracks__title"
              title={warning ? `${track.title}\n${warning}` : track.title}
            >
              {track.title}
            </span>
            {track.duration ? (
              <span className="djTracks__time">
                {formatTime(track.duration)}
              </span>
            ) : null}
            {withTop && (
              <button
                className="djIconButton"
                title="Move to the top"
                aria-label={`Move ${track.title} to the top`}
                disabled={index === 0}
                onClick={() => move(track.id, index, 0)}
              >
                ⤒
              </button>
            )}
            <button
              className="djIconButton"
              title="Remove"
              aria-label={`Remove ${track.title}`}
              onClick={() => actions.removeTrack(playlist.id, track.id)}
            >
              ✕
            </button>
          </li>
        );
      })}
      <li className="djTracks__add">{children}</li>
    </ol>
  );
};

// A blue Undo button, for a few seconds after a song is removed from this
// playlist (Ctrl+Z does the same). Placed after the list in its scroller,
// it sits just under a short list and floats at the bottom of a long one.
const UndoButton = ({ playlists, playlistId }) => {
  const { removed, undo } = playlists;
  const at = removed && removed.playlistId === playlistId ? removed.at : 0;
  const [shown, setShown] = useState(false);
  useEffect(() => {
    setShown(!!at);
    if (!at) return undefined;
    const timer = setTimeout(() => setShown(false), UNDO_SHOWN_MS);
    return () => clearTimeout(timer);
  }, [at]);
  return shown ? (
    <div className="djUndo">
      <button className="djUndo__button" onClick={undo}>
        Undo
      </button>
    </div>
  ) : null;
};

const NEW_PLAYLIST = 'new';

// Your Playlists: pick which one you DJ from, Edit them all in the editor,
// and quickly tidy the selected one right here.
export const PlaylistCard = ({ playlists, outcomes, addSong, hidden }) => {
  const scrollRef = useRef(null);
  const editButtonRef = useRef(null);
  const [editing, setEditing] = useState(null); // playlist id, while open
  const { all, active } = playlists;

  return (
    <aside
      className="djCard djPlaylist"
      aria-label="Your playlists"
      hidden={hidden}
    >
      <div className="djPlaylist__head">
        <h2>Your Playlists</h2>
        <div className="djPlaylist__pick">
          <select
            className="djSelect"
            aria-label="Playlist to DJ from"
            value={active.id}
            onChange={(event) => {
              if (event.target.value === NEW_PLAYLIST) {
                const id = playlists.create();
                if (!id) return;
                playlists.select(id);
                setEditing(id);
              } else {
                playlists.select(event.target.value);
              }
            }}
          >
            {all.map((playlist) => (
              <option key={playlist.id} value={playlist.id}>
                {playlist.name}
              </option>
            ))}
            {all.length < MAX_PLAYLISTS && (
              <option value={NEW_PLAYLIST}>+ New playlist</option>
            )}
          </select>
          <button
            ref={editButtonRef}
            className="djButton"
            onClick={() => setEditing(active.id)}
          >
            Edit
          </button>
        </div>
      </div>
      <div ref={scrollRef} className="djPlaylist__scroll djScroll">
        {!active.tracks.length && (
          <p className="djHint">
            Add a song to join the DJ queue. Your top song plays when it&apos;s
            your turn, then moves to the bottom.
          </p>
        )}
        <TrackList
          playlist={active}
          outcomes={outcomes}
          actions={playlists}
          scrollRef={scrollRef}
        >
          <AddSongField label="Add" onAdd={(url) => addSong(active.id, url)} />
        </TrackList>
        <UndoButton playlists={playlists} playlistId={active.id} />
      </div>
      {editing && (
        <PlaylistEditor
          playlists={playlists}
          outcomes={outcomes}
          addSong={addSong}
          startId={editing}
          onClose={() => {
            setEditing(null);
            if (editButtonRef.current) editButtonRef.current.focus();
          }}
        />
      )}
    </aside>
  );
};

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M6.4 5 12 10.6 17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6L6.4 19 5 17.6l5.6-5.6L5 6.4z" />
  </svg>
);

// Everything about your playlists: switch between them, make new ones (up
// to three), rename, delete, pick the one to DJ from, and edit songs
// (drag, move to the top, remove, add), with Undo / Redo. A dialog over
// the page, rendered at the end of <body> so no card clips it.
const PlaylistEditor = ({ playlists, outcomes, addSong, startId, onClose }) => {
  const [viewId, setViewId] = useState(startId);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const scrollRef = useRef(null);
  const dialogRef = useRef(null);
  const { all, activeId } = playlists;
  const playlist = playlists.find(viewId) || playlists.active;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    dialogRef.current.focus();
    const onKey = (event) => {
      if (event.key === 'Escape') onCloseRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const show = (id) => {
    setViewId(id);
    setConfirmDelete(false);
  };

  return createPortal(
    <div
      className="djModal"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="djCard djEditor"
        role="dialog"
        aria-modal="true"
        aria-labelledby="djEditorTitle"
        tabIndex={-1}
      >
        <div className="djEditor__head">
          <h2 id="djEditorTitle">Edit playlists</h2>
          <button
            className="djCard__minimize"
            onClick={onClose}
            aria-label="Close"
            title="Close"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="djEditor__tabs" role="tablist">
          {all.map((each) => (
            <button
              key={each.id}
              role="tab"
              aria-selected={each.id === playlist.id}
              className={`djEditor__tab${
                each.id === playlist.id ? ' djEditor__tab--on' : ''
              }`}
              onClick={() => show(each.id)}
            >
              {each.name}
            </button>
          ))}
          {all.length < MAX_PLAYLISTS && (
            <button
              className="djEditor__tab djEditor__tab--new"
              onClick={() => {
                const id = playlists.create();
                if (id) show(id);
              }}
            >
              + New playlist
            </button>
          )}
        </div>

        <div className="djEditor__meta">
          <label className="djEditor__name">
            <span>Name</span>
            <input
              className="djInput"
              value={playlist.name}
              maxLength={MAX_PLAYLIST_NAME}
              onChange={(event) =>
                playlists.rename(playlist.id, event.target.value)
              }
              onBlur={(event) =>
                playlists.rename(playlist.id, event.target.value, true)
              }
              onKeyDown={(event) =>
                event.key === 'Enter' && event.target.blur()
              }
            />
          </label>
          <div className="djEditor__row">
            <span className="djEditor__count">
              {playlist.tracks.length} / {MAX_TRACKS} songs
            </span>
            {playlist.id === activeId ? (
              <span className="djEditor__badge">DJing from this one</span>
            ) : (
              <button
                className="djButton djButton--small"
                onClick={() => playlists.select(playlist.id)}
              >
                DJ from this one
              </button>
            )}
            {all.length > 1 &&
              (confirmDelete ? (
                <span className="djEditor__confirm">
                  <button
                    className="djButton djButton--small djButton--danger"
                    onClick={() => {
                      playlists.remove(playlist.id);
                      show(all.find((each) => each.id !== playlist.id).id);
                    }}
                  >
                    Delete it
                  </button>
                  <button
                    className="djButton djButton--small"
                    onClick={() => setConfirmDelete(false)}
                  >
                    Keep
                  </button>
                </span>
              ) : (
                <button
                  className="djButton djButton--small djButton--quiet"
                  onClick={() => setConfirmDelete(true)}
                >
                  Delete playlist
                </button>
              ))}
          </div>
        </div>

        <div ref={scrollRef} className="djEditor__scroll djScroll">
          {!playlist.tracks.length && (
            <p className="djHint">No songs yet: paste a YouTube link below.</p>
          )}
          <TrackList
            playlist={playlist}
            outcomes={outcomes}
            actions={playlists}
            scrollRef={scrollRef}
            withTop
          >
            <AddSongField
              label="Add song"
              onAdd={(url) => addSong(playlist.id, url)}
            />
          </TrackList>
          <UndoButton playlists={playlists} playlistId={playlist.id} />
        </div>

        <div className="djEditor__foot">
          <button
            className="djButton djButton--small"
            onClick={playlists.undo}
            disabled={!playlists.canUndo}
            title="Undo (Ctrl+Z)"
          >
            Undo
          </button>
          <button
            className="djButton djButton--small"
            onClick={playlists.redo}
            disabled={!playlists.canRedo}
            title="Redo (Ctrl+Y)"
          >
            Redo
          </button>
          <button className="djButton djButton--primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

// Ctrl+Z / Ctrl+Y (and Ctrl+Shift+Z; Cmd on a Mac) undo and redo playlist
// edits, except while typing in a field, where they edit the text.
export const usePlaylistKeys = (playlists, enabled) => {
  const { undo, redo } = playlists;
  useEffect(() => {
    if (!enabled) return undefined;
    const onKey = (event) => {
      if (!(event.ctrlKey || event.metaKey) || event.altKey) return;
      const key = event.key.toLowerCase();
      if (key !== 'z' && key !== 'y') return;
      const field = event.target.closest
        ? event.target.closest('input, textarea, select, [contenteditable]')
        : null;
      if (field) return;
      event.preventDefault();
      if (key === 'y' || event.shiftKey) redo();
      else undo();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enabled, undo, redo]);
};
