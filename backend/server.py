from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, List
import base64, csv, io, logging, os, re, uuid

from dotenv import load_dotenv
from fastapi import APIRouter, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, DeclarativeBase, mapped_column, Mapped
from sqlalchemy import String, Integer, Float, Text, DateTime, select, update, delete, func
import sqlalchemy as sa

ROOT = Path(__file__).parent
DOWNLOADS = ROOT / "downloads"
load_dotenv(ROOT / ".env")

DATABASE_URL = os.environ["DATABASE_URL"]
# Convert mysql:// → mysql+aiomysql:// for async support
if DATABASE_URL.startswith("mysql://"):
    DATABASE_URL = DATABASE_URL.replace("mysql://", "mysql+aiomysql://", 1)
elif DATABASE_URL.startswith("mysql+mysqlconnector://"):
    DATABASE_URL = DATABASE_URL.replace("mysql+mysqlconnector://", "mysql+aiomysql://", 1)

engine = create_async_engine(DATABASE_URL, echo=False, pool_recycle=3600, pool_pre_ping=True)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

# ============================================================
# ORM Models
# ============================================================
class Base(DeclarativeBase):
    pass

class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[Optional[str]] = mapped_column(String(200))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(50))
    project_id: Mapped[Optional[str]] = mapped_column(String(100))

class Project(Base):
    __tablename__ = "projects"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    project_id: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    project_title: Mapped[str] = mapped_column(String(300))
    project_description: Mapped[Optional[str]] = mapped_column(Text)
    pm_name: Mapped[Optional[str]] = mapped_column(String(200))
    pm_email: Mapped[Optional[str]] = mapped_column(String(255))
    status: Mapped[str] = mapped_column(String(50), default="pending")
    created_at: Mapped[Optional[str]] = mapped_column(String(50))
    reviewed_at: Mapped[Optional[str]] = mapped_column(String(50))

class AccessRequest(Base):
    __tablename__ = "access_requests"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    request_uuid: Mapped[str] = mapped_column(String(36), unique=True, default=lambda: str(uuid.uuid4()))
    project_id: Mapped[str] = mapped_column(String(100), index=True)
    name: Mapped[str] = mapped_column(String(200))
    email: Mapped[str] = mapped_column(String(255), index=True)
    role: Mapped[str] = mapped_column(String(50))
    details: Mapped[Optional[str]] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(50), default="pending")
    requested_at: Mapped[Optional[str]] = mapped_column(String(50))
    reviewed_at: Mapped[Optional[str]] = mapped_column(String(50))

class Activity(Base):
    __tablename__ = "activities"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    activity_id: Mapped[str] = mapped_column(String(150), index=True)
    project_id: Mapped[str] = mapped_column(String(100), index=True)
    hierarchy_level: Mapped[Optional[str]] = mapped_column(String(10))
    description: Mapped[Optional[str]] = mapped_column(Text)
    discipline: Mapped[Optional[str]] = mapped_column(String(100))
    location: Mapped[Optional[str]] = mapped_column(String(200))
    planned_start: Mapped[Optional[str]] = mapped_column(String(20))
    planned_end: Mapped[Optional[str]] = mapped_column(String(20))
    actual_start: Mapped[Optional[str]] = mapped_column(String(20))
    actual_end: Mapped[Optional[str]] = mapped_column(String(20))
    progress_percentage: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String(50), default="Not Started")

class Report(Base):
    __tablename__ = "reports"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    report_uuid: Mapped[str] = mapped_column(String(36), unique=True)
    project_id: Mapped[str] = mapped_column(String(100), index=True)
    report_text: Mapped[Optional[str]] = mapped_column(Text)
    normalized_text: Mapped[Optional[str]] = mapped_column(Text)
    submitted_by: Mapped[Optional[str]] = mapped_column(String(255))
    source_document: Mapped[str] = mapped_column(String(200), default="free-text")
    timestamp: Mapped[Optional[str]] = mapped_column(String(50))
    matched_count: Mapped[int] = mapped_column(Integer, default=0)
    ambiguous_count: Mapped[int] = mapped_column(Integer, default=0)
    extracted_discipline: Mapped[Optional[str]] = mapped_column(String(100))
    extracted_location: Mapped[Optional[str]] = mapped_column(String(200))
    extracted_event_type: Mapped[Optional[str]] = mapped_column(String(50))
    extracted_event_date: Mapped[Optional[str]] = mapped_column(String(20))
    extracted_progress: Mapped[int] = mapped_column(Integer, default=0)

