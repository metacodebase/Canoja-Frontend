import { useState } from "react";
import { AtSign, LockKeyhole, Mail, X } from "lucide-react";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import api, { setToken } from "../services/api";

const ChangeEmailModal = ({ onClose }) => {
  const { updateUser, user } = useAuth();
  const [newEmail, setNewEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("email");
  const [loading, setLoading] = useState(false);

  const sendCode = async (event) => {
    event.preventDefault();
    const email = newEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return toast.error("Please enter a valid email address");
    if (email === user?.email?.toLowerCase()) return toast.error("New email must be different from your current email");
    setLoading(true);
    try {
      const { data } = await api.post("/business/request-email-change", { new_email: email });
      toast.success(data.message || "Verification code sent");
      setStep("otp");
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to send verification code");
    } finally { setLoading(false); }
  };

  const confirmCode = async (event) => {
    event.preventDefault();
    if (!otp.trim()) return toast.error("Please enter the verification code");
    setLoading(true);
    try {
      const { data } = await api.post("/business/confirm-email-change", { otp: otp.trim() });
      if (data.token) setToken(data.token);
      updateUser({ ...user, email: data.new_email });
      toast.success(data.message || "Email updated successfully");
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.error || "Invalid or expired verification code");
    } finally { setLoading(false); }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <form style={styles.card} onSubmit={step === "email" ? sendCode : confirmCode} onClick={(event) => event.stopPropagation()}>
        <button type="button" aria-label="Close" onClick={onClose} style={styles.close}><X size={19} /></button>
        <span style={styles.icon}><AtSign size={34} /></span>
        <h2 style={styles.title}>{step === "email" ? "Change Email" : "Verify Email"}</h2>
        <p style={styles.subtitle}>{step === "email" ? "Enter your new email address below. We'll send a verification code to confirm it." : `Enter the verification code sent to ${newEmail.trim().toLowerCase()}.`}</p>

        {step === "email" ? <>
          <label style={styles.label}>Current Email</label>
          <span style={{ ...styles.inputWrap, opacity: .55 }}><input style={styles.input} value={user?.email || ""} disabled /><LockKeyhole size={16} /></span>
          <label style={styles.label}>New Email Address</label>
          <span style={styles.inputWrap}><Mail size={18} /><input style={styles.input} value={newEmail} onChange={(event) => setNewEmail(event.target.value)} type="email" placeholder="Enter new email" autoFocus /></span>
        </> : <>
          <label style={styles.label}>Verification Code</label>
          <span style={styles.inputWrap}><LockKeyhole size={18} /><input style={{ ...styles.input, letterSpacing: "5px" }} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" placeholder="000000" autoFocus /></span>
          <button type="button" onClick={() => setStep("email")} style={styles.back}>Change email address</button>
        </>}
        <button type="submit" disabled={loading} style={{ ...styles.submit, opacity: loading ? .6 : 1 }}>{loading ? "PLEASE WAIT..." : step === "email" ? "SEND VERIFICATION CODE" : "VERIFY & UPDATE EMAIL"}</button>
      </form>
    </div>
  );
};

const styles = {
  overlay: { position: "fixed", inset: 0, zIndex: 1500, display: "grid", placeItems: "center", padding: "24px", background: "rgba(1,15,17,.82)", backdropFilter: "blur(8px)" },
  card: { position: "relative", width: "100%", maxWidth: "470px", padding: "38px", boxSizing: "border-box", borderRadius: "28px", border: "1px solid rgba(255,255,255,.15)", background: "linear-gradient(155deg,#142d27,#071c19)", color: "#fff", boxShadow: "0 28px 80px rgba(0,0,0,.5)" },
  close: { position: "absolute", top: "17px", right: "17px", width: "36px", height: "36px", display: "grid", placeItems: "center", borderRadius: "10px", border: "1px solid rgba(64,234,84,.35)", background: "transparent", color: "#fff", cursor: "pointer" },
  icon: { width: "70px", height: "70px", margin: "0 auto 17px", display: "grid", placeItems: "center", borderRadius: "20px", background: "rgba(64,234,84,.12)", color: "#40ea54" },
  title: { margin: "0 0 8px", textAlign: "center", fontSize: "25px" }, subtitle: { margin: "0 auto 27px", maxWidth: "350px", color: "rgba(255,255,255,.55)", textAlign: "center", lineHeight: 1.5 },
  label: { display: "block", margin: "14px 0 7px", color: "#fff", fontSize: "13px", fontWeight: 700 }, inputWrap: { display: "flex", alignItems: "center", gap: "9px", padding: "0 13px", border: "1px solid #17644b", borderRadius: "11px", color: "rgba(255,255,255,.5)", background: "rgba(0,34,30,.65)" },
  input: { width: "100%", padding: "13px 0", border: 0, outline: 0, background: "transparent", color: "#fff", fontSize: "14px" }, submit: { width: "100%", marginTop: "24px", padding: "14px", border: 0, borderRadius: "11px", background: "linear-gradient(90deg,#40ea54,#04ca8f)", color: "#021c15", fontWeight: 900, cursor: "pointer" }, back: { marginTop: "10px", border: 0, background: "transparent", color: "#40ea54", cursor: "pointer" },
};

export default ChangeEmailModal;
