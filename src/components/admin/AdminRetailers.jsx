import React, { useState, useEffect, useRef } from "react";
import { Table, ConfigProvider, Drawer } from "antd";
import AdminShell from "./AdminShell";
import { useAdminRetailers, useAdminAuditLog, useRecentAuditLog, useCreateRetailer } from "../../services/admin";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { Search } from "lucide-react";
import retailersTotalIcon from "../../assets/admin-retailers-total.png";
import retailersVerifiedIcon from "../../assets/admin-retailers-verified.png";
import retailersExpiringIcon from "../../assets/admin-retailers-expiring.png";
import retailersGapsIcon from "../../assets/admin-retailers-gaps.png";

// ── Design tokens (exact from Figma) ─────────────────────────────────────────
const C = {
  border: "#dce7e1",
  tableBorder: "0.8px solid #dce7e1",
  textPrimary: "#18212b",
  textSecondary: "#617182",
  green: "#2da96d",
  greenDark: "#1b6b46",
  appBg: "#f6f9f8",
};

// ── Status badge — exact Figma: h-28, rounded-full, 12.48px extrabold ─────────
function StatusBadge({ status }) {
  const map = {
    Claimed: { bg: "#edf9f2", color: "#1f9d61" },
    Pending: { bg: "#fff5eb", color: "#d9822b" },
    Expired: { bg: "#fff1f1", color: "#d64545" },
    Unclaimed: { bg: "#fff1f1", color: "#d64545" },
  };
  const s = map[status] || { bg: "#f4f7fa", color: "#617182" };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        height: "28px",
        padding: "0 10px",
        borderRadius: "999px",
        background: s.bg,
        color: s.color,
        fontSize: "12.48px",
        fontWeight: 800,
        whiteSpace: "nowrap",
        border: "0.8px solid rgba(0,0,0,0)",
      }}
    >
      {status}
    </span>
  );
}

// ── Source badge ──────────────────────────────────────────────────────────────
function SourceBadge({ source }) {
  const isAI = source.includes("AI");
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        height: "28px",
        padding: "0 10px",
        borderRadius: "999px",
        background: isAI ? "#edf5ff" : "#f4f7fa",
        color: isAI ? "#2f80ed" : "#617182",
        fontSize: "12.48px",
        fontWeight: 800,
        whiteSpace: "nowrap",
        border: "0.8px solid rgba(0,0,0,0)",
      }}
    >
      {source}
    </span>
  );
}

// ── Action button ─────────────────────────────────────────────────────────────
function ActionBtn({ row }) {
  if (row.actionStyle === "review") {
    return (
      <button
        style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          height: "42px", padding: "0 16px", borderRadius: "12px",
          background: "#fff5eb", color: "#d9822b",
          fontSize: "13.333px", fontWeight: 700,
          border: "0.8px solid rgba(0,0,0,0)", cursor: "pointer",
        }}
      >
        Review
      </button>
    );
  }
  if (row.actionStyle === "investigate") {
    return (
      <button
        style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          height: "42px", padding: "0 16px", borderRadius: "12px",
          background: "#fff", color: C.textPrimary,
          fontSize: "13.333px", fontWeight: 700,
          border: "0.8px solid #dce7e1", cursor: "pointer",
        }}
      >
        Investigate
      </button>
    );
  }
  return (
    <button
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        height: "42px", padding: "0 16px", borderRadius: "12px",
        background: "#fff", color: C.textPrimary,
        fontSize: "13.333px", fontWeight: 700,
        border: "0.8px solid #dce7e1", cursor: "pointer",
      }}
    >
      View
    </button>
  );
}

// ── Data mapper ───────────────────────────────────────────────────────────────
const SOURCE_LABELS = { state_db: "State DB", manual: "Manual", ai_verified: "AI Verified" };

function mapRetailer(r) {
  const now = Date.now();
  const exp = r.expiration_date ? new Date(r.expiration_date) : null;
  const isExpired = exp && exp.getTime() < now;
  const isExpiring = exp && !isExpired && (exp.getTime() - now) < 30 * 86400000;
  const isPending = r._vrStatus?.status === "pending";
  let verification = isPending ? "Pending" : r.claimed ? "Claimed" : isExpired ? "Expired" : "Unclaimed";
  let actionStyle = isExpiring ? "review" : "view";
  return {
    key: r._id,
    name: r.business_name || "—",
    sub: r.dba ? `DBA: ${r.dba}` : r.owner?.name ? `Owner: ${r.owner.name}` : "",
    license: r.license_number || "—",
    market: r.stateName || r.city || "—",
    verification,
    expires: exp ? exp.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }) : "—",
    completeness: r.dataCompletenessScore != null ? `${r.dataCompletenessScore}%` : "—",
    source: SOURCE_LABELS[r.sourceType] || "—",
    actionStyle,
  };
}


// ── Retailer detail drawer ────────────────────────────────────────────────────
function DetailRow({ label, value }) {
  return (
    <div className="admin-detail-row" style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
      <span style={{ fontSize: "12px", fontWeight: 700, color: "#617182", textTransform: "uppercase", letterSpacing: "0.8px" }}>{label}</span>
      <span style={{ fontSize: "14px", color: "#18212b" }}>{value || "—"}</span>
    </div>
  );
}

