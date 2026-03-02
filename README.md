# BookJourney

**Live reading sessions for book clubs.**
Queue-based turns, real-time sync, no page refresh needed.

🌐 **[bookreading.space](https://bookreading.space)**

---

## What is it?

BookJourney lets reading groups hold structured, live sessions together. Anyone can join a session, get in the queue, and take their turn reading aloud — all synced in real time across every participant's screen.

---

## Features

- **Live session rooms** — real-time updates via Convex (no polling, no refresh)
- **Queue system** — join, skip, advance turns; host can manage the queue
- **Guest join** — no account needed; join any session with just a name
- **Discord login** — create sessions with a Discord account
- **Private sessions** — hide sessions from the public listing
- **Word collection** — save interesting words/terms during a session; visible to the whole group
- **Book import** — paste a Goodreads, OpenLibrary, or Google Books link to auto-fill book info
- **Push notifications** — get notified when it's your turn, even in a background tab
- **Public session listing** — browse live sessions on the home page in real time
- **Host passcode** — optional passcode to protect host controls

---

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 15 (App Router) + React 19 |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 + shadcn/ui |
| Backend / DB | [Convex](https://convex.dev) |
| Auth | Convex Auth (Discord OAuth + Anonymous) |
| Push Notifications | Web Push API + `web-push` |
| Analytics | Vercel Analytics |
| Deployment | Vercel |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Convex](https://dashboard.convex.dev) account
- A Discord OAuth application (for login)

### Setup

```bash
# 1. Clone and install
git clone https://github.com/quetrea/book-journey.git
cd book-journey
npm install

# 2. Start Convex dev server (first run will prompt you to log in)
npx convex dev

# 3. Configure environment variables
# Fill in .env.local (see below)

# 4. Start Next.js
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

**.env.local**
```env
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
```

**Convex environment (`npx convex env set KEY value`)**
```env
AUTH_DISCORD_CLIENT_ID=...
AUTH_DISCORD_CLIENT_SECRET=...
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:you@example.com
```

Generate VAPID keys:
```bash
npx web-push generate-vapid-keys
```

Discord OAuth redirect URI to add in the Discord Developer Portal:
```
https://<your-convex-site-domain>/api/auth/callback/discord
```

---

## Project Structure

```
src/
  app/                        # Next.js App Router pages
  features/
    sessions/ui/              # Session room, dashboard, create modals
    queue/ui/                 # Queue list, status bar, action buttons
  components/
    ui/                       # shadcn/ui components
    background/               # Animated background system
    landing/                  # Home page sections
convex/
  schema.ts                   # Database schema
  sessions.ts                 # Session lifecycle mutations/queries
  queue.ts                    # Queue mutations
  sessionWords.ts             # Word collection
  bookImport.ts               # Book info import (Node.js action)
  pushNotificationsAction.ts  # Web push sender (Node.js action)
  pushSubscriptions.ts        # Push subscription storage
  auth.ts                     # Auth config (Discord + Anonymous)
public/
  sw.js                       # Service Worker for push notifications
```

---

## License

MIT
