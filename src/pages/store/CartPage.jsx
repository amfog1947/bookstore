import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
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
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentRef, setPaymentRef] = useState("");
  const [shippingAddress, setShippingAddress] = useState(userProfile?.address || "");
  const paymentSelectRef = useRef(null);
  const navigate = useNavigate();
  const paymentOptions = [
    { value: "UPI", label: "UPI" },
    { value: "CARD", label: "Card" },
    { value: "COD", label: "Cash on Delivery" },
  ];
  const paymentLabel = paymentOptions.find((opt) => opt.value === paymentMethod)?.label || "UPI";

  useEffect(() => {
    if (userProfile?.address) {
      setShippingAddress(userProfile.address);
    }
  }, [userProfile?.address]);

  useEffect(() => {
    const onClickOutside = (event) => {
      if (paymentSelectRef.current && !paymentSelectRef.current.contains(event.target)) {
        setPaymentOpen(false);
      }
    };

    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const handleCheckout = async () => {
    if (!cartItems.length || !currentUser) {
      return;
    }

    if (!shippingAddress.trim()) {
      setError("Please add shipping address.");
      return;
    }

    if (paymentMethod !== "COD" && !paymentRef.trim()) {
      setError("Enter payment reference for Card/UPI.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const receiptRef = await addDoc(collection(db, "purchases"), {
        userId: currentUser.uid,
        buyerEmail: currentUser.email,
        items: cartItems,
        total,
        shippingAddress: shippingAddress.trim(),
        payment: {
          method: paymentMethod,
          status: "paid",
          reference: paymentRef.trim() || `COD-${Date.now()}`,
        },
        createdAt: serverTimestamp(),
      });

      clearCart();
      navigate(`/receipt/${receiptRef.id}`);
    } catch (err) {
      setError("Checkout failed. Verify Firestore rules and try again.");
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
              <h3>Payment</h3>
              <input
                placeholder="Shipping Address"
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
              />
              <div className="payment-select" ref={paymentSelectRef}>
                <button
                  type="button"
                  className="custom-select-trigger"
                  onClick={() => setPaymentOpen((v) => !v)}
                  aria-expanded={paymentOpen}
                  aria-haspopup="listbox"
                >
                  <span>{paymentLabel}</span>
                  <span className={`custom-chevron ${paymentOpen ? "open" : ""}`}>v</span>
                </button>
                {paymentOpen && (
                  <div className="custom-select-menu" role="listbox" aria-label="Payment method">
                    {paymentOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={`custom-select-item ${paymentMethod === option.value ? "active" : ""}`}
                        onClick={() => {
                          setPaymentMethod(option.value);
                          setPaymentOpen(false);
                        }}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <input
                placeholder={paymentMethod === "COD" ? "COD chosen, reference optional" : "Payment Ref / UTR"}
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
              />
            </div>

            {error && <p className="error">{error}</p>}
            <button className="btn" onClick={handleCheckout} disabled={submitting}>
              {submitting ? "Processing..." : "Pay & Generate Receipt"}
            </button>
          </aside>
        </div>
      )}
    </section>
  );
}

