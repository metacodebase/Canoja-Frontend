import React, { useState, useEffect } from "react";
import { Pagination, ConfigProvider, Drawer } from "antd";
import AdminShell from "./AdminShell";
import { useCompareShops, useAdminCanojaVerified } from "../../services/admin";

const C = {
  border: "#dce7e1",
  textPrimary: "#18212b",
  textSecondary: "#617182",
  greenDark: "#1b6b46",
  green: "#2da96d",
};

// Replicate shopController's extractServices for raw LicenseRecord
function extractServicesClient(record) {
  const services = [];
  if (record.subtypes) {
    const list = Array.isArray(record.subtypes)
      ? record.subtypes
      : record.subtypes.split(",").map(s => s.trim());
    services.push(...list);
  }
  let about = record.about;
  if (typeof about === "string") { try { about = JSON.parse(about); } catch { about = {}; } }
  Object.entries(about?.["Service options"] || {}).forEach(([k, v]) => { if (v === true) services.push(k); });
  Object.entries(about?.["Amenities"] || {}).forEach(([k, v]) => { if (v === true) services.push(k); });
  return [...new Set(services)];
}

// Replicate shopController's isShopOpenNow for raw LicenseRecord
function isOpenNowClient(record) {
  if (record.business_status === "PERMANENTLY_CLOSED" || record.business_status === "CLOSED_TEMPORARILY") return false;
  if (!record.working_hours || !Object.keys(record.working_hours).length) return null;
  try {
    const timeZone = record.time_zone || "America/New_York";
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone, weekday: "long", hour: "2-digit", minute: "2-digit", hour12: false,
    });
    const parts = formatter.formatToParts(now);
    const dayName = parts.find(p => p.type === "weekday").value;
    const hour = parseInt(parts.find(p => p.type === "hour").value);
    const minute = parseInt(parts.find(p => p.type === "minute").value);
    const currentMins = hour * 60 + minute;
    const todayHours = record.working_hours[dayName];
    if (!todayHours) return false;
    if (/open 24 hours/i.test(todayHours)) return true;
    if (/closed/i.test(todayHours)) return false;
    const m = todayHours.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?\s*[–\-]\s*(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (!m) return null;
    const toMins = (h, mn, ap) => {
      let hrs = parseInt(h);
      if (ap?.toUpperCase() === "PM" && hrs !== 12) hrs += 12;
      if (ap?.toUpperCase() === "AM" && hrs === 12) hrs = 0;
      return hrs * 60 + parseInt(mn);
    };
    return currentMins >= toMins(m[1], m[2], m[3]) && currentMins <= toMins(m[4], m[5], m[6]);
  } catch { return null; }
}

function getLicenseStatus(record) {
  if (!record.expiration_date) return record.license_status;
  return new Date(record.expiration_date) < new Date() ? "Inactive" : record.license_status;
}

function Tag({ label }) {
  const map = {
    "Licensed":      { bg: "#edf9f2", color: "#1f9d61" },
    "Top Rated":     { bg: "#edf9f2", color: "#1f9d61" },
    "Delivery":      { bg: "#edf9f2", color: "#1f9d61" },
    "Pickup":        { bg: "#edf9f2", color: "#1f9d61" },
    "Open Now":      { bg: "#edf9f2", color: "#1f9d61" },
    "Has Menu":      { bg: "#edf9f2", color: "#1f9d61" },
    "Expiring Soon": { bg: "#fff5eb", color: "#d9822b" },
    "Renewal Due":   { bg: "#fff5eb", color: "#d9822b" },
  };
  const s = map[label] || { bg: "#f4f7fa", color: "#617182" };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      height: "26px", padding: "0 10px", borderRadius: "999px",
      background: s.bg, color: s.color, fontSize: "12px", fontWeight: 800,
      whiteSpace: "nowrap",
    }}>
      {label}
    </span>
  );
}

