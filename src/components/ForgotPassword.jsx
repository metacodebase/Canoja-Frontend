import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useRequestPasswordReset } from "../services/admin";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();
  const requestPasswordResetMutation = useRequestPasswordReset();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    try {
      await requestPasswordResetMutation.mutateAsync(email);
      toast.success("OTP has been sent to your email address");
      // Navigate to OTP verification page with email
      navigate("/verify-otp", { state: { email } });
    } catch (error) {
      toast.error(error.message || "Failed to send OTP");
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
        <div style={{ marginBottom: "32px", textAlign: "center" }}>
          <div
            style={{
              width: "64px",
              height: "64px",
              margin: "0 auto 16px",
              background: "linear-gradient(135deg, #dbeafe, #bfdbfe)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
              <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
            </svg>
          </div>
          <h2
            style={{
              fontSize: "28px",
              fontWeight: "700",
              color: "#1e293b",
              margin: "0 0 8px 0",
            }}>
            Forgot Password?
          </h2>
          <p
            style={{
              color: "#64748b",
              fontSize: "15px",
              margin: 0,
              lineHeight: "1.5",
            }}>
            Enter your email address and we'll send you an OTP to reset your password.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Email field */}
          <div style={{ marginBottom: "24px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                color: "#374151",
                fontWeight: "600",
                fontSize: "14px",
              }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{
                width: "100%",
                padding: "14px 16px",
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
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={requestPasswordResetMutation.isPending}
            style={{
              width: "100%",
              padding: "16px 24px",
              background: requestPasswordResetMutation.isPending
                ? "#94a3b8"
                : "linear-gradient(135deg, #10b981, #059669)",
              color: "#ffffff",
              border: "none",
              borderRadius: "10px",
              fontSize: "16px",
              fontWeight: "700",
              cursor: requestPasswordResetMutation.isPending ? "not-allowed" : "pointer",
              transition: "all 0.2s ease",
              boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
              marginBottom: "20px",
            }}
            onMouseEnter={(e) => {
              if (!requestPasswordResetMutation.isPending) {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 6px 16px rgba(16, 185, 129, 0.4)";
              }
            }}
            onMouseLeave={(e) => {
              if (!requestPasswordResetMutation.isPending) {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 4px 12px rgba(16, 185, 129, 0.3)";
              }
            }}>
            {requestPasswordResetMutation.isPending ? (
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
                Sending OTP...
              </span>
            ) : (
              "Send OTP"
            )}
          </button>

          {/* Back to Login */}
          <div style={{ textAlign: "center" }}>
            <Link
              to="/login"
              style={{
                color: "#10b981",
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: "600",
              }}
              onMouseEnter={(e) => {
                e.target.style.textDecoration = "underline";
              }}
              onMouseLeave={(e) => {
                e.target.style.textDecoration = "none";
              }}>
              ← Back to Login
            </Link>
          </div>
        </form>
      </div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ForgotPassword;
