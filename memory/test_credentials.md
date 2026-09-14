# Test Credentials — IntelliPlan Project Scheduling App

## Admin (only account permitted to reach the Admin Dashboard)
- Email: durai@gmail.com
- Password: Durai@2485

## Project Manager (Planner) — seeded on project ELEC-1024-U3
- Email: pm@intelliplan.com
- Password: pm123

## Site Engineer — seeded on project ELEC-1024-U3
- Email: eng@intelliplan.com
- Password: eng123

## Supervisor — seeded on project ELEC-1024-U3
- Email: sup@intelliplan.com
- Password: sup123

## Notes
- Admin login redirects to `/admin` (Project Creation Governance dashboard).
- PM login redirects to `/pm-dashboard` (Project & Team management, then Workspace).
- Engineer / Supervisor login redirects to `/project-workspace/:projectId` scoped by their approved project.
- Only the admin account above may reach `/admin`; all other roles will see "Access Restricted".
- Demo project `ELEC-1024-U3` (Greenfield Industrial Expansion) is pre-approved and seeded with L1–L6 activities.
- Database: MySQL (Railway for production, local MySQL for development).
