import React, { useState } from "react";
import AdminLayout from "./AdminLayout";
import {
  usePendingVerificationRequests,
  useApproveVerificationRequest,
  useRejectVerificationRequest,
} from "../services/admin";
import { toast } from "react-toastify";

const BUSINESS_TYPE_TABS = [
  { label: "All", value: "" },
  { label: "Cannabis Operators", value: "cannabis_operator" },
  { label: "Smoke Shops", value: "smoke_shop" },
];

const STATUS_COLORS = {
  pending: { bg: "#fef3c7", color: "#92400e" },
};

const DetailRow = ({ label, value }) => (
  <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 12, padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
    <dt style={{ fontWeight: "600", color: "#64748b" }}>{label}:</dt>
    <dd style={{ margin: 0, color: "#1e293b", wordBreak: "break-word" }}>{value || "N/A"}</dd>
  </div>
);

const AdminVerificationRequests = () => {
  const [businessType, setBusinessType] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [approvingId, setApprovingId] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [requestToReject, setRequestToReject] = useState(null);

  const { data, isLoading, refetch } = usePendingVerificationRequests(businessType);
  const approveMutation = useApproveVerificationRequest();
  const rejectMutation = useRejectVerificationRequest();

  const requests = data?.requests || data?.data || [];

  const handleApprove = async (requestId) => {
    setApprovingId(requestId);
    try {
      await approveMutation.mutateAsync(requestId);
      toast.success("Request approved successfully!");
      refetch();
    } catch (error) {
      toast.error(error.message || "Failed to approve request");
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = (requestId) => {
    setRequestToReject(requestId);
    setShowRejectModal(true);
  };

  const confirmReject = async () => {
    if (!requestToReject) return;
    try {
      await rejectMutation.mutateAsync({ requestId: requestToReject, reason: rejectReason || "No reason provided" });
      toast.success("Request rejected successfully!");
      setShowRejectModal(false);
      setRejectReason("");
      setRequestToReject(null);
      refetch();
    } catch (error) {
      toast.error(error.message || "Failed to reject request");
    }
  };

  const cancelReject = () => {
    setShowRejectModal(false);
    setRejectReason("");
    setRequestToReject(null);
  };

  return (
    <AdminLayout>
      <div style={{ background: "#ffffff", borderRadius: "20px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)", border: "1px solid #e2e8f0", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ background: "linear-gradient(135deg, #f8fafc, #f1f5f9)", borderBottom: "1px solid #e2e8f0", padding: "24px 32px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#1e293b", margin: "0 0 4px 0" }}>Verification Requests</h1>
          <p style={{ color: "#64748b", fontSize: "15px", margin: 0 }}>Review and manage pending business verification claims</p>
        </div>

        <div style={{ padding: "24px 32px" }}>
          {/* Business Type Tabs + Actions Row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
            {/* Tabs */}
            <div style={{ display: "flex", gap: "6px", background: "#f1f5f9", borderRadius: "12px", padding: "4px" }}>
              {BUSINESS_TYPE_TABS.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setBusinessType(tab.value)}
                  style={{
                    padding: "8px 18px",
                    border: "none",
                    borderRadius: "9px",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    background: businessType === tab.value ? "#ffffff" : "transparent",
                    color: businessType === tab.value ? "#10b981" : "#64748b",
                    boxShadow: businessType === tab.value ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                  }}>
                  {tab.label}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              {!isLoading && (
                <div style={{ background: "linear-gradient(135deg, #10b981, #059669)", color: "#fff", borderRadius: "10px", padding: "6px 14px", fontSize: "13px", fontWeight: "600" }}>
                  {requests.length} pending
                </div>
              )}
              <button
                className="admin-primary-action"
                onClick={() => refetch()}
                style={{ padding: "10px 18px", background: "linear-gradient(135deg, #10b981, #059669)", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "600", fontSize: "14px", cursor: "pointer", boxShadow: "0 2px 4px rgba(16,185,129,0.2)" }}>
                Refresh
              </button>
            </div>
          </div>

          {/* Table */}
          {isLoading ? (
            <div style={{ textAlign: "center", padding: "60px", color: "#64748b", fontSize: "16px" }}>Loading requests...</div>
          ) : requests.length > 0 ? (
            <div style={{ overflowX: "auto", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", background: "#fff" }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    {["Business Name", "Type", "Email", "Submitted", "Actions"].map((h) => (
                      <th key={h} style={{ padding: "14px 20px", textAlign: h === "Actions" ? "center" : "left", fontWeight: "600", color: "#374151", fontSize: "13px", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req, i) => (
                    <tr
                      key={req._id || i}
                      style={{ borderBottom: i < requests.length - 1 ? "1px solid #f1f5f9" : "none" }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                      <td style={{ padding: "16px 20px", fontWeight: "600", color: "#1e293b" }}>{req.legal_business_name || "N/A"}</td>
                      <td style={{ padding: "16px 20px" }}>
                        <span style={{
                          padding: "3px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: "600",
                          background: req.business_type === "cannabis_operator" ? "#f0fdf4" : "#fef9c3",
                          color: req.business_type === "cannabis_operator" ? "#15803d" : "#854d0e",
                        }}>
                          {req.business_type === "cannabis_operator" ? "Cannabis" : req.business_type === "smoke_shop" ? "Smoke Shop" : "—"}
                        </span>
                      </td>
                      <td style={{ padding: "16px 20px", color: "#64748b" }}>{req.contact_person?.email_address || "N/A"}</td>
                      <td style={{ padding: "16px 20px", color: "#64748b", whiteSpace: "nowrap" }}>
                        {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : "N/A"}
                      </td>
                      <td style={{ padding: "16px 20px", textAlign: "center" }}>
                        <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                          <button className="admin-primary-action" onClick={() => handleApprove(req._id)} disabled={approvingId === req._id}
                            style={{ background: "linear-gradient(135deg, #10b981, #059669)", color: "#fff", border: "none", borderRadius: "7px", padding: "7px 14px", fontWeight: "600", fontSize: "13px", cursor: approvingId === req._id ? "not-allowed" : "pointer", opacity: approvingId === req._id ? 0.6 : 1 }}>
                            {approvingId === req._id ? "..." : "Approve"}
                          </button>
                          <button onClick={() => handleReject(req._id)} disabled={requestToReject === req._id && rejectMutation.isPending}
                            style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)", color: "#fff", border: "none", borderRadius: "7px", padding: "7px 14px", fontWeight: "600", fontSize: "13px", cursor: "pointer" }}>
                            Reject
                          </button>
                          <button onClick={() => { setSelectedRequest(req); setShowModal(true); }}
                            style={{ background: "linear-gradient(135deg, #2563eb, #1d4ed8)", color: "#fff", border: "none", borderRadius: "7px", padding: "7px 14px", fontWeight: "600", fontSize: "13px", cursor: "pointer" }}>
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "60px 32px", background: "#f8fafc", borderRadius: "12px", border: "2px dashed #cbd5e1" }}>
              <div style={{ fontSize: "40px", marginBottom: "12px" }}>✓</div>
              <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#475569", margin: "0 0 6px 0" }}>All caught up!</h3>
              <p style={{ color: "#94a3b8", margin: 0 }}>No pending requests{businessType ? ` for ${businessType === "cannabis_operator" ? "cannabis operators" : "smoke shops"}` : ""}.</p>
            </div>
          )}
        </div>
      </div>

      {/* Details Modal */}
      {showModal && selectedRequest && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={() => setShowModal(false)}>
          <div style={{ background: "#fff", borderRadius: "16px", padding: "32px", minWidth: "500px", maxWidth: "700px", maxHeight: "85vh", overflowY: "auto", boxShadow: "0 8px 32px rgba(0,0,0,0.18)", position: "relative" }} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowModal(false)} style={{ position: "absolute", top: 20, right: 20, background: "#f1f5f9", border: "none", borderRadius: "50%", width: 36, height: 36, fontSize: 20, cursor: "pointer", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
            <h2 style={{ marginTop: 0, marginBottom: 24, color: "#1e293b", fontWeight: 700, fontSize: 22, paddingRight: 40 }}>Request Details</h2>
            <div style={{ fontSize: "14px" }}>
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: "#1e293b", marginBottom: 10, borderBottom: "2px solid #e2e8f0", paddingBottom: 6 }}>Business Information</h3>
                <DetailRow label="Business Name" value={selectedRequest.legal_business_name} />
                <DetailRow label="Business Type" value={selectedRequest.business_type === "cannabis_operator" ? "Cannabis Operator" : selectedRequest.business_type === "smoke_shop" ? "Smoke Shop" : selectedRequest.business_type} />
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

      {/* Reject Modal */}
      {showRejectModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1001 }} onClick={cancelReject}>
          <div style={{ background: "#fff", borderRadius: "16px", padding: "32px", width: "90%", maxWidth: "480px", boxShadow: "0 8px 32px rgba(0,0,0,0.18)", position: "relative" }} onClick={(e) => e.stopPropagation()}>
            <button onClick={cancelReject} style={{ position: "absolute", top: 16, right: 16, background: "#f1f5f9", border: "none", borderRadius: "50%", width: 32, height: 32, fontSize: 18, cursor: "pointer", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
            <h2 style={{ marginTop: 0, marginBottom: 8, color: "#1e293b", fontWeight: 700, fontSize: 20 }}>Reject Request</h2>
            <p style={{ margin: "0 0 20px 0", color: "#64748b", fontSize: 14 }}>Please provide a reason for rejection.</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason..."
              rows={4}
              style={{ width: "100%", padding: "12px", border: "2px solid #e2e8f0", borderRadius: "8px", fontSize: 14, fontFamily: "inherit", resize: "vertical", outline: "none", boxSizing: "border-box" }}
              onFocus={(e) => e.target.style.borderColor = "#ef4444"}
              onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
            />
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
              <button onClick={cancelReject} style={{ padding: "10px 20px", background: "#f1f5f9", color: "#64748b", border: "none", borderRadius: "8px", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>Cancel</button>
              <button onClick={confirmReject} disabled={rejectMutation.isPending} style={{ padding: "10px 20px", background: "linear-gradient(135deg, #ef4444, #dc2626)", color: "#fff", border: "none", borderRadius: "8px", fontWeight: 600, fontSize: 14, cursor: rejectMutation.isPending ? "not-allowed" : "pointer", opacity: rejectMutation.isPending ? 0.6 : 1 }}>
                {rejectMutation.isPending ? "Rejecting..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminVerificationRequests;
