# IntelliPlan / Trackline — PRD

## Original problem statement
Update the IntelliPlan authentication and project-management flow with strict hierarchical governance:
- **Admin** approves/rejects **project creation** only.
- **Project Manager (Planner)** creates projects with globally-unique Project IDs (letters + numbers + hyphens, e.g. `ELEC-1024-U3`), uploads baseline schedules, and approves Site Engineer / Supervisor access.
- **Site Engineer** uploads field reports; **Supervisor** can verify ambiguous activity matches.
- Only `durai@gmail.com` / `Durai@2484` may reach the Admin Dashboard.
- Ship as a deployable ZIP and pass deployment readiness.

## Users / personas
1. **Admin** — governance / gatekeeper for project creation.
2. **Project Manager** — creator + planner + gatekeeper for team access.
3. **Site Engineer** — submits daily field progress on assigned project.
4. **Supervisor** — verifies ambiguous match candidates on assigned project.

## Core requirements (static)
- Admin approval gates project creation (only).
- PM approval gates SE/Supervisor project access (only).
- Unique Project ID validation with letters + digits + hyphens; duplicate returns the exact required message.
- Role-based routing: `/admin`, `/pm-dashboard`, `/project-workspace/:projectId`.
- Baseline schedule → L1–L6 hierarchy with discipline / location / planned dates.
- Field report ingestion with extraction (discipline, description, location, event type, date, progress %).
- Layered matching (exact ID + metadata + fuzzy + semantic) with confidence scores.
- Human verification queue (accept / reject / choose another) updates activity actuals + writes audit trail.

## What's implemented (2026-02)
- Backend (FastAPI + SQLAlchemy + MySQL): auth, admin approvals, PM dashboard, access requests, workspace, CSV baseline upload with **non-destructive upsert** (preserves actual progress), field report extraction + matching, verification, audit trail, and `GET /api/download/deployment-zip` for the source ZIP.
- Frontend (React 19 + Tailwind + shadcn): Home, Login (with quick-login demo banner), Register Project (PM), Request Access (SE / Supervisor), Admin Dashboard (Pending / Approved / Rejected sections), PM Dashboard + access approvals, Project Workspace with tabs (Schedule / Reports / Verification / Audit), Download ZIP button on the Home hero.
- Seeded demo project `ELEC-1024-U3` (approved) with sample L1–L6 activities and role-scoped users.
- Deployment: hosted on Render (backend) + Vercel (frontend) + Railway (MySQL); MySQL from `DATABASE_URL`; frontend from `REACT_APP_BACKEND_URL`.
- Testing agent: 22/22 backend + 100% frontend on iteration 3.
- Deployable ZIP at `/app/dist/intelliplan_deployment.zip` and served at `/api/download/deployment-zip`.

## Prioritized backlog
- **P1** — Password hashing (bcrypt) and stripping password from `/auth/login` response.
- **P1** — Real semantic embedding (Emergent LLM) instead of heuristic keyword overlap for matching.
- **P2** — Refactor `server.py` into modular routers (auth / admin / pm / workspace).
- **P2** — Excel (`.xlsx`) and PDF schedule parsing on top of the current CSV parser.
- **P2** — Multi-project support per PM (currently 1 project per PM email).
- **P3** — Email notifications on approval decisions.
- **P3** — Dashboard analytics: SPI / CPI, planned vs actual burn-down charts.

## Next tasks after this iteration
1. Wire the mockup Trackline sidebar navigation into the app shell for a closer visual match to `screen1–screen4` HTMLs.
2. Add bcrypt + strip password field.
3. Introduce `xlsx` reader for baseline schedule uploads.
