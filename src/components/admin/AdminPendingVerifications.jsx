import React, { useState, useEffect, useCallback } from "react";
import { Table, ConfigProvider, Drawer, Modal } from "antd";
import AdminShell from "./AdminShell";
import {
  useAdminPendingVerifications,
  useApproveVerificationRequest,
  useRejectVerificationRequest,
  useAdminAuditLog,
  useEscalatePendingVerification,
} from "../../services/admin";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

const US_STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC"];

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  border: "#dce7e1",
  textPrimary: "#18212b",
  textSecondary: "#617182",
  green: "#2da96d",
  greenDark: "#1b6b46",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function getAgeHours(createdAt) {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / 3600000);
}

function getPriority(r) {
  const h = getAgeHours(r.createdAt);
  if (r.adminVerifiedRequired || h > 72) return "High";
  if (h > 24) return "Medium";
  return "Low";
}

function getEvidence(r) {
  const hasDocs = !!(r.uploaded_documents?.state_license_document);
  const hasId   = !!(r.contact_person?.government_issued_id_document);
  if (hasDocs && hasId) return "Docs complete";
  if (!hasId)           return "Missing owner ID";
  if (!hasDocs)         return "Missing license doc";
  return "State data matched";
}

function mapVerification(r) {
  const h = getAgeHours(r.createdAt);
  return {
    key:          r._id,
    name:         r.legal_business_name || "—",
    sub:          r.verification_method === "auto" ? "AI confidence match" : "Manual review required",
    submissionId: `PV-${r._id.toString().slice(-7).toUpperCase()}`,
    region:       r.license_information?.jurisdiction || r.license_information?.issuing_authority || "—",
    priority:     getPriority(r),
    requestedDate: new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    slaBreach:    h >= 72,
    evidence:     getEvidence(r),
    method:       r.verification_method,
    reviewer:     r.verification_method === "auto" ? "AI Bot" : "Admin",
  };
}

// ── Badges ────────────────────────────────────────────────────────────────────
function PriorityBadge({ priority }) {
  const map = {
    High:   { bg: "#fff1f1", color: "#d64545" },
    Medium: { bg: "#fff5eb", color: "#d9822b" },
    Low:    { bg: "#f4f7fa", color: "#617182" },
  };
  const s = map[priority] || map.Low;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      height: "28px", padding: "0 10px", borderRadius: "999px",
      background: s.bg, color: s.color,
      fontSize: "12.48px", fontWeight: 800, whiteSpace: "nowrap",
    }}>
      {priority}
    </span>
  );
}

function EvidenceBadge({ text }) {
  const isGood = text.includes("complete") || text.includes("matched");
  const isWarn = text.includes("Missing");
  const s = isGood ? { bg: "#edf9f2", color: "#1f9d61" }
    : isWarn ? { bg: "#fff5eb", color: "#d9822b" }
    : { bg: "#f4f7fa", color: "#617182" };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      height: "28px", padding: "0 10px", borderRadius: "999px",
      background: s.bg, color: s.color,
      fontSize: "12.48px", fontWeight: 800, whiteSpace: "nowrap",
    }}>
      {text}
    </span>
  );
}

