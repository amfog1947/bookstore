const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.message || "Payment request failed");
  }
  return json;
}

export async function createRazorpayOrder(amount) {
  return request("/api/payments/create-order", {
    method: "POST",
    body: JSON.stringify({ amount }),
  });
}

export async function verifyRazorpayPayment(payload) {
  return request("/api/payments/verify", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}
