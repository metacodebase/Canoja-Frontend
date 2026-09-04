import { useState } from "react";
import { CheckCircle2, Store, Zap } from "lucide-react";
import { toast } from "react-toastify";
import { useBusinessDashboard, useUpdateBusinessPlan } from "../services/business";
import OperatorLayout from "./OperatorLayout";

const FREE_FEATURES = ["Listed in Canoja directory", "Basic business profile", "Discoverable by nearby consumers", "Claim & verify your listing"];
const STARTER_FEATURES = ["Everything in Free", "Spotlight — featured at top of search results", "Priority placement near consumers", "Advanced analytics & engagement metrics", "Menu snapshot uploads", "Verified badge boost", "Priority support"];

const PlanCard = ({ id, name, price, features, current, selected, starter, onSelect }) => (
  <button type="button" className={`operator-plan-card${starter ? " operator-plan-card--starter" : ""}`} onClick={() => onSelect(id)} style={{ ...styles.plan, ...(starter ? styles.starter : {}), ...((current || selected) ? styles.selected : {}) }}>
    {(current || starter) && <span style={current ? styles.currentBadge : styles.recommendedBadge}>{current ? "CURRENT PLAN" : "RECOMMENDED"}</span>}
    <span className="operator-plan-title" style={{ ...styles.planTitle, color: starter ? "#10b981" : "#fff" }}>{starter ? <Zap className="starter-plan-icon" size={22} color="#10b981" stroke="#10b981" fill="#10b981" /> : <Store size={21} />}<strong>{name}</strong></span>
    <span style={styles.price}><span className={`operator-plan-currency${starter ? " starter-plan-currency" : ""}`} style={{ ...styles.currency, color: starter ? "#10b981" : "inherit" }}>$</span><strong className="price-amount" style={{ ...styles.priceAmount, color: starter ? "#10b981" : "inherit" }}>{price}</strong><small>/month</small></span>
    {starter && <span style={styles.spotlight}>★ Includes Spotlight — be seen first</span>}
    <span style={styles.features}>{features.map((feature) => <span key={feature} style={styles.feature}><CheckCircle2 size={17} fill={starter ? "#10b981" : "#94a3b8"} color={starter ? "#063b2c" : "#334155"} /><span>{feature}</span></span>)}</span>
    <span style={styles.selection}><span style={{ ...styles.radio, ...((current || selected) ? styles.radioSelected : {}) }}>{(current || selected) && <i style={styles.radioInner} />}</span>{current ? "Active" : selected ? "Selected" : "Select Plan"}</span>
  </button>
);

const OperatorBilling = () => {
  const { data, isLoading } = useBusinessDashboard();
  const updatePlan = useUpdateBusinessPlan();
  const storedTier = data?.data?.plan_tier;
  const currentTier = storedTier === "starter" || storedTier === "pro" ? "starter" : "free";
  const [selectedPlan, setSelectedPlan] = useState(null);

  const handleUpdate = async () => {
    if (!selectedPlan || selectedPlan === currentTier) return;
    try {
      const result = await updatePlan.mutateAsync(selectedPlan);
      setSelectedPlan(null);
      toast.success(result?.message || "Subscription plan updated");
    } catch (error) {
      toast.error(error?.response?.data?.error || "Unable to update your plan");
    }
  };

  const actionLabel = updatePlan.isPending ? "Updating Plan..." : selectedPlan === "starter" && currentTier !== "starter" ? "Activate Starter (Test)" : selectedPlan === "free" && currentTier === "starter" ? "Downgrade to Free" : selectedPlan ? "Current Plan" : "Select a Plan";

  return (
    <OperatorLayout>
      <div className="operator-billing-page">
        <header style={styles.header}><h1 style={styles.heading}>Subscription Plans</h1><p style={styles.subheading}>Unlock Spotlight to get featured at the top of consumer searches</p></header>
        {isLoading ? <p style={styles.loading}>Loading subscription plans...</p> : <>
          <div style={styles.grid}>
            <PlanCard id="free" name="Free" price="0" features={FREE_FEATURES} current={currentTier === "free"} selected={selectedPlan === "free"} onSelect={setSelectedPlan} />
            <PlanCard id="starter" name="Starter" price="99" features={STARTER_FEATURES} current={currentTier === "starter"} selected={selectedPlan === "starter"} starter onSelect={setSelectedPlan} />
          </div>
          <button className="operator-plan-action" type="button" disabled={!selectedPlan || selectedPlan === currentTier || updatePlan.isPending} onClick={handleUpdate} style={{ ...styles.action, ...((!selectedPlan || selectedPlan === currentTier || updatePlan.isPending) ? styles.actionDisabled : {}) }}>{actionLabel}</button>
          <p style={styles.finePrint}>Testing mode — no payment will be charged.</p>
        </>}
      </div>
    </OperatorLayout>
  );
};

