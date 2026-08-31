import { useState } from "react";
import { ChevronRight, LockKeyhole, LogOut, Mail, Store, UserCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import ChangePasswordModal from "./ChangePasswordModal";
import ChangeEmailModal from "./ChangeEmailModal";
import OperatorLayout from "./OperatorLayout";

const SettingsRow = ({ icon, color, title, subtitle, onClick, last = false }) => (
  <button type="button" className="operator-settings-row" onClick={onClick} style={{ ...styles.row, borderBottom: last ? 0 : "1px solid rgba(255,255,255,.08)" }}>
    <span style={{ ...styles.rowIcon, background: `${color}18`, color }}>{icon}</span>
    <span style={styles.rowText}><strong style={styles.rowTitle}>{title}</strong><small style={styles.rowSub}>{subtitle}</small></span>
    <ChevronRight size={20} color="#94a3b8" />
  </button>
);

const OperatorSettings = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { activeBusinessId, businesses, logout, user } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const activeBusiness = businesses.find((business) => business._id === activeBusinessId);

  const handleLogout = async () => {
    if (!window.confirm("Are you sure you want to logout?")) return;
    await api.post("/users/logout").catch(() => {});
    queryClient.clear();
    logout();
    navigate("/login");
  };

  return (
    <OperatorLayout>
      <div className="operator-settings-page" style={styles.page}>
        <h1 style={styles.heading}>Settings</h1>
        <section className="operator-settings-card operator-settings-user" style={styles.userCard}>
          <UserCircle size={58} color="#22c55e" fill="rgba(34,197,94,.12)" />
          <span><strong style={styles.userName}>{user?.name || "User Email"}</strong><small style={styles.userEmail}>{user?.email}</small><small style={styles.roleBadge}>{user?.role?.toUpperCase()}</small></span>
        </section>

        {businesses.length > 1 && <section style={styles.section}>
          <h2 className="operator-settings-section-title" style={styles.sectionTitle}>Business</h2>
          <div className="operator-settings-card" style={styles.sectionCard}><SettingsRow icon={<Store size={22} />} color="#22c55e" title="Switch Business" subtitle={activeBusiness?.business_name ? `Active: ${activeBusiness.business_name}` : `${businesses.length} businesses linked`} onClick={() => navigate("/operator/switch-business")} last /></div>
        </section>}

        <section style={styles.section}>
          <h2 className="operator-settings-section-title" style={styles.sectionTitle}>Account Settings</h2>
          <div className="operator-settings-card" style={styles.sectionCard}>
            <SettingsRow icon={<LockKeyhole size={22} />} color="#22c55e" title="Change Password" subtitle="Update your account password" onClick={() => setShowPassword(true)} />
            <SettingsRow icon={<Mail size={22} />} color="#60a5fa" title="Change Email" subtitle="Update your account email address" onClick={() => setShowEmail(true)} last />
          </div>
        </section>

        <button type="button" onClick={handleLogout} style={styles.logout}><LogOut size={21} /><span>Logout</span></button>
      </div>
      {showPassword && <ChangePasswordModal onClose={() => setShowPassword(false)} />}
      {showEmail && <ChangeEmailModal onClose={() => setShowEmail(false)} />}
    </OperatorLayout>
  );
};

const styles = {
  page: { width: "100%", maxWidth: "920px", margin: "0 auto" }, heading: { margin: "0 0 24px", color: "#10b981", fontSize: "32px" },
  userCard: { display: "flex", alignItems: "center", gap: "17px", padding: "22px", borderRadius: "17px", background: "#102b2c", border: "1px solid rgba(255,255,255,.12)" },
  userName: { display: "block", color: "#fff", fontSize: "18px" }, userEmail: { display: "block", marginTop: "4px", color: "rgba(255,255,255,.55)", fontSize: "13px" }, roleBadge: { display: "inline-block", marginTop: "9px", padding: "3px 11px", borderRadius: "999px", background: "rgba(34,197,94,.14)", color: "#22c55e", fontSize: "10px", fontWeight: 800 },
  section: { marginTop: "25px" }, sectionTitle: { margin: "0 0 10px 3px", color: "#e8f4ef", fontSize: "14px" }, sectionCard: { overflow: "hidden", borderRadius: "15px", background: "#102b2c", border: "1px solid rgba(255,255,255,.12)" },
  row: { width: "100%", display: "flex", alignItems: "center", gap: "14px", padding: "17px", background: "transparent", border: 0, color: "#fff", font: "inherit", textAlign: "left", cursor: "pointer" },
  rowIcon: { width: "42px", height: "42px", flexShrink: 0, display: "grid", placeItems: "center", borderRadius: "11px" }, rowText: { flex: 1, minWidth: 0 }, rowTitle: { display: "block", color: "#fff", fontSize: "15px" }, rowSub: { display: "block", marginTop: "4px", color: "rgba(255,255,255,.5)", fontSize: "12px" },
  logout: { width: "100%", marginTop: "34px", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", padding: "15px", border: 0, borderRadius: "14px", background: "#ef2424", color: "#fff", font: "inherit", fontWeight: 750, cursor: "pointer", boxShadow: "0 8px 24px rgba(239,36,36,.18)" },
};

export default OperatorSettings;
