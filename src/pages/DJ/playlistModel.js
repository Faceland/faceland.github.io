import { useCallback, useEffect, useMemo, useReducer } from 'react';

// Your playlists: up to three named lists of songs. For now they live only
// in this browser; the room only ever gets the selected one (it's what you
// play from on your turn). Everything here is plain data with random ids,
// so when accounts arrive the lists can move to the account (and merge
// across devices) as they are: loadPlaylists and savePlaylists are the only
// parts that know where they're kept.

export const MAX_PLAYLISTS = 3;
// dj-server's MAX_LIST.
export const MAX_TRACKS = 100;
export const MAX_PLAYLIST_NAME = 30;
export const DEFAULT_NAME = 'My List';

// Undoable steps kept (adds, removals and moves; Ctrl+Z / Ctrl+Y).
const HISTORY_KEPT = 30;
const STORAGE_KEY = 'faceland.dj.playlists';
// Before playlists, your one list was saved with your name and look.
const OLD_STORAGE_KEY = 'faceland.dj';

// Strings only: a regex test of undefined tests the string "undefined".
const isVideoId = (id) => typeof id === 'string' && /^[\w-]{11}$/.test(id);
const isId = (id) => typeof id === 'string' && /^[\w-]{1,32}$/.test(id);

export const newId = () => {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

// What an unnamed playlist is called: My List, then Playlist 2, 3...
const defaultName = (playlists) => {
  if (!playlists.length) return DEFAULT_NAME;
  const taken = new Set(playlists.map((p) => p.name));
  let n = playlists.length + 1;
  while (taken.has(`Playlist ${n}`)) n++;
  return `Playlist ${n}`;
};

export const cleanName = (name) =>
  typeof name === 'string'
    ? name.replace(/\s+/g, ' ').trim().slice(0, MAX_PLAYLIST_NAME)
    : '';

const cleanTracks = (tracks) => {
  const seen = new Set();
  const clean = [];
  (Array.isArray(tracks) ? tracks : []).forEach((track) => {
    if (!track || !isVideoId(track.videoId) || seen.has(track.videoId)) {
      return;
    }
    seen.add(track.videoId);
    clean.push({
      id: isId(track.id) ? track.id : newId(),
      videoId: track.videoId,
      title:
        typeof track.title === 'string' && track.title.trim()
          ? track.title.slice(0, 200)
          : track.videoId,
      duration: Number(track.duration) > 0 ? Math.round(track.duration) : null,
    });
  });
  return clean.slice(0, MAX_TRACKS);
};

const readJson = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch {
    return null;
  }
};

export function loadPlaylists() {
  const stored = readJson(STORAGE_KEY);
  const playlists = [];
  ((stored && stored.playlists) || []).forEach((playlist) => {
    if (!playlist || playlists.length >= MAX_PLAYLISTS) return;
    playlists.push({
      id: isId(playlist.id) ? playlist.id : newId(),
      name: cleanName(playlist.name) || defaultName(playlists),
      tracks: cleanTracks(playlist.tracks),
    });
  });
  if (!playlists.length) {
    const old = readJson(OLD_STORAGE_KEY);
    playlists.push({
      id: newId(),
      name: DEFAULT_NAME,
      tracks: cleanTracks(old && old.list),
    });
  }
  const activeId = playlists.some((p) => p.id === (stored && stored.activeId))
    ? stored.activeId
    : playlists[0].id;
  return { playlists, activeId };
}

export function savePlaylists({ playlists, activeId }) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 1, activeId, playlists }),
    );
    // Moved here from the old single list; drop that copy.
    const old = readJson(OLD_STORAGE_KEY);
    if (old && old.list) {
      delete old.list;
      localStorage.setItem(OLD_STORAGE_KEY, JSON.stringify(old));
    }
  } catch {
    // Private mode / blocked storage: they last until the tab closes.
  }
}

// --- Undoable steps ----------------------------------------------------------
//
// { type: 'add' | 'remove', playlistId, track, index }
// { type: 'move', playlistId, trackId, from, to }
// Applied by track id, so they still land sensibly after the list changed
// in other ways (a song rotating to the bottom after it played).

const inverse = (op) => {
  if (op.type === 'add') return { ...op, type: 'remove' };
  if (op.type === 'remove') return { ...op, type: 'add' };
  return { ...op, from: op.to, to: op.from };
};

const withTracks = (playlists, id, tracks) =>
  playlists.map((p) => (p.id === id ? { ...p, tracks } : p));

// The playlists after `op`, or null if it no longer applies.
function apply(playlists, op) {
  const playlist = playlists.find((p) => p.id === op.playlistId);
  if (!playlist) return null;
  const { tracks } = playlist;
  if (op.type === 'add') {
    if (
      tracks.length >= MAX_TRACKS ||
      tracks.some((t) => t.videoId === op.track.videoId)
    ) {
      return null;
    }
    const at = clamp(op.index, 0, tracks.length);
    return withTracks(playlists, playlist.id, [
      ...tracks.slice(0, at),
      op.track,
      ...tracks.slice(at),
    ]);
  }
  if (op.type === 'remove') {
    if (!tracks.some((t) => t.id === op.track.id)) return null;
    return withTracks(
      playlists,
      playlist.id,
      tracks.filter((t) => t.id !== op.track.id),
    );
  }
  const from = tracks.findIndex((t) => t.id === op.trackId);
  const to = clamp(op.to, 0, tracks.length - 1);
  if (from < 0 || from === to) return null;
  const next = tracks.slice();
  next.splice(to, 0, ...next.splice(from, 1));
  return withTracks(playlists, playlist.id, next);
}

