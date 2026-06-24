# Shadow Garden Bot

A powerful Telegram bot persona based on *The Eminence in Shadow*, with Piyush/Shadow as the sole Master, Gemini AI, 115+ features, group chat support, memory, and a dark dashboard.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server + bot (port 5000)
- `pnpm --filter @workspace/shadow-garden-bot run dev` — run the dashboard frontend
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL`, `TELEGRAM_BOT_TOKEN`, `GEMINI_API_KEY`, `ELEVENLABS_API_KEY`, `MASTER_TELEGRAM_ID`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Bot: node-telegram-bot-api (polling mode)
- AI: Google Gemini 1.5 Flash
- Image Gen: Pollinations.AI (free, no key needed)
- Voice: ElevenLabs API
- PDF: pdf-lib
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Frontend: React + Vite + shadcn/ui

## Where things live

- Bot engine: `artifacts/api-server/src/lib/bot.ts`
- Shadow persona/dialogues: `artifacts/api-server/src/lib/shadow-persona.ts`
- AI (Gemini): `artifacts/api-server/src/lib/ai.ts`
- All features (115+): `artifacts/api-server/src/lib/features.ts`
- DB schema: `lib/db/src/schema/bot.ts`
- API routes: `artifacts/api-server/src/routes/bot.ts`
- OpenAPI spec: `lib/api-spec/openapi.yaml`
- Dashboard frontend: `artifacts/shadow-garden-bot/src/`

## Architecture decisions

- Bot runs in polling mode (not webhook) — works out of the box on Railway without public URL setup
- Gemini 1.5 Flash used for AI (free tier, generous limits)
- Pollinations.AI for image generation (completely free, no API key)
- Per-chat+user memory stored in PostgreSQL (last 50 messages kept)
- Group chat: bot only responds when mentioned or triggered by keywords
- Master ID hardcoded from env — only Piyush (7898178629) is Master Shadow

## Product

- Telegram bot with 115+ features: AI chat, image gen, voice TTS, PDF tools, games, reminders, group triggers
- Only Master Shadow (Piyush) can add/remove authorized users
- Shadow Garden persona from TEIS anime — speaks with cryptic dramatic flair
- Remembers conversations per user per chat
- Group chat triggers (atomic, seven shades, gm/gn, etc.)
- Reminder system for both DMs and group chats (30s polling)
- Web dashboard to monitor bot status, users, and activity

## User preferences

- Deploy to Railway
- Free APIs preferred (Gemini Flash, Pollinations.AI)
- Master Telegram ID: 7898178629 (Piyush / Shadow)
- Bot username: @LostInShadowsBot

## Gotchas

- After any schema change: run `pnpm --filter @workspace/db run push`
- After OpenAPI spec change: run `pnpm --filter @workspace/api-spec run codegen`
- Bot runs inside the api-server process — both start together
- GC_TRIGGERS must be imported from features.ts, not shadow-persona.ts
- The bot is in polling mode — no webhook needed for Railway

## Railway Deployment

Environment variables needed on Railway:
- `DATABASE_URL` — Postgres connection string (Railway provides this)
- `TELEGRAM_BOT_TOKEN` — from @BotFather
- `GEMINI_API_KEY` — from Google AI Studio
- `ELEVENLABS_API_KEY` — from ElevenLabs
- `MASTER_TELEGRAM_ID` — 7898178629
- `PORT` — Railway sets this automatically
- `NODE_ENV` — set to `production`

Start command: `pnpm --filter @workspace/api-server run start`
Build command: `pnpm install && pnpm --filter @workspace/api-server run build`

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
