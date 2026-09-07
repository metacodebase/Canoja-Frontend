import React, { useState } from "react";
import AdminLayout from "./AdminLayout";
import { useAllUsers, useToggleUserStatus } from "../services/admin";
import { toast } from "react-toastify";

const ROLE_STYLE = {
  admin: { bg: "#fef3c7", color: "#92400e" },
  operator: { bg: "#dbeafe", color: "#1e40af" },
  consumer: { bg: "#f1f5f9", color: "#475569" },
};

const FILTER_TABS = [
  { label: "All", value: "" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

const AdminUsers = () => {
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [togglingId, setTogglingId] = useState(null);

  const { data, isLoading, refetch } = useAllUsers();
  const toggleMutation = useToggleUserStatus();

  const allUsers = data?.data || data || [];

  const filtered = allUsers.filter((u) => {
    const matchesStatus =
      statusFilter === "" ||
      (statusFilter === "active" && u.isActive !== false) ||
      (statusFilter === "inactive" && u.isActive === false);
    const matchesSearch =
      search === "" ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleToggle = async (userId, currentlyActive) => {
    setTogglingId(userId);
    try {
      await toggleMutation.mutateAsync(userId);
      toast.success(`User ${currentlyActive ? "deactivated" : "activated"} successfully`);
      refetch();
    } catch (error) {
      toast.error(error.message || "Failed to update user status");
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <AdminLayout>
      <div style={{ background: "#ffffff", borderRadius: "20px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)", border: "1px solid #e2e8f0", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ background: "linear-gradient(135deg, #f8fafc, #f1f5f9)", borderBottom: "1px solid #e2e8f0", padding: "24px 32px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#1e293b", margin: "0 0 4px 0" }}>Users</h1>
          <p style={{ color: "#64748b", fontSize: "15px", margin: 0 }}>Manage registered user accounts</p>
        </div>

        <div style={{ padding: "24px 32px" }}>
          {/* Filters Row */}
          <div style={{ display: "flex", gap: "12px", marginBottom: "24px", alignItems: "center", flexWrap: "wrap" }}>
            {/* Status Tabs */}
            <div style={{ display: "flex", gap: "4px", background: "#f1f5f9", borderRadius: "10px", padding: "3px" }}>
              {FILTER_TABS.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setStatusFilter(tab.value)}
                  style={{
                    padding: "7px 16px",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    background: statusFilter === tab.value ? "#ffffff" : "transparent",
                    color: statusFilter === tab.value ? "#10b981" : "#64748b",
                    boxShadow: statusFilter === tab.value ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                  }}>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <input
              type="text"
              placeholder="Search by email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ padding: "8px 14px", border: "1.5px solid #e2e8f0", borderRadius: "9px", fontSize: "14px", outline: "none", minWidth: "220px", fontFamily: "inherit", background: "#ffffff", color: "#1e293b" }}
              onFocus={(e) => e.target.style.borderColor = "#10b981"}
              onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
            />

            {!isLoading && (
              <span style={{ marginLeft: "auto", fontSize: "13px", color: "#94a3b8" }}>
                {filtered.length} of {allUsers.length} user{allUsers.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* Table */}
          {isLoading ? (
            <div style={{ textAlign: "center", padding: "60px", color: "#64748b" }}>Loading users...</div>
          ) : filtered.length > 0 ? (
            <div style={{ overflowX: "auto", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", background: "#fff" }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    {["Email", "Role", "Status", "Joined", "Action"].map((h) => (
                      <th key={h} style={{ padding: "14px 20px", textAlign: h === "Action" ? "center" : "left", fontWeight: "600", color: "#374151", fontSize: "13px", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((user, i) => {
                    const isActive = user.isActive !== false;
                    const roleStyle = ROLE_STYLE[user.role] || ROLE_STYLE.consumer;
                    return (
                      <tr
                        key={user._id || i}
                        style={{ borderBottom: i < filtered.length - 1 ? "1px solid #f1f5f9" : "none" }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                        <td style={{ padding: "14px 20px", color: "#1e293b", fontWeight: "500" }}>{user.email}</td>
                        <td style={{ padding: "14px 20px" }}>
                          <span style={{ padding: "3px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: "600", background: roleStyle.bg, color: roleStyle.color }}>
                            {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "—"}
                          </span>
                        </td>
                        <td style={{ padding: "14px 20px" }}>
                          <span style={{ padding: "3px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: "600", background: isActive ? "#dcfce7" : "#fee2e2", color: isActive ? "#15803d" : "#991b1b" }}>
                            {isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td style={{ padding: "14px 20px", color: "#94a3b8", fontSize: "13px", whiteSpace: "nowrap" }}>
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
                        </td>
                        <td style={{ padding: "14px 20px", textAlign: "center" }}>
                          {user.role === "admin" ? (
                            <span style={{ fontSize: "12px", color: "#cbd5e1" }}>—</span>
                          ) : (
                            <button
                              className={isActive ? "" : "admin-primary-action"}
                              onClick={() => handleToggle(user._id, isActive)}
                              disabled={togglingId === user._id}
                              style={{
                                padding: "7px 16px",
                                border: "none",
                                borderRadius: "7px",
                                fontWeight: "600",
                                fontSize: "12px",
                                cursor: togglingId === user._id ? "not-allowed" : "pointer",
                                opacity: togglingId === user._id ? 0.6 : 1,
                                transition: "all 0.2s ease",
                                background: isActive ? "linear-gradient(135deg, #ef4444, #dc2626)" : "linear-gradient(135deg, #10b981, #059669)",
                                color: "#fff",
                              }}>
                              {togglingId === user._id ? "..." : isActive ? "Deactivate" : "Activate"}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "60px 32px", background: "#f8fafc", borderRadius: "12px", border: "2px dashed #cbd5e1" }}>
              <div style={{ fontSize: "36px", marginBottom: "12px" }}>👤</div>
              <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#475569", margin: "0 0 6px 0" }}>No users found</h3>
              <p style={{ color: "#94a3b8", margin: 0 }}>No users match the current filters.</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
