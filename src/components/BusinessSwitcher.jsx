import { useQueryClient } from "@tanstack/react-query";
import { Store } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import useAdminTheme from "./admin/useAdminTheme";

const BusinessSwitcher = () => {
  const { businesses, selectBusiness } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { theme } = useAdminTheme();
  const light = theme === "light";

  const handleSelect = (businessId) => {
    selectBusiness(businessId);
    queryClient.clear();
    navigate("/operator/dashboard", { replace: true });
  };

  return (
    <main style={{ ...styles.page, ...(light ? lightStyles.page : {}) }}>
      <section style={styles.panel}>
        <header style={styles.header}>
          <h1 style={{ ...styles.title, ...(light ? lightStyles.title : {}) }}>Switch Business</h1>
          <p style={{ ...styles.subtitle, ...(light ? lightStyles.subtitle : {}) }}>
            Choose which of your {businesses.length} linked businesses you want to manage.
          </p>
        </header>

        <div style={styles.list}>
          {businesses.map((business) => {
            const location = [business.city, business.stateName || business.state]
              .filter(Boolean)
              .join(", ");

            return (
              <button
                key={business._id}
                type="button"
                style={{ ...styles.card, ...(light ? lightStyles.card : {}) }}
                onClick={() => handleSelect(business._id)}
              >
                <span style={{ ...styles.icon, ...(light ? lightStyles.icon : {}) }} aria-hidden="true">
                  <Store size={22} strokeWidth={2} />
                </span>
                <span style={styles.details}>
                  <strong style={{ ...styles.name, ...(light ? lightStyles.name : {}) }}>{business.business_name || "Unnamed Business"}</strong>
                  {location && <span style={{ ...styles.meta, ...(light ? lightStyles.meta : {}) }}>{location}</span>}
                  {business.license_type && <span style={{ ...styles.type, ...(light ? lightStyles.type : {}) }}>{business.license_type}</span>}
                </span>
                <span style={{ ...styles.arrow, ...(light ? lightStyles.arrow : {}) }} aria-hidden="true">›</span>
              </button>
            );
          })}
        </div>
      </section>
    </main>
  );
};

const styles = {
  page: { minHeight: "100dvh", background: "#032326", display: "grid", alignItems: "start", justifyItems: "center", padding: "clamp(32px, 10vh, 96px) clamp(16px, 5vw, 32px)", boxSizing: "border-box", fontFamily: "system-ui, -apple-system, sans-serif" },
  panel: { width: "100%", maxWidth: "620px", minWidth: 0 },
  brand: { color: "#34d399", fontSize: "24px", fontWeight: 800, marginBottom: "48px", display: "flex", alignItems: "center", gap: "10px" },
  header: { marginBottom: "24px" },
  title: { color: "#fff", fontSize: "clamp(28px, 8vw, 32px)", lineHeight: 1.2, margin: "0 0 8px", letterSpacing: "-0.5px" },
  subtitle: { color: "rgba(255,255,255,0.55)", fontSize: "15px", lineHeight: 1.5, margin: 0 },
  list: { display: "grid", gap: "12px" },
  card: { width: "100%", minWidth: 0, boxSizing: "border-box", display: "flex", alignItems: "center", gap: "clamp(12px, 4vw, 16px)", padding: "clamp(14px, 4vw, 18px)", borderRadius: "16px", border: "1px solid rgba(255,255,255,.18)", background: "linear-gradient(155deg, #1b6b46 0%, #2eb870 100%)", color: "#fff", textAlign: "left", cursor: "pointer", font: "inherit", overflow: "hidden", boxShadow: "0 10px 24px rgba(27,107,70,.2)" },
  icon: { width: "46px", height: "46px", borderRadius: "12px", background: "rgba(255,255,255,.16)", color: "#fff", display: "grid", placeItems: "center", fontSize: "20px", flexShrink: 0 },
  details: { minWidth: 0, flex: 1, display: "flex", flexDirection: "column", gap: "3px" },
  name: { display: "block", maxWidth: "100%", fontSize: "16px", lineHeight: 1.35, whiteSpace: "normal", overflowWrap: "anywhere" },
  meta: { maxWidth: "100%", color: "rgba(255,255,255,0.5)", fontSize: "13px", lineHeight: 1.4, overflowWrap: "anywhere" },
  type: { maxWidth: "100%", color: "rgba(255,255,255,0.38)", fontSize: "12px", lineHeight: 1.4, overflowWrap: "anywhere" },
  arrow: { color: "rgba(255,255,255,0.4)", fontSize: "30px", lineHeight: 1, flexShrink: 0 },
};

const lightStyles = {
  page: { background: "radial-gradient(circle at top, #f7fcf9 0%, #edf6f1 100%)" },
  title: { color: "#17372c" },
  subtitle: { color: "#617a70" },
  card: { border: "1px solid rgba(255,255,255,.18)", background: "linear-gradient(155deg, #1b6b46 0%, #2eb870 100%)", color: "#fff", boxShadow: "0 10px 24px rgba(27,107,70,.2)" },
  icon: { background: "rgba(255,255,255,.16)", color: "#fff" },
  name: { color: "#fff" },
  meta: { color: "rgba(255,255,255,.78)" },
  type: { color: "rgba(255,255,255,.62)" },
  arrow: { color: "rgba(255,255,255,.8)" },
};

export default BusinessSwitcher;
