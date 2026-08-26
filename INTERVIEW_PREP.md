# InkHive — Interview Preparation Guide (Visteon)

Everything you need to explain this project tomorrow, in plain language, with deep-dive
follow-up material. Read Sections 1–3 to nail the first 10 minutes, then use the Q&A
sections to survive being "drilled".

---

## 1. THE 30-SECOND ELEVATOR PITCH

> "InkHive is an **AI-powered content marketing platform**. A marketer enters **one topic**
> (or pastes an existing article), and the system automatically generates a complete
> cross-channel campaign: a **1000+ word blog post**, **social media posts** for
> Twitter/X, LinkedIn, Facebook and Instagram, an **HTML email newsletter**, and **SEO
> metadata** — all in parallel, in about **25 seconds**. It then lets the user **edit
> everything in the browser** and **publish to real platforms with one click** (via OAuth).
>
> Technically: **Next.js 16** frontend, **Convex** as the real-time database + backend,
> **Inngest** as the durable background workflow engine, **Google Gemini** as the AI model,
> **Clerk** for authentication, and **Resend** for email. The interesting engineering is
> orchestrating 4 AI agents in a parallel, retryable, cancellable pipeline with real-time
> progress streaming to the UI, plus a secure multi-platform OAuth publishing layer."

Memorize that. It covers *what, why, how, and the hard parts*.

---

## 2. WHAT THE APP DOES (User Story)

Walk through the actual product flow, because interviewers love "walk me through your project":

1. **User signs in** with Clerk (Google/GitHub/email). JWT session issued.
2. **Create page** (`/create`): pick **Topic** or **Article** mode. Enter a topic (min 10 chars)
   or paste an article.
3. Click **Generate** → frontend calls `api.contentProjects.createProject` (a Convex mutation),
   which creates a `contentProjects` document with `status: "draft"` and returns a project ID.
4. Frontend then `POST /api/trigger-inngest`, which fires a `content/generate` event to Inngest.
5. **Inngest `contentPipeline`** function runs:
   - marks status `generating`
   - optionally runs a **research step** (Gemini with Google-Search grounding) to gather
     trending facts and sources (called "grounded" mode)
   - **Agent 1** generates the **blog post** (must finish first)
   - **Agents 2–4** (social posts, email, SEO) run **in parallel**, using the finished blog
     as context — this is what makes the output coherent across channels
   - each step writes results back to Convex and updates `jobStatus`
   - marks the project `completed`
6. The **dashboard UI subscribes** to the project via a Convex `useQuery` — a live subscription,
   **zero polling**. Progress bars and per-job badges update in real time as each agent finishes.
7. User can **edit** blog/social/email/SEO in the browser; edits go back through Convex mutations,
   and `isEdited` flags get set.
8. User can **publish**: connect social accounts via OAuth, then pick platforms and click Publish.
   `POST /api/trigger-publish` validates ownership + connection status server-side, fires
   `content/publish` to Inngest, and the `publishContent` function calls each platform's API
   **in parallel**, recording per-platform success/failure.
9. Optional: **cancel** anytime mid-generation to save AI tokens — Inngest's `cancelOn`
   mechanism aborts the run; completed content is preserved.

---

## 3. SYSTEM ARCHITECTURE (Draw This)

```
┌──────────────────────────────────────────────────────────────┐
│ FRONTEND — Next.js 16 (App Router) + React 19 + Tailwind v4   │
│   Landing · Create · Dashboard/[projectId] editor · /blog/    │
└───────────────┬──────────────────────────────────────────────┘
                │ Convex client (useQuery/useMutation, live subs)
┌───────────────▼──────────────────────────────────────────────┐
│ AUTH — Clerk (JWTs)  →  verified in Convex via auth.config     │
└───────────────┬──────────────────────────────────────────────┘
                │ fetchQuery/fetchMutation with Clerk token
┌───────────────▼──────────────────────────────────────────────┐
│ CONVEX — serverless real-time DB + functions                  │
│   tables: contentProjects, connectedAccounts                  │
│   queries/mutations: createProject, saveBlogPost, ...         │
└───────┬───────────────────────────────┬──────────────────────┘
        │ Inngest events                │ ConvexHttpClient (server-side)
┌───────▼───────────────────────────────▼──────────────────────┐
│ INNGEST — durable workflow engine                             │
│   contentPipeline (generate) → publishContent (publish)       │
└───────┬───────────────────────────────┬──────────────────────┘
        │ step.run()                    │ lib/publish/*
┌───────▼───────────────┐     ┌─────────▼───────────────────────┐
│ AI LAYER (Gemini /    │     │ PUBLISH LAYER                   │
│  OpenRouter fallback) │     │  Twitter/LinkedIn/FB/IG APIs    │
│  blog, social, email, │     │  + Resend (email)               │
│  seo, research        │     │  tokens AES-256-GCM at rest     │
└───────────────────────┘     └─────────────────────────────────┘
```

