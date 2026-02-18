import { Link } from "react-router-dom";
import { formatInr } from "../utils/format";

export default function BookCard({ book, onAdd, onToggleWishlist, isWishlisted }) {
  return (
    <article className="book-card reveal">
      <Link to={`/book/${book.id}`} className="book-cover-link">
        <img
          className="book-cover"
          src={book.imageUrl || `https://picsum.photos/seed/book-${book.id}/460/620`}
          alt={`${book.title} cover`}
          loading="lazy"
        />
      </Link>
      <div className="book-top-row">
        <span className="book-badge">{book.category || "General"}</span>
        <button
          className={isWishlisted ? "icon-btn active" : "icon-btn"}
          onClick={() => onToggleWishlist(book)}
          aria-label="Toggle wishlist"
          type="button"
        >
          {isWishlisted ? "Saved" : "Save"}
        </button>
      </div>
      <Link to={`/book/${book.id}`} className="book-title-link">
        <h3>{book.title}</h3>
      </Link>
      <p className="author">by {book.author}</p>
      <div className="book-footer">
        <p className="price">{formatInr(book.price || 0)}</p>
        <button className="btn" onClick={() => onAdd(book)}>
          Add to Cart
        </button>
      </div>
    </article>
  );
}

