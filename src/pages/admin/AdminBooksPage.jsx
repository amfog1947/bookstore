import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../firebase";
import { fallbackBooks } from "../../data/fallbackBooks";
import { formatInr } from "../../utils/format";

const initialForm = {
  title: "",
  author: "",
  category: "General",
  price: "",
  imageUrl: "",
};

export default function AdminBooksPage() {
  const [books, setBooks] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchBooks = async () => {
    setLoading(true);
    setError("");
    try {
      const q = query(collection(db, "books"), orderBy("title"));
      const snap = await getDocs(q);
      if (snap.empty) {
        setBooks(fallbackBooks.map((book) => ({ ...book, _fallback: true })));
      } else {
        setBooks(snap.docs.map((book) => ({ id: book.id, ...book.data(), _fallback: false })));
      }
    } catch (err) {
      setError("Could not read books from Firebase. Showing fallback books.");
      setBooks(fallbackBooks.map((book) => ({ ...book, _fallback: true })));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const payload = {
      title: form.title.trim(),
      author: form.author.trim(),
      category: form.category.trim() || "General",
      price: Number(form.price || 0),
      imageUrl: form.imageUrl.trim() || "",
      updatedAt: serverTimestamp(),
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, "books", editingId), payload);
      } else {
        await addDoc(collection(db, "books"), {
          ...payload,
          createdAt: serverTimestamp(),
        });
      }

      setForm(initialForm);
      setEditingId(null);
      await fetchBooks();
    } catch (err) {
      setError("Save failed. Check Firebase rules and admin role.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (book) => {
    setEditingId(book.id);
    setForm({
      title: book.title || "",
      author: book.author || "",
      category: book.category || "General",
      price: String(book.price ?? ""),
      imageUrl: book.imageUrl || "",
    });
  };

  const handleDelete = async (id) => {
    try {
      setError("");
      await deleteDoc(doc(db, "books", id));
      await fetchBooks();
    } catch (err) {
      setError("Delete failed. Check Firebase rules and admin role.");
    }
  };

  return (
    <section className="page-stack">
      <h1>Admin Book Manager</h1>
      {error ? <p className="error">{error}</p> : null}

      <form className="admin-form reveal" onSubmit={handleSubmit}>
        <input
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
          required
        />
        <input
          placeholder="Author"
          value={form.author}
          onChange={(e) => setForm((prev) => ({ ...prev, author: e.target.value }))}
          required
        />
        <input
          placeholder="Category"
          value={form.category}
          onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
          required
        />
        <input
          type="number"
          step="0.01"
          min="0"
          placeholder="Price"
          value={form.price}
          onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
          required
        />
        <input
          placeholder="Image URL (optional)"
          value={form.imageUrl}
          onChange={(e) => setForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
        />
        <div className="admin-actions">
          <button className="btn" disabled={submitting}>
            {submitting ? "Saving..." : editingId ? "Update Book" : "Add Book"}
          </button>
          {editingId && (
            <button
              type="button"
              className="btn ghost"
              onClick={() => {
                setEditingId(null);
                setForm(initialForm);
              }}
            >
              Cancel Edit
            </button>
          )}
        </div>
      </form>

      {loading ? (
        <p>Loading books...</p>
      ) : (
        <div className="orders-list">
          {books.map((book) => (
            <article key={book.id} className="order-card reveal">
              <div>
                {book.imageUrl ? (
                  <img className="mini-cover" src={book.imageUrl} alt={`${book.title} cover`} />
                ) : null}
                <h3>{book.title}</h3>
                <p>{book.author}</p>
                <p>{book.category || "General"}</p>
              </div>
              <div className="order-actions">
                <p className="price">{formatInr(book.price || 0)}</p>
                <div className="admin-actions">
                  <button
                    className="btn"
                    onClick={() => handleEdit(book)}
                    disabled={book._fallback}
                    title={book._fallback ? "Fallback books cannot be edited" : "Edit"}
                  >
                    Edit
                  </button>
                  <button
                    className="btn ghost"
                    onClick={() => handleDelete(book.id)}
                    disabled={book._fallback}
                    title={book._fallback ? "Fallback books cannot be deleted" : "Delete"}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