**Key point to emphasize:** three "backends" with clear separation —
Convex owns *state & real-time*, Inngest owns *durable orchestration*, Next.js API routes
are just thin *triggers* (they fire events and return quickly).

---

## 4. WHY THESE TECHNOLOGIES (Be ready for "why did you pick X?")

| Layer | Choice | Why (your answer) | Alternative & trade-off |
|---|---|---|---|
| Frontend | Next.js 16 + React 19 + TS | App Router, SSR for public blog, typed end-to-end | Vite/SPA (lose SSR/SEO) |
| Styling | Tailwind v4 + shadcn/ui | Fast iteration, design-system consistency | CSS modules / MUI |
| Database + backend | **Convex** | Real-time subscriptions built in, reactive UI without polling; transactions; serverless | Firebase (vendor lock), Postgres + WebSockets (more moving parts) |
| Background work | **Inngest** | Durable execution: steps retried automatically, parallelism, `cancelOn`, no self-managed queue | BullMQ/Redis (you run infra), plain serverless fns (no durable steps, timeouts) |
| AI | **Google Gemini 2.x Flash** | Fast, cheap, JSON-mode output, Google-Search grounding | OpenAI/Claude (available via OpenRouter fallback) |
| Auth | **Clerk** | Prebuilt UI + JWTs verified server-side in Convex | NextAuth/Auth.js (more DIY) |
| Email | **Resend** | Simple transactional API, HTML support | SendGrid/Postmark |

**Be ready to defend Convex:** it gives you reactive queries for free, which is exactly what a
progress-tracking dashboard needs. You never write polling. That was a deliberate choice to keep
the UX "live."

---

## 5. DEEP DIVE — THE DATABASE (Convex schema)

Two tables.

### 5.1 `contentProjects` — one row per generation task
Key fields:
- `userId` (Clerk subject), `inputType` (`"topic" | "article"`), `inputContent`
- `status`: `draft → generating → completed | failed | canceled`
- `jobStatus`: per-agent state map — `research`, `blogPost`, `socialPosts`, `emailNewsletter`,
  `seoMetadata`, each `pending/running/completed/failed/skipped/canceled`
- `generationMode`: `grounded` (with live research) vs `classic`
- `research`: `keyFindings[]`, `trendingAngles[]`, `sources[]`, error codes
- `error`: `{message, step, timestamp, details}` for pipeline-failure records
- Content payloads:
  - `blogPost { title, content(markdown), excerpt, readingTime, isEdited }`
  - `socialPosts { twitter, linkedin, facebook, instagram, medium → each {text, status, publishedAt?, error?}, isEdited }`
  - `emailNewsletter { subjectLines[5], previewText, htmlContent, plainText, selectedSubjectLine, status, isEdited }`
  - `seoMetadata { title, description, keywords[], slug, isEdited }`
- Publishing: `publishedTo[]`, `lastPublishedAt`
- Timestamps: `createdAt`, `updatedAt`, `completedAt`

**Indexes** (they matter — Convex requires explicit indexes for range/equality queries):
`by_user`, `by_status`, `by_user_and_status`, `by_public_slug`, `by_public_slug_and_status`,
`by_created_at`.

### 5.2 `connectedAccounts` — user's OAuth platform connections
- `platform` (twitter/linkedin/facebook/instagram), `status` (connected/expired/error/disconnected)
- `encryptedAccessToken` / `encryptedRefreshToken` — **AES-256-GCM encrypted** at rest
- `tokenExpiresAt`, `scopes`, `metadata` (e.g. Facebook pageId, IG business-account ID),
  `lastError`, timestamps