class Match(Base):
    __tablename__ = "matches"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    match_uuid: Mapped[str] = mapped_column(String(36), unique=True)
    project_id: Mapped[str] = mapped_column(String(100), index=True)
    report_uuid: Mapped[Optional[str]] = mapped_column(String(36))
    extracted_text: Mapped[Optional[str]] = mapped_column(Text)
    extracted_discipline: Mapped[Optional[str]] = mapped_column(String(100))
    extracted_location: Mapped[Optional[str]] = mapped_column(String(200))
    extracted_date: Mapped[Optional[str]] = mapped_column(String(20))
    extracted_progress: Mapped[int] = mapped_column(Integer, default=0)
    event_type: Mapped[Optional[str]] = mapped_column(String(50))
    confidence: Mapped[float] = mapped_column(Float, default=0.0)
    match_signal: Mapped[Optional[str]] = mapped_column(String(300))
    candidates_json: Mapped[Optional[str]] = mapped_column(Text)  # JSON string
    assigned_activity_id: Mapped[Optional[str]] = mapped_column(String(150))
    status: Mapped[str] = mapped_column(String(50), default="pending")
    verified_by: Mapped[Optional[str]] = mapped_column(String(255))
    verified_at: Mapped[Optional[str]] = mapped_column(String(50))
    created_at: Mapped[Optional[str]] = mapped_column(String(50))

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    log_uuid: Mapped[str] = mapped_column(String(36), unique=True)
    project_id: Mapped[str] = mapped_column(String(100), index=True)
    event: Mapped[Optional[str]] = mapped_column(String(300))
    detail: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[Optional[str]] = mapped_column(String(50))

# ============================================================
# Helpers
# ============================================================
app = FastAPI(title="IntelliPlan Schedule Intelligence API")
api = APIRouter(prefix="/api")

def now(): return datetime.now(timezone.utc).isoformat()

def normalize(value: str) -> str:
    value = (value or "").lower().replace("unit-", "unit ").replace("u-", "unit ")
    value = re.sub(r"\bu3\b", "unit 3", value)
    value = re.sub(r"\bu4\b", "unit 4", value)
    return re.sub(r"\s+", " ", value).strip()

import json

def row_to_dict(obj):
    """Convert a SQLAlchemy model instance to a dict."""
    if obj is None: return None
    d = {c.name: getattr(obj, c.name) for c in obj.__table__.columns}
    # Parse candidates_json if present
    if 'candidates_json' in d and d['candidates_json']:
        try: d['candidates'] = json.loads(d['candidates_json'])
        except: d['candidates'] = []
        del d['candidates_json']
    # Expose UUIDs as "id"
    for uuid_key in ['request_uuid', 'report_uuid', 'match_uuid', 'log_uuid']:
        if uuid_key in d:
            d['id'] = d[uuid_key]
            del d[uuid_key]
    return d

async def get_session():
    async with AsyncSessionLocal() as session:
        yield session

# ============================================================
# Pydantic schemas
# ============================================================
from pydantic import BaseModel

class LoginReq(BaseModel): email: str; password: str
class ProjectCreate(BaseModel):
    name: str; email: str; password: str; project_id: str; project_title: str; project_description: str
class AccessCreate(BaseModel):
    name: str; email: str; password: str; role: str; project_id: str; details: str = ""
class ActionReq(BaseModel): action: str
class ReportReq(BaseModel): report_text: str; submitted_by: str; source_document: str = "free-text"
class VerifyReq(BaseModel): match_id: str; action: str; chosen_activity_id: Optional[str] = None; verified_by: str

# ============================================================
# Seed Data
# ============================================================
DEMO_USERS = [
    {"name":"Durai (System Admin)","email":"durai@gmail.com","password":"Durai@2485","role":"admin","project_id":None},
    {"name":"Jane PM Planner","email":"pm@intelliplan.com","password":"pm123","role":"pm","project_id":"ELEC-1024-U3"},
    {"name":"John Engineer","email":"eng@intelliplan.com","password":"eng123","role":"engineer","project_id":"ELEC-1024-U3"},
    {"name":"Alice Supervisor","email":"sup@intelliplan.com","password":"sup123","role":"supervisor","project_id":"ELEC-1024-U3"},
]

