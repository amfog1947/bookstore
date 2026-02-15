import { doc, getDoc } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fallbackBooks } from "../../data/fallbackBooks";
import { db } from "../../firebase";
import { formatInr } from "../../utils/format";

function toLines(description) {
  const base = description
    .split(".")
    .map((s) => s.trim())
    .filter(Boolean);
  return base.slice(0, 5);
}

export default function BookDetailPage() {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const snap = await getDoc(doc(db, "books", id));
        if (snap.exists()) {
          setBook({
            id: snap.id,
            imageUrl: `https://picsum.photos/seed/book-${snap.id}/700/420`,
            description:
              "This book gives practical concepts for developers. It explains ideas with clear examples and real scenarios. You can apply these techniques in projects and interviews. It helps improve architecture, coding style, and engineering decisions. This title is useful for both students and professionals.",
            ...snap.data(),
          });
          return;
        }
      } catch (error) {
        // fallback below
      }

      const local = fallbackBooks.find((item) => item.id === id);
      setBook(local || null);
      setLoading(false);
    };

    fetchBook().finally(() => setLoading(false));
  }, [id]);

  const lines = useMemo(() => toLines(book?.description || ""), [book]);

  if (loading) return <p>Loading book...</p>;
  if (!book) return <p>Book not found.</p>;

  return (
    <section className="book-detail-card reveal">
      <div className="book-detail-hero">
        <div className="book-detail-cover-shell">
          <img
            className="book-detail-cover"
            src={book.imageUrl || `https://picsum.photos/seed/book-${book.id}/700/420`}
            alt={`${book.title} cover`}
          />
        </div>
      </div>

      <div className="book-detail-body">
        <div className="book-detail-head">
          <p className="eyebrow">{book.category || "General"}</p>
          <h1>{book.title}</h1>
          <p className="subtitle">by {book.author}</p>
        </div>

        <div className="book-meta-row">
          <span className="meta-pill">Price: {formatInr(book.price || 0)}</span>
          <span className="meta-pill subtle">Book ID: {book.id}</span>
        </div>

        <div className="book-lines">
          <p className="book-lines-title">About this book</p>
          {lines.map((line, idx) => (
            <p key={`${book.id}-${idx}`}>
              <span className="line-dot" />
              {line}.
            </p>
          ))}
        </div>

        <div className="book-detail-actions">
          <Link className="btn btn-lg" to="/">
            Back to Books
          </Link>
        </div>
      </div>
    </section>
  );
}
