import { Eye, Filter, Info, Star, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useBusinessDashboard, useToggleSpotlight } from "../services/business";
import OperatorLayout from "./OperatorLayout";

const BENEFITS = [
  { icon: Eye, text: "Shows your business at the top of the Explore screen" },
  { icon: Users, text: "Reaches consumers actively browsing nearby shops" },
  { icon: Filter, text: "Appears when users apply the Spotlight filter" },
  { icon: Star, text: "Displays a featured badge on your listing card" },
];

const OperatorSpotlight = () => {
  const navigate = useNavigate();
  const { data, isLoading } = useBusinessDashboard();
  const toggleSpotlight = useToggleSpotlight();
  const dashboard = data?.data;
  const active = dashboard?.spotlight === true;
  const hasAccess = ["starter", "pro"].includes(dashboard?.plan_tier);

  const handleToggle = async () => {
    if (!hasAccess) return navigate("/operator/billing");
    try {
      const result = await toggleSpotlight.mutateAsync(!active);
      toast.success(result?.message || `Spotlight ${active ? "disabled" : "enabled"}`);
    } catch (error) {
      toast.error(error.response?.data?.error || "Unable to update Spotlight");
    }
  };

  return (
    <OperatorLayout>
      <div className="operator-spotlight-page" style={styles.page}>
        <section className="operator-spotlight-card" style={styles.statusCard}>
          <span style={{ ...styles.heroIcon, color: active ? "#40ea54" : "#718079", background: active ? "rgba(64,234,84,.12)" : "rgba(255,255,255,.06)" }}><Star size={38} fill="currentColor" /></span>
          <h1 style={styles.businessName}>{isLoading ? "Loading..." : dashboard?.business_name || "Your Business"}</h1>
          <span style={{ ...styles.badge, color: active ? "#40ea54" : "#87958f", background: active ? "rgba(64,234,84,.12)" : "rgba(255,255,255,.07)" }}><i style={{ ...styles.dot, background: active ? "#40ea54" : "#718079" }} />{active ? "Spotlight Active" : "Not in Spotlight"}</span>
        </section>

        <section className="operator-spotlight-info" style={styles.info}><Info size={18} color="#40ea54" /><p>When Spotlight is active, your business appears in the <strong>Spotlight</strong> section on the consumer Explore screen — giving you prime visibility among nearby users.</p></section>

        <h2 style={styles.sectionTitle}>What Spotlight does</h2>
        <div style={styles.benefits}>{BENEFITS.map(({ icon: Icon, text }) => <div key={text} style={styles.benefit}><span style={styles.benefitIcon}><Icon size={18} /></span><span>{text}</span></div>)}</div>

        <button type="button" disabled={isLoading || toggleSpotlight.isPending} onClick={handleToggle} style={{ ...styles.action, ...(active ? styles.actionOff : styles.actionOn) }}><Star size={20} fill={active ? "none" : "currentColor"} />{toggleSpotlight.isPending ? "Updating..." : !hasAccess ? "Upgrade to Starter" : active ? "Remove from Spotlight" : "Add to Spotlight"}</button>
        {active && <p style={styles.hint}>Your business is currently visible in the Spotlight section. Use the button above to remove it.</p>}
      </div>
    </OperatorLayout>
  );
};

const styles = {
  page: { width: "100%", maxWidth: "820px", margin: "0 auto" }, statusCard: { display: "flex", flexDirection: "column", alignItems: "center", padding: "30px", borderRadius: "20px", border: "1px solid rgba(255,255,255,.1)", background: "rgba(255,255,255,.04)" },
  heroIcon: { width: "74px", height: "74px", display: "grid", placeItems: "center", borderRadius: "20px" }, businessName: { margin: "16px 0 11px", color: "#fff", fontSize: "23px" }, badge: { display: "flex", alignItems: "center", gap: "7px", padding: "7px 14px", borderRadius: "999px", fontSize: "13px", fontWeight: 700 }, dot: { width: "7px", height: "7px", borderRadius: "50%" },
  info: { display: "flex", alignItems: "flex-start", gap: "11px", marginTop: "20px", padding: "16px", borderRadius: "12px", border: "1px solid rgba(64,234,84,.22)", background: "rgba(64,234,84,.07)", color: "#a9bbb5" }, sectionTitle: { margin: "28px 0 14px", color: "#d9e8e2", fontSize: "13px", letterSpacing: "1px", textTransform: "uppercase" },
  benefits: { display: "grid", gap: "10px" }, benefit: { display: "flex", alignItems: "center", gap: "12px", color: "#b6c5c0", fontSize: "14px" }, benefitIcon: { width: "38px", height: "38px", display: "grid", placeItems: "center", borderRadius: "10px", background: "rgba(64,234,84,.1)", color: "#40ea54" },
  action: { width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "9px", marginTop: "30px", padding: "15px", borderRadius: "13px", font: "inherit", fontWeight: 800, cursor: "pointer" }, actionOn: { border: 0, background: "linear-gradient(90deg,#40ea54,#04ca8f)", color: "#031c15" }, actionOff: { border: "1px solid #42534e", background: "#1b2927", color: "#fff" }, hint: { color: "#80928c", fontSize: "12px", textAlign: "center" },
};

export default OperatorSpotlight;
