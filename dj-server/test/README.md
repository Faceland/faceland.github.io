# dj-server tests

Black-box tests for the room server. They start the real `server.js` and talk
to it over real WebSockets, so they pin down the protocol and the abuse limits
as a browser would see them. Nothing in `server.js` is imported, patched, or
changed to make them work.

```sh
cd dj-server
npm ci --ignore-scripts   # ws + obscenity, exactly as the lockfile pins them
npm test                  # node --test, no other dependencies
node --test test/votes.test.js            # one file
node --test --test-name-pattern=skip test/ # by name
```

Each test gets its own server process on a free port, so there is no shared
state between tests and a crash in one can't poison the next. A server that
dies mid-test fails that test with its stderr. The whole suite runs in about
15 seconds; the few tests that wait on real timers (song end, the skip lock,
the AFK sweep) are the slow ones.

## How it works

`helpers/harness.js`

- `scenario(name, [env], fn)` spawns the server with `env` on top of safe
  defaults (loopback, a test origin), hands `fn` a client factory, and tears
  everything down afterwards. `connect()` gives a spectator, `member()` a
  client that has sent `hello`.
- Clients land in the main room unless told otherwise: `connect({ path: '/r/alpha' })`
  or `member({ path: '/r/alpha' })` picks another (`rooms.test.js`).
- Clients speak protocol 2 unless told otherwise: `member({ v: 3, list: [ids…] })`
  for a page that owns its playlists (`setList` / `lookup` / `played`,
  `playlists.test.js`), `member({ v: null })` for a page from before compact
  moves. The default exercises the older list flow (`tracks.test.js`).
- Every client claims its own IP through `X-Real-IP`, which the server trusts
  from loopback exactly as it trusts nginx in production. That is what makes
  per-IP caps, vote maths, and the ended / can't-play consensus testable. Pass
  `ip` to put several clients on one address.
- `waitFor(type | predicate)`, `next(...)`, `state(predicate)` and
  `none(..., ms)` read the client's inbox. `state` returns the latest snapshot
  if it already satisfies the predicate, otherwise the next one that does.
  `waitFor` accepts `{ since: client.mark() }` to ignore older messages.
- `server.fetchCalls()` lists every URL the server asked YouTube for.
- `LIMITS` holds every server limit the tests depend on (caps, lengths,
  intervals, rates). Tests read from it; none carries its own number.
- `REFUSALS` maps each reason the server says no to a one-word regex, and
  `refused('reason', scope?)` turns that into a predicate. Tests never match
  a full sentence.
- `matches(actual, expected)` asserts a subset: extra fields in a message are
  ignored, arrays must match in length. Use it instead of `deepEqual` on
  anything the server sends, unless the exact contents and order are the
  claim (a song list after a bump, a batch of move triples).

`helpers/stubFetch.js` is preloaded into the server with `node --require`
and replaces global `fetch`. It answers like YouTube's oEmbed endpoint (no API
key) or the Data API (with one), keyed off the video ID: `ok…` is a normal
video, `gone…` doesn't exist, `noembed…` can't be embedded, `live…` is a live
stream, `slow…` takes 400 ms, `err…` fails at the network, `http5…` gets a
500, `ctrl…` has a title full of control characters, and `d090…` is 90
seconds long in API mode. `ids` in the harness builds them.

## What these tests are, and aren't, allowed to pin down

The suite exists so the server can be restructured without changing how the
room behaves. It pins **behavior**: who may do what, what everyone sees, and
what the abuse limits refuse. It deliberately does not pin:

- **Wording.** User-facing sentences are product and change freely. A
  refusal is recognized by one stable word (`REFUSALS`), or better, by its
  effect: the queue didn't change, the name snapped back. Never assert a
  full message string.
- **Message shape beyond what the test is about.** Use `matches`; a new
  field on `state.current` must not turn anything red.
- **Tuning numbers.** Caps, lengths, rates and intervals live in `LIMITS`.
  When one changes in `server.js`, update that one entry.

Rules themselves are pinned on purpose: two tabs on one IP get one vote, the
DJ can't move, a vote can't skip before the lock. Changing one of those is a
product decision, and the test that goes red is the place to record it.

## When a test goes red

1. Read the test name. It states the rule in plain words.
2. Decide which of these it is:
   - **The rule changed on purpose.** Update the expectation (usually one
     line) in the same change that altered the server. That's the normal
     path, not a failure.
   - **A limit or interval moved.** Update `LIMITS`.
   - **A message was reworded past its keyword.** Update that `REFUSALS`
     entry to the new stable word.
   - **None of the above.** It's a regression. The failure message carries
     the client's last few messages; start there.
3. Run just that file: `node --test test/<file>.test.js`.

## What to know when writing one

- **The room flushes at most every `BROADCAST_INTERVAL_MS`, and a dirty room
  sends a full snapshot instead of a `moves` message.** Joining dirties the
  room. Wait for the snapshot that shows everyone
  (`state((s) => s.users.length === n)`) before testing anything about `moves`.
- **Lookups are limited per second for the whole room.** Tests that add many
  songs in a row space them out (`LOOKUP_PACE_MS` in `tracks.test.js`).
- **Each attempt counts toward the chat limit, refused ones included.** Use
  a fresh member if a test needs more tries than `CHAT_BURST`.
- **Messages from two different clients have no order guarantee.** Sending
  from `a` then `b` without awaiting anything in between can be handled in
  either order; it did flip between Node versions. If the order matters,
  wait for the first message's effect before sending the second.
- **Spawn costs ~40 ms.** Don't worry about it; do worry about `sleep`s.
- Most booth tests run with `MIN_SKIP_SECONDS=0` so skips are immediate; the
  lock itself has dedicated tests at `1`.
- Fixture names are placeholders (Pat, Sam, Ada Lovelace). Keep real people
  out of test data.

## Not covered (and why)

- The 60 s timeout for a song whose length nobody could report, the 30 s
  ping heartbeat, and the 8 s grace on listener-reported lengths: not
  configurable, too slow for a unit run. Candidates for env knobs when the
  server is next touched.
- `X-Real-IP` being *ignored* for connections that don't come from loopback:
  needs a non-loopback bind, which prompts macOS's firewall. Covered by
  reading `clientIp()`.
- Anything about nginx, systemd, or the Unix socket path: that config lives
  on the box, not in the repo.
