import React, { useState, useEffect } from "react";
import canojaLogo from "../assets/canojaLogo.png";
import { useAdminLogin } from "../services/admin";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ForcedPasswordChange from "./ForcedPasswordChange";
import "./loginTheme.css";

const Login = () => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [needsPasswordChange, setNeedsPasswordChange] = useState(false);
	const [theme, setTheme] = useState(() => localStorage.getItem("canoja-theme") || "dark");
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const { login, isAuthenticated, user, activeBusinessId } = useAuth();
	const loginMutation = useAdminLogin();

	useEffect(() => {
		if (searchParams.get("reason") === "deactivated") {
			toast.error("Your account has been deactivated.");
		}
	}, [searchParams]);

	useEffect(() => {
		localStorage.setItem("canoja-theme", theme);
		localStorage.removeItem("canoja-login-theme");
	}, [theme]);

	// Redirect based on role if already authenticated (but not if password change is required)
	useEffect(() => {
		if (isAuthenticated && user && !user.requiresPasswordChange) {
			// Get role from user object or JWT token (decoded user)
			const role = user.role;
			
			if (role === "admin") {
				navigate("/admin/dashboard", { replace: true });
			} else if (role === "operator") {
				const needsBusinessSelection = user.businesses?.length > 1 && !activeBusinessId;
				navigate(needsBusinessSelection ? "/operator/switch-business" : "/operator/dashboard", { replace: true });
			} else {
				// For consumers, redirect to shop-finder
				navigate("/explore", { replace: true });
			}
		}
	}, [activeBusinessId, isAuthenticated, user, navigate]);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");
		if (!email || !password) {
			setError("Email and password are required.");
			toast.error("Email and password are required.");
			return;
		}
		try {
			const response = await loginMutation.mutateAsync({ email, password });
			
			// Check if password change is required
			const requiresPasswordChange = response.user?.requiresPasswordChange === true;
			
			// Set user state with refresh token
			login(response.token, response.user, response.refreshToken);
			
			if (requiresPasswordChange) {
				// Set flag to show forced password change screen
				setNeedsPasswordChange(true);
				toast.success("Login successful! Please change your password.");
				return;
			}

			// Clear the flag if not needed
			setNeedsPasswordChange(false);
			toast.success("Login successful!");

			// Redirect based on user role
			const userRole = response.user?.role || "consumer";
			if (userRole === "admin") {
				navigate("/admin/dashboard");
			} else if (userRole === "operator") {
				navigate(response.user?.businesses?.length > 1 ? "/operator/switch-business" : "/operator/dashboard");
			} else {
				// For consumers, redirect to shop-finder instead of "/" to avoid redirect loop
				navigate("/explore");
			}
		} catch (error) {
			setError(error.message);
			toast.error(error.message || "Login failed");
		}
	};

	// Cannabis leaf icon SVG
	const CannabisLeaf = ({ size = 24 }) => (
		<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
			<path d="M12 2c-1.5 2.5-3 4-5 5 1 1 2.5 1.5 4 2-1.5 1-3 2-4 4 2-1 4-1.5 5-1 0 1.5-.5 3-1 4.5 1.5-1 3-2.5 4-4.5 1 2 2.5 3.5 4 4.5-.5-1.5-1-3-1-4.5 1-.5 3 0 5 1-1-2-2.5-3-4-4 1.5-.5 3-1 4-2-2-1-3.5-2.5-5-5-1 2-2.5 3.5-4 5z" />
		</svg>
	);

	// Show forced password change if user is authenticated and requires password change
	// Check both the flag and the user object
	// Only show if explicitly true (not false or undefined)
	if (needsPasswordChange || (isAuthenticated && user && user.requiresPasswordChange === true)) {
		return <ForcedPasswordChange />;
	}

	return (
		<div
			className={`login-page login-page--${theme}`}
			style={{
				minHeight: "100vh",
				width: "100%",
				display: "flex",
				margin: 0,
				boxSizing: "border-box",
				position: "relative",
				fontFamily: "system-ui, -apple-system, sans-serif",
			}}>
			<ToastContainer position="top-center" autoClose={3000} />
			<button
				type="button"
				className="login-theme-toggle"
				onClick={() => setTheme((current) => current === "dark" ? "light" : "dark")}
				aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
				aria-pressed={theme === "light"}>
				<svg className={`theme-icon theme-icon--sun${theme === "dark" ? " active" : ""}`} aria-hidden="true" viewBox="0 0 24 24">
						<circle cx="12" cy="12" r="4" />
						<path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
				</svg>
				<svg className={`theme-icon theme-icon--moon${theme === "light" ? " active" : ""}`} aria-hidden="true" viewBox="0 0 24 24">
					<path d="M20.5 15.2A8.5 8.5 0 0 1 8.8 3.5a8.5 8.5 0 1 0 11.7 11.7Z" />
				</svg>
			</button>
			{/* Left Side - Welcome Section */}
			<div
				style={{
					flex: 1,
					minHeight: "100vh",
					boxSizing: "border-box",
					background: "linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					position: "relative",
					overflow: "hidden",
					padding: "32px",
				}}>
				{/* Decorative geometric elements */}
				<div
					style={{
						position: "absolute",
						top: "15%",
						left: "10%",
						width: "100px",
						height: "100px",
						border: "2px solid rgba(255,255,255,0.15)",
						borderRadius: "50%",
					}}
				/>
				<div
					style={{
						position: "absolute",
						top: "60%",
						right: "15%",
						width: "8px",
						height: "8px",
						background: "rgba(255,255,255,0.5)",
						borderRadius: "50%",
					}}
				/>
				<div
					style={{
						position: "absolute",
						bottom: "25%",
						left: "20%",
						width: "16px",
						height: "16px",
						background: "rgba(255,255,255,0.4)",
						borderRadius: "50%",
					}}
				/>
				<div
					style={{
						position: "absolute",
						top: "30%",
						right: "25%",
						color: "rgba(255,255,255,0.15)",
					}}>
					<CannabisLeaf size={40} />
				</div>
				<div
					style={{
						position: "absolute",
						bottom: "40%",
						right: "8%",
						color: "rgba(255,255,255,0.1)",
					}}>
					<CannabisLeaf size={56} />
				</div>

				{/* Decorative dots pattern */}
				<div
					style={{
						position: "absolute",
						top: "20%",
						right: "12%",
						display: "grid",
						gridTemplateColumns: "repeat(3, 1fr)",
						gap: "10px",
					}}>
					{[...Array(9)].map((_, i) => (
						<div
							key={i}
							style={{
								width: "5px",
								height: "5px",
								background: "rgba(255,255,255,0.4)",
								borderRadius: "50%",
							}}
						/>
					))}
				</div>

				{/* Welcome content */}
				<div style={{ textAlign: "center", zIndex: 2, color: "white" }}>
					<div
						style={{
							display: "inline-flex",
							alignItems: "center",
							justifyContent: "center",
							width: "80px",
							height: "80px",
							background: "rgba(255,255,255,0.15)",
							borderRadius: "50%",
							marginBottom: "20px",
							backdropFilter: "blur(10px)",
						}}>
						<img
							src={canojaLogo}
							alt="Canoja Logo"
							style={{
								width: 50,
								height: 50,
								borderRadius: 12,
								objectFit: "cover",
							}}
						/>
					</div>
					<h1
						style={{
							fontSize: "42px",
							fontWeight: "800",
							margin: "0 0 12px 0",
							letterSpacing: "-1.5px",
						}}>
						Welcome back!
					</h1>
					<p
						style={{
							fontSize: "18px",
							opacity: 0.95,
							margin: "0",
							maxWidth: "360px",
							lineHeight: "1.5",
							fontWeight: "300",
						}}>
						Sign in to access your Canoja account and manage your cannabis business operations
					</p>
				</div>
			</div>

			{/* Right Side - Login Form */}
			<div
				style={{
					flex: 1,
					minHeight: "100vh",
					boxSizing: "border-box",
					background: "#f8fafc",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					padding: "28px 40px",
					overflowY: "auto",
				}}>
				<div style={{ width: "100%", maxWidth: "420px" }}>
					{/* Error message */}
					{error && (
						<div
							style={{
								color: "#dc2626",
								marginBottom: 20,
								textAlign: "center",
								fontWeight: 500,
								padding: "12px 16px",
								background: "#fef2f2",
								borderRadius: "8px",
								border: "1px solid #fecaca",
							}}>
							{error}
						</div>
					)}

					{/* Header */}
					<div style={{ marginBottom: "24px" }}>
						<h2
							style={{
								fontSize: "32px",
								fontWeight: "800",
								color: "#0f172a",
								margin: "0 0 6px 0",
								letterSpacing: "-1px",
							}}>
							Sign In
						</h2>
						<p
							style={{
								color: "#64748b",
								fontSize: "16px",
								margin: "0",
								fontWeight: "400",
							}}>
							Enter your credentials to access your account
						</p>
					</div>

					{/* Form */}
					<form onSubmit={handleSubmit}>
						{/* Email field */}
						<div style={{ marginBottom: "16px" }}>
							<label
								style={{
									display: "block",
									marginBottom: "10px",
									color: "#1e293b",
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
									padding: "13px 16px",
									borderRadius: "12px",
									border: "2px solid #e2e8f0",
									fontSize: "16px",
									transition: "all 0.2s ease",
									outline: "none",
									boxSizing: "border-box",
									background: "#ffffff",
									color: "#0f172a",
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
						</div>

						{/* Password field */}
						<div style={{ position: "relative", marginBottom: "18px" }}>
							<label
								style={{
									display: "block",
									marginBottom: "10px",
									color: "#1e293b",
									fontWeight: "600",
									fontSize: "14px",
								}}>
								Password
							</label>
							<input
								type={showPassword ? "text" : "password"}
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								placeholder="Enter your password"
								style={{
									width: "100%",
									paddingTop: "13px",
									paddingRight: "50px",
									paddingBottom: "13px",
									paddingLeft: "16px",
									borderRadius: "12px",
									border: "2px solid #e2e8f0",
									fontSize: "16px",
									transition: "all 0.2s ease",
									outline: "none",
									boxSizing: "border-box",
									background: "#ffffff",
									color: "#0f172a",
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
								onClick={() => setShowPassword((prev) => !prev)}
								style={{
									position: "absolute",
									right: 12,
									top: 38,
									height: 40,
									width: 40,
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									background: "none",
									border: "none",
									cursor: "pointer",
									padding: 0,
									color: "#64748b",
									borderRadius: "8px",
									transition: "all 0.2s ease",
								}}
								onMouseEnter={(e) => {
									e.target.style.background = "#f1f5f9";
									e.target.style.color = "#475569";
								}}
								onMouseLeave={(e) => {
									e.target.style.background = "none";
									e.target.style.color = "#64748b";
								}}
								aria-label={showPassword ? "Hide password" : "Show password"}>
								{showPassword ? (
									// Eye-off SVG
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
									// Eye SVG
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

					{/* Forgot Password Link */}
					<div style={{ textAlign: "right", marginBottom: "16px" }}>
						<Link
							to="/forgot-password"
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
							Forgot Password?
						</Link>
					</div>

					{/* Sign in button */}
					<button
							type="submit"
						style={{
							width: "100%",
							background: loginMutation.isPending
								? "linear-gradient(135deg, #059669 60%, #10b981 100%)"
								: "linear-gradient(135deg, #059669, #10b981)",
							color: "#ffffff",
							padding: "15px 24px",
							border: "none",
							borderRadius: "12px",
							fontWeight: "700",
							fontSize: "16px",
							cursor: loginMutation.isPending ? "not-allowed" : "pointer",
							transition: "all 0.2s ease",
							boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
							opacity: loginMutation.isPending ? 0.7 : 1,
							position: "relative",
						}}
						disabled={loginMutation.isPending}
						onMouseEnter={(e) => {
							if (!loginMutation.isPending) {
								e.target.style.transform = "translateY(-2px)";
								e.target.style.boxShadow = "0 6px 16px rgba(16, 185, 129, 0.4)";
							}
						}}
						onMouseLeave={(e) => {
							if (!loginMutation.isPending) {
								e.target.style.transform = "translateY(0)";
								e.target.style.boxShadow = "0 4px 12px rgba(16, 185, 129, 0.3)";
							}
						}}>
						{loginMutation.isPending ? (
							<span>
								<span
									className="spinner"
									style={{
										display: "inline-block",
										width: 20,
										height: 20,
										border: "3px solid #fff",
										borderTop: "3px solid transparent",
										borderRadius: "50%",
										animation: "spin 1s linear infinite",
										marginRight: 10,
										verticalAlign: "middle",
									}}
								/>
								Signing In...
							</span>
						) : (
							"Sign In"
						)}
					</button>
					</form>

					<div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
						<span style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
						<span style={{ color: "#94a3b8", fontSize: 13, fontWeight: 600 }}>NEW TO CANOJA?</span>
						<span style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
					</div>
					<button
						type="button"
						onClick={() => navigate("/age-verification")}
						style={{
							width: "100%",
							padding: "14px 24px",
							border: "2px solid #10b981",
							borderRadius: 12,
							background: "#fff",
							color: "#047857",
							fontSize: 16,
							fontWeight: 700,
						}}>
						New User — Explore Canoja
					</button>

					{/* Footer text */}
					<div style={{ textAlign: "center", marginTop: "24px" }}>
						<p
							style={{
								color: "#94a3b8",
								fontSize: "14px",
								margin: "0",
								lineHeight: "1.5",
							}}>
							Powered by Canoja • Secure Cannabis Management Platform
						</p>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Login;

// Add spinner animation
const style = document.createElement("style");
style.innerHTML = `
@keyframes spin {
	0% { transform: rotate(0deg); }
	100% { transform: rotate(360deg); }
}`;
document.head.appendChild(style);
