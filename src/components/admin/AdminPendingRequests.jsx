import React, { useState, useEffect } from "react";
import { Table, ConfigProvider, Drawer, Modal } from "antd";
import AdminShell from "./AdminShell";
import {
  useAdminPendingRequests,
  useApproveVerificationRequest,
  useRejectVerificationRequest,
  useAdminAuditLog,
  useRequestMessages,
  useSendRequestMessage,
  useCreatePendingRequest,
} from "../../services/admin";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

const C = {
  border: "#dce7e1",
  textPrimary: "#18212b",
  textSecondary: "#617182",
  green: "#2da96d",
  greenDark: "#1b6b46",
};

// ── Badges ────────────────────────────────────────────────────────────────────
function TypeBadge({ type }) {
  const map = {
    "Claim Business": { bg: "#edf9f2", color: "#1f9d61" },
    "Verify Business": { bg: "#edf5ff", color: "#2f80ed" },
  };
  const s = map[type] || { bg: "#f4f7fa", color: "#617182" };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", height: "28px", padding: "0 10px", borderRadius: "999px", background: s.bg, color: s.color, fontSize: "12.48px", fontWeight: 800, whiteSpace: "nowrap" }}>
      {type}
    </span>
  );
}

function StatusBadge({ status }) {
  const map = {
    pending:       { label: "New",          bg: "#edf5ff", color: "#2f80ed" },
    in_review:     { label: "In Review",    bg: "#fff5eb", color: "#d9822b" },
    approved:      { label: "Approved",     bg: "#edf9f2", color: "#1f9d61" },
    rejected:      { label: "Rejected",     bg: "#fff1f1", color: "#d64545" },
    auto_verified: { label: "Auto Verified",bg: "#f4f7fa", color: "#617182" },
  };
  const s = map[status] || { label: status, bg: "#f4f7fa", color: "#617182" };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", height: "28px", padding: "0 10px", borderRadius: "999px", background: s.bg, color: s.color, fontSize: "12.48px", fontWeight: 800, whiteSpace: "nowrap" }}>
      {s.label}
    </span>
  );
}

function DuplicateBadge() {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", height: "22px", padding: "0 8px", borderRadius: "999px", background: "#fff5eb", color: "#d9822b", fontSize: "11px", fontWeight: 800, whiteSpace: "nowrap" }}>
      Duplicate
    </span>
  );
}

