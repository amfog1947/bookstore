import { useEffect, useMemo, useRef, useState } from "react";
import { addDoc, collection, getDocs, limit, onSnapshot, orderBy, query, serverTimestamp } from "firebase/firestore";
import BookCard from "../../components/BookCard";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import { fallbackBooks } from "../../data/fallbackBooks";
import { db } from "../../firebase";

function CustomSelect({ label, value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    const outside = (event) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, []);

  const selected = options.find((item) => item.value === value) || options[0];

  return (
    <div className="filter-group" ref={rootRef}>
      <label className="filter-label">{label}</label>
      <button className="custom-select-trigger" type="button" onClick={() => setOpen((prev) => !prev)}>
        <span>{selected.label}</span>
        <span className={open ? "custom-chevron open" : "custom-chevron"}>v</span>
      </button>
      {open ? (
        <div className="custom-select-menu">
          {options.map((item) => (
            <button
              key={item.value}
              type="button"
              className={value === item.value ? "custom-select-item active" : "custom-select-item"}
              onClick={() => {
                onChange(item.value);
                setOpen(false);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function HomePage() {
  const [books, setBooks] = useState(fallbackBooks);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sortBy, setSortBy] = useState("title");
  const [recTitle, setRecTitle] = useState("");
  const [recAuthor, setRecAuthor] = useState("");
  const [recReason, setRecReason] = useState("");
  const [savingRec, setSavingRec] = useState(false);
  const [toast, setToast] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [recLoading, setRecLoading] = useState(true);
  const { currentUser, userProfile } = useAuth();
  const { addToCart } = useCart();
  const { wishlistBookIds, toggleWishlist } = useWishlist();

  useEffect(() => {
    const fetchBooks = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, "books"), orderBy("title"));
        const snap = await getDocs(q);

        if (!snap.empty) {
          const remoteBooks = snap.docs.map((doc) => ({
            id: doc.id,
            category: "General",
            imageUrl: `https://picsum.photos/seed/book-${doc.id}/460/620`,
            description:
              "This book gives practical concepts for developers. It explains ideas with clear examples and real scenarios. You can apply these techniques in projects and interviews. It helps improve architecture, coding style, and engineering decisions. This title is useful for both students and professionals.",
            ...doc.data(),
          }));

          const seen = new Set(
            remoteBooks.map((book) => `${(book.title || "").toLowerCase()}::${(book.author || "").toLowerCase()}`)
          );
          const extraFallback = fallbackBooks.filter(
            (book) => !seen.has(`${(book.title || "").toLowerCase()}::${(book.author || "").toLowerCase()}`)
          );

          setBooks([...remoteBooks, ...extraFallback]);
        }
      } catch (error) {
        setBooks(fallbackBooks);
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "recommendations"), orderBy("createdAt", "desc"), limit(6));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setRecommendations(
          snap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
        );
        setRecLoading(false);
      },
      () => {
        setRecLoading(false);
      }
    );

    return () => unsub();
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(timer);
  }, [toast]);

  const categoryOptions = useMemo(() => {
    const unique = Array.from(new Set(books.map((book) => book.category || "General")));
    return [{ value: "All", label: "All" }, ...unique.map((item) => ({ value: item, label: item }))];
  }, [books]);

  const sortOptions = useMemo(
    () => [
      { value: "title", label: "Title" },
      { value: "priceLow", label: "Price: Low to High" },
      { value: "priceHigh", label: "Price: High to Low" },
    ],
    []
  );

  const filteredBooks = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    const filtered = books.filter((book) => {
      const title = (book.title || "").toLowerCase();
      const author = (book.author || "").toLowerCase();
      const cat = book.category || "General";
      const matchesSearch = !keyword || title.includes(keyword) || author.includes(keyword);
      const matchesCategory = category === "All" || cat === category;
      return matchesSearch && matchesCategory;
    });

    return filtered.sort((a, b) => {
      if (sortBy === "priceLow") return (a.price || 0) - (b.price || 0);
      if (sortBy === "priceHigh") return (b.price || 0) - (a.price || 0);
      return (a.title || "").localeCompare(b.title || "");
    });
  }, [books, search, category, sortBy]);

  const submitRecommendation = async (event) => {
    event.preventDefault();
    const title = recTitle.trim();
    const author = recAuthor.trim();
    const reason = recReason.trim();

    if (!title || !author || !reason || !currentUser) {
      setToast({ type: "error", text: "Please fill title, author and reason." });
      return;
    }

    setSavingRec(true);

    try {
      await addDoc(collection(db, "recommendations"), {
        title,
        author,
        reason,
        userId: currentUser.uid,
        userEmail: currentUser.email || "",
        userName: (userProfile?.fullName || "").trim() || currentUser.email || "Reader",
        createdAt: serverTimestamp(),
      });

      setRecTitle("");
      setRecAuthor("");
      setRecReason("");
      setToast({ type: "success", text: "Recommendation saved successfully." });
    } catch (error) {
      setToast({ type: "error", text: "Could not save recommendation right now." });
    } finally {
      setSavingRec(false);
    }
  };

  const formatRecommendationTime = (value) => {
    if (!value?.toDate) return "Just now";
    const date = value.toDate();
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  };

  return (
    <section className="page-stack">
      <div className="hero reveal">
        <p className="eyebrow">Bookstore Project</p>
        <h1>Build Your Shelf, One Brilliant Book at a Time</h1>
        <p className="subtitle">
          Search, filter, and sort books before adding them to cart or wishlist.
        </p>
      </div>

      <section className="filters reveal">
        <div className="filter-group filter-wide">
          <label className="filter-label">Search</label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or author"
          />
        </div>
        <CustomSelect label="Category" value={category} options={categoryOptions} onChange={setCategory} />
        <CustomSelect label="Sort By" value={sortBy} options={sortOptions} onChange={setSortBy} />
      </section>

      <section>
        {loading && !books.length ? (
          <p>Loading books...</p>
        ) : filteredBooks.length ? (
          <div className="grid">
            {filteredBooks.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onAdd={addToCart}
                onToggleWishlist={toggleWishlist}
                isWishlisted={wishlistBookIds.has(book.id)}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state reveal">
            <p>No books match your filters.</p>
          </div>
        )}
      </section>

      <section className="recommend-wrap reveal">
        {toast ? (
          <div className={toast.type === "error" ? "toast toast-error" : "toast toast-success"}>{toast.text}</div>
        ) : null}

        <div className="recommend-form-shell">
          <h2>Recommend a Book</h2>
          <p className="subtitle">Share books you want added. Your recommendation is saved to Firebase.</p>
          <form className="recommend-form" onSubmit={submitRecommendation}>
            <input
              value={recTitle}
              onChange={(event) => setRecTitle(event.target.value)}
              placeholder="Book title"
              maxLength={100}
            />
            <input
              value={recAuthor}
              onChange={(event) => setRecAuthor(event.target.value)}
              placeholder="Author"
              maxLength={80}
            />
            <input
              value={recReason}
              onChange={(event) => setRecReason(event.target.value)}
              placeholder="Why do you recommend this?"
              maxLength={220}
            />
            <button className="btn" type="submit" disabled={savingRec}>
              {savingRec ? "Saving..." : "Save Recommendation"}
            </button>
          </form>
        </div>

        <div className="recommend-list-shell">
          <h3>Community Recommendations</h3>
          {recLoading ? (
            <p>Loading recommendations...</p>
          ) : recommendations.length ? (
            <div className="recommend-list">
              {recommendations.map((item) => (
                <article key={item.id} className="recommend-item">
                  <h4>{item.title}</h4>
                  <p className="recommend-meta">by {item.author}</p>
                  <p className="recommend-reason">{item.reason}</p>
                  <p className="recommend-meta">
                    {item.userName} • {formatRecommendationTime(item.createdAt)}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <p>No recommendations yet.</p>
          )}
        </div>
      </section>
    </section>
  );
}
