import React, { useState } from "react";
import canojaLogo from "../assets/canojaLogo.png";
import { useAdminLogin } from "../services/admin";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const AdminLogin = () => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const navigate = useNavigate();
	const { login, isAuthenticated } = useAuth();
	const loginMutation = useAdminLogin();

	if (isAuthenticated) {
		return <Navigate to="/admin/dashboard" replace />;
	}

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
			// console.log("Response", response);
			// console.log("Response", response.token);
			login(response.token, response.user);
			toast.success("Login successful!");
			navigate("/admin/retailers");
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

	return (
		<div
			style={{
				minHeight: "100vh",
				width: "100vw",
				display: "flex",
				margin: 0,
				boxSizing: "border-box",
				position: "fixed",
				top: 0,
				left: 0,
				fontFamily: "system-ui, -apple-system, sans-serif",
			}}>
			{/* Left Side - Welcome Section */}
			<div
				style={{
					flex: 1,
					background: "linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					position: "relative",
					overflow: "hidden",
					padding: "60px 40px",
				}}>
				{/* Decorative geometric elements */}
				<div
					style={{
						position: "absolute",
						top: "15%",
						left: "10%",
						width: "80px",
						height: "80px",
						border: "2px solid rgba(255,255,255,0.2)",
						borderRadius: "50%",
					}}
				/>
				<div
					style={{
						position: "absolute",
						top: "60%",
						right: "15%",
						width: "6px",
						height: "6px",
						background: "rgba(255,255,255,0.4)",
						borderRadius: "50%",
					}}
				/>
				<div
					style={{
						position: "absolute",
						bottom: "25%",
						left: "20%",
						width: "12px",
						height: "12px",
						background: "rgba(255,255,255,0.3)",
						borderRadius: "50%",
					}}
				/>
				<div
					style={{
						position: "absolute",
						top: "30%",
						right: "25%",
						color: "rgba(255,255,255,0.2)",
					}}>
					<CannabisLeaf size={32} />
				</div>
				<div
					style={{
						position: "absolute",
						bottom: "40%",
						right: "8%",
						color: "rgba(255,255,255,0.15)",
					}}>
					<CannabisLeaf size={48} />
				</div>

				{/* Decorative dots pattern */}
				<div
					style={{
						position: "absolute",
						top: "20%",
						right: "12%",
						display: "grid",
						gridTemplateColumns: "repeat(3, 1fr)",
						gap: "8px",
					}}>
					{[...Array(9)].map((_, i) => (
						<div
							key={i}
							style={{
								width: "4px",
								height: "4px",
								background: "rgba(255,255,255,0.3)",
								borderRadius: "50%",
							}}
						/>
					))}
				</div>

				{/* Flowing wave decoration */}
				{/* <svg
					style={{
						position: "absolute",
						bottom: "-20px",
						left: "0",
						width: "100%",
						height: "120px",
						opacity: 0.1,
					}}
					viewBox="0 0 400 120"
					fill="none">
					<path d="M0,60 Q100,20 200,60 T400,60 L400,120 L0,120 Z" fill="rgba(255,255,255,0.2)" />
				</svg> */}

				{/* Welcome content */}
				<div style={{ textAlign: "center", zIndex: 2, color: "white" }}>
					<div
						style={{
							display: "inline-flex",
							alignItems: "center",
							justifyContent: "center",
							width: "80px",
							height: "80px",
							background: "rgba(255,255,255,0.2)",
							borderRadius: "50%",
							marginBottom: "32px",
							backdropFilter: "blur(10px)",
						}}>
						{/* <CannabisLeaf size={36} /> */}
					</div>
					<h1
						style={{
							fontSize: "42px",
							fontWeight: "700",
							margin: "0 0 16px 0",
							letterSpacing: "-1px",
						}}>
						Welcome back!
					</h1>
					<p
						style={{
							fontSize: "18px",
							opacity: 0.9,
							margin: "0",
							maxWidth: "320px",
							lineHeight: "1.6",
						}}>
						Access your Canoja admin portal and manage cannabis operations securely
					</p>
				</div>
			</div>

			{/* Right Side - Login Form */}
			<div
				style={{
					flex: 1,
					background: "#ffffff",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					padding: "60px 40px",
				}}>
				<div style={{ width: "100%", maxWidth: "400px" }}>
					{/* Canoja Logo */}
					<div style={{ display: "flex", justifyContent: "center", marginBottom: 32 }}>
						<img
							src={canojaLogo}
							alt="Canoja Logo"
							style={{
								width: 64,
								height: 64,
								borderRadius: 16,
								objectFit: "cover",
								background: "#fff",
								boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
							}}
						/>
					</div>

					{/* Error message */}
					{error && (
						<div style={{ color: "#dc2626", marginBottom: 16, textAlign: "center", fontWeight: 500 }}>{error}</div>
					)}

					{/* Header */}
					<div style={{ marginBottom: "48px" }}>
						<h2
							style={{
								fontSize: "32px",
								fontWeight: "700",
								color: "#111827",
								margin: "0 0 8px 0",
								letterSpacing: "-0.5px",
							}}>
							Sign In
						</h2>
						<p
							style={{
								color: "#6b7280",
								fontSize: "16px",
								margin: "0",
							}}>
							Enter your credentials to access admin portal
						</p>
					</div>

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
							Email
						</label>
						<input
							type="text"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="Enter your email"
							style={{
								width: "100%",
								padding: "14px 16px",
								borderRadius: "12px",
								border: "2px solid #e5e7eb",
								fontSize: "16px",
								transition: "all 0.2s ease",
								outline: "none",
								boxSizing: "border-box",
								background: "#f9fafb",
								color: "#111",
							}}
							onFocus={(e) => {
								e.target.style.borderColor = "#10b981";
								e.target.style.background = "#ffffff";
								e.target.style.boxShadow = "0 0 0 3px rgba(16, 185, 129, 0.1)";
							}}
							onBlur={(e) => {
								e.target.style.borderColor = "#e5e7eb";
								e.target.style.background = "#f9fafb";
								e.target.style.boxShadow = "none";
							}}
						/>
					</div>

					{/* Password field */}
					<div style={{ position: "relative", marginBottom: "32px" }}>
						<label
							style={{
								display: "block",
								marginBottom: "8px",
								color: "#374151",
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
								padding: "14px 16px",
								borderRadius: "12px",
								border: "2px solid #e5e7eb",
								fontSize: "16px",
								transition: "all 0.2s ease",
								outline: "none",
								boxSizing: "border-box",
								background: "#f9fafb",
								color: "#111",
							}}
							onFocus={(e) => {
								e.target.style.borderColor = "#10b981";
								e.target.style.background = "#ffffff";
								e.target.style.boxShadow = "0 0 0 3px rgba(16, 185, 129, 0.1)";
							}}
							onBlur={(e) => {
								e.target.style.borderColor = "#e5e7eb";
								e.target.style.background = "f9fafb";
								e.target.style.boxShadow = "none";
							}}
						/>
						<button
							type="button"
							onClick={() => setShowPassword((prev) => !prev)}
							style={{
								position: "absolute",
								right: 8,
								top: 14,
								height: "100%",
								width: 40,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								background: "none",
								border: "none",
								cursor: "pointer",
								padding: 0,
								color: "#6b7280",
							}}
							aria-label={showPassword ? "Hide password" : "Show password"}>
							{showPassword ? (
								// Eye-off SVG
								<svg width="20" height="20" fill="none" viewBox="0 0 24 24">
									<path
										stroke="#6b7280"
										strokeWidth="2"
										strokeLinecap="round"
										strokeLinejoin="round"
										d="M17.94 17.94A10.06 10.06 0 0 1 12 20c-5 0-9.27-3.11-10-7.5a9.98 9.98 0 0 1 3.07-5.16m3.11-2.13A9.93 9.93 0 0 1 12 4c5 0 9.27 3.11 10 7.5a9.97 9.97 0 0 1-2.11 3.61M9.88 9.88A3 3 0 0 1 12 9c1.66 0 3 1.34 3 3 0 .42-.09.82-.24 1.18"
									/>
									<path stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="m3 3 18 18" />
								</svg>
							) : (
								// Eye SVG
								<svg width="20" height="20" fill="none" viewBox="0 0 24 24">
									<path
										stroke="#6b7280"
										strokeWidth="2"
										strokeLinecap="round"
										strokeLinejoin="round"
										d="M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12Z"
									/>
									<circle cx="12" cy="12" r="3" stroke="#6b7280" strokeWidth="2" />
								</svg>
							)}
						</button>
					</div>

					{/* Sign in button */}
					<button
						type="button"
						onClick={handleSubmit}
						style={{
							width: "100%",
							background: loginMutation.isPending
								? "linear-gradient(135deg, #059669 60%, #10b981 100%)"
								: "linear-gradient(135deg, #059669, #10b981)",
							color: "#ffffff",
							padding: "16px 24px",
							border: "none",
							borderRadius: "12px",
							fontWeight: "600",
							fontSize: "16px",
							cursor: loginMutation.isPending ? "not-allowed" : "pointer",
							transition: "all 0.2s ease",
							boxShadow: "0 4px 6px -1px rgba(16, 185, 129, 0.2)",
							opacity: loginMutation.isPending ? 0.7 : 1,
							position: "relative",
						}}
						disabled={loginMutation.isPending}
						onMouseEnter={(e) => {
							if (!loginMutation.isPending) {
								e.target.style.transform = "translateY(-2px)";
								e.target.style.boxShadow = "0 8px 12px -1px rgba(16, 185, 129, 0.3)";
							}
						}}
						onMouseLeave={(e) => {
							if (!loginMutation.isPending) {
								e.target.style.transform = "translateY(0)";
								e.target.style.boxShadow = "0 4px 6px -1px rgba(16, 185, 129, 0.2)";
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
										borderTop: "3px solid #10b981",
										borderRadius: "50%",
										animation: "spin 1s linear infinite",
										marginRight: 10,
										verticalAlign: "middle",
									}}
								/>
								Signing In...
							</span>
						) : (
							"Sign In to Admin Portal"
						)}
					</button>

					{/* Footer text */}
					<div style={{ textAlign: "center", marginTop: "32px" }}>
						<p
							style={{
								color: "#9ca3af",
								fontSize: "14px",
								margin: "0",
								lineHeight: "1.4",
							}}>
							Powered by Canoja • Secure Cannabis Management
						</p>
					</div>
				</div>
			</div>
		</div>
	);
};

export default AdminLogin;

// Add spinner animation
const style = document.createElement("style");
style.innerHTML = `
@keyframes spin {
	0% { transform: rotate(0deg); }
	100% { transform: rotate(360deg); }
}`;
document.head.appendChild(style);
