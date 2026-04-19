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

**Key variables**:
- `NEXT_PUBLIC_PAYPAL_CLIENT_ID` + `PAYPAL_CLIENT_SECRET` — for dynamic checkout (auto-upgrade)
- `NEXT_PUBLIC_PAYPAL_API_URL` — set to `https://api-m.sandbox.paypal.com` for sandbox testing
- `NEXT_PUBLIC_PAYPAL_PAYMENT_LINK` — fallback PayPal link (manual activation)

### Vercel Deployment

After setting up `.env.local` locally, also add these variables in the **Vercel Dashboard** → Project → Settings → Environment Variables:

| Variable | Environment | Where to get |
|---|---|---|
| `NEXT_PUBLIC_PAYPAL_CLIENT_ID` | Production | [PayPal Developer → Apps](https://developer.paypal.com/dashboard/applications/live) |
| `PAYPAL_CLIENT_SECRET` | Production | Same as above (keep secret!) |
| `NEXT_PUBLIC_PAYPAL_API_URL` | Production | Omit for live; set to `https://api-m.sandbox.paypal.com` for sandbox testing |
| `NEXT_PUBLIC_PAYPAL_PAYMENT_LINK` | Production | [PayPal Payment Links](https://www.paypal.com/buttons/smart) |

> ⚠️ `PAYPAL_CLIENT_SECRET` 是敏感凭据，**只配置在 Vercel 环境变量中**，不要提交到代码仓库。

## Documentation

Full operational documentation is in the [`docs/`](./docs/) directory:

- 📋 **[PayPal 动态下单版 — 自动升级](./docs/paypal-dynamic-checkout.md)** — dynamic checkout with instant Pro activation
- 📋 **[PayPal 手动收费版 — 操作手册](./docs/paypal-manual-flow.md)** — fallback manual activation flow
- 📁 [Docs Index](./docs/README.md)

## Tech Stack

- **Framework**: Next.js 14 (App Router + Pages API)
- **Database**: Supabase (PostgreSQL)
- **Payments**: PayPal JS SDK + REST API (auto-upgrade) / PayPal Payment Links (fallback)
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

## License

Private project.
