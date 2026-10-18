# Suprima Read

A web app that turns long text into a clear reading brief, then presents it one word at a time at a fixed focal point.

## Run locally

Use Node.js 22.13 or later (Node.js 24 recommended).

```sh
cd suprima
npm ci
npm run dev
```

Open http://127.0.0.1:3000. The sample reading and original-text reader work without an AI connection.

For AI preparation, set `OPENAI_API_KEY` in `suprima/.env.local`. This file is ignored by Git. An approved local key has already been configured on the development machine; keys are never included in this repository. Optional settings are documented in `suprima/.env.example`.

## What it does

- Paste text or import UTF-8 `.txt` and `.md` files, up to 100,000 characters.
- Choose essentials, balanced context, or a more detailed brief.
- Rewrite for sequential reading: clear subjects, short connected sentences, less ambiguous wording, preserved qualifications.
- Review the brief and open its linked original passages.
- Read at 100–700 WPM with a fixed focal character.
- Enable extra pauses for punctuation, longer words, and section boundaries.
- Navigate by sentence, jump between sections, or enter focus view.
- Save up to 12 readings and their current positions in this browser.
- Download a brief as a text file.

A hand-prepared example is labeled as an example. User text is only sent for AI processing when **Prepare my reading** is clicked. **Read original** preserves the original wording and makes no AI request.

AI output is not guaranteed to preserve every nuance. Linked source sentence IDs are checked for validity; their semantic support is not independently verified. This app does not measure comprehension or promise that faster reading improves it.

## AI configuration

The server uses the [OpenAI Responses API](https://developers.openai.com/api/docs/guides/structured-outputs) with structured output, defaults to `gpt-4.1-mini`, and can use another compatible model via `OPENAI_MODEL`. It requests no response storage (`store: false`). Provider data policies still apply.

The editing prompt preserves negation, conditions, uncertainty, meaningful numbers, and causal limits. It targets roughly 20%, 45%, or 75% of the original word count depending on depth, with a maximum target of 7,000 words. These are approximate targets, not guaranteed compression ratios. Overlong or invalid output is rejected rather than displayed as a successful brief.

API keys remain server-side. Do not prefix them with `NEXT_PUBLIC_`. Rotate or replace expiring keys through your provider account.

If preparation reports exhausted credits, check [API billing](https://platform.openai.com/settings/organization/billing). For simple experiments, `OPENAI_MODEL=gpt-6-luna` is another configurable starter option; [it supports structured output](https://developers.openai.com/api/docs/models/gpt-6-luna). Changing models does not resolve an exhausted account balance.

## Build and verify

```sh
cd suprima
npm test
npm run build
npm run typecheck
npm start
```

Tests cover focus-character placement, punctuation timing, sentence navigation, section boundaries, and preservation of original words. GitHub Actions runs tests, a production build, and type checking without API credentials.

## Deploy on your own infrastructure

This is a standard Next.js app with standalone Node.js output. This GitHub repository is the source of truth. No managed Sites deployment or platform authentication is required.

Use `suprima` as the application root when connecting a hosting service. Set these environment variables on the server:

| Variable         | Purpose                                       |
| ---------------- | --------------------------------------------- |
| `OPENAI_API_KEY` | Server-side AI provider credential            |
| `OPENAI_MODEL`   | Optional compatible model override            |
| `APP_PASSWORD`   | Required for every paid AI generation request |

AI generation stays disabled until `APP_PASSWORD` is configured, including in local development. Choose a separate, strong password; do not use your API key as the password. The browser prompts for it on the first preparation and keeps it in memory until the tab is refreshed or closed. The server checks the password on every generation request before contacting the AI provider. Missing or incorrect passwords never reach the paid provider. The interface and original reader remain available without it. Use HTTPS for remote hosting.

For Vercel, add `OPENAI_API_KEY` and `APP_PASSWORD` as server environment variables, then redeploy. Local `.env.local` values are not uploaded from GitHub. Changing the server's `APP_PASSWORD` and redeploying invalidates the previous password. This password protects requests through this app; it does not change how the API key works outside the app.

The endpoint checks request origin and size, validates input and output, applies an 80-second timeout, and permits two simultaneous generations per server process. The concurrency limit is not a distributed quota or a substitute for host-level rate limiting. Before opening access broadly, add user authentication and durable usage limits appropriate to that deployment.

A Dockerfile is included:

```sh
docker build -t suprima-read ./suprima
docker run --rm -p 3000:3000 --env-file /path/to/private-production.env suprima-read
```

Keep the production env file outside the repository. The Docker build excludes local env files, so runtime secrets must be provided to the container.

## Project layout

- `suprima/app/api/prepare/route.ts` — AI generation and server safeguards.
- `suprima/components/workspace.tsx` — text preparation, source review, and browser library.
- `suprima/components/reader.tsx` — playback, focus view, and controls.
- `suprima/lib/reading.ts` — tokenization, pacing, and sentence navigation.
- `suprima/tests/` — reading behavior tests.

The library is local to the browser and is not synced to GitHub or another device. Clearing browser storage removes it. Downloads provide an independent copy.

Third-party dependencies retain their respective licenses.