function CompletenessBar({ value }) {
  const color = value >= 80 ? "#2da96d" : value >= 50 ? "#d9822b" : "#d64545";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <div style={{ flex: 1, height: "6px", borderRadius: "999px", background: "#f1f7f4", minWidth: "60px" }}>
        <div style={{ width: `${value}%`, height: "100%", borderRadius: "999px", background: color }} />
      </div>
      <span style={{ fontSize: "12px", fontWeight: 700, color, whiteSpace: "nowrap" }}>{value}%</span>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function computeCompleteness(r) {
  const fields = [
    r.legal_business_name,
    r.physical_address,
    r.business_phone_number,
    r.website_or_social_media_link,
    r.contact_person?.full_name,
    r.contact_person?.email_address,
    r.contact_person?.role_or_position,
    r.contact_person?.government_issued_id_document,
    r.license_information?.license_number,
    r.uploaded_documents?.state_license_document,
  ];
  const filled = fields.filter(v => v !== null && v !== undefined && v !== "").length;
  return Math.round((filled / fields.length) * 100);
}

function timeAgo(date) {
  const h = Math.floor((Date.now() - new Date(date).getTime()) / 3600000);
  if (h < 1) return "just now";
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

const US_STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC"];
const STATE_NAMES = { AL:"Alabama",AK:"Alaska",AZ:"Arizona",AR:"Arkansas",CA:"California",CO:"Colorado",CT:"Connecticut",DE:"Delaware",FL:"Florida",GA:"Georgia",HI:"Hawaii",ID:"Idaho",IL:"Illinois",IN:"Indiana",IA:"Iowa",KS:"Kansas",KY:"Kentucky",LA:"Louisiana",ME:"Maine",MD:"Maryland",MA:"Massachusetts",MI:"Michigan",MN:"Minnesota",MS:"Mississippi",MO:"Missouri",MT:"Montana",NE:"Nebraska",NV:"Nevada",NH:"New Hampshire",NJ:"New Jersey",NM:"New Mexico",NY:"New York",NC:"North Carolina",ND:"North Dakota",OH:"Ohio",OK:"Oklahoma",OR:"Oregon",PA:"Pennsylvania",RI:"Rhode Island",SC:"South Carolina",SD:"South Dakota",TN:"Tennessee",TX:"Texas",UT:"Utah",VT:"Vermont",VA:"Virginia",WA:"Washington",WV:"West Virginia",WI:"Wisconsin",WY:"Wyoming",DC:"District of Columbia" };

function extractState(address) {
  if (!address) return "";
  const m = address.match(/\b([A-Z]{2})\b(?:\s+\d{5})?/);
  if (m && US_STATES.includes(m[1])) return m[1];
  return "";
}

function mapRequest(r) {
  const completeness = computeCompleteness(r);
  return {
    key:           r._id,
    name:          r.legal_business_name || "—",
    sub:           `PR-${r._id.toString().slice(-6).toUpperCase()} · Submitted ${timeAgo(r.createdAt)}`,
    type:          r.claimRequested ? "Claim Business" : r.verifyRequested ? "Verify Business" : "—",
    submitted:     new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    status:        r.status,
    method:        r.verification_method,
    duplicateFlag: r.duplicateFlag || false,
    completeness,
    market:        extractState(r.physical_address),
    leadSource:    r.leadSource || "Website CTA",
  };
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
      <h3 style={{ fontSize: "18px", fontWeight: 800, color: C.textPrimary, margin: "0 0 6px" }}>Reject Request</h3>
      <p style={{ fontSize: "14px", color: C.textSecondary, margin: "0 0 20px" }}>{businessName}</p>
      <textarea
        autoFocus
        value={reason}
        onChange={e => setReason(e.target.value)}
        placeholder="Reason for rejection (optional)"
        rows={4}
        style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "0.8px solid #dce7e1", fontSize: "14px", fontFamily: "inherit", resize: "vertical", outline: "none", boxSizing: "border-box", color: "#18212b", background: "#fff" }}
      />
      <div style={{ display: "flex", gap: "10px", marginTop: "20px", justifyContent: "flex-end" }}>
        <button onClick={onClose} style={{ height: "40px", padding: "0 20px", borderRadius: "10px", background: "#fff", border: "0.8px solid #dce7e1", color: C.textPrimary, fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>Cancel</button>
        <button onClick={() => onConfirm(requestId, reason)} disabled={loading} style={{ height: "40px", padding: "0 20px", borderRadius: "10px", background: "#d64545", border: "none", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer", opacity: loading ? 0.6 : 1 }}>
          {loading ? "Rejecting…" : "Confirm Reject"}
        </button>
      </div>
    </Modal>
  );
}

// ── Detail drawer ─────────────────────────────────────────────────────────────
function DetailRow({ label, value }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
      <span style={{ fontSize: "12px", fontWeight: 700, color: "#617182", textTransform: "uppercase", letterSpacing: "0.8px" }}>{label}</span>
      <span style={{ fontSize: "14px", color: "#18212b" }}>{value || "—"}</span>
    </div>
  );
}

function RequestDrawer({ record, onClose, onApprove, onReject, approving, rejecting }) {
  const { data: auditData } = useAdminAuditLog(
    record ? { targetType: "VerificationRequest", targetId: record._id, limit: 20 } : {}
  );
  const auditLogs = auditData?.data || [];

  const { data: msgData, refetch: refetchMessages } = useRequestMessages(record?._id);
  const messages = msgData?.data || [];
  const { mutateAsync: sendMessage } = useSendRequestMessage();
  const [msgBody, setMsgBody] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!msgBody.trim()) return;
    setSending(true);
    try {
      await sendMessage({ requestId: record._id, body: msgBody.trim() });
      setMsgBody("");
      refetchMessages();
    } finally {
      setSending(false);
    }
  };

  if (!record) return null;

  return (
    <Drawer open={!!record} onClose={onClose} width={520} title={null} closeIcon={null} styles={{ body: { padding: 0 }, header: { display: "none" } }}>
      <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily: "Inter, sans-serif" }}>

        {/* Header */}
        <div style={{ padding: "24px", borderBottom: "0.8px solid #dce7e1", background: "linear-gradient(155deg,rgba(100,149,237,0.08) 0%,#fff 100%)" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
            <div>
              <p style={{ fontSize: "18px", fontWeight: 800, color: C.textPrimary, margin: 0 }}>{record.legal_business_name || "—"}</p>
              <p style={{ fontSize: "13px", color: C.textSecondary, margin: "2px 0 0" }}>
                {record.claimRequested ? "Claim Business" : record.verifyRequested ? "Verify Business" : "—"} · {new Date(record.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
              <StatusBadge status={record.status} />
              <button onClick={onClose} style={{ background: "none", border: "0.8px solid #dce7e1", borderRadius: "8px", width: "32px", height: "32px", cursor: "pointer", fontSize: "16px", color: "#617182" }}>✕</button>
            </div>
          </div>
          {record.status === "pending" && (
            <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
              <button
                onClick={() => onApprove(record._id)}
                disabled={approving}
                style={{ flex: 1, height: "40px", borderRadius: "10px", background: "linear-gradient(170deg,#1b6b46,#2da96d)", border: "none", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer", opacity: approving ? 0.6 : 1 }}
              >
                {approving ? "Approving…" : "Approve"}
              </button>
              <button
                onClick={() => onReject(record)}
                disabled={rejecting}
                style={{ flex: 1, height: "40px", borderRadius: "10px", background: "#fff1f1", border: "0.8px solid #d64545", color: "#d64545", fontSize: "13px", fontWeight: 700, cursor: "pointer", opacity: rejecting ? 0.6 : 1 }}
              >
                Reject
              </button>
            </div>
          )}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>

          {/* Contact person */}
          <div>
            <p style={{ fontSize: "13px", fontWeight: 800, color: C.textPrimary, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>Contact Person</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <DetailRow label="Name"  value={record.contact_person?.full_name} />
              <DetailRow label="Role"  value={record.contact_person?.role_or_position} />
              <DetailRow label="Email" value={record.contact_person?.email_address} />
              <DetailRow label="Phone" value={record.contact_person?.phone_number} />
            </div>
          </div>

          {/* Business */}
          <div>
            <p style={{ fontSize: "13px", fontWeight: 800, color: C.textPrimary, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>Business</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <DetailRow label="Phone"   value={record.business_phone_number} />
              <DetailRow label="Website" value={record.website_or_social_media_link} />
              <DetailRow label="Address" value={record.physical_address} />
            </div>
          </div>

          {/* License */}
          <div>
            <p style={{ fontSize: "13px", fontWeight: 800, color: C.textPrimary, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>License</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <DetailRow label="License #"    value={record.license_information?.license_number} />
              <DetailRow label="Type"         value={record.license_information?.license_type} />
              <DetailRow label="Authority"    value={record.license_information?.issuing_authority} />
              <DetailRow label="Jurisdiction" value={record.license_information?.jurisdiction} />
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
                    : <span style={{ fontSize: "13px", color: "#d64545", fontWeight: 600 }}>Missing</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Audit trail */}
          {auditLogs.length > 0 && (
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
                      <p style={{ fontSize: "12px", color: C.textSecondary, margin: "2px 0 0" }}>{log.actor?.name || "Admin"} · {new Date(log.createdAt).toLocaleString()}</p>
                      {log.metadata?.reason && <p style={{ fontSize: "12px", color: "#d64545", margin: "2px 0 0" }}>Reason: {log.metadata.reason}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {record.notes && (
            <div>
              <p style={{ fontSize: "13px", fontWeight: 800, color: C.textPrimary, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>Notes</p>
              <p style={{ fontSize: "14px", color: C.textSecondary, background: "#f4f7fa", padding: "12px", borderRadius: "10px", margin: 0 }}>{record.notes}</p>
            </div>
          )}

          {/* Message thread */}
          <div>
            <p style={{ fontSize: "13px", fontWeight: 800, color: C.textPrimary, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>Messages</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "12px", maxHeight: "200px", overflowY: "auto" }}>
              {messages.length === 0 && (
                <p style={{ fontSize: "13px", color: C.textSecondary, margin: 0 }}>No messages yet.</p>
              )}
              {messages.map((m, i) => (
                <div key={i} style={{ padding: "10px 14px", borderRadius: "10px", background: m.fromAdmin ? "#edf9f2" : "#f4f7fa", alignSelf: m.fromAdmin ? "flex-end" : "flex-start", maxWidth: "85%" }}>
                  <p style={{ fontSize: "13px", color: C.textPrimary, margin: 0 }}>{m.body}</p>
                  <p style={{ fontSize: "11px", color: C.textSecondary, margin: "4px 0 0" }}>
                    {m.senderName || "Admin"} · {new Date(m.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                value={msgBody}
                onChange={e => setMsgBody(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder="Type a message…"
                style={{ flex: 1, height: "38px", padding: "0 12px", borderRadius: "10px", border: "0.8px solid #dce7e1", fontSize: "13px", fontFamily: "inherit", outline: "none" }}
              />
              <button
                onClick={handleSend}
                disabled={sending || !msgBody.trim()}
                style={{ height: "38px", padding: "0 16px", borderRadius: "10px", backgroundImage: "linear-gradient(161deg,#1b6b46 0%,#2da96d 100%)", border: "none", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer", opacity: (sending || !msgBody.trim()) ? 0.5 : 1 }}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </Drawer>
  );
}

// ── New Request Modal ─────────────────────────────────────────────────────────
const EMPTY_FORM = {
  legal_business_name: "", physical_address: "", business_phone_number: "",
  website_or_social_media_link: "", business_type: "", requestType: "claim",
  contact_full_name: "", contact_email: "", contact_phone: "", contact_role: "",
  license_number: "", license_type: "", issuing_authority: "", jurisdiction: "",
  notes: "",
};

function FieldInput({ label, value, onChange, required, type = "text", options }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <label style={{ fontSize: "12px", fontWeight: 700, color: "#617182", textTransform: "uppercase", letterSpacing: "0.6px" }}>
        {label}{required && <span style={{ color: "#d64545" }}> *</span>}
      </label>
      {options ? (
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{ height: "38px", padding: "0 12px", borderRadius: "10px", border: "0.8px solid #dce7e1", fontSize: "13px", fontFamily: "inherit", outline: "none", background: "#fff", color: value ? "#18212b" : "#8090a3" }}
        >
          {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      ) : (
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{ height: "38px", padding: "0 12px", borderRadius: "10px", border: "0.8px solid #dce7e1", fontSize: "13px", fontFamily: "inherit", outline: "none" }}
        />
      )}
    </div>
  );
}

function NewRequestModal({ onClose, onSuccess }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const { mutateAsync: createRequest, isPending } = useCreatePendingRequest();

  const set = (key) => (val) => setForm(f => ({ ...f, [key]: val }));

  const validate = () => {
    const e = {};
    if (!form.legal_business_name.trim()) e.legal_business_name = true;
    if (!form.physical_address.trim())    e.physical_address = true;
    if (!form.business_phone_number.trim()) e.business_phone_number = true;
    if (!form.contact_full_name.trim())   e.contact_full_name = true;
    if (!form.contact_email.trim())       e.contact_email = true;
    if (!form.contact_phone.trim())       e.contact_phone = true;
    if (!form.contact_role.trim())        e.contact_role = true;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      await createRequest({
        legal_business_name: form.legal_business_name.trim(),
        physical_address: form.physical_address.trim(),
        business_phone_number: form.business_phone_number.trim(),
        website_or_social_media_link: form.website_or_social_media_link.trim(),
        business_type: form.business_type || undefined,
        requestType: form.requestType,
        notes: form.notes.trim(),
        contact_person: {
          full_name: form.contact_full_name.trim(),
          email_address: form.contact_email.trim(),
          phone_number: form.contact_phone.trim(),
          role_or_position: form.contact_role.trim(),
        },
        license_information: {
          license_number:    form.license_number.trim(),
          license_type:      form.license_type.trim(),
          issuing_authority: form.issuing_authority.trim(),
          jurisdiction:      form.jurisdiction.trim(),
        },
      });
      onSuccess();
    } catch (e) {
      toast.error(e.message || "Failed to create request");
    }
  };

  const inputStyle = (key) => ({
    height: "38px", padding: "0 12px", borderRadius: "10px",
    border: `0.8px solid ${errors[key] ? "#d64545" : "#dce7e1"}`,
    fontSize: "13px", fontFamily: "inherit", outline: "none",
    color: "#18212b", background: "#fff",
  });

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1100, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ background: "#fff", borderRadius: "24px", width: "100%", maxWidth: "640px", maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0px 32px 64px rgba(0,0,0,0.18)" }}>

        {/* Header */}
        <div style={{ padding: "24px 28px", borderBottom: "0.8px solid #dce7e1", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <h3 style={{ fontSize: "20px", fontWeight: 800, color: "#18212b", margin: 0 }}>New Request</h3>
            <p style={{ fontSize: "13px", color: "#617182", margin: "4px 0 0" }}>Manually create a pending request on behalf of an operator.</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "0.8px solid #dce7e1", borderRadius: "8px", width: "32px", height: "32px", cursor: "pointer", fontSize: "16px", color: "#617182" }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px", display: "flex", flexDirection: "column", gap: "24px" }}>

          {/* Request type — defaulted to claim, removed from UI */}

          {/* Business info */}
          <div>
            <p style={{ fontSize: "13px", fontWeight: 800, color: "#18212b", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>Business Info</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div style={{ gridColumn: "1/-1", display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "#617182", textTransform: "uppercase", letterSpacing: "0.6px" }}>Legal Business Name <span style={{ color: "#d64545" }}>*</span></label>
                <input value={form.legal_business_name} onChange={e => set("legal_business_name")(e.target.value)} style={inputStyle("legal_business_name")} />
              </div>
              <div style={{ gridColumn: "1/-1", display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "#617182", textTransform: "uppercase", letterSpacing: "0.6px" }}>Physical Address <span style={{ color: "#d64545" }}>*</span></label>
                <input value={form.physical_address} onChange={e => set("physical_address")(e.target.value)} style={inputStyle("physical_address")} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "#617182", textTransform: "uppercase", letterSpacing: "0.6px" }}>Business Phone <span style={{ color: "#d64545" }}>*</span></label>
                <input value={form.business_phone_number} onChange={e => set("business_phone_number")(e.target.value)} style={inputStyle("business_phone_number")} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "#617182", textTransform: "uppercase", letterSpacing: "0.6px" }}>Website / Social</label>
                <input value={form.website_or_social_media_link} onChange={e => set("website_or_social_media_link")(e.target.value)} style={inputStyle("website_or_social_media_link")} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "#617182", textTransform: "uppercase", letterSpacing: "0.6px" }}>Business Type</label>
                <select value={form.business_type} onChange={e => set("business_type")(e.target.value)} style={{ height: "38px", padding: "0 12px", borderRadius: "10px", border: "0.8px solid #dce7e1", fontSize: "13px", fontFamily: "inherit", outline: "none", background: "#fff", color: "#18212b" }}>
                  <option value="">— Select —</option>
                  <option value="smoke_shop">Smoke Shop</option>
                  <option value="cannabis_operator">Cannabis Operator</option>
                </select>
              </div>
            </div>
          </div>

          {/* Contact person */}
          <div>
            <p style={{ fontSize: "13px", fontWeight: 800, color: "#18212b", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>Contact Person</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              {[
                ["contact_full_name", "Full Name", true],
                ["contact_role", "Role / Position", true],
                ["contact_email", "Email Address", true],
                ["contact_phone", "Phone Number", true],
              ].map(([key, label, req]) => (
                <div key={key} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "#617182", textTransform: "uppercase", letterSpacing: "0.6px" }}>{label}{req && <span style={{ color: "#d64545" }}> *</span>}</label>
                  <input value={form[key]} onChange={e => set(key)(e.target.value)} style={inputStyle(key)} />
                </div>
              ))}
            </div>
          </div>

          {/* License info */}
          <div>
            <p style={{ fontSize: "13px", fontWeight: 800, color: "#18212b", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>License Info <span style={{ fontSize: "12px", fontWeight: 400, color: "#617182", textTransform: "none", letterSpacing: 0 }}>(optional)</span></p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              {[
                ["license_number", "License Number"],
                ["license_type", "License Type"],
                ["issuing_authority", "Issuing Authority"],
                ["jurisdiction", "Jurisdiction"],
              ].map(([key, label]) => (
                <div key={key} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "#617182", textTransform: "uppercase", letterSpacing: "0.6px" }}>{label}</label>
                  <input value={form[key]} onChange={e => set(key)(e.target.value)} style={inputStyle(key)} />
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ fontSize: "12px", fontWeight: 700, color: "#617182", textTransform: "uppercase", letterSpacing: "0.6px" }}>Internal Notes</label>
            <textarea value={form.notes} onChange={e => set("notes")(e.target.value)} rows={3} style={{ padding: "10px 12px", borderRadius: "10px", border: "0.8px solid #dce7e1", fontSize: "13px", fontFamily: "inherit", resize: "vertical", outline: "none" }} />
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "20px 28px", borderTop: "0.8px solid #dce7e1", display: "flex", gap: "10px", justifyContent: "flex-end", flexShrink: 0 }}>
          <button onClick={onClose} style={{ height: "42px", padding: "0 20px", borderRadius: "12px", background: "#fff", border: "0.8px solid #dce7e1", color: "#18212b", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>Cancel</button>
          <button onClick={handleSubmit} disabled={isPending} style={{ height: "42px", padding: "0 20px", borderRadius: "12px", backgroundImage: "linear-gradient(161deg,#1b6b46 0%,#2da96d 100%)", border: "none", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer", opacity: isPending ? 0.6 : 1 }}>
            {isPending ? "Creating…" : "Create Request"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────
function StatCard({ label, value, delta, deltaBg, deltaColor }) {
  return (
    <div style={{ background: "#fff", border: "0.8px solid #dce7e1", borderRadius: "24px", boxShadow: "0px 1px 2px 0px rgba(16,24,40,0.06)", padding: "20px" }}>
      <p style={{ fontSize: "14.08px", fontWeight: 400, color: C.textSecondary, marginBottom: "8px" }}>{label}</p>
      <p style={{ fontSize: "30.4px", fontWeight: 800, color: C.textPrimary, letterSpacing: "-0.912px", margin: 0 }}>{value}</p>
      <span style={{ display: "inline-flex", alignItems: "center", marginTop: "10px", padding: "6px 10px", borderRadius: "999px", background: deltaBg, color: deltaColor, fontSize: "13.12px", fontWeight: 800, whiteSpace: "nowrap" }}>{delta}</span>
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
    <button onClick={onClick} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "10.8px 12.8px", borderRadius: "12px", border: active ? "0.8px solid #2da96d" : "0.8px solid #dce7e1", background: active ? "#edf9f2" : "#fcfefd", cursor: "pointer" }}>
      <span style={{ fontSize: "14.72px", fontWeight: 400, color: active ? "#1f9d61" : C.textPrimary }}>{label}</span>
      <span style={{ fontSize: "13.12px", fontWeight: 700, color: C.textSecondary }}>{count}</span>
    </button>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminPendingRequests() {
  const queryClient = useQueryClient();

  const [search, setSearch]         = useState("");
  const [apiParams, setApiParams]   = useState({ limit: 50, page: 1 });
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [marketFilter, setMarketFilter] = useState("");
  const [scoreFilter, setScoreFilter]   = useState("");

  const [drawerRecord, setDrawerRecord]   = useState(null);
  const [rejectTarget, setRejectTarget]   = useState(null);
  const [approvingId, setApprovingId]     = useState(null);
  const [rejectingId, setRejectingId]     = useState(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [showNewRequest, setShowNewRequest] = useState(false);

  const { mutateAsync: approve  } = useApproveVerificationRequest();
  const { mutateAsync: reject   } = useRejectVerificationRequest();

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

  const { data: apiData, isLoading, isError } = useAdminPendingRequests(apiParams);

  const rawRecords = apiData?.data || [];
  const allMapped    = rawRecords.map(mapRequest);
  const stateOptions = apiData?.facets?.states || [];
  const records = allMapped;
  const selectedRecords = selectedRowKeys.map(k => rawRecords.find(r => r._id === k)).filter(Boolean);
  const canApproveSelection = selectedRecords.length > 0 && selectedRecords.every(r => r.status === "pending" || r.status === "in_review");
  const pagination = apiData?.pagination || {};
  const apiStats   = apiData?.stats || {};

  const approved    = apiStats.approvedCount     ?? 0;
  const rejected    = apiStats.rejectedCount     ?? 0;
  const autoVerif   = apiStats.autoVerifiedCount ?? 0;
  const decided     = approved + rejected + autoVerif;
  const conversionRate = decided > 0 ? Math.round(((approved + autoVerif) / decided) * 100) : null;

  const STATS = [
    { label: "Open Requests",     value: (apiStats.openRequests     ?? "—").toString(),       delta: "Across all request types", deltaBg: "#edf5ff", deltaColor: "#2f80ed" },
    { label: "Claim Business",    value: (apiStats.claimBusiness    ?? "—").toString(),       delta: "Highest intent",            deltaBg: "#edf9f2", deltaColor: "#1f9d61" },
    { label: "Duplicate Signals", value: (apiStats.duplicateSignals ?? "—").toString(),       delta: "Review before approval",    deltaBg: "#fff5eb", deltaColor: "#d9822b" },
    { label: "Conversion Rate",   value: conversionRate !== null ? `${conversionRate}%` : "—", delta: "Verified / Decided",        deltaBg: "#edf9f2", deltaColor: "#1f9d61" },
  ];

  const handleTypeFilter = (val) => {
    const next = typeFilter === val ? "" : val;
    setTypeFilter(next);
    setApiParams(p => {
      const u = { ...p, page: 1 };
      if (next) u.requestType = next; else delete u.requestType;
      return u;
    });
  };

  const handleStatusFilter = (val) => {
    const next = statusFilter === val ? "" : val;
    setStatusFilter(next);
    setApiParams(p => {
      const u = { ...p, page: 1 };
      if (next) u.status = next; else delete u.status;
      return u;
    });
  };

  const handleReset = () => {
    setSearch(""); setTypeFilter(""); setStatusFilter(""); setMarketFilter(""); setScoreFilter("");
    setApiParams({ limit: 50, page: 1 });
  };

  const handleApprove = async (requestId) => {
    const record = rawRecords.find(r => r._id === requestId);
    if (record && record.status !== "pending" && record.status !== "in_review") {
      toast.warning("Only pending or in-review requests can be approved.");
      return;
    }
    setApprovingId(requestId);
    try {
      await approve(requestId);
      toast.success("Request approved");
      queryClient.invalidateQueries({ queryKey: ["adminPendingRequests"] });
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
      toast.success("Request rejected");
      queryClient.invalidateQueries({ queryKey: ["adminPendingRequests"] });
      setRejectTarget(null);
      setDrawerRecord(null);
    } catch (e) {
      toast.error(e.message || "Failed to reject");
    } finally {
      setRejectingId(null);
    }
  };


  const columns = [
    {
      title: "Request",
      dataIndex: "name",
      key: "name",
      render: (_, row) => (
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <span style={{ fontWeight: 700, fontSize: "15.36px", color: C.textPrimary }}>{row.name}</span>
          <span style={{ fontSize: "12px", color: C.textSecondary, fontFamily: "monospace" }}>{row.sub}</span>
        </div>
      ),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: v => <TypeBadge type={v} />,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: v => <StatusBadge status={v} />,
    },
    {
      title: "Completeness",
      dataIndex: "completeness",
      key: "completeness",
      render: v => <CompletenessBar value={v} />,
    },
    {
      title: "Lead Source",
      dataIndex: "leadSource",
      key: "leadSource",
      render: v => <span style={{ fontSize: "13px", color: C.textSecondary }}>{v}</span>,
    },
    {
      title: "Duplicate",
      dataIndex: "duplicateFlag",
      key: "duplicate",
      render: v => v ? <DuplicateBadge /> : <span style={{ fontSize: "13px", color: C.textSecondary }}>No</span>,
    },
    {
      title: "Action",
      key: "actions",
      render: (_, row) => (
        <div style={{ display: "flex", gap: "8px" }} onClick={e => e.stopPropagation()}>
          <button
            onClick={() => setDrawerRecord(rawRecords.find(r => r._id === row.key))}
            style={{ height: "34px", padding: "0 14px", borderRadius: "10px", background: "#fff", border: "0.8px solid #dce7e1", color: C.textPrimary, fontSize: "12.5px", fontWeight: 700, cursor: "pointer" }}
          >
            View
          </button>
        </div>
      ),
    },
  ];

  return (
    <AdminShell>
      <div style={{ background: "linear-gradient(180deg,rgba(255,255,255,0.72) 0%,rgba(255,255,255,0.96) 100%)", border: "0.8px solid rgba(194,210,202,0.5)", borderRadius: "28px", boxShadow: "0px 8px 24px 0px rgba(13,59,42,0.08)", overflow: "clip" }}>

        {/* Sticky header */}
        <div style={{ position: "sticky", top: 0, zIndex: 10, background: "rgba(255,255,255,0.76)", borderBottom: "0.8px solid #dce7e1", padding: "24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "24px", backdropFilter: "blur(8px)" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <h1 style={{ fontSize: "28.8px", fontWeight: 800, color: C.textPrimary, letterSpacing: "-0.576px", margin: 0 }}>Claim Requests History</h1>
            <p style={{ fontSize: "15.36px", color: C.textSecondary, maxWidth: "620px", margin: 0 }}>
              Operator intake and claim-my-business workflow with structured search, review, and approval tracking.
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#8090a3", fontSize: "14.4px", pointerEvents: "none" }}>⌕</span>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search business name, email, phone…"
                  style={{ width: "320px", height: "48px", paddingLeft: "44px", paddingRight: "18px", borderRadius: "999px", border: "0.8px solid #dce7e1", background: "#fff", fontSize: "13.333px", color: C.textPrimary, outline: "none", fontFamily: "inherit" }}
                />
              </div>
              <button
                onClick={() => setShowNewRequest(true)}
                style={{ height: "42px", padding: "0 16px", borderRadius: "12px", backgroundImage: "linear-gradient(161deg,#1b6b46 0%,#2da96d 100%)", border: "none", color: "#fff", fontSize: "13.333px", fontWeight: 700, cursor: "pointer" }}
              >
                + New Request
              </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>

          {/* Hero — commented out
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "18px" }}>
            <div ...>Layer 1 · Structured Claim & Listing Requests</div>
            <div ...>Layer 2 · Operator Conversion View</div>
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
            <div style={{ position: "sticky", top: "24px", alignSelf: "start", background: "#fff", border: "0.8px solid #dce7e1", borderRadius: "24px", boxShadow: "0px 1px 2px 0px rgba(16,24,40,0.06)", padding: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
                <span style={{ fontSize: "16px", fontWeight: 800, color: C.textPrimary }}>Request Filters</span>
                <button onClick={handleReset} style={{ fontSize: "14.08px", fontWeight: 700, color: "#1b6b46", background: "none", border: "none", cursor: "pointer", padding: 0 }}>Reset</button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

                {/* Request Type */}
                <div>
                  <label style={{ display: "block", fontSize: "13.76px", fontWeight: 800, color: C.textPrimary, marginBottom: "8px" }}>Request Type</label>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <FilterRow label="Claim Business" count={apiStats.claimBusiness ?? "—"} active={typeFilter === "claim"} onClick={() => handleTypeFilter("claim")} />
                    {/* <FilterRow label="Verify Business" count={apiStats.verifyBusiness ?? "—"} active={typeFilter === "verify"} onClick={() => handleTypeFilter("verify")} /> */}
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label style={{ display: "block", fontSize: "13.76px", fontWeight: 800, color: C.textPrimary, marginBottom: "8px" }}>Status</label>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {[
                      ["New",           "pending",       apiStats.pendingCount],
                      ["Approved",      "approved",      apiStats.approvedCount],
                      ["Rejected",      "rejected",      apiStats.rejectedCount],
                      ["Auto Verified", "auto_verified", apiStats.autoVerifiedCount],
                    ].map(([label, val, count]) => (
                      <FilterRow key={val} label={label} count={count ?? "—"} active={statusFilter === val} onClick={() => handleStatusFilter(val)} />
                    ))}
                  </div>
                </div>

                {/* Market Priority */}
                <div>
                  <label style={{ display: "block", fontSize: "13.76px", fontWeight: 800, color: C.textPrimary, marginBottom: "8px" }}>Market Priority</label>
                  <select
                    value={marketFilter}
                    onChange={e => {
                      const val = e.target.value;
                      setMarketFilter(val);
                      setApiParams(p => { const u = { ...p, page: 1 }; if (val) u.market = val; else delete u.market; return u; });
                    }}
                    style={{ width: "100%", height: "42px", padding: "0 12px", borderRadius: "12px", border: "0.8px solid #dce7e1", background: "#fff", fontSize: "14.72px", color: C.textPrimary, outline: "none", cursor: "pointer", boxSizing: "border-box" }}
                  >
                    <option value="">All Markets</option>
                    {stateOptions.map(s => <option key={s._id} value={s._id}>{STATE_NAMES[s._id] || s._id} ({s.count})</option>)}
                  </select>
                </div>

                {/* Completeness Score */}
                <div>
                  <label style={{ display: "block", fontSize: "13.76px", fontWeight: 800, color: C.textPrimary, marginBottom: "8px" }}>Completeness Score</label>
                  <select
                    value={scoreFilter}
                    onChange={e => {
                      const val = e.target.value;
                      setScoreFilter(val);
                      setApiParams(p => {
                        const u = { ...p, page: 1 };
                        if (val) { const [min, max] = val.split("-"); u.minScore = min; u.maxScore = max; }
                        else { delete u.minScore; delete u.maxScore; }
                        return u;
                      });
                    }}
                    style={{ width: "100%", height: "42px", padding: "0 12px", borderRadius: "12px", border: "0.8px solid #dce7e1", background: "#fff", fontSize: "14.72px", color: C.textPrimary, outline: "none", cursor: "pointer", boxSizing: "border-box" }}
                  >
                    <option value="">Any Score</option>
                    <option value="0-25">0–25%</option>
                    <option value="26-50">26–50%</option>
                    <option value="51-75">51–75%</option>
                    <option value="76-100">76–100%</option>
                  </select>
                </div>

              </div>
            </div>

            {/* Right: table */}
            <div>
              <div style={{ background: "#fff", border: "0.8px solid #dce7e1", borderRadius: "24px", boxShadow: "0px 1px 2px 0px rgba(16,24,40,0.06)", overflow: "clip", padding: "0.8px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px", borderBottom: "0.8px solid #dce7e1" }}>
                  <div>
                    <p style={{ fontSize: "16.32px", fontWeight: 800, color: C.textPrimary, margin: 0 }}>Requests History</p>
                    <p style={{ fontSize: "14.4px", color: C.textSecondary, margin: "4px 0 0" }}>Click any row for full details. Approve or reject directly from the table.</p>
                  </div>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    {selectedRowKeys.length > 0 && <span style={{ fontSize: "13px", color: C.textSecondary }}>{selectedRowKeys.length} selected</span>}
                    {/* <button
                      onClick={() => { if (drawerRecord) setDrawerRecord(drawerRecord); else if (selectedRowKeys.length) setDrawerRecord(rawRecords.find(r => r._id === selectedRowKeys[0])); }}
                      style={{ height: "42px", padding: "0 16px", borderRadius: "12px", background: "#fff", border: "0.8px solid #dce7e1", color: C.textPrimary, fontSize: "13.333px", fontWeight: 700, cursor: "pointer" }}
                    >
                      Message Operator
                    </button> */}
                    <button
                      onClick={() => canApproveSelection && handleApprove(selectedRowKeys[0])}
                      disabled={!canApproveSelection}
                      title={!canApproveSelection && selectedRowKeys.length ? "Only pending or in-review requests can be approved" : ""}
                      style={{ height: "42px", padding: "0 16px", borderRadius: "12px", background: canApproveSelection ? "linear-gradient(170deg,#1b6b46,#2da96d)" : "#fff", border: canApproveSelection ? "none" : "0.8px solid #dce7e1", color: canApproveSelection ? "#fff" : C.textSecondary, fontSize: "13.333px", fontWeight: 700, cursor: canApproveSelection ? "pointer" : "default" }}
                    >
                      Approve
                    </button>
                  </div>
                </div>

                {isError && <div style={{ padding: "24px", color: "#d64545" }}>Failed to load pending requests.</div>}

                <ConfigProvider theme={{ components: { Table: { headerBg: "#f1f7f4", headerColor: "#617182", headerSplitColor: "transparent", borderColor: "#dce7e1", rowHoverBg: "#f7fbf9", cellPaddingBlock: 16, cellPaddingInline: 16 } } }}>
                  <Table
                    dataSource={records}
                    columns={columns}
                    size="middle"
                    loading={isLoading}
                    scroll={{ x: "max-content" }}
                    style={{ fontFamily: "Inter, sans-serif" }}
                    locale={{ emptyText: isLoading ? "Loading…" : "No requests found" }}
                    rowSelection={{ selectedRowKeys, onChange: keys => setSelectedRowKeys(keys) }}
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

      <RequestDrawer
        record={drawerRecord}
        onClose={() => setDrawerRecord(null)}
        onApprove={handleApprove}
        onReject={r => setRejectTarget(r)}
        approving={approvingId === drawerRecord?._id}
        rejecting={rejectingId === drawerRecord?._id}
      />

      {rejectTarget && (
        <RejectModal
          requestId={rejectTarget._id}
          businessName={rejectTarget.legal_business_name}
          onClose={() => setRejectTarget(null)}
          onConfirm={handleRejectConfirm}
          loading={!!rejectingId}
        />
      )}

      {showNewRequest && (
        <NewRequestModal
          onClose={() => setShowNewRequest(false)}
          onSuccess={() => {
            setShowNewRequest(false);
            toast.success("Request created successfully");
            queryClient.invalidateQueries({ queryKey: ["adminPendingRequests"] });
          }}
        />
      )}
    </AdminShell>
  );
}
