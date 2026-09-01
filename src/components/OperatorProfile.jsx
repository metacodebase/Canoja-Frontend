import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Camera, Clock3, Folder, Image, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import OperatorLayout from "./OperatorLayout";
import OperatingHoursEditor from "./OperatingHoursEditor";
import { useBusinessProfile, useUpdateBusinessProfile, useUploadBusinessPhoto } from "../services/business";
import "./operatorProfile.css";

const OperatorProfile = () => {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useBusinessProfile();
  const updateProfile = useUpdateBusinessProfile();
  const uploadPhoto = useUploadBusinessPhoto();
  const [form, setForm] = useState({ business_name: "", phone: "", website: "", description: "", working_hours: {} });
  const [photo, setPhoto] = useState(null);

  useEffect(() => {
    if (data?.data) setForm({ ...data.data, working_hours: data.data.working_hours || {} });
  }, [data]);

  const photoPreview = useMemo(() => photo ? URL.createObjectURL(photo) : (form.photo_url || form.photo || ""), [photo, form.photo_url, form.photo]);

  useEffect(() => () => {
    if (photoPreview?.startsWith("blob:")) URL.revokeObjectURL(photoPreview);
  }, [photoPreview]);

  const selectPhoto = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png"].includes(file.type)) return toast.error("Please upload a JPEG or PNG image");
    if (file.size > 10 * 1024 * 1024) return toast.error("Photo size must be less than 10MB");
    setPhoto(file);
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    try {
      if (photo) await uploadPhoto.mutateAsync(photo);
      const updateData = { ...form };
      delete updateData.email;
      delete updateData.login_email;
      delete updateData.photo;
      delete updateData.photo_url;
      await updateProfile.mutateAsync(updateData);
      setPhoto(null);
      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error(error.message || "Failed to update profile");
    }
  };

  const pending = updateProfile.isPending || uploadPhoto.isPending;
  const updateField = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  return (
    <OperatorLayout>
      <main className="operator-profile-page">
        <header className="operator-profile-header">
          <div><h1>Profile Information</h1><p>Manage the information shown on your public business listing.</p></div>
        </header>

        {isLoading ? <div className="operator-profile-status">Loading profile…</div> : isError ? <div className="operator-profile-status">Failed to load profile information.</div> : (
          <form onSubmit={saveProfile} className="operator-profile-form">
            <section className="operator-profile-card">
              <div className="operator-profile-card__heading"><span className="green"><Camera size={22} /></span><div><h2>Business Photo</h2><p>This photo appears on your public profile.</p></div></div>
              <div className="operator-profile-photo">
                <div className="operator-profile-photo__preview">{photoPreview ? <img src={photoPreview} alt="Business profile preview" /> : <Image size={38} />}</div>
                <div><h3>{photo ? photo.name : photoPreview ? "Current business photo" : "No photo uploaded yet"}</h3><p>JPEG or PNG, maximum 10 MB. A new upload replaces the current photo.</p><label><Camera size={16} />{photoPreview ? "Replace photo" : "Choose photo"}<input type="file" accept="image/jpeg,image/png" onChange={selectPhoto} hidden /></label>{photo && <button type="button" onClick={() => setPhoto(null)}>Remove selection</button>}</div>
              </div>
            </section>

            <section className="operator-profile-card">
              <div className="operator-profile-card__heading"><span className="green"><Folder size={22} /></span><div><h2>Business Details</h2><p>Keep your business and contact information current.</p></div></div>
              <div className="operator-profile-fields">
                <label><span>Business Name</span><input required value={form.business_name || ""} onChange={updateField("business_name")} /></label>
                <label><span>Phone Number</span><input type="tel" value={form.phone || ""} onChange={updateField("phone")} /></label>
                <label><span>Login Email</span><input type="email" value={form.login_email || ""} disabled /><small>Email cannot be changed here.</small></label>
                <label><span>Website</span><input type="url" placeholder="https://yourwebsite.com" value={form.website || ""} onChange={updateField("website")} /></label>
                <label className="full"><span>Description</span><textarea rows={5} placeholder="Short description of your business" value={form.description || ""} onChange={updateField("description")} /></label>
              </div>
            </section>

            <section className="operator-profile-card">
              <div className="operator-profile-card__heading"><span className="green"><Clock3 size={22} /></span><div><h2>Operating Hours</h2><p>Set when customers can visit your business.</p></div></div>
              <OperatingHoursEditor value={form.working_hours} onChange={(working_hours) => setForm((current) => ({ ...current, working_hours }))} />
            </section>

            <div className="operator-profile-actions"><button type="button" onClick={() => navigate("/operator/dashboard")}><ArrowLeft size={17} />Back</button><button type="submit" disabled={pending}><Save size={17} />{pending ? "Saving…" : "Save Changes"}</button></div>
          </form>
        )}
      </main>
    </OperatorLayout>
  );
};

export default OperatorProfile;
