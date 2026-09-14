"""IntelliPlan backend API tests"""
import io
import os
import uuid

import pytest
import requests

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/") if os.environ.get("REACT_APP_BACKEND_URL") else None
if not BASE_URL:
    # Fallback to reading frontend .env
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().rstrip("/")


@pytest.fixture(scope="module")
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


# ------------------ AUTH ------------------
class TestAuth:
    def test_admin_login_success(self, s):
        r = s.post(f"{BASE_URL}/api/auth/login", json={"email": "durai@gmail.com", "password": "Durai@2484"})
        assert r.status_code == 200
        d = r.json()
        assert d["role"] == "admin"
        assert d["email"] == "durai@gmail.com"

    def test_old_admin_blocked(self, s):
        r = s.post(f"{BASE_URL}/api/auth/login", json={"email": "admin@intelliplan.com", "password": "admin123"})
        assert r.status_code == 401

    def test_pm_login(self, s):
        r = s.post(f"{BASE_URL}/api/auth/login", json={"email": "pm@intelliplan.com", "password": "pm123"})
        assert r.status_code == 200
        assert r.json()["role"] == "pm"
        assert r.json()["project_id"] == "ELEC-1024-U3"

    def test_engineer_login(self, s):
        r = s.post(f"{BASE_URL}/api/auth/login", json={"email": "eng@intelliplan.com", "password": "eng123"})
        assert r.status_code == 200
        assert r.json()["role"] == "engineer"

    def test_supervisor_login(self, s):
        r = s.post(f"{BASE_URL}/api/auth/login", json={"email": "sup@intelliplan.com", "password": "sup123"})
        assert r.status_code == 200
        assert r.json()["role"] == "supervisor"

    def test_invalid_login(self, s):
        r = s.post(f"{BASE_URL}/api/auth/login", json={"email": "nope@x.com", "password": "x"})
        assert r.status_code == 401


# ------------------ ADMIN + PROJECT CREATION ------------------
class TestProjectCreation:
    project_id = f"TEST-2026-{uuid.uuid4().hex[:4].upper()}"
    pm_email = f"TEST_pm_{uuid.uuid4().hex[:6]}@x.com"

    def test_invalid_project_id_format(self, s):
        r = s.post(f"{BASE_URL}/api/projects/request-creation", json={
            "name": "T", "email": f"TEST_bad_{uuid.uuid4().hex[:5]}@x.com", "password": "p",
            "project_id": "!!!", "project_title": "t", "project_description": "d"
        })
        assert r.status_code == 400
        assert "letters" in r.json()["detail"].lower() or "hyphen" in r.json()["detail"].lower()

    def test_create_project_pending(self, s):
        r = s.post(f"{BASE_URL}/api/projects/request-creation", json={
            "name": "TEST PM", "email": TestProjectCreation.pm_email, "password": "pw123",
            "project_id": TestProjectCreation.project_id,
            "project_title": "Test Project", "project_description": "desc"
        })
        assert r.status_code == 200, r.text
        assert r.json()["project_id"] == TestProjectCreation.project_id

    def test_duplicate_project_id(self, s):
        r = s.post(f"{BASE_URL}/api/projects/request-creation", json={
            "name": "X", "email": f"TEST_dup_{uuid.uuid4().hex[:5]}@x.com", "password": "p",
            "project_id": TestProjectCreation.project_id,
            "project_title": "t", "project_description": "d"
        })
        assert r.status_code == 400
        assert "already exists" in r.json()["detail"].lower()

    def test_pm_cannot_login_before_approval(self, s):
        r = s.post(f"{BASE_URL}/api/auth/login", json={"email": TestProjectCreation.pm_email, "password": "pw123"})
        assert r.status_code == 403

    def test_admin_sees_project_pending(self, s):
        r = s.get(f"{BASE_URL}/api/admin/projects")
        assert r.status_code == 200
        proj = next((p for p in r.json() if p["project_id"] == TestProjectCreation.project_id), None)
        assert proj is not None
        assert proj["status"] == "pending"

    def test_admin_approves(self, s):
        r = s.post(f"{BASE_URL}/api/admin/projects/{TestProjectCreation.project_id}/action",
                   json={"action": "approve"})
        assert r.status_code == 200
        assert r.json()["status"] == "approved"

    def test_pm_can_login_after_approval(self, s):
        r = s.post(f"{BASE_URL}/api/auth/login",
                   json={"email": TestProjectCreation.pm_email, "password": "pw123"})
        assert r.status_code == 200