SAMPLE_ACTIVITIES = [
    ("ELEC-1024","L1","Greenfield Industrial Expansion","Electrical","Unit 3","2026-09-10","2026-12-15"),
    ("ELEC-1024-L2","L2","Electrical Scope & Power Distribution","Electrical","Unit 3","2026-09-10","2026-10-20"),
    ("ELEC-1024-L3","L3","Cable Tray Installation Work Package","Electrical","Unit 3","2026-09-10","2026-09-25"),
    ("ELEC-1024-L4","L4","Unit 3 Cable Routing","Electrical","Unit 3","2026-09-10","2026-09-20"),
    ("ELEC-1024-L5","L5","Cable Tray Installation","Electrical","Unit 3","2026-09-10","2026-09-18"),
    ("ELEC-1024-L6","L6","Install cable tray in Unit 3","Electrical","Unit 3","2026-09-10","2026-09-15"),
]

@app.on_event("startup")
async def startup():
    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        # Seed users
        for user in DEMO_USERS:
            existing = await db.execute(select(User).where(User.email == user["email"]))
            if not existing.scalar_one_or_none():
                db.add(User(**user))

        # Seed demo project
        existing_proj = await db.execute(select(Project).where(Project.project_id == "ELEC-1024-U3"))
        if not existing_proj.scalar_one_or_none():
            db.add(Project(
                project_id="ELEC-1024-U3",
                project_title="Greenfield Industrial Expansion",
                project_description="Electrical infrastructure upgrade across Unit 3.\nSchedule-linked field execution and progress control.",
                pm_name="Jane PM Planner",
                pm_email="pm@intelliplan.com",
                status="approved",
                created_at=now()
            ))
            await db.flush()

            # Seed activities
            for a in SAMPLE_ACTIVITIES:
                db.add(Activity(
                    activity_id=a[0], project_id="ELEC-1024-U3",
                    hierarchy_level=a[1], description=a[2], discipline=a[3],
                    location=a[4], planned_start=a[5], planned_end=a[6],
                    progress_percentage=0, status="Not Started"
                ))

        await db.commit()

@app.on_event("shutdown")
async def shutdown():
    await engine.dispose()

# ============================================================
# API Routes
# ============================================================
@api.get("/")
async def root(): return {"service": "IntelliPlan", "status": "ok", "db": "MySQL"}

@api.get("/download/deployment-zip")
async def download_zip():
    zip_path = DOWNLOADS / "intelliplan_deployment.zip"
    if not zip_path.exists(): raise HTTPException(404, "Deployment package not found.")
    return FileResponse(str(zip_path), media_type="application/zip", filename="intelliplan_deployment.zip")

# --- Auth ---
@api.post("/auth/login")
async def login(req: LoginReq):
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.email == req.email, User.password == req.password))
        user = result.scalar_one_or_none()
        if not user: raise HTTPException(401, "Invalid email or password.")
        user_dict = row_to_dict(user)

        if user.role == "pm":
            res = await db.execute(select(Project).where(Project.pm_email == user.email))
            project = res.scalar_one_or_none()
            if project and project.status != "approved":
                raise HTTPException(403, "Project creation is awaiting Admin approval.")

        if user.role in {"engineer", "supervisor"}:
            res = await db.execute(
                select(AccessRequest).where(
                    AccessRequest.email == user.email,
                    AccessRequest.project_id == user.project_id,
                    AccessRequest.status == "approved"
                )
            )
            access = res.scalar_one_or_none()
            if not access and user.email not in {"eng@intelliplan.com", "sup@intelliplan.com"}:
                raise HTTPException(403, "Project access is awaiting Project Manager approval.")

        return user_dict

# --- Admin ---
@api.get("/admin/projects")
async def admin_projects():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Project).order_by(Project.created_at.desc()))
        return [row_to_dict(p) for p in result.scalars().all()]

@api.post("/admin/projects/{project_id}/action")
async def admin_action(project_id: str, req: ActionReq):
    if req.action not in {"approve", "reject"}: raise HTTPException(400, "Action must be approve or reject.")
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Project).where(Project.project_id == project_id, Project.status == "pending"))
        project = result.scalar_one_or_none()
        if not project: raise HTTPException(404, "Pending project not found.")
        project.status = "approved" if req.action == "approve" else "rejected"
        project.reviewed_at = now()
        await db.commit()
    return {"project_id": project_id, "status": project.status}

