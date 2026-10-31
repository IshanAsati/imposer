# IMPOSER — A Wake for Liars

A real-time, word-based social deduction game for 3–12 players. The crew share a
secret memory; one to three imposters receive only its category. Everyone gives
a one-word clue, argues, votes, and — if an imposter is caught — watches them
gamble the round on a final guess.

Built as a mobile-first, horror-themed Next.js app. Rooms are joined with a
six-character code and state is synchronized over WebSockets with an HTTP
fallback.

## Stack

- Next.js 16.4.3 (App Router, React 19, TypeScript)
- Tailwind CSS 4
- TanStack Query for room state
- Vercel Blob for shared room storage (Upstash Redis optional)
- Vercel WebSockets via `@vercel/functions`
- Vitest for the game engine and view-filtering tests

## Quick start

Requires Node.js 20.9 or newer.

```bash
npm install
cp .env.example .env.local   # PowerShell: Copy-Item .env.example .env.local
npm run dev
```

Open <http://localhost:3000>.

`npm run dev` uses an in-memory room store when no Blob or Redis credentials are
present, so the UI and HTTP actions work on one machine. Next's development
server does not support the Vercel WebSocket upgrade, so live pushes are
unavailable there; the client falls back to HTTP polling and state updates
arrive roughly every five seconds.

### Full realtime locally

The quickest option needs no login and no database:

```bash
npm run dev:realtime
```

This runs Vercel's local function runtime, so `/api/ws` upgrades work and all
players get instant pushes. It uses the in-memory room store: rooms vanish when
the process stops, and everything must stay on one server process. That is fine
for testing the full game loop.

To test multiple players on one computer, use separate browser profiles or
different browsers. Tabs in the same profile share `localStorage`, so they share
one seat. Phones on the same Wi-Fi can use the printed network URL.

For a durable setup that matches production, link a Vercel project with a Blob
store attached:

```bash
npm install -g vercel
vercel login
vercel link
vercel env pull .env.local
npm run dev:vercel
```

You can also point local development at Upstash Redis instead of Blob by setting
the `UPSTASH_REDIS_REST_*` values in `.env.local`.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `BLOB_READ_WRITE_TOKEN` | Production | Blob read/write token, injected by a connected Vercel Blob store |
| `BLOB_STORE_ID` | No | Blob store ID, also injected by the integration |
| `UPSTASH_REDIS_REST_URL` | No | Optional Upstash REST endpoint; takes priority over Blob |
| `UPSTASH_REDIS_REST_TOKEN` | No | Optional Upstash REST token |
| `KV_REST_API_URL` | No | Alias used when the Upstash pair is absent |
| `KV_REST_API_TOKEN` | No | Alias used when the Upstash pair is absent |
| `NEXT_PUBLIC_SITE_URL` | No | Canonical URL for metadata and OG images |

