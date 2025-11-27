# Label Studio

A full-stack app for custom fashion sketches:
- Users can signup/login, view your design gallery, and submit requests (event, colors, look, notes).
- You (admin) can view requests, upload hand sketches, and generate an AI-styled illustration from the sketch.

## Quickstart

Prerequisites:
- Node.js 18+
- macOS/Linux recommended

Install and run:
```bash
npm install
npm run dev
```

Open `http://localhost:3000`

## Features

- Auth: Email + password with secure cookie sessions
- Gallery: Lists images from the `designs/` folder (already present)
- Requests: Users submit requirements (event, colors, look, notes)
- Admin: Review requests, upload sketch images, and generate AI version
- AI: Mock colorization using Sharp, with a pluggable adapter for Gemini/Banana

## Project structure

- `app/`: Next.js App Router (pages and API endpoints)
- `src/lib/db.ts`: SQLite schema and connection
- `src/lib/session.ts`: Cookie-based JWT sessions
- `src/lib/uploads.ts`: Upload directories
- `src/lib/ai.ts`: Mock AI generation + Gemini adapter stub
- `uploads/`: Will be created automatically to store sketches and AI renders
- `data/app.db`: SQLite database file (auto-created)
- `designs/`: Your existing design images (served by API, not moved)

## Admin account

When you first sign up via the app, the account is created as a regular user. To make an admin:

1) Start the app once (`npm run dev`) so the database is created.
2) Stop the server, then run this Node one-liner to promote your email:
```bash
node -e "const Database=require('better-sqlite3');const db=new Database('data/app.db');db.prepare('UPDATE users SET is_admin = 1 WHERE email = ?').run(process.env.ADMIN_EMAIL||'admin@example.com');console.log('Admin promoted');"
```
Pass your email like:
```bash
ADMIN_EMAIL='you@example.com' node -e "const Database=require('better-sqlite3');const db=new Database('data/app.db');db.prepare('UPDATE users SET is_admin = 1 WHERE email = ?').run(process.env.ADMIN_EMAIL);console.log('Admin promoted');"
```

## Environment variables

Create a `.env.local` at project root to customize:
```
AUTH_SECRET=replace-with-a-long-random-string
```

Optional (for future Gemini/Banana integration):
```
GOOGLE_API_KEY=your-google-generative-ai-key
BANANA_API_KEY=your-banana-key
```

## AI generation

The app ships with a default mock AI transform using `sharp` that:
- Slightly enhances contrast/saturation
- Applies a subtle color tint (based on the color picker in Admin page)

This gives you a fast local preview. You can replace it with a real model:

- Gemini Nano / Google Generative AI:
  - Implement `generateWithGeminiAdapter()` in `src/lib/ai.ts` to call Google APIs.
  - Toggle usage in `app/api/ai/generate/route.ts` (currently calls the mock).
- Banana.dev:
  - Deploy a diffusion/SDXL model on Banana.
  - Call it from `generateWithGeminiAdapter()` with your endpoint and key.

Output renders are written to `uploads/ai/` and served via `/api/uploads?type=ai&name=...`.

## Notes

- Your `designs/` directory is read-only and stays where it is. Images are streamed via `/api/designs/image`.
- Uploads are stored locally under `uploads/`. Back them up as needed.
- SQLite database is at `data/app.db`.

## Scripts

```bash
npm run dev     # start development server
npm run build   # build production
npm start       # run production build
```
