import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function AdminRoute({ children }) {
  const { currentUser, isAdmin, profileLoading } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (profileLoading) {
    return <p>Loading profile...</p>;
  }

  if (!isAdmin) {
    return (
      <section className="empty-state">
        <h2>Admin Access Required</h2>
        <p>Your account is not marked as admin.</p>
        <Link className="btn" to="/">
          Back to Store
        </Link>
      </section>
    );
  }

  return children;
}
