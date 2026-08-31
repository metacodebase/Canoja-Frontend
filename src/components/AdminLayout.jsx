// Update AdminLayout.jsx to use AuthContext
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import AdminHeader from "./AdminHeader";
import Sidebar from "./Sidebar";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import ChangePasswordModal from "./ChangePasswordModal";
import api from "../services/api";
import AdminThemeToggle from "./admin/AdminThemeToggle";
import useAdminTheme from "./admin/useAdminTheme";
import "./admin/adminTheme.css";

const AdminLayout = ({ children }) => {
  const navigate = useNavigate();
  const { logout } = useAuth(); 
  const queryClient = useQueryClient();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, toggleTheme } = useAdminTheme();

  const handleLogout = async () => {
    try {
      // Call backend logout to clear refresh token from DB
      await api.post("/users/logout").catch(() => {});

      // Clear React Query cache
      queryClient.clear();

      // Call AuthContext logout (removes tokens + updates state)
      logout();

      // Show success message
      toast.success("Logged out successfully");

      // Redirect to login page
      navigate("/login");

    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Error during logout");

      // Force cleanup anyway
      logout();
      navigate("/login");
    }
  };

  return (
    <div className={`admin-theme admin-theme--${theme}`} style={{
      minHeight: "100vh",
      background: "#fff",
      fontFamily: "system-ui, -apple-system, sans-serif",
      width: "100%",
    }}>
      <AdminHeader onLogout={handleLogout} />
      <div style={{
        display: "flex",
        maxWidth: "1280px",
        margin: "0 auto",
        minHeight: "calc(100vh - 72px)",
      }}>
        {/* Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          onChangePassword={() => setShowChangePassword(true)}
          themeControl={<AdminThemeToggle theme={theme} onToggle={toggleTheme} sidebar />}
          navItems={[
            {
              label: "Verification Requests",
              path: "/admin/verification-requests",
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
              ),
            },
            {
              label: "History",
              path: "/admin/history",
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                </svg>
              ),
            },
            {
              label: "Users",
              path: "/admin/users",
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              ),
            },
          ]}
        />

        {/* Main Content */}
        <main style={{
          flex: 1,
          padding: "32px 24px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "stretch",
        }}>
          {children}
        </main>
      </div>

      {/* Change Password Modal */}
      {showChangePassword && (
        <ChangePasswordModal
          onClose={() => setShowChangePassword(false)}
        />
      )}
    </div>
  );
};

export default AdminLayout;
