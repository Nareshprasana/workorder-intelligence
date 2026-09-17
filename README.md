# AI-Powered Resident Complaint & Work Order Automation

A focused AI engineering prototype that converts unstructured resident maintenance complaints into structured analysis, automatically creates a work request, deterministically assigns an appropriate worker, and tracks completion — all backed by a single live SQLite database.

Resident submits natural language → AI structures it → system routes the work deterministically → worker is notified, accepts, and completes the job. The goal is to automate the ambiguous first mile (understanding) while keeping operations predictable and auditable.

## 1. Problem

Residents submit maintenance complaints in natural language:

> “There is water leaking in my apartment and the floor is getting wet.”

Traditionally someone must manually:
- understand the complaint
- identify the maintenance category
- determine urgency
- create a work request
- find an appropriate worker
- communicate the job

This prototype automates that first-mile workflow so a complaint can move from submission to worker notification without manual triage.

## 2. Solution

**Actual workflow implemented:**

```
Resident
  ↓
Submit Complaint
  ↓
Complaint stored in database
  ↓
AI Analysis
  ↓
Category + Severity + Confidence + Recommended Action
  ↓
Automatic Work Request
  ↓
Deterministic Worker Assignment
  ↓
Worker Notification
  ↓
Worker Accepts
  ↓
Worker Completes
  ↓
Complaint Completed
```

All application sections — Dashboard, Residents, Workers, Complaints, Work Requests, AI Analysis — read and write the **same SQLite database** via Prisma. No duplicate stores, no localStorage, no hardcoded demo records.

## 3. AI-Native Design

**Where AI is used:**

Gemini (`@google/genai`, model `gemini-3.6-flash` by default) is responsible only for understanding the resident’s natural-language complaint. It receives `description` and `location` and returns structured JSON:

- `category` (`HVAC | ELECTRICAL | PLUMBING | LIFT | GENERAL`)
- `issue` (short issue summary)
- `severity` (`LOW | MEDIUM | HIGH | CRITICAL`)
- `confidence` (0–1)
- `missingInformation` (`string[]`)
- `recommendedAction` (`string | null`)
- `location` (normalized, nullable)

The response is validated with **Zod** (`src/lib/ai-schema.js`) before anything is written to the database. The prompt explicitly forbids inventing a location and instructs the model to list missing information rather than hallucinate.

**What AI does NOT control:**

- worker selection
- authorization / ownership checks
- work-order state transitions (`ASSIGNED → IN_PROGRESS → COMPLETED`)
- notification delivery (beyond creating the DB record)
- database relationships or priority/SLA calculation

**Engineering reasoning:**

> Use AI to reduce ambiguity; use deterministic software to control operations.

AI is ideal for ambiguous language; deterministic backend rules are preferable for auditable, predictable operations.

## 4. Handling Incomplete Information

If Gemini identifies missing details (e.g., `source of leakage`, `extent of water damage`), the complaint is **not blocked**.

- `missingInformation` is stored inside `Incident.aiAnalysis` (JSON string) alongside the rest of the analysis.
- The complaint still transitions `NEW → ANALYZING → READY`.
- A `WorkOrder` is still automatically created and assigned.
- The additional items are surfaced to the worker on the job detail page:

> AI noted that additional information may be needed:
> - Source of leakage
> - Extent of water damage

Why: the worker can investigate the missing details during the physical inspection. AI should inform, not become an unnecessary operational bottleneck. The resident is not asked to provide more information before dispatch.

## 5. Worker Assignment

Worker selection is **deterministic** (`src/lib/work-order-rules.js`) — the LLM never chooses a worker.

Eligibility:

1. `Worker.status === AVAILABLE`
2. `Worker.skills` (comma-separated string, case-insensitive) contains the complaint `category`
3. Prefer workers whose `location` is substring-matched in the complaint `location`
4. First match wins (deterministic order)

If no eligible worker exists:

```
WorkOrder.status = PENDING
WorkOrder.workerId = null
```

UI shows `Awaiting worker assignment` and offers manual assignment of any `AVAILABLE` worker with the required skill (server-validated).

## 6. Worker Workflow

```
ASSIGNED
   ↓ [Accept]
IN_PROGRESS
   ↓ [Complete]
COMPLETED
```

