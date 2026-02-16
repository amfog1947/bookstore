import { useState } from "react";
import { useAuth } from "../../context/AuthContext";

export default function SettingsPage() {
  const { currentUser, userProfile, updateProfileDetails } = useAuth();
  const [fullName, setFullName] = useState(userProfile?.fullName || "");
  const [phone, setPhone] = useState(userProfile?.phone || "");
  const [address, setAddress] = useState(userProfile?.address || "");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatus("");
    try {
      await updateProfileDetails({ fullName, phone, address });
      setStatus("Account updated.");
    } catch (error) {
      setStatus("Failed to update account.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="settings-layout single">
      <section className="settings-panel reveal">
        <form className="profile-card" onSubmit={handleSave}>
          <h1>Account Settings</h1>
          <p className="subtitle">Signed in as {userProfile?.fullName?.trim() || currentUser?.email || "User"}</p>
          <div className="profile-field">
            <label className="filter-label">Email</label>
            <input value={currentUser?.email || ""} disabled />
          </div>
          <div className="profile-field">
            <label className="filter-label">Full Name</label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="profile-field">
            <label className="filter-label">Phone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="profile-field">
            <label className="filter-label">Address</label>
            <input value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          {status && <p className="status-msg">{status}</p>}
          <button className="btn" disabled={saving}>
            {saving ? "Saving..." : "Save Account"}
          </button>
        </form>
      </section>
    </section>
  );
}
