import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import { useAdminLogin } from "../services/admin";
import canojaWordmark from "../assets/canoja-wordmark.png";
import canojaLoginPhones from "../assets/canoja-login-phones.png";
import ForcedPasswordChange from "./ForcedPasswordChange";
import "./loginTheme.css";

function LoginVisual() {
  return (
    <section className="login-visual" aria-label="Canoja mobile app preview">
      <div className="login-visual__artwork">
        <img src={canojaLoginPhones} alt="Canoja mobile app" />
      </div>
      <div className="login-visual__copy">
        <h1>Welcome Back!</h1>
        <p>Sign in to access your Canoja account and manage your cannabis business operations</p>
        <span><i /><i /><i className="active" /></span>
      </div>
    </section>
  );
}

function LoginForm({ email, password, setEmail, setPassword, showPassword, setShowPassword, error, pending, onSubmit }) {
  return (
    <section className="login-panel">
      <div className="login-card">
        <Link to="/" className="login-logo"><img src={canojaWordmark} alt="Canoja" /></Link>
        <div className="login-heading">
          <h2>Sign In</h2>
          <p>Enter your credentials to access your account</p>
        </div>
        {error && <div className="login-error">{error}</div>}
        <form onSubmit={onSubmit}>
          <label>
            Username
            <div className="login-input">
              <Mail />
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email address" />
            </div>
          </label>
          <label>
            Password
            <div className="login-input">
              <LockKeyhole />
              <input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff /> : <Eye />}</button>
            </div>
          </label>
          <Link className="forgot-link" to="/forgot-password">Forgot Password?</Link>
          <button className="login-submit" type="submit" disabled={pending}>{pending ? <><span className="spinner" />Signing In...</> : "Sign In"}</button>
        </form>
        <p className="login-signup">Don’t have an account? <Link to="/age-verification">Sign Up</Link></p>
        <p className="login-powered">Powered by Canoja • Secure Cannabis Management Platform</p>
      </div>
    </section>
  );
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [needsPasswordChange, setNeedsPasswordChange] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, isAuthenticated, user, activeBusinessId } = useAuth();
  const loginMutation = useAdminLogin();

  useEffect(() => {
    if (searchParams.get("reason") === "deactivated") toast.error("Your account has been deactivated.");
  }, [searchParams]);

  useEffect(() => {
    if (!isAuthenticated || !user || user.requiresPasswordChange) return;
    if (user.role === "admin") navigate("/admin/dashboard", { replace: true });
    else if (user.role === "operator") navigate(user.businesses?.length > 1 && !activeBusinessId ? "/operator/switch-business" : "/operator/dashboard", { replace: true });
    else navigate("/explore", { replace: true });
  }, [activeBusinessId, isAuthenticated, user, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Email and password are required.");
      toast.error("Email and password are required.");
      return;
    }
    try {
      const response = await loginMutation.mutateAsync({ email, password });
      login(response.token, response.user, response.refreshToken);
      if (response.user?.requiresPasswordChange) {
        setNeedsPasswordChange(true);
        toast.success("Login successful! Please change your password.");
        return;
      }
      toast.success("Login successful!");
      const role = response.user?.role || "consumer";
      navigate(role === "admin" ? "/admin/dashboard" : role === "operator" ? response.user?.businesses?.length > 1 ? "/operator/switch-business" : "/operator/dashboard" : "/explore");
    } catch (requestError) {
      setError(requestError.message);
      toast.error(requestError.message || "Login failed");
    }
  };

  if (needsPasswordChange || (isAuthenticated && user?.requiresPasswordChange === true)) return <ForcedPasswordChange />;

  return (
    <main className="login-page">
      <LoginVisual />
      <LoginForm {...{ email, password, setEmail, setPassword, showPassword, setShowPassword, error, onSubmit: handleSubmit }} pending={loginMutation.isPending} />
    </main>
  );
}
