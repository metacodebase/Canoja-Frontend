import React, { useState, useEffect } from "react";
import { Table, ConfigProvider, Drawer } from "antd";
import AdminShell from "./AdminShell";
import {
  useAdminCanojaVerified,
  useRevokeVerifiedBadge,
  useRenewVerifiedBadge,
  useIssueVerification,
  useAdminAuditLog,
  useRecentAuditLog,
} from "../../services/admin";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import api from "../../services/api";
import { toast } from "react-toastify";
import { Search } from "lucide-react";
import retailersTotalIcon from "../../assets/admin-retailers-total.png";
import retailersVerifiedIcon from "../../assets/admin-retailers-verified.png";
import retailersExpiringIcon from "../../assets/admin-retailers-expiring.png";
import retailersGapsIcon from "../../assets/admin-retailers-gaps.png";

const C = {
  border: "#dce7e1",
  textPrimary: "#18212b",
  textSecondary: "#617182",
  greenDark: "#1b6b46",
  green: "#2da96d",
  gold: "#d4a72c",
};

const FMT = { month: "short", day: "numeric", year: "numeric" };

// ── Badges ────────────────────────────────────────────────────────────────────
function BadgeStatus({ status }) {
  const map = {
    Active: { bg: "#edf9f2", color: "#1f9d61" },
    "Expiring Soon": { bg: "#fff5eb", color: "#d9822b" },
    Revoked: { bg: "#fff1f1", color: "#d64545" },
  };
  const s = map[status] || { bg: "#f4f7fa", color: "#617182" };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", height: "28px", padding: "0 10px", borderRadius: "999px", background: s.bg, color: s.color, fontSize: "12.48px", fontWeight: 800, whiteSpace: "nowrap" }}>
      {status}
    </span>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function getBadgeStatus(record) {
  if (!record.canojaVerified) return "Revoked";
  const now = Date.now();
  const d30 = now + 30 * 86400000;
  if (!record.expiration_date) return "Active";
  const exp = new Date(record.expiration_date).getTime();
  if (exp < now) return "Revoked";
  if (exp < d30) return "Expiring Soon";
  return "Active";
}

function mapVerified(r) {
  return {
    key: r._id,
    name: r.business_name || "—",
    sub: r.dba || r.city || "—",
    license: r.license_number || "—",
    market: r.stateName || "—",
    verifiedDate: r.lastVerifiedDate
      ? new Date(r.lastVerifiedDate).toLocaleDateString("en-US", FMT)
      : r.updatedAt ? new Date(r.updatedAt).toLocaleDateString("en-US", FMT) : "—",
    expires: r.expiration_date
      ? new Date(r.expiration_date).toLocaleDateString("en-US", FMT) : "—",
    badgeStatus: getBadgeStatus(r),
    sourceType: r.sourceType || "—",
  };
}

// ── Revoke confirm modal ──────────────────────────────────────────────────────
function RevokeModal({ record, onClose, onConfirm, loading }) {
  if (!record) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", borderRadius: "20px", padding: "28px", width: "420px", boxShadow: "0px 24px 48px rgba(0,0,0,0.16)" }}>
        <h3 style={{ fontSize: "18px", fontWeight: 800, color: C.textPrimary, margin: "0 0 6px" }}>Revoke Verified Badge</h3>
        <p style={{ fontSize: "14px", color: C.textSecondary, margin: "0 0 20px" }}>
          This will remove the Canoja Verified badge from <strong>{record.business_name || "this operator"}</strong>. This action is logged and can be reviewed in the audit trail.
        </p>
        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ height: "40px", padding: "0 20px", borderRadius: "10px", background: "#fff", border: "0.8px solid #dce7e1", color: C.textPrimary, fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>Cancel</button>
          <button onClick={() => onConfirm(record._id)} disabled={loading} style={{ height: "40px", padding: "0 20px", borderRadius: "10px", background: "#d64545", border: "none", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer", opacity: loading ? 0.6 : 1 }}>
            {loading ? "Revoking…" : "Confirm Revoke"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Renew confirm modal ───────────────────────────────────────────────────────
function RenewModal({ record, onClose, onConfirm, loading }) {
  const [expDate, setExpDate] = useState("");
  if (!record) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", borderRadius: "20px", padding: "28px", width: "420px", boxShadow: "0px 24px 48px rgba(0,0,0,0.16)" }}>
        <h3 style={{ fontSize: "18px", fontWeight: 800, color: C.textPrimary, margin: "0 0 6px" }}>Renew Verified Badge</h3>
        <p style={{ fontSize: "14px", color: C.textSecondary, margin: "0 0 20px" }}>
          Re-verify <strong>{record.business_name}</strong> and restore their Canoja Verified badge.
        </p>
        <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#617182", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "6px" }}>
          New Expiration Date (optional)
        </label>
        <input
          type="date"
          value={expDate}
          onChange={e => setExpDate(e.target.value)}
          style={{ width: "100%", height: "40px", padding: "0 12px", borderRadius: "10px", border: "0.8px solid #dce7e1", fontSize: "14px", fontFamily: "inherit", outline: "none", boxSizing: "border-box", color: "#18212b", background: "#fff" }}
        />
        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "20px" }}>
          <button onClick={onClose} style={{ height: "40px", padding: "0 20px", borderRadius: "10px", background: "#fff", border: "0.8px solid #dce7e1", color: C.textPrimary, fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>Cancel</button>
          <button
            onClick={() => onConfirm(record._id, expDate || null)}
            disabled={loading}
            style={{ height: "40px", padding: "0 20px", borderRadius: "10px", backgroundImage: "linear-gradient(161deg,#1b6b46 0%,#2da96d 100%)", border: "none", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer", opacity: loading ? 0.6 : 1 }}
          >
            {loading ? "Renewing…" : "Confirm Renewal"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Detail drawer ─────────────────────────────────────────────────────────────
function DetailRow({ label, value }) {
  return (
    <div className="admin-detail-row" style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
      <span style={{ fontSize: "12px", fontWeight: 700, color: "#617182", textTransform: "uppercase", letterSpacing: "0.8px" }}>{label}</span>
      <span style={{ fontSize: "14px", color: "#18212b" }}>{value || "—"}</span>
    </div>
  );
}

function VerifiedDrawer({ record, rawRecord, onClose, onRevoke, onRenew, revoking, renewing }) {
  const { data: auditData } = useAdminAuditLog(
    rawRecord ? { targetType: "LicenseRecord", targetId: rawRecord._id, limit: 20 } : {}
  );
  const auditLogs = auditData?.data || [];
  const lifecycle = rawRecord?.verificationLifecycle || [];

  if (!record || !rawRecord) return null;

  return (
    <Drawer rootClassName="admin-detail-drawer" open={!!record} onClose={onClose} width={520} title={null} closeIcon={null} styles={{ body: { padding: 0 }, header: { display: "none" } }}>
      <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily: "Inter, sans-serif" }}>

        {/* Header */}
        <div className="admin-detail-drawer__header" style={{ padding: "24px", borderBottom: "0.8px solid #dce7e1", background: "linear-gradient(155deg,rgba(45,169,109,0.08) 0%,#fff 100%)" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
            <div>
              <p style={{ fontSize: "18px", fontWeight: 800, color: C.textPrimary, margin: 0 }}>{rawRecord.business_name || "—"}</p>
              <p style={{ fontSize: "13px", color: C.textSecondary, margin: "2px 0 0" }}>
                {rawRecord.license_number || "No license #"} · {rawRecord.stateName || "—"}
              </p>
            </div>
            <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
              <BadgeStatus status={record.badgeStatus} />
              <button onClick={onClose} style={{ background: "none", border: "0.8px solid #dce7e1", borderRadius: "8px", width: "32px", height: "32px", cursor: "pointer", fontSize: "16px", color: "#617182" }}>✕</button>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
            {record.badgeStatus !== "Revoked" && (
              <button
                onClick={() => onRevoke(rawRecord)}
                disabled={revoking}
                style={{ flex: 1, height: "40px", borderRadius: "10px", background: "#fff1f1", border: "0.8px solid #d64545", color: "#d64545", fontSize: "13px", fontWeight: 700, cursor: "pointer", opacity: revoking ? 0.6 : 1 }}
              >
                Revoke Badge
              </button>
            )}
            {record.badgeStatus === "Revoked" && (
              <button
                onClick={() => onRenew(rawRecord)}
                disabled={renewing}
                style={{ flex: 1, height: "40px", borderRadius: "10px", backgroundImage: "linear-gradient(161deg,#1b6b46 0%,#2da96d 100%)", border: "none", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer", opacity: renewing ? 0.6 : 1 }}
              >
                Renew Badge
              </button>
            )}
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>

          {/* License */}
          <div>
            <p style={{ fontSize: "13px", fontWeight: 800, color: C.textPrimary, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>License</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <DetailRow label="License #" value={rawRecord.license_number} />
              <DetailRow label="Type" value={rawRecord.license_type} />
              <DetailRow label="Status" value={rawRecord.license_status} />
              <DetailRow label="Expires" value={rawRecord.expiration_date ? new Date(rawRecord.expiration_date).toLocaleDateString("en-US", FMT) : null} />
              <DetailRow label="Source" value={rawRecord.sourceType} />
              <DetailRow label="Risk Flag" value={rawRecord.riskFlag} />
            </div>
          </div>

          {/* Location */}
          <div>
            <p style={{ fontSize: "13px", fontWeight: 800, color: C.textPrimary, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>Location</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <DetailRow label="City" value={rawRecord.city} />
              <DetailRow label="State" value={rawRecord.stateName} />
              <DetailRow label="Address" value={rawRecord.address} />
              <DetailRow label="Zip" value={rawRecord.zip} />
            </div>
          </div>

          {/* Contact */}
          <div>
            <p style={{ fontSize: "13px", fontWeight: 800, color: C.textPrimary, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>Contact</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <DetailRow label="Phone" value={rawRecord.contact_information?.phone} />
              <DetailRow label="Email" value={rawRecord.contact_information?.email} />
            </div>
          </div>

          {/* Badge lifecycle */}
          {false && lifecycle.length > 0 && (
            <div>
              <p style={{ fontSize: "13px", fontWeight: 800, color: C.textPrimary, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>Badge Lifecycle</p>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {lifecycle.map((step, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "12px 1fr", gap: "14px", paddingBottom: "14px" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: C.green, flexShrink: 0 }} />
                      {i < lifecycle.length - 1 && <div style={{ width: "2px", flex: 1, background: "#dce7e1", marginTop: "4px" }} />}
                    </div>
                    <div style={{ paddingBottom: "4px" }}>
                      <p style={{ fontSize: "14px", fontWeight: 600, color: C.textPrimary, margin: 0, textTransform: "capitalize" }}>{step.status}</p>
                      <p style={{ fontSize: "12px", color: C.textSecondary, margin: "2px 0 0" }}>
                        {step.at ? new Date(step.at).toLocaleString() : "—"}
                        {step.by ? ` · ${step.by}` : ""}
                      </p>
                      {step.note && <p style={{ fontSize: "12px", color: C.textSecondary, margin: "2px 0 0", fontStyle: "italic" }}>{step.note}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Audit trail */}
          {false && auditLogs.length > 0 && (
            <div>
              <p style={{ fontSize: "13px", fontWeight: 800, color: C.textPrimary, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>Audit Trail</p>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {auditLogs.map((log, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "12px 1fr", gap: "14px", paddingBottom: "14px" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <div style={{ width: "12px", height: "12px", borderRadius: "3px", background: "#617182", flexShrink: 0 }} />
                      {i < auditLogs.length - 1 && <div style={{ width: "2px", flex: 1, background: "#dce7e1", marginTop: "4px" }} />}
                    </div>
                    <div style={{ paddingBottom: "4px" }}>
                      <p style={{ fontSize: "14px", fontWeight: 600, color: C.textPrimary, margin: 0 }}>{log.action?.replace(/_/g, " ")}</p>
                      <p style={{ fontSize: "12px", color: C.textSecondary, margin: "2px 0 0" }}>
                        {log.actor?.name || "Admin"} · {new Date(log.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Drawer>
  );
}

// ── Issue Verification Modal ──────────────────────────────────────────────────
function IssueVerificationModal({ onClose, onSuccess }) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [expDate, setExpDate] = useState("");
  const { mutateAsync: issue, isPending } = useIssueVerification();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const canSearch = debouncedSearch.trim().length > 1;
  const { data: searchData } = useQuery({
    queryKey: ["issueVerificationSearch", debouncedSearch],
    queryFn: async () => {
      const response = await api.get("/admin/retailers", { params: { q: debouncedSearch, limit: 8 } });
      return response.data;
    },
    enabled: canSearch,
  });
  const results = canSearch ? (searchData?.data || []) : [];

  const handleSubmit = async () => {
    if (!selected) return;
    try {
      await issue({ id: selected._id, expiration_date: expDate || null });
      onSuccess();
    } catch (e) {
      toast.error(e.message || "Failed to issue verification");
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1100, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ background: "#fff", borderRadius: "24px", width: "100%", maxWidth: "520px", boxShadow: "0px 32px 64px rgba(0,0,0,0.18)", display: "flex", flexDirection: "column" }}>

        {/* Header */}
        <div style={{ padding: "24px 28px", borderBottom: "0.8px solid #dce7e1", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h3 style={{ fontSize: "20px", fontWeight: 800, color: "#18212b", margin: 0 }}>Issue Verification</h3>
            <p style={{ fontSize: "13px", color: "#617182", margin: "4px 0 0" }}>Grant Canoja Verified badge to an operator.</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "0.8px solid #dce7e1", borderRadius: "8px", width: "32px", height: "32px", cursor: "pointer", fontSize: "16px", color: "#617182" }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Search */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "12px", fontWeight: 700, color: "#617182", textTransform: "uppercase", letterSpacing: "0.6px" }}>Search Business</label>
            <input
              autoFocus
              value={search}
              onChange={e => { setSearch(e.target.value); setSelected(null); }}
              placeholder="Type business name or license #…"
              style={{ height: "40px", padding: "0 12px", borderRadius: "10px", border: "0.8px solid #dce7e1", fontSize: "13px", fontFamily: "inherit", outline: "none", color: "#18212b", background: "#fff" }}
            />
          </div>

          {/* Results */}
          {!selected && results.length > 0 && (
            <div style={{ border: "0.8px solid #dce7e1", borderRadius: "12px", overflow: "auto", maxHeight: "200px" }}>
              {results.map((r, i) => (
                <div
                  key={r._id}
                  onClick={() => { setSelected(r); setSearch(r.business_name); }}
                  style={{ padding: "12px 16px", borderBottom: i < results.length - 1 ? "0.8px solid #f1f7f4" : "none", cursor: "pointer", background: "#fff" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f7fbf9"}
                  onMouseLeave={e => e.currentTarget.style.background = "#fff"}
                >
                  <p style={{ fontSize: "14px", fontWeight: 700, color: "#18212b", margin: 0 }}>{r.business_name}</p>
                  <p style={{ fontSize: "12px", color: "#617182", margin: "2px 0 0" }}>{r.license_number || "No license #"} · {r.stateName || "—"}</p>
                </div>
              ))}
            </div>
          )}

          {/* Selected */}
          {selected && (
            <div style={{ padding: "12px 16px", borderRadius: "12px", background: "#edf9f2", border: "0.8px solid #2da96d" }}>
              <p style={{ fontSize: "14px", fontWeight: 700, color: "#18212b", margin: 0 }}>{selected.business_name}</p>
              <p style={{ fontSize: "12px", color: "#617182", margin: "2px 0 0" }}>{selected.license_number || "No license #"} · {selected.stateName || "—"}</p>
            </div>
          )}

          {/* Expiration date */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "12px", fontWeight: 700, color: "#617182", textTransform: "uppercase", letterSpacing: "0.6px" }}>Expiration Date <span style={{ fontWeight: 400 }}>(optional)</span></label>
            <input
              type="date"
              value={expDate}
              onChange={e => setExpDate(e.target.value)}
              style={{ height: "40px", padding: "0 12px", borderRadius: "10px", border: "0.8px solid #dce7e1", fontSize: "13px", fontFamily: "inherit", outline: "none", color: "#18212b", background: "#fff" }}
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "20px 28px", borderTop: "0.8px solid #dce7e1", display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ height: "42px", padding: "0 20px", borderRadius: "12px", background: "#fff", border: "0.8px solid #dce7e1", color: "#18212b", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>Cancel</button>
          <button onClick={handleSubmit} disabled={!selected || isPending} style={{ height: "42px", padding: "0 20px", borderRadius: "12px", backgroundImage: "linear-gradient(161deg,#1b6b46 0%,#2da96d 100%)", border: "none", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: selected ? "pointer" : "default", opacity: (!selected || isPending) ? 0.5 : 1 }}>
            {isPending ? "Issuing…" : "Issue Badge"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────
function StatCard({ label, value, delta, deltaBg, deltaColor, icon }) {
  return (
    <div className="admin-queue-stat" style={{
      backgroundImage: "linear-gradient(155deg, #1b6b46 0%, #2eb870 100%)",
      border: "0.8px solid #dce7e1", borderRadius: "24px", boxShadow: "0px 1px 2px 0px rgba(16,24,40,0.06)", padding: "20px", position: "relative", overflow: "clip"
    }}>
      <div className="admin-queue-stat__content">
        <p className="admin-queue-stat__label" style={{ color: "white" }}>{label}</p>
        <p className="admin-queue-stat__value" style={{ color: 'white' }}>{value}</p>
        <span className="admin-queue-stat__badge" style={{ background: deltaBg, color: deltaColor }}>{delta}</span>
      </div>
    </div>
  );
}

function Chip({ children }) {
  return <span style={{ display: "inline-flex", alignItems: "center", padding: "8px 12px", borderRadius: "999px", background: "#ebfbf2", color: "#145237", fontSize: "13.12px", fontWeight: 800, whiteSpace: "nowrap" }}>{children}</span>;
}

function LayerBadge({ children, muted }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", height: "36.15px", padding: "0 12px", borderRadius: "999px", background: muted ? "#f4f7fa" : "rgba(255,255,255,0.85)", border: "0.8px solid #dce7e1", color: muted ? "#617182" : C.textPrimary, fontSize: "12.8px", fontWeight: 800, whiteSpace: "nowrap" }}>
      {children}
    </span>
  );
}

function FilterRow({ label, count, active, onClick }) {
  return (
    <button className={`admin-filter-row${active ? " admin-filter-row--active" : ""}`} onClick={onClick} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "10.8px 12.8px", borderRadius: "12px", border: active ? "0.8px solid #2da96d" : "0.8px solid #dce7e1", background: active ? "#edf9f2" : "#fcfefd", cursor: "pointer" }}>
      <span style={{ fontSize: "14.72px", fontWeight: 400, color: active ? "#1f9d61" : C.textPrimary }}>{label}</span>
      <span style={{ fontSize: "13.12px", fontWeight: 700, color: C.textSecondary }}>{count}</span>
    </button>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminCanojaVerified() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [apiParams, setApiParams] = useState({ limit: 50, page: 1 });
  const [statusFilter, setStatusFilter] = useState("");
  const [regionDraft, setRegionDraft] = useState("");
  const [sourceDraft, setSourceDraft] = useState("");

  const [renewalStatusFilter, setRenewalStatusFilter] = useState("");
  const [showIssue, setShowIssue] = useState(false);
  const [drawerRecord, setDrawerRecord] = useState(null);
  const [drawerRaw, setDrawerRaw] = useState(null);
  const [revokeTarget, setRevokeTarget] = useState(null);
  const [renewTarget, setRenewTarget] = useState(null);
  const [revokingId, setRevokingId] = useState(null);
  const [renewingId, setRenewingId] = useState(null);

  const { mutateAsync: revokeApi } = useRevokeVerifiedBadge();
  const { mutateAsync: renewApi } = useRenewVerifiedBadge();
  const { data: recentAuditData } = useRecentAuditLog({ actions: "revoke_verified_badge,renew_verified_badge", limit: 20 });

  // Debounce search
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

  const { data: apiData, isLoading, isError } = useAdminCanojaVerified(apiParams);

  const rawRecords = apiData?.data || [];
  const records = rawRecords.map(mapVerified);
  const pagination = apiData?.pagination || {};
  const apiStats = apiData?.stats || {};
  const stateOptions = apiData?.facets?.states || [];

  const STATS = [
    { label: "Active Verified", value: (apiStats.active ?? "—").toString(), delta: "Currently verified", deltaBg: "#edf9f2", deltaColor: "#1f9d61", icon: retailersVerifiedIcon },
    { label: "Expiring Soon", value: (apiStats.expiringSoon ?? "—").toString(), delta: "Renew within 14 days", deltaBg: "#fff5eb", deltaColor: "#d9822b", icon: retailersExpiringIcon },
    { label: "Revoked", value: (apiStats.revoked ?? "—").toString(), delta: "Compliance mismatch", deltaBg: "#fff1f1", deltaColor: "#d64545", icon: retailersGapsIcon },
    { label: "Badge Views", value: (apiStats.totalBadgeViews ?? "—").toLocaleString(), delta: "Total shop views", deltaBg: "#edf5ff", deltaColor: "#2f80ed", icon: retailersTotalIcon },
  ];

  const handleStatusFilter = (val) => {
    const next = statusFilter === val ? "" : val;
    setStatusFilter(next);
    setApiParams(p => {
      const u = { ...p, page: 1 };
      if (next) u.status = next; else delete u.status;
      return u;
    });
  };

  const handleApply = () => {
    setApiParams(p => {
      const u = { ...p, page: 1 };
      if (regionDraft) u.region = regionDraft; else delete u.region;
      if (sourceDraft) u.source = sourceDraft; else delete u.source;
      return u;
    });
  };

  const handleRegionChange = (val) => {
    setRegionDraft(val);
    setApiParams(p => {
      const u = { ...p, page: 1 };
      if (val) u.region = val; else delete u.region;
      return u;
    });
  };

  const handleSourceChange = (val) => {
    setSourceDraft(val);
    setApiParams(p => {
      const u = { ...p, page: 1 };
      if (val) u.source = val; else delete u.source;
      return u;
    });
  };

  const handleReset = () => {
    setSearch(""); setStatusFilter(""); setRegionDraft(""); setSourceDraft("");
    setRenewalStatusFilter("");
    setApiParams({ limit: 50, page: 1 });
  };

  const handleRenewalStatusFilter = (val) => {
    const next = renewalStatusFilter === val ? "" : val;
    setRenewalStatusFilter(next);
    setApiParams(p => {
      const u = { ...p, page: 1 };
      if (next) u.renewalStatus = next; else delete u.renewalStatus;
      return u;
    });
  };

  const handleRenew = async (id, expiration_date) => {
    setRenewingId(id);
    try {
      await renewApi({ id, expiration_date });
      toast.success("Badge renewed successfully");
      queryClient.invalidateQueries({ queryKey: ["adminCanojaVerified"] });
      setRenewTarget(null);
      setDrawerRecord(null);
      setDrawerRaw(null);
    } catch (e) {
      toast.error(e.message || "Failed to renew badge");
    } finally {
      setRenewingId(null);
    }
  };

  const handleRevoke = async (id) => {
    setRevokingId(id);
    try {
      await revokeApi(id);
      toast.success("Badge revoked");
      queryClient.invalidateQueries({ queryKey: ["adminCanojaVerified"] });
      setRevokeTarget(null);
      setDrawerRecord(null);
      setDrawerRaw(null);
    } catch (e) {
      toast.error(e.message || "Failed to revoke badge");
    } finally {
      setRevokingId(null);
    }
  };

  const handleExport = async () => {
    try {
      const response = await api.get("/admin/canoja-verified", { params: { ...apiParams, limit: 10000, page: 1 } });
      const allRecords = (response.data?.data || []).map(mapVerified);
      const rows = [
        ["Business", "License #", "Market", "Expires", "Badge Status", "Source"],
        ...allRecords.map(r => [r.name, r.license, r.market, r.expires, r.badgeStatus, r.sourceType]),
      ];
      const csv = rows.map(r => r.map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
      const BOM = "\uFEFF";
      const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `canoja-verified-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click(); URL.revokeObjectURL(url);
    } catch (e) {
      toast.error("Export failed");
    }
  };

  const openDrawer = (row) => {
    const raw = rawRecords.find(r => r._id === row.key);
    setDrawerRecord(row);
    setDrawerRaw(raw || null);
  };

  const columns = [
    {
      title: "Business",
      dataIndex: "name",
      key: "name",
      render: (_, row) => (
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <span style={{ fontWeight: 700, fontSize: "15.36px", color: C.textPrimary }}>{row.name}</span>
          <span style={{ fontSize: "13px", color: C.textSecondary }}>{row.sub}</span>
        </div>
      ),
    },
    {
      title: "License",
      dataIndex: "license",
      key: "license",
      render: v => <span style={{ fontSize: "14px", color: C.textPrimary }}>{v}</span>,
    },
    {
      title: "Market",
      dataIndex: "market",
      key: "market",
      render: v => <span style={{ fontSize: "14px", color: C.textPrimary }}>{v}</span>,
    },
    {
      title: "Expires",
      dataIndex: "expires",
      key: "expires",
      render: v => <span style={{ fontSize: "14px", color: C.textSecondary }}>{v}</span>,
    },
    {
      title: "Badge Status",
      dataIndex: "badgeStatus",
      key: "badgeStatus",
      render: v => <BadgeStatus status={v} />,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, row) => (
        <div style={{ display: "flex", gap: "8px" }} onClick={e => e.stopPropagation()}>
          <button
            onClick={() => openDrawer(row)}
            style={{ height: "34px", padding: "0 14px", borderRadius: "10px", background: "#fff", border: "0.8px solid #dce7e1", color: C.textPrimary, fontSize: "12.5px", fontWeight: 700, cursor: "pointer" }}
          >
            View
          </button>
          {row.badgeStatus !== "Revoked" && (
            <button
              onClick={() => setRevokeTarget(rawRecords.find(r => r._id === row.key))}
              style={{ height: "34px", padding: "0 14px", borderRadius: "10px", background: "#fff1f1", border: "0.8px solid #d64545", color: "#d64545", fontSize: "12.5px", fontWeight: 700, cursor: "pointer" }}
            >
              Revoke
            </button>
          )}
          {row.badgeStatus === "Revoked" && (
            <button
              onClick={() => setRenewTarget(rawRecords.find(r => r._id === row.key))}
              style={{ height: "34px", padding: "0 14px", borderRadius: "10px", backgroundImage: "linear-gradient(161deg,#1b6b46 0%,#2da96d 100%)", border: "none", color: "#fff", fontSize: "12.5px", fontWeight: 700, cursor: "pointer" }}
            >
              Renew
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <AdminShell>
      <div className="admin-queue-page" style={{ background: "linear-gradient(180deg,rgba(255,255,255,0.72) 0%,rgba(255,255,255,0.96) 100%)", border: "0.8px solid rgba(194,210,202,0.5)", borderRadius: "28px", boxShadow: "0px 8px 24px 0px rgba(13,59,42,0.08)", overflow: "clip" }}>

        {/* Sticky header */}
        <div className="admin-queue-header" style={{ position: "sticky", top: 0, zIndex: 10, background: "rgba(255,255,255,0.76)", borderBottom: "0.8px solid #dce7e1", padding: "24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "24px", backdropFilter: "blur(8px)" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <h1 style={{ fontSize: "28.8px", fontWeight: 800, color: C.textPrimary, letterSpacing: "-0.576px", margin: 0 }}>Canoja Verified</h1>
            <p style={{ fontSize: "15.36px", color: C.textSecondary, maxWidth: "620px", margin: 0 }}>
              Trust layer for active verified businesses — badge lifecycle, renewal status, and compliance signals.
            </p>
          </div>
          <div className="admin-queue-search-wrap" style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
            <div style={{ position: "relative", width: "100%" }}>
              <Search aria-hidden="true" size={16} strokeWidth={2} style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#8090a3", pointerEvents: "none" }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search business, license #, market…"
                style={{ width: "320px", height: "48px", paddingLeft: "44px", paddingRight: "18px", borderRadius: "999px", border: "0.8px solid #dce7e1", background: "#fff", fontSize: "13.333px", color: C.textPrimary, outline: "none", fontFamily: "inherit" }}
              />
            </div>
            <button
              className="admin-primary-action"
              onClick={() => setShowIssue(true)}
              style={{ height: "42px", padding: "0 20px", borderRadius: "12px", backgroundImage: "linear-gradient(161deg,#1b6b46 0%,#2da96d 100%)", border: "none", color: "#fff", fontSize: "13.333px", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
            >
              Issue Verification
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="admin-queue-body" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>

          {/* Hero — Layer 1 & Layer 2 cards commented out */}
          {/* <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "18px" }}>
            <div style={{ borderRadius: "24px", border: "0.8px solid #dce7e1", backgroundImage: "linear-gradient(155.79deg,rgba(45,169,109,0.07) 0%,rgba(255,255,255,0.96) 100%)", padding: "24px" }}>
              <LayerBadge>Layer 1 · Verification Lifecycle</LayerBadge>
              <h3 style={{ fontSize: "20.8px", fontWeight: 800, color: C.textPrimary, marginTop: "24px", marginBottom: 0 }}>Canoja Trust Engine</h3>
              <p style={{ fontSize: "16px", color: C.textSecondary, marginTop: "14px", maxWidth: "604px" }}>
                Track badge issuance, renewal, revocation, and marketplace exposure so "Canoja Verified" remains a true trust signal for consumers and operators.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "24px" }}>
                {["Badge Lifecycle", "Renewal Alerts", "Revocation Monitoring", "Marketplace Data"].map(c => <Chip key={c}>{c}</Chip>)}
              </div>
            </div>
            <div style={{ borderRadius: "24px", border: "0.8px solid #dce7e1", background: "#fff", padding: "24px" }}>
              <LayerBadge muted>Layer 2 · Badge Impact</LayerBadge>
              <h3 style={{ fontSize: "20.8px", fontWeight: 800, color: C.textPrimary, marginTop: "24px", marginBottom: 0 }}>Verification Metrics</h3>
              <p style={{ fontSize: "16px", color: C.textSecondary, marginTop: "14px" }}>
                Active operators, expiring badges, and engagement signals all in one place.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "24px" }}>
                <Chip>{(apiStats.totalBadgeViews ?? "—").toLocaleString()} Badge Views</Chip>
                <Chip>{apiStats.expiringSoon ?? "—"} Expiring Soon</Chip>
              </div>
            </div>
          </div> */}

          {/* Stat cards */}
          <div className="admin-queue-stats-wrap" style={{ position: "sticky", top: 0, zIndex: 10, background: "#f8fafc", paddingBottom: "12px", marginBottom: "-12px" }}>
            <div className="admin-queue-stats" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "18px" }}>
              {STATS.map(s => <StatCard key={s.label} {...s} />)}
            </div>
          </div>

          {/* Content grid */}
          <div className="admin-queue-content" style={{ display: "grid", gridTemplateColumns: "300px minmax(0,1fr)", gap: "18px" }}>

            {/* Filter panel */}
            <div className="admin-queue-filters" style={{ position: "sticky", top: "24px", alignSelf: "start", background: "#fff", border: "0.8px solid #dce7e1", borderRadius: "24px", boxShadow: "0px 1px 2px 0px rgba(16,24,40,0.06)", padding: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
                <span style={{ fontSize: "16px", fontWeight: 800, color: C.textPrimary }}>Badge Filters</span>
                <button onClick={handleReset} style={{ fontSize: "14.08px", fontWeight: 700, color: "#1b6b46", background: "none", border: "none", cursor: "pointer", padding: 0 }}>Reset</button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

                {/* Status */}
                <div>
                  <label style={{ display: "block", fontSize: "13.76px", fontWeight: 800, color: C.textPrimary, marginBottom: "8px" }}>Status</label>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <FilterRow label="Active" count={apiStats.active ?? "—"} active={statusFilter === "active"} onClick={() => handleStatusFilter("active")} />
                    <FilterRow label="Expiring Soon" count={apiStats.expiringSoon ?? "—"} active={statusFilter === "expiringSoon"} onClick={() => handleStatusFilter("expiringSoon")} />
                    <FilterRow label="Revoked" count={apiStats.revoked ?? "—"} active={statusFilter === "revoked"} onClick={() => handleStatusFilter("revoked")} />
                  </div>
                </div>

                {/* Market / Region */}
                <div>
                  <label style={{ display: "block", fontSize: "13.76px", fontWeight: 800, color: C.textPrimary, marginBottom: "8px" }}>Market</label>
                  <select
                    value={regionDraft}
                    onChange={e => handleRegionChange(e.target.value)}
                    style={{ width: "100%", height: "42px", padding: "0 12px", borderRadius: "12px", border: "0.8px solid #dce7e1", background: "#fff", fontSize: "14.72px", color: C.textPrimary, outline: "none", cursor: "pointer", boxSizing: "border-box" }}
                  >
                    <option value="">All Markets</option>
                    {stateOptions.map(s => <option key={s._id} value={s._id}>{s._id} ({s.count})</option>)}
                  </select>
                </div>

                {/* Source — commented out */}
                {/* <div>
                  <label style={{ display: "block", fontSize: "13.76px", fontWeight: 800, color: C.textPrimary, marginBottom: "8px" }}>Verification Source</label>
                  <select
                    value={sourceDraft}
                    onChange={e => handleSourceChange(e.target.value)}
                    style={{ width: "100%", height: "42px", padding: "0 12px", borderRadius: "12px", border: "0.8px solid #dce7e1", background: "#fff", fontSize: "14.72px", color: C.textPrimary, outline: "none", cursor: "pointer" }}
                  >
                    <option value="">All Sources</option>
                    <option value="state_db">State Database</option>
                    <option value="manual">Manual</option>
                    <option value="ai_verified">AI Verified</option>
                  </select>
                </div> */}

                {/* Renewal Status */}
                <div>
                  <label style={{ display: "block", fontSize: "13.76px", fontWeight: 800, color: C.textPrimary, marginBottom: "8px" }}>Renewal Status</label>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <FilterRow label="Due (< 30 days)" count={apiStats.renewalDue ?? "—"} active={renewalStatusFilter === "due"} onClick={() => handleRenewalStatusFilter("due")} />
                    <FilterRow label="Upcoming (30–60 days)" count={apiStats.renewalUpcoming ?? "—"} active={renewalStatusFilter === "upcoming"} onClick={() => handleRenewalStatusFilter("upcoming")} />
                    <FilterRow label="Overdue (expired)" count={apiStats.renewalOverdue ?? "—"} active={renewalStatusFilter === "overdue"} onClick={() => handleRenewalStatusFilter("overdue")} />
                  </div>
                </div>

                <button
                  className="admin-primary-action"
                  onClick={handleApply}
                  style={{ width: "100%", height: "42px", borderRadius: "12px", backgroundImage: "linear-gradient(170.77deg,#1b6b46 0%,#2da96d 100%)", border: "none", color: "#fff", fontSize: "13.333px", fontWeight: 700, cursor: "pointer" }}
                >
                  Apply Filters
                </button>
              </div>
            </div>

            {/* Right: table */}
            <div className="admin-queue-results" style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              <div className="admin-queue-table-card" style={{ background: "#fff", border: "0.8px solid #dce7e1", borderRadius: "24px", boxShadow: "0px 1px 2px 0px rgba(16,24,40,0.06)", overflow: "clip", padding: "0.8px" }}>
                <div className="admin-queue-table-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px", borderBottom: "0.8px solid #dce7e1" }}>
                  <div>
                    <p style={{ fontSize: "16.32px", fontWeight: 800, color: C.textPrimary, margin: 0 }}>Verified Businesses</p>
                    <p style={{ fontSize: "14.4px", color: C.textSecondary, margin: "4px 0 0" }}>Businesses with active Canoja verification. Click any row for full details.</p>
                  </div>
                  <div className="admin-queue-actions" style={{ display: "flex", gap: "10px" }}>
                    <button className="admin-primary-action" onClick={handleExport} style={{ height: "42px", padding: "0 16px", borderRadius: "12px", background: "#fff", border: "0.8px solid #dce7e1", color: C.textPrimary, fontSize: "13.333px", fontWeight: 700, cursor: "pointer" }}>Export Badge Log</button>
                  </div>
                </div>

                {isError && <div style={{ padding: "24px", color: "#d64545" }}>Failed to load verified operators.</div>}

                <ConfigProvider theme={{ components: { Table: { headerBg: "#f1f7f4", headerColor: "#617182", headerSplitColor: "transparent", borderColor: "#dce7e1", rowHoverBg: "#f7fbf9", cellPaddingBlock: 16, cellPaddingInline: 16 } } }}>
                  <Table
                    dataSource={records}
                    columns={columns}
                    size="middle"
                    loading={isLoading}
                    scroll={{ x: "max-content" }}
                    style={{ fontFamily: "Inter, sans-serif" }}
                    locale={{ emptyText: isLoading ? "Loading…" : "No verified operators found" }}
                    onRow={row => ({
                      onClick: () => openDrawer(row),
                      style: { cursor: "pointer" },
                    })}
                    pagination={{
                      current: apiParams.page,
                      pageSize: apiParams.limit,
                      total: pagination.total ?? 0,
                      showSizeChanger: false,
                      showTotal: t => `${t} operators`,
                      onChange: p => setApiParams(prev => ({ ...prev, page: p })),
                    }}
                  />
                </ConfigProvider>
              </div>

              {/* Audit & Badge Events */}
              {false && <div style={{ background: "#fff", border: "0.8px solid #dce7e1", borderRadius: "24px", boxShadow: "0px 1px 2px 0px rgba(16,24,40,0.06)", padding: "20px" }}>
                <p style={{ fontSize: "16.32px", fontWeight: 800, color: C.textPrimary, margin: "0 0 16px" }}>Audit & Badge Events</p>
                {(recentAuditData?.data?.length === 0 || !recentAuditData?.data) ? (
                  <p style={{ fontSize: "13px", color: C.textSecondary, margin: 0 }}>No recent events.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {(recentAuditData?.data || []).map((log, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "12px 0", borderBottom: i < (recentAuditData.data.length - 1) ? "0.8px solid #f1f7f4" : "none", gap: "16px" }}>
                        <span style={{ fontSize: "13px", color: C.textSecondary, whiteSpace: "nowrap", flexShrink: 0 }}>
                          {new Date(log.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                        </span>
                        <span style={{ fontSize: "13px", color: C.textPrimary, flex: 1 }}>
                          {log.action?.replace(/_/g, " ")}
                          {log.metadata?.businessName ? ` — ${log.metadata.businessName}` : ""}
                        </span>
                        <span style={{ fontSize: "13px", fontWeight: 700, color: C.green, whiteSpace: "nowrap", flexShrink: 0 }}>
                          {log.actor?.name || "System"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>}
            </div>
          </div>
        </div>
      </div>

      <VerifiedDrawer
        record={drawerRecord}
        rawRecord={drawerRaw}
        onClose={() => { setDrawerRecord(null); setDrawerRaw(null); }}
        onRevoke={r => setRevokeTarget(r)}
        onRenew={r => setRenewTarget(r)}
        revoking={revokingId === drawerRaw?._id}
        renewing={renewingId === drawerRaw?._id}
      />

      {showIssue && (
        <IssueVerificationModal
          onClose={() => setShowIssue(false)}
          onSuccess={() => {
            setShowIssue(false);
            toast.success("Canoja Verified badge issued");
            queryClient.invalidateQueries({ queryKey: ["adminCanojaVerified"] });
          }}
        />
      )}

      {revokeTarget && (
        <RevokeModal
          record={revokeTarget}
          onClose={() => setRevokeTarget(null)}
          onConfirm={handleRevoke}
          loading={!!revokingId}
        />
      )}

      {renewTarget && (
        <RenewModal
          record={renewTarget}
          onClose={() => setRenewTarget(null)}
          onConfirm={handleRenew}
          loading={!!renewingId}
        />
      )}
    </AdminShell>
  );
}
