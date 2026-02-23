const OTP_STORE_KEY = "shelfverse_auth_otp";
const OTP_EXPIRY_MS = 5 * 60 * 1000;

function readOtpPayload() {
  try {
    const raw = sessionStorage.getItem(OTP_STORE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeOtpPayload(payload) {
  sessionStorage.setItem(OTP_STORE_KEY, JSON.stringify(payload));
}

export function sendAuthOtp(email, purpose) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail) {
    return { ok: false, message: "Enter email first." };
  }

  const otp = String(100000 + Math.floor(Math.random() * 900000));
  const payload = {
    email: normalizedEmail,
    purpose,
    otp,
    expiresAt: Date.now() + OTP_EXPIRY_MS,
  };
  writeOtpPayload(payload);

  return {
    ok: true,
    otp,
    message: `Demo OTP sent to ${normalizedEmail}: ${otp}`,
  };
}

export function verifyAuthOtp(email, otpInput, purpose) {
  const payload = readOtpPayload();
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const code = String(otpInput || "").trim();

  if (!payload) {
    return { ok: false, message: "Send OTP first." };
  }

  if (!normalizedEmail) {
    return { ok: false, message: "Enter email first." };
  }

  if (!code) {
    return { ok: false, message: "Enter OTP." };
  }

  if (payload.email !== normalizedEmail || payload.purpose !== purpose) {
    return { ok: false, message: "OTP is for a different email or action." };
  }

  if (Date.now() > Number(payload.expiresAt || 0)) {
    sessionStorage.removeItem(OTP_STORE_KEY);
    return { ok: false, message: "OTP expired. Send a new OTP." };
  }

  if (payload.otp !== code) {
    return { ok: false, message: "Invalid OTP." };
  }

  sessionStorage.removeItem(OTP_STORE_KEY);
  return { ok: true, message: "OTP verified successfully." };
}
