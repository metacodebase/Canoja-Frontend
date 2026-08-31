import { CreditCard, Store } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import OperatorLayout from "./OperatorLayout";

const OperatorAccountPage = ({ page }) => {
  const navigate = useNavigate();
  const { businesses, user } = useAuth();
  const isBilling = page === "billing";
  return (
    <OperatorLayout>
      <section style={styles.card}>
        <span style={styles.icon}>{isBilling ? <CreditCard size={26} /> : <Store size={26} />}</span>
        <div><h1 style={styles.title}>{isBilling ? "Billing" : "Settings"}</h1><p style={styles.subtitle}>{isBilling ? "Manage your Canoja subscription and billing details." : "Manage your operator account and active business."}</p></div>
      </section>
      <section style={styles.content}>
        {isBilling ? <><h2 style={styles.heading}>Subscription & Billing</h2><p style={styles.copy}>Billing plans will appear here when subscriptions are available.</p></> : <>
          <h2 style={styles.heading}>Account</h2>
          <div style={styles.row}><span><strong style={styles.rowTitle}>Email</strong><small style={styles.rowSub}>{user?.email}</small></span></div>
          {businesses.length > 1 && <button type="button" style={styles.rowButton} onClick={() => navigate("/operator/switch-business")}><span><strong style={styles.rowTitle}>Switch Business</strong><small style={styles.rowSub}>{businesses.length} businesses linked</small></span><span>›</span></button>}
        </>}
      </section>
    </OperatorLayout>
  );
};

const styles = {
  card: { display: "flex", alignItems: "center", gap: "18px", padding: "28px", borderRadius: "16px", background: "#fff", border: "1px solid #e2e8f0", boxShadow: "0 2px 4px rgba(0,0,0,.04)" },
  icon: { width: "52px", height: "52px", display: "grid", placeItems: "center", borderRadius: "14px", background: "rgba(16,185,129,.12)", color: "#10b981" },
  title: { margin: "0 0 5px", color: "#1e293b", fontSize: "30px" }, subtitle: { margin: 0, color: "#64748b" },
  content: { marginTop: "24px", padding: "28px", borderRadius: "16px", background: "#fff", border: "1px solid #e2e8f0" },
  heading: { margin: "0 0 20px", color: "#1e293b", fontSize: "20px" }, copy: { color: "#64748b", margin: 0 },
  row: { display: "flex", padding: "17px 18px", borderRadius: "12px", background: "#f8fafc", border: "1px solid #e2e8f0" },
  rowButton: { width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "12px", padding: "17px 18px", borderRadius: "12px", background: "#f8fafc", border: "1px solid #e2e8f0", color: "#1e293b", font: "inherit", textAlign: "left", cursor: "pointer" },
  rowTitle: { display: "block", color: "#1e293b", fontSize: "15px" }, rowSub: { display: "block", marginTop: "4px", color: "#64748b", fontSize: "13px" },
};

export default OperatorAccountPage;