### Follow-up answers
- **Why encrypt tokens?** They're long-lived credentials; if the DB is ever compromised they must
  not be plaintext. Decryption only happens server-side inside the Inngest publisher, never in the
  browser.
- **Why `isEdited` flags?** Distinguish AI output from human-reviewed content — an audit trail.
- **Why store research sources separately?** UI can show "Realtime grounded" proof; users verify
  claims; supports the quota-failure fallback UX.

---

## 6. DEEP DIVE — CONVEX FUNCTIONS (contentProjects.ts)

**Security pattern — the most important thing to explain:**
- **User-facing** mutations (`createProject`, `updateBlogPost`, `cancelProject`, `deleteProject`,
  `updateSocialPost`, ...) call `getAuthUserId(ctx)` from `convex/auth.ts`, which reads the Clerk
  JWT via `ctx.auth.getUserIdentity()`. **The client never sends a userId that is trusted** —
  identity is derived server-side from the verified token.
- **Ownership checks**: every read/write verifies `project.userId === userId`, so users can't
  touch each other's projects.
- **Inngest-facing** functions (`saveBlogPost`, `updateProjectStatus`, `recordError`, ...)
  intentionally have **no auth check** because Inngest has no user session. They rely on the
  `projectId` being a cryptographically random Convex ID (unguessable) as their security boundary.
  This is a documented trade-off.
- Queries like `getProjectById` (no auth, used by Inngest) vs `getProject` (auth + ownership) are
  **separate functions** so the security boundary is explicit.

Other notable behavior:
- `getUserProjectsSummary` returns only lightweight projection fields for the dashboard grid
  (reduces bytes over the wire / subscription invalidation cost).
- `updateBlogPost` **recomputes reading time** from word count ÷ 200 WPM.
- `saveSeoMetadata` normalizes the slug server-side (lowercase, strip special chars, kebab-case)
  and also sets `publicSlug`.
- `cancelProject` preserves jobs already `completed`/`skipped` and marks the rest `canceled`.
- `getPublicPostBySlug` uses the `by_public_slug_and_status` index (publicSlug + completed) and
  returns **only public-safe fields** (title, content, excerpt, readingTime, SEO meta) — no userId,
  no tokens, no internal fields. This powers `/blog/[slug]` public pages.

---

## 7. DEEP DIVE — THE AI PIPELINE (Inngest `contentPipeline`)

This is the heart of the project. Know it conceptually line by line.

### The flow
```
event content/generate
  → step "update-status-generating"
  → [grounded mode] step "research-and-grounding"  (Gemini + Google Search)
  → step "generate-blog-post"          (Agent 1 — REQUIRED FIRST)
  → step.run ×3 IN PARALLEL:
        "generate-social-posts"        (Agent 2)
        "generate-email-newsletter"    (Agent 3)
        "generate-seo-metadata"        (Agent 4)
  → Promise.allSettled(...)
  → step "update-status-completed"
```

### Why blog first?
The 3 downstream agents receive the **full blog post as context** (`blogTitle`, `blogContent`,
`excerpt`, plus research). This makes social/email/SEO semantically grounded in the complete
article, not just the raw topic. It's a **dependency DAG**: blog is the root, everything else
depends on it.

### Durable execution (the key Inngest concept)
Every `step.run()` block is a **durable step**: Inngest can pause, retry, and resume the function,
and **replay** steps with cached results. That's why:
- retries are automatic (config `retries: 3`)
- if the process dies mid-way, the function resumes from the last completed step — you don't redo
  the whole thing
- parallelism works across steps within one function
- `optimizeParallelism: true` tells Inngest to schedule parallel branches aggressively

### Structured output (prompt engineering)
- Each agent returns **JSON** (prompt instructs it; Gemini configured with
  `responseMimeType: "application/json"`).
- Response is parsed and validated against a **Zod schema** (`z.object({...})`).
- **Post-validation hardening** (production-grade thinking to mention):
  - twitter text truncated to 280 chars via `trimToWordBoundary`
  - SEO title capped at 60 chars, description at 160 chars
  - email `previewText` capped at 100 chars
  - JSON-cleanup helpers strip markdown code fences, fix trailing commas and smart quotes
    (`sanitizeJsonCandidate` in research-provider)
