import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import { Link } from "react-router-dom";
import { formatInr } from "../../utils/format";

export default function WishlistPage() {
  const { wishlistItems, toggleWishlist, loading } = useWishlist();
  const { addToCart } = useCart();

  return (
    <section className="page-stack">
      <h1>My Wishlist</h1>
      {loading ? (
        <p>Loading wishlist...</p>
      ) : !wishlistItems.length ? (
        <div className="empty-state reveal">
          <p>No items in wishlist yet.</p>
        </div>
      ) : (
        <div className="grid">
          {wishlistItems.map((book) => (
            <article key={book.id} className="book-card reveal">
              <Link to={`/book/${book.bookId}`} className="book-cover-link">
                <img
                  className="book-cover"
                  src={book.imageUrl || `https://picsum.photos/seed/book-${book.bookId}/460/620`}
                  alt={`${book.title} cover`}
                  loading="lazy"
                />
              </Link>
              <div className="book-top-row">
                <span className="book-badge">{book.category || "General"}</span>
                <button
                  className="icon-btn active"
                  onClick={() => toggleWishlist({ ...book, id: book.bookId })}
                  type="button"
                >
                  Saved
                </button>
              </div>
              <Link to={`/book/${book.bookId}`} className="book-title-link">
                <h3>{book.title}</h3>
              </Link>
              <p className="author">by {book.author}</p>
              <div className="book-footer">
                <p className="price">{formatInr(book.price || 0)}</p>
                <button className="btn" onClick={() => addToCart({ ...book, id: book.bookId })}>
                  Move to Cart
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
