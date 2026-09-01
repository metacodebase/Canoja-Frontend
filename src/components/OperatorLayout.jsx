import { useState } from "react";
import { Compass, CreditCard, LayoutDashboard, LogOut, Menu, Settings, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import canojaLogo from "../assets/canojaLogo.png";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import ChangePasswordModal from "./ChangePasswordModal";
import AdminThemeToggle from "./admin/AdminThemeToggle";
import useAdminTheme from "./admin/useAdminTheme";
import api from "../services/api";
import "./admin/adminTheme.css";

const NAV_ITEMS = [
  { label: "Dashboard", path: "/operator/dashboard", icon: <LayoutDashboard size={20} strokeWidth={2} /> },
  { label: "Explore", path: "/operator/explore", icon: <Compass size={20} strokeWidth={2} /> },
  { label: "Billing", path: "/operator/billing", icon: <CreditCard size={20} strokeWidth={2} /> },
  { label: "Settings", path: "/operator/settings", icon: <Settings size={20} strokeWidth={2} /> },
];

const OperatorLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { logout, user } = useAuth();
  const { theme, toggleTheme } = useAdminTheme();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await api.post("/users/logout").catch(() => {});
    queryClient.clear();
    logout();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  return (
    <div className={`admin-theme operator-theme admin-theme--${theme}`} style={styles.shell}>
      <button type="button" className="operator-menu-trigger" aria-label="Open operator menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}><Menu size={22} /></button>
      {menuOpen && <button type="button" className="operator-sidebar-backdrop" aria-label="Close operator menu" onClick={() => setMenuOpen(false)} />}
      <aside className={`operator-sidebar${menuOpen ? " operator-sidebar--open" : ""}`} style={styles.sidebar}>
        <button type="button" className="operator-sidebar-close" aria-label="Close operator menu" onClick={() => setMenuOpen(false)}><X size={21} /></button>
        <div style={styles.brand}>
          <span style={styles.logoWrap}><img src={canojaLogo} alt="Canoja" style={styles.logo} /></span>
          <span><strong style={styles.brandName}>Canoja</strong><small style={styles.brandRole}>Operator Dashboard</small></span>
        </div>
        <div style={styles.account}>
          <span style={styles.avatar}>{(user?.name || user?.email || "O").charAt(0).toUpperCase()}</span>
          <span style={styles.accountText}>
            <strong style={styles.accountName}>{user?.name || user?.email?.split("@")[0] || "Operator"}</strong>
            <small style={styles.accountEmail}>{user?.email}</small>
          </span>
        </div>
        <p style={styles.sectionLabel}>Operator Menu</p>
        <nav style={styles.nav}>
          {NAV_ITEMS.map(({ label, path, icon }) => {
            const active = location.pathname === path;
            return (
              <button key={path} type="button" onClick={() => { setMenuOpen(false); navigate(path); }} style={{ ...styles.navItem, ...(active ? styles.navItemActive : {}) }}>
                {icon}<span>{label}</span>
              </button>
            );
          })}
        </nav>
        <div style={styles.bottomActions}>
          <AdminThemeToggle theme={theme} onToggle={toggleTheme} sidebar />
          <button type="button" onClick={() => setShowChangePassword(true)} style={styles.bottomButton}>Change Password</button>
          <button type="button" onClick={handleLogout} style={styles.bottomButton}><LogOut size={20} /><span>Logout</span></button>
        </div>
      </aside>
      <main className="operator-main" style={styles.main}>{children}</main>
      {showChangePassword && <ChangePasswordModal onClose={() => setShowChangePassword(false)} />}
    </div>
  );
};

const styles = {
  shell: { minHeight: "100vh", display: "flex", background: "#f6f9f8", fontFamily: "Inter, system-ui, sans-serif" },
  sidebar: { width: "279px", height: "100vh", position: "sticky", top: 0, flexShrink: 0, display: "flex", flexDirection: "column", padding: "24px", boxSizing: "border-box", background: "linear-gradient(180deg, #0d3b2a 0%, #145237 100%)", borderRight: "1px solid rgba(255,255,255,.08)" },
  brand: { display: "flex", alignItems: "center", gap: "12px", color: "#fff" },
  logoWrap: { width: "44px", height: "44px", borderRadius: "12px", background: "rgba(255,255,255,.15)", display: "grid", placeItems: "center", flexShrink: 0 },
  logo: { width: "32px", height: "32px", objectFit: "contain" },
  brandName: { display: "block", fontSize: "18px", lineHeight: 1.25 },
  brandRole: { display: "block", marginTop: "2px", color: "rgba(255,255,255,.68)", fontSize: "12px" },
  account: { display: "flex", alignItems: "center", gap: "11px", margin: "26px 0", padding: "14px", borderRadius: "14px", background: "rgba(255,255,255,.08)" },
  avatar: { width: "36px", height: "36px", display: "grid", placeItems: "center", borderRadius: "50%", background: "#34d399", color: "#073b2a", fontWeight: 800, flexShrink: 0 },
  accountText: { minWidth: 0 }, accountName: { display: "block", overflow: "hidden", textOverflow: "ellipsis", color: "#fff", fontSize: "14px", whiteSpace: "nowrap" },
  accountEmail: { display: "block", overflow: "hidden", textOverflow: "ellipsis", color: "rgba(255,255,255,.55)", fontSize: "11px", whiteSpace: "nowrap", marginTop: "2px" },
  sectionLabel: { margin: "0 0 8px", color: "rgba(255,255,255,.6)", fontSize: "11px", letterSpacing: "1.3px", textTransform: "uppercase" },
  nav: { display: "flex", flexDirection: "column", gap: "5px" },
  navItem: { display: "flex", alignItems: "center", gap: "13px", width: "100%", padding: "12px 14px", border: 0, borderRadius: "13px", background: "transparent", color: "rgba(255,255,255,.78)", font: "inherit", fontSize: "15px", cursor: "pointer", textAlign: "left" },
  navItemActive: { background: "rgba(255,255,255,.12)", color: "#fff", fontWeight: 650 },
  bottomActions: { marginTop: "auto", paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,.1)" },
  bottomButton: { width: "100%", minHeight: "47px", display: "flex", alignItems: "center", gap: "14px", padding: "12px 14px", border: 0, borderRadius: "14px", background: "transparent", color: "rgba(255,255,255,.92)", font: "inherit", fontSize: "16px", cursor: "pointer", textAlign: "left" },
  main: { flex: 1, minWidth: 0, padding: "32px 28px", boxSizing: "border-box" },
};

export default OperatorLayout;
