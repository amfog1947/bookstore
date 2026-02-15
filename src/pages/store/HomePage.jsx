import { useEffect, useMemo, useRef, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import BookCard from "../../components/BookCard";
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
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sortBy, setSortBy] = useState("title");
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const q = query(collection(db, "books"), orderBy("title"));
        const snap = await getDocs(q);

        if (snap.empty) {
          setBooks(fallbackBooks);
        } else {
          setBooks(
            snap.docs.map((doc) => ({
              id: doc.id,
              category: "General",
              imageUrl: `https://picsum.photos/seed/book-${doc.id}/460/620`,
              description:
                "This book gives practical concepts for developers. It explains ideas with clear examples and real scenarios. You can apply these techniques in projects and interviews. It helps improve architecture, coding style, and engineering decisions. This title is useful for both students and professionals.",
              ...doc.data(),
            }))
          );
        }
      } catch (error) {
        setBooks(fallbackBooks);
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, []);

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
        {loading ? (
          <p>Loading books...</p>
        ) : filteredBooks.length ? (
          <div className="grid">
            {filteredBooks.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onAdd={addToCart}
                onToggleWishlist={toggleWishlist}
                isWishlisted={isWishlisted(book.id)}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state reveal">
            <p>No books match your filters.</p>
          </div>
        )}
      </section>
    </section>
  );
}