function buildTags(record) {
  const now = new Date();
  const d30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const exp = record.expiration_date ? new Date(record.expiration_date) : null;
  const licenseStatus = getLicenseStatus(record);
  const openNow = isOpenNowClient(record);
  const services = extractServicesClient(record);
  const tags = [];
  if (licenseStatus && licenseStatus !== "Inactive") tags.push("Licensed");
  if (openNow === true) tags.push("Open Now");
  if ((record.rating || 0) >= 4.5) tags.push("Top Rated");
  if (record.menu_link || record.menu) tags.push("Has Menu");
  // if (services.some(t => /delivery/i.test(t))) tags.push("Delivery");
  // if (services.some(t => /pickup|pick.up/i.test(t))) tags.push("Pickup");
  if (exp && exp > now && exp <= d30) tags.push("Expiring Soon");
  if (exp && exp < now) tags.push("Renewal Due");
  return tags;
}

function PharmacyCard({ shop: record, onViewProfile }) {
  const licenseStatus = getLicenseStatus(record);
  const openNow = isOpenNowClient(record);
  const location = [record.city, record.stateName].filter(Boolean).join(", ");
  const descParts = [];
  if (licenseStatus) descParts.push(`${licenseStatus} license`);
  if (openNow === true) descParts.push("Open now");
  if (record.rating) descParts.push(`${record.rating}★`);
  const tags = buildTags(record);

  return (
    <div style={{
      background: "#fff", border: "0.8px solid #dce7e1", borderRadius: "20px",
      boxShadow: "0px 1px 2px 0px rgba(16,24,40,0.06)",
      padding: "20px", display: "flex", flexDirection: "column", gap: "12px",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
        <div>
          <p style={{ fontSize: "16px", fontWeight: 800, color: C.textPrimary, lineHeight: "23.2px", margin: 0 }}>
            {record.business_name || "—"}
          </p>
          <p style={{ fontSize: "13.12px", fontWeight: 400, color: C.textSecondary, lineHeight: "19.024px", margin: "2px 0 0 0" }}>
            {location || "—"}
          </p>
        </div>
        {licenseStatus === "Inactive" ? (
          <span style={{
            display: "inline-flex", alignItems: "center",
            height: "26px", padding: "0 10px", borderRadius: "999px",
            background: "rgba(217,130,43,0.12)", border: "0.8px solid rgba(217,130,43,0.35)",
            color: "#d9822b", fontSize: "12px", fontWeight: 800,
            whiteSpace: "nowrap", flexShrink: 0,
          }}>Expired</span>
        ) : (
          <span style={{
            display: "inline-flex", alignItems: "center",
            height: "26px", padding: "0 10px", borderRadius: "999px",
            background: "rgba(212,167,44,0.15)", border: "0.8px solid rgba(212,167,44,0.35)",
            color: "#b5850a", fontSize: "12px", fontWeight: 800,
            whiteSpace: "nowrap", flexShrink: 0,
          }}>Verified</span>
        )}
      </div>
      <p style={{ fontSize: "14.08px", fontWeight: 400, color: C.textSecondary, lineHeight: "20.416px", margin: 0 }}>
        {descParts.join(" · ") || "Canoja Verified"}
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
        {tags.map(t => <Tag key={t} label={t} />)}
      </div>
      <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
        <button onClick={onViewProfile} style={{
          flex: 1, height: "42px", borderRadius: "12px",
          backgroundImage: "linear-gradient(161deg, #1b6b46 0%, #2da96d 100%)",
          border: "0.8px solid rgba(0,0,0,0)", color: "#fff",
          fontSize: "13.333px", fontWeight: 700, cursor: "pointer",
        }}>View Profile</button>
        <button
          onClick={() => {
            const coords = record.location?.coordinates;
            const dest = coords
              ? `${coords[1]},${coords[0]}`
              : encodeURIComponent([record.business_address, record.city, record.stateName].filter(Boolean).join(", "));
            window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest}`, "_blank", "noopener");
          }}
          style={{
            height: "42px", padding: "0 16px", borderRadius: "12px",
            background: "#fff", border: "0.8px solid #dce7e1",
            color: C.textPrimary, fontSize: "13.333px", fontWeight: 700, cursor: "pointer",
          }}>Directions</button>
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="admin-detail-row" style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
      <span style={{ fontSize: "12px", fontWeight: 700, color: "#617182", textTransform: "uppercase", letterSpacing: "0.8px" }}>{label}</span>
      <span style={{ fontSize: "14px", color: "#18212b" }}>{value || "—"}</span>
    </div>
  );
}

const FMT = { month: "short", day: "numeric", year: "numeric" };

function ProfileDrawer({ record, onClose }) {
  if (!record) return null;
  const licenseStatus = getLicenseStatus(record);
  const services = extractServicesClient(record);
  const openNow = isOpenNowClient(record);

  return (
    <Drawer rootClassName="admin-detail-drawer" open={!!record} onClose={onClose} width={520} title={null} closeIcon={null}
      styles={{ body: { padding: 0 }, header: { display: "none" } }}>
      <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily: "Inter, sans-serif" }}>

        {/* Header */}
        <div className="admin-detail-drawer__header" style={{ padding: "24px", borderBottom: "0.8px solid #dce7e1", background: "linear-gradient(155deg,rgba(45,169,109,0.08) 0%,#fff 100%)" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
            <div>
              <p style={{ fontSize: "18px", fontWeight: 800, color: C.textPrimary, margin: 0 }}>{record.business_name || "—"}</p>
              <p style={{ fontSize: "13px", color: C.textSecondary, margin: "2px 0 0" }}>
                {record.license_number || "No license #"} · {[record.city, record.stateName].filter(Boolean).join(", ") || "—"}
              </p>
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center", flexShrink: 0 }}>
              {licenseStatus === "Inactive" ? (
                <span style={{ display: "inline-flex", alignItems: "center", height: "26px", padding: "0 10px", borderRadius: "999px", background: "rgba(217,130,43,0.12)", border: "0.8px solid rgba(217,130,43,0.35)", color: "#d9822b", fontSize: "12px", fontWeight: 800 }}>Expired</span>
              ) : (
                <span style={{ display: "inline-flex", alignItems: "center", height: "26px", padding: "0 10px", borderRadius: "999px", background: "rgba(212,167,44,0.15)", border: "0.8px solid rgba(212,167,44,0.35)", color: "#b5850a", fontSize: "12px", fontWeight: 800 }}>Verified</span>
              )}
              <button onClick={onClose} style={{ background: "none", border: "0.8px solid #dce7e1", borderRadius: "8px", width: "32px", height: "32px", cursor: "pointer", fontSize: "16px", color: "#617182" }}>✕</button>
            </div>
          </div>
          {openNow === true && (
            <span style={{ display: "inline-flex", alignItems: "center", height: "24px", padding: "0 10px", borderRadius: "999px", background: "#edf9f2", color: "#1f9d61", fontSize: "12px", fontWeight: 800, marginTop: "12px" }}>Open Now</span>
          )}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>

          {/* License */}
          <div>
            <p style={{ fontSize: "13px", fontWeight: 800, color: C.textPrimary, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>License</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <DetailRow label="License #"  value={record.license_number} />
              <DetailRow label="Type"       value={record.license_type} />
              <DetailRow label="Status"     value={licenseStatus} />
              <DetailRow label="Expires"    value={record.expiration_date ? new Date(record.expiration_date).toLocaleDateString("en-US", FMT) : null} />
              <DetailRow label="Issue Date" value={record.issue_date ? new Date(record.issue_date).toLocaleDateString("en-US", FMT) : null} />
              <DetailRow label="Rating"     value={record.rating ? `${record.rating}★ (${record.reviews || 0} reviews)` : null} />
            </div>
          </div>

          {/* Location */}
          <div>
            <p style={{ fontSize: "13px", fontWeight: 800, color: C.textPrimary, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>Location</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <DetailRow label="Address" value={record.business_address} />
              <DetailRow label="City"    value={record.city} />
              <DetailRow label="State"   value={record.stateName} />
              <DetailRow label="Zip"     value={record.postal_code} />
            </div>
          </div>

          {/* Contact */}
          <div>
            <p style={{ fontSize: "13px", fontWeight: 800, color: C.textPrimary, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>Contact</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <DetailRow label="Phone"   value={record.contact_information?.phone} />
              <DetailRow label="Email"   value={record.contact_information?.email} />
              <DetailRow label="Website" value={record.contact_information?.website} />
            </div>
          </div>

          {/* Services */}
          {services.length > 0 && (
            <div>
              <p style={{ fontSize: "13px", fontWeight: 800, color: C.textPrimary, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>Services</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {services.map(s => (
                  <span key={s} style={{ display: "inline-flex", alignItems: "center", height: "26px", padding: "0 10px", borderRadius: "999px", background: "#f4f7fa", color: "#617182", fontSize: "12px", fontWeight: 700 }}>{s}</span>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </Drawer>
  );
}

function StatCard({ label, value, delta, deltaBg, deltaColor }) {
  return (
    <div style={{
      background: "#fff", border: "0.8px solid #dce7e1", borderRadius: "24px",
      boxShadow: "0px 1px 2px 0px rgba(16,24,40,0.06)",
      padding: "20px", overflow: "clip", position: "relative",
    }}>
      <div style={{
        position: "absolute", right: "-12px", top: "-12px",
        width: "80px", height: "80px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(45,169,109,0.13) 0%, rgba(45,169,109,0) 70%)",
        pointerEvents: "none",
      }} />
      <p style={{ fontSize: "14.08px", fontWeight: 400, color: C.textSecondary, lineHeight: "20.416px", marginBottom: "8px" }}>
        {label}
      </p>
      <p style={{ fontSize: "30.4px", fontWeight: 800, color: C.textPrimary, letterSpacing: "-0.912px", lineHeight: "44.08px", margin: 0 }}>
        {value}
      </p>
      <span style={{
        display: "inline-flex", alignItems: "center",
        marginTop: "10px", padding: "6px 10px", borderRadius: "999px",
        background: deltaBg, color: deltaColor,
        fontSize: "13.12px", fontWeight: 800, lineHeight: "19.024px", whiteSpace: "nowrap",
      }}>
        {delta}
      </span>
    </div>
  );
}

const DISTANCE_OPTIONS = [
  { label: "Within 5 miles",  value: 8047 },
  { label: "Within 10 miles", value: 16093 },
  { label: "Within 25 miles", value: 40234 },
  { label: "Within 50 miles", value: 80467 },
  { label: "Any distance",    value: null },
];

export default function AdminVerifiedPharmacies() {
  const [search, setSearch]             = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [market, setMarket]             = useState("");
  const [availability, setAvailability] = useState(""); // "openNow"
  const [serviceType, setServiceType]   = useState(""); // "pickup" | "delivery"
  const [distance, setDistance]         = useState(null);
  const [minRating, setMinRating]       = useState("");
  const [licenseStatus, setLicenseStatus] = useState("");
  const [operator, setOperator]         = useState(""); // "claimed" | "unclaimed"
  const [page, setPage]                 = useState(1);
  const [drawerRecord, setDrawerRecord] = useState(null);
  const [userCoords, setUserCoords]     = useState(null);
  const [geoError, setGeoError]         = useState(false);

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setPage(1); }, [market, availability, serviceType, distance, minRating, licenseStatus, operator]);

  // Request geolocation when user picks a distance
  useEffect(() => {
    if (distance && !userCoords && !geoError) {
      navigator.geolocation.getCurrentPosition(
        pos => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        ()  => setGeoError(true),
      );
    }
  }, [distance]);

  const isDistanceActive = !!(distance && userCoords);
  const isOpenNowActive  = availability === "openNow";
  // compareShops is used when distance or openNow filter is active
  const useCompareShopsMode = isDistanceActive || isOpenNowActive;

  const compareFilters = {
    canojaVerified: true,
    ...(isOpenNowActive ? { openNow: true } : {}),
    ...(market      ? { state: market }                    : {}),
    ...(minRating   ? { minRating: parseFloat(minRating) } : {}),
    ...(licenseStatus === "Expired"  ? { licenseStatus: "Inactive" } :
        licenseStatus === "Active"   ? {} : // active = no expiry filter in compareShops
        licenseStatus                ? { licenseStatus } : {}),
  };
  const compareBody = {
    lat:    isDistanceActive ? userCoords.lat : 39.5,
    lng:    isDistanceActive ? userCoords.lng : -98.35,
    radius: distance ?? 5000000,
    filters: compareFilters,
    page, limit: 50,
    ...(debouncedSearch ? { keyword: debouncedSearch } : {}),
  };

  // Main data: admin endpoint (server-side service type, rating, licenseStatus, market, search)
  const mainParams = { page, limit: 50 };
  if (debouncedSearch) mainParams.q = debouncedSearch;
  if (market)          mainParams.region = market;
  if (minRating)       mainParams.minRating = minRating;
  if (serviceType)     mainParams.serviceType = serviceType;
  if (licenseStatus)   mainParams.licenseStatus = licenseStatus;
  if (operator)        mainParams.claimed = operator;

  const { data: adminData,   isLoading: adminLoading   } = useAdminCanojaVerified(mainParams);
  const { data: compareData, isLoading: compareLoading } = useCompareShops(compareBody, { enabled: useCompareShopsMode });

  // Open-now total count (lightweight separate call)
  const openNowCountBody = { ...compareBody, filters: { ...compareFilters, openNow: true }, page: 1, limit: 1 };
  const { data: openNowCountData } = useCompareShops(openNowCountBody);

  const isLoading = useCompareShopsMode ? compareLoading : adminLoading;

  // Normalize compareShops result (uses `name`) to match raw LicenseRecord shape (uses `business_name`)
  const normalizeShop = s => ({ ...s, business_name: s.business_name || s.name });

  const rawShops = useCompareShopsMode
    ? (compareData?.data?.shops || []).map(normalizeShop)
    : (adminData?.data || []);
  const shops = rawShops;

  const adminPagination   = adminData?.pagination || {};
  const comparePagination = compareData?.data?.pagination || {};
  const pagination = useCompareShopsMode
    ? { total: comparePagination.total_results, pages: comparePagination.total_pages }
    : adminPagination;
  const totalVerified = pagination.total ?? "—";
  const stateOptions  = adminData?.facets?.states || [];
  const facetStats    = adminData?.stats || {};
  const openNowCount  = openNowCountData?.data?.pagination?.total_results ?? 0;
  const deliveryCount = facetStats.deliveryReady ?? 0;
  const avgRating     = facetStats.avgRating != null ? facetStats.avgRating : "—";
  const claimedCount   = facetStats.claimed   ?? 0;
  const unclaimedCount = facetStats.unclaimed ?? 0;

  const handleReset = () => {
    setSearch(""); setDebouncedSearch(""); setMarket(""); setAvailability("");
    setServiceType(""); setDistance(null); setMinRating(""); setLicenseStatus(""); setOperator(""); setPage(1);
    setGeoError(false);
  };

  return (
    <AdminShell>
      <div style={{
        background: "linear-gradient(180deg, rgba(255,255,255,0.72) 0%, rgba(255,255,255,0.96) 100%)",
        border: "0.8px solid rgba(194,210,202,0.5)", borderRadius: "28px",
        boxShadow: "0px 8px 24px 0px rgba(13,59,42,0.08)",
        overflow: "clip", position: "relative",
      }}>
        {/* Header */}
        <div style={{
          position: "sticky", top: 0, zIndex: 10,
          background: "rgba(255,255,255,0.76)", borderBottom: "0.8px solid #dce7e1",
          padding: "24px 24px 24.8px 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: "24px", backdropFilter: "blur(8px)",
        }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <h1 style={{ fontSize: "28.8px", fontWeight: 800, color: C.textPrimary, letterSpacing: "-0.576px", lineHeight: "41.76px", margin: 0 }}>
              Verified Businesses
            </h1>
            <p style={{ fontSize: "15.36px", fontWeight: 400, color: C.textSecondary, lineHeight: "22.272px", maxWidth: "620px", margin: 0 }}>
              Public-facing marketplace directory with verified-first trust signals and consumer-ready filtering.
            </p>
          </div>
          {/* <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
            <button style={{
              height: "42px", padding: "0 20px", borderRadius: "12px",
              background: "#fff", border: "0.8px solid #dce7e1",
              color: C.textPrimary, fontSize: "13.333px", fontWeight: 700,
              cursor: "pointer", whiteSpace: "nowrap",
            }}>Preview Mobile</button>
            <button style={{
              height: "42px", padding: "0 20px", borderRadius: "12px",
              backgroundImage: "linear-gradient(161deg, #1b6b46 0%, #2da96d 100%)",
              border: "0.8px solid rgba(0,0,0,0)", color: "#fff",
              fontSize: "13.333px", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
            }}>Publish Directory</button>
          </div> */}
        </div>

        <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>

          {/* Hero search card */}
          <div style={{
            borderRadius: "24px",
            backgroundImage: "linear-gradient(155deg, #1b6b46 0%, #2eb870 100%)",
            padding: "28px 32px", overflow: "clip",
          }}>
            {/* <span style={{
              display: "inline-flex", alignItems: "center",
              height: "34px", padding: "0 14px", borderRadius: "999px",
              background: "rgba(0,0,0,0.22)", color: "#fff",
              fontSize: "12.8px", fontWeight: 800, whiteSpace: "nowrap", marginBottom: "20px",
            }}>
              Public Layer · Marketplace Search
            </span> */}
            <h2 style={{
              fontSize: "32px", fontWeight: 800, color: "#fff",
              letterSpacing: "-0.64px", lineHeight: "1.2", margin: "0 0 14px 0", maxWidth: "680px",
            }}>
              Find trusted verified operators near you
            </h2>
            <p style={{
              fontSize: "16px", fontWeight: 400, color: "rgba(255,255,255,0.75)",
              lineHeight: "23.2px", margin: "0 0 24px 0", maxWidth: "680px",
            }}>
              Search by name, city, or license number. Verification is visible by default so consumers quickly understand who is licensed, active, and trusted on Canoja.
            </p>
            <div style={{ position: "relative", maxWidth: "520px" }}>
              <span style={{
                position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)",
                color: "#8090a3", fontSize: "14.4px", pointerEvents: "none",
              }}>⌕</span>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search dispensary, city, license number"
                style={{
                  width: "100%", height: "52px", paddingLeft: "44px", paddingRight: "18px",
                  borderRadius: "14px", border: "0.8px solid rgba(255,255,255,0.3)",
                  background: "rgba(255,255,255,0.97)",
                  boxShadow: "0px 1px 4px 0px rgba(0,0,0,0.12)",
                  fontSize: "15px", color: C.textPrimary, outline: "none",
                  fontFamily: "inherit", boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          {/* Content grid */}
          <div style={{ display: "grid", gridTemplateColumns: "300px minmax(0,1fr)", gap: "18px" }}>

            {/* Filters panel */}
            <div style={{
              position: "sticky", top: "24px", alignSelf: "start",
              background: "#fff", border: "0.8px solid #dce7e1", borderRadius: "24px",
              boxShadow: "0px 1px 2px 0px rgba(16,24,40,0.06)", padding: "20px",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
                <span style={{ fontSize: "16px", fontWeight: 800, color: C.textPrimary }}>Browse Filters</span>
                <button onClick={handleReset} style={{ fontSize: "14.08px", fontWeight: 700, color: "#1b6b46", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                  Reset
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

                {/* Distance */}
                <div>
                  <label style={{ display: "block", fontSize: "13.76px", fontWeight: 800, color: C.textPrimary, marginBottom: "8px" }}>Distance</label>
                  <select
                    value={distance ?? ""}
                    onChange={e => setDistance(e.target.value ? parseInt(e.target.value) : null)}
                    style={{ width: "100%", height: "42px", padding: "0 12px", borderRadius: "12px", border: "0.8px solid #dce7e1", background: "#fff", fontSize: "14.72px", color: C.textPrimary, outline: "none", cursor: "pointer" }}
                  >
                    {DISTANCE_OPTIONS.map(o => (
                      <option key={o.label} value={o.value ?? ""}>{o.label}</option>
                    ))}
                  </select>
                  {distance && geoError && (
                    <p style={{ fontSize: "12px", color: "#d9822b", margin: "6px 0 0" }}>Location access denied — distance filter unavailable.</p>
                  )}
                  {distance && !userCoords && !geoError && (
                    <p style={{ fontSize: "12px", color: C.textSecondary, margin: "6px 0 0" }}>Getting your location…</p>
                  )}
                </div>

                {/* Availability */}
                <div>
                  <label style={{ display: "block", fontSize: "13.76px", fontWeight: 800, color: C.textPrimary, marginBottom: "8px" }}>Availability</label>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {[{ label: "Open Now", value: "openNow", count: openNowCount }].map(({ label, value, count }) => (
                      <div
                        className={`admin-filter-row${availability === value ? " admin-filter-row--active" : ""}`}
                        key={value}
                        onClick={() => setAvailability(availability === value ? "" : value)}
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          padding: "10.8px 12.8px", borderRadius: "12px",
                          border: `0.8px solid ${availability === value ? "#2da96d" : "#dce7e1"}`,
                          background: availability === value ? "#edf9f2" : "#fcfefd",
                          cursor: "pointer",
                        }}
                      >
                        <span style={{ fontSize: "14.72px", fontWeight: 400, color: C.textPrimary }}>{label}</span>
                        <span style={{ fontSize: "13.12px", fontWeight: 700, color: C.textSecondary }}>{count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Service Type */}
                {/* <div>
                  <label style={{ display: "block", fontSize: "13.76px", fontWeight: 800, color: C.textPrimary, marginBottom: "8px" }}>Service Type</label>
                  <select
                    value={serviceType}
                    onChange={e => setServiceType(e.target.value)}
                    style={{ width: "100%", height: "42px", padding: "0 12px", borderRadius: "12px", border: "0.8px solid #dce7e1", background: "#fff", fontSize: "14.72px", color: C.textPrimary, outline: "none", cursor: "pointer" }}
                  >
                    <option value="">All Types</option>
                    <option value="pickup">Pickup</option>
                    <option value="delivery">Delivery</option>
                  </select>
                </div> */}

                {/* Market */}
                <div>
                  <label style={{ display: "block", fontSize: "13.76px", fontWeight: 800, color: C.textPrimary, marginBottom: "8px" }}>Market</label>
                  <select
                    value={market}
                    onChange={e => setMarket(e.target.value)}
                    style={{ width: "100%", height: "42px", padding: "0 12px", borderRadius: "12px", border: "0.8px solid #dce7e1", background: "#fff", fontSize: "14.72px", color: C.textPrimary, outline: "none", cursor: "pointer" }}
                  >
                    <option value="">All Markets</option>
                    {stateOptions.map(s => (
                      <option key={s._id} value={s._id}>{s._id} ({s.count})</option>
                    ))}
                  </select>
                </div>

                {/* Min Rating */}
                <div>
                  <label style={{ display: "block", fontSize: "13.76px", fontWeight: 800, color: C.textPrimary, marginBottom: "8px" }}>Minimum Rating</label>
                  <select
                    value={minRating}
                    onChange={e => setMinRating(e.target.value)}
                    style={{ width: "100%", height: "42px", padding: "0 12px", borderRadius: "12px", border: "0.8px solid #dce7e1", background: "#fff", fontSize: "14.72px", color: C.textPrimary, outline: "none", cursor: "pointer" }}
                  >
                    <option value="">Any Rating</option>
                    <option value="3">3★ & above</option>
                    <option value="3.5">3.5★ & above</option>
                    <option value="4">4★ & above</option>
                    <option value="4.5">4.5★ & above</option>
                  </select>
                </div>

                {/* License Status */}
                <div>
                  <label style={{ display: "block", fontSize: "13.76px", fontWeight: 800, color: C.textPrimary, marginBottom: "8px" }}>License Status</label>
                  <select
                    value={licenseStatus}
                    onChange={e => setLicenseStatus(e.target.value)}
                    style={{ width: "100%", height: "42px", padding: "0 12px", borderRadius: "12px", border: "0.8px solid #dce7e1", background: "#fff", fontSize: "14.72px", color: C.textPrimary, outline: "none", cursor: "pointer" }}
                  >
                    <option value="">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Expired">Expired</option>
                  </select>
                </div>

                {/* Operator */}
                <div>
                  <label style={{ display: "block", fontSize: "13.76px", fontWeight: 800, color: C.textPrimary, marginBottom: "8px" }}>Operator</label>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {[
                      { label: "Claimed",   value: "claimed",   count: claimedCount },
                      { label: "Unclaimed", value: "unclaimed", count: unclaimedCount },
                    ].map(({ label, value, count }) => (
                      <div
                        className={`admin-filter-row${operator === value ? " admin-filter-row--active" : ""}`}
                        key={value}
                        onClick={() => setOperator(operator === value ? "" : value)}
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          padding: "10.8px 12.8px", borderRadius: "12px",
                          border: `0.8px solid ${operator === value ? "#2da96d" : "#dce7e1"}`,
                          background: operator === value ? "#edf9f2" : "#fcfefd",
                          cursor: "pointer",
                        }}
                      >
                        <span style={{ fontSize: "14.72px", fontWeight: 400, color: C.textPrimary }}>{label}</span>
                        <span style={{ fontSize: "13.12px", fontWeight: 700, color: C.textSecondary }}>{count}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>

            {/* Right column */}
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>

              {/* Stat cards */}
              <div style={{ position: "sticky", top: 0, zIndex: 10, background: "#f8fafc", paddingBottom: "12px", marginBottom: "-12px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "18px" }}>
                <StatCard
                  label="Verified Results"
                  value={typeof totalVerified === "number" ? totalVerified.toLocaleString() : totalVerified}
                  delta={licenseStatus === "Expired" ? "Expired Licenses" : "Canoja Verified"}
                  deltaBg={licenseStatus === "Expired" ? "#fff5eb" : "#edf9f2"}
                  deltaColor={licenseStatus === "Expired" ? "#d9822b" : "#1f9d61"}
                />
                <StatCard
                  label="Open Now"
                  value={openNowCount}
                  delta="Live operating hours"
                  deltaBg="#edf5ff" deltaColor="#2f80ed"
                />
                <StatCard
                  label="Delivery Ready"
                  value={deliveryCount}
                  delta="Delivery available"
                  deltaBg="#fff5eb" deltaColor="#d9822b"
                />
                <StatCard
                  label="Avg Rating"
                  value={avgRating}
                  delta="Across results"
                  deltaBg="#edf9f2" deltaColor="#1f9d61"
                />
              </div>
              </div>

              {isLoading && (
                <div style={{ textAlign: "center", padding: "40px", color: C.textSecondary, fontSize: "14px" }}>
                  Loading verified pharmacies…
                </div>
              )}

              {!isLoading && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "18px" }}>
                  {shops.length === 0 ? (
                    <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px", color: C.textSecondary, fontSize: "14px" }}>
                      No results found.
                    </div>
                  ) : (
                    shops.map(s => <PharmacyCard key={s._id} shop={s} onViewProfile={() => setDrawerRecord(s)} />)
                  )}
                </div>
              )}

              {/* Pagination */}
              {((pagination.pages ?? pagination.total_pages) > 1) && (
                <div style={{ display: "flex", justifyContent: "flex-end", background: "#fff", border: "0.8px solid #dce7e1", borderRadius: "16px", padding: "12px 20px" }}>
                  <ConfigProvider theme={{ token: { colorPrimary: "#1b6b46" } }}>
                    <Pagination
                      current={page}
                      pageSize={50}
                      total={pagination.total ?? 0}
                      showSizeChanger={false}
                      showTotal={t => `${t.toLocaleString()} results`}
                      onChange={p => setPage(p)}
                    />
                  </ConfigProvider>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
      <ProfileDrawer record={drawerRecord} onClose={() => setDrawerRecord(null)} />
    </AdminShell>
  );
}
