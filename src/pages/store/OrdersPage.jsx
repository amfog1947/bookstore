import { collection, getDocs, query, where } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase";
import { formatDateDDMMYYYY, formatInr } from "../../utils/format";

export default function OrdersPage() {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!currentUser) return;

      try {
        const q = query(collection(db, "purchases"), where("userId", "==", currentUser.uid));
        const snap = await getDocs(q);

        setOrders(
          snap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [currentUser]);

  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => {
      const aTime = a.createdAt?.seconds || 0;
      const bTime = b.createdAt?.seconds || 0;
      return bTime - aTime;
    });
  }, [orders]);

  return (
    <section className="page-stack">
      <h1>My Orders</h1>
      {loading ? (
        <p>Loading orders...</p>
      ) : !sortedOrders.length ? (
        <div className="empty-state reveal">
          <p>No purchases yet.</p>
        </div>
      ) : (
        <div className="orders-list">
          {sortedOrders.map((order) => {
            const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : null;
            const itemCount = (order.items || []).reduce((sum, item) => sum + (item.quantity || 0), 0);

            return (
              <article key={order.id} className="order-card reveal">
                <div>
                  <h3>Order #{order.id.slice(0, 8)}</h3>
                  <p>{orderDate ? formatDateDDMMYYYY(orderDate) : "Pending timestamp"}</p>
                  <p>{itemCount} item(s)</p>
                  <p>{order.shippingAddress || "No address saved"}</p>
                </div>
                <div className="order-actions">
                  <p className="price">{formatInr(order.total || 0)}</p>
                  <Link className="btn" to={`/receipt/${order.id}`}>
                    View Receipt
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
