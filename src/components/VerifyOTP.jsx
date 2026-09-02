import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useResetPassword, useVerifyOTP } from "../services/admin";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const VerifyOTP = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || "";
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState("otp"); // "otp" or "password"
  const resetPasswordMutation = useResetPassword();
  const verifyOTPMutation = useVerifyOTP();
  const inputRefs = useRef([]);

  useEffect(() => {
    if (!email) {
      toast.error("Email address is required");
      navigate("/forgot-password");
    }
  }, [email, navigate]);

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return; // Only allow single digit
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length && i < 6; i++) {
      if (/^\d$/.test(pastedData[i])) {
        newOtp[i] = pastedData[i];
      }
    }
    setOtp(newOtp);
    // Focus the last filled input or the last input
    const lastFilledIndex = Math.min(pastedData.length - 1, 5);
    inputRefs.current[lastFilledIndex]?.focus();
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    const otpString = otp.join("");
    
    if (otpString.length !== 6) {
      toast.error("Please enter the complete 6-digit OTP");
      return;
    }

    // Verify OTP with backend
    try {
      await verifyOTPMutation.mutateAsync({
        email,
        otp: otpString,
      });
      toast.success("OTP verified successfully!");
      // Only move to password step if OTP is valid
      setStep("password");
    } catch (error) {
      toast.error(error.message || "Invalid or expired OTP");
      // Clear OTP fields on error
      setOtp(["", "", "", "", "", ""]);
      // Focus first input
      inputRefs.current[0]?.focus();
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    const otpString = otp.join("");

    try {
      await resetPasswordMutation.mutateAsync({
        email,
        otp: otpString,
        newPassword,
      });
      toast.success("Password reset successfully! Redirecting to login...");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error) {
      toast.error(error.message || "Failed to reset password");
      // If OTP is invalid, go back to OTP step
      if (error.message?.toLowerCase().includes("otp")) {
        setStep("otp");
        setOtp(["", "", "", "", "", ""]);
      }
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
              background: step === "otp" 
                ? "linear-gradient(135deg, #dbeafe, #bfdbfe)"
                : "linear-gradient(135deg, #fef3c7, #fde68a)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
            {step === "otp" ? (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
              </svg>
            ) : (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                <path d="M12 15v2" strokeLinecap="round" />
                <path d="M12 9v.01" strokeLinecap="round" />
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
              </svg>
            )}
          </div>
          <h2
            style={{
              fontSize: "28px",
              fontWeight: "700",
              color: "#1e293b",
              margin: "0 0 8px 0",
            }}>
            {step === "otp" ? "Enter OTP" : "Set New Password"}
          </h2>
          <p
            style={{
              color: "#64748b",
              fontSize: "15px",
              margin: 0,
              lineHeight: "1.5",
            }}>
            {step === "otp"
              ? `We've sent a 6-digit OTP to ${email}. Please enter it below.`
              : "Please enter your new password below."}
          </p>
        </div>

        {/* OTP Step */}
        {step === "otp" && (
          <form onSubmit={handleVerifyOTP}>
            <div style={{ marginBottom: "24px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "12px",
                  color: "#374151",
                  fontWeight: "600",
                  fontSize: "14px",
                  textAlign: "center",
                }}>
                Enter 6-Digit OTP
              </label>
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  justifyContent: "center",
                }}>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength="1"
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    onPaste={handleOtpPaste}
                    style={{
                      width: "50px",
                      height: "60px",
                      textAlign: "center",
                      fontSize: "24px",
                      fontWeight: "700",
                      borderRadius: "10px",
                      border: "2px solid #e2e8f0",
                      outline: "none",
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
                ))}
              </div>
            </div>

            <button
              type="submit"
              style={{
                width: "100%",
                padding: "16px 24px",
                background: "linear-gradient(135deg, #10b981, #059669)",
                color: "#ffffff",
                border: "none",
                borderRadius: "10px",
                fontSize: "16px",
                fontWeight: "700",
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
                marginBottom: "20px",
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 6px 16px rgba(16, 185, 129, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 4px 12px rgba(16, 185, 129, 0.3)";
              }}>
              Verify OTP
            </button>
          </form>
        )}

        {/* Password Step */}
        {step === "password" && (
          <form onSubmit={handleResetPassword}>
            {/* New Password */}
            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
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
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
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
                  onClick={() => setShowPassword(!showPassword)}
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
                  }}>
                  {showPassword ? (
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
            <div style={{ marginBottom: "24px" }}>
              <label
                style={{
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
                  placeholder="Confirm new password"
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

            <button
              type="submit"
              disabled={resetPasswordMutation.isPending}
              style={{
                width: "100%",
                padding: "16px 24px",
                background: resetPasswordMutation.isPending
                  ? "#94a3b8"
                  : "linear-gradient(135deg, #10b981, #059669)",
                color: "#ffffff",
                border: "none",
                borderRadius: "10px",
                fontSize: "16px",
                fontWeight: "700",
                cursor: resetPasswordMutation.isPending ? "not-allowed" : "pointer",
                transition: "all 0.2s ease",
                boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
                marginBottom: "20px",
              }}
              onMouseEnter={(e) => {
                if (!resetPasswordMutation.isPending) {
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow = "0 6px 16px rgba(16, 185, 129, 0.4)";
                }
              }}
              onMouseLeave={(e) => {
                if (!resetPasswordMutation.isPending) {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "0 4px 12px rgba(16, 185, 129, 0.3)";
                }
              }}>
              {resetPasswordMutation.isPending ? (
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
                  Resetting Password...
                </span>
              ) : (
                "Reset Password"
              )}
            </button>

            {/* Back button */}
            <div style={{ textAlign: "center" }}>
              <button
                type="button"
                onClick={() => setStep("otp")}
                style={{
                  background: "none",
                  border: "none",
                  color: "#10b981",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  padding: "8px",
                }}
                onMouseEnter={(e) => {
                  e.target.style.textDecoration = "underline";
                }}
                onMouseLeave={(e) => {
                  e.target.style.textDecoration = "none";
                }}>
                ← Back to OTP
              </button>
            </div>
          </form>
        )}

        {/* Back to Login */}
        {step === "otp" && (
          <div style={{ textAlign: "center", marginTop: "20px" }}>
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
        )}
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

export default VerifyOTP;