// Steps back (undo) or forward (redo) through the history, skipping any
// step that no longer applies.
function travel(state, back) {
  const from = (back ? state.past : state.future).slice();
  const to = (back ? state.future : state.past).slice();
  while (from.length) {
    const op = from.pop();
    const playlists = apply(state.playlists, back ? inverse(op) : op);
    if (playlists) {
      to.push(op);
      return {
        ...state,
        playlists,
        past: back ? from : to,
        future: back ? to : from,
        // Redoing a removal offers its undo again.
        removed: !back && op.type === 'remove' ? removal(op) : null,
      };
    }
  }
  return {
    ...state,
    past: back ? [] : state.past,
    future: back ? state.future : [],
  };
}

const removal = (op) => ({ playlistId: op.playlistId, at: Date.now() });

function reducer(state, action) {
  switch (action.type) {
    case 'do': {
      const playlists = apply(state.playlists, action.op);
      if (!playlists) return state;
      return {
        ...state,
        playlists,
        past: [...state.past, action.op].slice(-HISTORY_KEPT),
        future: [],
        removed: action.op.type === 'remove' ? removal(action.op) : null,
      };
    }
    case 'undo':
      return travel(state, true);
    case 'redo':
      return travel(state, false);
    case 'select':
      return state.playlists.some((p) => p.id === action.id)
        ? { ...state, activeId: action.id }
        : state;
    case 'rename':
      return {
        ...state,
        playlists: state.playlists.map((p, i) => {
          if (p.id !== action.id) return p;
          // While typing, keep what's there (spaces and all); when done,
          // tidy it, and an emptied name goes back to a default.
          const name = action.done
            ? cleanName(action.name) || (i ? `Playlist ${i + 1}` : DEFAULT_NAME)
            : action.name.slice(0, MAX_PLAYLIST_NAME);
          return { ...p, name };
        }),
      };
    case 'create':
      if (state.playlists.length >= MAX_PLAYLISTS) return state;
      return {
        ...state,
        playlists: [
          ...state.playlists,
          { id: action.id, name: defaultName(state.playlists), tracks: [] },
        ],
      };
    case 'delete': {
      if (state.playlists.length <= 1) return state;
      const playlists = state.playlists.filter((p) => p.id !== action.id);
      const keep = (op) => op.playlistId !== action.id;
      return {
        ...state,
        playlists,
        activeId:
          state.activeId === action.id ? playlists[0].id : state.activeId,
        past: state.past.filter(keep),
        future: state.future.filter(keep),
        removed: null,
      };
    }
    case 'played': {
      // The room just started this song from your selected playlist: like
      // the server's copy, it moves to the bottom. Not an undoable step.
      const active = state.playlists.find((p) => p.id === state.activeId);
      const index = active.tracks.findIndex(
        (t) => t.videoId === action.videoId,
      );
      if (index < 0 || index === active.tracks.length - 1) return state;
      const tracks = active.tracks.slice();
      tracks.push(...tracks.splice(index, 1));
      return {
        ...state,
        playlists: withTracks(state.playlists, active.id, tracks),
      };
    }
    default:
      return state;
  }
}

const init = () => ({
  ...loadPlaylists(),
  past: [],
  future: [],
  removed: null,
});

export function usePlaylists() {
  const [state, dispatch] = useReducer(reducer, undefined, init);
  const { playlists, activeId, past, future, removed } = state;

  useEffect(() => {
    savePlaylists({ playlists, activeId });
  }, [playlists, activeId]);

  const find = useCallback(
    (id) => playlists.find((p) => p.id === id),
    [playlists],
  );
  const undo = useCallback(() => dispatch({ type: 'undo' }), []);
  const redo = useCallback(() => dispatch({ type: 'redo' }), []);
  const played = useCallback(
    (videoId) => dispatch({ type: 'played', videoId }),
    [],
  );

  return useMemo(
    () => ({
      all: playlists,
      active: playlists.find((p) => p.id === activeId) || playlists[0],
      activeId,
      canUndo: past.length > 0,
      canRedo: future.length > 0,
      // { playlistId, at } of the latest removal, while it's the latest step.
      removed,
      find,
      undo,
      redo,
      played,
      select: (id) => dispatch({ type: 'select', id }),
      rename: (id, name, done = false) =>
        dispatch({ type: 'rename', id, name, done }),
      // Returns the new playlist's id (or null if there are already three).
      create: () => {
        if (playlists.length >= MAX_PLAYLISTS) return null;
        const id = newId();
        dispatch({ type: 'create', id });
        return id;
      },
      remove: (id) => dispatch({ type: 'delete', id }),
      addTrack: (playlistId, track) => {
        const playlist = find(playlistId);
        if (!playlist) return;
        dispatch({
          type: 'do',
          op: {
            type: 'add',
            playlistId,
            track: { ...track, id: newId() },
            index: playlist.tracks.length,
          },
        });
      },
      removeTrack: (playlistId, trackId) => {
        const playlist = find(playlistId);
        const index = playlist
          ? playlist.tracks.findIndex((t) => t.id === trackId)
          : -1;
        if (index < 0) return;
        dispatch({
          type: 'do',
          op: {
            type: 'remove',
            playlistId,
            track: playlist.tracks[index],
            index,
          },
        });
      },
      moveTrack: (playlistId, trackId, from, to) =>
        dispatch({
          type: 'do',
          op: { type: 'move', playlistId, trackId, from, to },
        }),
    }),
    [
      playlists,
      activeId,
      past.length,
      future.length,
      removed,
      find,
      undo,
      redo,
      played,
    ],
  );
}
