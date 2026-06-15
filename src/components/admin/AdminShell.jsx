import React, { useState } from "react";
import canojaLogo from "../../assets/canojaLogo.png";
import { useNavigate, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";
import api from "../../services/api";
import ChangePasswordModal from "../ChangePasswordModal";

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
        onClick={() => navigate(path)}
        className="flex items-center w-full px-[14px] py-[12px] rounded-[14px] text-[16px] transition-all text-left cursor-pointer"
        style={{
          background: active ? "rgba(255,255,255,0.10)" : "transparent",
          color: "rgba(255,255,255,0.92)",
          fontFamily: "Inter, sans-serif",
          fontWeight: 400,
          lineHeight: "23.2px",
          border: "none",
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
        color: "rgba(255,255,255,0.68)",
        letterSpacing: "1.4208px",
        padding: "0",
        marginBottom: "4px",
      }}
    >
      {children}
    </p>
  );

  return (
    <div className="flex min-h-screen" style={{ background: "#f6f9f8", fontFamily: "Inter, sans-serif" }}>
      {/* Sidebar */}
      <aside
        className="sticky top-0 h-screen shrink-0 flex flex-col"
        style={{
          width: "279px",
          background: "linear-gradient(180deg, #0d3b2a 0%, #145237 100%)",
          borderRight: "0.8px solid rgba(255,255,255,0.08)",
        }}
      >
        {/* Brand */}
        <div className="flex items-center gap-[12px]" style={{ padding: "24px 24px 0 24px" }}>
          <div
            className="shrink-0"
            style={{
              width: "44px", height: "44px",
              borderRadius: "12px",
              background: "rgba(255,255,255,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <img src={canojaLogo} alt="Canoja" style={{ width: "32px", height: "32px", objectFit: "contain" }} />
          </div>
          <div className="flex flex-col gap-[2px]">
            <p
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 800,
                fontSize: "16px",
                lineHeight: "23.2px",
                color: "#f8fffb",
                whiteSpace: "nowrap",
              }}
            >
              Canoja
            </p>
            <p
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 400,
                fontSize: "13.12px",
                lineHeight: "19.024px",
                color: "rgba(255,255,255,0.72)",
                whiteSpace: "nowrap",
              }}
            >
              Admin + Marketplace Feed
            </p>
          </div>
        </div>

        {/* Nav */}
        <div className="flex flex-col flex-1 overflow-y-auto" style={{ padding: "24px 24px 0 24px", gap: "20px" }}>
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
            padding: "12px 24px 24px 24px",
            borderTop: "1px solid rgba(255,255,255,0.10)",
            marginTop: "auto",
          }}
        >
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
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 p-6">
        {children}
      </main>

      {showCP && <ChangePasswordModal onClose={() => setShowCP(false)} />}
    </div>
  );
}
