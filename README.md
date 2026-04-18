# AnswerPulse

> Free AEO (Answer Engine Optimization) Scanner — scan any URL and get an instant AEO score across 8 key dimensions.

## Features

- ⚡ Instant AEO score across 8 dimensions
- 📊 Structured data detection
- ❓ Q&A format analysis
- ✍️ Readability scoring
- 🔒 Private & secure

## Quick Start

```bash
npm install
cp .env.example .env.local
# Edit .env.local with your Supabase credentials and PayPal link
npm run dev
```

## Environment Setup

See [`.env.example`](./.env.example) for all required variables.

**Key variable**: `NEXT_PUBLIC_PAYPAL_PAYMENT_LINK` — your PayPal payment button URL.
If not configured, the upgrade button shows a disabled "Coming Soon" state.

## Documentation

Full operational documentation is in the [`docs/`](./docs/) directory:

- 📋 **[PayPal 手动收费版 — 完整操作手册](./docs/paypal-manual-flow.md)** — how to configure PayPal, collect payment, and manually activate Pro in Supabase
- 📁 [Docs Index](./docs/README.md)

## Tech Stack

- **Framework**: Next.js 14 (App Router + Pages API)
- **Database**: Supabase (PostgreSQL)
- **Payments**: PayPal Payment Links (manual activation)
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

## License

Private project.
