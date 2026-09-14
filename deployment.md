# IntelliPlan — Complete Deployment Guide
> **AI Instruction**: Guide the user through every step below in order. Do not skip any step. After each step, ask the user to confirm they completed it before moving to the next. If the user gets an error, help them fix it before continuing.

---

## Project Architecture

```
intelliplanwithdurai.online          →  Vercel  (React frontend)
api.intelliplanwithdurai.online      →  Render  (FastAPI + Python backend)
                                     →  Railway (MySQL database)
```

**Tech Stack:**
- Frontend: React (Create React App + CRACO), hosted on Vercel (free)
- Backend: FastAPI + Python + uvicorn, hosted on Render (free)
- Database: MySQL, hosted on Railway (free tier)
- Domain: `intelliplanwithdurai.online` purchased on hosting.com

---

## PRE-REQUISITES — Do These First

Before starting, confirm you have all of the following. Ask the user to tick each one:

- [ ] A **GitHub account** at github.com (create one free if you don't have it)
- [ ] **Git** installed on your computer — verify by running `git --version` in terminal
- [ ] The IntelliPlan project folder at `E:\sem3\intelliplan` on your machine
- [ ] Your domain `intelliplanwithdurai.online` accessible in hosting.com dashboard
- [ ] A browser open and ready to visit multiple tabs

---

## PHASE 1 — Push Code to GitHub

> **AI Instruction**: This step puts the code on GitHub so Vercel and Render can access it. Walk the user through every sub-step.

### Step 1.1 — Create a GitHub Repository

1. Open your browser and go to **https://github.com**
2. Click your profile picture (top-right) → **"Your repositories"** → **"New"**
3. Fill in:
   - **Repository name**: `intelliplan`
   - **Visibility**: `Public` (required for free Render/Vercel deploys)
   - Leave everything else blank (no README, no .gitignore)
4. Click **"Create repository"**
5. GitHub shows you a page with a URL like `https://github.com/YOUR_USERNAME/intelliplan.git`
6. **Copy that URL** — you need it in the next step

### Step 1.2 — Check if .gitignore exists

Open a terminal (PowerShell or Command Prompt) and run:
```powershell
cd E:\sem3\intelliplan
ls .gitignore
```
If the file is missing, create it now by running:
```powershell
@"
# Python
__pycache__/
*.pyc
*.pyo
*.pyd
.env
backend/.env

# Node
node_modules/
frontend/build/
frontend/.env.local

# OS
.DS_Store
Thumbs.db
"@ | Out-File -FilePath .gitignore -Encoding utf8
```

### Step 1.3 — Initialize Git and Push

Run each command one at a time. Wait for each to finish before running the next:

```powershell
cd E:\sem3\intelliplan
git init
git add .
git commit -m "Initial IntelliPlan deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/intelliplan.git
git push -u origin main
```

> **Replace `YOUR_USERNAME`** with your actual GitHub username.

**Expected result**: Terminal shows something like `Branch 'main' set up to track remote branch 'main' from 'origin'.`

> **AI Instruction**: If user sees "remote: Repository not found" — they used the wrong URL. Ask them to re-copy the URL from their GitHub repository page and re-run the `git remote` and `git push` commands.

### Step 1.4 — Verify on GitHub

1. Go to `https://github.com/YOUR_USERNAME/intelliplan`
2. You should see folders: `backend/`, `frontend/`, `deployment.md`, etc.
3. ✅ **Confirm this before continuing**

---

## PHASE 2 — Set Up Railway MySQL Database

> **AI Instruction**: Railway provides a free MySQL database. The user must get a connection string from here before deploying the backend.

### Step 2.1 — Create Railway Account

1. Go to **https://railway.app**
2. Click **"Login"** → **"Login with GitHub"** → Authorize Railway
3. You land on the Railway dashboard

### Step 2.2 — Create a MySQL Database

1. Click **"New Project"** (top-right or center of screen)
2. Click **"Provision MySQL"** (or search for MySQL in the template list)
3. Railway spins up a MySQL instance — wait about 30 seconds
4. A card labeled **"MySQL"** appears in your project

### Step 2.3 — Get the Connection String

1. Click on the **MySQL card**
2. Click the **"Connect"** tab (or "Variables" tab)
3. Look for a field called **"MySQL URL"** or **"DATABASE_URL"**
4. It looks like this:
   ```
   mysql://root:AbCdEfGhIj@monorail.proxy.rlwy.net:12345/railway
   ```
5. Click the **copy icon** next to it
6. **Paste it somewhere safe** (Notepad or Notes app) — you will use it in Phase 3

> **AI Instruction**: If user cannot find "Provision MySQL", tell them to click "New Project" → "Empty Project" → then click "+" button inside the project → "Database" → "Add MySQL".

---

## PHASE 3 — Deploy Backend to Render

> **AI Instruction**: Render hosts the Python FastAPI backend for free. Walk through every sub-step carefully.

### Step 3.1 — Create Render Account

1. Go to **https://render.com**
2. Click **"Get Started for Free"**
3. Click **"Continue with GitHub"** → Authorize Render
4. You land on the Render dashboard

### Step 3.2 — Create a New Web Service

1. Click **"New +"** button (top-right of dashboard)
2. Click **"Web Service"**
3. Click **"Connect a repository"**
4. Find and click on `intelliplan` in the list
5. If you don't see it, click **"Configure account"** → grant access to the `intelliplan` repo → come back and try again

### Step 3.3 — Configure the Web Service

Fill in these fields exactly:

| Setting | Value |
|---|---|
| **Name** | `intelliplan-api` |
| **Region** | Singapore (or closest to you) |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Runtime** | `Python 3` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn server:app --host 0.0.0.0 --port $PORT` |
| **Instance Type** | `Free` |

> **AI Instruction**: The user MUST set Root Directory to `backend`. If they leave it blank, Render will try to run from the root and fail because requirements.txt is inside `backend/`.

### Step 3.4 — Set Environment Variables in Render

**Before clicking Create**, scroll down to the **"Environment Variables"** section and add these two variables:

**Variable 1:**
- Key: `DATABASE_URL`
- Value: paste the Railway MySQL URL from Step 2.3
  - The URL starts with `mysql://` but the backend needs `mysql+aiomysql://` for async support
  - So if your URL is: `mysql://root:pass@host:port/railway`
  - Change it to: `mysql+aiomysql://root:pass@host:port/railway`

**Variable 2:**
- Key: `CORS_ORIGINS`
- Value: `https://intelliplanwithdurai.online,https://www.intelliplanwithdurai.online`

> **AI Instruction**: Remind the user — no spaces around the comma in CORS_ORIGINS, and no trailing slash at the end of the URLs.

### Step 3.5 — Deploy the Backend

1. Click **"Create Web Service"** at the bottom of the page
2. Render starts building — you see a log window with output
3. Wait for the log to show:
   ```
   ==> Starting service
   INFO:     Application startup complete.
   ```
4. This takes **3–7 minutes** on first deploy

### Step 3.6 — Test the Backend

1. At the top of your Render service page, find the URL — it looks like:
   `https://intelliplan-api.onrender.com`
2. Open that URL in your browser and add `/api/` at the end:
   `https://intelliplan-api.onrender.com/api/`
3. You should see JSON like:
   ```json
   {"service": "IntelliPlan", "status": "ok", "db": "MySQL"}
   ```
4. ✅ **If you see this JSON — backend is working. Confirm before continuing.**

> **AI Instruction**: If the user sees a 500 error or "Application failed to start", check the Render logs. Common causes: wrong DATABASE_URL format (missing `+aiomysql`), or DATABASE_URL not set. Help them fix the env var and click "Manual Deploy" → "Deploy latest commit".

---

## PHASE 4 — Deploy Frontend to Vercel

> **AI Instruction**: Vercel hosts the React frontend. This phase requires updating the frontend's backend URL before deploying.

### Step 4.1 — Update the Frontend Environment Variable

On your computer, open the file `E:\sem3\intelliplan\frontend\.env`

If it doesn't exist, create it. Set its content to:
```env
REACT_APP_BACKEND_URL=https://intelliplan-api.onrender.com
```

> **Note**: Use the Render URL from Step 3.6 — NOT your custom domain yet (we'll switch to the custom domain URL in Phase 5 after DNS is set up).

### Step 4.2 — Commit and Push the Change

Run in terminal:
```powershell
cd E:\sem3\intelliplan
git add frontend/.env
git commit -m "Set production backend URL"
git push
```

### Step 4.3 — Create Vercel Account

1. Go to **https://vercel.com**
2. Click **"Sign Up"**
3. Click **"Continue with GitHub"** → Authorize Vercel
4. You land on the Vercel dashboard

### Step 4.4 — Import the Project

1. Click **"Add New..."** → **"Project"**
2. You see a list of your GitHub repos — find `intelliplan` and click **"Import"**
3. If you don't see it, click **"Adjust GitHub App Permissions"** → grant access → come back

### Step 4.5 — Configure the Project

Fill in these settings on the configuration screen:

| Setting | Value |
|---|---|
| **Project Name** | `intelliplan` |
| **Framework Preset** | `Create React App` |
| **Root Directory** | `frontend` ← **IMPORTANT: click "Edit" and type `frontend`** |
| **Build Command** | `yarn build` |
| **Output Directory** | `build` |
| **Install Command** | `yarn install` |

> **AI Instruction**: The Root Directory MUST be set to `frontend`. Click the "Edit" pencil icon next to Root Directory and type `frontend`. If left blank, Vercel builds from the root and fails.

### Step 4.6 — Add Environment Variable

Scroll down to **"Environment Variables"** section and add:

| Key | Value |
|---|---|
| `REACT_APP_BACKEND_URL` | `https://intelliplan-api.onrender.com` |

### Step 4.7 — Deploy

1. Click **"Deploy"** button
2. Vercel builds the app — watch the logs
3. Wait for the success animation and a URL like:
   `https://intelliplan-abc123.vercel.app`
4. Click that URL — you should see the IntelliPlan homepage
5. ✅ **Confirm you can see the homepage before continuing**

> **AI Instruction**: If Vercel build fails, look at the error in the log. Common issue: `yarn build` fails because of a missing environment variable or a JSX syntax error. If there's a syntax error, the user needs to fix the code and push again.

---

## PHASE 5 — Connect Custom Domain `intelliplanwithdurai.online`

> **AI Instruction**: This phase connects the real domain to both Vercel (frontend) and Render (backend API). It involves editing DNS records on hosting.com. Take it one sub-step at a time.

### Step 5.1 — Add Domain to Vercel (Frontend)

1. In your Vercel project, click **"Settings"** tab
2. Click **"Domains"** in the left sidebar
3. In the input box, type `intelliplanwithdurai.online` → click **"Add"**
4. Vercel shows a table with DNS records you need to add — leave this tab open
5. Also add `www.intelliplanwithdurai.online` as a second domain

Vercel will show you records like:

| Type | Name/Host | Value |
|---|---|---|
| `A` | `@` | `76.76.21.21` |
| `CNAME` | `www` | `cname.vercel-dns.com` |

> **AI Instruction**: Tell the user to note down or screenshot these exact values shown in their Vercel dashboard before going to the next step.

### Step 5.2 — Add Custom Domain to Render (Backend)

1. In your Render service (`intelliplan-api`), click **"Settings"**
2. Scroll to **"Custom Domains"** section
3. Click **"Add Custom Domain"**
4. Type: `api.intelliplanwithdurai.online` → click **"Save"**
5. Render shows a CNAME target — it looks like: `intelliplan-api.onrender.com`
6. **Note this CNAME target value down** — you need it in the next step

### Step 5.3 — Edit DNS Records at hosting.com

1. Open a new tab and go to **https://www.hosting.com**
2. Log in to your account
3. Go to **"My Domains"** or **"Domain Management"**
4. Find `intelliplanwithdurai.online` and click **"Manage"** or **"DNS"**
5. Look for **"DNS Zone Editor"**, **"DNS Settings"**, or **"DNS Management"**

Now add the following DNS records. For each one, click **"Add Record"** (or the `+` button):

---

**Record 1 — Frontend root domain:**
```
Type:  A
Host:  @
Value: 76.76.21.21
TTL:   3600 (or "Automatic")
```

---

**Record 2 — Frontend www subdomain:**
```
Type:  CNAME
Host:  www
Value: cname.vercel-dns.com
TTL:   3600
```

---

**Record 3 — Backend API subdomain:**
```
Type:  CNAME
Host:  api
Value: intelliplan-api.onrender.com
TTL:   3600
```

6. After adding all 3 records, click **"Save"** or **"Apply"**

> **AI Instruction**: If the user already has an A record for `@`, they need to delete the old one first before adding the new one. They cannot have two A records for the same host. Help them identify and delete conflicting records.

### Step 5.4 — Wait for DNS Propagation

DNS changes take time. Standard timeline:
- **5–15 minutes**: Usually works for most users
- **Up to 48 hours**: Maximum worldwide propagation time

Check propagation at: **https://dnschecker.org**
1. Type `intelliplanwithdurai.online` → click **"Search"**
2. Wait until you see green checkmarks across most locations

> **AI Instruction**: Tell the user not to panic if DNS doesn't work immediately. Ask them to wait 15 minutes and check again. If after 2 hours it still doesn't work, revisit Step 5.3 to check the records were saved correctly.

### Step 5.5 — Verify Domain in Vercel

1. Go back to Vercel → Settings → Domains
2. Both `intelliplanwithdurai.online` and `www.intelliplanwithdurai.online` should show a green **"Valid Configuration"** status
3. Vercel automatically provisions an SSL certificate (HTTPS) — this can take up to 10 minutes after DNS is valid

### Step 5.6 — Verify Domain in Render

1. Go to Render → your service → Settings → Custom Domains
2. `api.intelliplanwithdurai.online` should show **"Verified"**

---

## PHASE 6 — Final URL Update (Switch to Custom Domain)

> **AI Instruction**: Now that the custom domain is live, update both services to use the final domain URLs.

### Step 6.1 — Update Backend CORS_ORIGINS in Render

1. In Render, go to your `intelliplan-api` service
2. Click **"Environment"** tab
3. Find `CORS_ORIGINS` and update the value to:
   ```
   https://intelliplanwithdurai.online,https://www.intelliplanwithdurai.online
   ```
4. Click **"Save Changes"** — Render will redeploy automatically

### Step 6.2 — Update Frontend Backend URL in Vercel

1. In Vercel, go to your project → **"Settings"** → **"Environment Variables"**
2. Find `REACT_APP_BACKEND_URL` and click **"Edit"**
3. Change the value to:
   ```
   https://api.intelliplanwithdurai.online
   ```
4. Click **"Save"**
5. Go to **"Deployments"** tab → click the three dots `...` on the latest deployment → **"Redeploy"**

---

## PHASE 7 — Final Verification Checklist

> **AI Instruction**: Go through every item in this checklist with the user. Open each URL and confirm the expected result.

Test each URL in a browser:

- [ ] **`https://intelliplanwithdurai.online`** → IntelliPlan landing page loads with the lock icon (HTTPS) in the browser address bar
- [ ] **`https://www.intelliplanwithdurai.online`** → Same page loads (www redirect works)
- [ ] **`https://api.intelliplanwithdurai.online/api/`** → Shows JSON: `{"service": "IntelliPlan", "status": "ok", "db": "MySQL"}`
- [ ] **`https://api.intelliplanwithdurai.online/docs`** → Shows FastAPI Swagger UI
- [ ] Click **"Sign In"** on the homepage → Login page loads
- [ ] Login with `durai@gmail.com` / `Durai@2485` → Admin dashboard loads
- [ ] Login with `pm@intelliplan.com` / `pm123` → PM dashboard loads
- [ ] Login with `eng@intelliplan.com` / `eng123` → Project Workspace loads
- [ ] Left sidebar shows 5 navigation items
- [ ] Sidebar toggle button (☰) in top-left collapses and expands the sidebar
- [ ] Click each sidebar item — each section loads correctly

---

## Demo Accounts (Auto-Created on First Backend Startup)

| Role | Email | Password |
|---|---|---|
| Admin | `durai@gmail.com` | `Durai@2485` |
| Project Manager | `pm@intelliplan.com` | `pm123` |
| Site Engineer | `eng@intelliplan.com` | `eng123` |
| Supervisor | `sup@intelliplan.com` | `sup123` |

---

## Troubleshooting Guide

> **AI Instruction**: If the user reports any of the following issues, use this table to guide them to the fix.

| Problem | Symptom | Fix |
|---|---|---|
| Backend won't start | Render logs show `sqlalchemy` or `database` error | Check `DATABASE_URL` in Render env vars. Make sure it uses `mysql+aiomysql://` not `mysql://` |
| Frontend shows "Network Error" | API calls fail in browser console | Check `REACT_APP_BACKEND_URL` in Vercel env vars. Redeploy frontend after fixing. |
| CORS error in browser | Console shows "blocked by CORS policy" | In Render, check `CORS_ORIGINS` — add the exact frontend domain with no trailing slash, no spaces |
| Domain not loading | Browser shows "This site can't be reached" | DNS not propagated yet. Wait 15–30 min. Check at dnschecker.org |
| HTTPS not working | Browser shows "Not Secure" | Wait 10–15 min after DNS is valid — Vercel/Render auto-provision SSL. If still failing, remove and re-add the domain in Vercel. |
| Render is very slow | First request after long pause takes 30+ seconds | Render free tier cold start. Normal behavior. Consider upgrading to Starter ($7/mo) to avoid. |
| Login fails | "Invalid credentials" error | Database may not have been seeded. Check Render logs for startup messages. Trigger manual re-deploy. |
| Vercel build fails | Build log shows error | Most likely Root Directory not set to `frontend`, or missing env var. Fix and redeploy. |
| Git push fails | "Authentication failed" | GitHub requires a Personal Access Token. Go to GitHub → Settings → Developer Settings → Personal access tokens → Generate new token (classic) with `repo` scope. Use that token as your password. |

---

## Environment Variables Reference

### Backend — set in Render Dashboard

| Variable | Example Value | Description |
|---|---|---|
| `DATABASE_URL` | `mysql+aiomysql://root:pass@host:port/railway` | Railway MySQL connection string — must use `+aiomysql` prefix |
| `CORS_ORIGINS` | `https://intelliplanwithdurai.online,https://www.intelliplanwithdurai.online` | Comma-separated list of allowed frontend origins. No spaces. No trailing slash. |

### Frontend — set in Vercel Dashboard

| Variable | Example Value | Description |
|---|---|---|
| `REACT_APP_BACKEND_URL` | `https://api.intelliplanwithdurai.online` | Full URL of the Render backend — no trailing slash |

---

## Local Development (Quick Reference)

```powershell
# Terminal 1 — Backend
cd E:\sem3\intelliplan\backend
python -m uvicorn server:app --reload --port 8000
# API: http://localhost:8000
# Docs: http://localhost:8000/docs

# Terminal 2 — Frontend
cd E:\sem3\intelliplan\frontend
yarn start
# App: http://localhost:3000
```

`backend/.env` (for local only — do NOT commit to GitHub):
```env
DATABASE_URL="mysql+aiomysql://root:anand@localhost:3306/intelliplan"
CORS_ORIGINS="http://localhost:3000"
```

`frontend/.env` (for local only):
```env
REACT_APP_BACKEND_URL=http://localhost:8000
```

---

*IntelliPlan Project Scheduling App — intelliplanwithdurai.online*
*Developed by Team Durai: Anand Swarup J S, Mohith Raj, Kishan Kumar, Ashwin K, Shrey Singh, Krishti Poddar*


---

## Overview

```
intelliplanwithdurai.online       →  Vercel (React frontend)
api.intelliplanwithdurai.online   →  Render (FastAPI backend)  →  Railway MySQL
```

---

## Step 1 — Set Up Railway MySQL Database

### 1.1 Create a Railway Account
1. Go to **[railway.app](https://railway.app)** and sign up (GitHub login recommended)
2. Click **"New Project"**
3. Select **"Provision MySQL"** → Railway will spin up a free MySQL instance

### 1.2 Get Your Connection String
1. Click on the **MySQL** service in your Railway project
2. Go to **"Connect"** tab
3. Copy the **"MySQL URL"** — it looks like:
   ```
   mysql://root:AbCdEfGhIj12@monorail.proxy.rlwy.net:12345/railway
   ```
4. **Save this URL** — you will need it in Step 2 and Step 3

---

## Step 2 — Deploy Backend to Render

### 2.1 Create a Render Account
1. Go to **[render.com](https://render.com)** and sign up (GitHub login recommended)

### 2.2 Push to GitHub First
```bash
cd e:\sem3\intelliplan
git init
git add .
git commit -m "Initial IntelliPlan deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/intelliplan.git
git push -u origin main
```

### 2.3 Create Web Service on Render
1. In Render, click **"New +"** → **"Web Service"**
2. Connect your GitHub repo: `intelliplan`
3. Configure:

| Setting | Value |
|---|---|
| **Name** | `intelliplan-api` |
| **Root Directory** | `backend` |
| **Environment** | `Python 3` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn server:app --host 0.0.0.0 --port $PORT` |
| **Instance Type** | Free |

### 2.4 Set Environment Variables in Render
In the **"Environment"** tab, add:

| Key | Value |
|---|---|
| `DATABASE_URL` | `mysql://root:PASSWORD@HOST:PORT/railway` ← from Railway Step 1.2 |
| `CORS_ORIGINS` | `https://intelliplanwithdurai.online,https://www.intelliplanwithdurai.online,https://intelliplan-frontend.vercel.app` |

### 2.5 Deploy
- Click **"Create Web Service"** — first deployment takes ~3–5 minutes
- Once live: `https://intelliplan-api.onrender.com`
- Test: open `https://intelliplan-api.onrender.com/api/` — should see `{"service":"IntelliPlan","status":"ok","db":"MySQL"}`

---

## Step 3 — Deploy Frontend to Vercel

### 3.1 Create a Vercel Account
1. Go to **[vercel.com](https://vercel.com)** → **"Sign Up"**
2. **Sign up with GitHub** — recommended

### 3.2 Update Frontend .env
Open `frontend/.env` — confirm it has:
```env
REACT_APP_BACKEND_URL=https://intelliplan-api.onrender.com
```
Commit and push:
```bash
git add frontend/.env
git commit -m "Update backend URL for production"
git push
```

### 3.3 Import Project in Vercel
1. In Vercel dashboard, click **"Add New..."** → **"Project"**
2. Import your GitHub repository: `intelliplan`
3. Configure:

| Setting | Value |
|---|---|
| **Root Directory** | `frontend` |
| **Framework Preset** | `Create React App` |
| **Build Command** | `yarn build` |
| **Output Directory** | `build` |
| **Install Command** | `yarn install` |

### 3.4 Set Environment Variables in Vercel
In the **"Environment Variables"** section:

| Key | Value |
|---|---|
| `REACT_APP_BACKEND_URL` | `https://intelliplan-api.onrender.com` |

### 3.5 Deploy
- Click **"Deploy"** — takes ~2–4 minutes
- Once live: `https://intelliplan-abc123.vercel.app`

---

## Step 4 — Connect Custom Domain `intelliplanwithdurai.online`

### 4.1 Add Domain to Vercel (Frontend)
1. In your Vercel project: **"Settings"** → **"Domains"**
2. Add: `intelliplanwithdurai.online`
3. Add: `www.intelliplanwithdurai.online`
4. Vercel shows DNS records — copy them

### 4.2 Add Subdomain to Render (Backend API)
1. In your Render service: **"Settings"** → **"Custom Domains"**
2. Add: `api.intelliplanwithdurai.online`
3. Copy the CNAME target shown (e.g. `intelliplan-api.onrender.com`)

### 4.3 Configure DNS at hosting.com
1. Log in to **[hosting.com](https://hosting.com)**
2. Go to **Domain Management** → `intelliplanwithdurai.online` → **DNS Zone Editor**
3. Add these records:

**For Vercel (frontend — root domain):**
| Type | Name | Value | TTL |
|---|---|---|---|
| `A` | `@` | `76.76.21.21` | 3600 |
| `CNAME` | `www` | `cname.vercel-dns.com` | 3600 |

**For Render (backend API — subdomain):**
| Type | Name | Value | TTL |
|---|---|---|---|
| `CNAME` | `api` | `intelliplan-api.onrender.com` | 3600 |

4. Save. DNS propagation: **5–30 minutes** (max 48 hours)

### 4.4 Final: Update URLs After Domain Is Live
Update Render env var:
```
CORS_ORIGINS = https://intelliplanwithdurai.online,https://www.intelliplanwithdurai.online
```

Update Vercel env var:
```
REACT_APP_BACKEND_URL = https://api.intelliplanwithdurai.online
```
Then redeploy both.

---

## Verify Full Deployment

- [ ] `https://intelliplanwithdurai.online` loads IntelliPlan homepage
- [ ] Hamburger ☰ button opens left nav with 3 options
- [ ] Sign In works with demo accounts
- [ ] Left sidebar visible after login
- [ ] `https://api.intelliplanwithdurai.online/api/` returns JSON

**Demo Accounts (auto-seeded on startup):**
| Role | Email | Password |
|---|---|---|
| Admin | `durai@gmail.com` | `Durai@2485` |
| Project Manager | `pm@intelliplan.com` | `pm123` |
| Site Engineer | `eng@intelliplan.com` | `eng123` |
| Supervisor | `sup@intelliplan.com` | `sup123` |

---

## Local Development

### Backend
```bash
cd e:\sem3\intelliplan\backend
pip install -r requirements.txt
# Edit .env: set DATABASE_URL to your Railway or local MySQL
uvicorn server:app --reload --port 8000
# API docs: http://localhost:8000/docs
```

### Frontend
```bash
cd e:\sem3\intelliplan\frontend
yarn install
# Edit .env: REACT_APP_BACKEND_URL=http://localhost:8000
yarn start
# App: http://localhost:3000
```

---

## Environment Variables Reference

### Backend (Render Dashboard)
| Variable | Description |
|---|---|
| `DATABASE_URL` | Railway MySQL URL: `mysql://user:pass@host:port/db` |
| `CORS_ORIGINS` | Comma-separated allowed origins (your domain URLs) |

### Frontend (Vercel Dashboard)
| Variable | Description |
|---|---|
| `REACT_APP_BACKEND_URL` | Full URL of your Render backend |

---

## Troubleshooting

| Issue | Fix |
|---|---|
| "Database connection failed" | Check `DATABASE_URL` in Render. Ensure Railway MySQL is running. |
| "CORS error" in browser | Add exact frontend URL to `CORS_ORIGINS` in Render. No trailing slash. |
| Domain not resolving | Wait up to 48h. Check at [dnschecker.org](https://dnschecker.org). |
| Render slow (first request) | Free tier cold-starts take ~30s. Upgrade to Starter ($7/mo) to avoid. |
| Build fails on Vercel | Ensure `Root Directory = frontend` and `yarn build` is the build command. |

---

*IntelliPlan Project Scheduling App — intelliplanwithdurai.online*
