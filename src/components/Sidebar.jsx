import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

const Sidebar = ({ isOpen, onToggle, onChangePassword, themeControl, navItems = [] }) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <>
      {/* Floating Hamburger Menu Button */}
      <button
        onClick={onToggle}
        style={{
          position: "fixed",
          left: "12px",
          top: "84px",
          width: "36px",
          height: "36px",
          background: isOpen ? "rgba(239, 68, 68, 0.08)" : "rgba(16, 185, 129, 0.08)",
          border: `1.5px solid ${isOpen ? "#ef4444" : "#10b981"}`,
          borderRadius: "8px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.25s ease",
          zIndex: 1000,
          padding: 0,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = isOpen ? "rgba(239, 68, 68, 0.15)" : "rgba(16, 185, 129, 0.15)";
          e.currentTarget.style.transform = "scale(1.05)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = isOpen ? "rgba(239, 68, 68, 0.08)" : "rgba(16, 185, 129, 0.08)";
          e.currentTarget.style.transform = "scale(1)";
        }}>
        {isOpen ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18" /><path d="M6 6l12 12" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12h18" /><path d="M3 6h18" /><path d="M3 18h18" />
          </svg>
        )}
      </button>

      {/* Sidebar */}
      <aside
        style={{
          position: "fixed",
          left: 0,
          top: "72px",
          width: isOpen ? "260px" : "0",
          height: "calc(100vh - 72px)",
          background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
          borderRight: isOpen ? "1px solid #e2e8f0" : "none",
          padding: isOpen ? "24px 0 24px 56px" : "0",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          overflow: "hidden",
          boxShadow: isOpen ? "2px 0 8px rgba(0, 0, 0, 0.05)" : "none",
          zIndex: 999,
        }}>
        {isOpen && (
          <>
            {/* Sidebar Header */}
            <div style={{ padding: "0 20px 24px 0", borderBottom: "1px solid #e2e8f0", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "13px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", margin: 0 }}>
                Menu
              </h3>
            </div>

            {/* Navigation Items */}
            <nav style={{ display: "flex", flexDirection: "column", gap: "4px", padding: "0 12px 0 0" }}>
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                      padding: "12px 16px",
                      background: isActive ? "linear-gradient(135deg, #f0fdf4, #dcfce7)" : "transparent",
                      border: "none",
                      borderRadius: "10px",
                      cursor: "pointer",
                      fontSize: "15px",
                      fontWeight: "600",
                      color: isActive ? "#10b981" : "#475569",
                      transition: "all 0.2s ease",
                      textAlign: "left",
                      width: "100%",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = "linear-gradient(135deg, #f0fdf4, #dcfce7)";
                        e.currentTarget.style.color = "#10b981";
                        e.currentTarget.style.transform = "translateX(4px)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = "#475569";
                        e.currentTarget.style.transform = "translateX(0)";
                      }
                    }}>
                    <div style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "9px",
                      background: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      {item.icon}
                    </div>
                    <span>{item.label}</span>
                  </button>
                );
              })}

              {/* Divider before Change Password */}
              {navItems.length > 0 && (
                <div style={{ borderTop: "1px solid #e2e8f0", margin: "8px 0" }} />
              )}

              {themeControl}

              {/* Change Password */}
              <button
                onClick={onChangePassword}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  padding: "12px 16px",
                  background: "transparent",
                  border: "none",
                  borderRadius: "10px",
                  cursor: "pointer",
                  fontSize: "15px",
                  fontWeight: "600",
                  color: "#475569",
                  transition: "all 0.2s ease",
                  textAlign: "left",
                  width: "100%",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "linear-gradient(135deg, #f0fdf4, #dcfce7)";
                  e.currentTarget.style.color = "#10b981";
                  e.currentTarget.style.transform = "translateX(4px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#475569";
                  e.currentTarget.style.transform = "translateX(0)";
                }}>
                <div style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "9px",
                  background: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
                  </svg>
                </div>
                <span>Change Password</span>
              </button>
            </nav>
          </>
        )}
      </aside>
    </>
  );
};

export default Sidebar;
