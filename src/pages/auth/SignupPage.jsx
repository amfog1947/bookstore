import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function getAuthErrorMessage(err, fallback) {
  const code = err?.code || "";
  if (code === "auth/email-already-in-use") {
    return "Email already in use. Please login instead.";
  }
  if (code === "auth/invalid-email") {
    return "Please enter a valid email address.";
  }
  if (code === "auth/weak-password") {
    return "Password is too weak.";
  }
  if (code === "auth/popup-closed-by-user") {
    return "Google sign-up popup was closed.";
  }
  if (code === "auth/popup-blocked") {
    return "Popup blocked. Allow popups or try again.";
  }
  if (code === "auth/unauthorized-domain") {
    return "Domain not authorized in Firebase. Add this domain in Firebase Auth settings.";
  }
  if (code === "auth/operation-not-allowed") {
    return "Google sign-in is disabled in Firebase console.";
  }
  return fallback;
}

export default function SignupPage() {
  const { signup, googleSignIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await signup(email, password);
      navigate("/");
    } catch (err) {
      setError(getAuthErrorMessage(err, "Signup failed. Try a different email."));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setLoading(true);
    try {
      await googleSignIn();
      navigate("/");
    } catch (err) {
      setError(getAuthErrorMessage(err, "Google sign-up failed. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-wrap">
      <section className="auth-card reveal">
        <p className="eyebrow">Get Started</p>
        <h1>Signup</h1>
        <form onSubmit={handleSubmit} className="form">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
          {error && <p className="error">{error}</p>}
          <button className="btn" disabled={loading}>
            {loading ? "Creating account..." : "Signup"}
          </button>
          <button type="button" className="btn ghost" disabled={loading} onClick={handleGoogle}>
            Continue with Google
          </button>
        </form>
        <p>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </section>
    </section>
  );
}
