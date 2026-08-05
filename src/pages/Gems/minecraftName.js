// Minecraft username rules + existence lookup.
//
// A fake name breaks fulfilment (the gems have nowhere to go), so the checkout
// verifies the account actually exists before letting the purchase through.
//
// Mojang's own API (api.mojang.com) sends NO Access-Control-Allow-Origin, so the
// browser cannot call it directly — verified. These two mirrors both send
// `ACAO: *` on the found AND not-found responses, which is the important part:
// without CORS on the failure path, "no such player" is indistinguishable from
// "network died". (crafthead.net was rejected for exactly that reason: it sends
// ACAO on 200 but not on 404.)

// Java Edition: 3–16 characters, letters/digits/underscore only.
export const MC_NAME_RE = /^[A-Za-z0-9_]{3,16}$/;
export const MC_NAME_PATTERN = '[A-Za-z0-9_]{3,16}';

const SERVICES = [
  {
    url: (name) => `https://playerdb.co/api/player/minecraft/${encodeURIComponent(name)}`,
    verdict: (res, body) => {
      if (res.ok && body && body.code === 'player.found') return true;
      if (res.status === 400 || (body && body.code === 'minecraft.invalid_username')) return false;
      return null;
    },
  },
  {
    url: (name) => `https://api.ashcon.app/mojang/v2/user/${encodeURIComponent(name)}`,
    verdict: (res, body) => {
      if (res.ok && body && body.uuid) return true;
      if (res.status === 400 || res.status === 404) return false;
      return null;
    },
  },
];

/**
 * @returns true (exists), false (definitively does not exist), or null when we
 * couldn't tell. Callers must treat null as "allow" — an unreachable third-party
 * API must never block a paying customer.
 */
export const lookupMinecraftName = async (name, signal) => {
  for (const service of SERVICES) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const res = await fetch(service.url(name), { signal, credentials: 'omit' });
      let body = null;
      try {
        // eslint-disable-next-line no-await-in-loop
        body = await res.json();
      } catch (e) {
        /* non-JSON response — fall through to the verdict on status alone */
      }
      const verdict = service.verdict(res, body);
      if (verdict !== null) return verdict;
    } catch (err) {
      if (err && err.name === 'AbortError') throw err; // caller cancelled
      /* service unreachable — try the next one */
    }
  }
  return null;
};
