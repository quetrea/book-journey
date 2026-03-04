# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in BookJourney, please report it responsibly:

- **Email:** [privacy@bookjourney.live](mailto:privacy@bookjourney.live)
- **GitHub:** Open a [security advisory](https://github.com/quetrea/book-journey/security/advisories/new) (private)

We aim to acknowledge reports within 48 hours and resolve critical issues within 7 days.

## OAuth & Data Scope

- **Discord OAuth scope:** `identify` only — we never request `email`, `guilds`, or any other scope.
- **Redirect URI:** All OAuth callbacks go exclusively to `bookjourney.live/api/auth/callback/discord`.
- **No email collection:** We do not collect, store, or have access to your email address.
- **Guest access:** Users can join sessions without any account — just a display name.

## What We Store

| Data | Discord Users | Guest Users |
|------|--------------|-------------|
| Display name | Yes | Yes |
| Avatar URL | Yes | No |
| Discord user ID | Yes | No |
| Email | **No** | No |
| Password | **No** | No |
| IP address | **No** | No |
| Server memberships | **No** | No |

## Data Retention

- Session data is auto-deleted 7 days after a session ends.
- Hosts can manually delete sessions at any time.
- Account deletion requests are processed within 7 days.

## Infrastructure

- **Backend & database:** [Convex](https://convex.dev) (SOC 2 compliant)
- **Hosting:** Vercel
- **Source code:** Fully open source at [github.com/quetrea/book-journey](https://github.com/quetrea/book-journey)