- **Reading time** computed from word count (200 WPM).

### Cancellation — a genuinely interesting design
- The UI calls the Convex `cancelProject` mutation **and** `POST /api/cancel-generation`
  (fires a `content/cancel` Inngest event).
- The pipeline registers `cancelOn: [{ event: "content/cancel", if: "...projectId == ..." }]` —
  Inngest aborts the run.
- Additionally, each step checks `isCanceled()` (queries Convex project status) **before** and
  **after** the expensive AI call, so even a cancel that arrives mid-AI-call prevents saving
  results and stops later steps. This "belt and suspenders" approach saves AI tokens — real money
  — which is a great thing to mention.

### Failure handling
- Top-level try/catch calls `recordError` → project marked `failed` with message/step/stack.
- Research step catches **quota errors** (`429`, `resource_exhausted`) separately, sets
  `research.status = "failed"` with `errorCode: "DAILY_QUOTA_EXCEEDED"`, and returns the project to
  `draft` — the UI then shows a dialog offering "Generate without web research" (classic mode).
  That's a user-friendly degradation path, not a hard failure.
- Parallel steps use `Promise.allSettled` so one failing agent doesn't block the others.
- Inngest retries each step 3×.

### AI provider abstraction (worth bragging about)
- `AIProvider` interface: `generateContent(systemPrompt, userPrompt)`.
- **Gemini** default; **OpenRouter** alternative (access to Claude/GPT/etc. via one API).
- **`ResilientAIProvider`**: if primary returns HTTP 500/502/503/504, it automatically fails over
  to the secondary provider. Multi-provider resilience out of the box.

---

## 8. DEEP DIVE — PUBLISHING (Inngest `publishContent`)

1. Trigger `content/publish` from `/api/trigger-publish` after server-side checks:
   - auth (Clerk)
   - payload schema (Zod)
   - project **exists AND belongs to the user** (via `fetchQuery` with the Clerk Convex token)
   - every requested platform has a **connected** `connectedAccounts` row
2. `publishContent` fetches the project, then runs each platform publish **in parallel**
   (`platforms.map` + `Promise.allSettled`).
3. **Per-platform**:
   - marks status `draft` (reset) → calls publisher → marks `published`
   - on failure: marks `draft` + stores `error`, and for social platforms marks the OAuth
     connection `expired`/`error` (`normalizeConnectionError` classifies messages)
4. **Token lifecycle** (great interview detail):
   - before publishing, decrypts the access token
   - if the token expires within 60s, **refreshes** it using the encrypted refresh token,
     re-encrypts the new token, and persists it back to Convex
   - LinkedIn/Twitter support refresh flows; Facebook/Instagram use long-lived tokens
5. Returns a per-platform result summary.

### Notes on limitations (be honest — it builds trust)
- **Medium** publishing is stubbed (`publishToMedium` throws "Phase 2") — the codebase
  intentionally removed it from the UI (git history shows add-then-remove).
- **Email publishing** exists in `publishContent`, but the `trigger-publish` route only accepts
  *social* platforms (`isSocialPlatform` filter) and doesn't pass a recipient email, so it's
  effectively dormant from the UI. The email editor previews/edits but doesn't send directly.
- **Instagram** requires an `imageUrl` (real API constraint) — if missing it errors clearly.
- `/api/upload` currently returns a base64 data URL (a TODO for Vercel Blob/S3).

---

## 9. DEEP DIVE — OAUTH FLOW (secure integration)

Flow for connecting e.g. Twitter:
1. User clicks **Connect** → `/api/integrations/twitter/connect`.
2. Route validates the user is signed in, builds an **OAuth state payload**
   (`{nonce, userId, platform, issuedAt, returnTo}`), base64url-encodes it, and stores it in an
   **httpOnly cookie** (`oauth_state_twitter`) with a 10-min TTL.
3. For Twitter, **PKCE** is used: generate verifier, store in cookie, send `code_challenge`
   (S256) to the authorize URL. (PKCE protects public clients from authorization-code
   interception.)
4. Provider redirects back to `/api/integrations/twitter/callback?code=...&state=...`.
5. Callback **validates state**: cookie exists, matches the `state` param, platform matches,
   userId matches, not expired. Then deletes the cookies. (Prevents CSRF / replay.)
