import "dotenv/config";
import crypto from "node:crypto";
import cors from "cors";
import express from "express";
import Razorpay from "razorpay";

const app = express();
const port = Number(process.env.PORT || 4000);
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "http://localhost:5173,http://127.0.0.1:5173")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);

const razorpayKeyId = process.env.RAZORPAY_KEY_ID || "";
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || "";

if (!razorpayKeyId || !razorpayKeySecret) {
  // eslint-disable-next-line no-console
  console.warn("Razorpay env vars missing: set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET");
}

const razorpay = new Razorpay({
  key_id: razorpayKeyId,
  key_secret: razorpayKeySecret,
});

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("CORS blocked"), false);
    },
  })
);
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "shelfverse-payment-api" });
});

app.post("/api/payments/create-order", async (req, res) => {
  try {
    const amountInr = Number(req.body?.amount || 0);
    if (!Number.isFinite(amountInr) || amountInr <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    const order = await razorpay.orders.create({
      amount: Math.round(amountInr * 100),
      currency: "INR",
      receipt: `sv_${Date.now()}`,
      notes: {
        source: "shelfverse",
      },
    });

    return res.json({ order, keyId: razorpayKeyId });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create Razorpay order" });
  }
});

app.post("/api/payments/verify", (req, res) => {
  try {
    const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } =
      req.body || {};

    if (!orderId || !paymentId || !signature) {
      return res.status(400).json({ message: "Missing payment verification fields" });
    }

    const expected = crypto
      .createHmac("sha256", razorpayKeySecret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    if (expected !== signature) {
      return res.status(400).json({ verified: false, message: "Signature mismatch" });
    }

    return res.json({ verified: true, orderId, paymentId });
  } catch (error) {
    return res.status(500).json({ verified: false, message: "Verification failed" });
  }
});

app.use((err, _req, res, _next) => {
  if (err?.message === "CORS blocked") {
    return res.status(403).json({ message: "Origin not allowed" });
  }
  return res.status(500).json({ message: "Internal server error" });
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`ShelfVerse payment API running on http://localhost:${port}`);
});