- **Accept** (`POST /api/work-orders/[id]/accept`): verifies `workOrder.workerId === workerId`, `status === ASSIGNED` → sets `status=IN_PROGRESS`, `startedAt=now()`, `Worker.status=BUSY`.
- **Reject** (`POST /api/work-orders/[id]/reject`): verifies ownership, sets rejecting worker `AVAILABLE`, finds next eligible worker (excluding rejector) → reassigns + new `UNREAD` notification, else `PENDING/null`.
- **Complete** (`POST /api/work-orders/[id]/complete`): verifies ownership and `status IN (ASSIGNED,IN_PROGRESS)` → `WorkOrder COMPLETED` + `Incident COMPLETED` + `completedAt=now()` + `Worker AVAILABLE`.

Worker can see: resident (name, building/apartment), location, original complaint, category, issue, severity/priority, SLA, AI recommendation, and the additional `missingInformation` note when present. State transitions are blocked otherwise (e.g., `COMPLETED → IN_PROGRESS` is rejected).

## 7. Application Sections

Navigation (`src/components/dashboard/Sidebar.jsx`):

- **Dashboard** (`/`) – overview: totals, complaint activity, worker availability, recent complaints, active work requests, AI activity.
- **Residents** (`/residents`) – real DB list; `/residents/new` to add; detail at `/residents/[id]`.
- **Workers** (`/workers`) – list with availability filter; `/workers/new` to add; dashboard at `/workers/[id]` and job detail at `/workers/[id]/jobs/[workOrderId]`.
- **Complaints** (`/incidents` serves as Complaints list, `/complaints/[id]` detail) – all complaints from DB.
- **Work Requests** (`/work-orders`) – PENDING/ASSIGNED/IN_PROGRESS/COMPLETED with assignment status.
- **AI Analysis** (`/ai`) – read-only view of stored analyses, no Gemini call from this page.
- **Settings** (`/settings`).

**Not part of active product:** Clients, Properties, Assets, SOPs are not in navigation. The `Asset` feature has been removed. `Client`, `Property`, `SOP` may still exist as legacy Prisma models for migration/backward compatibility but are **not required** to create or process a complaint.

## 8. Tech Stack

Actual stack (`package.json`):

- **Next.js 16 App Router** (JavaScript, React 19)
- **Tailwind CSS 4** + **shadcn/ui** + **tw-animate-css**
- **Prisma 7** + **@prisma/adapter-better-sqlite3** + **SQLite** (`dev.db`)
- **Google Gemini via `@google/genai`** (`GEMINI_MODEL` default `gemini-3.6-flash`)
- **Zod** for AI output validation
- **Node.js / npm**, `tsx` for seed, `dotenv`
- `lucide-react` for icons (plus `ai`, `openai` installed but Gemini is the active provider)

No Redis, Kafka, WebSockets, Firebase, or external notification infrastructure.

## 9. Architecture

```
Resident
   │
   ▼
Next.js UI (App Router, React, Tailwind, shadcn)
   │
   ▼
Next.js API Routes (/api/complaints, /api/incidents/[id]/analyze, /api/work-orders/*, /api/workers/*)
   │
   ├──────────────► SQLite / Prisma (Resident, Incident, WorkOrder, Worker, Notification)
   │
   ▼
Gemini (@google/genai)
   │
   ▼
Structured AI Analysis (Zod-validated JSON)
   │
   ▼
Deterministic Work-Order Rules (src/lib/work-order-rules.js)
   │
   ├── Priority (severity → priority)
   ├── SLA (priority → hours: CRITICAL 2, HIGH 4, MEDIUM 12, LOW 24)
   ├── Worker Eligibility (AVAILABLE + skill match)
   └── Worker Assignment (location preference, deterministic)
   │
   ▼
WorkOrder + Notification (UNREAD)
   │
   ▼
Worker (accept / reject / complete)
   │
   ▼
Completion (WorkOrder COMPLETED, Incident COMPLETED, Worker AVAILABLE)
```

## 10. Database Model

Core product models (`prisma/schema.prisma`):

- **Resident** – `id, name, email?, phone?, apartment, building, status(ACTIVE/INACTIVE), incidents[]`
- **Worker** – `id, name, skills (comma string), location, status(AVAILABLE/BUSY/OFFLINE), workOrders[], notifications[]`
- **Incident (Complaint)** – `id, residentId→Resident, description, location, category?, issue?, severity?, confidence?, status, aiAnalysis(JSON), recommendedAction?, workOrder?` — *Incident is the Prisma model name for a Complaint*.
- **WorkOrder** – `id, incidentId (unique)→Incident, workerId?→Worker, priority, slaHours, description, action, status(PENDING/ASSIGNED/IN_PROGRESS/COMPLETED/CANCELLED), assignedAt?, startedAt?, completedAt?, notifications[]`
- **Notification** – `id, workerId→Worker, workOrderId→WorkOrder, title, message, status(UNREAD/READ)`