The default production setup is a private [Vercel Blob](https://vercel.com/docs/storage/vercel-blob)
store. Create one from the project's Storage tab, connect it to the project, and
Vercel injects the token automatically. No separate database account is needed.
Upstash Redis is supported as an optional alternative for higher write volume.

Production refuses to start game requests without either Blob or Redis
credentials rather than silently losing state between serverless instances.
`.env.local` is ignored by git; `.env.example` is committed.

## Deploy to Vercel

```bash
vercel
vercel --prod
```

1. Import the project into Vercel, or link it with the CLI.
2. Create a private Blob store and connect it to the project (Storage → Blob).
3. Optionally set `NEXT_PUBLIC_SITE_URL` to the production URL.
4. Deploy. The `/api/ws` route is a normal function with `maxDuration = 300`.

Vercel's WebSocket connections are capped at 300 seconds. The client treats a
closed socket as normal, reconnects with backoff, and keeps polling while the
socket is down, so a long wake survives the reconnect.

## How the game works

1. **Lobby** — the host tunes imposters (1–3, scaled to the table), rounds
   (3–10), memory pack, phase timers, and whether a final guess is enabled.
2. **Reveal** — roles and speaking order are randomized. Crew see the memory;
   imposters see only the category.
3. **Clues** — each guest gives one word, in order. The clue may not contain the
   memory or category.
4. **Discussion** — the table talks, then the host calls the vote (or the timer
   does).
5. **Voting** — guests vote for a suspect or skip. A tie or skip tie triggers a
   runoff. A second tie, or a tied skip, ends the round with no elimination and
   an imposter win.
6. **Final guess** — a caught imposter picks one of four memories. Every
   imposter shares the outcome.
7. **Result** — points are awarded and the next round begins.
8. **Final** — the side with more round wins takes the wake. A tie favors the
   imposters.

### Scoring

| Round result | Crew | Imposters |
| --- | --- | --- |
| Imposters survive (crew accused or stalemate) | 0 | +3 each |
| Imposter caught, final guess wrong | +3 each | 0 |
| Imposter caught, final guess right | +1 each | +2 each |

## Architecture

### HTTP for actions, WebSocket for pushes

Every mutation is an authenticated HTTP request:

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/rooms` | `POST` | Create a wake |
| `/api/rooms/[code]/join` | `POST` | Take a seat |
| `/api/rooms/[code]/state` | `GET` | Fetch a personalized room view |
| `/api/rooms/[code]/actions` | `POST` | Submit a game action |
| `/api/rooms/[code]/chat` | `POST` | Send a table whisper |
| `/api/ws?code=…&token=…` | `GET` | Upgrade to a push-only socket |

HTTP responses include the caller's personalized `RoomView`, which the client
writes straight into the query cache. The socket never accepts game actions; it
only pushes fresh views when the room version or latest chat message changes.

The WebSocket function polls shared storage every three seconds, sends an idle
heartbeat at least every fifteen seconds, and closes with code `4001` when the
room or session disappears. Clients also poll: every five seconds while the
socket is not live, every twenty seconds while it is, and never once the wake
has reached its final screen.

### Storage and concurrency

Vercel Blob (or Redis, or the in-memory development store) holds:

- serialized room state, including the secret memory and roles;
- hashed session tokens per player;
- presence timestamps;
- the last 100 chat messages;
- rate-limit counters;
- per-room locks.

Actions run under a per-room lock so simultaneous votes cannot clobber each
other. Redis uses `SET NX PX` with a Lua compare-and-delete release. Blob uses a
create-only lock blob with an expiry and conditional delete, plus ETag-guarded
writes and retries. Rooms expire after six hours; Blob objects are cleaned up
best-effort, while Redis chat, presence, and rate-limit keys expire on their own
schedules. A background `advanceRoom` call applies expired phase timers before
each action and state read.

### Secrets stay on the server

`src/lib/game/words.ts` is the only module containing the memory packs. Client
components import `pack-meta.ts` (names and descriptions) and `constants.ts`
(limits and timings), never the word lists or the full engine. `view.ts` removes
the memory from imposter views and only reveals roles, tallies, votes, guesses,
and points after a round has ended. Tests in `src/lib/game/view.test.ts` pin
these boundaries down.

Session tokens live in `localStorage` and are sent as a Bearer token for HTTP or
a query parameter for the socket. Only token hashes are stored server-side.
Invalid or expired sessions are cleared and the player is asked to rejoin.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Next development server (HTTP/polling only) |
| `npm run dev:realtime` | No-login local Vercel runtime with WebSockets, in-memory rooms |
| `npm run dev:vercel` | Linked Vercel dev server with WebSockets and shared Blob/Redis |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run test` | Run Vitest once |
| `npm run test:watch` | Watch mode |

## Project layout

```text
src/
  app/                 Routes, metadata, API handlers, WebSocket route
  components/
    forms/             Create and join forms
    room/              Room shell, roster, chat, invite card, phase views
    ui/                Buttons, dialogs, toasts, shared primitives
  lib/
    client/            API wrapper, session storage, query cache, hooks
    game/              Types, constants, engine, views, words, tests
    server/            Auth, HTTP parsing, storage, room service
```

## Notes and limitations

- No voice chat in v1. The table talks over an external call or in person while
  the app tracks clues, votes, and timers.
- The in-memory store is for local development only; serverless instances do not
  share it.
- Blob objects do not auto-expire. Expired rooms are rejected on read and cleaned
  up best-effort; a scheduled cleanup job could be added later.
- WebSocket connections on Vercel are capped at 300 seconds; the client
  reconnects automatically.
- Memory packs are curated for a horror/social-deduction tone, not gore.
- There is no spectator mode and no account system; a session is a seat.
