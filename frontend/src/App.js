import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useParams, Link, useLocation } from "react-router-dom";
import axios from "axios";
import "./App.css";
import { Toaster, toast } from "sonner";
import {
  Shield, Building2, HardHat, FileText, CheckCircle2, XCircle, Clock,
  Upload, Search, UserCheck, AlertTriangle, ArrowRight, LogOut,
  Layers, Check, X, RefreshCw, BarChart3, Database, ChevronRight, Plus, Eye, CheckCheck,
  Menu, LayoutDashboard, FolderOpen, Users, Activity, ClipboardList, GitBranch, Settings
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";
const API = `${BACKEND_URL}/api`;

// ============================================================
// Role Gate
// ============================================================
const RoleGate = ({ user, roles, children }) => {
  if (!user) return (
    <div className="flex flex-col items-center justify-center py-20 space-y-4" data-testid="role-login-required">
      <div className="w-12 h-12 rounded-xl bg-[#e8f4fd] flex items-center justify-center">
        <Shield className="w-6 h-6 text-[#1e40af]" />
      </div>
      <h2 className="text-2xl font-bold text-[#111]">Sign in required</h2>
      <p className="text-sm text-[#888]">Use the main login window to access this project workspace.</p>
      <Link to="/login" className="btn-primary" data-testid="role-login-link">Go to Login</Link>
    </div>
  );
  if (roles && !roles.includes(user.role)) return (
    <div className="flex flex-col items-center justify-center py-20 space-y-4" data-testid="role-access-denied">
      <div className="w-12 h-12 rounded-xl bg-[#f5f5f5] flex items-center justify-center">
        <Shield className="w-6 h-6 text-[#666]" />
      </div>
      <h2 className="text-2xl font-bold text-[#111]">Access Restricted</h2>
      <p className="text-sm text-[#888]">This workspace is limited to the role assigned to this project.</p>
    </div>
  );
  return children;
};


// ============================================================
// Left Sidebar (authenticated dashboard layout)
// ============================================================
const Sidebar = ({ user, onLogout, isOpen, onToggle }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const currentTab = searchParams.get('tab') || 'schedule';
  const pid = user?.project_id || 'demo';

  const getTeamLink = () => {
    if (!user) return '/';
    if (user.role === 'admin') return '/admin';
    return '/pm-dashboard';
  };

  const navItems = user ? [
    {
      id: 'team-access',
      label: 'Team Access',
      icon: <Users className="w-4 h-4" />,
      to: getTeamLink(),
      active: location.pathname === '/pm-dashboard' || location.pathname === '/admin',
    },
    {
      id: 'schedule',
      label: 'Baseline Schedule',
      icon: <Layers className="w-4 h-4" />,
      to: `/project-workspace/${pid}?tab=schedule`,
      active: location.pathname.startsWith('/project-workspace') && currentTab === 'schedule',
    },
    {
      id: 'reports',
      label: 'Field Reports',
      icon: <FileText className="w-4 h-4" />,
      to: `/project-workspace/${pid}?tab=reports`,
      active: location.pathname.startsWith('/project-workspace') && currentTab === 'reports',
    },
    {
      id: 'verification',
      label: 'Verification Queue',
      icon: <UserCheck className="w-4 h-4" />,
      to: `/project-workspace/${pid}?tab=verification`,
      active: location.pathname.startsWith('/project-workspace') && currentTab === 'verification',
    },
    {
      id: 'audit',
      label: 'Audit Trail',
      icon: <ClipboardList className="w-4 h-4" />,
      to: `/project-workspace/${pid}?tab=audit`,
      active: location.pathname.startsWith('/project-workspace') && currentTab === 'audit',
    },
  ] : [];

  return (
    <nav className={`sidebar-nav${isOpen === false ? ' sidebar-closed' : ''}`}>
      {/* Brand + close button */}
      <div className="sidebar-brand" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="sidebar-brand-icon">IP</div>
          <div>
            <div className="sidebar-brand-name">IntelliPlan</div>
            <div className="sidebar-brand-sub">Project Scheduling</div>
          </div>
        </div>
        {/* Close (collapse) button inside sidebar */}
        <button
          onClick={onToggle}
          aria-label="Close sidebar"
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: 'none',
            borderRadius: 7,
            color: 'rgba(255,255,255,0.55)',
            cursor: 'pointer',
            padding: '5px 7px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            lineHeight: 1,
          }}
          title="Close sidebar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Nav Links */}
      <div className="sidebar-links">
        {user && (
          <>
            <span className="sidebar-section-label">Navigation</span>
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => navigate(item.to)}
                className={`sidebar-link ${item.active ? 'active' : ''}`}
                data-testid={`nav-${item.id}`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </>
        )}

        {!user && (
          <>
            <span className="sidebar-section-label">Get Started</span>
            <Link to="/login" className="sidebar-link">
              <Shield className="w-4 h-4" />
              <span>Sign In</span>
            </Link>
            <Link to="/request-access" className="sidebar-link">
              <HardHat className="w-4 h-4" />
              <span>Request Site Access</span>
            </Link>
            <Link to="/register-project" className="sidebar-link">
              <Building2 className="w-4 h-4" />
              <span>Create Project (PM)</span>
            </Link>
          </>
        )}
      </div>

      {/* User info + logout */}
      {user && (
        <div className="sidebar-footer">
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold text-white truncate">{user.name || user.email}</div>
              <div className="text-[10px] uppercase tracking-wider text-[#10b981] font-bold">{user.role}</div>
            </div>
            <button
              onClick={onLogout}
              className="p-1.5 text-[rgba(255,255,255,0.45)] hover:text-white hover:bg-[rgba(255,255,255,0.1)] rounded-lg transition"
              title="Logout"
              data-testid="logout-button"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

// ============================================================
// Landing Page Left Nav (hamburger panel)
// ============================================================
const LandingNav = ({ isOpen, onClose }) => {
  return (
    <>
      {/* Overlay */}
      <div
        className={`landing-nav-overlay ${isOpen ? 'open' : ''}`}
        onClick={onClose}
      />
      {/* Panel */}
      <div className={`landing-nav-panel ${isOpen ? 'open' : ''}`} role="dialog" aria-modal="true" aria-label="Navigation menu">
        <div className="landing-nav-header">
          <span className="landing-nav-title">IntelliPlan</span>
          <button className="landing-nav-close" onClick={onClose} aria-label="Close navigation">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="landing-nav-options">
          <p className="text-xs text-[#888] font-semibold uppercase tracking-wider px-2 mb-2">Choose an action</p>

          {/* Option 1: Sign In */}
          <Link to="/login" className="landing-nav-option" onClick={onClose} data-testid="landing-nav-signin">
            <div className="landing-nav-option-icon">
              <Shield className="w-5 h-5" />
            </div>
            <div className="landing-nav-option-content">
              <div className="landing-nav-option-title">Sign In</div>
              <div className="landing-nav-option-desc">Already created a project or working as an employee? Sign in to your portal.</div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#888] flex-shrink-0 mt-1" />
          </Link>

          {/* Option 2: Request Site Access */}
          <Link to="/request-access" className="landing-nav-option" onClick={onClose} data-testid="landing-nav-request-access">
            <div className="landing-nav-option-icon">
              <HardHat className="w-5 h-5" />
            </div>
            <div className="landing-nav-option-content">
              <div className="landing-nav-option-title">Request Site Access</div>
              <div className="landing-nav-option-desc">Request site access from your Project Manager to join an existing project.</div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#888] flex-shrink-0 mt-1" />
          </Link>

          {/* Option 3: Create Project as PM */}
          <Link to="/register-project" className="landing-nav-option" onClick={onClose} data-testid="landing-nav-create-project">
            <div className="landing-nav-option-icon">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="landing-nav-option-content">
              <div className="landing-nav-option-title">Create Project</div>
              <div className="landing-nav-option-desc">Log in as a Project Manager to create and manage a new infrastructure project.</div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#888] flex-shrink-0 mt-1" />
          </Link>
        </div>

        <div className="landing-nav-footer">
          IntelliPlan Project Scheduling App · intelliplanwithdurai.online
        </div>
      </div>
    </>
  );
};

// ============================================================
// Main App Layout
// ============================================================
const Layout = ({ user, onLogout, children }) => {
  const location = useLocation();
  const isLandingPage = location.pathname === '/';
  const [navOpen, setNavOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const touchStartX = React.useRef(null);

  // Swipe gesture: right-swipe opens, left-swipe closes
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (dx > 60 && touchStartX.current < 40) setSidebarOpen(true);  // swipe right from edge
    if (dx < -60) setSidebarOpen(false); // swipe left anywhere
    touchStartX.current = null;
  };

  return (
    <div
      className="app-shell"
      style={{ background: '#f5f5f5' }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Sidebar */}
      <Sidebar user={user} onLogout={onLogout} isOpen={sidebarOpen} onToggle={() => setSidebarOpen(o => !o)} />

      {/* Backdrop overlay when sidebar is open on mobile */}
      {sidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main content */}
      <div className="main-content">
        {/* Top bar */}
        <div className="main-topbar">
          <div className="flex items-center gap-3">
            {/* Sidebar toggle button — always visible */}
            <button
              className="sidebar-toggle-btn"
              onClick={() => setSidebarOpen(o => !o)}
              aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
              data-testid="sidebar-toggle-btn"
            >
              <span /><span /><span />
            </button>
            <div>
              <span className="text-[13px] font-semibold text-[#111]">
                {user ? `${user.name || user.email}` : 'IntelliPlan'}
              </span>
              {user && (
                <span className="ml-2 text-[10px] uppercase tracking-wider font-bold text-[#10b981]">
                  {user.role}
                </span>
              )}
            </div>
          </div>

          {!user && (
            <div className="flex items-center gap-2">
              <Link to="/login" className="btn-secondary text-[13px] py-1.5 px-3" data-testid="nav-login-link">
                Sign In
              </Link>
              <Link to="/register-project" className="btn-primary text-[13px] py-1.5 px-3" data-testid="nav-create-project-link">
                Create Project
              </Link>
            </div>
          )}
        </div>

        {/* Page content */}
        <div className="main-page">
          {children}
        </div>

        {/* Footer */}
        <footer className="bg-white border-t border-[#e5e5e5] py-5 text-center text-xs text-[#999] mt-auto space-y-1">
          <div>© {new Date().getFullYear()} IntelliPlan Enterprise · Advanced Construction Scheduling &amp; Field Matching · intelliplanwithdurai.online</div>
          <div className="text-[11px] text-[#bbb]">
            Developed by <span className="font-semibold text-[#888]">Team Durai</span> &nbsp;·&nbsp;
            Anand Swarup J S &nbsp;·&nbsp; Mohith Raj &nbsp;·&nbsp; Kishan Kumar &nbsp;·&nbsp; Ashwin K &nbsp;·&nbsp; Shrey Singh &nbsp;·&nbsp; Krishti Poddar
          </div>
        </footer>
      </div>

      {/* Landing nav panel */}
      <LandingNav isOpen={navOpen} onClose={() => setNavOpen(false)} />
    </div>
  );
};

// ============================================================
// 1. Home / Landing Page
// ============================================================
const Home = ({ user }) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-12 py-4" data-testid="home-page">
      {/* Hero */}
      <div className="max-w-3xl space-y-5">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#e8f4fd] border border-[#bfdbfe] text-[#1e40af] text-xs font-semibold tracking-wide">
          <span className="w-2 h-2 rounded-full bg-[#3b82f6] animate-pulse" />
          IntelliPlan 3.0 Enterprise Engine
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#111] leading-tight">
          AI-Powered Construction<br />
          <span className="text-[#10b981]">Project Scheduling</span>
        </h1>
        <p className="text-lg text-[#555] leading-relaxed max-w-2xl">
          From Baseline Schedules (L1–L6 Hierarchy) to automated Field Report parsing, semantic activity matching, and verified progress tracking with complete audit trails.
        </p>

        {/* CTA Buttons */}
        {user ? (
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={() => {
                if (user.role === 'admin') navigate('/admin');
                else if (user.role === 'pm') navigate('/pm-dashboard');
                else navigate(`/project-workspace/${user.project_id || 'demo'}`);
              }}
              className="btn-primary px-6 py-3 text-[15px]"
              data-testid="go-to-dashboard-btn"
            >
              <span>Access Your Dashboard</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3 pt-2">
            <Link to="/login" className="btn-primary px-6 py-3 text-[15px]" data-testid="home-signin-btn">
              <span>Sign In / Portal Access</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/register-project" className="btn-secondary px-6 py-3 text-[15px]" data-testid="home-register-project-btn">
              Request Project (PM)
            </Link>
            <Link to="/request-access" className="btn-ghost px-6 py-3 text-[15px] border border-[#e5e5e5]" data-testid="home-request-access-btn">
              Engineer / Supervisor Access
            </Link>
          </div>
        )}
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card hover:shadow-md transition space-y-3" data-testid="feature-card-1">
          <div className="w-10 h-10 rounded-lg bg-[#e8f4fd] flex items-center justify-center">
            <Shield className="w-5 h-5 text-[#1e40af]" />
          </div>
          <h3 className="text-lg font-bold text-[#111]">Admin Governance</h3>
          <p className="text-[#555] text-sm leading-relaxed">
            Centralized approval hub for project creation requests. Ensures unique project IDs and proper governance before planning commences.
          </p>
        </div>

        <div className="card hover:shadow-md transition space-y-3" data-testid="feature-card-2">
          <div className="w-10 h-10 rounded-lg bg-[#d1fae5] flex items-center justify-center">
            <Layers className="w-5 h-5 text-[#065f46]" />
          </div>
          <h3 className="text-lg font-bold text-[#111]">L1–L6 Baseline Hierarchy</h3>
          <p className="text-[#555] text-sm leading-relaxed">
            Upload schedules and automatically parse activities into L1–L6 breakdown structures with discipline tracking and planned dates.
          </p>
        </div>

        <div className="card hover:shadow-md transition space-y-3" data-testid="feature-card-3">
          <div className="w-10 h-10 rounded-lg bg-[#f5f5f5] flex items-center justify-center">
            <FileText className="w-5 h-5 text-[#333]" />
          </div>
          <h3 className="text-lg font-bold text-[#111]">Layered AI Matching & Audit</h3>
          <p className="text-[#555] text-sm leading-relaxed">
            Ingest daily field reports, PDFs, and spreadsheets. Layered matching with confidence scores and human verification queues.
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Schedule Levels', value: 'L1–L6' },
          { label: 'Matching Signals', value: '4-Layer' },
          { label: 'Audit Granularity', value: '100%' },
          { label: 'Deployment', value: 'Cloud' },
        ].map((s, i) => (
          <div key={i} className="card text-center space-y-1">
            <div className="text-2xl font-extrabold text-[#111]">{s.value}</div>
            <div className="text-xs text-[#888] font-medium uppercase tracking-wider">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================
// 2. Login Page
// ============================================================
const Login = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API}/auth/login`, { email, password });
      const user = res.data;
      onLoginSuccess(user);
      toast.success(`Welcome back, ${user.name || user.email}!`);
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'pm') navigate('/pm-dashboard');
      else navigate(`/project-workspace/${user.project_id || 'demo'}`);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Login failed. Please check credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8" data-testid="login-page">
      <div className="card space-y-6 shadow-sm">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-[#e8f4fd] flex items-center justify-center mx-auto">
            <Shield className="w-6 h-6 text-[#1e40af]" />
          </div>
          <h2 className="text-2xl font-bold text-[#111]">Sign in to IntelliPlan</h2>
          <p className="text-sm text-[#888]">Access your role-based portal (Admin, PM, Engineer, Supervisor)</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="field-label">Email Address / Username</label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="input-field"
              data-testid="login-email-input"
            />
          </div>

          <div className="space-y-1.5">
            <label className="field-label">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input-field"
              data-testid="login-password-input"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 justify-center"
            data-testid="login-submit-btn"
          >
            {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <span>Sign In</span>}
          </button>
        </form>

        <div className="pt-3 border-t border-[#e5e5e5] flex items-center justify-between text-sm flex-wrap gap-2">
          <Link to="/register-project" className="text-[#10b981] hover:underline font-medium text-xs" data-testid="link-to-register">
            Request Project Creation (PM)
          </Link>
          <Link to="/request-access" className="text-[#888] hover:text-[#111] hover:underline font-medium text-xs" data-testid="link-to-access">
            Request Site Access
          </Link>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// 3. Register Project (Project Manager)
// ============================================================
const RegisterProject = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    project_id: "",
    project_title: "",
    project_description: ""
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password || !form.project_id || !form.project_title || !form.project_description) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API}/projects/request-creation`, form);
      toast.success("Project creation request submitted! Waiting for Admin approval.");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to submit project request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-6" data-testid="register-project-page">
      <div className="card space-y-6 shadow-sm">
        <div className="space-y-2">
          <div className="w-10 h-10 rounded-lg bg-[#d1fae5] flex items-center justify-center">
            <Building2 className="w-5 h-5 text-[#065f46]" />
          </div>
          <h2 className="text-2xl font-bold text-[#111]">Create Project — Project Manager</h2>
          <p className="text-sm text-[#888]">
            Create a unique Project ID (letters, numbers, hyphens e.g. ELEC-1024-U3) and set your PM credentials. Requires Admin approval.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="field-label">Your Full Name</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Jane Doe" className="input-field" data-testid="pm-name-input" />
            </div>
            <div className="space-y-1.5">
              <label className="field-label">Email / Username</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="pm@company.com" className="input-field" data-testid="pm-email-input" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="field-label">Create Password</label>
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••" className="input-field" data-testid="pm-password-input" />
            </div>
            <div className="space-y-1.5">
              <label className="field-label">Unique Project ID</label>
              <input type="text" value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value.toUpperCase() })}
                placeholder="ELEC-1024-U3" className="input-field font-mono uppercase" data-testid="pm-project-id-input" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="field-label">Project Title</label>
            <input type="text" value={form.project_title} onChange={(e) => setForm({ ...form, project_title: e.target.value })}
              placeholder="Substation 3 Power Expansion" className="input-field" data-testid="pm-project-title-input" />
          </div>

          <div className="space-y-1.5">
            <label className="field-label">Project Description</label>
            <textarea rows={3} value={form.project_description} onChange={(e) => setForm({ ...form, project_description: e.target.value })}
              placeholder="High-voltage switchgear installation and transformer upgrade across Bay 4 and Bay 5."
              className="input-field resize-none" data-testid="pm-project-desc-input" />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-3 justify-center" data-testid="pm-submit-project-btn">
            {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <span>Submit Project for Admin Approval</span>}
          </button>
        </form>

        <div className="bg-[#e8f4fd] border border-[#bfdbfe] rounded-lg p-3 text-xs text-[#1e40af] leading-relaxed">
          <strong>Next step after registration:</strong> Create your infrastructure project. The project will remain pending until an Admin approves it.
        </div>
      </div>
    </div>
  );
};