Relationships:

- `Resident 1—* Incident`
- `Incident 1—1 WorkOrder` (optional, created when READY)
- `Worker 1—* WorkOrder` and `Worker 1—* Notification`

Legacy models: `Client`, `Property`, `SOP` may remain in schema for migration history but are not required for the current `Resident → Complaint` workflow. `Asset` has been removed.

## 11. Local Development

**Prerequisites:** Node.js 18+, npm, Gemini API key

```bash
git clone https://github.com/Nareshprasana/workorder-intelligence.git
cd workorder-intelligence

npm install
```

Create `.env` (never commit real keys; `.env.example` is the template):

```
DATABASE_URL="file:./dev.db"
GEMINI_API_KEY="your_gemini_api_key"
GEMINI_MODEL="gemini-3.6-flash"
```

Generate client:

```bash
npx prisma generate
```

Fresh development database (resets SQLite and reapplies migrations):

```bash
npx prisma migrate reset --force
```

Seed clean demo data (4 residents, 4 workers, 0 complaints):

```bash
npx tsx prisma/seed.ts
```

Start:

```bash
npm run dev
# open http://localhost:3000
```

## 12. Seed Data

`prisma/seed.ts` creates a **clean slate** (intentional):

- **4 Residents:**
  - Ravi Kumar — B-401, Block B, ACTIVE
  - Priya Sharma — A-203, Block A, ACTIVE
  - Arun Kumar — A-105, Block A, ACTIVE
  - Meera Singh — C-302, Block C, ACTIVE
- **4 Workers:**
  - Ravi Technician — HVAC, Electrical — Block B — AVAILABLE
  - Arun Technician — Plumbing — Block A — AVAILABLE
  - Suresh Technician — Electrical — Block B — AVAILABLE
  - Manoj Technician — General Maintenance — Block A — AVAILABLE
- **0 Complaints / 0 WorkOrders / 0 Notifications**

This ensures every demo starts from a real workflow: complaints are created through `/complaints/new`, not hardcoded.

## 13. Demo Workflow

Use `/complaints/new`:

- **Resident:** Priya Sharma
- **Location:** Block A, A-203
- **Complaint:** “There is water leaking in my apartment and the floor is getting wet.”

1. Complaint is stored (`NEW`, returns ID immediately)
2. UI auto-calls `POST /api/incidents/[id]/analyze` → `ANALYZING`
3. Gemini identifies category (e.g., `PLUMBING`), issue, severity, confidence, `recommendedAction`, and any `missingInformation` (e.g., `source of leakage`)
4. Complaint becomes `READY` (even if missing info exists; it is stored as worker context, not a blocker)
5. Work Request is automatically created (`priority` from severity, `slaHours` from priority)
6. Eligible worker selected deterministically (e.g., Arun Technician – Plumbing – Block A – AVAILABLE)
7. `Notification UNREAD` created → appears as `NEW WORK REQUEST` on `/workers/[id]`
8. Worker sees full details + AI recommendation + additional info note
9. Worker **Accepts** → `IN_PROGRESS`, `BUSY`, `startedAt` set
10. Worker fixes issue → **Complete Complaint** → `COMPLETED` for both WorkOrder and Incident, `completedAt` set, worker `AVAILABLE`
11. Dashboard, Complaints, Work Requests, AI Analysis all reflect the new state via the shared DB.

## 14. Security Boundary

**Implemented (prototype level):**

- Complaint `POST /api/complaints` requires `residentId` exists and `Resident.status === ACTIVE` (403 otherwise); `description` + `location` required (400), unknown resident → 404.
- Worker assignment validates `AVAILABLE` + `skills` contains `category` server-side; location preference is server-side.
- Worker actions verify `workOrder.workerId === workerId` (from body) → 403 otherwise; `accept` requires `ASSIGNED`, `complete` requires `ASSIGNED|IN_PROGRESS`, `reject` finds next eligible excluding rejector.
- `PATCH /api/workers/[id]/notifications/[notificationId]` verifies `notification.workerId === workerId` (403).
- Request bodies validated; errors return safe messages, no stack traces; client-provided ownership never trusted.

**Intentionally out of scope for this one-day prototype:**

- No authentication / session / JWT / RBAC. Server trusts `residentId`/`workerId` supplied by the UI for demo purposes.
- No multi-tenant isolation beyond resident linkage.

