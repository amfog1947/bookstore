import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { sendAuthOtp, verifyAuthOtp } from "../../utils/authOtp";

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
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [otpRequested, setOtpRequested] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpStatus, setOtpStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOtp = () => {
    const result = sendAuthOtp(email, "signup");
    setOtpStatus(result.message);
    setOtpRequested(result.ok);
    if (!result.ok) {
      setOtpVerified(false);
    }
  };

  const handleVerifyOtp = () => {
    const result = verifyAuthOtp(email, otpInput, "signup");
    setOtpStatus(result.message);
    setOtpVerified(result.ok);
  };

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

    if (!phone.trim() || !address.trim()) {
      setError("Phone and address are required.");
      return;
    }

    if (!otpRequested || !otpVerified) {
      setError("Verify OTP before signup.");
      return;
    }

    setLoading(true);

    try {
      await signup(email, password, { fullName, phone, address });
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
            placeholder="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <input
            placeholder="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          <input
            placeholder="Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
          <div className="auth-otp-row">
            <button type="button" className="btn ghost" onClick={handleSendOtp}>
              {otpRequested ? "Resend OTP" : "Send OTP"}
            </button>
            <input
              placeholder="Enter OTP"
              value={otpInput}
              onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
            />
            <button type="button" className="btn ghost" onClick={handleVerifyOtp}>
              Verify OTP
            </button>
          </div>
          {otpStatus ? <p className={otpVerified ? "gateway-note gateway-ok" : "gateway-note"}>{otpStatus}</p> : null}
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