// ── Reject modal ──────────────────────────────────────────────────────────────
function RejectModal({ requestId, businessName, onClose, onConfirm, loading }) {
  const [reason, setReason] = useState("");
  return (
    <Modal
      open
      onCancel={onClose}
      zIndex={2000}
      footer={null}
      width={440}
      styles={{ content: { borderRadius: "20px", padding: "28px" } }}
    >
      <h3 style={{ fontSize: "18px", fontWeight: 800, color: C.textPrimary, margin: "0 0 6px" }}>Reject Verification</h3>
      <p style={{ fontSize: "14px", color: C.textSecondary, margin: "0 0 20px" }}>{businessName}</p>
      <textarea
        autoFocus
        value={reason}
        onChange={e => setReason(e.target.value)}
        placeholder="Reason for rejection (optional)"
        rows={4}
        style={{
          width: "100%", padding: "12px", borderRadius: "12px",
          border: "0.8px solid #dce7e1", fontSize: "14px", fontFamily: "inherit",
          resize: "vertical", outline: "none", boxSizing: "border-box",
          color: "#18212b", background: "#fff",
        }}
      />
      <div style={{ display: "flex", gap: "10px", marginTop: "20px", justifyContent: "flex-end" }}>
        <button
          onClick={onClose}
          style={{
            height: "40px", padding: "0 20px", borderRadius: "10px",
            background: "#fff", border: "0.8px solid #dce7e1",
            color: C.textPrimary, fontSize: "13px", fontWeight: 700, cursor: "pointer",
          }}
        >
          Cancel
        </button>
        <button
          onClick={() => onConfirm(requestId, reason)}
          disabled={loading}
          style={{
            height: "40px", padding: "0 20px", borderRadius: "10px",
            background: "#d64545", border: "none",
            color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer",
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? "Rejecting…" : "Confirm Reject"}
        </button>
      </div>
    </Modal>
  );
}

// ── Escalate modal ────────────────────────────────────────────────────────────
function EscalateModal({ request, onClose, onConfirm, loading }) {
  const [note, setNote] = useState("");
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 2000, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", borderRadius: "20px", padding: "28px", width: "440px", boxShadow: "0px 24px 48px rgba(0,0,0,0.16)" }}>
        <h3 style={{ fontSize: "18px", fontWeight: 800, color: C.textPrimary, margin: "0 0 6px" }}>Escalate to High Priority</h3>
        <p style={{ fontSize: "14px", color: C.textSecondary, margin: "0 0 20px" }}>{request.legal_business_name}</p>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Reason for escalation (optional)"
          rows={3}
          style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "0.8px solid #dce7e1", fontSize: "14px", fontFamily: "inherit", resize: "vertical", outline: "none", boxSizing: "border-box" }}
        />
        <div style={{ display: "flex", gap: "10px", marginTop: "20px", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ height: "40px", padding: "0 20px", borderRadius: "10px", background: "#fff", border: "0.8px solid #dce7e1", color: C.textPrimary, fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
            Cancel
          </button>
          <button
            onClick={() => onConfirm(request._id, note)}
            disabled={loading}
            style={{ height: "40px", padding: "0 20px", borderRadius: "10px", background: "#fff5eb", border: "0.8px solid #d9822b", color: "#d9822b", fontSize: "13px", fontWeight: 700, cursor: "pointer", opacity: loading ? 0.6 : 1 }}
          >
            {loading ? "Escalating…" : "Escalate"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Detail drawer ─────────────────────────────────────────────────────────────
function VRDetailRow({ label, value }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
      <span style={{ fontSize: "12px", fontWeight: 700, color: "#617182", textTransform: "uppercase", letterSpacing: "0.8px" }}>{label}</span>
      <span style={{ fontSize: "14px", color: "#18212b" }}>{value || "—"}</span>
    </div>
  );
}

function VRDrawer({ record, onClose, onApprove, onReject, approving, rejecting, reviewerMode, onNext, onPrev, hasNext, hasPrev, reviewerIndex, reviewerTotal }) {
  const { data: auditData } = useAdminAuditLog(
    record ? { targetType: "VerificationRequest", targetId: record._id, limit: 20 } : {}
  );
  const auditLogs = auditData?.data || [];

  if (!record) return null;
  const h = getAgeHours(record.createdAt);
  const slaBreach = h >= 72;

  return (
    <Drawer
      open={!!record}
      onClose={onClose}
      width={520}
      title={null}
      closeIcon={null}
      styles={{ body: { padding: 0 }, header: { display: "none" } }}
    >
      <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily: "Inter, sans-serif" }}>
        {/* Header */}
        <div style={{
          padding: "24px", borderBottom: "0.8px solid #dce7e1",
          background: "linear-gradient(155deg, rgba(251,146,60,0.08) 0%, #fff 100%)",
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
            <div>
              <p style={{ fontSize: "18px", fontWeight: 800, color: C.textPrimary, margin: 0 }}>
                {record.legal_business_name || "—"}
              </p>
              <p style={{ fontSize: "13px", color: C.textSecondary, margin: "2px 0 0" }}>
                PV-{record._id.toString().slice(-7).toUpperCase()} · {record.verification_method === "auto" ? "Auto" : "Manual"}
              </p>
            </div>
            <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
              <PriorityBadge priority={getPriority(record)} />
              <button onClick={onClose} style={{ background: "none", border: "0.8px solid #dce7e1", borderRadius: "8px", width: "32px", height: "32px", cursor: "pointer", fontSize: "16px", color: "#617182" }}>✕</button>
            </div>
          </div>
          {reviewerMode && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "12px" }}>
              <button onClick={onPrev} disabled={!hasPrev} style={{ height: "32px", padding: "0 14px", borderRadius: "8px", background: "#fff", border: "0.8px solid #dce7e1", color: hasPrev ? C.textPrimary : "#c0cdd6", fontSize: "13px", fontWeight: 700, cursor: hasPrev ? "pointer" : "default" }}>← Prev</button>
              <span style={{ fontSize: "13px", color: C.textSecondary, flex: 1, textAlign: "center" }}>{reviewerIndex + 1} of {reviewerTotal}</span>
              <button onClick={onNext} disabled={!hasNext} style={{ height: "32px", padding: "0 14px", borderRadius: "8px", background: "#fff", border: "0.8px solid #dce7e1", color: hasNext ? C.textPrimary : "#c0cdd6", fontSize: "13px", fontWeight: 700, cursor: hasNext ? "pointer" : "default" }}>Next →</button>
            </div>
          )}
          {slaBreach && (
            <div style={{ marginTop: "10px", padding: "8px 12px", borderRadius: "8px", background: "#fff1f1", color: "#d64545", fontSize: "13px", fontWeight: 600 }}>
              SLA breach — submitted {h}h ago (limit: 72h)
            </div>
          )}
          {/* Actions */}
          <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
            <button
              onClick={() => onApprove(record._id)}
              disabled={approving}
              style={{
                flex: 1, height: "40px", borderRadius: "10px",
                background: "linear-gradient(170deg,#1b6b46,#2da96d)", border: "none",
                color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer",
                opacity: approving ? 0.6 : 1,
              }}
            >
              {approving ? "Approving…" : "Approve"}
            </button>
            <button
              onClick={() => onReject(record)}
              disabled={rejecting}
              style={{
                flex: 1, height: "40px", borderRadius: "10px",
                background: "#fff1f1", border: "0.8px solid #d64545",
                color: "#d64545", fontSize: "13px", fontWeight: 700, cursor: "pointer",
                opacity: rejecting ? 0.6 : 1,
              }}
            >
              Reject
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>

          {/* Contact person */}
          <div>
            <p style={{ fontSize: "13px", fontWeight: 800, color: C.textPrimary, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>Contact Person</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <VRDetailRow label="Name"     value={record.contact_person?.full_name} />
              <VRDetailRow label="Role"     value={record.contact_person?.role_or_position} />
              <VRDetailRow label="Email"    value={record.contact_person?.email_address} />
              <VRDetailRow label="Phone"    value={record.contact_person?.phone_number} />
            </div>
          </div>

          {/* Business */}
          <div>
            <p style={{ fontSize: "13px", fontWeight: 800, color: C.textPrimary, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>Business</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <VRDetailRow label="Phone"    value={record.business_phone_number} />
              <VRDetailRow label="Website"  value={record.website_or_social_media_link} />
              <VRDetailRow label="Address"  value={record.physical_address} />
            </div>
          </div>

          {/* License info */}
          <div>
            <p style={{ fontSize: "13px", fontWeight: 800, color: C.textPrimary, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>License</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <VRDetailRow label="License #"    value={record.license_information?.license_number} />
              <VRDetailRow label="Type"         value={record.license_information?.license_type} />
              <VRDetailRow label="Authority"    value={record.license_information?.issuing_authority} />
              <VRDetailRow label="Jurisdiction" value={record.license_information?.jurisdiction} />
              <VRDetailRow label="Expires"      value={record.license_information?.expiration_date ? new Date(record.license_information.expiration_date).toLocaleDateString() : null} />
            </div>
          </div>

          {/* Documents */}
          <div>
            <p style={{ fontSize: "13px", fontWeight: 800, color: C.textPrimary, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>Documents</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {[
                ["State License Doc", record.uploaded_documents?.state_license_document],
                ["Utility Bill",      record.uploaded_documents?.utility_bill],
                ["Govt. Issued ID",   record.contact_person?.government_issued_id_document],
              ].map(([label, url]) => (
                <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: "10px", background: "#f4f7fa" }}>
                  <span style={{ fontSize: "13px", color: C.textPrimary }}>{label}</span>
                  {url
                    ? <a href={url} target="_blank" rel="noreferrer" style={{ fontSize: "13px", fontWeight: 700, color: "#2da96d", textDecoration: "none" }}>View</a>
                    : <span style={{ fontSize: "13px", color: "#d64545", fontWeight: 600 }}>Missing</span>
                  }
                </div>
              ))}
            </div>
          </div>

          {/* Audit log */}
          {auditLogs.length > 0 && (
            <div>
              <p style={{ fontSize: "13px", fontWeight: 800, color: C.textPrimary, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>Audit Trail</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
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
                      {log.metadata?.reason && <p style={{ fontSize: "12px", color: "#d64545", margin: "2px 0 0" }}>Reason: {log.metadata.reason}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submission meta */}
          <div>
            <p style={{ fontSize: "13px", fontWeight: 800, color: C.textPrimary, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>Submission</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <VRDetailRow label="Submitted"  value={new Date(record.createdAt).toLocaleString()} />
              <VRDetailRow label="Method"     value={record.verification_method} />
              <VRDetailRow label="GPS Status" value={record.gps_validation_status} />
              <VRDetailRow label="Notes"      value={record.notes} />
            </div>
          </div>
        </div>
      </div>
    </Drawer>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────
function StatCard({ label, value, delta, deltaBg, deltaColor }) {
  return (
    <div style={{
      background: "#fff", border: "0.8px solid #dce7e1", borderRadius: "24px",
      boxShadow: "0px 1px 2px 0px rgba(16,24,40,0.06)", padding: "20px",
    }}>
      <p style={{ fontSize: "14.08px", fontWeight: 400, color: C.textSecondary, marginBottom: "8px" }}>{label}</p>
      <p style={{ fontSize: "30.4px", fontWeight: 800, color: C.textPrimary, letterSpacing: "-0.912px", margin: 0 }}>{value}</p>
      <span style={{
        display: "inline-flex", alignItems: "center", marginTop: "10px",
        padding: "6px 10px", borderRadius: "999px",
        background: deltaBg, color: deltaColor,
        fontSize: "13.12px", fontWeight: 800, whiteSpace: "nowrap",
      }}>
        {delta}
      </span>
    </div>
  );
}

function Chip({ children }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", padding: "8px 12px",
      borderRadius: "999px", background: "#ebfbf2", color: "#145237",
      fontSize: "13.12px", fontWeight: 800, whiteSpace: "nowrap",
    }}>
      {children}
    </span>
  );
}

function LayerBadge({ children, muted }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", height: "36.15px", padding: "0 12px",
      borderRadius: "999px",
      background: muted ? "#f4f7fa" : "rgba(255,255,255,0.75)",
      border: "0.8px solid #dce7e1",
      color: muted ? "#617182" : "#145237",
      fontSize: "12.8px", fontWeight: 800, whiteSpace: "nowrap",
    }}>
      {children}
    </span>
  );
}

function FilterRow({ label, count, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        width: "100%", padding: "10.8px 12.8px", borderRadius: "12px",
        border: active ? "0.8px solid #2da96d" : "0.8px solid #dce7e1",
        background: active ? "#edf9f2" : "#fcfefd", cursor: "pointer",
      }}
    >
      <span style={{ fontSize: "14.72px", fontWeight: 400, color: active ? "#1f9d61" : C.textPrimary }}>{label}</span>
      <span style={{ fontSize: "13.12px", fontWeight: 700, color: C.textSecondary }}>{count}</span>
    </button>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminPendingVerifications() {
  const queryClient = useQueryClient();

  const [search, setSearch]               = useState("");
  const [apiParams, setApiParams]         = useState({ limit: 50, page: 1 });
  const [ageFilter, setAgeFilter]         = useState("");
  const [regionDraft, setRegionDraft]     = useState("");
  const [priorityDraft, setPriorityDraft] = useState("");

  // Drawer + actions
  const [drawerRecord, setDrawerRecord]       = useState(null);
  const [rejectTarget, setRejectTarget]       = useState(null);
  const [escalateTarget, setEscalateTarget]   = useState(null);
  const [approvingId, setApprovingId]         = useState(null);
  const [rejectingId, setRejectingId]         = useState(null);
  const [escalatingId, setEscalatingId]       = useState(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [bulkApproving, setBulkApproving]     = useState(false);

  const { mutateAsync: approve   } = useApproveVerificationRequest();
  const { mutateAsync: reject    } = useRejectVerificationRequest();
  const { mutateAsync: escalate  } = useEscalatePendingVerification();

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

  const { data: apiData, isLoading, isError } = useAdminPendingVerifications(apiParams);

  const rawRecords  = apiData?.data || [];
  const records     = rawRecords.map(mapVerification);
  const pagination  = apiData?.pagination || {};
  const apiStats    = apiData?.stats || {};
  const stateOptions  = apiData?.facets?.states || [];

  const STATS = [
    { label: "Pending Total",      value: (apiStats.pendingTotal ?? "—").toString(), delta: "Backlog",               deltaBg: "#fff5eb", deltaColor: "#d9822b" },
    { label: "High Priority",      value: (apiStats.highPriority  ?? "—").toString(), delta: "Needs same-day review", deltaBg: "#fff5eb", deltaColor: "#d9822b" },
    { label: "SLA Breaches",       value: (apiStats.slaBreaches   ?? "—").toString(), delta: "Older than 72h",        deltaBg: "#fff1f1", deltaColor: "#d64545" },
    { label: "Avg Time to Verify", value: apiStats.avgTimeToVerify ?? "—",            delta: "Approved + rejected",   deltaBg: "#edf9f2", deltaColor: "#1f9d61" },
  ];

  const handleAgeFilter = (val) => {
    const next = ageFilter === val ? "" : val;
    setAgeFilter(next);
    setApiParams(p => {
      const u = { ...p, page: 1 };
      if (next === "lt24")  u.submissionAge = "lt24";
      else if (next === "24-72") u.submissionAge = "24-72";
      else if (next === "gt72")  u.submissionAge = "gt72";
      else delete u.submissionAge;
      return u;
    });
  };

  const handlePriorityChange = (val) => {
    setPriorityDraft(val);
    setApiParams(p => {
      const u = { ...p, page: 1 };
      if (val) u.priority = val; else delete u.priority;
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

  const handleReset = () => {
    setSearch(""); setAgeFilter(""); setRegionDraft(""); setPriorityDraft("");
    setApiParams({ limit: 50, page: 1 });
  };

  const [reviewerMode, setReviewerMode] = useState(false);

  const openReviewerView = () => {
    if (!rawRecords.length) { toast.info("No records in queue"); return; }
    setReviewerMode(true);
    setDrawerRecord(rawRecords[0]);
  };

  const handleReviewerNext = () => {
    const idx = rawRecords.findIndex(r => r._id === drawerRecord?._id);
    if (idx < rawRecords.length - 1) setDrawerRecord(rawRecords[idx + 1]);
  };

  const handleReviewerPrev = () => {
    const idx = rawRecords.findIndex(r => r._id === drawerRecord?._id);
    if (idx > 0) setDrawerRecord(rawRecords[idx - 1]);
  };

  const closeDrawer = () => {
    setDrawerRecord(null);
    setReviewerMode(false);
  };

  const handleApprove = async (requestId) => {
    setApprovingId(requestId);
    try {
      await approve(requestId);
      toast.success("Verification approved");
      queryClient.invalidateQueries({ queryKey: ["adminPendingVerifications"] });
      setDrawerRecord(null);
    } catch (e) {
      toast.error(e.message || "Failed to approve");
    } finally {
      setApprovingId(null);
    }
  };

  const handleRejectConfirm = async (requestId, reason) => {
    setRejectingId(requestId);
    try {
      await reject({ requestId, reason });
      toast.success("Verification rejected");
      queryClient.invalidateQueries({ queryKey: ["adminPendingVerifications"] });
      setRejectTarget(null);
      setDrawerRecord(null);
    } catch (e) {
      toast.error(e.message || "Failed to reject");
    } finally {
      setRejectingId(null);
    }
  };

  const handleEscalateConfirm = async (id, note) => {
    setEscalatingId(id);
    try {
      await escalate({ id, note });
      toast.success("Request escalated to high priority");
      queryClient.invalidateQueries({ queryKey: ["adminPendingVerifications"] });
      setEscalateTarget(null);
    } catch (e) {
      toast.error(e.message || "Failed to escalate");
    } finally {
      setEscalatingId(null);
    }
  };

  const handleBulkEscalate = async () => {
    if (!selectedRowKeys.length) { toast.info("Select records to escalate"); return; }
    const results = await Promise.allSettled(
      selectedRowKeys.map(id => escalate({ id, note: "Bulk escalated" }))
    );
    const succeeded = results.filter(r => r.status === "fulfilled").length;
    setSelectedRowKeys([]);
    if (succeeded) toast.success(`${succeeded} request${succeeded > 1 ? "s" : ""} escalated`);
    queryClient.invalidateQueries({ queryKey: ["adminPendingVerifications"] });
  };

  const handleBulkApprove = async () => {
    if (!selectedRowKeys.length) return;
    setBulkApproving(true);
    const results = await Promise.allSettled(selectedRowKeys.map(id => approve(id)));
    const succeeded = results.filter(r => r.status === "fulfilled").length;
    const failed    = results.filter(r => r.status === "rejected").length;
    setBulkApproving(false);
    setSelectedRowKeys([]);
    if (succeeded) toast.success(`${succeeded} verification${succeeded > 1 ? "s" : ""} approved`);
    if (failed)    toast.error(`${failed} approval${failed > 1 ? "s" : ""} failed`);
    queryClient.invalidateQueries({ queryKey: ["adminPendingVerifications"] });
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
      title: "Submission ID",
      dataIndex: "submissionId",
      key: "submissionId",
      render: v => <span style={{ fontSize: "14px", color: C.textPrimary, fontFamily: "monospace" }}>{v}</span>,
    },
    {
      title: "Region",
      dataIndex: "region",
      key: "region",
      render: v => <span style={{ fontSize: "14px", color: C.textPrimary }}>{v}</span>,
    },
    {
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      render: v => <PriorityBadge priority={v} />,
    },
    {
      title: "Requested",
      dataIndex: "requestedDate",
      key: "requestedDate",
      render: (v, row) => (
        <span style={{ fontSize: "14px", fontWeight: row.slaBreach ? 700 : 400, color: row.slaBreach ? "#d64545" : C.textPrimary }}>
          {v}
        </span>
      ),
    },
    {
      title: "Reviewer",
      dataIndex: "reviewer",
      key: "reviewer",
      render: v => <span style={{ fontSize: "14px", color: C.textPrimary }}>{v}</span>,
    },
    {
      title: "Evidence",
      dataIndex: "evidence",
      key: "evidence",
      render: v => <EvidenceBadge text={v} />,
    },
    {
      title: "Action",
      key: "actions",
      render: (_, row) => {
        const hasIssues = row.evidence.includes("Missing");
        if (hasIssues) {
          return (
            <button
              onClick={e => { e.stopPropagation(); setDrawerRecord(rawRecords.find(r => r._id === row.key) || null); }}
              style={{ height: "34px", padding: "0 14px", borderRadius: "10px", background: "#fff5eb", border: "0.8px solid #d9822b", color: "#d9822b", fontSize: "12.5px", fontWeight: 700, cursor: "pointer" }}
            >
              Review
            </button>
          );
        }
        if (row.priority === "High") {
          return (
            <button
              onClick={e => { e.stopPropagation(); setDrawerRecord(rawRecords.find(r => r._id === row.key) || null); }}
              style={{ height: "34px", padding: "0 14px", borderRadius: "10px", background: "#fff", border: "0.8px solid #dce7e1", color: C.textPrimary, fontSize: "12.5px", fontWeight: 700, cursor: "pointer" }}
            >
              Open
            </button>
          );
        }
        return (
          <button
            onClick={e => { e.stopPropagation(); handleApprove(row.key); }}
            disabled={approvingId === row.key}
            style={{ height: "34px", padding: "0 14px", borderRadius: "10px", background: "linear-gradient(170deg,#1b6b46,#2da96d)", border: "none", color: "#fff", fontSize: "12.5px", fontWeight: 700, cursor: "pointer", opacity: approvingId === row.key ? 0.6 : 1 }}
          >
            {approvingId === row.key ? "…" : "Approve"}
          </button>
        );
      },
    },
  ];

  return (
    <AdminShell>
      <div style={{
        background: "linear-gradient(180deg, rgba(255,255,255,0.72) 0%, rgba(255,255,255,0.96) 100%)",
        border: "0.8px solid rgba(194,210,202,0.5)",
        borderRadius: "28px",
        boxShadow: "0px 8px 24px 0px rgba(13,59,42,0.08)",
        overflow: "clip",
      }}>

        {/* Sticky header */}
        <div style={{
          position: "sticky", top: 0, zIndex: 10,
          background: "rgba(255,255,255,0.76)",
          borderBottom: "0.8px solid #dce7e1",
          padding: "24px", display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: "24px", backdropFilter: "blur(8px)",
        }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <h1 style={{ fontSize: "28.8px", fontWeight: 800, color: C.textPrimary, letterSpacing: "-0.576px", margin: 0 }}>
              Claim Requests Queue
            </h1>
            <p style={{ fontSize: "15.36px", color: C.textSecondary, maxWidth: "620px", margin: 0 }}>
              Queue-driven verification workflow with SLA management, priority routing, and reviewer accountability.
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#8090a3", fontSize: "14.4px", pointerEvents: "none" }}>⌕</span>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search business, submission ID, email…"
                  style={{
                    width: "320px", height: "48px", paddingLeft: "44px", paddingRight: "18px",
                    borderRadius: "999px", border: "0.8px solid #dce7e1", background: "#fff",
                    fontSize: "13.333px", color: C.textPrimary, outline: "none", fontFamily: "inherit",
                  }}
                />
              </div>
              {/* <button style={{ height: "42px", padding: "0 16px", borderRadius: "12px", background: "#fff", border: "0.8px solid #dce7e1", color: C.textPrimary, fontSize: "13.333px", fontWeight: 700, cursor: "pointer" }}>
                Auto-Route
              </button>
              <button style={{ height: "42px", padding: "0 16px", borderRadius: "12px", backgroundImage: "linear-gradient(161deg,#1b6b46 0%,#2da96d 100%)", border: "none", color: "#fff", fontSize: "13.333px", fontWeight: 700, cursor: "pointer" }}>
                Assign Queue
              </button> */}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>

          {/* Hero banner — commented out
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "18px" }}>
            <div ...>Layer 1 · Verification Queue Command Center</div>
            <div ...>Layer 2 · Backlog Health</div>
          </div> */}

          {/* Stat cards */}
          <div style={{ position: "sticky", top: 0, zIndex: 10, background: "#f8fafc", paddingBottom: "12px", marginBottom: "-12px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "18px" }}>
              {STATS.map(s => <StatCard key={s.label} {...s} />)}
            </div>
          </div>

          {/* Content grid */}
          <div style={{ display: "grid", gridTemplateColumns: "300px minmax(0,1fr)", gap: "18px" }}>

            {/* Filter panel */}
            <div style={{
              position: "sticky", top: "24px", alignSelf: "start",
              background: "#fff", border: "0.8px solid #dce7e1", borderRadius: "24px",
              boxShadow: "0px 1px 2px 0px rgba(16,24,40,0.06)", padding: "20px",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
                <span style={{ fontSize: "16px", fontWeight: 800, color: C.textPrimary }}>Queue Filters</span>
                <button onClick={handleReset} style={{ fontSize: "14.08px", fontWeight: 700, color: "#1b6b46", background: "none", border: "none", cursor: "pointer", padding: 0 }}>Reset</button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

                {/* Submission Age */}
                <div>
                  <label style={{ display: "block", fontSize: "13.76px", fontWeight: 800, color: C.textPrimary, marginBottom: "8px" }}>Submission Age</label>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <FilterRow label="< 24 Hours"    count={apiStats.lt24Count          ?? "—"} active={ageFilter === "lt24"}  onClick={() => handleAgeFilter("lt24")} />
                    <FilterRow label="24 – 72 Hours" count={apiStats.between24and72Count ?? "—"} active={ageFilter === "24-72"} onClick={() => handleAgeFilter("24-72")} />
                    <FilterRow label="> 72 Hours (SLA)" count={apiStats.slaBreaches ?? "—"} active={ageFilter === "gt72"} onClick={() => handleAgeFilter("gt72")} />
                  </div>
                </div>

                {/* Priority */}
                <div>
                  <label style={{ display: "block", fontSize: "13.76px", fontWeight: 800, color: C.textPrimary, marginBottom: "8px" }}>Priority</label>
                  <select
                    value={priorityDraft}
                    onChange={e => handlePriorityChange(e.target.value)}
                    style={{ width: "100%", height: "42px", padding: "0 12px", borderRadius: "12px", border: "0.8px solid #dce7e1", background: "#fff", fontSize: "14.72px", color: C.textPrimary, outline: "none", cursor: "pointer" }}
                  >
                    <option value="">All Priorities</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                {/* Region */}
                <div>
                  <label style={{ display: "block", fontSize: "13.76px", fontWeight: 800, color: C.textPrimary, marginBottom: "8px" }}>Region</label>
                  <select
                    value={regionDraft}
                    onChange={e => handleRegionChange(e.target.value)}
                    style={{ width: "100%", height: "42px", padding: "0 12px", borderRadius: "12px", border: `0.8px solid ${regionDraft ? "#2da96d" : "#dce7e1"}`, background: regionDraft ? "#edf9f2" : "#fff", fontSize: "14.72px", color: C.textPrimary, outline: "none", cursor: "pointer" }}
                  >
                    <option value="">All Markets</option>
                    {stateOptions.map(s => (
                      <option key={s._id} value={s._id}>{s._id} ({s.count})</option>
                    ))}
                  </select>
                </div>

                {/* Submission Type — commented out (all pending are manual) */}
                {/* <div>
                  <label style={{ display: "block", fontSize: "13.76px", fontWeight: 800, color: C.textPrimary, marginBottom: "8px" }}>Submission Type</label>
                  <select
                    style={{ width: "100%", height: "42px", padding: "0 12px", borderRadius: "12px", border: "0.8px solid #dce7e1", background: "#fff", fontSize: "14.72px", color: C.textPrimary, outline: "none", cursor: "pointer" }}
                    defaultValue=""
                  >
                    <option value="">All Types</option>
                    <option value="manual">Manual</option>
                    <option value="auto">Auto</option>
                  </select>
                </div> */}

                {/* Reviewer — commented out */}
                {/* <div>
                  <label style={{ display: "block", fontSize: "13.76px", fontWeight: 800, color: C.textPrimary, marginBottom: "8px" }}>Reviewer</label>
                  <select
                    style={{ width: "100%", height: "42px", padding: "0 12px", borderRadius: "12px", border: "0.8px solid #dce7e1", background: "#fff", fontSize: "14.72px", color: C.textPrimary, outline: "none", cursor: "pointer" }}
                    defaultValue=""
                  >
                    <option value="">Any Reviewer</option>
                  </select>
                </div> */}
              </div>
            </div>

            {/* Right: table */}
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              <div style={{ background: "#fff", border: "0.8px solid #dce7e1", borderRadius: "24px", boxShadow: "0px 1px 2px 0px rgba(16,24,40,0.06)", overflow: "clip", padding: "0.8px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px", borderBottom: "0.8px solid #dce7e1" }}>
                  <div>
                    <p style={{ fontSize: "16.32px", fontWeight: 800, color: C.textPrimary, margin: 0 }}>Requests Queue</p>
                    <p style={{ fontSize: "14.4px", color: C.textSecondary, margin: "4px 0 0" }}>Records ordered by priority and SLA risk. Click any row for details.</p>
                  </div>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    {selectedRowKeys.length > 0 && (
                      <span style={{ fontSize: "13px", color: C.textSecondary }}>{selectedRowKeys.length} selected</span>
                    )}
                    <button
                      onClick={handleBulkApprove}
                      disabled={!selectedRowKeys.length || bulkApproving}
                      style={{
                        height: "42px", padding: "0 16px", borderRadius: "12px",
                        background: selectedRowKeys.length ? "linear-gradient(170deg,#1b6b46,#2da96d)" : "#fff",
                        border: selectedRowKeys.length ? "none" : "0.8px solid #dce7e1",
                        color: selectedRowKeys.length ? "#fff" : C.textSecondary,
                        fontSize: "13.333px", fontWeight: 700,
                        cursor: selectedRowKeys.length ? "pointer" : "default",
                        opacity: bulkApproving ? 0.6 : 1,
                      }}
                    >
                      {bulkApproving ? "Approving…" : "Bulk Approve"}
                    </button>
                    <button
                      onClick={handleBulkEscalate}
                      style={{ height: "42px", padding: "0 16px", borderRadius: "12px", background: "#fff", border: "0.8px solid #dce7e1", color: C.textPrimary, fontSize: "13.333px", fontWeight: 700, cursor: "pointer" }}
                    >
                      Escalate
                    </button>
                    <button
                      onClick={openReviewerView}
                      style={{ height: "42px", padding: "0 16px", borderRadius: "12px", backgroundImage: "linear-gradient(165.51deg,#1b6b46 0%,#2da96d 100%)", border: "none", color: "#fff", fontSize: "13.333px", fontWeight: 700, cursor: "pointer" }}
                    >
                      Open Reviewer View
                    </button>
                  </div>
                </div>

                {isError && <div style={{ padding: "24px", color: "#d64545" }}>Failed to load verification queue.</div>}

                <ConfigProvider theme={{ components: { Table: { headerBg: "#f1f7f4", headerColor: "#617182", headerSplitColor: "transparent", borderColor: "#dce7e1", rowHoverBg: "#f7fbf9", cellPaddingBlock: 16, cellPaddingInline: 16 } } }}>
                  <Table
                    dataSource={records}
                    columns={columns}
                    size="middle"
                    loading={isLoading}
                    scroll={{ x: "max-content" }}
                    style={{ fontFamily: "Inter, sans-serif" }}
                    locale={{ emptyText: isLoading ? "Loading…" : "No pending verifications" }}
                    rowSelection={{
                      selectedRowKeys,
                      onChange: keys => setSelectedRowKeys(keys),
                      getCheckboxProps: row => ({ disabled: bulkApproving }),
                    }}
                    onRow={row => ({
                      onClick: () => setDrawerRecord(rawRecords.find(r => r._id === row.key) || null),
                      style: { cursor: "pointer" },
                    })}
                    pagination={{
                      current: apiParams.page,
                      pageSize: apiParams.limit,
                      total: pagination.total ?? 0,
                      showSizeChanger: false,
                      showTotal: t => `${t} requests`,
                      onChange: p => setApiParams(prev => ({ ...prev, page: p })),
                    }}
                  />
                </ConfigProvider>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Drawer */}
      <VRDrawer
        record={drawerRecord}
        onClose={closeDrawer}
        onApprove={handleApprove}
        onReject={r => setRejectTarget(r)}
        approving={approvingId === drawerRecord?._id}
        rejecting={rejectingId === drawerRecord?._id}
        reviewerMode={reviewerMode}
        onNext={handleReviewerNext}
        onPrev={handleReviewerPrev}
        hasNext={rawRecords.findIndex(r => r._id === drawerRecord?._id) < rawRecords.length - 1}
        hasPrev={rawRecords.findIndex(r => r._id === drawerRecord?._id) > 0}
        reviewerIndex={rawRecords.findIndex(r => r._id === drawerRecord?._id)}
        reviewerTotal={rawRecords.length}
      />

      {/* Reject modal */}
      {rejectTarget && (
        <RejectModal
          requestId={rejectTarget._id}
          businessName={rejectTarget.legal_business_name}
          onClose={() => setRejectTarget(null)}
          onConfirm={handleRejectConfirm}
          loading={!!rejectingId}
        />
      )}

      {/* Escalate modal */}
      {escalateTarget && (
        <EscalateModal
          request={escalateTarget}
          onClose={() => setEscalateTarget(null)}
          onConfirm={handleEscalateConfirm}
          loading={!!escalatingId}
        />
      )}
    </AdminShell>
  );
}
