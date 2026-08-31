import { useQueryClient } from "@tanstack/react-query";
import { Store } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const BusinessSwitcher = () => {
  const { businesses, selectBusiness } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleSelect = (businessId) => {
    selectBusiness(businessId);
    queryClient.clear();
    navigate("/operator/dashboard", { replace: true });
  };

  return (
    <main style={styles.page}>
      <section style={styles.panel}>
        <header style={styles.header}>
          <h1 style={styles.title}>Switch Business</h1>
          <p style={styles.subtitle}>
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
                style={styles.card}
                onClick={() => handleSelect(business._id)}
              >
                <span style={styles.icon} aria-hidden="true">
                  <Store size={22} strokeWidth={2} />
                </span>
                <span style={styles.details}>
                  <strong style={styles.name}>{business.business_name || "Unnamed Business"}</strong>
                  {location && <span style={styles.meta}>{location}</span>}
                  {business.license_type && <span style={styles.type}>{business.license_type}</span>}
                </span>
                <span style={styles.arrow} aria-hidden="true">›</span>
              </button>
            );
          })}
        </div>
      </section>
    </main>
  );
};

const styles = {
  page: { minHeight: "100vh", background: "#032326", display: "grid", placeItems: "center", padding: "32px", boxSizing: "border-box", fontFamily: "system-ui, -apple-system, sans-serif" },
  panel: { width: "100%", maxWidth: "620px" },
  brand: { color: "#34d399", fontSize: "24px", fontWeight: 800, marginBottom: "48px", display: "flex", alignItems: "center", gap: "10px" },
  header: { marginBottom: "24px" },
  title: { color: "#fff", fontSize: "32px", lineHeight: 1.2, margin: "0 0 8px", letterSpacing: "-0.5px" },
  subtitle: { color: "rgba(255,255,255,0.55)", fontSize: "15px", margin: 0 },
  list: { display: "grid", gap: "12px" },
  card: { width: "100%", display: "flex", alignItems: "center", gap: "16px", padding: "18px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.055)", color: "#fff", textAlign: "left", cursor: "pointer", font: "inherit" },
  icon: { width: "46px", height: "46px", borderRadius: "12px", background: "rgba(52,211,153,0.12)", color: "#34d399", display: "grid", placeItems: "center", fontSize: "20px", flexShrink: 0 },
  details: { minWidth: 0, flex: 1, display: "flex", flexDirection: "column", gap: "3px" },
  name: { fontSize: "16px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  meta: { color: "rgba(255,255,255,0.5)", fontSize: "13px" },
  type: { color: "rgba(255,255,255,0.38)", fontSize: "12px" },
  arrow: { color: "rgba(255,255,255,0.4)", fontSize: "30px", lineHeight: 1 },
};

export default BusinessSwitcher;