6. Exchanges the code (Twitter/LinkedIn use Basic auth + form body; FB/IG use GET with client
   credentials), gets access/refresh tokens + expiry.
7. **Resolves identity** from the provider (Twitter `/2/users/me`, LinkedIn `/v2/userinfo`,
   FB/IG page + linked IG business account).
8. Encrypts tokens with **AES-256-GCM**, upserts into `connectedAccounts` via a Convex mutation
   (with the Clerk Convex token), redirects back to the dashboard with a success flag.

**Security points to mention:** httpOnly cookies, PKCE for Twitter, state bound to the user, TTL on
state, encryption at rest, and identity resolution (FB stores the page-scoped token in `metadata`
as `effectiveAccessToken`).

---

## 10. REAL-TIME UX (why it feels "live")

- The dashboard uses **Convex reactive queries** (`useQuery(api.contentProjects.getProject, ...)`).
- As Inngest writes each agent's result via `ctx.db.patch`, Convex pushes the new document to
  subscribed clients. The `jobStatus` map drives per-agent badges and a progress bar
  (`completedJobs / totalJobs`).
- No polling, no WebSockets you manage, no refetch logic. This is the single biggest "wow" of the
  stack and worth stating plainly.

---

## 11. PERFORMANCE NUMBERS (memorize)

- End-to-end generation **~25s** (research ~5s + blog ~15s + parallel batch ~10s, overlapped)
- Sequential equivalent would be **~55s** → roughly **2.4× faster** from parallelism
- 4 agents → 6 output channels (blog + 4 social + email + SEO)
- Reading time = words ÷ 200 WPM
- Retry policy: 3 attempts with backoff
- Resend free tier: 3000 emails/day
- Public blog pages: ISR `revalidate = 60` (static-ish pages regenerated every minute)

---

## 12. MOST LIKELY INTERVIEW QUESTIONS + MODEL ANSWERS

### Behavioral / project-level
**Q: Walk me through this project.**
Use Section 2's flow. Start with the problem (marketers manually adapting one idea to 6 channels),
then the 25-second parallel pipeline, then the publish layer. Name-drop the hard parts: durable
steps, cancellation, real-time progress, encrypted OAuth tokens.

**Q: What was the hardest problem you solved?**
Good options (pick the one you can speak to best):
1. **The parallel AI pipeline + cancellation.** Orchestrating 4 LLM calls with a hard dependency
   (blog first), making them retryable/durable, and aborting cleanly mid-flight without burning AI
   tokens. Explain `cancelOn` + the `isCanceled()` double-guard.
2. **Multi-platform OAuth with token lifecycle.** Every provider has different auth quirks
   (PKCE vs not, Basic vs GET, page-scoped tokens). Explain the per-platform config + the
   auto-refresh before expiry.

**Q: What would you improve if you had more time?**
- Real file uploads (Vercel Blob/S3) instead of base64 data URLs.
- Wire up email publishing end-to-end from the UI.
- Analytics dashboard (engagement tracking across platforms).
- Unit/integration tests for Convex + Inngest (currently minimal).
- Rate limiting / idempotency keys on the trigger routes.

**Q: How did you handle failure?**
Inngest retries (3×) each durable step; `recordError` persists failure with step + stack; parallel
agents use `Promise.allSettled` so one failure doesn't kill the batch; research quota failures
degrade gracefully to "classic" mode via a UI dialog.

**Q: How would you scale this?**
- Convex/Inngest are serverless — concurrency scales automatically. Watch: AI API rate limits,
  so add per-user concurrency limits + a small queue, and cache identical topics.
- Read amplification: `getUserProjectsSummary` already projects small fields; could paginate.
- Add idempotency keys on publish to avoid duplicate posts on retry.

### Technical deep-dive
**Q: How does real-time updating work? (Convex)**
Reactive queries. `useQuery` subscribes; when a mutation patches a doc, Convex recomputes affected
queries and pushes deltas to subscribed clients over its streaming/WebSocket transport. No polling.

**Q: What is durable execution and why did you need it?**
Inngest persists each `step.run` result. If the function crashes, times out, or the platform
restarts, it resumes from the last completed step using cached results instead of rerunning from
zero — essential for multi-minute AI workflows that can't fit in one serverless request and must
be resumable.

