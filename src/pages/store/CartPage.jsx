import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { db } from "../../firebase";
import { formatInr } from "../../utils/format";

export default function CartPage() {
  const { cartItems, total, updateQuantity, removeFromCart, clearCart } = useCart();
  const { currentUser, userProfile } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [paymentRef, setPaymentRef] = useState("");
  const [upiId, setUpiId] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [shippingAddress, setShippingAddress] = useState(userProfile?.address || "");
  const navigate = useNavigate();
  const paymentOptions = [
    { value: "UPI", label: "UPI" },
    { value: "CARD", label: "Card" },
    { value: "COD", label: "Cash on Delivery" },
  ];

  useEffect(() => {
    if (userProfile?.address) {
      setShippingAddress(userProfile.address);
    }
  }, [userProfile?.address]);

  const createPurchaseReceipt = async (payment) => {
    const receiptRef = await addDoc(collection(db, "purchases"), {
      userId: currentUser.uid,
      buyerEmail: currentUser.email,
      items: cartItems,
      total,
      shippingAddress: shippingAddress.trim(),
      payment,
      createdAt: serverTimestamp(),
    });

    clearCart();
    navigate(`/receipt/${receiptRef.id}`);
  };

  const handleCheckout = async () => {
    if (!cartItems.length || !currentUser) {
      return;
    }

    if (!shippingAddress.trim()) {
      setError("Please add shipping address.");
      return;
    }

    if (paymentMethod === "UPI" && !upiId.trim()) {
      setError("Enter UPI ID for demo payment.");
      return;
    }

    if (paymentMethod === "CARD") {
      if (!cardName.trim() || !cardNumber.trim() || !cardExpiry.trim() || !cardCvv.trim()) {
        setError("Enter card details for demo payment.");
        return;
      }
    }

    setSubmitting(true);
    setError("");

    try {
      if (paymentMethod === "COD") {
        await createPurchaseReceipt({
          method: paymentMethod,
          status: "paid",
          reference: paymentRef.trim() || `COD-${Date.now()}`,
        });
      } else {
        await new Promise((resolve) => setTimeout(resolve, 900));
        await createPurchaseReceipt({
          method: paymentMethod,
          status: "paid",
          reference:
            paymentMethod === "UPI"
              ? `DEMO-UPI-${Date.now()}`
              : `DEMO-CARD-${String(cardNumber).slice(-4) || "0000"}-${Date.now()}`,
        });
      }
    } catch (err) {
      setError(err?.message || "Checkout failed. Verify setup and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="page-stack">
      <h1>Your Cart</h1>
      {!cartItems.length ? (
        <div className="empty-state reveal">
          <p>Your cart is empty.</p>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-list">
            {cartItems.map((item) => (
              <article key={item.id} className="cart-item reveal">
                <div className="cart-meta">
                  <h3>{item.title}</h3>
                  <p>{formatInr(item.price)} each</p>
                </div>
                <div className="actions">
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateQuantity(item.id, Number(e.target.value))}
                  />
                  <button className="btn ghost" onClick={() => removeFromCart(item.id)}>
                    Remove
                  </button>
                </div>
              </article>
            ))}
          </div>

          <aside className="cart-summary reveal">
            <h2>Order Summary</h2>
            <p>
              Items: <strong>{cartItems.reduce((sum, item) => sum + item.quantity, 0)}</strong>
            </p>
            <p>
              Total: <strong>{formatInr(total)}</strong>
            </p>

            <div className="payment-box">
              <div className="gateway-head">
                <h3>Payment Gateway</h3>
                <p className="subtitle">Demo checkout only. No real amount is charged.</p>
              </div>
              <input
                placeholder="Shipping Address"
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
              />
              <div className="gateway-methods" role="tablist" aria-label="Payment methods">
                {paymentOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`gateway-method ${paymentMethod === option.value ? "active" : ""}`}
                    onClick={() => setPaymentMethod(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {paymentMethod === "UPI" ? (
                <div className="gateway-fields">
                  <input
                    placeholder="UPI ID (example@upi)"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                  />
                </div>
              ) : null}

              {paymentMethod === "CARD" ? (
                <div className="gateway-fields">
                  <input
                    placeholder="Name on Card"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                  />
                  <input
                    placeholder="Card Number"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, "").slice(0, 16))}
                  />
                  <div className="gateway-row">
                    <input
                      placeholder="MM/YY"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value.slice(0, 5))}
                    />
                    <input
                      placeholder="CVV"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    />
                  </div>
                </div>
              ) : null}

              {paymentMethod === "COD" ? (
                <div className="gateway-fields">
                  <input
                    placeholder="COD chosen, optional order reference"
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                  />
                </div>
              ) : null}

              <p className="gateway-note">Secure demo gateway UI for project presentation.</p>
            </div>

            {error && <p className="error">{error}</p>}
            <button className="btn" onClick={handleCheckout} disabled={submitting}>
              {submitting
                ? "Processing..."
                : paymentMethod === "COD"
                  ? "Confirm Order & Generate Receipt"
                  : "Pay (Demo) & Generate Receipt"}
            </button>
          </aside>
        </div>
      )}
    </section>
  );
}