# ------------------ ACCESS REQUEST FLOW ------------------
class TestAccessRequest:
    eng_email = f"TEST_eng_{uuid.uuid4().hex[:6]}@x.com"
    req_id = None

    def test_request_access(self, s):
        r = s.post(f"{BASE_URL}/api/projects/request-access", json={
            "name": "TEST Eng", "email": TestAccessRequest.eng_email, "password": "pw",
            "role": "engineer", "project_id": "ELEC-1024-U3", "details": "need access"
        })
        assert r.status_code == 200

    def test_request_access_unknown_project(self, s):
        r = s.post(f"{BASE_URL}/api/projects/request-access", json={
            "name": "x", "email": f"TEST_{uuid.uuid4().hex[:5]}@x.com", "password": "p",
            "role": "engineer", "project_id": "NOPE-9999-Z9", "details": ""
        })
        assert r.status_code == 404

    def test_eng_cannot_login_before_pm_approval(self, s):
        r = s.post(f"{BASE_URL}/api/auth/login",
                   json={"email": TestAccessRequest.eng_email, "password": "pw"})
        # eng@intelliplan.com is whitelisted; TEST_eng is not, must be 403
        assert r.status_code == 403

    def test_pm_sees_request(self, s):
        r = s.get(f"{BASE_URL}/api/pm/my-project", params={"email": "pm@intelliplan.com"})
        assert r.status_code == 200
        d = r.json()
        pending = [x for x in d["access_requests"] if x["email"] == TestAccessRequest.eng_email]
        assert pending, "PM did not receive access request"
        TestAccessRequest.req_id = pending[0]["id"]

    def test_pm_approves_access(self, s):
        assert TestAccessRequest.req_id
        r = s.post(f"{BASE_URL}/api/pm/access-requests/{TestAccessRequest.req_id}/action",
                   json={"action": "approve"})
        assert r.status_code == 200
        assert r.json()["status"] == "approved"

    def test_eng_can_login_after_approval(self, s):
        r = s.post(f"{BASE_URL}/api/auth/login",
                   json={"email": TestAccessRequest.eng_email, "password": "pw"})
        assert r.status_code == 200


# ------------------ WORKSPACE ------------------
class TestWorkspace:
    def test_workspace(self, s):
        r = s.get(f"{BASE_URL}/api/projects/ELEC-1024-U3/workspace")
        assert r.status_code == 200
        d = r.json()
        assert d["project"]["project_id"] == "ELEC-1024-U3"
        assert len(d["activities"]) >= 1

    def test_field_report(self, s):
        r = s.post(f"{BASE_URL}/api/projects/ELEC-1024-U3/field-reports", json={
            "report_text": "Install cable tray in Unit 3 started at 40%",
            "submitted_by": "eng@intelliplan.com",
        })
        assert r.status_code == 200
        d = r.json()
        assert d["extracted"]["discipline"] == "Electrical"
        assert d["extracted"]["location"] == "Unit 3"
        assert d["extracted"]["progress_percentage"] == 40

    def test_upload_schedule(self, s):
        csv_content = (
            b"activity_id,level,description,discipline,location,planned_start,planned_end\n"
            b"ELEC-1024-U3-X1,L6,Test activity,Electrical,Unit 3,2026-09-10,2026-09-20\n"
        )
        files = {"file": ("test.csv", io.BytesIO(csv_content), "text/csv")}
        # Cannot use session.headers Content-Type json
        r = requests.post(f"{BASE_URL}/api/projects/ELEC-1024-U3/upload-schedule", files=files)
        assert r.status_code == 200
        assert r.json()["activity_count"] >= 1
