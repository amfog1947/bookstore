import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function getAuthErrorMessage(err, fallback) {
  const code = err?.code || "";
  if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") {
    return "Invalid email or password.";
  }
  if (code === "auth/too-many-requests") {
    return "Too many attempts. Try again later.";
  }
  if (code === "auth/popup-closed-by-user") {
    return "Google sign-in popup was closed.";
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

export default function LoginPage() {
  const { login, googleSignIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(getAuthErrorMessage(err, "Login failed. Please check your credentials."));
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
      setError(getAuthErrorMessage(err, "Google sign-in failed. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-wrap">
      <section className="auth-card reveal">
        <p className="eyebrow">Welcome Back</p>
        <h1>Login</h1>
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
          {error && <p className="error">{error}</p>}
          <button className="btn" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
          <button type="button" className="btn ghost" disabled={loading} onClick={handleGoogle}>
            Continue with Google
          </button>
        </form>
        <p>
          Need an account? <Link to="/signup">Signup</Link>
        </p>
      </section>
    </section>
  );
}