const styles = {
  header: { marginBottom: "28px" }, heading: { margin: "0 0 7px", color: "#10b981", fontSize: "32px" }, subheading: { margin: 0, color: "#64748b", fontSize: "15px" },
  loading: { color: "#64748b" }, grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 330px), 1fr))", gap: "24px", alignItems: "stretch" },
  plan: { position: "relative", display: "flex", flexDirection: "column", minHeight: "520px", padding: "30px", borderRadius: "20px", border: "1px solid rgba(255,255,255,.15)", background: "#0d2927", color: "rgba(255,255,255,.75)", font: "inherit", textAlign: "left", cursor: "pointer", overflow: "visible" },
  starter: { background: "#062d25", borderColor: "rgba(16,185,129,.55)" }, selected: { borderColor: "#10b981", boxShadow: "0 0 0 1px #10b981, 0 18px 40px rgba(0,0,0,.18)" },
  currentBadge: { position: "absolute", top: "-11px", right: "22px", padding: "5px 12px", borderRadius: "999px", background: "#16a34a", color: "#031d16", fontSize: "10px", fontWeight: 800 },
  recommendedBadge: { position: "absolute", top: "-11px", right: "22px", padding: "5px 12px", borderRadius: "999px", background: "#34d399", color: "#031d16", fontSize: "10px", fontWeight: 800 },
  planTitle: { display: "flex", alignItems: "center", gap: "9px", color: "#fff", fontSize: "20px" }, price: { display: "flex", alignItems: "baseline", gap: "3px", margin: "8px 0 22px" }, currency: { fontSize: "20px", fontWeight: 800 }, priceAmount: { fontSize: "38px", fontWeight: 900, lineHeight: 1, letterSpacing: "-1px" },
  features: { display: "flex", flexDirection: "column", gap: "13px", minWidth: 0, marginBottom: "26px" }, feature: { display: "flex", alignItems: "flex-start", gap: "10px", minWidth: 0, fontSize: "14px", lineHeight: 1.35, overflowWrap: "anywhere" },
  spotlight: { margin: "0 0 22px", padding: "9px 12px", borderRadius: "8px", background: "rgba(16,185,129,.14)", color: "#34d399", fontSize: "13px", fontWeight: 700 },
  selection: { display: "flex", justifyContent: "center", alignItems: "center", gap: "9px", marginTop: "auto", paddingTop: "19px", borderTop: "1px solid rgba(255,255,255,.1)", fontSize: "14px", fontWeight: 650 }, radio: { width: "18px", height: "18px", display: "grid", placeItems: "center", borderRadius: "50%", border: "2px solid rgba(255,255,255,.35)" }, radioSelected: { borderColor: "#10b981" }, radioInner: { width: "8px", height: "8px", borderRadius: "50%", background: "#10b981" },
  action: { width: "100%", marginTop: "28px", padding: "16px", border: 0, borderRadius: "14px", background: "linear-gradient(90deg,#40ea54,#04ca8f)", color: "#03231d", fontSize: "16px", fontWeight: 800, cursor: "pointer", boxShadow: "0 8px 24px rgba(4,202,143,.25)" }, actionDisabled: { opacity: .45, cursor: "not-allowed", boxShadow: "none" }, finePrint: { color: "#64748b", fontSize: "12px", textAlign: "center" },
};

export default OperatorBilling;
