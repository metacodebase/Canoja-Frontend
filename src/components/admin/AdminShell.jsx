import React, { useState } from "react";
import { LockKeyhole, LogOut, Menu, X } from "lucide-react";
import canojaLogo from "../../assets/canojaLogo.png";
import canojaHeroBg from "../../assets/canoja-hero-bg.png";
import { useNavigate, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";
import api from "../../services/api";
import ChangePasswordModal from "../ChangePasswordModal";
import AdminThemeToggle from "./AdminThemeToggle";
import useAdminTheme from "./useAdminTheme";
import "./adminTheme.css";

const NAV_ADMIN = [
  { label: "Retailers",              path: "/admin/retailers" },
  { label: "Claim Requests Queue",   path: "/admin/pending-verifications" },
  { label: "Claim Requests History", path: "/admin/pending-requests" },
  { label: "Canoja Verified",        path: "/admin/canoja-verified" },
];

const NAV_MANAGEMENT = [
  { label: "History", path: "/admin/history" },
  { label: "Users",   path: "/admin/users" },
];

const NAV_PUBLIC = [
  { label: "Verified Businesses", path: "/admin/verified-pharmacies" },
];


export default function AdminShell({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const queryClient = useQueryClient();
  const [showCP, setShowCP] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { theme, toggleTheme } = useAdminTheme();

  const handleLogout = async () => {
    try {
      await api.post("/users/logout").catch(() => {});
      queryClient.clear();
      logout();
      toast.success("Logged out successfully");
      navigate("/login");
    } catch {
      logout();
      navigate("/login");
    }
  };

  const NavItem = ({ label, path }) => {
    const active = path && location.pathname === path;
    if (!path) {
      return (
        <div
          className="flex items-center w-full px-[14px] py-[10px] rounded-[14px]"
          style={{
            color: "rgba(255,255,255,0.50)",
            fontFamily: "Inter, sans-serif",
            fontWeight: 400,
            fontSize: "14px",
            lineHeight: "20px",
          }}
        >
          {label}
        </div>
      );
    }
    return (
      <button
        onClick={() => { setMenuOpen(false); navigate(path); }}
        className="flex items-center w-full px-[14px] py-[12px] rounded-[14px] text-[16px] transition-all text-left cursor-pointer"
        style={{
          background: active ? "linear-gradient(110deg, rgba(22,119,60,.72), rgba(6,79,49,.58))" : "transparent",
          color: "rgba(255,255,255,0.92)",
          fontFamily: "Inter, sans-serif",
          fontWeight: 400,
          lineHeight: "23.2px",
          border: "none",
          boxShadow: active ? "inset 0 0 0 1px rgba(45,211,101,.16), 0 8px 24px rgba(0,0,0,.14)" : "none",
        }}
      >
        {label}
      </button>
    );
  };

  const SectionLabel = ({ children }) => (
    <p
      className="uppercase"
      style={{
        fontFamily: "Inter, sans-serif",
        fontWeight: 400,
        fontSize: "11.84px",
        lineHeight: "17.168px",
        color: "#2dca61",
        letterSpacing: "1.4208px",
        padding: "0",
        marginBottom: "4px",
      }}
    >
      {children}
    </p>
  );

  return (
    <div className={`admin-theme admin-shell admin-theme--${theme} flex min-h-screen`} style={{ background: "#f6f9f8", fontFamily: "Inter, sans-serif" }}>
      <button type="button" className="admin-menu-trigger" aria-label="Open admin menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}><Menu size={22} /></button>
      {menuOpen && <button type="button" className="admin-sidebar-backdrop" aria-label="Close admin menu" onClick={() => setMenuOpen(false)} />}
      {/* Sidebar */}
      <aside
        className={`admin-sidebar sticky top-0 h-screen shrink-0 flex flex-col${menuOpen ? " admin-sidebar--open" : ""}`}
        style={{
          width: "248px",
          backgroundImage: `linear-gradient(180deg, rgba(0,30,28,.84) 0%, rgba(0,38,34,.78) 54%, rgba(0,26,27,.76) 100%), url(${canojaHeroBg})`,
          backgroundPosition: "center bottom",
          backgroundSize: "auto 100%, auto 100%",
          borderRight: "1px solid rgba(25,197,100,.24)",
          boxShadow: "8px 0 32px rgba(0,18,17,.16)",
        }}
      >
        <button type="button" className="admin-sidebar-close" aria-label="Close admin menu" onClick={() => setMenuOpen(false)}><X size={21} /></button>
        {/* Brand */}
        <div className="flex items-center gap-[10px]" style={{ padding: "20px 22px 0" }}>
          <div
            className="shrink-0"
            style={{
              width: "36px", height: "36px",
              borderRadius: "10px",
              background: "linear-gradient(145deg, rgba(20,128,58,.44), rgba(3,63,45,.72))",
              border: "1px solid rgba(42,211,102,.24)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <img src={canojaLogo} alt="Canoja" style={{ width: "28px", height: "28px", objectFit: "contain" }} />
          </div>
          <div className="flex flex-col gap-[2px]">
            <p
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 800,
                fontSize: "15px",
                lineHeight: "23.2px",
                color: "#35d15e",
                whiteSpace: "nowrap",
              }}
            >
              Canoja
            </p>
            <p
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 400,
                fontSize: "10px",
                lineHeight: "19.024px",
                color: "rgba(223,240,234,0.58)",
                whiteSpace: "nowrap",
              }}
            >
              Admin + Marketplace Feed
            </p>
          </div>
        </div>

        {/* Nav */}
        <div className="flex flex-col flex-1 overflow-y-auto" style={{ padding: "20px 22px 0", gap: "22px" }}>
          {/* Admin Pages */}
          <div>
            <SectionLabel>Admin Pages</SectionLabel>
            <div className="flex flex-col mt-[6px]">
              {NAV_ADMIN.map(({ label, path }) => (
                <NavItem key={path} label={label} path={path} />
              ))}
            </div>
          </div>

          {/* Management — hidden, routes/implementation intact */}

          {/* Public Experience */}
          <div>
            <SectionLabel>Public Experience</SectionLabel>
            <div className="flex flex-col mt-[6px]">
              {NAV_PUBLIC.map(({ label, path }) => (
                <NavItem key={path} label={label} path={path} />
              ))}
            </div>
          </div>

        </div>

        {/* Bottom actions */}
        <div
          className="flex flex-col"
          style={{
            padding: "12px 22px 22px",
            borderTop: "1px solid rgba(37,207,103,.65)",
            marginTop: "auto",
            borderRadius: "0 24px 0 0",
            background: "linear-gradient(135deg, rgba(10,84,65,.58), rgba(0,28,29,.48))",
            boxShadow: "0 -18px 42px rgba(0,18,18,.28), inset 0 1px 0 rgba(255,255,255,.08)",
            backdropFilter: "blur(22px) saturate(145%)",
            WebkitBackdropFilter: "blur(22px) saturate(145%)",
          }}
        >
          <AdminThemeToggle theme={theme} onToggle={toggleTheme} sidebar />
          <button
            onClick={() => setShowCP(true)}
            className="flex items-center w-full px-[14px] py-[12px] rounded-[14px] text-left transition-all cursor-pointer hover:bg-white/10"
            style={{
              fontFamily: "Inter, sans-serif",
              fontWeight: 400,
              fontSize: "16px",
              lineHeight: "23.2px",
              color: "rgba(255,255,255,0.92)",
              background: "transparent",
              border: "none",
            }}
          >
            <LockKeyhole size={16} style={{ marginRight: "10px", color: "#26cd68" }} />
            Change Password
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-[14px] py-[12px] rounded-[14px] text-left transition-all cursor-pointer hover:bg-white/10"
            style={{
              fontFamily: "Inter, sans-serif",
              fontWeight: 400,
              fontSize: "16px",
              lineHeight: "23.2px",
              color: "rgba(255,255,255,0.92)",
              background: "transparent",
              border: "none",
            }}
          >
            <LogOut size={16} style={{ marginRight: "10px", color: "#26cd68" }} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="admin-main flex-1 min-w-0 p-6">
        {children}
      </main>

      {showCP && <ChangePasswordModal onClose={() => setShowCP(false)} />}
    </div>
  );
}