**Q: Why use Zod?**
Runtime validation of LLM output. LLMs are non-deterministic — they can return invalid JSON or
out-of-range values. Zod gives typed, schema-checked output so bad model responses fail loudly and
predictably instead of corrupting the DB. Also used on HTTP request bodies.

**Q: How do you prevent users from accessing each other's data?**
- Every user mutation derives `userId` from the verified Clerk JWT inside Convex
  (`ctx.auth.getUserIdentity()`) and checks `project.userId === userId`.
- `getProject` enforces ownership; only the internal `getProjectById` skips it (Inngest-only,
  guarded by unguessable IDs).

**Q: What is the `isCanceled` double-check pattern?**
Inngest's `cancelOn` aborts the run, but there's a race window between event delivery and the next
step. Each step re-queries Convex before/after the AI call; if the project is `canceled`, it skips
the expensive work and prevents stale writes. Prevents wasted API spend and late saves.

**Q: Why is the blog generated before social/email/SEO?**
Quality + coherence. Downstream agents receive the complete blog as grounding context. Generating
them in parallel from just a topic would produce inconsistent, shallow content.

**Q: How are OAuth tokens protected?**
Encrypted with AES-256-GCM using a 32-byte key from env (`INTEGRATIONS_ENCRYPTION_KEY`), random IV
+ auth tag per encryption, stored in Convex. Decrypted only in the server-side publisher; never
sent to the client. `listMyConnections` strips token fields from its projection.

**Q: What happens if the AI quota is exhausted?**
Research step catches 429/resource_exhausted, records `DAILY_QUOTA_EXCEEDED`, resets project to
`draft`, and the UI offers "Generate without web research" (classic mode) which re-triggers the
pipeline with `generationMode: "classic"`, skipping research.

**Q: How do the publishers differ?**
- Twitter: `POST /2/tweets` with Bearer token.
- LinkedIn: `POST /v2/ugcPosts` with person URN + X-Restli header.
- Facebook: `POST graph /{pageId}/feed`.
- Instagram: two-step — create media container (`/media` with image_url) then publish
  (`/media_publish` with creation_id); requires image.
- Email: Resend API.

---

## 13. HOOKING IT TO VISTEON (automotive electronics)

Interviewers hire for their problems, not just your project. Map your work to automotive/embedded
concerns. Some phrases that translate naturally:

| Your project experience | Visteon relevance |
|---|---|
| Real-time progress streaming (Convex subscriptions) | Real-time displays / HMI refresh, instrument clusters |
| Durable, retryable background pipelines (Inngest) | OTA update orchestration, telematics event processing |
| State machines (`draft→generating→completed/failed/canceled`) | System state machines, fault handling, power states |
| Fail-safe degradation (quota → classic mode) | Safe fallback modes in vehicle electronics |
| AES-256-GCM encryption of tokens | Secure boot / secure storage / key handling |
| Parallel, bounded-work agents | Multi-core scheduling, resource-bounded tasks |
| Clear separation: state / orchestration / UI | Layered automotive software (AUTOSAR layers, MCAL/BSW/ASW) |

Being able to discuss **state machines, retries/backoff, real-time updates, security at rest, and
graceful degradation** shows you think beyond web dev — these map directly to vehicle software.

---

## 14. QUICK CHEAT SHEET (last-minute review)

- **Stack:** Next.js 16 · React 19 · TypeScript · Convex · Inngest · Gemini 2.x · Clerk · Resend · Tailwind v4 · shadcn/ui · Zod
- **Pipeline:** research → blog (agent 1) → social/email/SEO in parallel (agents 2–4) → save → completed
- **Time:** ~25s vs ~55s sequential (2.4×)
- **Two tables:** `contentProjects`, `connectedAccounts`
- **Real-time:** Convex reactive `useQuery` — zero polling
- **Cancellation:** Inngest `cancelOn` event + per-step `isCanceled()` guard
- **Security:** server-derived userId, ownership checks, AES-256-GCM tokens, httpOnly OAuth state + PKCE
- **Resilience:** retries (3×), `Promise.allSettled`, provider failover, quota fallback
- **Honest gaps:** Medium stub, email-publish dormant, upload = data URL, minimal tests

Good luck tomorrow. You built something real — speak to the decisions, not just the code.


