import React, { useState, useEffect } from "react";
import { ArrowRight } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import canojaLogo from "../assets/canojaLogo.png";
import bannerBoxesImage from "../assets/bannerBoxes.png";
import api from "../services/api";
import "./claimBusinessForm.css";

const ClaimBusinessForm = () => {
  const theme = localStorage.getItem("canoja-theme") || "dark";
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form data state
  const [formData, setFormData] = useState({
    // Step 1: Basic Business Information
    pharmacyId: "",
    legal_business_name: "",
    physical_address: "",
    business_phone_number: "",
    website_or_social_media_link: "",

    // Step 2: Owner/Representative Information
    first_name: "",
    last_name: "",
    email_address: "",
    phone_number: "",
    role_or_position: "",
    government_issued_id_document: null,

    // Step 3: License Details
    license_number: "",
    issuing_authority: "",
    license_type: "",
    expiration_date: "",
    jurisdiction: "",

    // Step 4: Optional Verification Enhancements
    state_license_document: null,
    utility_bill: null,
    gps_coordinates: null,
    ownership_attestation: false,
  });

  // Pre-populate from URL params (if coming from mobile app)
  useEffect(() => {
    const pharmacyId = searchParams.get("pharmacyId");
    const businessName = searchParams.get("businessName");
    const address = searchParams.get("address");

    if (pharmacyId) {
      setFormData((prev) => ({
        ...prev,
        pharmacyId: pharmacyId,
        legal_business_name: businessName || prev.legal_business_name,
        physical_address: address || prev.physical_address,
      }));
    }
  }, [searchParams]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const { name } = e.target;
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        [name]: file,
      }));
    }
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleNext = () => {
    // Validate current step before proceeding
    if (currentStep === 1) {
      if (
        !formData.legal_business_name ||
        !formData.physical_address ||
        !formData.business_phone_number
      ) {
        toast.error("Please fill in all required fields");
        return;
      }
    } else if (currentStep === 2) {
      if (
        !formData.first_name ||
        !formData.last_name ||
        !formData.email_address ||
        !formData.phone_number ||
        !formData.role_or_position
      ) {
        toast.error("Please fill in all required fields");
        return;
      }
    }

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      return;
    }
    navigate("/explore");
  };

  const handleSubmit = async () => {
    // Validate final step
    if (
      !formData.legal_business_name ||
      !formData.physical_address ||
      !formData.business_phone_number ||
      !formData.first_name ||
      !formData.last_name ||
      !formData.email_address ||
      !formData.phone_number ||
      !formData.role_or_position
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare form data for submission
      const submitData = new FormData();

      // Basic Business Information (pharmacyId is optional now, but we'll send it if available)
      if (formData.pharmacyId) {
        submitData.append("pharmacyId", formData.pharmacyId);
      }
      submitData.append("legal_business_name", formData.legal_business_name);
      submitData.append("physical_address", formData.physical_address);
      submitData.append("business_phone_number", formData.business_phone_number);
      submitData.append(
        "website_or_social_media_link",
        formData.website_or_social_media_link || ""
      );

      // Contact Person Information
      const contactPerson = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        full_name: `${formData.first_name} ${formData.last_name}`.trim(),
        email_address: formData.email_address,
        phone_number: formData.phone_number,
        role_or_position: formData.role_or_position,
      };
      submitData.append("contact_person", JSON.stringify(contactPerson));

      // License Information
      const licenseInfo = {
        license_number: formData.license_number,
        issuing_authority: formData.issuing_authority,
        license_type: formData.license_type,
        expiration_date: formData.expiration_date,
        jurisdiction: formData.jurisdiction,
      };
      submitData.append("license_information", JSON.stringify(licenseInfo));

      // GPS Coordinates (if available)
      if (formData.gps_coordinates) {
        submitData.append(
          "gps_coordinates",
          JSON.stringify(formData.gps_coordinates)
        );
      }

      // Ownership Attestation (required - must be true)
      submitData.append("ownership_attestation", formData.ownership_attestation);

      // File uploads
      if (formData.state_license_document) {
        submitData.append(
          "state_license_document",
          formData.state_license_document
        );
      }
      if (formData.utility_bill) {
        submitData.append("utility_bill", formData.utility_bill);
      }
      if (formData.government_issued_id_document) {
        submitData.append(
          "government_issued_id_document",
          formData.government_issued_id_document
        );
      }

      // Submit to API endpoint
      // Note: The axios interceptor will automatically handle FormData Content-Type
      const response = await api.post("/verification-requests/claim", submitData);

      if (response.data.success) {
        const { data } = response.data;
        
        // Handle different verification statuses
        if (data.verification_status === "auto_verified") {
          // Auto-verified (smoke shop or cannabis with matching license)
          toast.success(
            data.business_type === "smoke_shop"
              ? "Your smoke shop has been auto-verified! Please check your email for next steps."
              : "Your business has been auto-verified! Please check your email for next steps."
          );
          
          // Show success message with instructions
          setTimeout(() => {
            toast.info(
              `Please sign up using the email: ${formData.email_address} to complete your registration.`,
              { autoClose: 5000 }
            );
          }, 2000);
        } else if (data.verification_status === "pending_review") {
          // Manual verification required (cannabis operator, no license match)
          toast.success(
            "Your verification request has been submitted and is pending admin review. You will be notified via email once the review is complete."
          );
        }

        navigate("/explore", { replace: true });
      }
    } catch (error) {
      console.error("Submission error:", error);
      
      // Handle specific error messages
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Failed to submit claim request. Please try again.";
      
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getGPSLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData((prev) => ({
            ...prev,
            gps_coordinates: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            },
          }));
          toast.success("GPS location captured successfully!");
        },
        (error) => {
          console.error("GPS error:", error);
          toast.error("Failed to get GPS location");
        }
      );
    } else {
      toast.error("GPS is not supported by your browser");
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="claim-fields-step">
            <h2
              style={{
                fontSize: "28px",
                fontWeight: "700",
                color: "#10b981",
                marginBottom: "32px",
              }}>
              Basic Business Information
            </h2>

            <div style={{ marginBottom: "24px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  color: "#374151",
                  fontWeight: "600",
                  fontSize: "14px",
                }}>
                Legal Business Name *
              </label>
              <input
                type="text"
                name="legal_business_name"
                value={formData.legal_business_name}
                onChange={handleInputChange}
                placeholder="Enter Legal Business Name"
                required
                style={inputStyle}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
              />
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  color: "#374151",
                  fontWeight: "600",
                  fontSize: "14px",
                }}>
                Physical Address *
              </label>
              <input
                type="text"
                name="physical_address"
                value={formData.physical_address}
                onChange={handleInputChange}
                placeholder="Enter Physical Address"
                required
                style={inputStyle}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
              />
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  color: "#374151",
                  fontWeight: "600",
                  fontSize: "14px",
                }}>
                Business Phone Number *
              </label>
              <input
                type="tel"
                name="business_phone_number"
                value={formData.business_phone_number}
                onChange={handleInputChange}
                placeholder="Enter Business Phone Number"
                required
                style={inputStyle}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
              />
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  color: "#374151",
                  fontWeight: "600",
                  fontSize: "14px",
                }}>
                Website or Social Media Link
              </label>
              <input
                type="url"
                name="website_or_social_media_link"
                value={formData.website_or_social_media_link}
                onChange={handleInputChange}
                placeholder="Enter Website or Social Media Link"
                style={inputStyle}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="claim-fields-step">
            <h2
              style={{
                fontSize: "28px",
                fontWeight: "700",
                color: "#10b981",
                marginBottom: "32px",
              }}>
              Owner/Representative Information
            </h2>

            <div style={{ marginBottom: "24px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  color: "#374151",
                  fontWeight: "600",
                  fontSize: "14px",
                }}>
                First Name *
              </label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
                placeholder="Enter First Name"
                autoComplete="given-name"
                required
                style={inputStyle}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
              />
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  color: "#374151",
                  fontWeight: "600",
                  fontSize: "14px",
                }}>
                Last Name *
              </label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
                placeholder="Enter Last Name"
                autoComplete="family-name"
                required
                style={inputStyle}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
              />
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  color: "#374151",
                  fontWeight: "600",
                  fontSize: "14px",
                }}>
                Email Address *
              </label>
              <input
                type="email"
                name="email_address"
                value={formData.email_address}
                onChange={handleInputChange}
                placeholder="Enter Email Address"
                required
                style={inputStyle}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
              />
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  color: "#374151",
                  fontWeight: "600",
                  fontSize: "14px",
                }}>
                Phone Number *
              </label>
              <input
                type="tel"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleInputChange}
                placeholder="Enter Phone Number"
                required
                style={inputStyle}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
              />
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  color: "#374151",
                  fontWeight: "600",
                  fontSize: "14px",
                }}>
                Role or Position (Owner, Manager, etc.) *
              </label>
              <input
                type="text"
                name="role_or_position"
                value={formData.role_or_position}
                onChange={handleInputChange}
                placeholder="Enter Role or Position"
                required
                style={inputStyle}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
              />
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  color: "#374151",
                  fontWeight: "600",
                  fontSize: "14px",
                }}>
                Government-Issued ID (upload)
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="file"
                  name="government_issued_id_document"
                  onChange={handleFileChange}
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  style={{
                    ...inputStyle,
                    padding: "12px",
                    cursor: "pointer",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#6b7280",
                  }}>
                  <svg
                    width="20"
                    height="20"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="claim-fields-step">
            <h2
              style={{
                fontSize: "28px",
                fontWeight: "700",
                color: "#10b981",
                marginBottom: "32px",
              }}>
                License Details 
            </h2>

            <div style={{ marginBottom: "24px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  color: "#374151",
                  fontWeight: "600",
                  fontSize: "14px",
                }}>
                License Number 
              </label>
              <input
                type="text"
                name="license_number"
                value={formData.license_number}
                onChange={handleInputChange}
                placeholder="Enter License Number"
                required
                style={inputStyle}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
              />
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  color: "#374151",
                  fontWeight: "600",
                  fontSize: "14px",
                }}>
                Issuing Authority (e.g., California DCC, NY OCM) 
              </label>
              <input
                type="text"
                name="issuing_authority"
                value={formData.issuing_authority}
                onChange={handleInputChange}
                placeholder="Enter Issuing Authority"
                required
                style={inputStyle}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
              />
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  color: "#374151",
                  fontWeight: "600",
                  fontSize: "14px",
                }}>
                License Type (Retail, Cultivation, Delivery, Lounge, etc.) 
              </label>
              <input
                type="text"
                name="license_type"
                value={formData.license_type}
                onChange={handleInputChange}
                placeholder="Enter License Type"
                required
                style={inputStyle}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
              />
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  color: "#374151",
                  fontWeight: "600",
                  fontSize: "14px",
                }}>
                Expiration Date 
              </label>
              <input
                type="date"
                name="expiration_date"
                value={formData.expiration_date}
                onChange={handleInputChange}
                required
                style={inputStyle}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
              />
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  color: "#374151",
                  fontWeight: "600",
                  fontSize: "14px",
                }}>
                Jurisdiction (State/Province & Country) 
              </label>
              <input
                type="text"
                name="jurisdiction"
                value={formData.jurisdiction}
                onChange={handleInputChange}
                placeholder="Enter Jurisdiction"
                required
                style={inputStyle}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="claim-fields-step">
            <h2
              style={{
                fontSize: "28px",
                fontWeight: "700",
                color: "#10b981",
                marginBottom: "32px",
              }}>
              Optional Verification Enhancements
            </h2>

            <div style={{ marginBottom: "32px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "12px",
                  color: "#374151",
                  fontWeight: "600",
                  fontSize: "16px",
                }}>
                Upload State License Document (PDF or image)
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="file"
                  name="state_license_document"
                  onChange={handleFileChange}
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  style={{
                    ...inputStyle,
                    padding: "12px",
                    cursor: "pointer",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#6b7280",
                  }}>
                  <svg
                    width="20"
                    height="20"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                </div>
              </div>
              {formData.state_license_document && (
                <p style={{ marginTop: "8px", color: "#10b981", fontSize: "14px" }}>
                  Selected: {formData.state_license_document.name}
                </p>
              )}
            </div>

            <div style={{ marginBottom: "32px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "12px",
                  color: "#374151",
                  fontWeight: "600",
                  fontSize: "16px",
                }}>
                Upload Utility Bill (address confirmation)
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="file"
                  name="utility_bill"
                  onChange={handleFileChange}
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  style={{
                    ...inputStyle,
                    padding: "12px",
                    cursor: "pointer",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#6b7280",
                  }}>
                  <svg
                    width="20"
                    height="20"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                </div>
              </div>
              {formData.utility_bill && (
                <p style={{ marginTop: "8px", color: "#10b981", fontSize: "14px" }}>
                  Selected: {formData.utility_bill.name}
                </p>
              )}
            </div>

            {/* GPS Validation temporarily hidden on frontend; backend support remains */}

            {/* Ownership Attestation Checkbox */}
            <div
              className="claim-attestation"
              style={{
                marginTop: "48px",
                padding: "24px",
                background: "#f9fafb",
                borderRadius: "12px",
                border: "2px solid #e5e7eb",
              }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                  cursor: "pointer",
                  userSelect: "none",
                }}>
                <input
                  type="checkbox"
                  name="ownership_attestation"
                  checked={formData.ownership_attestation}
                  onChange={handleCheckboxChange}
                  style={{
                    width: "20px",
                    height: "20px",
                    marginTop: "2px",
                    cursor: "pointer",
                    accentColor: "#10b981",
                  }}
                />
                <span
                  style={{
                    fontSize: "16px",
                    color: "#374151",
                    fontWeight: "500",
                    lineHeight: "1.5",
                  }}>
                  I legally assert I have rights to claim this business. *
                </span>
              </label>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className={`claim-business-form claim-business-form--${theme}`}
      style={{
        minHeight: "100vh",
        background: "#ffffff",
        fontFamily: "system-ui, -apple-system, sans-serif",
        position: "relative",
      }}>
      {/* Top Banner with Curved Design */}
      <div
        style={{
          height: "200px",
          position: "relative",
          overflow: "hidden",
        }}>
        {/* Banner Image - No green tint */}
        {/* 
          Adjust backgroundPosition to control which part of image shows:
          - "center" - shows middle of image
          - "center top" - shows top portion
          - "center bottom" - shows bottom portion  
          - "center 30%" - shows 30% from top (adjust percentage as needed)
          - "center 70%" - shows 70% from top (more bottom visible)
        */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url(${bannerBoxesImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center 82%", // Adjust this value: 0% = top, 100% = bottom
            backgroundRepeat: "no-repeat",
          }}
        />
        {/* Curved bottom */}
        <svg
          style={{
            position: "absolute",
            bottom: "-1px",
            left: 0,
            width: "100%",
            height: "50px",
            zIndex: 1,
            display: "block",
          }}
          viewBox="0 0 1440 50"
          preserveAspectRatio="none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg">
          <path
            className="claim-banner-curve"
            d="M0,0 Q360,40 720,45 T1440,40 L1440,50 L0,50 Z"
            fill="#ffffff"
          />
        </svg>
      </div>

      {/* Progress Indicators */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "8px",
          marginTop: "-20px",
          marginBottom: "40px",
          position: "relative",
          zIndex: 5,
        }}>
        {[...Array(totalSteps)].map((_, index) => (
          <div
            key={index}
            style={{
              width: index + 1 <= currentStep ? "24px" : "8px",
              height: "8px",
              borderRadius: "4px",
              background:
                index + 1 <= currentStep
                  ? "linear-gradient(135deg, #059669, #10b981)"
                  : "#e5e7eb",
              transition: "all 0.3s ease",
            }}
          />
        ))}
      </div>

      {/* Form Container */}
      <div
        style={{
          maxWidth: "960px",
          margin: "0 auto",
          padding: "0 24px 80px 24px",
        }}>
        {renderStepContent()}

        {/* Navigation Buttons */}
        <div
          style={{
            display: "flex",
            gap: "16px",
            marginTop: "20px",
            justifyContent: "space-between",
          }}>
          <button
            className="claim-back-button"
            type="button"
            onClick={handleBack}
            style={{
              flex: currentStep === totalSteps ? 1 : "none",
              padding: "14px 32px",
              background: "#f3f4f6",
              color: "#374151",
              border: "none",
              borderRadius: "12px",
              fontWeight: "600",
              fontSize: "16px",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.target.style.background = "#e5e7eb";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "#f3f4f6";
            }}>
            Back
          </button>

          {currentStep < totalSteps ? (
            <button
              type="button"
              onClick={handleNext}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "14px 32px",
                background: "linear-gradient(135deg, #059669, #10b981)",
                color: "#ffffff",
                border: "none",
                borderRadius: "12px",
                fontWeight: "600",
                fontSize: "16px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: "0 4px 6px -1px rgba(16, 185, 129, 0.2)",
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 8px 12px -1px rgba(16, 185, 129, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 4px 6px -1px rgba(16, 185, 129, 0.2)";
              }}>
              Next <ArrowRight size={18} strokeWidth={2.25} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !formData.ownership_attestation}
              style={{
                flex: 1,
                padding: "14px 32px",
                background:
                  isSubmitting || !formData.ownership_attestation
                    ? "#9ca3af"
                    : "linear-gradient(135deg, #059669, #10b981)",
                color: "#ffffff",
                border: "none",
                borderRadius: "12px",
                fontWeight: "600",
                fontSize: "16px",
                cursor:
                  isSubmitting || !formData.ownership_attestation
                    ? "not-allowed"
                    : "pointer",
                transition: "all 0.2s ease",
                boxShadow:
                  isSubmitting || !formData.ownership_attestation
                    ? "none"
                    : "0 4px 6px -1px rgba(16, 185, 129, 0.2)",
                opacity: isSubmitting || !formData.ownership_attestation ? 0.7 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting) {
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow = "0 8px 12px -1px rgba(16, 185, 129, 0.3)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isSubmitting) {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "0 4px 6px -1px rgba(16, 185, 129, 0.2)";
                }
              }}>
              {isSubmitting ? "Submitting..." : "Submit"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Input style constant
const inputStyle = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: "12px",
  border: "2px solid #e5e7eb",
  fontSize: "16px",
  transition: "all 0.2s ease",
  outline: "none",
  boxSizing: "border-box",
  background: "#f9fafb",
  color: "#111",
  fontFamily: "inherit",
};

// Input focus handler
const handleInputFocus = (e) => {
  e.target.style.borderColor = "#10b981";
  e.target.style.background = "#ffffff";
  e.target.style.boxShadow = "0 0 0 3px rgba(16, 185, 129, 0.1)";
};

const handleInputBlur = (e) => {
  e.target.style.borderColor = "#e5e7eb";
  e.target.style.background = "#f9fafb";
  e.target.style.boxShadow = "none";
};

export default ClaimBusinessForm;
