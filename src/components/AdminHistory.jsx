import React, { useState } from "react";
import AdminLayout from "./AdminLayout";
import { useVerificationHistory } from "../services/admin";

const STATUS_TABS = [
  { label: "All", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
  { label: "Auto Verified", value: "auto_verified" },
];

const BUSINESS_TYPE_TABS = [
  { label: "All", value: "" },
  { label: "Cannabis Operators", value: "cannabis_operator" },
  { label: "Smoke Shops", value: "smoke_shop" },
];

const STATUS_STYLE = {
  pending: { bg: "#fef3c7", color: "#92400e" },
  approved: { bg: "#dcfce7", color: "#15803d" },
  rejected: { bg: "#fee2e2", color: "#991b1b" },
  auto_verified: { bg: "#dbeafe", color: "#1e40af" },
};

const DetailRow = ({ label, value }) => (
  <div style={{ display: "grid", gridTemplateColumns: "150px 1fr", gap: 12, padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
    <dt style={{ fontWeight: "600", color: "#64748b" }}>{label}:</dt>
    <dd style={{ margin: 0, color: "#1e293b", wordBreak: "break-word" }}>{value || "N/A"}</dd>
  </div>
);

const FilterTab = ({ tabs, active, onChange }) => (
  <div style={{ display: "flex", gap: "4px", background: "#f1f5f9", borderRadius: "10px", padding: "3px" }}>
    {tabs.map((tab) => (
      <button
        key={tab.value}
        onClick={() => onChange(tab.value)}
        style={{
          padding: "7px 14px",
          border: "none",
          borderRadius: "8px",
          fontSize: "13px",
          fontWeight: "600",
          cursor: "pointer",
          transition: "all 0.2s ease",
          background: active === tab.value ? "#ffffff" : "transparent",
          color: active === tab.value ? "#10b981" : "#64748b",
          boxShadow: active === tab.value ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
          whiteSpace: "nowrap",
        }}>
        {tab.label}
      </button>
    ))}
  </div>
);

const AdminHistory = () => {
  const [status, setStatus] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [page, setPage] = useState(1);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const { data, isLoading } = useVerificationHistory({ status, businessType, page, limit: 50 });

  const requests = data?.data || [];
  const pagination = data?.pagination || {};

  const handleStatusChange = (val) => { setStatus(val); setPage(1); };
  const handleTypeChange = (val) => { setBusinessType(val); setPage(1); };

  return (
    <AdminLayout>
      <div style={{ background: "#051D17", borderRadius: "20px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)", border: "1px solid #e2e8f0", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ background: "#051D17", borderBottom: "1px solid #e2e8f0", padding: "24px 32px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#1e293b", margin: "0 0 4px 0" }}>Verification History</h1>
          <p style={{ color: "#64748b", fontSize: "15px", margin: 0 }}>All verification requests across all statuses</p>
        </div>

        <div style={{ padding: "24px 32px" }}>
          {/* Filters */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "13px", fontWeight: "600", color: "#64748b", minWidth: "80px" }}>Status</span>
              <FilterTab tabs={STATUS_TABS} active={status} onChange={handleStatusChange} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "13px", fontWeight: "600", color: "#64748b", minWidth: "80px" }}>Type</span>
              <FilterTab tabs={BUSINESS_TYPE_TABS} active={businessType} onChange={handleTypeChange} />
            </div>
          </div>

          {/* Results count */}
          {!isLoading && (
            <div style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "14px", color: "#64748b" }}>
                {pagination.total ?? requests.length} result{(pagination.total ?? requests.length) !== 1 ? "s" : ""}
              </span>
            </div>
          )}

          {/* Table */}
          {isLoading ? (
            <div style={{ textAlign: "center", padding: "60px", color: "#64748b" }}>Loading history...</div>
          ) : requests.length > 0 ? (
            <>
              <div style={{ overflowX: "auto", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", background: "#fff" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc" }}>
                      {["Business Name", "Type", "Method", "Status", "Email", "Date", ""].map((h, i) => (
                        <th key={i} style={{ padding: "14px 20px", textAlign: i === 6 ? "center" : "left", fontWeight: "600", color: "#374151", fontSize: "13px", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((req, i) => {
                      const style = STATUS_STYLE[req.status] || { bg: "#f1f5f9", color: "#475569" };
                      return (
                        <tr
                          key={req._id || i}
                          style={{ borderBottom: i < requests.length - 1 ? "1px solid #f1f5f9" : "none" }}
                          onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"}
                          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                          <td style={{ padding: "14px 20px", fontWeight: "600", color: "#1e293b" }}>{req.legal_business_name || "N/A"}</td>
                          <td style={{ padding: "14px 20px" }}>
                            <span style={{ padding: "3px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: "600", whiteSpace: "nowrap", background: req.business_type === "cannabis_operator" ? "#f0fdf4" : "#fef9c3", color: req.business_type === "cannabis_operator" ? "#15803d" : "#854d0e" }}>
                              {req.business_type === "cannabis_operator" ? "Cannabis" : req.business_type === "smoke_shop" ? "Smoke Shop" : "—"}
                            </span>
                          </td>
                          <td style={{ padding: "14px 20px" }}>
                            <span style={{ padding: "3px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: "600", whiteSpace: "nowrap", background: req.verification_method === "auto" ? "#ede9fe" : "#f1f5f9", color: req.verification_method === "auto" ? "#6d28d9" : "#475569" }}>
                              {req.verification_method === "auto" ? "Auto" : req.verification_method === "manual" ? "Manual" : "—"}
                            </span>
                          </td>
                          <td style={{ padding: "14px 20px" }}>
                            <span style={{ padding: "3px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: "600", whiteSpace: "nowrap", background: style.bg, color: style.color }}>
                              {req.status === "auto_verified" ? "Auto Verified" : req.status ? req.status.charAt(0).toUpperCase() + req.status.slice(1) : "—"}
                            </span>
                          </td>
                          <td style={{ padding: "14px 20px", color: "#64748b" }}>{req.contact_person?.email_address || "N/A"}</td>
                          <td style={{ padding: "14px 20px", color: "#94a3b8", whiteSpace: "nowrap", fontSize: "13px" }}>
                            {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : "N/A"}
                          </td>
                          <td style={{ padding: "14px 20px", textAlign: "center" }}>
                            <button
                              onClick={() => setSelectedRequest(req)}
                              style={{ background: "linear-gradient(135deg, #2563eb, #1d4ed8)", color: "#fff", border: "none", borderRadius: "7px", padding: "6px 14px", fontWeight: "600", fontSize: "12px", cursor: "pointer" }}>
                              View
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", marginTop: "24px" }}>
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    style={{ padding: "8px 16px", border: "1px solid #e2e8f0", borderRadius: "8px", background: "#fff", color: page === 1 ? "#cbd5e1" : "#475569", fontWeight: "600", fontSize: "14px", cursor: page === 1 ? "not-allowed" : "pointer" }}>
                    Prev
                  </button>
                  <span style={{ fontSize: "14px", color: "#64748b" }}>Page {page} of {pagination.pages}</span>
                  <button
                    onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                    disabled={page === pagination.pages}
                    style={{ padding: "8px 16px", border: "1px solid #e2e8f0", borderRadius: "8px", background: "#fff", color: page === pagination.pages ? "#cbd5e1" : "#475569", fontWeight: "600", fontSize: "14px", cursor: page === pagination.pages ? "not-allowed" : "pointer" }}>
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "60px 32px", background: "#f8fafc", borderRadius: "12px", border: "2px dashed #cbd5e1" }}>
              <div style={{ fontSize: "36px", marginBottom: "12px" }}>📋</div>
              <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#475569", margin: "0 0 6px 0" }}>No records found</h3>
              <p style={{ color: "#94a3b8", margin: 0 }}>No verification history matches the selected filters.</p>
            </div>
          )}
        </div>
      </div>

      {/* Details Modal */}
      {selectedRequest && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={() => setSelectedRequest(null)}>
          <div style={{ background: "#fff", borderRadius: "16px", padding: "32px", minWidth: "500px", maxWidth: "700px", maxHeight: "85vh", overflowY: "auto", boxShadow: "0 8px 32px rgba(0,0,0,0.18)", position: "relative" }} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSelectedRequest(null)} style={{ position: "absolute", top: 20, right: 20, background: "#f1f5f9", border: "none", borderRadius: "50%", width: 36, height: 36, fontSize: 20, cursor: "pointer", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
            <h2 style={{ marginTop: 0, marginBottom: 24, color: "#1e293b", fontWeight: 700, fontSize: 22, paddingRight: 40 }}>Request Details</h2>
            <div style={{ fontSize: "14px" }}>
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: "#1e293b", marginBottom: 10, borderBottom: "2px solid #e2e8f0", paddingBottom: 6 }}>Business Information</h3>
                <DetailRow label="Business Name" value={selectedRequest.legal_business_name} />
                <DetailRow label="Business Type" value={selectedRequest.business_type === "cannabis_operator" ? "Cannabis Operator" : selectedRequest.business_type === "smoke_shop" ? "Smoke Shop" : selectedRequest.business_type} />
                <DetailRow label="Verification Method" value={selectedRequest.verification_method === "auto" ? "Auto" : "Manual"} />
                <DetailRow label="Status" value={selectedRequest.status === "auto_verified" ? "Auto Verified" : selectedRequest.status ? selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1) : null} />
                <DetailRow label="Address" value={selectedRequest.physical_address} />
                <DetailRow label="Phone" value={selectedRequest.business_phone_number} />
                <DetailRow label="Website" value={selectedRequest.website_or_social_media_link} />
              </div>
              {selectedRequest.contact_person && (
                <div style={{ marginBottom: 20 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: "#1e293b", marginBottom: 10, borderBottom: "2px solid #e2e8f0", paddingBottom: 6 }}>Contact Person</h3>
                  <DetailRow label="Full Name" value={selectedRequest.contact_person.full_name} />
                  <DetailRow label="Email" value={selectedRequest.contact_person.email_address} />
                  <DetailRow label="Phone" value={selectedRequest.contact_person.phone_number} />
                  <DetailRow label="Role" value={selectedRequest.contact_person.role_or_position} />
                </div>
              )}
              {selectedRequest.license_information && (
                <div style={{ marginBottom: 20 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: "#1e293b", marginBottom: 10, borderBottom: "2px solid #e2e8f0", paddingBottom: 6 }}>License Information</h3>
                  <DetailRow label="License Number" value={selectedRequest.license_information.license_number} />
                  <DetailRow label="Issuing Authority" value={selectedRequest.license_information.issuing_authority} />
                  <DetailRow label="License Type" value={selectedRequest.license_information.license_type} />
                  <DetailRow label="Jurisdiction" value={selectedRequest.license_information.jurisdiction} />
                  <DetailRow label="Expiration Date" value={selectedRequest.license_information.expiration_date ? new Date(selectedRequest.license_information.expiration_date).toLocaleDateString() : null} />
                </div>
              )}
              {(selectedRequest.uploaded_documents?.state_license_document || selectedRequest.uploaded_documents?.utility_bill || selectedRequest.contact_person?.government_issued_id_document) && (
                <div style={{ marginBottom: 20 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: "#1e293b", marginBottom: 10, borderBottom: "2px solid #e2e8f0", paddingBottom: 6 }}>Documents</h3>
                  {selectedRequest.uploaded_documents?.state_license_document && <DetailRow label="State License" value={<a href={selectedRequest.uploaded_documents.state_license_document} target="_blank" rel="noopener noreferrer" style={{ color: "#2563eb" }}>View</a>} />}
                  {selectedRequest.uploaded_documents?.utility_bill && <DetailRow label="Utility Bill" value={<a href={selectedRequest.uploaded_documents.utility_bill} target="_blank" rel="noopener noreferrer" style={{ color: "#2563eb" }}>View</a>} />}
                  {selectedRequest.contact_person?.government_issued_id_document && <DetailRow label="Government ID" value={<a href={selectedRequest.contact_person.government_issued_id_document} target="_blank" rel="noopener noreferrer" style={{ color: "#2563eb" }}>View</a>} />}
                </div>
              )}
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: "#1e293b", marginBottom: 10, borderBottom: "2px solid #e2e8f0", paddingBottom: 6 }}>Submission</h3>
                <DetailRow label="Submitted" value={selectedRequest.createdAt ? new Date(selectedRequest.createdAt).toLocaleString() : null} />
                {selectedRequest.notes && <DetailRow label="Notes" value={selectedRequest.notes} />}
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminHistory;
