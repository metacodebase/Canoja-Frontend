import React, { useState } from "react";
import AdminLayout from "./AdminLayout";
import {
  usePendingVerificationRequests,
  useApproveVerificationRequest,
  useRejectVerificationRequest,
} from "../services/admin";
import { toast } from "react-toastify";

// Helper component for consistent detail rows
const DetailRow = ({ label, value }) => (
  <div style={{
    display: "grid",
    gridTemplateColumns: "140px 1fr",
    gap: 12,
    padding: "8px 0",
    borderBottom: "1px solid #f1f5f9",
  }}>
    <dt style={{
      fontWeight: "600",
      color: "#64748b",
    }}>
      {label}:
    </dt>
    <dd style={{
      margin: 0,
      color: "#1e293b",
      wordBreak: "break-word",
    }}>
      {value || "N/A"}
    </dd>
  </div>
);

const AdminVerificationDashboard = () => {
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [approvingId, setApprovingId] = useState(null);

  const [showRejectModal, setShowRejectModal] = useState(false);
const [rejectReason, setRejectReason] = useState("");
const [requestToReject, setRequestToReject] = useState(null);

  const { data: requests, isLoading, refetch } = usePendingVerificationRequests();
  const approveMutation = useApproveVerificationRequest();
  const rejectMutation = useRejectVerificationRequest();

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

  const handleReject = async (requestId) => {
  setRequestToReject(requestId);
  setShowRejectModal(true);
};

const confirmReject = async () => {
  if (!requestToReject) return;
  
  try {
    await rejectMutation.mutateAsync({ 
      requestId: requestToReject, 
      reason: rejectReason || "No reason provided" 
    });
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

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setShowModal(true);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "400px",
          fontSize: "18px",
          color: "#64748b"
        }}>
          Loading verification requests...
        </div>
      </AdminLayout>
    );
  }

  const pendingRequests = requests?.requests || requests?.data || [];

  return (
    <AdminLayout>
      <div style={{
        background: "#ffffff",
        borderRadius: "20px",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
        border: "1px solid #e2e8f0",
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, #f8fafc, #f1f5f9)",
          borderBottom: "1px solid #e2e8f0",
          padding: "24px 32px",
        }}>
          <h1 style={{
            fontSize: "28px",
            fontWeight: "700",
            color: "#1e293b",
            margin: "0 0 8px 0",
          }}>
            Verification Requests Dashboard
          </h1>
          <p style={{
            color: "#64748b",
            fontSize: "16px",
            margin: 0,
          }}>
            Review and manage business verification claims
          </p>
        </div>

        {/* Content */}
        <div style={{ padding: "32px" }}>
          <div style={{
            marginBottom: "24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <div style={{
              background: "linear-gradient(135deg, #10b981, #059669)",
              color: "#fff",
              borderRadius: "12px",
              padding: "8px 16px",
              fontSize: "14px",
              fontWeight: "600",
              boxShadow: "0 2px 4px rgba(16, 185, 129, 0.2)",
            }}>
              {pendingRequests.length} Pending Request{pendingRequests.length !== 1 ? "s" : ""}
            </div>
            <button
              className="admin-primary-action"
              onClick={() => refetch()}
              style={{
                padding: "12px 20px",
                background: "linear-gradient(135deg, #10b981, #059669)",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontWeight: "600",
                fontSize: "14px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: "0 2px 4px rgba(16, 185, 129, 0.2)",
              }}>
              🔄 Refresh
            </button>
          </div>

          {pendingRequests.length > 0 ? (
            <div style={{
              overflowX: "auto",
              borderRadius: "12px",
              border: "1px solid #e2e8f0"
            }}>
              <table style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "15px",
                background: "#ffffff",
              }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    <th style={{
                      padding: "16px 20px",
                      textAlign: "left",
                      fontWeight: "600",
                      color: "#374151",
                      fontSize: "14px",
                    }}>
                      Business Name
                    </th>
                    <th style={{
                      padding: "16px 20px",
                      textAlign: "left",
                      fontWeight: "600",
                      color: "#374151",
                      fontSize: "14px",
                    }}>
                      Email
                    </th>
                    <th style={{
                      padding: "16px 20px",
                      textAlign: "left",
                      fontWeight: "600",
                      color: "#374151",
                      fontSize: "14px",
                    }}>
                      Status
                    </th>
                    <th style={{
                      padding: "16px 20px",
                      textAlign: "center",
                      fontWeight: "600",
                      color: "#374151",
                      fontSize: "14px",
                    }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pendingRequests.map((request, index) => (
                    <tr
                      key={request._id || index}
                      style={{
                        borderBottom: index < pendingRequests.length - 1 ? "1px solid #f1f5f9" : "none",
                        transition: "background-color 0.2s ease",
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                      <td style={{
                        padding: "20px",
                        fontWeight: "600",
                        color: "#1e293b"
                      }}>
                        {request.legal_business_name || "N/A"} 
                      </td>
                      <td style={{
                        padding: "20px",
                        color: "#64748b"
                      }}>
                        {request.contact_person?.email_address || "N/A"}
                      </td>
                      <td style={{
                        padding: "20px"
                      }}>
                        <span style={{
                          padding: "4px 12px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: "600",
                          backgroundColor: "#fef3c7",
                          color: "#92400e",
                        }}>
                          {request.status || "Pending"}
                        </span>
                      </td>
                      <td style={{
                        padding: "20px",
                        textAlign: "center"
                      }}>
                        <div style={{
                          display: "flex",
                          gap: "8px",
                          justifyContent: "center"
                        }}>
                          <button
                            className="admin-primary-action"
                            onClick={() => handleApprove(request._id)}
                            disabled={approvingId === request._id}
                            style={{
                              background: "linear-gradient(135deg, #10b981, #059669)",
                              color: "#ffffff",
                              border: "none",
                              borderRadius: "8px",
                              padding: "8px 16px",
                              fontWeight: "600",
                              fontSize: "14px",
                              cursor: approvingId === request._id ? "not-allowed" : "pointer",
                              transition: "all 0.2s ease",
                              boxShadow: "0 2px 4px rgba(16, 185, 129, 0.2)",
                              opacity: approvingId === request._id ? 0.6 : 1,
                            }}>
                            {approvingId === request._id ? "Approving..." : "✓ Approve"}
                          </button>
                          <button
                            onClick={() => handleReject(request._id)}
                            disabled={requestToReject === request._id && rejectMutation.isPending}
                            style={{
                              background: "linear-gradient(135deg, #ef4444, #dc2626)",
                              color: "#ffffff",
                              border: "none",
                              borderRadius: "8px",
                              padding: "8px 16px",
                              fontWeight: "600",
                              fontSize: "14px",
                              cursor: requestToReject === request._id && rejectMutation.isPending ? "not-allowed" : "pointer",
                              transition: "all 0.2s ease",
                              boxShadow: "0 2px 4px rgba(239, 68, 68, 0.2)",
                              opacity: requestToReject === request._id && rejectMutation.isPending ? 0.6 : 1,
                            }}>
                            ✕ Reject
                          </button>
                          <button
                            onClick={() => handleViewDetails(request)}
                            style={{
                              background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                              color: "#fff",
                              border: "none",
                              borderRadius: "8px",
                              padding: "8px 16px",
                              fontWeight: "600",
                              fontSize: "14px",
                              cursor: "pointer",
                              transition: "all 0.2s ease",
                              boxShadow: "0 2px 4px rgba(37, 99, 235, 0.2)",
                            }}>
                            👁 View
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{
              textAlign: "center",
              padding: "64px 32px",
              background: "#f8fafc",
              borderRadius: "12px",
              border: "2px dashed #cbd5e1",
            }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>🎉</div>
              <h3 style={{
                fontSize: "20px",
                fontWeight: "600",
                color: "#475569",
                margin: "0 0 8px 0"
              }}>
                All caught up!
              </h3>
              <p style={{
                color: "#64748b",
                fontSize: "16px",
                margin: 0
              }}>
                No pending verification requests at the moment.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Details Modal */}
{showModal && selectedRequest && (
  <div
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      background: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
    }}
    onClick={() => setShowModal(false)}>
    <div
      style={{
        background: "#fff",
        borderRadius: "16px",
        padding: "32px",
        minWidth: "500px",
        maxWidth: "700px",
        maxHeight: "85vh",
        overflowY: "auto",
        boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
        position: "relative",
      }}
      onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setShowModal(false)}
        style={{
          position: "absolute",
          top: 20,
          right: 20,
          background: "#f1f5f9",
          border: "none",
          borderRadius: "50%",
          width: 36,
          height: 36,
          fontSize: 20,
          cursor: "pointer",
          color: "#64748b",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: "bold",
          lineHeight: 1,
          padding: 0,
          zIndex: 10,
        }}>
        ×
      </button>
      
      <h2 style={{
        marginTop: 0,
        marginBottom: 24,
        color: "#1e293b",
        fontWeight: 700,
        fontSize: 24,
        paddingRight: 40,
      }}>
        Request Details
      </h2>

      <div style={{ fontSize: "15px" }}>
        {/* Business Information */}
        <div style={{ marginBottom: 24 }}>
          <h3 style={{
            fontSize: 16,
            fontWeight: 600,
            color: "#1e293b",
            marginBottom: 12,
            borderBottom: "2px solid #e2e8f0",
            paddingBottom: 8,
          }}>
            Business Information
          </h3>
          <DetailRow label="Business Name" value={selectedRequest.legal_business_name} />
          <DetailRow label="Address" value={selectedRequest.physical_address} />
          <DetailRow label="Phone" value={selectedRequest.business_phone_number} />
          <DetailRow label="Website" value={selectedRequest.website_or_social_media_link} />
        </div>

        {/* Contact Person */}
        {selectedRequest.contact_person && (
          <div style={{ marginBottom: 24 }}>
            <h3 style={{
              fontSize: 16,
              fontWeight: 600,
              color: "#1e293b",
              marginBottom: 12,
              borderBottom: "2px solid #e2e8f0",
              paddingBottom: 8,
            }}>
              Contact Person
            </h3>
            <DetailRow label="Full Name" value={selectedRequest.contact_person.full_name} />
            <DetailRow label="Email" value={selectedRequest.contact_person.email_address} />
            <DetailRow label="Phone" value={selectedRequest.contact_person.phone_number} />
            <DetailRow label="Role" value={selectedRequest.contact_person.role_or_position} />
          </div>
        )}

        {/* License Information */}
        {selectedRequest.license_information && (
          <div style={{ marginBottom: 24 }}>
            <h3 style={{
              fontSize: 16,
              fontWeight: 600,
              color: "#1e293b",
              marginBottom: 12,
              borderBottom: "2px solid #e2e8f0",
              paddingBottom: 8,
            }}>
              License Information
            </h3>
            <DetailRow label="License Number" value={selectedRequest.license_information.license_number} />
            <DetailRow label="Issuing Authority" value={selectedRequest.license_information.issuing_authority} />
            <DetailRow label="License Type" value={selectedRequest.license_information.license_type} />
            <DetailRow label="Jurisdiction" value={selectedRequest.license_information.jurisdiction} />
            <DetailRow 
              label="Expiration Date" 
              value={selectedRequest.license_information.expiration_date ? 
                new Date(selectedRequest.license_information.expiration_date).toLocaleDateString() : 
                "N/A"
              } 
            />
          </div>
        )}

        {/* Uploaded Documents */}
        {(selectedRequest.uploaded_documents || selectedRequest.contact_person?.government_issued_id_document) && (
          <div style={{ marginBottom: 24 }}>
            <h3 style={{
              fontSize: 16,
              fontWeight: 600,
              color: "#1e293b",
              marginBottom: 12,
              borderBottom: "2px solid #e2e8f0",
              paddingBottom: 8,
            }}>
              Uploaded Documents
            </h3>
            {selectedRequest.uploaded_documents?.state_license_document && (
              <DetailRow 
                label="State License" 
                value={
                  <a 
                    href={selectedRequest.uploaded_documents.state_license_document} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ color: "#2563eb", textDecoration: "underline" }}
                  >
                    View Document
                  </a>
                } 
              />
            )}
            {selectedRequest.uploaded_documents?.utility_bill && (
              <DetailRow 
                label="Utility Bill" 
                value={
                  <a 
                    href={selectedRequest.uploaded_documents.utility_bill} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ color: "#2563eb", textDecoration: "underline" }}
                  >
                    View Document
                  </a>
                } 
              />
            )}
            {selectedRequest.contact_person?.government_issued_id_document && (
              <DetailRow 
                label="Government ID" 
                value={
                  <a 
                    href={selectedRequest.contact_person.government_issued_id_document} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ color: "#2563eb", textDecoration: "underline" }}
                  >
                    View Document
                  </a>
                } 
              />
            )}
          </div>
        )}

        {/* GPS Coordinates */}
        {selectedRequest.gps_coordinates && (
          <div style={{ marginBottom: 24 }}>
            <h3 style={{
              fontSize: 16,
              fontWeight: 600,
              color: "#1e293b",
              marginBottom: 12,
              borderBottom: "2px solid #e2e8f0",
              paddingBottom: 8,
            }}>
              GPS Coordinates
            </h3>
            <DetailRow label="Latitude" value={selectedRequest.gps_coordinates.latitude} />
            <DetailRow label="Longitude" value={selectedRequest.gps_coordinates.longitude} />
          </div>
        )}

        {/* Other Details */}
        <div style={{ marginBottom: 24 }}>
          <h3 style={{
            fontSize: 16,
            fontWeight: 600,
            color: "#1e293b",
            marginBottom: 12,
            borderBottom: "2px solid #e2e8f0",
            paddingBottom: 8,
          }}>
            Request Details
          </h3>
          <DetailRow label="Status" value={selectedRequest.status} />
          <DetailRow
            label="Submitted" 
            value={new Date(selectedRequest.createdAt).toLocaleString()} 
          />
          {selectedRequest.notes && <DetailRow label="Notes" value={selectedRequest.notes} />}
        </div>
      </div>
    </div>
  </div>
)}
      {/* Reject Modal */}
      {showRejectModal && (
  <div
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      background: "rgba(0,0,0,0.6)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1001,
    }}
    onClick={cancelReject}>
    <div
      style={{
        background: "#fff",
        borderRadius: "16px",
        padding: "32px",
        width: "90%",
        maxWidth: "500px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
        position: "relative",
      }}
      onClick={(e) => e.stopPropagation()}>
      <button
        onClick={cancelReject}
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          background: "#f1f5f9",
          border: "none",
          borderRadius: "50%",
          width: 32,
          height: 32,
          fontSize: 18,
          cursor: "pointer",
          color: "#64748b",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          lineHeight: 1,
          padding: 0,
        }}>
        ×
      </button>
      
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ 
          fontSize: 48, 
          marginBottom: 16,
          color: "#ef4444"
        }}>
          ⚠️
        </div>
        <h2 style={{
          marginTop: 0,
          marginBottom: 8,
          color: "#1e293b",
          fontWeight: 700,
          fontSize: 22,
        }}>
          Reject Verification Request
        </h2>
        <p style={{
          margin: 0,
          color: "#64748b",
          fontSize: 15,
        }}>
          Please provide a reason for rejecting this request
        </p>
      </div>

      <div style={{ marginBottom: 24 }}>
        <label style={{
          display: "block",
          marginBottom: 8,
          fontWeight: 600,
          color: "#374151",
          fontSize: 14,
        }}>
          Rejection Reason
        </label>
        <textarea
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Enter the reason for rejection..."
          rows={4}
          style={{
            width: "100%",
            padding: "12px",
            border: "2px solid #e2e8f0",
            borderRadius: "8px",
            fontSize: 15,
            fontFamily: "inherit",
            resize: "vertical",
            outline: "none",
            transition: "border-color 0.2s ease",
          }}
          onFocus={(e) => e.target.style.borderColor = "#ef4444"}
          onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
        />
        <p style={{
          margin: "8px 0 0 0",
          fontSize: 13,
          color: "#94a3b8",
        }}>
          This reason will be recorded for future reference
        </p>
      </div>

      <div style={{
        display: "flex",
        gap: 12,
        justifyContent: "flex-end",
      }}>
        <button
          onClick={cancelReject}
          disabled={rejectMutation.isPending}
          style={{
            padding: "12px 24px",
            background: "#f1f5f9",
            color: "#64748b",
            border: "none",
            borderRadius: "8px",
            fontWeight: 600,
            fontSize: 14,
            cursor: rejectMutation.isPending ? "not-allowed" : "pointer",
            transition: "all 0.2s ease",
            opacity: rejectMutation.isPending ? 0.6 : 1,
          }}>
          Cancel
        </button>
        <button
          onClick={confirmReject}
          disabled={rejectMutation.isPending}
          style={{
            padding: "12px 24px",
            background: "linear-gradient(135deg, #ef4444, #dc2626)",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontWeight: 600,
            fontSize: 14,
            cursor: rejectMutation.isPending ? "not-allowed" : "pointer",
            transition: "all 0.2s ease",
            boxShadow: "0 2px 4px rgba(239, 68, 68, 0.2)",
            opacity: rejectMutation.isPending ? 0.6 : 1,
          }}>
          {rejectMutation.isPending ? "Rejecting..." : "Confirm Rejection"}
        </button>
      </div>
    </div>
  </div>
)}
    </AdminLayout>
  );
};

export default AdminVerificationDashboard;