# --- Projects ---
@api.post("/projects/request-creation")
async def create_project(req: ProjectCreate):
    project_id = req.project_id.strip().upper()
    if not re.fullmatch(r"(?=.*[A-Z])(?=.*\d)[A-Z0-9-]+", project_id):
        raise HTTPException(400, "Project ID must contain letters, numbers, and hyphens (e.g. ELEC-1024-U3).")
    async with AsyncSessionLocal() as db:
        if (await db.execute(select(Project).where(Project.project_id == project_id))).scalar_one_or_none():
            raise HTTPException(400, "Project ID already exists. Please enter another Project ID.")
        if (await db.execute(select(User).where(User.email == req.email))).scalar_one_or_none():
            raise HTTPException(400, "Email already has an account. Please sign in or use another email.")
        db.add(User(name=req.name, email=req.email, password=req.password, role="pm", project_id=project_id))
        db.add(Project(
            project_id=project_id, project_title=req.project_title,
            project_description=req.project_description,
            pm_name=req.name, pm_email=req.email, status="pending", created_at=now()
        ))
        await db.commit()
    return {"message": "Project creation request submitted successfully.", "project_id": project_id}

@api.post("/projects/request-access")
async def request_access(req: AccessCreate):
    project_id = req.project_id.strip().upper()
    async with AsyncSessionLocal() as db:
        project = (await db.execute(select(Project).where(Project.project_id == project_id, Project.status == "approved"))).scalar_one_or_none()
        if not project: raise HTTPException(404, "Approved Project ID not found.")
        if req.role not in {"engineer", "supervisor"}: raise HTTPException(400, "Only Site Engineer or Supervisor access can be requested.")
        existing = (await db.execute(select(AccessRequest).where(
            AccessRequest.email == req.email, AccessRequest.project_id == project_id, AccessRequest.status == "pending"
        ))).scalar_one_or_none()
        if existing: raise HTTPException(400, "An access request is already pending.")

        # Upsert user
        user = (await db.execute(select(User).where(User.email == req.email))).scalar_one_or_none()
        if user:
            user.name = req.name; user.password = req.password; user.role = req.role; user.project_id = project_id
        else:
            db.add(User(name=req.name, email=req.email, password=req.password, role=req.role, project_id=project_id))

        db.add(AccessRequest(
            request_uuid=str(uuid.uuid4()), project_id=project_id,
            name=req.name, email=req.email, role=req.role, details=req.details,
            status="pending", requested_at=now()
        ))
        await db.commit()
    return {"message": "Access request submitted to Project Manager."}

# --- PM ---
@api.get("/pm/my-project")
async def pm_project(email: str):
    async with AsyncSessionLocal() as db:
        project = (await db.execute(select(Project).where(Project.pm_email == email))).scalar_one_or_none()
        if not project: return {"project": None, "access_requests": []}
        requests_result = await db.execute(
            select(AccessRequest).where(AccessRequest.project_id == project.project_id).order_by(AccessRequest.requested_at.desc())
        )
        requests = [row_to_dict(r) for r in requests_result.scalars().all()]
        return {"project": row_to_dict(project), "access_requests": requests}

@api.post("/pm/access-requests/{request_id}/action")
async def access_action(request_id: str, req: ActionReq):
    async with AsyncSessionLocal() as db:
        item = (await db.execute(select(AccessRequest).where(AccessRequest.request_uuid == request_id))).scalar_one_or_none()
        if not item: raise HTTPException(404, "Access request not found.")
        status = "approved" if req.action == "approve" else "rejected"
        item.status = status; item.reviewed_at = now()
        if status == "approved":
            user = (await db.execute(select(User).where(User.email == item.email))).scalar_one_or_none()
            if user: user.project_id = item.project_id; user.role = item.role
        await db.commit()
    return {"status": status}

