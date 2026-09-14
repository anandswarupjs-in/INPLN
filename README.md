# IntelliPlan — Construction Schedule Intelligence Platform

**Full-stack (React + FastAPI + MongoDB) role-based project management with L1–L6 baseline scheduling, field report ingestion, layered AI matching, and human verification.**

---

## Hierarchy & Governance

| Role | Can do |
|---|---|
| **Admin** (`durai@gmail.com` / `Durai@2484`) | Approve / reject **project creation** requests submitted by PMs. |
| **Project Manager (Planner)** | Create projects with a globally-unique Project ID, upload baseline schedule, approve Site Engineer & Supervisor access, verify ambiguous activity matches. |
| **Site Engineer** | Upload / submit field reports on the assigned project. |
| **Supervisor** | Participate in verifying ambiguous activity matches. |

**Rules enforced**
- **Admin approval → project creation only.** No public admin role selection.
- **PM approval → project-user (SE / Supervisor) access only.**
- Every project must have a globally-unique Project ID (letters + numbers + hyphens, e.g. `ELEC-1024-U3`). Duplicate IDs return **“Project ID already exists. Please enter another Project ID.”**
- PM projects remain inaccessible until Admin approves them.
- SE / Supervisor access remains pending until PM approves.
- Only `durai@gmail.com` can reach the Admin Dashboard; legacy admin accounts are purged on startup.

---

## Demo Seed Accounts

| Role | Email | Password |
|---|---|---|
| Admin | `durai@gmail.com` | `Durai@2484` |
| Project Manager | `pm@intelliplan.com` | `pm123` |
| Site Engineer | `eng@intelliplan.com` | `eng123` |
| Supervisor | `sup@intelliplan.com` | `sup123` |

The Login page carries a top **Demo Seed Accounts** banner — click any button to log in instantly and land on the correct dashboard.

---

## Local Development

### Prerequisites
- Python 3.11+
- Node 20 + Yarn
- MongoDB 6+ (running locally on `mongodb://localhost:27017` or set `MONGO_URL`)

### Backend
```bash
cd backend
pip install -r requirements.txt
# .env must contain MONGO_URL, DB_NAME, CORS_ORIGINS
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

### Frontend
```bash
cd frontend
yarn install
# .env must contain REACT_APP_BACKEND_URL (e.g. http://localhost:8001)
yarn start
```

The Kubernetes-deployed version uses supervisor; see `/etc/supervisor/conf.d/` for service definitions.

---

## Key API Surface (all prefixed with `/api`)

| Method | Route | Purpose |
|---|---|---|
| POST | `/auth/login` | Role-aware login (admin / pm / engineer / supervisor). |
| GET | `/admin/projects` | List all projects (pending / approved / rejected). |
| POST | `/admin/projects/{id}/action` | `{"action":"approve"\|"reject"}`. |
| POST | `/projects/request-creation` | PM submits new project; regex validates ID; duplicate rejected. |
| POST | `/projects/request-access` | SE / Supervisor asks PM for access on an approved project. |
| GET | `/pm/my-project?email=` | PM dashboard payload (project + pending access requests). |
| POST | `/pm/access-requests/{id}/action` | PM approves or rejects an SE / Supervisor request. |
| GET | `/projects/{id}/workspace` | Full workspace (activities, reports, matches, audit). |
| POST | `/projects/{id}/upload-schedule` | Multipart CSV upload → parses into L1–L6 activities. |
| POST | `/projects/{id}/field-reports` | Extracts discipline / location / event / progress; runs layered fuzzy + semantic match. |
| POST | `/projects/{id}/verify-match` | Accept / reject / choose alternative candidate; updates actual progress and audit trail. |

---

## Mockups shipped
Reference HTML mockups (Trackline visual language) live at `frontend/src/pages/`:
- `authentication.html` — 3-tab auth window (Login / Request Access / Project Manager)
- `screen1_baseline_schedule.html` — Project setup & L1–L6 hierarchy
- `screen2_field_report_ingestion.html` — Free-text / Excel / PDF report ingestion
- `screen3_matching_verification.html` — Candidate matching table, confidence badges, human recommendation panel
- `screen4_dashboard_audit.html` — Progress & audit trail

The React implementation in `frontend/src/App.js` mirrors these flows using the IntelliPlan navy accent palette.

---

## Tech Stack
- **Backend** — FastAPI, Motor (async MongoDB), Pydantic
- **Frontend** — React 19, React Router, Tailwind, shadcn/ui components, Lucide icons, Sonner toasts
- **Database** — MongoDB (`users`, `projects`, `activities`, `access_requests`, `reports`, `matches`, `audit`, `schedule_files`)

---

## Deployment
The app is deploy-ready under supervisor with:
- Backend bound to `0.0.0.0:8001`
- Frontend routed via Kubernetes ingress; API calls go through `${REACT_APP_BACKEND_URL}/api/…`
- No hard-coded secrets; env-driven configuration only.

Run `deployment_agent` (Emergent) or the equivalent CI check to validate before rolling out.

---

## License
Internal / demo. © IntelliPlan Enterprise.