> Production would add authenticated resident and worker accounts with role-based authorization, plus audit logging and production API security. The prototype notes `Production would add authenticated resident and worker accounts with role-based authorization.` in the sidebar footer.

## 15. Engineering Tradeoffs

- **AI for language, deterministic logic for operations:** Gemini handles ambiguous complaints; worker assignment, state machines, and notifications are deterministic for auditability. *Use AI to reduce ambiguity; use deterministic software to control operations.*
- **SQLite + Prisma + better-sqlite3 adapter:** Chosen for rapid prototype development, zero external DB, single-file `dev.db`, Prisma 7 `driverAdapters` support. No need for Postgres/queue for this scope.
- **No authentication:** Excluded to focus on the AI → deterministic handoff within one-day scope; security checks are still server-side but without sessions.
- **Deterministic worker assignment vs LLM selection:** Location-preference + skill match is predictable and testable; LLM worker choice would be non-deterministic and harder to audit.
- **In-app Notification model vs external push:** Simple `UNREAD/READ` in SQLite, displayed on worker dashboard; avoids Firebase/WebSockets/Redis for prototype.

## 16. Limitations / Where It Breaks at Scale

- **SQLite** is not appropriate for large concurrent production workloads; file locking and single-writer limits.
- **Auth/RBAC simplified** – no real identity, no tenant isolation.
- **Worker assignment is basic** – no scheduling, capacity, shift, or load balancing.
- **No external notification infrastructure** – only in-app polling after fetch.
- **AI output can be incorrect or ambiguous** – hallucination, mis-categorization, or low confidence; needs evaluation/monitoring.
- **Prompt/model versioning not tracked** – no A/B or regression suite in prototype.
- **Retries/observability minimal** – `ANALYZING` → `READY` is synchronous; no queue, dead-letter, or metrics.
- **Concurrent state transitions** would need stronger guarantees (optimistic locking, transactions) in production.
- **Multi-tenant isolation** would need row-level or schema-level enforcement if serving multiple organizations.

## 17. Why AI / Why Not AI

| Problem | AI? | Reason |
|---|---|---|
| Understand natural-language complaint | Yes | Ambiguous human language |
| Categorize maintenance issue | Yes | Requires interpretation |
| Estimate severity | Yes | Useful contextual judgment |
| Recommend action | Yes | Converts complaint into actionable guidance |
| Identify missing info | Yes | Surfaces worker context without blocking |
| Select worker | No | Should be deterministic and auditable |
| Authorization | No | Security must be deterministic |
| Workflow state transitions | No | Predictability |
| Notifications | No | Normal application logic |
| Database operations | No | Deterministic backend behavior |

## 18. Project Status

Current tested workflow:

```
Resident
→ Complaint
→ AI Analysis (ANALYZING → READY, missingInformation stored, never blocks)
→ Automatic Work Request (PENDING or ASSIGNED)
→ Worker Assignment (deterministic)
→ Notification (UNREAD)
→ Accept → IN_PROGRESS (BUSY)
→ Complete → COMPLETED (Incident + WorkOrder), Worker AVAILABLE
```

The complete flow has been tested: create resident → submit complaint → AI analyzes → Work Request auto-created → correct HVAC/Plumbing worker receives `NEW WORK REQUEST` → accept → complete → dashboard/AI/Work Requests reflect `COMPLETED`. A vague complaint like “AC not working” will still become `READY` with `missingInformation` surfaced to the worker.

## 19. Future Production Evolution

- PostgreSQL (or managed DB) + Prisma Migrate in CI
- Authentication & RBAC (NextAuth/JWT), multi-tenant isolation
- Queue-based async AI processing (e.g., BullMQ) with retries/idempotency
- Smarter worker scheduling and capacity awareness
- Push/email/SMS notifications
- Observability (logs, metrics, tracing), AI evaluation harness, prompt versioning
- Audit trails, optimistic concurrency for state transitions, production API security

None of the above are currently implemented; listed as next steps.

## 20. Project Philosophy

> The goal was not to build the largest possible facility-management platform. The goal was to identify where AI provides meaningful operational value and where traditional deterministic software is the better engineering choice.

> Use AI to reduce ambiguity. Use deterministic software to control operations.

---

**Local DB:** `dev.db` (SQLite, ignored in git). **Env template:** `.env.example` with `DATABASE_URL` and placeholder `GEMINI_API_KEY`. **Generated:** `src/generated/prisma` is ignored and regenerated via `npx prisma generate`.