# --- Workspace data helper ---
async def workspace_data(project_id: str, db: AsyncSession):
    project = (await db.execute(select(Project).where(Project.project_id == project_id))).scalar_one_or_none()
    if not project: raise HTTPException(404, "Project not found.")
    activities = [row_to_dict(a) for a in (await db.execute(select(Activity).where(Activity.project_id == project_id))).scalars().all()]
    reports = [row_to_dict(r) for r in (await db.execute(select(Report).where(Report.project_id == project_id).order_by(Report.timestamp.desc()))).scalars().all()]
    matches = [row_to_dict(m) for m in (await db.execute(select(Match).where(Match.project_id == project_id).order_by(Match.created_at.desc()))).scalars().all()]
    audit = [row_to_dict(a) for a in (await db.execute(select(AuditLog).where(AuditLog.project_id == project_id).order_by(AuditLog.created_at.desc()))).scalars().all()]
    return {"project": row_to_dict(project), "activities": activities, "reports": reports, "matches": matches, "audit": audit}

@api.get("/projects/{project_id}/workspace")
async def workspace(project_id: str):
    async with AsyncSessionLocal() as db:
        return await workspace_data(project_id, db)

@api.post("/projects/{project_id}/upload-schedule")
async def upload_schedule(project_id: str, file: UploadFile = File(...)):
    async with AsyncSessionLocal() as db:
        project = (await db.execute(select(Project).where(Project.project_id == project_id, Project.status == "approved"))).scalar_one_or_none()
        if not project: raise HTTPException(404, "Approved project not found.")

        raw = await file.read()
        activities = []
        try:
            rows = list(csv.DictReader(io.StringIO(raw.decode("utf-8-sig"))))
            for index, row in enumerate(rows):
                get = lambda *keys: next((row.get(k) for k in keys if row.get(k)), "")
                activities.append({
                    "activity_id": get("activity_id","Activity ID","id") or f"{project_id}-L6-{index+1:03}",
                    "hierarchy_level": get("level","Level","hierarchy_level") or "L6",
                    "description": get("description","Activity Description","activity") or "Imported activity",
                    "discipline": get("discipline","Discipline") or "General",
                    "location": normalize(get("location","Location")) or "Unspecified",
                    "planned_start": get("planned_start","Planned Start","start") or None,
                    "planned_end": get("planned_end","Planned Finish","end") or None,
                })
        except UnicodeDecodeError:
            pass

        if not activities:
            activities = [{
                "activity_id": a[0].replace("ELEC-1024", project_id),
                "hierarchy_level": a[1], "description": a[2], "discipline": a[3],
                "location": a[4], "planned_start": a[5], "planned_end": a[6],
            } for a in SAMPLE_ACTIVITIES]

        # Upsert activities
        baseline_ids = [a["activity_id"] for a in activities]
        for act_data in activities:
            existing = (await db.execute(
                select(Activity).where(Activity.project_id == project_id, Activity.activity_id == act_data["activity_id"])
            )).scalar_one_or_none()
            if existing:
                for k in ["hierarchy_level","description","discipline","location","planned_start","planned_end"]:
                    setattr(existing, k, act_data.get(k))
            else:
                db.add(Activity(project_id=project_id, **act_data, progress_percentage=0, status="Not Started"))

        # Delete stale
        await db.execute(
            delete(Activity).where(Activity.project_id == project_id, Activity.activity_id.notin_(baseline_ids))
        )

        db.add(AuditLog(
            log_uuid=str(uuid.uuid4()), project_id=project_id,
            event="Baseline schedule parsed",
            detail=f"{file.filename} · {len(activities)} activities · L1–L6 hierarchy",
            created_at=now()
        ))
        await db.commit()

    return {"message": "Schedule parsed and L1–L6 hierarchy built.", "activity_count": len(activities), "filename": file.filename}