// ============================================================
// 4. Request Access (Site Engineer & Supervisor)
// ============================================================
const RequestAccess = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "engineer",
    project_id: "",
    details: ""
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password || !form.project_id || !form.role) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API}/projects/request-access`, form);
      toast.success("Access request submitted to Project Manager! Await PM approval.");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to request access.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-6" data-testid="request-access-page">
      <div className="card space-y-6 shadow-sm">
        <div className="space-y-2">
          <div className="w-10 h-10 rounded-lg bg-[#f5f5f5] flex items-center justify-center">
            <HardHat className="w-5 h-5 text-[#333]" />
          </div>
          <h2 className="text-2xl font-bold text-[#111]">Site Engineer & Supervisor Access Request</h2>
          <p className="text-sm text-[#888]">
            Request access to an existing project using its unique Project ID. Your request will be sent to the Project Manager for approval.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="field-label">Full Name</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="John Engineer" className="input-field" data-testid="access-name-input" />
            </div>
            <div className="space-y-1.5">
              <label className="field-label">Email / Username</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="eng@company.com" className="input-field" data-testid="access-email-input" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="field-label">Password</label>
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••" className="input-field" data-testid="access-password-input" />
            </div>
            <div className="space-y-1.5">
              <label className="field-label">Requested Role</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="input-field" data-testid="access-role-select">
                <option value="engineer">Site Engineer</option>
                <option value="supervisor">Supervisor</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="field-label">Unique Project ID</label>
            <input type="text" value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value.toUpperCase() })}
              placeholder="ELEC-1024-U3" className="input-field font-mono uppercase" data-testid="access-project-id-input" />
          </div>

          <div className="space-y-1.5">
            <label className="field-label">Additional Details / Credentials</label>
            <input type="text" value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })}
              placeholder="Electrical Lead - 5 years experience" className="input-field" data-testid="access-details-input" />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-3 justify-center" data-testid="access-submit-btn">
            {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <span>Request Project Access</span>}
          </button>
        </form>
      </div>
    </div>
  );
};

// ============================================================
// 5. Admin Dashboard
// ============================================================
const AdminDashboard = ({ user }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    try {
      const res = await axios.get(`${API}/admin/projects`);
      setProjects(res.data);
    } catch (err) {
      toast.error("Failed to load project requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleAction = async (projectId, action) => {
    try {
      await axios.post(`${API}/admin/projects/${projectId}/action`, { action });
      toast.success(`Project ${action === 'approve' ? 'approved' : 'rejected'} successfully.`);
      fetchProjects();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Action failed.");
    }
  };

  const pending = projects.filter(p => p.status === 'pending');
  const approved = projects.filter(p => p.status === 'approved');
  const rejected = projects.filter(p => p.status === 'rejected');

  return (
    <div className="space-y-6" data-testid="admin-dashboard">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[#10b981] text-xs font-bold uppercase tracking-wider">
            <Shield className="w-4 h-4" /> Admin Governance Portal
          </div>
          <h1 className="text-2xl font-bold text-[#111]">Project Creation Governance</h1>
          <p className="text-sm text-[#888]">Review, approve or reject project-creation requests submitted by Project Managers.</p>
        </div>
        <button onClick={fetchProjects} className="btn-secondary text-sm" data-testid="admin-refresh-btn">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card flex items-center justify-between" data-testid="stat-pending-card">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#888]">Pending Review</span>
            <div className="text-3xl font-extrabold text-[#111] mt-1">{pending.length}</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#f5f5f5] flex items-center justify-center">
            <Clock className="w-6 h-6 text-[#888]" />
          </div>
        </div>
        <div className="card flex items-center justify-between bg-[#d1fae5] border-[#6ee7b7]" data-testid="stat-approved-card">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#065f46]">Approved</span>
            <div className="text-3xl font-extrabold text-[#065f46] mt-1">{approved.length}</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#a7f3d0] flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-[#065f46]" />
          </div>
        </div>
        <div className="card flex items-center justify-between" data-testid="stat-rejected-card">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#666]">Rejected</span>
            <div className="text-3xl font-extrabold text-[#111] mt-1">{rejected.length}</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#f5f5f5] flex items-center justify-center">
            <XCircle className="w-6 h-6 text-[#888]" />
          </div>
        </div>
      </div>

      {/* Projects List */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-[#111] flex items-center gap-2">
          <Layers className="w-5 h-5 text-[#10b981]" /> All Project Requests
        </h2>

        {loading ? (
          <div className="text-center py-12 text-[#888]">Loading projects...</div>
        ) : projects.length === 0 ? (
          <div className="card text-center py-12 space-y-2" data-testid="no-projects-message">
            <p className="text-[#888]">No project requests found in the system.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {projects.map((proj) => (
              <div
                key={proj.id || proj.project_id}
                className="card flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                data-testid={`project-row-${proj.project_id}`}
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold bg-[#f5f5f5] text-[#333] px-2.5 py-1 rounded border border-[#e5e5e5]">
                      {proj.project_id}
                    </span>
                    <span className={`badge ${proj.status === 'approved' ? 'badge-green' :
                        proj.status === 'rejected' ? 'badge-dark' : 'badge-light'
                      }`}>
                      {proj.status}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-[#111]">{proj.project_title}</h3>
                  <p className="text-sm text-[#666]">{proj.project_description}</p>
                  <div className="text-xs text-[#999] flex items-center gap-4 pt-1">
                    <span>PM: <strong className="text-[#555]">{proj.pm_name} ({proj.pm_email})</strong></span>
                    <span>Requested: {new Date(proj.created_at || Date.now()).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {proj.status === 'pending' ? (
                    <>
                      <button
                        onClick={() => handleAction(proj.project_id, 'approve')}
                        className="btn-secondary text-sm border-[#6ee7b7] text-[#065f46] hover:bg-[#d1fae5]"
                        data-testid={`approve-btn-${proj.project_id}`}
                      >
                        <Check className="w-4 h-4" /> Approve
                      </button>
                      <button
                        onClick={() => handleAction(proj.project_id, 'reject')}
                        className="btn-ghost text-sm text-[#666] hover:text-[#111]"
                        data-testid={`reject-btn-${proj.project_id}`}
                      >
                        <X className="w-4 h-4" /> Reject
                      </button>
                    </>
                  ) : (
                    <span className="text-xs font-semibold text-[#999] bg-[#f5f5f5] px-3 py-1.5 rounded-lg border border-[#e5e5e5]">
                      Processed ({proj.status})
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================
// 6. Project Manager Dashboard
// ============================================================
const PMDashboard = ({ user }) => {
  const [project, setProject] = useState(null);
  const [accessRequests, setAccessRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchPMData = async () => {
    try {
      const res = await axios.get(`${API}/pm/my-project`, { params: { email: user.email } });
      setProject(res.data.project);
      setAccessRequests(res.data.access_requests || []);
    } catch (err) {
      toast.error("Failed to load project details.");
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchPMData(); }, [user]);

  const handleUserAccessAction = async (requestId, action) => {
    try {
      await axios.post(`${API}/pm/access-requests/${requestId}/action`, { action });
      toast.success(`User access ${action === 'approve' ? 'approved' : 'rejected'}.`);
      fetchPMData();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Action failed.");
    }
  };

  if (loading) return <div className="text-center py-12 text-[#888]">Loading PM Dashboard...</div>;

  if (!project) {
    return (
      <div className="max-w-lg mx-auto my-12 card text-center space-y-4" data-testid="project-not-approved-card">
        <div className="w-16 h-16 rounded-2xl bg-[#f5f5f5] flex items-center justify-center mx-auto">
          <Clock className="w-8 h-8 text-[#888]" />
        </div>
        <h2 className="text-2xl font-bold text-[#111]">Project Pending Admin Approval</h2>
        <p className="text-sm text-[#666]">
          Your project creation request is under review. Once approved, your project dashboard, baseline schedule uploading, and team access controls will unlock.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="pm-dashboard">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[#10b981] text-xs font-bold uppercase tracking-wider">
            <Building2 className="w-4 h-4" /> Project Manager Portal
          </div>
          <h1 className="text-2xl font-bold text-[#111]">{project.project_title}</h1>
          <p className="text-sm text-[#666]">{project.project_description}</p>
          <div className="flex items-center gap-3 pt-1">
            <span className="font-mono text-xs font-bold bg-[#f5f5f5] px-2.5 py-1 rounded border border-[#e5e5e5]">
              ID: {project.project_id}
            </span>
            <span className="badge badge-green">{project.status}</span>
          </div>
        </div>
        <button
          onClick={() => navigate(`/project-workspace/${project.project_id}`)}
          className="btn-primary"
          data-testid="go-to-workspace-btn"
        >
          <span>Open Project Workspace</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Team Access Requests */}
      <div className="card space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#111] flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-[#10b981]" /> Pending Team Access Requests
            </h2>
            <p className="text-sm text-[#888] mt-0.5">Approve or reject Site Engineers and Supervisors requesting access to this project.</p>
          </div>
          <span className="badge badge-green">
            {accessRequests.filter(r => r.status === 'pending').length} Pending
          </span>
        </div>

        {accessRequests.length === 0 ? (
          <div className="text-center py-8 text-[#999] text-sm border border-dashed border-[#e5e5e5] rounded-xl" data-testid="no-access-requests">
            No team access requests submitted yet.
          </div>
        ) : (
          <div className="space-y-3">
            {accessRequests.map((req) => (
              <div
                key={req.id || req.email}
                className="card-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-[#e5e5e5]"
                data-testid={`access-request-row-${req.email}`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-[#111]">{req.name}</span>
                    <span className={`badge ${req.role === 'engineer' ? 'badge-light' : 'badge-light'}`}>
                      {req.role}
                    </span>
                    <span className={`badge ${req.status === 'approved' ? 'badge-green' :
                        req.status === 'rejected' ? 'badge-dark' : 'badge-blue'
                      }`}>
                      {req.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#888]">{req.email} · {req.details}</p>
                </div>
                <div className="flex items-center gap-2">
                  {req.status === 'pending' ? (
                    <>
                      <button onClick={() => handleUserAccessAction(req.id, 'approve')}
                        className="btn-secondary text-xs py-1.5 px-3 border-[#6ee7b7] text-[#065f46] hover:bg-[#d1fae5]"
                        data-testid={`approve-access-${req.email}`}>
                        <Check className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button onClick={() => handleUserAccessAction(req.id, 'reject')}
                        className="btn-ghost text-xs"
                        data-testid={`reject-access-${req.email}`}>
                        <X className="w-3.5 h-3.5" /> Reject
                      </button>
                    </>
                  ) : (
                    <span className="text-xs font-medium text-[#999]">Processed</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================
// 7. Project Workspace (Schedule, Reports, Verification, Audit)
// ============================================================
const ProjectWorkspace = ({ user }) => {
  const { projectId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const activeTab = new URLSearchParams(location.search).get('tab') || 'schedule';

  const [projectData, setProjectData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reportText, setReportText] = useState("");
  const [uploadingReport, setUploadingReport] = useState(false);

  const fetchWorkspace = async () => {
    try {
      const res = await axios.get(`${API}/projects/${projectId}/workspace`);
      setProjectData(res.data);
    } catch (err) {
      toast.error("Failed to load project workspace.");
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchWorkspace(); }, [projectId]);

  const handleUploadSchedule = async (e) => {
    e.preventDefault();
    const fileInput = document.getElementById("schedule-file-input");
    if (!fileInput.files[0]) {
      toast.error("Please select a schedule file (Excel / Primavera / CSV / PDF).");
      return;
    }
    const formData = new FormData();
    formData.append("file", fileInput.files[0]);
    try {
      setLoading(true);
      const res = await axios.post(`${API}/projects/${projectId}/upload-schedule`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      toast.success(`Baseline schedule parsed! Built L1–L6 hierarchy with ${res.data.activity_count} activities.`);
      fetchWorkspace();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to parse schedule.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitFieldReport = async (e) => {
    e.preventDefault();
    if (!reportText.trim()) { toast.error("Please enter field report notes."); return; }
    try {
      setUploadingReport(true);
      const res = await axios.post(`${API}/projects/${projectId}/field-reports`, {
        report_text: reportText,
        submitted_by: user?.email || "engineer@intelliplan.com"
      });
      toast.success(`Field report ingested & matched! ${res.data.matched_count} matches found.`);
      setReportText("");
      fetchWorkspace();
      navigate(`/project-workspace/${projectId}?tab=verification`);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to process field report.");
    } finally {
      setUploadingReport(false);
    }
  };

  const handleVerifyMatch = async (matchId, action, chosenActivityId = null) => {
    try {
      await axios.post(`${API}/projects/${projectId}/verify-match`, {
        match_id: matchId,
        action,
        chosen_activity_id: chosenActivityId,
        verified_by: user?.email || "pm@intelliplan.com"
      });
      toast.success(`Activity match ${action}ed successfully & progress updated!`);
      fetchWorkspace();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Verification action failed.");
    }
  };

  if (loading && !projectData) return <div className="text-center py-12 text-[#888]">Loading Project Workspace...</div>;

  const activities = projectData?.activities || [];
  const reports = projectData?.reports || [];
  const matches = projectData?.matches || [];
  const pendingVerification = matches.filter(m => m.status === 'pending');

  return (
    <div className="space-y-6" data-testid="project-workspace">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[#10b981] text-xs font-bold uppercase tracking-wider">
            <Layers className="w-4 h-4" /> Project Workspace ({projectId})
          </div>
          <h1 className="text-2xl font-bold text-[#111]">{projectData?.project?.project_title || projectId}</h1>
          <p className="text-sm text-[#666]">{projectData?.project?.project_description}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="card-sm text-xs font-semibold text-[#555] flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#10b981]" />
            Activities: <strong className="text-[#111]">{activities.length}</strong>
          </div>
          {pendingVerification.length > 0 && (
            <div className="card-sm text-xs font-semibold text-[#555] flex items-center gap-2 border-[#bfdbfe] bg-[#e8f4fd]">
              <AlertTriangle className="w-4 h-4 text-[#1e40af]" />
              Pending: <strong className="text-[#1e40af]">{pendingVerification.length}</strong>
            </div>
          )}
        </div>
      </div>

      {/* Full-width content — controlled by left sidebar */}
      <div className="space-y-5">

          {/* Tab 1: Schedule */}
          {activeTab === 'schedule' && (
            <div className="space-y-5">
              <div className="card space-y-4">
                <h2 className="text-lg font-bold text-[#111] flex items-center gap-2">
                  <Upload className="w-5 h-5 text-[#10b981]" /> Upload Baseline Schedule (Excel / Primavera / CSV / PDF)
                </h2>
                <p className="text-sm text-[#888]">
                  Upload project baseline schedule file to automatically parse activities, dates, disciplines, locations, and construct the L1–L6 WBS hierarchy.
                </p>
                <form onSubmit={handleUploadSchedule} className="flex flex-col sm:flex-row items-center gap-4">
                  <input
                    id="schedule-file-input"
                    type="file"
                    accept=".xlsx,.xls,.csv,.pdf,.xer,.mpp"
                    className="w-full sm:w-auto file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#e8f4fd] file:text-[#1e40af] hover:file:bg-[#bfdbfe] text-[#888] text-sm border border-[#e5e5e5] rounded-lg p-2"
                    data-testid="schedule-file-input"
                  />
                  <button type="submit" className="btn-primary" data-testid="upload-schedule-btn">
                    Parse Schedule & Build Hierarchy
                  </button>
                </form>
              </div>

              <div className="card space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-[#111]">L1–L6 Activity Hierarchy & Planned vs Actual</h2>
                  <span className="badge badge-light">Total: {activities.length}</span>
                </div>

                {activities.length === 0 ? (
                  <div className="text-center py-12 text-[#bbb] text-sm border border-dashed border-[#e5e5e5] rounded-xl" data-testid="no-activities-msg">
                    No activities parsed yet. Please upload a baseline schedule above.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="data-table" data-testid="activities-table">
                      <thead>
                        <tr>
                          <th>Activity ID</th>
                          <th>Level</th>
                          <th>Description</th>
                          <th>Discipline</th>
                          <th>Location</th>
                          <th>Planned Dates</th>
                          <th>Progress</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activities.map((act) => (
                          <tr key={act.activity_id || act.id} data-testid={`activity-row-${act.activity_id}`}>
                            <td className="font-mono font-bold text-[#10b981] text-xs">{act.activity_id}</td>
                            <td className="font-semibold text-[#333] text-xs">{act.hierarchy_level || 'L3'}</td>
                            <td className="font-medium text-[#111] max-w-[200px] truncate">{act.description}</td>
                            <td>
                              <span className="badge badge-light">{act.discipline || 'General'}</span>
                            </td>
                            <td className="font-mono text-xs text-[#555]">{act.location || 'Unit-3'}</td>
                            <td className="text-xs text-[#888]">{act.planned_start} → {act.planned_end}</td>
                            <td>
                              <div className="flex items-center gap-2 min-w-[80px]">
                                <div className="progress-track flex-1">
                                  <div className="progress-fill" style={{ width: `${act.progress_percentage || 0}%` }} />
                                </div>
                                <span className="text-xs font-semibold text-[#333]">{act.progress_percentage || 0}%</span>
                              </div>
                            </td>
                            <td>
                              <span className={`badge ${act.status === 'Completed' ? 'badge-green' :
                                  act.status === 'In Progress' ? 'badge-blue' : 'badge-light'
                                }`}>
                                {act.status || 'Not Started'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Field Reports */}
          {activeTab === 'reports' && (
            <div className="space-y-5">
              <div className="card space-y-4">
                <h2 className="text-lg font-bold text-[#111] flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#10b981]" /> Ingest Field Reports, Spreadsheets & Free Text
                </h2>
                <p className="text-sm text-[#888]">
                  Paste site progress updates, upload daily field report PDFs, or spreadsheet summaries. The AI extracts information, normalizes locations and event statuses, and runs layered matching against baseline activities.
                </p>
                <form onSubmit={handleSubmitFieldReport} className="space-y-4">
                  <textarea
                    rows={5}
                    value={reportText}
                    onChange={(e) => setReportText(e.target.value)}
                    placeholder="e.g. Today at Unit-3, electrical crew commenced cable pulling for switchgear feeder ELEC-1024. Progress reached 45%. Weather clear."
                    className="input-field resize-none font-mono"
                    data-testid="field-report-textarea"
                  />
                  <div className="flex justify-end">
                    <button type="submit" disabled={uploadingReport} className="btn-primary" data-testid="submit-field-report-btn">
                      {uploadingReport ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Ingest & Match Field Report</span>}
                    </button>
                  </div>
                </form>
              </div>

              <div className="card space-y-4">
                <h2 className="text-lg font-bold text-[#111]">Ingested Report History</h2>
                {reports.length === 0 ? (
                  <div className="text-center py-8 text-[#bbb] text-sm border border-dashed border-[#e5e5e5] rounded-xl" data-testid="no-reports-msg">
                    No field reports ingested yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reports.map((rep) => (
                      <div key={rep.id || rep.timestamp} className="card-sm space-y-2 border border-[#e5e5e5]" data-testid={`report-item-${rep.id}`}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-[#888]">Submitted by: {rep.submitted_by}</span>
                          <span className="text-xs text-[#bbb]">{new Date(rep.timestamp).toLocaleString()}</span>
                        </div>
                        <p className="text-sm text-[#111] font-medium">{rep.report_text}</p>
                        <div className="flex items-center gap-3 text-xs pt-1">
                          <span className="badge badge-green">Matches: {rep.matched_count || 0}</span>
                          <span className="badge badge-blue">Needs Verification: {rep.ambiguous_count || 0}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 3: Verification Queue */}
          {activeTab === 'verification' && (
            <div className="space-y-5">
              <div className="card space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-[#111] flex items-center gap-2">
                      <UserCheck className="w-5 h-5 text-[#10b981]" /> Human Verification Queue
                    </h2>
                    <p className="text-sm text-[#888] mt-0.5">
                      Review AI extraction results, confidence scores, and multiple candidate matches. Accept, reject, or select alternative activities.
                    </p>
                  </div>
                  <span className="badge badge-blue">{pendingVerification.length} Pending</span>
                </div>

                {pendingVerification.length === 0 ? (
                  <div className="text-center py-12 text-[#bbb] text-sm border border-dashed border-[#e5e5e5] rounded-xl" data-testid="no-pending-verification">
                    All field matches have been verified! Great job.
                  </div>
                ) : (
                  <div className="space-y-5">
                    {pendingVerification.map((match) => (
                      <div key={match.id} className="border border-[#bfdbfe] bg-[#e8f4fd] rounded-xl p-5 space-y-4" data-testid={`match-verification-card-${match.id}`}>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#bfdbfe] pb-3">
                          <div className="flex items-center gap-3">
                            <span className="badge badge-blue">
                              Confidence: {Math.round((match.confidence || 0) * 100)}%
                            </span>
                            <span className="text-xs text-[#666]">Signal: {match.match_signal || 'Fuzzy + Semantic'}</span>
                          </div>
                          <span className="text-xs text-[#999]">Report ID: {match.report_id}</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-white p-4 rounded-xl border border-[#e5e5e5] space-y-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-[#bbb]">Extracted Text & Fields</span>
                            <p className="text-sm font-medium text-[#111]">"{match.extracted_text}"</p>
                            <div className="text-xs text-[#666] space-y-1 pt-2">
                              <div>Discipline: <strong className="text-[#333]">{match.extracted_discipline || 'General'}</strong></div>
                              <div>Location: <strong className="text-[#333]">{match.extracted_location || 'Unit-3'}</strong></div>
                              <div>Event Date: <strong className="text-[#333]">{match.extracted_date || 'Today'}</strong></div>
                              <div>Progress: <strong className="text-[#10b981]">{match.extracted_progress || 0}%</strong></div>
                            </div>
                          </div>

                          <div className="bg-white p-4 rounded-xl border border-[#e5e5e5] space-y-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-[#bbb]">Top Candidate Matches</span>
                            <div className="space-y-2">
                              {(match.candidates || []).map((cand, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2.5 bg-[#f5f5f5] rounded-lg border border-[#e5e5e5] text-xs">
                                  <div>
                                    <span className="font-mono font-bold text-[#10b981] mr-2">{cand.activity_id}</span>
                                    <span className="font-medium text-[#555]">{cand.description}</span>
                                  </div>
                                  <button
                                    onClick={() => handleVerifyMatch(match.id, 'choose', cand.activity_id)}
                                    className="btn-secondary text-xs py-1 px-2.5 border-[#6ee7b7] text-[#065f46] hover:bg-[#d1fae5]"
                                    data-testid={`choose-candidate-${cand.activity_id}`}
                                  >
                                    Select
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => handleVerifyMatch(match.id, 'reject')}
                            className="btn-ghost text-sm text-[#666]"
                            data-testid={`reject-match-${match.id}`}
                          >
                            <X className="w-4 h-4" /> Reject Match
                          </button>
                          <button
                            onClick={() => handleVerifyMatch(match.id, 'accept')}
                            className="btn-secondary text-sm border-[#6ee7b7] text-[#065f46] hover:bg-[#d1fae5]"
                            data-testid={`accept-match-${match.id}`}
                          >
                            <CheckCheck className="w-4 h-4" /> Accept & Update Progress
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 4: Audit Trail */}
          {activeTab === 'audit' && (
            <div className="space-y-5">
              <div className="card space-y-4">
                <h2 className="text-lg font-bold text-[#111] flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[#10b981]" /> Verified Progress & Complete Audit Trail
                </h2>
                <p className="text-sm text-[#888]">
                  Audit log of all verified field events, progress percentage changes, actual start/end dates recorded, and verifier credentials.
                </p>

                {matches.filter(m => m.status === 'accepted').length === 0 ? (
                  <div className="text-center py-12 text-[#bbb] text-sm border border-dashed border-[#e5e5e5] rounded-xl" data-testid="no-audit-trail">
                    No verified matches recorded in audit trail yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {matches.filter(m => m.status === 'accepted').map((item) => (
                      <div key={item.id} className="card-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-[#e5e5e5]" data-testid={`audit-row-${item.id}`}>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold badge badge-green">
                              {item.assigned_activity_id || 'Matched'}
                            </span>
                            <span className="text-xs font-semibold text-[#333]">{item.extracted_description || item.extracted_text}</span>
                          </div>
                          <p className="text-xs text-[#888]">
                            Verified by: <strong className="text-[#555]">{item.verified_by || 'PM'}</strong> · Confidence: {Math.round((item.confidence || 0) * 100)}%
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="badge badge-green">Progress: {item.extracted_progress || 100}%</span>
                          <div className="text-[10px] text-[#bbb] mt-1">{new Date(item.verified_at || Date.now()).toLocaleString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

      </div>
    </div>
  );
};

// ============================================================
// App Root
// ============================================================
const AppInner = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();


  const handleLogout = () => {
    setUser(null);
    navigate('/');
    toast.success("Logged out successfully");
  };

  return (
    <>
      <Toaster position="top-right" richColors />
      <Layout user={user} onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<Home user={user} />} />
          <Route path="/login" element={<Login onLoginSuccess={setUser} />} />
          <Route path="/register-project" element={<RegisterProject />} />
          <Route path="/request-access" element={<RequestAccess />} />
          <Route path="/admin" element={<RoleGate user={user} roles={['admin']}><AdminDashboard user={user} /></RoleGate>} />
          <Route path="/pm-dashboard" element={<RoleGate user={user} roles={['pm']}><PMDashboard user={user} /></RoleGate>} />
          <Route path="/project-workspace/:projectId" element={<RoleGate user={user} roles={['pm', 'engineer', 'supervisor']}><ProjectWorkspace user={user} /></RoleGate>} />
        </Routes>
      </Layout>
    </>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  );
}

export default App;
