import { useEffect, useMemo, useState } from "react";
import { FiSave, FiUpload } from "react-icons/fi";
import API from "../api/axios";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import LoadingPulse from "../components/LoadingPulse";

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ProfilePage() {
  const { updateUser } = useAuth();
  const { showError, showSuccess } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileImageData, setProfileImageData] = useState("");
  const [student, setStudent] = useState(null);
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    bio: "",
  });

  const previewImage = useMemo(() => {
    if (profileImageData) return profileImageData;
    return student?.profileImage || "";
  }, [profileImageData, student?.profileImage]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const { data } = await API.get("/student/me");
      const s = data.student;
      setStudent(s);
      setForm({
        fullName: s.fullName || "",
        phone: s.phone || "",
        bio: s.bio || "",
      });
    } catch (err) {
      const message = err.response?.data?.message || "Failed to load profile";
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const onChange = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const onFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showError("Please upload a valid image file");
      return;
    }

    try {
      const base64 = await fileToBase64(file);
      setProfileImageData(base64);
    } catch {
      showError("Failed to read image file");
    }
  };

  const onSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
      };
      if (profileImageData) payload.profileImage = profileImageData;

      const { data } = await API.put("/student/profile", payload);
      setStudent(data.student);
      setProfileImageData("");
      updateUser({
        fullName: data.student.fullName,
        profileImage: data.student.profileImage,
      });
      showSuccess(data.message || "Profile updated successfully");
    } catch (err) {
      const message = err.response?.data?.message || "Failed to update profile";
      showError(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <section className="card"><LoadingPulse label="Loading profile..." /></section>;
  }

  return (
    <section className="card">
      <div className="section-header">
        <h2>My Profile</h2>
        <p className="muted">Keep your details updated for a complete student profile.</p>
      </div>

      <div className="profile-head">
        <div className="profile-avatar-wrap">
          {previewImage ? (
            <img src={previewImage} alt="Profile" className="profile-avatar" />
          ) : (
            <div className="profile-avatar profile-avatar-placeholder">No Photo</div>
          )}
        </div>
        <label className="btn btn-ghost" style={{ cursor: "pointer" }}>
          <FiUpload />
          Upload Profile Photo
          <input type="file" accept="image/*" onChange={onFileChange} hidden />
        </label>
      </div>

      <form onSubmit={onSave} className="profile-form">
        <label>Full Name</label>
        <input value={form.fullName} onChange={onChange("fullName")} placeholder="Enter full name" />

        <label>Phone</label>
        <input value={form.phone} onChange={onChange("phone")} placeholder="Enter phone number" />

        <label>Bio</label>
        <textarea
          rows={4}
          maxLength={220}
          value={form.bio}
          onChange={onChange("bio")}
          placeholder="Write a short bio"
        />

        <button className="btn" type="submit" disabled={saving}>
          <FiSave />
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </form>
    </section>
  );
}