@api.post("/projects/{project_id}/field-reports")
async def field_report(project_id: str, req: ReportReq):
    async with AsyncSessionLocal() as db:
        project = (await db.execute(select(Project).where(Project.project_id == project_id, Project.status == "approved"))).scalar_one_or_none()
        if not project: raise HTTPException(404, "Approved project not found.")

        report_uuid_val = str(uuid.uuid4())
        text = req.report_text; norm = normalize(text)
        progress_match = re.search(r"(\d{1,3})\s*%", text)
        progress = int(progress_match.group(1)) if progress_match else 0
        discipline = "Electrical" if "electrical" in norm or "cable" in norm else "General"
        location = "Unit 3" if "unit 3" in norm else "Unspecified"
        event = "START" if any(x in norm for x in ["started","commenced","began"]) else "PROGRESS"

        activities_result = await db.execute(select(Activity).where(Activity.project_id == project_id))
        activities = activities_result.scalars().all()
        candidates = []
        for act in activities:
            explicit = act.activity_id.lower() in norm
            words = set(re.findall(r"[a-z0-9]+", normalize(act.description or "")))
            overlap = len(words & set(re.findall(r"[a-z0-9]+", norm))) / max(len(words), 1)
            loc = 1 if normalize(act.location or "") in norm else 0
            disc = 1 if act.discipline == discipline else 0
            score = 0.55*overlap + 0.2*loc + 0.15*disc + (0.1 if explicit else 0)
            candidates.append({
                "activity_id": act.activity_id,
                "description": act.description,
                "confidence": round(min(score + (0.78 if explicit else 0), 0.99), 2),
                "fuzzy_score": round(overlap, 2),
                "semantic_score": round(score, 2)
            })

        candidates = sorted(candidates, key=lambda x: x["confidence"], reverse=True)[:3]
        top = candidates[0] if candidates else None
        status = "accepted" if top and top["confidence"] >= 0.85 else "pending"

        db.add(Report(
            report_uuid=report_uuid_val, project_id=project_id,
            report_text=text, normalized_text=norm,
            submitted_by=req.submitted_by, source_document=req.source_document,
            timestamp=now(), matched_count=len(candidates),
            ambiguous_count=0 if status == "accepted" else 1,
            extracted_discipline=discipline, extracted_location=location,
            extracted_event_type=event,
            extracted_event_date=datetime.now(timezone.utc).date().isoformat(),
            extracted_progress=progress
        ))

        if top:
            db.add(Match(
                match_uuid=str(uuid.uuid4()), project_id=project_id,
                report_uuid=report_uuid_val, extracted_text=text,
                extracted_discipline=discipline, extracted_location=location,
                extracted_date=datetime.now(timezone.utc).date().isoformat(),
                extracted_progress=progress, event_type=event,
                confidence=top["confidence"],
                match_signal="Explicit ID + metadata + fuzzy + semantic" if top["confidence"] >= 0.85 else "Metadata + fuzzy + semantic review",
                candidates_json=json.dumps(candidates),
                assigned_activity_id=top["activity_id"],
                status=status, created_at=now()
            ))

        await db.commit()

    return {
        "message": "Field report extracted, normalized, and matched.",
        "report_id": report_uuid_val,
        "matched_count": len(candidates),
        "ambiguous_count": 0 if status == "accepted" else 1,
        "extracted": {
            "discipline": discipline, "location": location,
            "event_type": event,
            "event_date": datetime.now(timezone.utc).date().isoformat(),
            "progress_percentage": progress
        }
    }

@api.post("/projects/{project_id}/verify-match")
async def verify_match(project_id: str, req: VerifyReq):
    async with AsyncSessionLocal() as db:
        match = (await db.execute(select(Match).where(Match.match_uuid == req.match_id, Match.project_id == project_id))).scalar_one_or_none()
        if not match: raise HTTPException(404, "Match item not found.")

        status = "accepted" if req.action in {"accept","choose"} else "rejected"
        target = req.chosen_activity_id or match.assigned_activity_id
        match.status = status; match.assigned_activity_id = target
        match.verified_by = req.verified_by; match.verified_at = now()

        if status == "accepted":
            activity = (await db.execute(select(Activity).where(Activity.project_id == project_id, Activity.activity_id == target))).scalar_one_or_none()
            if activity:
                activity.progress_percentage = match.extracted_progress or 0
                activity.status = "Completed" if (match.extracted_progress or 0) >= 100 else "In Progress"
                if match.event_type == "START" and match.extracted_date:
                    activity.actual_start = match.extracted_date

        db.add(AuditLog(
            log_uuid=str(uuid.uuid4()), project_id=project_id,
            event=f"Match {status}",
            detail=f"{target} · {match.extracted_progress or 0}% · verified by {req.verified_by}",
            created_at=now()
        ))
        await db.commit()

    return {"message": f"Match {status} and audit trail updated."}

# ============================================================
# CORS + mount router
# ============================================================
app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"]
)
logging.basicConfig(level=logging.INFO)