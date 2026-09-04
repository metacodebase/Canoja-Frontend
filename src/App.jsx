import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Login from "./components/Login";
import AdminVerificationDashboard from "./components/AdminVerificationDashboard";
import AdminVerificationRequests from "./components/AdminVerificationRequests";
import AdminHistory from "./components/AdminHistory";
import AdminUsers from "./components/AdminUsers";
import OperatorDashboard from "./components/OperatorDashboard";
import BusinessSwitcher from "./components/BusinessSwitcher";
import OperatorExplore from "./components/OperatorExplore";
import OperatorBilling from "./components/OperatorBilling";
import OperatorSettings from "./components/OperatorSettings";
import OperatorSpotlight from "./components/OperatorSpotlight";
import OperatorAnalytics from "./components/OperatorAnalytics";
import OperatorProfile from "./components/OperatorProfile";
import { AuthProvider } from "./context/AuthContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ClaimBusinessForm from "./components/ClaimBusinessForm";
import ForgotPassword from "./components/ForgotPassword";
import VerifyOTP from "./components/VerifyOTP";
import AdminRetailers from "./components/admin/AdminRetailers";
import AdminPendingVerifications from "./components/admin/AdminPendingVerifications";
import AdminPendingRequests from "./components/admin/AdminPendingRequests";
import AdminCanojaVerified from "./components/admin/AdminCanojaVerified";
import AdminVerifiedPharmacies from "./components/admin/AdminVerifiedPharmacies";
import RoleRoute from "./components/RoleRoute";
import AgeVerification from "./components/AgeVerification";
import ConsumerExplore from "./components/consumer/ConsumerExplore";
import ConsumerAllShops from "./components/consumer/ConsumerAllShops";
import ConsumerBusinessDetail from "./components/consumer/ConsumerBusinessDetail";
import LandingPage from "./components/LandingPage";

// Create QueryClient with sensible defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: 1000,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div style={{ minHeight: "100vh" }}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/explore" element={<ConsumerExplore />} />
            <Route path="/explore/all" element={<ConsumerAllShops />} />
            <Route path="/shop-finder" element={<Navigate to="/explore" replace />} />
            <Route path="/age-verification" element={<AgeVerification />} />
            <Route path="/business/:businessId" element={<ConsumerBusinessDetail />} />

            {/* General Login */}
            <Route path="/login" element={<Login />} />
            
            {/* Redirect old admin login route to general login */}
            <Route path="/admin/login" element={<Navigate to="/login" replace />} />

            {/* Forgot Password Flow */}
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/verify-otp" element={<VerifyOTP />} />

            {/* Claim Business Form - Public */}
            <Route 
              path="/claim-business" 
              element={<ClaimBusinessForm />} 
            />

            {/* Admin Routes - Protected */}
            <Route path="/admin/dashboard" element={<Navigate to="/admin/retailers" replace />} />
            <Route
              path="/admin/retailers"
              element={<RoleRoute allowedRoles={["admin"]}><AdminRetailers /></RoleRoute>}
            />
            <Route
              path="/admin/pending-verifications"
              element={<RoleRoute allowedRoles={["admin"]}><AdminPendingVerifications /></RoleRoute>}
            />
            <Route
              path="/admin/pending-requests"
              element={<RoleRoute allowedRoles={["admin"]}><AdminPendingRequests /></RoleRoute>}
            />
            <Route
              path="/admin/canoja-verified"
              element={<RoleRoute allowedRoles={["admin"]}><AdminCanojaVerified /></RoleRoute>}
            />
            <Route
              path="/admin/verified-pharmacies"
              element={<RoleRoute allowedRoles={["admin"]}><AdminVerifiedPharmacies /></RoleRoute>}
            />
            <Route
              path="/admin/verification-requests"
              element={<RoleRoute allowedRoles={["admin"]}><AdminVerificationRequests /></RoleRoute>}
            />

            {/* Operator Dashboard - Protected */}
            <Route
              path="/operator/switch-business"
              element={
                <RoleRoute allowedRoles={["operator"]}>
                  <BusinessSwitcher />
                </RoleRoute>
              }
            />
            <Route path="/operator/explore" element={<RoleRoute allowedRoles={["operator"]}><OperatorExplore /></RoleRoute>} />
            <Route path="/operator/billing" element={<RoleRoute allowedRoles={["operator"]}><OperatorBilling /></RoleRoute>} />
            <Route path="/operator/settings" element={<RoleRoute allowedRoles={["operator"]}><OperatorSettings /></RoleRoute>} />
            <Route path="/operator/spotlight" element={<RoleRoute allowedRoles={["operator"]}><OperatorSpotlight /></RoleRoute>} />
            <Route path="/operator/analytics" element={<RoleRoute allowedRoles={["operator"]}><OperatorAnalytics /></RoleRoute>} />
            <Route path="/operator/profile" element={<RoleRoute allowedRoles={["operator"]}><OperatorProfile /></RoleRoute>} />
            <Route 
              path="/operator/dashboard" 
              element={
                <RoleRoute allowedRoles={["operator"]}>
                  <OperatorDashboard />
                </RoleRoute>
              } 
            />
            
            {/* Default Redirects */}
            <Route path="/admin" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          
          {/* Global Toast Notifications */}
          <ToastContainer 
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
            style={{ zIndex: 9999 }}
          />
        </div>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