function RetailerDrawer({ record, onClose }) {
  const { data: auditData } = useAdminAuditLog(
    record ? { targetType: "LicenseRecord", targetId: record._id, limit: 20 } : {}
  );
  const auditLogs = auditData?.data || [];
  const lifecycle = record?.verificationLifecycle || [];
  const vr = record?._vrStatus;
  const exp = record?.expiration_date ? new Date(record.expiration_date) : null;
  const now = Date.now();
  const isExpired = exp && exp.getTime() < now;
  const isExpiring = exp && !isExpired && (exp.getTime() - now) < 30 * 86400000;

  const vrLabel = vr?.status === "approved" && vr?.method === "manual" ? "Admin Verified"
    : vr?.status === "auto_verified" ? "Auto Verified"
      : vr?.status === "pending" ? "Pending"
        : record?.claimed ? "Verified" : "Unverified";

  return (
    <Drawer
      rootClassName="admin-retailer-drawer"
      open={!!record}
      onClose={onClose}
      width={520}
      title={null}
      closeIcon={null}
      styles={{ body: { padding: 0 }, header: { display: "none" } }}
    >
      {record && (
        <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily: "Inter, sans-serif" }}>
          {/* Header */}
          <div className="admin-retailer-drawer__header" style={{ padding: "24px", borderBottom: "0.8px solid #dce7e1", background: "linear-gradient(155deg, rgba(45,169,109,0.08) 0%, #fff 100%)" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
              <div>
                <p style={{ fontSize: "18px", fontWeight: 800, color: "#18212b", margin: 0, lineHeight: "26px" }}>{record.business_name || "—"}</p>
                {record.dba && <p style={{ fontSize: "13px", color: "#617182", margin: "2px 0 0" }}>DBA: {record.dba}</p>}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                <StatusBadge status={vrLabel} />
                <button onClick={onClose} style={{ background: "none", border: "0.8px solid #dce7e1", borderRadius: "8px", width: "32px", height: "32px", cursor: "pointer", fontSize: "16px", color: "#617182" }}>✕</button>
              </div>
            </div>
            {(isExpiring || isExpired) && (
              <div style={{ marginTop: "10px", padding: "8px 12px", borderRadius: "8px", background: isExpired ? "#fff1f1" : "#fff5eb", color: isExpired ? "#d64545" : "#d9822b", fontSize: "13px", fontWeight: 600 }}>
                {isExpired ? "License expired" : "License expiring within 30 days"}
              </div>
            )}
          </div>

          {/* Scrollable body */}
          <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>

            {/* License info */}
            <div>
              <p className="admin-detail-section-title" style={{ fontSize: "13px", fontWeight: 800, color: "#18212b", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>License</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <DetailRow label="License #" value={record.license_number} />
                <DetailRow label="Status" value={record.license_status} />
                <DetailRow label="Type" value={record.license_type} />
                <DetailRow label="Jurisdiction" value={record.jurisdiction || record.stateName} />
                <DetailRow label="Issued" value={record.issue_date ? new Date(record.issue_date).toLocaleDateString() : null} />
                <DetailRow label="Expires" value={exp ? exp.toLocaleDateString() : null} />
              </div>
            </div>

            {/* Location */}
            <div>
              <p className="admin-detail-section-title" style={{ fontSize: "13px", fontWeight: 800, color: "#18212b", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>Location</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <DetailRow label="Address" value={record.business_address} />
                <DetailRow label="City" value={record.city} />
                <DetailRow label="State" value={record.stateName} />
                <DetailRow label="ZIP" value={record.postal_code} />
              </div>
            </div>

            {/* Contact */}
            <div>
              <p className="admin-detail-section-title" style={{ fontSize: "13px", fontWeight: 800, color: "#18212b", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>Contact</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <DetailRow label="Phone" value={record.contact_information?.phone} />
                <DetailRow label="Email" value={record.contact_information?.email} />
                <DetailRow label="Website" value={record.contact_information?.website} />
                <DetailRow label="Owner" value={record.owner?.name} />
              </div>
            </div>

            {/* Verification lifecycle */}
            {false && (lifecycle.length > 0 || auditLogs.length > 0) && (
              <div>
                <p style={{ fontSize: "13px", fontWeight: 800, color: "#18212b", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>Timeline</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
                  {lifecycle.map((e, i) => (
                    <div key={i} style={{ display: "grid", gridTemplateColumns: "12px 1fr", gap: "14px", paddingBottom: "14px" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
                        <div style={{ width: "12px", height: "12px", borderRadius: "6px", background: "#2da96d", flexShrink: 0 }} />
                        {i < lifecycle.length - 1 && <div style={{ width: "2px", flex: 1, background: "#dce7e1", marginTop: "4px" }} />}
                      </div>
                      <div style={{ paddingBottom: "4px" }}>
                        <p style={{ fontSize: "14px", fontWeight: 600, color: "#18212b", margin: 0 }}>{e.status}</p>
                        <p style={{ fontSize: "12px", color: "#617182", margin: "2px 0 0" }}>{e.at ? new Date(e.at).toLocaleString() : ""}{e.note ? ` · ${e.note}` : ""}</p>
                      </div>
                    </div>
                  ))}
                  {auditLogs.map((log, i) => (
                    <div key={`al-${i}`} style={{ display: "grid", gridTemplateColumns: "12px 1fr", gap: "14px", paddingBottom: "14px" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <div style={{ width: "12px", height: "12px", borderRadius: "3px", background: "#617182", flexShrink: 0 }} />
                      </div>
                      <div>
                        <p style={{ fontSize: "14px", fontWeight: 600, color: "#18212b", margin: 0 }}>{log.action?.replace(/_/g, " ")}</p>
                        <p style={{ fontSize: "12px", color: "#617182", margin: "2px 0 0" }}>
                          {log.actor?.name || "Admin"} · {new Date(log.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Source / metadata */}
            <div>
              <p className="admin-detail-section-title" style={{ fontSize: "13px", fontWeight: 800, color: "#18212b", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>Meta</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <DetailRow label="Source" value={SOURCE_LABELS[record.sourceType] || record.sourceType} />
                <DetailRow label="Risk Flag" value={record.riskFlag} />
                <DetailRow label="Completeness" value={record.dataCompletenessScore != null ? `${record.dataCompletenessScore}%` : null} />
                <DetailRow label="Claimed" value={record.claimed ? `Yes · ${record.claimedAt ? new Date(record.claimedAt).toLocaleDateString() : ""}` : "No"} />
              </div>
            </div>
          </div>
        </div>
      )}
    </Drawer>
  );
}

// ── Add Retailer modal ────────────────────────────────────────────────────────
function AddRetailerModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    business_name: "", license_number: "", stateName: "", city: "",
    business_address: "", license_type: "", license_status: "active",
    expiration_date: "", sourceType: "manual", phone: "", email: "",
  });
  const [loading, setLoading] = useState(false);
  const { mutateAsync: create } = useCreateRetailer();

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.business_name.trim()) return;
    setLoading(true);
    try {
      await create(form);
      toast.success("Retailer added successfully");
      onSuccess();
    } catch (err) {
      toast.error(err.message || "Failed to add retailer");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%", height: "40px", padding: "0 12px", borderRadius: "10px",
    border: "0.8px solid #dce7e1", background: "#fff",
    fontSize: "14px", color: "#18212b", outline: "none", fontFamily: "inherit",
    boxSizing: "border-box",
  };
  const labelStyle = { display: "block", fontSize: "12px", fontWeight: 700, color: "#617182", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "5px" };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", borderRadius: "20px", padding: "28px", width: "520px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0px 24px 48px rgba(0,0,0,0.16)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#18212b", margin: 0 }}>Add Retailer</h3>
          <button onClick={onClose} style={{ background: "none", border: "0.8px solid #dce7e1", borderRadius: "8px", width: "32px", height: "32px", cursor: "pointer", fontSize: "16px", color: "#617182" }}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Business Name *</label>
              <input required value={form.business_name} onChange={e => set("business_name", e.target.value)} placeholder="Legal business name" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>License Number</label>
              <input value={form.license_number} onChange={e => set("license_number", e.target.value)} placeholder="e.g. CA-2024-0012" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>License Type</label>
              <input value={form.license_type} onChange={e => set("license_type", e.target.value)} placeholder="e.g. Retailer" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>State</label>
              <input value={form.stateName} onChange={e => set("stateName", e.target.value)} placeholder="e.g. California" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>City</label>
              <input value={form.city} onChange={e => set("city", e.target.value)} placeholder="e.g. Los Angeles" style={inputStyle} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Address</label>
              <input value={form.business_address} onChange={e => set("business_address", e.target.value)} placeholder="Street address" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>License Status</label>
              <select value={form.license_status} onChange={e => set("license_status", e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="suspended">Suspended</option>
                <option value="revoked">Revoked</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Expiration Date</label>
              <input type="date" value={form.expiration_date} onChange={e => set("expiration_date", e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Phone</label>
              <input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="Contact phone" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="Contact email" style={inputStyle} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Source</label>
              <select value={form.sourceType} onChange={e => set("sourceType", e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                <option value="manual">Manual</option>
                <option value="state_db">State Database</option>
                <option value="ai_verified">AI Verified</option>
              </select>
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "6px" }}>
            <button type="button" onClick={onClose} style={{ height: "40px", padding: "0 20px", borderRadius: "10px", background: "#fff", border: "0.8px solid #dce7e1", color: "#18212b", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
              Cancel
            </button>
            <button type="submit" disabled={loading} style={{ height: "40px", padding: "0 20px", borderRadius: "10px", backgroundImage: "linear-gradient(161deg,#1b6b46 0%,#2da96d 100%)", border: "none", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer", opacity: loading ? 0.6 : 1 }}>
              {loading ? "Adding…" : "Add Retailer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


// ── Table columns — exact Figma header labels + cell styles ──────────────────
const columns = [
  {
    title: "Business",
    dataIndex: "name",
    key: "name",
    render: (_, row) => (
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <span style={{ fontWeight: 700, fontSize: "15.36px", color: C.textPrimary, lineHeight: "22.272px" }}>
          {row.name}
        </span>
        <span style={{ fontWeight: 400, fontSize: "14.08px", color: C.textSecondary, lineHeight: "20.416px" }}>
          {row.sub}
        </span>
      </div>
    ),
  },
  {
    title: "License",
    dataIndex: "license",
    key: "license",
    render: v => <span style={{ fontSize: "16px", color: C.textPrimary }}>{v}</span>,
  },
  {
    title: "Market",
    dataIndex: "market",
    key: "market",
    render: v => <span style={{ fontSize: "16px", color: C.textPrimary }}>{v}</span>,
  },
  {
    title: "Claimed",
    dataIndex: "verification",
    key: "verification",
    render: v => <StatusBadge status={v} />,
  },
  {
    title: "Expires",
    dataIndex: "expires",
    key: "expires",
    render: v => <span style={{ fontSize: "16px", color: C.textPrimary }}>{v}</span>,
  },
  {
    title: "Completeness",
    dataIndex: "completeness",
    key: "completeness",
    render: v => <span style={{ fontSize: "16px", color: C.textPrimary }}>{v}</span>,
  },
  {
    title: "Source",
    dataIndex: "source",
    key: "source",
    render: v => <SourceBadge source={v} />,
  },
  {
    title: "Actions",
    key: "actions",
    render: (_, row) => <ActionBtn row={row} />,
  },
];

// ── Filter check row — exact Figma style ──────────────────────────────────────
function FilterRow({ label, count, active, onClick }) {
  return (
    <button
      className={`admin-filter-row${active ? " admin-filter-row--active" : ""}`}
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        width: "100%", padding: "10.8px 12.8px",
        borderRadius: "12px",
        border: active ? "0.8px solid #2da96d" : "0.8px solid #dce7e1",
        background: active ? "#edf9f2" : "#fcfefd",
        cursor: "pointer",
      }}
    >
      <span style={{ fontSize: "14.72px", fontWeight: 400, color: active ? "#1f9d61" : C.textPrimary }}>
        {label}
      </span>
      <span style={{ fontSize: "13.12px", fontWeight: 700, color: C.textSecondary }}>
        {count}
      </span>
    </button>
  );
}

// ── Stat card — exact Figma ───────────────────────────────────────────────────
function StatCard({ label, value, delta, deltaBg, deltaColor, icon }) {
  return (
    <div className="admin-queue-stat"
      style={{
        backgroundImage: "linear-gradient(155deg, #1b6b46 0%, #2eb870 100%)",
        border: "0.8px solid #dce7e1",
        borderRadius: "24px",
        boxShadow: "0px 1px 2px 0px rgba(16,24,40,0.06)",
        padding: "20px",
        overflow: "clip",
        position: "relative",
      }}
    >
      <div style={{
        justifyContent: "space-between", flex: 1, alignItems: "flex-start",
        height: "100%", display: "flex", flexDirection: "column",
      }} >
        <p className="admin-queue-stat__label" style={{ color: 'white', alignSelf: "flex-start" }}>{label}</p>
        <p className="admin-queue-stat__value" style={{ color: 'white' }}>{value}</p>
        <span className="admin-queue-stat__badge" style={{ background: deltaBg, color: deltaColor }}>{delta}</span>
      </div>
      <img className="admin-queue-stat__icon" style={{ width: "80px", height: "80px", position: 'absolute', right: "20px" }} src={icon} alt="" aria-hidden="true" />
    </div>
  );
}

// ── Chip (hero banner tags) ───────────────────────────────────────────────────
function Chip({ children }) {
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center",
        padding: "8px 12px",
        borderRadius: "999px",
        background: "#ebfbf2",
        color: "#145237",
        fontSize: "13.12px",
        fontWeight: 800,
        lineHeight: "19.024px",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

// ── Layer badge (hero card top label) ─────────────────────────────────────────
function LayerBadge({ children, muted }) {
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center",
        height: "36.15px",
        padding: "0 12px",
        borderRadius: "999px",
        background: muted ? "#f4f7fa" : "rgba(255,255,255,0.75)",
        border: "0.8px solid #dce7e1",
        color: muted ? "#617182" : "#145237",
        fontSize: "12.8px",
        fontWeight: 800,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminRetailers() {
  const queryClient = useQueryClient();

  // Filter draft state — for dropdowns, applied on button click
  const [stateDraft, setStateDraft] = useState("");
  const [sourceDraft, setSourceDraft] = useState("");
  const [completenessFilter, setCompletenessFilter] = useState("");

  // Quick-filter state — applied immediately on click
  const [vFilter, setVFilter] = useState(""); // "verified" | "claimed" | "unverified"
  const [lFilter, setLFilter] = useState(""); // "active" | "lt30" | "expired"

  // Search input — debounced into API params
  const [search, setSearch] = useState("");

  // Actual params driving the API call
  const [apiParams, setApiParams] = useState({ limit: 50, page: 1 });

  // Drawer + Add modal
  const [drawerRecord, setDrawerRecord] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Saved searches
  const [savedSearches, setSavedSearches] = useState(() => {
    try { return JSON.parse(localStorage.getItem("adminSavedSearches") || "[]"); }
    catch { return []; }
  });
  const [showSavedDropdown, setShowSavedDropdown] = useState(false);
  const savedDropdownRef = useRef(null);

  // Close saved searches dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (savedDropdownRef.current && !savedDropdownRef.current.contains(e.target))
        setShowSavedDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Debounce search into apiParams
  useEffect(() => {
    const t = setTimeout(() => {
      setApiParams(p => {
        const next = { ...p, page: 1 };
        if (search) next.q = search; else delete next.q;
        return next;
      });
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const { data: apiData, isLoading, isError } = useAdminRetailers(apiParams);
  const { data: timelineData } = useAdminAuditLog({ targetType: "LicenseRecord", limit: 6 });
  const { data: recentLogsData } = useRecentAuditLog({ limit: 5 });
  const timelineLogs = timelineData?.data || [];
  const recentAuditLogs = recentLogsData?.data || [];

  const rawRecords = apiData?.data || [];
  const records = rawRecords.map(mapRetailer);
  const pagination = apiData?.pagination || {};
  const facets = apiData?.facets || {};
  const stats = apiData?.stats || {};

  // Facet counts for filter sidebar
  const claimedCount = facets.claimedCount ?? 0;
  const unclaimedCount = facets.unclaimedCount ?? 0;
  const expiringSoonCount = facets.expiringSoonCount ?? 0;
  const dataGapsCount = facets.dataGapsCount ?? 0;
  const pendingVRCount = facets.pendingVRCount ?? 0;
  const verifiedBreakdown = facets.verifiedBreakdown || {};
  const adminVerifiedCount = verifiedBreakdown.adminVerified ?? 0;
  const autoVerifiedCount = verifiedBreakdown.autoVerified ?? 0;
  const activeFacetCount = facets.licenseStatuses?.find(f => /^active$/i.test(f._id))?.count ?? 0;
  const expiredFacetCount = facets.expiredByDateCount ?? 0;
  const stateOptions = facets.states || [];

  // Counts for hero chips (based on current-page records)
  const needReviewCount = records.filter(r => r.actionStyle === "review").length;
  const expiringCount = records.filter(r => {
    if (r.expires === "—") return false;
    const d = new Date(r.expires);
    return d.getTime() > Date.now() && d.getTime() - Date.now() < 30 * 86400000;
  }).length;

  const total = pagination.total ?? 0;

  const filteredVerified = stats.verifiedCount ?? 0;
  const filteredExpiringSoon = stats.expiringSoon ?? 0;
  const filteredDataGaps = stats.dataGaps ?? 0;

  const STATS = [
    { label: "Total Retailers", value: total.toLocaleString(), delta: "In database", deltaBg: "#edf9f2", deltaColor: "#1f9d61", icon: retailersTotalIcon },
    { label: "Verified", value: filteredVerified.toLocaleString(), delta: `${total ? Math.round(filteredVerified / total * 100) : 0}% of total`, deltaBg: "#edf5ff", deltaColor: "#2f80ed", icon: retailersVerifiedIcon },
    { label: "Expiring Soon", value: filteredExpiringSoon.toLocaleString(), delta: "Needs attention", deltaBg: "#fff5eb", deltaColor: "#d9822b", icon: retailersExpiringIcon },
    { label: "Data Gaps", value: filteredDataGaps.toLocaleString(), delta: "Owner/contact missing", deltaBg: "#fff1f1", deltaColor: "#d64545", icon: retailersGapsIcon },
  ];

  // ── Filter handlers ──────────────────────────────────────────────────────────

  const handleVFilter = (val) => {
    const next = vFilter === val ? "" : val;
    setVFilter(next);
    setApiParams(p => {
      const u = { ...p, page: 1 };
      if (next) u.verificationStatus = next; else delete u.verificationStatus;
      return u;
    });
  };

  const handleLFilter = (val) => {
    const next = lFilter === val ? "" : val;
    setLFilter(next);
    setApiParams(p => {
      const u = { ...p, page: 1 };
      delete u.licenseStatus;
      delete u.expirationWindow;
      if (next === "active") u.licenseStatus = "active";
      else if (next) u.expirationWindow = next;
      return u;
    });
  };

  const handleStateChange = (val) => {
    setStateDraft(val);
    setApiParams(p => {
      const u = { ...p, page: 1 };
      if (val) u.state = val; else delete u.state;
      return u;
    });
  };

  const handleSourceChange = (val) => {
    setSourceDraft(val);
    setApiParams(p => {
      const u = { ...p, page: 1 };
      if (val) u.sourceType = val; else delete u.sourceType;
      return u;
    });
  };

  const handleApply = () => {
    setApiParams(p => {
      const u = { ...p, page: 1 };
      if (stateDraft) u.state = stateDraft; else delete u.state;
      if (sourceDraft) u.sourceType = sourceDraft; else delete u.sourceType;
      return u;
    });
  };

  const [exporting, setExporting] = useState(false);

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const response = await import("../../services/api").then(m => m.default.get("/admin/retailers", {
        params: { ...apiParams, page: 1, limit: 10000 },
      }));
      const allRecords = response.data?.data || [];

      const SOURCE_LABELS = { state_db: "State DB", manual: "Manual", ai_verified: "AI Verified" };

      const headers = ["Business Name", "DBA", "License #", "License Type", "State", "City", "Address", "Phone", "Email", "License Status", "Expiration Date", "Claimed", "Completeness %", "Source"];

      const rows = allRecords.map(r => {
        const now = Date.now();
        const exp = r.expiration_date ? new Date(r.expiration_date) : null;
        const isExpired = exp && exp.getTime() < now;
        const isExpiring = exp && !isExpired && (exp.getTime() - now) < 30 * 86400000;
        const isPending = r._vrStatus?.status === "pending";
        const verification = isPending ? "Pending" : r.claimed ? "Claimed" : isExpired ? "Expired" : "Unclaimed";

        return [
          r.business_name || "",
          r.dba || "",
          r.license_number || "",
          r.license_type || "",
          r.stateName || "",
          r.city || "",
          r.business_address || "",
          r.contact_information?.phone || "",
          r.contact_information?.email || "",
          r.license_status || "",
          exp ? exp.toLocaleDateString("en-US") : "",
          verification,
          r.dataCompletenessScore != null ? `${r.dataCompletenessScore}%` : "",
          SOURCE_LABELS[r.sourceType] || r.sourceType || "",
        ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(",");
      });

      const csv = [headers.join(","), ...rows].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `retailers_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert("Export failed: " + (e.message || "Unknown error"));
    } finally {
      setExporting(false);
    }
  };

  const handleReset = () => {
    setVFilter("");
    setLFilter("");
    setStateDraft("");
    setSourceDraft("");
    setCompletenessFilter("");
    setSearch("");
    setApiParams({ limit: 50, page: 1 });
  };

  const handleSaveSearch = () => {
    const name = window.prompt("Name this search:");
    if (!name?.trim()) return;
    const entry = { name: name.trim(), params: apiParams, search, vFilter, lFilter, stateDraft, sourceDraft, savedAt: new Date().toISOString() };
    const updated = [entry, ...savedSearches].slice(0, 10);
    setSavedSearches(updated);
    localStorage.setItem("adminSavedSearches", JSON.stringify(updated));
    setShowSavedDropdown(false);
  };

  const handleLoadSearch = (s) => {
    setApiParams(s.params);
    setSearch(s.search || "");
    setVFilter(s.vFilter || "");
    setLFilter(s.lFilter || "");
    setStateDraft(s.stateDraft || "");
    setSourceDraft(s.sourceDraft || "");
    setShowSavedDropdown(false);
  };

  const handleDeleteSearch = (i, e) => {
    e.stopPropagation();
    const updated = savedSearches.filter((_, idx) => idx !== i);
    setSavedSearches(updated);
    localStorage.setItem("adminSavedSearches", JSON.stringify(updated));
  };

  return (
    <AdminShell>
      {/* ── Outer frosted card (Figma: rounded-28, border rgba(194,210,202,0.5)) */}
      <div className="admin-queue-page"
        style={{
          background: "linear-gradient(180deg, rgba(255,255,255,0.72) 0%, rgba(255,255,255,0.96) 100%)",
          border: "0.8px solid rgba(194,210,202,0.5)",
          borderRadius: "28px",
          boxShadow: "0px 8px 24px 0px rgba(13,59,42,0.08)",
          overflow: "clip",
          position: "relative",
        }}
      >
        {/* ── Sticky header bar ─────────────────────────────────────────── */}
        <div className="admin-queue-header"
          style={{
            position: "sticky",
            top: 0,
            zIndex: 10,
            background: "rgba(255,255,255,0.76)",
            borderBottom: "0.8px solid #dce7e1",
            padding: "24px 24px 24.8px 24px",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "24px",
            backdropFilter: "blur(8px)",
          }}
        >
          {/* Left: title + subtitle */}
          <div className="admin-retailer-heading" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <h1
              style={{
                fontSize: "28.8px",
                fontWeight: 800,
                color: C.textPrimary,
                letterSpacing: "-0.576px",
                lineHeight: "41.76px",
                margin: 0,
              }}
            >
              Retailers
            </h1>
            <p
              style={{
                fontSize: "15.36px",
                fontWeight: 400,
                color: C.textSecondary,
                lineHeight: "22.272px",
                maxWidth: "620px",
                margin: 0,
              }}
            >
              Core operator master database with smarter search, richer filtering, and full verification visibility that feeds Canoja marketplace listings.
            </p>
          </div>

          {/* Right: search + buttons */}
          <div className="admin-retailer-controls" style={{ display: "flex", alignItems: "flex-start", gap: "16px", flex: 1, minWidth: 0 }}>
            <div className="admin-queue-search-wrap" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {/* Search pill */}
              <div style={{ position: "relative", width: "100%" }}>
                <Search
                  aria-hidden="true"
                  size={16}
                  strokeWidth={2}
                  style={{
                    position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)",
                    color: "#8090a3", pointerEvents: "none",
                  }}
                />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search business, DBA, license #, owner, phone, email"
                  style={{
                    width: "340px",
                    height: "48px",
                    paddingLeft: "44px",
                    paddingRight: "18px",
                    borderRadius: "999px",
                    border: "0.8px solid #dce7e1",
                    background: "#fff",
                    boxShadow: "0px 1px 2px 0px rgba(16,24,40,0.06)",
                    fontSize: "13.333px",
                    color: C.textPrimary,
                    outline: "none",
                    fontFamily: "inherit",
                  }}
                />
              </div>
              {/* Saved Searches */}
              <div style={{ position: "relative" }} ref={savedDropdownRef}>
                <button
                  className="admin-saved-searches-trigger"
                  onClick={() => setShowSavedDropdown(v => !v)}
                  style={{
                    height: "42px", padding: "0 14px",
                    borderRadius: "12px",
                    background: showSavedDropdown ? "#f1f7f4" : "#fff",
                    border: "0.8px solid #dce7e1",
                    color: C.textPrimary,
                    fontSize: "13.333px",
                    fontWeight: 700,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  Saved Searches {savedSearches.length > 0 && `(${savedSearches.length})`}
                </button>
                {showSavedDropdown && (
                  <div className="admin-saved-searches-menu" style={{
                    position: "absolute", top: "48px", right: 0, zIndex: 100,
                    background: "#fff", border: "0.8px solid #dce7e1", borderRadius: "16px",
                    boxShadow: "0px 8px 24px rgba(13,59,42,0.12)", minWidth: "260px", overflow: "hidden",
                  }}>
                    <div style={{ padding: "8px" }}>
                      <button
                        className="admin-save-search-action"
                        onClick={handleSaveSearch}
                        style={{
                          width: "100%", padding: "10px 14px", borderRadius: "10px",
                          background: "linear-gradient(170deg,#1b6b46,#2da96d)", color: "#fff",
                          border: "none", fontSize: "13px", fontWeight: 700, cursor: "pointer", textAlign: "left",
                        }}
                      >
                        + Save current search
                      </button>
                    </div>
                    {savedSearches.length > 0 && (
                      <div style={{ borderTop: "0.8px solid #dce7e1", padding: "8px" }}>
                        {savedSearches.map((s, i) => (
                          <div
                            key={i}
                            onClick={() => handleLoadSearch(s)}
                            style={{
                              display: "flex", alignItems: "center", justifyContent: "space-between",
                              padding: "9px 12px", borderRadius: "10px", cursor: "pointer",
                              gap: "8px",
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = "#f1f7f4"}
                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                          >
                            <div>
                              <p style={{ fontSize: "13px", fontWeight: 600, color: C.textPrimary, margin: 0 }}>{s.name}</p>
                              <p style={{ fontSize: "11px", color: "#617182", margin: 0 }}>{new Date(s.savedAt).toLocaleDateString()}</p>
                            </div>
                            <button
                              onClick={e => handleDeleteSearch(i, e)}
                              style={{ background: "none", border: "none", color: "#d64545", cursor: "pointer", fontSize: "14px", padding: "2px 6px", borderRadius: "6px" }}
                            >✕</button>
                          </div>
                        ))}
                      </div>
                    )}
                    {savedSearches.length === 0 && (
                      <p style={{ fontSize: "13px", color: "#617182", padding: "8px 20px 16px", margin: 0 }}>No saved searches yet.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                className="admin-primary-action"
                onClick={() => setShowAddModal(true)}
                style={{
                  height: "42px", padding: "0 16px",
                  borderRadius: "12px",
                  backgroundImage: "linear-gradient(161deg, #1b6b46 0%, #2da96d 100%)",
                  border: "0.8px solid rgba(0,0,0,0)",
                  color: "#fff",
                  fontSize: "13.333px",
                  fontWeight: 700,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                + Add Retailer
              </button>
            </div>
          </div>
        </div>

        {/* ── Body ──────────────────────────────────────────────────────── */}
        <div className="admin-queue-body" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>

          {/* ── Hero banner — commented out
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "18px" }}>
            <div ...>Operator Intelligence Search</div>
            <div ...>Recommended Actions</div>
          </div> */}

          {/* ── Stat cards ──────────────────────────────────────────────── */}
          <div className="admin-queue-stats-wrap" style={{ position: "sticky", top: 0, zIndex: 10, background: "#f8fafc", paddingBottom: "12px", marginBottom: "-12px" }}>
            <div className="admin-queue-stats" style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "18px" }}>
              {STATS.map(s => <StatCard key={s.label} {...s} />)}
            </div>
          </div>

          {/* ── Content grid: filter panel + right side ──────────────────── */}
          <div className="admin-queue-content" style={{ display: "grid", gridTemplateColumns: "300px minmax(0,1fr)", gap: "18px" }}>

            {/* Filter panel */}
            <div className="admin-queue-filters"
              style={{
                position: "sticky",
                top: "24px",
                alignSelf: "start",
                background: "#fff",
                border: "0.8px solid #dce7e1",
                borderRadius: "24px",
                boxShadow: "0px 1px 2px 0px rgba(16,24,40,0.06)",
                padding: "20px",
              }}
            >
              {/* Header row */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
                <span style={{ fontSize: "16px", fontWeight: 800, color: C.textPrimary }}>Filters</span>
                <button
                  onClick={handleReset}
                  style={{
                    fontSize: "14.08px", fontWeight: 700, color: "#1b6b46",
                    background: "none", border: "none", cursor: "pointer", padding: 0,
                  }}
                >
                  Reset
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {/* State / Region */}
                <div>
                  <label style={{ display: "block", fontSize: "13.76px", fontWeight: 800, color: C.textPrimary, marginBottom: "8px" }}>
                    State / Region
                  </label>
                  <select
                    value={stateDraft}
                    onChange={e => handleStateChange(e.target.value)}
                    style={{
                      width: "100%", height: "42px", padding: "0 12px",
                      borderRadius: "12px", border: "0.8px solid #dce7e1",
                      background: "#fff", fontSize: "14.72px", color: C.textPrimary, outline: "none", cursor: "pointer",
                    }}
                  >
                    <option value="">All launch markets</option>
                    {stateOptions.map(s => (
                      <option key={s._id} value={s._id}>{s._id} ({s.count})</option>
                    ))}
                  </select>
                </div>

                {/* Claim Status */}
                <div>
                  <label style={{ display: "block", fontSize: "13.76px", fontWeight: 800, color: C.textPrimary, marginBottom: "8px" }}>
                    Claim Status
                  </label>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <FilterRow
                      label="All Claimed"
                      count={claimedCount.toLocaleString()}
                      active={vFilter === "verified"}
                      onClick={() => handleVFilter("verified")}
                    />
                    <FilterRow
                      label="Admin Verified"
                      count={adminVerifiedCount.toLocaleString()}
                      active={vFilter === "adminVerified"}
                      onClick={() => handleVFilter("adminVerified")}
                    />
                    <FilterRow
                      label="Auto Verified"
                      count={autoVerifiedCount.toLocaleString()}
                      active={vFilter === "autoVerified"}
                      onClick={() => handleVFilter("autoVerified")}
                    />
                    <FilterRow
                      label="Pending"
                      count={pendingVRCount.toLocaleString()}
                      active={vFilter === "pending"}
                      onClick={() => handleVFilter("pending")}
                    />
                    <FilterRow
                      label="Unclaimed"
                      count={unclaimedCount.toLocaleString()}
                      active={vFilter === "unverified"}
                      onClick={() => handleVFilter("unverified")}
                    />
                  </div>
                </div>

                {/* License Health */}
                <div>
                  <label style={{ display: "block", fontSize: "13.76px", fontWeight: 800, color: C.textPrimary, marginBottom: "8px" }}>
                    License Health
                  </label>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <FilterRow
                      label="Active"
                      count={activeFacetCount.toLocaleString()}
                      active={lFilter === "active"}
                      onClick={() => handleLFilter("active")}
                    />
                    <FilterRow
                      label="Expiring < 30 Days"
                      count={expiringSoonCount.toLocaleString()}
                      active={lFilter === "lt30"}
                      onClick={() => handleLFilter("lt30")}
                    />
                    <FilterRow
                      label="Expired"
                      count={expiredFacetCount.toLocaleString()}
                      active={lFilter === "expired"}
                      onClick={() => handleLFilter("expired")}
                    />
                  </div>
                </div>

                {/* Source filter — not yet implemented
                <div>
                  <label style={{ display: "block", fontSize: "13.76px", fontWeight: 800, color: C.textPrimary, marginBottom: "8px" }}>
                    Source
                  </label>
                  <select
                    value={sourceDraft}
                    onChange={e => handleSourceChange(e.target.value)}
                    style={{
                      width: "100%", height: "42px", padding: "0 12px",
                      borderRadius: "12px", border: "0.8px solid #dce7e1",
                      background: "#fff", fontSize: "14.72px", color: C.textPrimary, outline: "none", cursor: "pointer",
                    }}
                  >
                    <option value="">All Sources</option>
                    <option value="ai_verified">AI Verified</option>
                    <option value="manual">Manual Review</option>
                    <option value="state_db">State Database</option>
                  </select>
                </div> */}

                {/* Data Completeness */}
                <div>
                  <label style={{ display: "block", fontSize: "13.76px", fontWeight: 800, color: C.textPrimary, marginBottom: "8px" }}>
                    Data Completeness
                  </label>
                  <select
                    value={completenessFilter}
                    onChange={e => {
                      setCompletenessFilter(e.target.value);
                      setApiParams(p => {
                        const u = { ...p, page: 1 };
                        if (e.target.value) u.minCompleteness = e.target.value; else delete u.minCompleteness;
                        return u;
                      });
                    }}
                    style={{
                      width: "100%", height: "42px", padding: "0 12px",
                      borderRadius: "12px", border: "0.8px solid #dce7e1",
                      background: "#fff", fontSize: "14.72px", color: C.textPrimary, outline: "none", cursor: "pointer",
                    }}
                  >
                    <option value="">Any Score</option>
                    <option value="90">90%+</option>
                    <option value="75">75% – 89%</option>
                    <option value="1">Below 75%</option>
                  </select>
                </div>

                {/* Apply button */}
                <button
                  className="admin-primary-action"
                  onClick={handleApply}
                  style={{
                    width: "100%", height: "42px", borderRadius: "12px",
                    backgroundImage: "linear-gradient(170.77deg, #1b6b46 0%, #2da96d 100%)",
                    border: "0.8px solid rgba(0,0,0,0)",
                    color: "#fff", fontSize: "13.333px", fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Apply Filters
                </button>
              </div>
            </div>

            {/* Right side: table + split panel */}
            <div className="admin-queue-results" style={{ display: "flex", flexDirection: "column", gap: "18px" }}>

              {/* ── Retailer Master Table ──────────────────────────────── */}
              <div className="admin-queue-table-card"
                style={{
                  background: "#fff",
                  border: "0.8px solid #dce7e1",
                  borderRadius: "24px",
                  boxShadow: "0px 1px 2px 0px rgba(16,24,40,0.06)",
                  overflow: "clip",
                  padding: "0.8px",
                }}
              >
                {/* Table header row */}
                <div className="admin-queue-table-header"
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "20px 20px 20.8px 20px",
                    borderBottom: "0.8px solid #dce7e1",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <p style={{ fontSize: "16.32px", fontWeight: 800, color: C.textPrimary, lineHeight: "23.664px", margin: 0 }}>
                      Retailer Master Table
                    </p>
                    <p style={{ fontSize: "14.4px", fontWeight: 400, color: C.textSecondary, lineHeight: "20.88px", margin: 0 }}>
                      Sorted by risk, verification state, and marketplace readiness.
                    </p>
                  </div>
                  <div className="admin-queue-actions" style={{ display: "flex", gap: "10px", flexShrink: 0 }}>
                    {/* <button style={{ height: "42px", padding: "0 16px", borderRadius: "12px", background: "#fff", border: "0.8px solid #dce7e1", color: C.textPrimary, fontSize: "13.333px", fontWeight: 700, cursor: "pointer" }}>
                      Bulk Assign
                    </button> */}
                    <button
                      className="admin-primary-action"
                      onClick={handleExportCSV}
                      disabled={exporting}
                      style={{ height: "42px", padding: "0 16px", borderRadius: "12px", background: "#fff", border: "0.8px solid #dce7e1", color: C.textPrimary, fontSize: "13.333px", fontWeight: 700, cursor: "pointer", opacity: exporting ? 0.6 : 1 }}
                    >
                      {exporting ? "Exporting…" : "Export CSV"}
                    </button>
                    {/* <button style={{ height: "42px", padding: "0 16px", borderRadius: "12px", backgroundImage: "linear-gradient(165.51deg, #1b6b46 0%, #2da96d 100%)", border: "0.8px solid rgba(0,0,0,0)", color: "#fff", fontSize: "13.333px", fontWeight: 700, cursor: "pointer" }}>
                      Sync to Marketplace
                    </button> */}
                  </div>
                </div>

                {/* Ant Design table with exact Figma tokens */}
                {isError && (
                  <div style={{ padding: "24px", color: "#d64545", fontSize: "14px" }}>
                    Failed to load retailers. Check your connection and try again.
                  </div>
                )}
                <ConfigProvider
                  theme={{
                    components: {
                      Table: {
                        headerBg: "#f1f7f4",
                        headerColor: "#617182",
                        headerSplitColor: "transparent",
                        borderColor: "#dce7e1",
                        rowHoverBg: "#f7fbf9",
                        cellPaddingBlock: 16,
                        cellPaddingInline: 16,
                        fontSize: 16,
                        fontWeightStrong: 700,
                      },
                    },
                  }}
                >
                  <Table
                    dataSource={records}
                    columns={columns}
                    size="middle"
                    loading={isLoading}
                    scroll={{ x: "max-content" }}
                    style={{ fontFamily: "Inter, sans-serif" }}
                    className="retailers-table"
                    locale={{ emptyText: isLoading ? "Loading..." : "No retailers found" }}
                    onRow={(row) => ({
                      onClick: () => setDrawerRecord(rawRecords.find(r => r._id === row.key) || null),
                      style: { cursor: "pointer" },
                    })}
                    pagination={{
                      current: apiParams.page,
                      pageSize: apiParams.limit,
                      total: pagination.total ?? 0,
                      showSizeChanger: false,
                      showTotal: (t) => `${t} retailers`,
                      onChange: (p) => setApiParams(prev => ({ ...prev, page: p })),
                    }}
                  />
                </ConfigProvider>
              </div>

              {/* ── Split panel: Timeline + Audit Logs ────────────────── */}
              {false && <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "18px" }}>

                {/* Verification Timeline */}
                <div
                  style={{
                    background: "#fff",
                    border: "0.8px solid #dce7e1",
                    borderRadius: "24px",
                    boxShadow: "0px 1px 2px 0px rgba(16,24,40,0.06)",
                    padding: "18.8px 20.8px 20.8px 20.8px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "14px",
                  }}
                >
                  <p style={{ fontSize: "15.68px", fontWeight: 800, color: C.textPrimary, lineHeight: "22.736px", margin: 0 }}>
                    Verification Timeline
                  </p>
                  {timelineLogs.length === 0 && (
                    <p style={{ fontSize: "14px", color: C.textSecondary, margin: 0 }}>No verification events yet.</p>
                  )}
                  {timelineLogs.map((log, i) => (
                    <div key={i} style={{ display: "grid", gridTemplateColumns: "12px 1fr", gap: "16px", alignItems: "start" }}>
                      <div style={{ width: "12px", height: "12px", background: "#2da96d", borderRadius: "6px", marginTop: "5px", flexShrink: 0 }} />
                      <div>
                        <p style={{ fontSize: "15px", fontWeight: 700, color: C.textPrimary, lineHeight: "22px", margin: 0 }}>
                          {log.action?.replace(/_/g, " ")}
                          {log.metadata?.businessName ? ` — ${log.metadata.businessName}` : ""}
                        </p>
                        <p style={{ fontSize: "13px", fontWeight: 400, color: C.textSecondary, marginTop: "3px", marginBottom: 0 }}>
                          {log.actor?.name || "Admin"} · {new Date(log.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Recent Audit Logs */}
                <div
                  style={{
                    background: "#fff",
                    border: "0.8px solid #dce7e1",
                    borderRadius: "24px",
                    boxShadow: "0px 1px 2px 0px rgba(16,24,40,0.06)",
                    padding: "18px 20px 20px 20px",
                  }}
                >
                  <p style={{ fontSize: "15.68px", fontWeight: 800, color: C.textPrimary, lineHeight: "22.736px", margin: "0 0 18px 0" }}>
                    Recent Audit Logs
                  </p>
                  {recentAuditLogs.length === 0 && (
                    <p style={{ fontSize: "13px", color: C.textSecondary, margin: 0 }}>No audit activity yet.</p>
                  )}
                  <div>
                    {recentAuditLogs.map((log, i) => (
                      <div
                        key={i}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "110px 70px 1fr",
                          gap: "10px",
                          paddingTop: "10px",
                          paddingBottom: "10px",
                          borderBottom: i < recentAuditLogs.length - 1 ? "0.8px solid #dce7e1" : "none",
                        }}
                      >
                        <span style={{ fontSize: "13px", fontWeight: 400, color: C.textSecondary }}>
                          {new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <span style={{ fontSize: "13px", fontWeight: 400, color: C.textSecondary }}>
                          {log.actor?.name || "Admin"}
                        </span>
                        <span style={{ fontSize: "13px", fontWeight: 400, color: C.textPrimary }}>
                          {log.action?.replace(/_/g, " ")}
                          {log.metadata?.businessName ? ` — ${log.metadata.businessName}` : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>}
            </div>
          </div>
        </div>
      </div>
      <RetailerDrawer record={drawerRecord} onClose={() => setDrawerRecord(null)} />
      {showAddModal && (
        <AddRetailerModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            queryClient.invalidateQueries({ queryKey: ["adminRetailers"] });
          }}
        />
      )}
    </AdminShell>
  );
}
