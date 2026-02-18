import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { useAuth } from "./AuthContext";
import { db } from "../firebase";

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { currentUser } = useAuth();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWishlist = async () => {
      if (!currentUser) {
        setWishlistItems([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const q = query(collection(db, "wishlists"), where("userId", "==", currentUser.uid));
        const snap = await getDocs(q);
        setWishlistItems(
          snap.docs.map((item) => ({
            id: item.id,
            ...item.data(),
          }))
        );
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();
  }, [currentUser]);

  const isWishlisted = useCallback(
    (bookId) => wishlistItems.some((item) => item.bookId === bookId),
    [wishlistItems]
  );
  const wishlistBookIds = useMemo(() => new Set(wishlistItems.map((item) => item.bookId)), [wishlistItems]);

  const toggleWishlist = useCallback(async (book) => {
    if (!currentUser) return;

    const existing = wishlistItems.find((item) => item.bookId === book.id);

    if (existing) {
      await deleteDoc(doc(db, "wishlists", existing.id));
      setWishlistItems((prev) => prev.filter((item) => item.id !== existing.id));
      return;
    }

    const docRef = await addDoc(collection(db, "wishlists"), {
      userId: currentUser.uid,
      bookId: book.id,
      title: book.title,
      author: book.author,
      price: Number(book.price || 0),
      category: book.category || "General",
      imageUrl: book.imageUrl || "",
      createdAt: serverTimestamp(),
    });

    setWishlistItems((prev) => [
      ...prev,
      {
        id: docRef.id,
        userId: currentUser.uid,
        bookId: book.id,
        title: book.title,
        author: book.author,
        price: Number(book.price || 0),
        category: book.category || "General",
        imageUrl: book.imageUrl || "",
      },
    ]);
  }, [currentUser, wishlistItems]);

  const value = useMemo(
    () => ({
      wishlistItems,
      wishlistBookIds,
      wishlistCount: wishlistItems.length,
      isWishlisted,
      toggleWishlist,
      loading,
    }),
    [isWishlisted, loading, toggleWishlist, wishlistBookIds, wishlistItems]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  return useContext(WishlistContext);
}
