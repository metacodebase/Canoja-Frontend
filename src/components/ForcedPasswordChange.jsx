import React, { useState } from "react";
import { useChangePassword } from "../services/admin";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuth } from "../context/AuthContext";

const ForcedPasswordChange = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const changePasswordMutation = useChangePassword();
  const { user, updateUser } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("All fields are required");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters long");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (currentPassword === newPassword) {
      toast.error("New password must be different from current password");
      return;
    }

    try {
      await changePasswordMutation.mutateAsync({
        currentPassword,
        newPassword,
      });
      
      // Update user in auth context (clear requiresPasswordChange)
      // This ensures the Login component won't show ForcedPasswordChange again
      if (updateUser && user) {
        updateUser({
          ...user,
          requiresPasswordChange: false,
        });
      }
      
      toast.success("Password changed successfully! Redirecting...");
      
      // Redirect immediately after a short delay
      // Use window.location for a hard redirect to ensure we leave the Login route
      setTimeout(() => {
        const role = user?.role || "consumer";
        let redirectPath = "/explore";
        if (role === "admin") {
          redirectPath = "/admin/dashboard";
        } else if (role === "operator") {
          redirectPath = "/operator/dashboard";
        }
        // Use window.location for a hard redirect to ensure clean navigation
        window.location.href = redirectPath;
      }, 1000);
    } catch (error) {
      toast.error(error.message || "Failed to change password");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #bbf7d0 100%)",
        padding: "20px",
      }}>
      <div
        style={{
          background: "#ffffff",
          borderRadius: "20px",
          padding: "40px",
          maxWidth: "500px",
          width: "100%",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        }}>
        {/* Header */}
        <div style={{
          marginBottom: "32px",
          textAlign: "center",
        }}>
          <div style={{
            width: "64px",
            height: "64px",
            margin: "0 auto 16px",
            background: "linear-gradient(135deg, #fef3c7, #fde68a)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
              <path d="M12 15v2" strokeLinecap="round" />
              <path d="M12 9v.01" strokeLinecap="round" />
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
            </svg>
          </div>
          <h2 style={{
            fontSize: "28px",
            fontWeight: "700",
            color: "#1e293b",
            margin: "0 0 8px 0",
          }}>
            Change Your Password
          </h2>
          <p style={{
            color: "#64748b",
            fontSize: "15px",
            margin: 0,
            lineHeight: "1.5",
          }}>
            For security reasons, you must change your password before accessing your account.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Current Password */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{
              display: "block",
              marginBottom: "8px",
              color: "#374151",
              fontWeight: "600",
              fontSize: "14px",
            }}>
              Current Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter the password from your email"
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  paddingRight: "45px",
                  borderRadius: "10px",
                  border: "2px solid #e2e8f0",
                  fontSize: "15px",
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "all 0.2s ease",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#10b981";
                  e.target.style.boxShadow = "0 0 0 4px rgba(16, 185, 129, 0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#e2e8f0";
                  e.target.style.boxShadow = "none";
                }}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px",
                  color: "#64748b",
                  borderRadius: "6px",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = "#f1f5f9";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "none";
                }}>
                {showCurrentPassword ? (
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                    <path
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17.94 17.94A10.06 10.06 0 0 1 12 20c-5 0-9.27-3.11-10-7.5a9.98 9.98 0 0 1 3.07-5.16m3.11-2.13A9.93 9.93 0 0 1 12 4c5 0 9.27 3.11 10 7.5a9.97 9.97 0 0 1-2.11 3.61M9.88 9.88A3 3 0 0 1 12 9c1.66 0 3 1.34 3 3 0 .42-.09.82-.24 1.18"
                    />
                    <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="m3 3 18 18" />
                  </svg>
                ) : (
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                    <path
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12Z"
                    />
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{
              display: "block",
              marginBottom: "8px",
              color: "#374151",
              fontWeight: "600",
              fontSize: "14px",
            }}>
              New Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter your new password"
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  paddingRight: "45px",
                  borderRadius: "10px",
                  border: "2px solid #e2e8f0",
                  fontSize: "15px",
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "all 0.2s ease",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#10b981";
                  e.target.style.boxShadow = "0 0 0 4px rgba(16, 185, 129, 0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#e2e8f0";
                  e.target.style.boxShadow = "none";
                }}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px",
                  color: "#64748b",
                  borderRadius: "6px",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = "#f1f5f9";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "none";
                }}>
                {showNewPassword ? (
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                    <path
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17.94 17.94A10.06 10.06 0 0 1 12 20c-5 0-9.27-3.11-10-7.5a9.98 9.98 0 0 1 3.07-5.16m3.11-2.13A9.93 9.93 0 0 1 12 4c5 0 9.27 3.11 10 7.5a9.97 9.97 0 0 1-2.11 3.61M9.88 9.88A3 3 0 0 1 12 9c1.66 0 3 1.34 3 3 0 .42-.09.82-.24 1.18"
                    />
                    <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="m3 3 18 18" />
                  </svg>
                ) : (
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                    <path
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12Z"
                    />
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div style={{ marginBottom: "28px" }}>
            <label style={{
              display: "block",
              marginBottom: "8px",
              color: "#374151",
              fontWeight: "600",
              fontSize: "14px",
            }}>
              Confirm New Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your new password"
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  paddingRight: "45px",
                  borderRadius: "10px",
                  border: "2px solid #e2e8f0",
                  fontSize: "15px",
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "all 0.2s ease",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#10b981";
                  e.target.style.boxShadow = "0 0 0 4px rgba(16, 185, 129, 0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#e2e8f0";
                  e.target.style.boxShadow = "none";
                }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px",
                  color: "#64748b",
                  borderRadius: "6px",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = "#f1f5f9";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "none";
                }}>
                {showConfirmPassword ? (
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                    <path
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17.94 17.94A10.06 10.06 0 0 1 12 20c-5 0-9.27-3.11-10-7.5a9.98 9.98 0 0 1 3.07-5.16m3.11-2.13A9.93 9.93 0 0 1 12 4c5 0 9.27 3.11 10 7.5a9.97 9.97 0 0 1-2.11 3.61M9.88 9.88A3 3 0 0 1 12 9c1.66 0 3 1.34 3 3 0 .42-.09.82-.24 1.18"
                    />
                    <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="m3 3 18 18" />
                  </svg>
                ) : (
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                    <path
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12Z"
                    />
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={changePasswordMutation.isPending}
            style={{
              width: "100%",
              padding: "16px 24px",
              background: changePasswordMutation.isPending
                ? "#94a3b8"
                : "linear-gradient(135deg, #10b981, #059669)",
              color: "#ffffff",
              border: "none",
              borderRadius: "10px",
              fontSize: "16px",
              fontWeight: "700",
              cursor: changePasswordMutation.isPending ? "not-allowed" : "pointer",
              transition: "all 0.2s ease",
              boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
            }}
            onMouseEnter={(e) => {
              if (!changePasswordMutation.isPending) {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 6px 16px rgba(16, 185, 129, 0.4)";
              }
            }}
            onMouseLeave={(e) => {
              if (!changePasswordMutation.isPending) {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 4px 12px rgba(16, 185, 129, 0.3)";
              }
            }}>
            {changePasswordMutation.isPending ? (
              <span>
                <span
                  style={{
                    display: "inline-block",
                    width: 16,
                    height: 16,
                    border: "2px solid #fff",
                    borderTop: "2px solid transparent",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                    marginRight: 8,
                    verticalAlign: "middle",
                  }}
                />
                Changing Password...
              </span>
            ) : (
              "Change Password & Continue"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForcedPasswordChange;
