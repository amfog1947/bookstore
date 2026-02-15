import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function SettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") === "help" ? "help" : "account";
  const { currentUser, userProfile, updateProfileDetails } = useAuth();
  const [tab, setTab] = useState(initialTab);
  const [fullName, setFullName] = useState(userProfile?.fullName || "");
  const [phone, setPhone] = useState(userProfile?.phone || "");
  const [address, setAddress] = useState(userProfile?.address || "");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  const setTabWithQuery = (nextTab) => {
    setTab(nextTab);
    setSearchParams({ tab: nextTab });
  };

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
    <section className="settings-layout">
      <aside className="settings-menu reveal">
        <button
          type="button"
          className={tab === "account" ? "settings-tab active" : "settings-tab"}
          onClick={() => setTabWithQuery("account")}
        >
          Account
        </button>
        <button
          type="button"
          className={tab === "help" ? "settings-tab active" : "settings-tab"}
          onClick={() => setTabWithQuery("help")}
        >
          Help
        </button>
      </aside>

      <section className="settings-panel reveal">
        {tab === "account" ? (
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
        ) : (
          <div className="help-card">
            <h1>Help</h1>
            <p>1. Click any book to see full details and description.</p>
            <p>2. Add books to cart or save to wishlist.</p>
            <p>3. Checkout from cart to generate and download receipt.</p>
            <p>4. Use My Orders to open previous receipts.</p>
            <p>5. Use Account tab to edit profile details.</p>
          </div>
        )}
      </section>
    </section>
  );
}
