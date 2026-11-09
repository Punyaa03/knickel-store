import './App.css';
import { useState, useRef, useEffect, useMemo } from 'react';
import emailjs from '@emailjs/browser';
import { auth, db, storage } from './firebase'; 
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc, 
  query, 
  where, 
  serverTimestamp,
  onSnapshot,
  orderBy,
  collectionGroup
} from 'firebase/firestore'; 
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// --- SVG ICON COMPONENTS ---
const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const UserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);

const CartIcon = ({ width = 18, height = 18 }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
  </svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
  </svg>
);

const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);

const EyeOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const HeartIcon = ({ filled = false, width = 18, height = 18 }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill={filled ? "#e53935" : "none"} stroke={filled ? "#e53935" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);

const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const TagIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
    <line x1="7" y1="7" x2="7.01" y2="7"/>
  </svg>
);

const ToastSuccessIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2e7d32" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

const ToastErrorIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d32f2f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
  </svg>
);

const ToastInfoIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0288d1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>
);

const PackageIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
    <line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
);

const FilterIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
  </svg>
);

const ShareIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3"></circle>
    <circle cx="6" cy="12" r="3"></circle>
    <circle cx="18" cy="19" r="3"></circle>
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
  </svg>
);

// --- STAR RATING DISPLAY COMPONENT ---
const StarRating = ({ rating = 0, size = 15, interactive = false, onSelect, hoverRating = 0, onHover, onLeave }) => {
  return (
    <div className={`star-rating-display ${interactive ? 'interactive' : ''}`} onMouseLeave={onLeave}>
      {[1, 2, 3, 4, 5].map((star) => {
        const currentVal = interactive && hoverRating > 0 ? hoverRating : rating;
        const isFilled = star <= Math.round(currentVal);
        return (
          <span
            key={star}
            className={`star-icon ${isFilled ? 'filled' : 'empty'}`}
            onClick={() => interactive && onSelect && onSelect(star)}
            onMouseEnter={() => interactive && onHover && onHover(star)}
            style={{
              cursor: interactive ? 'pointer' : 'default',
              fontSize: `${size}px`,
              color: isFilled ? '#ffb400' : '#e2e8f0',
              lineHeight: 1
            }}
          >
            ★
          </span>
        );
      })}
    </div>
  );
};

const COUNTRY_CODES = [
  { code: '+91', name: 'India (+91)', digits: 10 }
];

const CURRENCIES = [
  { code: 'INR', symbol: '₹', rate: 1.0, label: 'INR (₹) - India' }
];

const PROMO_CODES = {
  'KNICKEL10': { type: 'percent', value: 10, label: '10% OFF' },
  'FLAT50': { type: 'flat', value: 50, minSpend: 499, label: '₹50 OFF' },
  'WELCOME20': { type: 'percent', value: 20, label: '20% OFF' }
};

const DEFAULT_CATEGORIES = [
  { name: 'Pendants', subs: ['Silver Pendants', 'Minimalist Pendants', 'Statement Pieces'] },
  { name: 'Keychains', subs: ['Anime', 'Marvel', 'Music Artists', 'Pokemon'] },
  { name: 'Phone Charms', subs: ['Beaded Charms', 'Y2K Style'] },
  { name: 'Bracelets', subs: ['Chain Bracelets', 'Charm Bracelets'] },
  { name: 'Rings', subs: ['Adjustable Rings', 'Statement Pieces'] },
  { name: 'Leather Cord Necklace', subs: ['Pendant Cords', 'Chokers'] }
];

const FALLBACK_PRODUCTS = [
  {
    id: 'sample-1',
    name: 'Vintage Gothic Cross Pendant',
    price: 499,
    category: 'Pendants',
    subCategory: 'Silver Pendants',
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500&auto=format&fit=crop&q=60',
    material: '925 Sterling Silver Plated Alloy',
    size: 'Chain: 45 cm | Pendant: 3 cm x 2 cm',
    stock: 'In Stock (14 available)',
    avgRating: 4.5,
    reviewCount: 2,
    care: 'Keep away from harsh chemicals, perfumes, and moisture. Store in an airtight jewelry pouch.'
  },
  {
    id: 'sample-2',
    name: 'Anime Acrylic Keyring',
    price: 299,
    category: 'Keychains',
    subCategory: 'Anime',
    image: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=500&auto=format&fit=crop&q=60',
    material: 'High-Density Clear Acrylic & Stainless Alloy Ring',
    size: '5.5 cm x 4 cm',
    stock: 'In Stock (22 available)',
    avgRating: 5.0,
    reviewCount: 1,
    care: 'Wipe with a soft microfibre cloth. Peel protective film before use.'
  },
  {
    id: 'sample-3',
    name: 'Marvel Metal Emblem Keychain',
    price: 349,
    category: 'Keychains',
    subCategory: 'Marvel',
    image: 'https://images.unsplash.com/photo-1608889825205-eebdb9fc5806?w=500&auto=format&fit=crop&q=60',
    material: 'Zinc Alloy with Antique Brushed Finish',
    size: '4.5 cm Diameter',
    stock: 'Out of Stock',
    avgRating: 0,
    reviewCount: 0,
    care: 'Avoid dropping on hard surfaces to prevent enamel chipping.'
  },
  {
    id: 'sample-4',
    name: 'Beaded Y2K Phone Charm',
    price: 199,
    category: 'Phone Charms',
    subCategory: 'Y2K Style',
    image: 'https://images.unsplash.com/photo-1611591475281-8d282496293b?w=500&auto=format&fit=crop&q=60',
    material: 'Handcrafted Glass Beads & Reinforced Nylon Cord',
    size: 'Length: 18 cm Cord Loop',
    stock: 'In Stock (19 available)',
    avgRating: 0,
    reviewCount: 0,
    care: 'Do not pull excessively when attached to phone cases.'
  },
  {
    id: 'sample-5',
    name: 'Adjustable Silver Snake Ring',
    price: 399,
    category: 'Rings',
    subCategory: 'Adjustable Rings',
    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=500&auto=format&fit=crop&q=60',
    material: '925 Sterling Silver Plated Brass',
    size: 'Adjustable (Fits US Sizes 6 to 10)',
    stock: 'Low Stock (only 3 left)',
    avgRating: 5.0,
    reviewCount: 1,
    care: 'Gently bend to adjust sizing. Avoid exposure to hand sanitizers and soaps.'
  }
];

const STORE_POLICIES = {
  shipping: {
    title: "Shipping Policy",
    content: (
      <>
        <p><strong>Processing & Delivery:</strong> Standard orders within India are processed within 24-48 hours and typically delivered within 3 to 5 business days.</p>
        <p><strong>Shipping Rates:</strong> We offer <strong>FREE Shipping</strong> on all orders over ₹499. Standard shipping is flat ₹50 for orders under ₹499.</p>
      </>
    )
  },
  privacy: {
    title: "Privacy Policy",
    content: (
      <>
        <p><strong>Data Security:</strong> We prioritize your privacy. Your contact and address details are encrypted and securely stored using Firebase Cloud Services.</p>
      </>
    )
  },
  refund: {
    title: "Refund Policy",
    content: (
      <>
        <p><strong>7-Day Returns:</strong> Standard catalog items can be returned or exchanged within 7 days of delivery in their original, unused condition.</p>
      </>
    )
  },
  terms: {
    title: "Terms of Service",
    content: (
      <>
        <p><strong>Store Usage:</strong> By placing an order with Knickel Store, you agree to provide accurate shipping information and adhere to store policies.</p>
      </>
    )
  },
  story: {
    title: "Our Story",
    content: (
      <>
        <p><strong>Our Mission:</strong> Knickel Store is that one store you keep coming back to... even when you swear it's your last order 😌</p>
      </>
    )
  }
};

const VISIBLE_CATEGORY_NAMES = ['All', 'Pendants', 'Keychains', 'Phone Charms'];

function App() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeSubCategory, setActiveSubCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('Newest');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeHover, setActiveHover] = useState(null); 

  // --- CATALOG FILTER BAR STATES ---
  const [maxPriceFilter, setMaxPriceFilter] = useState(1000);
  const [selectedMaterialFilter, setSelectedMaterialFilter] = useState('All');
  const [inStockOnlyFilter, setInStockOnlyFilter] = useState(false);

  // --- GUEST ORDER TRACKING STATES ---
  const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);
  const [guestOrderIdInput, setGuestOrderIdInput] = useState('');
  const [trackedOrderResult, setTrackedOrderResult] = useState(null);
  const [isSearchingOrder, setIsSearchingOrder] = useState(false);
  const [trackingError, setTrackingError] = useState('');

  // Toast Notification State & Helper
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'success', duration = 3000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Quick View / Product Detail Modal States
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quickViewQty, setQuickViewQty] = useState(1);
  const [activeDetailTab, setActiveDetailTab] = useState('specs');

  // FIRESTORE REVIEWS & RATING FILTERS STATE
  const [activeProductReviews, setActiveProductReviews] = useState([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [reviewFilter, setReviewFilter] = useState('all'); 
  const [newReviewRating, setNewReviewRating] = useState(0);
  const [hoverReviewRating, setHoverReviewRating] = useState(0);
  const [newReviewAuthor, setNewReviewAuthor] = useState('');
  const [newReviewComment, setNewReviewComment] = useState('');
  const [reviewFile, setReviewFile] = useState(null);
  const [reviewFilePreview, setReviewFilePreview] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const handleReviewFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast("File size must be under 5MB.", "error");
        return;
      }
      setReviewFile(file);
      setReviewFilePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveReviewFile = () => {
    setReviewFile(null);
    setReviewFilePreview('');
  };

  useEffect(() => {
    if (!quickViewProduct) {
      setActiveProductReviews([]);
      setReviewFilter('all');
      return;
    }

    setIsLoadingReviews(true);
    const reviewsRef = collection(db, "products", quickViewProduct.id, "reviews");
    const q = query(reviewsRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedReviews = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        let dateStr = data.date;
        if (data.createdAt && data.createdAt.toDate) {
          dateStr = data.createdAt.toDate().toISOString().split('T')[0];
        } else if (!dateStr) {
          dateStr = new Date().toISOString().split('T')[0];
        }

        return {
          id: docSnap.id,
          ...data,
          date: dateStr
        };
      });

      const visibleCustomerReviews = fetchedReviews.filter(r => r.approved !== false);
      setActiveProductReviews(visibleCustomerReviews);
      setIsLoadingReviews(false);
    }, (error) => {
      console.error("Firestore reviews subscription error:", error);
      setIsLoadingReviews(false);
    });

    return () => unsubscribe();
  }, [quickViewProduct]);

  const getRatingStats = (productOrId) => {
    if (quickViewProduct && (typeof productOrId === 'string' ? productOrId === quickViewProduct.id : productOrId.id === quickViewProduct.id)) {
      if (activeProductReviews.length === 0) return { avg: "0.0", count: 0 };
      const sum = activeProductReviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
      return {
        avg: (sum / activeProductReviews.length).toFixed(1),
        count: activeProductReviews.length
      };
    }

    if (typeof productOrId === 'object' && productOrId !== null) {
      const count = productOrId.reviewCount || 0;
      const avg = productOrId.avgRating ? Number(productOrId.avgRating).toFixed(1) : "0.0";
      return { avg, count };
    }

    return { avg: "0.0", count: 0 };
  };

  const handleAddReview = async (e) => {
    e.preventDefault();
    if (newReviewRating === 0) {
      showToast("Please select a 1-5 star rating.", "error");
      return;
    }
    if (!newReviewComment.trim()) {
      showToast("Please write a review comment.", "error");
      return;
    }

    const reviewerName = currentUser 
      ? (userProfile?.fullName || currentUser.displayName || currentUser.email.split('@')[0])
      : (newReviewAuthor.trim() || 'Anonymous Customer');

    setIsSubmittingReview(true);

    try {
      let uploadedPhotoUrl = null;

      if (reviewFile) {
        const storageRef = ref(storage, `review_photos/${Date.now()}_${reviewFile.name}`);
        const uploadSnapshot = await uploadBytes(storageRef, reviewFile);
        uploadedPhotoUrl = await getDownloadURL(uploadSnapshot.ref);
      }

      const reviewPayload = {
        author: reviewerName,
        rating: Number(newReviewRating),
        comment: newReviewComment.trim(),
        imageUrl: uploadedPhotoUrl,
        approved: true,
        userId: currentUser ? currentUser.uid : 'guest',
        createdAt: serverTimestamp(),
        date: new Date().toISOString().split('T')[0]
      };

      await addDoc(collection(db, "products", quickViewProduct.id, "reviews"), reviewPayload);

      const updatedList = [reviewPayload, ...activeProductReviews];
      const newCount = updatedList.length;
      const newSum = updatedList.reduce((sum, r) => sum + Number(r.rating), 0);
      const newAvg = Number((newSum / newCount).toFixed(1));

      await updateDoc(doc(db, "products", quickViewProduct.id), {
        avgRating: newAvg,
        reviewCount: newCount
      }).catch(() => {});

      setAccessories((prev) => prev.map(p => 
        p.id === quickViewProduct.id 
          ? { ...p, avgRating: newAvg, reviewCount: newCount }
          : p
      ));

      setNewReviewRating(0);
      setHoverReviewRating(0);
      setNewReviewComment('');
      setNewReviewAuthor('');
      setReviewFile(null);
      setReviewFilePreview('');
      showToast("Thank you! Review & photo published.", "success");
    } catch (err) {
      console.error("Error submitting review:", err);
      showToast("Could not submit review. Please try again.", "error");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const displayedReviews = useMemo(() => {
    return activeProductReviews.filter((rev) => {
      if (reviewFilter === 'all') return true;
      if (reviewFilter === 'photos') return Boolean(rev.imageUrl);
      return Number(rev.rating) === Number(reviewFilter);
    });
  }, [activeProductReviews, reviewFilter]);

  // ADMIN DASHBOARD STATES
  const [adminTab, setAdminTab] = useState('inventory'); 
  const [adminReviewsList, setAdminReviewsList] = useState([]);
  const [isFetchingAdminReviews, setIsFetchingAdminReviews] = useState(false);
  const [adminSelectedProductFilter, setAdminSelectedProductFilter] = useState('All');

  const [adminOrdersList, setAdminOrdersList] = useState([]);
  const [isFetchingAdminOrders, setIsFetchingAdminOrders] = useState(false);
  const [adminOrderStatusFilter, setAdminOrderStatusFilter] = useState('All');

  const fetchAllAdminReviews = async () => {
    if (!isAdmin) {
      showToast("Access denied.", "error");
      return;
    }
    setIsFetchingAdminReviews(true);

    try {
      const snapshot = await getDocs(query(collectionGroup(db, "reviews")));
      const list = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        const parentProductDoc = docSnap.ref.parent.parent;
        const productId = parentProductDoc ? parentProductDoc.id : 'unknown';
        const productObj = accessories.find(a => a.id === productId);

        return {
          id: docSnap.id,
          productId,
          productName: productObj ? productObj.name : `Product (${productId})`,
          ...data
        };
      });

      setAdminReviewsList(list);
    } catch (err) {
      console.warn("CollectionGroup query failed, falling back to per-product query:", err);
      try {
        const allReviewsArr = [];
        for (const prod of accessories) {
          const revSnap = await getDocs(collection(db, "products", prod.id, "reviews"));
          revSnap.docs.forEach((d) => {
            allReviewsArr.push({
              id: d.id,
              productId: prod.id,
              productName: prod.name,
              ...d.data()
            });
          });
        }
        setAdminReviewsList(allReviewsArr);
      } catch (fallbackErr) {
        console.error("Fallback review fetch error:", fallbackErr);
        showToast("Could not load reviews moderation list.", "error");
      }
    } finally {
      setIsFetchingAdminReviews(false);
    }
  };

  const fetchAllAdminOrders = async () => {
    if (!isAdmin) {
      showToast("Access denied.", "error");
      return;
    }
    setIsFetchingAdminOrders(true);
    try {
      const snapshot = await getDocs(collection(db, "orders"));
      const ordersData = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data()
      }));

      ordersData.sort((a, b) => {
        const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt || 0).getTime();
        const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt || 0).getTime();
        return timeB - timeA;
      });

      setAdminOrdersList(ordersData);
    } catch (err) {
      console.error("Error fetching all orders for admin management:", err);
      showToast("Could not load store orders list.", "error");
    } finally {
      setIsFetchingAdminOrders(false);
    }
  };

  const handleUpdateOrderStatus = async (orderParam, newStatus) => {
    try {
      const orderObj = typeof orderParam === 'object' && orderParam !== null
        ? orderParam
        : adminOrdersList.find(o => o.id === orderParam || o.orderId === orderParam);

      const orderDocId = orderObj?.id || orderObj?.orderId || (typeof orderParam === 'string' ? orderParam : null);

      if (!orderDocId) {
        showToast("Could not locate Order ID.", "error");
        return;
      }

      const orderRef = doc(db, "orders", orderDocId);
      await updateDoc(orderRef, {
        status: newStatus,
        updatedAt: serverTimestamp()
      });

      setAdminOrdersList(prev =>
        prev.map(o => (o.id === orderDocId || o.orderId === orderDocId) ? { ...o, status: newStatus } : o)
      );

      showToast(`Order status updated to ${newStatus}!`, "success");

      const recipientEmail = orderObj?.userEmail || orderObj?.shippingDetails?.email;
      if (recipientEmail) {
        try {
          const customerName = orderObj?.shippingDetails?.fullName || 'Valued Customer';
          await emailjs.send(
            process.env.REACT_APP_EMAILJS_SERVICE_ID || 'service_xl2jc1o',
            process.env.REACT_APP_EMAILJS_TEMPLATE_ID || 'template_nb10y1p',
            {
              to_email: recipientEmail,
              user_email: recipientEmail,
              user_name: customerName,
              order_id: orderObj?.orderId || orderDocId,
              order_status: newStatus,
              total_amount: formatPrice(orderObj?.totalAmount || 0),
              address: orderObj?.shippingDetails?.address || '',
              city: orderObj?.shippingDetails?.city || '',
              zip: orderObj?.shippingDetails?.zipCode || '',
              phone: orderObj?.shippingDetails?.fullPhone || orderObj?.shippingDetails?.phone || '',
              message: `Your order #${orderObj?.orderId || orderDocId} status has been updated to: ${newStatus}.`
            },
            process.env.REACT_APP_EMAILJS_PUBLIC_KEY || 't02pHVeEU4EepvFMy'
          );
        } catch (emailErr) {
          console.warn("EmailJS notification failed to send:", emailErr);
        }
      }
    } catch (err) {
      console.error("Error updating order status in Firestore:", err);
      showToast("Failed to update order status.", "error");
    }
  };

  const handleToggleApproveReview = async (review) => {
    if (!review.productId) return;
    try {
      const newApprovedState = review.approved === false ? true : false;
      const revRef = doc(db, "products", review.productId, "reviews", review.id);
      
      await updateDoc(revRef, { approved: newApprovedState });

      setAdminReviewsList(prev => prev.map(r => r.id === review.id ? { ...r, approved: newApprovedState } : r));
      showToast(`Review ${newApprovedState ? 'approved and visible' : 'hidden from customers'}.`, "info");
    } catch (err) {
      console.error("Error updating review approval:", err);
      showToast("Failed to update review status.", "error");
    }
  };

  const handleDeleteAdminReview = async (review) => {
    if (!review.productId) return;
    try {
      const revRef = doc(db, "products", review.productId, "reviews", review.id);
      await deleteDoc(revRef);

      const updatedAdminList = adminReviewsList.filter(r => r.id !== review.id);
      setAdminReviewsList(updatedAdminList);

      const productReviewsRemaining = updatedAdminList.filter(r => r.productId === review.productId && r.approved !== false);
      const count = productReviewsRemaining.length;
      const sum = productReviewsRemaining.reduce((acc, r) => acc + Number(r.rating || 0), 0);
      const avg = count > 0 ? Number((sum / count).toFixed(1)) : 0;

      await updateDoc(doc(db, "products", review.productId), {
        avgRating: avg,
        reviewCount: count
      }).catch(() => {});

      setAccessories(prev => prev.map(p => p.id === review.productId ? { ...p, avgRating: avg, reviewCount: count } : p));
      showToast("Review deleted permanently.", "info");
    } catch (err) {
      console.error("Error deleting review:", err);
      showToast("Failed to delete review.", "error");
    }
  };

  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponFeedback, setCouponFeedback] = useState({ type: '', text: '' });

  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [activePolicyTab, setActivePolicyTab] = useState('shipping');

  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef(null);

  const [selectedCurrency] = useState(CURRENCIES[0]);
  const [ setIsCurrencyOpen] = useState(false);
  const currencyRef = useRef(null);
  
  const [openFaq, setOpenFaq] = useState(0);

  const faqData = [
    {
      question: "What's the Minimum Purchase Value?",
      answer: "Our minimum order value is as low as 1000 RS"
    },
    {
      question: "Are any purchases final sale?",
      answer: "Customized items are final sale. Standard catalog items can be returned within 7 days of delivery."
    },
    {
      question: "When will I get my order?",
      answer: "Standard delivery across India usually takes 3 to 5 business days after dispatch."
    },
    {
      question: "Where are your products manufactured?",
      answer: "Our curated keychains, charms, and accessories are handcrafted and sourced directly in India."
    },
    {
      question: "How much does shipping cost?",
      answer: "We offer Free Shipping on orders over ₹499. Standard shipping is ₹50 for smaller orders."
    }
  ];

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sortRef.current && !sortRef.current.contains(event.target)) {
        setIsSortOpen(false);
      }
      if (currencyRef.current && !currencyRef.current.contains(event.target)) {
        setIsCurrencyOpen(false);
      }
      if (!event.target.closest('.nav-item-container')) {
        setActiveHover(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  });

  const [accessories, setAccessories] = useState([]); 
  const [isLoading, setIsLoading] = useState(true);

  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem('knickel_store_cart');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
      console.error("Error reading cart from localStorage:", error);
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  const [wishlist, setWishlist] = useState([]);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [sharedWishlistItems, setSharedWishlistItems] = useState([]);

  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [isAdminSubmitting, setIsAdminSubmitting] = useState(false);
  
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [isCustomSubCategory, setIsCustomSubCategory] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [customSubCategoryName, setCustomSubCategoryName] = useState('');

  const [adminProductForm, setAdminProductForm] = useState({
    id: '',
    name: '',
    price: '',
    category: 'Pendants',
    subCategory: 'Silver Pendants',
    image: '',
    material: '',
    stock: 'In Stock'
  });

  const formatPrice = (amountInBaseCurrency) => {
    const num = Number(amountInBaseCurrency) || 0;
    const converted = num * selectedCurrency.rate;
    return `${selectedCurrency.symbol}${converted.toFixed(2)}`;
  };

  const availableMaterials = useMemo(() => {
    const materialsSet = new Set();
    accessories.forEach((item) => {
      if (item.material && item.material.trim()) {
        materialsSet.add(item.material.trim());
      }
    });
    return Array.from(materialsSet);
  }, [accessories]);

  const categoryData = useMemo(() => {
    const map = new Map();

    DEFAULT_CATEGORIES.forEach((cat) => {
      map.set(cat.name, new Set(cat.subs));
    });

    accessories.forEach((prod) => {
      if (prod.category && prod.category !== 'All') {
        if (!map.has(prod.category)) {
          map.set(prod.category, new Set());
        }
        if (prod.subCategory && prod.subCategory !== 'All') {
          map.get(prod.category).add(prod.subCategory);
        }
      }
    });

    const result = [{ name: 'All', subs: [] }];
    map.forEach((subsSet, catName) => {
      result.push({
        name: catName,
        subs: Array.from(subsSet)
      });
    });

    return result;
  }, [accessories]);

  useEffect(() => {
    try {
      localStorage.setItem('knickel_store_cart', JSON.stringify(cart));
    } catch (error) {
      console.error("Error saving cart to localStorage:", error);
    }
  }, [cart]);

  const [currentUser, setCurrentUser] = useState(null); 
  const [userProfile, setUserProfile] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false); 
  const [authMode, setAuthMode] = useState('login'); 
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false); 
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_CODES[0]);

  const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(false);
  const [userOrders, setUserOrders] = useState([]);
  const [isFetchingOrders, setIsFetchingOrders] = useState(false);
  
  const [shippingDetails, setShippingDetails] = useState({
    fullName: '',
    email: '',
    address: '',
    city: '',
    zipCode: '',
    phone: ''
  });

  const [validationErrors, setValidationErrors] = useState({});

  const isAdmin = currentUser && (
    currentUser.email === 'knickel.store@gmail.com' || 
    userProfile?.role === 'admin'
  );

  const fetchProducts = async () => {
    setIsLoading(true);
    const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(null), 3000));

    try {
      const firestorePromise = getDocs(collection(db, "products"));
      const querySnapshot = await Promise.race([firestorePromise, timeoutPromise]);

      if (querySnapshot && !querySnapshot.empty) {
        const productsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setAccessories(productsData);
      } else {
        setAccessories(FALLBACK_PRODUCTS);
      }
    } catch (error) {
      console.error("Error fetching products from Firestore:", error);
      setAccessories(FALLBACK_PRODUCTS);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        setShippingDetails((prev) => ({ 
          ...prev, 
          email: user.email || '',
          fullName: user.displayName || prev.fullName
        }));

        try {
          const userDocRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userDocRef);
          if (userSnap.exists()) {
            setUserProfile(userSnap.data());
          }

          const wishlistDocRef = doc(db, "wishlists", user.uid);
          const wishlistSnap = await getDoc(wishlistDocRef);
          if (wishlistSnap.exists()) {
            setWishlist(wishlistSnap.data().items || []);
          } else {
            setWishlist([]);
          }
        } catch (err) {
          console.error("Error fetching user profile or wishlist:", err);
        }
      } else {
        setCurrentUser(null);
        setUserProfile(null);
        setWishlist([]);
      }
    });

    return () => unsubscribe(); 
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    
    const sharedProductId = urlParams.get('product');
    if (sharedProductId && accessories.length > 0) {
      const foundProduct = accessories.find((p) => p.id === sharedProductId);
      if (foundProduct) {
        setQuickViewProduct(foundProduct);
      }
    }

    const sharedWishlistParam = urlParams.get('wishlist');
    if (sharedWishlistParam && accessories.length > 0) {
      try {
        const decodedIds = atob(sharedWishlistParam).split(',');
        const sharedItems = accessories.filter((p) => decodedIds.includes(p.id));

        if (sharedItems.length > 0) {
          setSharedWishlistItems(sharedItems);
          setIsWishlistOpen(true);
          showToast('Viewing shared wishlist items!', 'info');
        }
      } catch (err) {
        console.error('Invalid wishlist URL token', err);
      }
    }
  }, [accessories]);

  const handleShareProduct = (e, productId) => {
    if (e) e.stopPropagation();
    const shareUrl = `${window.location.origin}${window.location.pathname}?product=${productId}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      showToast('Product link copied to clipboard!', 'success');
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = shareUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      showToast('Product link copied!', 'success');
    }
  };

  const handleShareWishlist = () => {
    const currentListToShare = sharedWishlistItems.length > 0 ? sharedWishlistItems : wishlist;
    if (currentListToShare.length === 0) {
      showToast('Your wishlist is empty!', 'error');
      return;
    }
    
    const rawIds = currentListToShare.map((item) => item.id).join(',');
    const encodedIds = btoa(rawIds); 
    const shareLink = `${window.location.origin}${window.location.pathname}?wishlist=${encodedIds}`;
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareLink);
      showToast('Wishlist link copied to clipboard!', 'success');
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = shareLink;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      showToast('Wishlist link copied!', 'success');
    }
  };

  const cartSubtotal = cart.reduce(
    (total, item) => total + (Number(item.price) || 0) * item.quantity,
    0
  );
  const cartItemsCount = cart.reduce((total, item) => total + item.quantity, 0);

  const discountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.type === 'percent') {
      return (cartSubtotal * appliedCoupon.value) / 100;
    }
    if (appliedCoupon.type === 'flat') {
      return Math.min(appliedCoupon.value, cartSubtotal);
    }
    return 0;
  }, [appliedCoupon, cartSubtotal]);

  const finalTotalDue = Math.max(0, cartSubtotal - discountAmount);

  const handleApplyCoupon = (e) => {
    if (e) e.preventDefault();
    const cleanCode = couponInput.trim().toUpperCase();
    setCouponFeedback({ type: '', text: '' });

    if (!cleanCode) {
      setCouponFeedback({ type: 'error', text: 'Please enter a coupon code.' });
      showToast('Please enter a coupon code.', 'error');
      return;
    }

    const found = PROMO_CODES[cleanCode];
    if (!found) {
      setCouponFeedback({ type: 'error', text: 'Invalid promo code. Try KNICKEL10 or FLAT50.' });
      showToast('Invalid promo code.', 'error');
      return;
    }

    if (found.minSpend && cartSubtotal < found.minSpend) {
      setCouponFeedback({ type: 'error', text: `Requires minimum subtotal of ₹${found.minSpend}.` });
      showToast(`Requires minimum subtotal of ₹${found.minSpend}.`, 'error');
      return;
    }

    setAppliedCoupon({ code: cleanCode, ...found });
    setCouponFeedback({ type: 'success', text: `Coupon "${cleanCode}" applied successfully!` });
    showToast(`Coupon "${cleanCode}" applied!`, 'success');
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponFeedback({ type: '', text: '' });
    showToast('Coupon removed.', 'info');
  };

  const handleOpenQuickView = (product, e) => {
    if (e) e.stopPropagation();
    setQuickViewProduct(product);
    setActiveImageIndex(0);
    setQuickViewQty(1);
    setActiveDetailTab('specs');
  };

  const handleCloseQuickView = () => {
    setQuickViewProduct(null);
    setNewReviewRating(0);
    setHoverReviewRating(0);
    setNewReviewComment('');
    setNewReviewAuthor('');
    setReviewFile(null);
    setReviewFilePreview('');
    setReviewFilter('all');
  };

  const getProductGallery = (product) => {
    if (!product) return [];
    if (product.galleryImages && Array.isArray(product.galleryImages) && product.galleryImages.length > 0) {
      return product.galleryImages;
    }
    return [
      product.image,
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1611591475281-8d282496293b?w=600&auto=format&fit=crop&q=80'
    ];
  };

  const handleCategoryNav = (categoryName) => {
    setActiveCategory(categoryName);
    setActiveSubCategory('All');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenPolicyModal = (policyKey = 'shipping') => {
    setActivePolicyTab(policyKey);
    setIsPolicyModalOpen(true);
  };

  const handleSearchGuestOrder = async (e) => {
    if (e) e.preventDefault();
    const cleanSearchId = guestOrderIdInput.trim().toUpperCase();
    setTrackingError('');
    setTrackedOrderResult(null);

    if (!cleanSearchId) {
      setTrackingError('Please enter a valid Order ID (e.g. KNK-849201).');
      return;
    }

    setIsSearchingOrder(true);
    try {
      const directDocRef = doc(db, "orders", cleanSearchId);
      const directSnap = await getDoc(directDocRef);

      if (directSnap.exists()) {
        setTrackedOrderResult({ id: directSnap.id, ...directSnap.data() });
        showToast("Order details retrieved!", "success");
      } else {
        const q = query(collection(db, "orders"), where("orderId", "==", cleanSearchId));
        const qSnap = await getDocs(q);

        if (!qSnap.empty) {
          const foundDoc = qSnap.docs[0];
          setTrackedOrderResult({ id: foundDoc.id, ...foundDoc.data() });
          showToast("Order details retrieved!", "success");
        } else {
          setTrackingError(`No order found matching "${cleanSearchId}". Please verify your Order ID.`);
          showToast("Order not found.", "error");
        }
      }
    } catch (err) {
      console.error("Error searching order in Firestore:", err);
      setTrackingError("Error fetching order. Please check your connection.");
      showToast("Could not fetch order status.", "error");
    } finally {
      setIsSearchingOrder(false);
    }
  };

  const handleQuickLinkNav = (action) => {
    if (action === 'track') {
      setIsTrackModalOpen(true);
      setTrackedOrderResult(null);
      setGuestOrderIdInput('');
      setTrackingError('');
    } else if (action === 'story') {
      handleOpenPolicyModal('story');
    } else if (action === 'login') {
      if (currentUser) {
        setIsAccountMenuOpen(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        openAuthModal('login');
      }
    } else if (action === 'contact') {
      const contactElement = document.querySelector('.contact-col');
      if (contactElement) {
        contactElement.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const formatAuthError = (error) => {
    const code = error.code || '';
    switch (code) {
      case 'auth/email-already-in-use':
        return 'An account with this email already exists. Try logging in.';
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'Invalid email or password. Please try again.';
      case 'auth/weak-password':
        return 'Password should be at least 8 characters long.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      default:
        return error.message ? error.message.replace('Firebase: ', '') : 'An error occurred. Please try again.';
    }
  };

  const handleFullNameChange = (e) => {
    const cleanName = e.target.value.replace(/[0-9]/g, '');
    setFullName(cleanName);
  };

  const validatePasswordRules = (pwd) => {
    const hasMinLength = pwd.length >= 8;
    const hasUppercase = /[A-Z]/.test(pwd);
    const hasLowercase = /[a-z]/.test(pwd);
    const hasDigit = /[0-9]/.test(pwd);
    const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pwd);

    if (!hasMinLength) return 'Password must be at least 8 characters long.';
    if (!hasUppercase) return 'Password must contain at least one uppercase letter (A-Z).';
    if (!hasLowercase) return 'Password must contain at least one lowercase letter (a-z).';
    if (!hasDigit) return 'Password must contain at least one number (0-9).';
    if (!hasSpecialChar) return 'Password must contain at least one special character (!@#$%^&* etc.).';
    return null;
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault(); 
    setAuthError(''); 
    setAuthSuccess('');

    if (authMode === 'signup') {
      const passwordError = validatePasswordRules(password);
      if (passwordError) {
        setAuthError(passwordError);
        return;
      }
    }

    setIsAuthSubmitting(true);

    try {
      if (authMode === 'signup') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await updateProfile(user, { displayName: fullName });

        const userDocData = {
          uid: user.uid,
          fullName: fullName,
          email: email,
          createdAt: serverTimestamp(),
          role: 'customer'
        };
        await setDoc(doc(db, "users", user.uid), userDocData);
        setUserProfile(userDocData);

        setIsAuthModalOpen(false); 
        resetAuthForm();
        showToast(`Welcome to Knickel Store, ${fullName}!`, 'success');

      } else if (authMode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
        setIsAuthModalOpen(false); 
        resetAuthForm();
        showToast('Signed in successfully!', 'success');

      } else if (authMode === 'reset') {
        await sendPasswordResetEmail(auth, email);
        setAuthSuccess('Password reset link sent to your email!');
        setIsAuthSubmitting(false);
        showToast('Password reset email sent!', 'info');
      }
    } catch (error) {
      console.error("Detailed Auth Error:", error);
      const formatted = formatAuthError(error);
      setAuthError(formatted);
      showToast(formatted, 'error');
      setIsAuthSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsAccountMenuOpen(false);
      showToast('Signed out successfully.', 'info');
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  const resetAuthForm = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setShowPassword(false);
    setAuthError('');
    setAuthSuccess('');
    setIsAuthSubmitting(false);
  };

  const openAuthModal = (mode = 'login') => {
    setAuthMode(mode);
    resetAuthForm();
    setIsAuthModalOpen(true);
  };

  const toggleWishlist = async (product) => {
    if (!currentUser) {
      setAuthError('Please sign in to save items to your wishlist.');
      openAuthModal('login');
      showToast('Please sign in to save items.', 'info');
      return;
    }

    const exists = wishlist.some((item) => item.id === product.id);
    const updatedWishlist = exists
      ? wishlist.filter((item) => item.id !== product.id)
      : [...wishlist, product];

    setWishlist(updatedWishlist);
    showToast(
      exists ? `Removed "${product.name}" from Saved Items.` : `Saved "${product.name}" to Wishlist!`, 
      exists ? 'info' : 'success'
    );

    try {
      await setDoc(doc(db, "wishlists", currentUser.uid), {
        userId: currentUser.uid,
        items: updatedWishlist,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error("Error updating wishlist in Firestore:", error);
    }
  };

  const resetAdminForm = () => {
    setAdminProductForm({
      id: '',
      name: '',
      price: '',
      category: 'Pendants',
      subCategory: 'Silver Pendants',
      image: '',
      material: '',
      stock: 'In Stock'
    });
    setIsEditingProduct(false);
    setIsCustomCategory(false);
    setIsCustomSubCategory(false);
    setCustomCategoryName('');
    setCustomSubCategoryName('');
  };

  const handleAdminCategorySelect = (e) => {
    const val = e.target.value;
    if (val === '__NEW_CATEGORY__') {
      setIsCustomCategory(true);
      setIsCustomSubCategory(true);
      setAdminProductForm(prev => ({ ...prev, category: '', subCategory: '' }));
    } else {
      setIsCustomCategory(false);
      setIsCustomSubCategory(false);
      const found = categoryData.find((cat) => cat.name === val);
      const defaultSub = found && found.subs.length > 0 ? found.subs[0] : '';
      setAdminProductForm(prev => ({ ...prev, category: val, subCategory: defaultSub }));
    }
  };

  const handleAdminSubCategorySelect = (e) => {
    const val = e.target.value;
    if (val === '__NEW_SUBCATEGORY__') {
      setIsCustomSubCategory(true);
      setAdminProductForm(prev => ({ ...prev, subCategory: '' }));
    } else {
      setIsCustomSubCategory(false);
      setAdminProductForm(prev => ({ ...prev, subCategory: val }));
    }
  };

  const handleEditProductClick = (product) => {
    setIsEditingProduct(true);
    setIsCustomCategory(false);
    setIsCustomSubCategory(false);
    setAdminProductForm({
      id: product.id,
      name: product.name || '',
      price: product.price || '',
      category: product.category || 'Pendants',
      subCategory: product.subCategory || '',
      image: product.image || '',
      material: product.material || '',
      stock: product.stock || 'In Stock'
    });
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();

    const finalCategory = isCustomCategory ? customCategoryName.trim() : adminProductForm.category;
    const finalSubCategory = (isCustomCategory || isCustomSubCategory) ? customSubCategoryName.trim() : adminProductForm.subCategory;

    if (!adminProductForm.name || !adminProductForm.price || !adminProductForm.image || !finalCategory) {
      showToast("Please fill in all product fields.", "error");
      return;
    }

    setIsAdminSubmitting(true);
    try {
      const productPayload = {
        name: adminProductForm.name,
        price: Number(adminProductForm.price),
        category: finalCategory,
        subCategory: finalSubCategory,
        image: adminProductForm.image,
        material: adminProductForm.material.trim() || 'Standard Alloy',
        stock: adminProductForm.stock || 'In Stock',
        updatedAt: serverTimestamp()
      };

      if (isEditingProduct) {
        await updateDoc(doc(db, "products", adminProductForm.id), productPayload);
        showToast("Product updated successfully!", "success");
      } else {
        await addDoc(collection(db, "products"), {
          ...productPayload,
          createdAt: serverTimestamp(),
          avgRating: 0,
          reviewCount: 0
        });
        showToast("New product added to catalog!", "success");
      }

      await fetchProducts();
      resetAdminForm();
    } catch (error) {
      console.error("Error saving product to Firestore:", error);
      showToast("Error saving product. Check console.", "error");
    } finally {
      setIsAdminSubmitting(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    try {
      await deleteDoc(doc(db, "products", productId));
      await fetchProducts();
      showToast("Product deleted from catalog.", "info");
    } catch (error) {
      console.error("Error deleting product from Firestore:", error);
      showToast("Could not delete product.", "error");
    }
  };

  const fetchUserOrders = async () => {
    if (!currentUser) return;
    setIsFetchingOrders(true);
    try {
      const q = query(
        collection(db, "orders"),
        where("userId", "==", currentUser.uid)
      );
      const querySnapshot = await getDocs(q);
      const ordersData = querySnapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data()
      }));

      ordersData.sort((a, b) => {
        const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt || 0).getTime();
        const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt || 0).getTime();
        return timeB - timeA;
      });

      setUserOrders(ordersData);
    } catch (error) {
      console.error("Error fetching user orders:", error);
    } finally {
      setIsFetchingOrders(false);
    }
  };

  const handleOpenMyOrders = () => {
    setIsAccountMenuOpen(false);
    setIsOrdersModalOpen(true);
    fetchUserOrders();
  };

  const handleOpenWishlist = () => {
    setIsAccountMenuOpen(false);
    setSharedWishlistItems([]);
    setIsWishlistOpen(true);
  };

  const handleOpenAdminModal = () => {
    if (!isAdmin) {
      showToast("Access denied. Admin privileges required.", "error");
      return;
    }
    setIsAccountMenuOpen(false);
    resetAdminForm();
    setAdminTab('inventory');
    setIsAdminModalOpen(true);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Recent';
    if (timestamp.toDate) {
      return timestamp.toDate().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
    return new Date(timestamp).toLocaleDateString('en-US');
  };

  const addToCart = (product, qty = 1) => {
    if (product.stock && product.stock.toLowerCase().includes('out of stock')) {
      showToast(`Sorry, "${product.name}" is currently out of stock.`, 'error');
      return;
    }

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((item) => item.id === product.id);
      if (existingIndex > -1) {
        const updated = [...prevCart];
        updated[existingIndex].quantity += qty;
        return updated;
      }
      return [...prevCart, { ...product, quantity: qty }];
    });
    showToast(`Added "${product.name}" to cart!`, 'success');
  };

  const updateQuantity = (id, delta) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (id) => {
    const itemToRemove = cart.find(i => i.id === id);
    setCart((prevCart) => prevCart.filter((item) => item.id !== id));
    showToast(`Removed ${itemToRemove ? `"${itemToRemove.name}"` : 'item'} from cart.`, 'info');
  };

  const handleProceedToCheckout = () => {
    if (!currentUser) {
      setIsCartOpen(false);
      setAuthError('Please sign in or create an account to proceed to checkout.');
      openAuthModal('login');
      showToast('Please sign in to proceed to checkout.', 'info');
      return;
    }
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'fullName') {
      const cleanName = value.replace(/[0-9]/g, '');
      setShippingDetails((prev) => ({ ...prev, fullName: cleanName }));
      return;
    }

    if (name === 'phone') {
      const numericValue = value.replace(/\D/g, '').slice(0, selectedCountry.digits);
      setShippingDetails((prev) => ({ ...prev, phone: numericValue }));
      return;
    }

    setShippingDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handleCountryChange = (e) => {
    const found = COUNTRY_CODES.find((c) => c.code === e.target.value) || COUNTRY_CODES[0];
    setSelectedCountry(found);
    setShippingDetails((prev) => ({
      ...prev,
      phone: prev.phone.slice(0, found.digits)
    }));
  };

  const validateCheckoutForm = () => {
    const errors = {};
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    const invalidExtensions = ['.coms', '.con', '.coom', '.gamil.com', '.gmial.com'];
    const emailLower = shippingDetails.email.toLowerCase().trim();
    const hasTypo = invalidExtensions.some((ext) => emailLower.endsWith(ext));

    if (!emailRegex.test(emailLower) || hasTypo) {
      errors.email = 'Please enter a valid email address.';
    }

    if (shippingDetails.phone.length !== selectedCountry.digits) {
      errors.phone = `Phone number must be exactly ${selectedCountry.digits} digits.`;
    }

    if (shippingDetails.zipCode.trim().length < 4 || shippingDetails.zipCode.trim().length > 10) {
      errors.zipCode = 'ZIP/Postal code must be between 4 and 10 characters.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!validateCheckoutForm()) return;

    setIsSubmittingOrder(true);

    const customOrderId = `KNK-${Math.floor(100000 + Math.random() * 900000)}`;

    const orderData = {
      orderId: customOrderId,
      userId: currentUser ? currentUser.uid : 'guest',
      userEmail: shippingDetails.email,
      shippingDetails: {
        ...shippingDetails,
        fullPhone: `${selectedCountry.code} ${shippingDetails.phone}`
      },
      items: cart.map((item) => ({
        id: item.id,
        name: item.name,
        price: Number(item.price) || 0,
        quantity: item.quantity
      })),
      subtotal: cartSubtotal,
      discount: discountAmount,
      appliedCoupon: appliedCoupon ? appliedCoupon.code : null,
      totalAmount: finalTotalDue,
      currency: selectedCurrency.code,
      paymentMethod,
      status: 'Placed',
      createdAt: serverTimestamp()
    };

    try {
      await setDoc(doc(db, "orders", customOrderId), orderData);

      const itemsHtml = cart.map((item) => `
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 10px 0; width: 60px;">
            <img src="${item.image}" alt="${item.name}" width="50" height="50" style="border-radius: 6px; object-fit: cover; display: block;" />
          </td>
          <td style="padding: 10px; font-size: 14px; color: #333;">
            <strong>${item.name}</strong><br/>
            <span style="font-size: 12px; color: #777;">Qty: ${item.quantity}</span>
          </td>
          <td style="padding: 10px 0; font-size: 14px; text-align: right; color: #111; font-weight: bold;">
            ${formatPrice(item.price * item.quantity)}
          </td>
        </tr>
      `).join('');

      await emailjs.send(
        process.env.REACT_APP_EMAILJS_SERVICE_ID || 'service_xl2jc1o',
        process.env.REACT_APP_EMAILJS_TEMPLATE_ID || 'template_nb10y1p',
        {
          to_email: shippingDetails.email,
          user_email: shippingDetails.email,
          user_name: shippingDetails.fullName,
          order_id: customOrderId,
          total_amount: formatPrice(finalTotalDue),
          subtotal_amount: formatPrice(cartSubtotal),
          discount_amount: formatPrice(discountAmount),
          coupon_code: appliedCoupon ? appliedCoupon.code : 'None',
          address: shippingDetails.address,
          city: shippingDetails.city,
          zip: shippingDetails.zipCode,
          phone: `${selectedCountry.code} ${shippingDetails.phone}`,
          items_html: itemsHtml
        },
        process.env.REACT_APP_EMAILJS_PUBLIC_KEY || 't02pHVeEU4EepvFMy'
      );

      setCompletedOrder({ id: customOrderId, ...orderData });
      setCart([]);
      setAppliedCoupon(null);
      setCouponInput('');
      showToast('Order placed successfully!', 'success');
    } catch (error) {
      console.error("Error creating order or sending email: ", error);
      showToast("Order placed, but email dispatch failed.", "info");
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const closeCheckoutModal = () => {
    setIsCheckoutOpen(false);
    setCompletedOrder(null);
    setValidationErrors({});
  };

  const filteredProducts = accessories
    .filter((product) => {
      const matchesMain = activeCategory === 'All' || product.category === activeCategory;
      const matchesSub = activeSubCategory === 'All' || product.subCategory === activeSubCategory;
      
      const term = searchTerm.toLowerCase().trim();
      const productName = (product.name || "").toLowerCase();
      const productCat = (product.category || "").toLowerCase();
      const productSub = (product.subCategory || "").toLowerCase();

      const matchesSearch = 
        productName.includes(term) || 
        productCat.includes(term) || 
        productSub.includes(term);

      const itemPrice = Number(product.price) || 0;
      const matchesPrice = itemPrice <= maxPriceFilter || maxPriceFilter >= 1000;

      const matchesMaterial = selectedMaterialFilter === 'All' || 
        (product.material && product.material.toLowerCase().includes(selectedMaterialFilter.toLowerCase()));

      const isItemOutOfStock = product.stock && product.stock.toLowerCase().includes('out of stock');
      const matchesStock = !inStockOnlyFilter || !isItemOutOfStock;

      return matchesMain && matchesSub && matchesSearch && matchesPrice && matchesMaterial && matchesStock;
    })
    .sort((a, b) => {
      if (sortOption === 'Price: Low to High') {
        return (Number(a.price) || 0) - (Number(b.price) || 0);
      }
      if (sortOption === 'Price: High to Low') {
        return (Number(b.price) || 0) - (Number(a.price) || 0);
      }
      if (sortOption === 'Newest') {
        const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
        return timeB - timeA;
      }
      return 0;
    });

  const displayNameToShow = userProfile?.fullName || currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User';
  const selectedCategoryObj = categoryData.find(c => c.name === adminProductForm.category);
  const availableSubCategories = selectedCategoryObj ? selectedCategoryObj.subs : [];

  const visibleCategories = categoryData.filter(c => VISIBLE_CATEGORY_NAMES.includes(c.name));
  const moreCategories = categoryData.filter(c => !VISIBLE_CATEGORY_NAMES.includes(c.name));

  return (
    <div className="app-container">
      {/* TOAST NOTIFICATION CONTAINER */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast-card ${toast.type}`}>
            <span className="toast-icon">
              {toast.type === 'success' && <ToastSuccessIcon />}
              {toast.type === 'error' && <ToastErrorIcon />}
              {toast.type === 'info' && <ToastInfoIcon />}
            </span>
            <span className="toast-message">{toast.message}</span>
            <button className="toast-close-btn" onClick={() => removeToast(toast.id)}>
              <CloseIcon />
            </button>
          </div>
        ))}
      </div>

      {/* NAVBAR */}
      <nav className="store-navbar">
        <div className="navbar-left" onClick={() => handleCategoryNav('All')}>
          <h1>Knickel Store</h1>
        </div>

        <div className="navbar-center">
          {visibleCategories.map((cat) => (
            <div 
              key={cat.name} 
              className={`nav-item-container ${activeHover === cat.name ? 'open' : ''}`}
              onMouseEnter={() => setActiveHover(cat.name)}
              onMouseLeave={() => setActiveHover(null)}
            >
              <button 
                className={`nav-link-btn ${activeCategory === cat.name ? 'active' : ''}`}
                onClick={() => {
                  setActiveCategory(cat.name);
                  setActiveSubCategory('All'); 
                  setActiveHover(null);
                }}
              >
                {cat.name}
              </button>

              {cat.subs && cat.subs.length > 0 && (
                <div className="mega-menu">
                  <div className="mega-menu-content">
                    {cat.subs.map((sub) => (
                      <button 
                        key={sub} 
                        className={`sub-link-btn ${activeSubCategory === sub && activeCategory === cat.name ? 'active-sub' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveCategory(cat.name);
                          setActiveSubCategory(sub);
                          setActiveHover(null); 
                        }}
                      >
                        {sub}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {moreCategories.length > 0 && (
            <div 
              className={`nav-item-container ${activeHover === 'More' ? 'open' : ''}`}
              onMouseEnter={() => setActiveHover('More')}
              onMouseLeave={() => setActiveHover(null)}
            >
              <button 
                className={`nav-link-btn ${moreCategories.some(c => c.name === activeCategory) ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveHover(prev => prev === 'More' ? null : 'More');
                }}
              >
                More ▾
              </button>

              <div className="mega-menu">
                <div className="mega-menu-content">
                  {moreCategories.map((cat) => (
                    <button 
                      key={cat.name} 
                      className={`sub-link-btn ${activeCategory === cat.name ? 'active-sub' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveCategory(cat.name);
                        setActiveSubCategory('All');
                        setActiveHover(null); 
                      }}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="navbar-right">
          <div className="custom-sort-container" ref={sortRef}>
            <button 
              type="button"
              className={`custom-sort-btn ${isSortOpen ? 'active' : ''}`} 
              onClick={() => setIsSortOpen(!isSortOpen)}
            >
              <span>{sortOption === 'Newest' ? 'Sort: Newest' : sortOption}</span>
              <svg 
                width="12" 
                height="12" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                style={{ 
                  transform: isSortOpen ? 'rotate(180deg)' : 'rotate(0deg)', 
                  transition: 'transform 0.2s ease' 
                }}
              >
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>

            {isSortOpen && (
              <div className="custom-sort-menu">
                {[
                  { label: 'Sort: Newest', value: 'Newest' },
                  { label: 'Price: Low to High', value: 'Price: Low to High' },
                  { label: 'Price: High to Low', value: 'Price: High to Low' }
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`custom-sort-item ${sortOption === option.value ? 'selected' : ''}`}
                    onClick={() => {
                      setSortOption(option.value);
                      setIsSortOpen(false);
                    }}
                  >
                    <span>{option.label}</span>
                    {sortOption === option.value && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div 
            className={`search-container ${isSearchOpen ? 'expanded' : ''}`}
            onMouseEnter={() => setIsSearchOpen(true)}
            onMouseLeave={() => { if (!searchTerm) setIsSearchOpen(false); }}
          >
            <button className="icon-btn search-icon"><SearchIcon /></button>
            <input
              type="text"
              placeholder="Search..."
              className="hidden-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="account-container">
            {currentUser ? (
              <div 
                className="user-profile-btn" 
                onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
              >
                <button className="icon-btn" title="Account"><UserIcon /></button>
                
                {isAccountMenuOpen && (
                  <div className="profile-dropdown">
                    <p style={{ margin: 0, fontWeight: 'bold', color: '#000' }}>{displayNameToShow}</p>
                    <p style={{ fontSize: '0.8rem', color: '#777', wordBreak: 'break-all', margin: '2px 0 0 0' }}>
                      {currentUser.email}
                    </p>
                    <hr />
                    {isAdmin && (
                      <button className="profile-link" onClick={handleOpenAdminModal}>
                        Admin Dashboard
                      </button>
                    )}
                    <button className="profile-link" onClick={handleOpenWishlist}>
                      Saved Items ({wishlist.length})
                    </button>
                    <button className="profile-link" onClick={handleOpenMyOrders}>My Orders</button>
                    <button className="profile-link logout-btn" onClick={handleLogout}>Sign Out</button>
                  </div>
                )}
              </div>
            ) : (
              <button className="icon-btn" title="Sign In" onClick={() => openAuthModal('login')}>
                <UserIcon />
              </button>
            )}
          </div>

          <button 
            className="icon-btn" 
            title="Cart" 
            style={{ position: 'relative' }}
            onClick={() => setIsCartOpen(true)}
          >
            <CartIcon />
            {cartItemsCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: '#333',
                color: '#fff',
                borderRadius: '50%',
                fontSize: '0.7rem',
                width: '16px',
                height: '16px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {cartItemsCount}
              </span>
            )}
          </button>
        </div>
      </nav>

      {/* CATALOG FILTER BAR */}
      <div className="catalog-filter-bar-wrapper">
        <div className="catalog-filter-bar">
          <div className="filter-group-title">
            <FilterIcon /> Filters
          </div>

          <div className="filter-item price-slider-group">
            <label>
              Max Price: <strong>₹{maxPriceFilter >= 1000 ? '1,000+' : maxPriceFilter}</strong>
            </label>
            <input 
              type="range" 
              min="100" 
              max="1000" 
              step="50" 
              value={maxPriceFilter}
              onChange={(e) => setMaxPriceFilter(Number(e.target.value))}
              className="price-range-input"
            />
          </div>

          <div className="filter-item material-select-group">
            <label>Material:</label>
            <select 
              className="filter-select"
              value={selectedMaterialFilter}
              onChange={(e) => setSelectedMaterialFilter(e.target.value)}
            >
              <option value="All">All Materials</option>
              {availableMaterials.map((mat, i) => (
                <option key={i} value={mat}>{mat}</option>
              ))}
            </select>
          </div>

          <div className="filter-item instock-toggle-group">
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={inStockOnlyFilter}
                onChange={(e) => setInStockOnlyFilter(e.target.checked)}
              />
              <span className="slider round"></span>
            </label>
            <span className="toggle-label-text">In-Stock Only</span>
          </div>

          {(maxPriceFilter < 1000 || selectedMaterialFilter !== 'All' || inStockOnlyFilter) && (
            <button 
              className="reset-filters-btn"
              onClick={() => {
                setMaxPriceFilter(1000);
                setSelectedMaterialFilter('All');
                setInStockOnlyFilter(false);
              }}
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* PUBLIC GUEST ORDER TRACKING MODAL */}
      {isTrackModalOpen && (
        <div className="modal-overlay" onClick={() => setIsTrackModalOpen(false)}>
          <div className="orders-modal guest-tracking-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal-btn" onClick={() => setIsTrackModalOpen(false)}>
              <CloseIcon />
            </button>

            <div className="guest-track-header">
              <PackageIcon />
              <h2>Track Your Order</h2>
            </div>
            <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '20px', textAlign: 'center' }}>
              Enter your Order ID below to view live shipping status and delivery details.
            </p>

            <form onSubmit={handleSearchGuestOrder} className="guest-track-form">
              <input 
                type="text"
                placeholder="Order ID (e.g., KNK-849201)"
                required
                className="auth-input"
                value={guestOrderIdInput}
                onChange={(e) => setGuestOrderIdInput(e.target.value)}
              />
              <button 
                type="submit" 
                className="auth-submit-btn" 
                disabled={isSearchingOrder}
                style={{ marginTop: 0 }}
              >
                {isSearchingOrder ? 'Searching...' : 'Track'}
              </button>
            </form>

            {trackingError && (
              <div className="auth-error-msg" style={{ marginTop: '15px' }}>
                {trackingError}
              </div>
            )}

            {trackedOrderResult && (
              <div className="tracked-order-result-card" style={{ marginTop: '20px' }}>
                <div className="order-card-header">
                  <div>
                    <div className="order-id-title">{trackedOrderResult.orderId || trackedOrderResult.id}</div>
                    <div className="order-date-text">Placed on {formatDate(trackedOrderResult.createdAt)}</div>
                  </div>
                  <span className={`status-badge ${(trackedOrderResult.status || 'placed').toLowerCase()}`}>
                    {trackedOrderResult.status || 'Placed'}
                  </span>
                </div>

                <div className="order-details-grid">
                  <div className="order-detail-block">
                    <strong>Shipping Details</strong>
                    <span>{trackedOrderResult.shippingDetails?.fullName}</span><br />
                    <span>{trackedOrderResult.shippingDetails?.address}, {trackedOrderResult.shippingDetails?.city}</span><br />
                    <span>ZIP: {trackedOrderResult.shippingDetails?.zipCode}</span>
                  </div>

                  <div className="order-detail-block">
                    <strong>Payment Method</strong>
                    <span style={{ textTransform: 'capitalize' }}>
                      {trackedOrderResult.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Card'}
                    </span>
                  </div>
                </div>

                <div className="order-items-mini-list">
                  <strong style={{ fontSize: '0.85rem', color: '#111', display: 'block', marginBottom: '6px' }}>
                    Items Included:
                  </strong>
                  {trackedOrderResult.items?.map((item, idx) => (
                    <div key={idx} className="order-item-row">
                      <span>{item.name} × {item.quantity}</span>
                      <strong>{formatPrice((item.price || 0) * item.quantity)}</strong>
                    </div>
                  ))}
                </div>

                <div className="order-card-footer">
                  <span>Total Amount</span>
                  <span>{formatPrice(trackedOrderResult.totalAmount)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* QUICK VIEW / PRODUCT DETAIL MODAL */}
      {quickViewProduct && (
        <div className="modal-overlay" onClick={handleCloseQuickView}>
          <div className="quickview-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal-btn" onClick={handleCloseQuickView}>
              <CloseIcon />
            </button>

            <div className="quickview-grid">
              <div className="quickview-gallery-col">
                <div className="quickview-main-img-wrap">
                  <img 
                    src={getProductGallery(quickViewProduct)[activeImageIndex] || quickViewProduct.image} 
                    alt={quickViewProduct.name} 
                    className="quickview-main-img" 
                  />
                  <button 
                    className={`qv-heart-btn ${wishlist.some(item => item.id === quickViewProduct.id) ? 'active' : ''}`}
                    onClick={() => toggleWishlist(quickViewProduct)}
                  >
                    <HeartIcon filled={wishlist.some(item => item.id === quickViewProduct.id)} />
                  </button>
                </div>

                <div className="quickview-thumb-row">
                  {getProductGallery(quickViewProduct).map((imgUrl, idx) => (
                    <button 
                      key={idx} 
                      className={`qv-thumb-btn ${activeImageIndex === idx ? 'selected' : ''}`}
                      onClick={() => setActiveImageIndex(idx)}
                    >
                      <img src={imgUrl} alt={`Thumbnail ${idx + 1}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="quickview-info-col">
                <div className="qv-category-tag">{quickViewProduct.category} {quickViewProduct.subCategory ? `› ${quickViewProduct.subCategory}` : ''}</div>
                <h2 className="qv-title">{quickViewProduct.name}</h2>
                
                {(() => {
                  const stats = getRatingStats(quickViewProduct);
                  return (
                    <div 
                      className="qv-rating-summary" 
                      onClick={() => setActiveDetailTab('reviews')}
                      title="Jump to Customer Reviews"
                    >
                      <StarRating rating={Math.round(Number(stats.avg))} size={16} />
                      <span className="qv-rating-text">
                        {stats.count > 0 
                          ? `${stats.avg} out of 5 (${stats.count} ${stats.count === 1 ? 'review' : 'reviews'})` 
                          : 'No reviews yet — be the first to review!'}
                      </span>
                    </div>
                  );
                })()}

                <div className="qv-price-row">
                  <span className="qv-price">{formatPrice(quickViewProduct.price)}</span>
                  <span className={`qv-stock-badge ${quickViewProduct.stock && quickViewProduct.stock.toLowerCase().includes('out of stock') ? 'out-of-stock' : ''}`}>
                    ● {quickViewProduct.stock || 'In Stock - Ready to Ship'}
                  </span>
                </div>

                <hr className="qv-divider" />

                <div className="qv-action-block">
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#444' }}>Quantity:</label>
                  <div className="qv-qty-row">
                    <div className="cart-qty-controls">
                      <button className="qty-btn" onClick={() => setQuickViewQty(prev => Math.max(1, prev - 1))}>-</button>
                      <span className="qty-count">{quickViewQty}</span>
                      <button className="qty-btn" onClick={() => setQuickViewQty(prev => prev + 1)}>+</button>
                    </div>

                    <button 
                      className="auth-submit-btn qv-add-cart-btn"
                      disabled={quickViewProduct.stock && quickViewProduct.stock.toLowerCase().includes('out of stock')}
                      onClick={() => {
                        addToCart(quickViewProduct, quickViewQty);
                        handleCloseQuickView();
                        setIsCartOpen(true);
                      }}
                    >
                      {quickViewProduct.stock && quickViewProduct.stock.toLowerCase().includes('out of stock') 
                        ? 'Out of Stock' 
                        : `Add to Cart (${formatPrice((Number(quickViewProduct.price) || 0) * quickViewQty)})`}
                    </button>
                  </div>

                  <button 
                    type="button"
                    className="qv-share-btn"
                    onClick={(e) => handleShareProduct(e, quickViewProduct.id)}
                    style={{ marginTop: '12px' }}
                  >
                    <ShareIcon /> Share Product
                  </button>
                </div>

                <div className="qv-details-tabs">
                  <div className="qv-tab-buttons">
                    <button 
                      className={`qv-tab-btn ${activeDetailTab === 'specs' ? 'active' : ''}`}
                      onClick={() => setActiveDetailTab('specs')}
                    >
                      Specifications
                    </button>
                    <button 
                      className={`qv-tab-btn ${activeDetailTab === 'care' ? 'active' : ''}`}
                      onClick={() => setActiveDetailTab('care')}
                    >
                      Care Instructions
                    </button>
                    <button 
                      className={`qv-tab-btn ${activeDetailTab === 'delivery' ? 'active' : ''}`}
                      onClick={() => setActiveDetailTab('delivery')}
                    >
                      Delivery
                    </button>
                    <button 
                      className={`qv-tab-btn ${activeDetailTab === 'reviews' ? 'active' : ''}`}
                      onClick={() => setActiveDetailTab('reviews')}
                    >
                      Reviews ({getRatingStats(quickViewProduct).count})
                    </button>
                  </div>

                  <div className="qv-tab-content">
                    {activeDetailTab === 'specs' && (
                      <ul className="qv-spec-list">
                        <li><strong>Material:</strong> {quickViewProduct.material || 'Premium Stainless Steel / Alloy'}</li>
                        <li><strong>Dimensions:</strong> {quickViewProduct.size || 'Standard Size / Adjustable'}</li>
                        <li><strong>Finish:</strong> Hand-polished High Luster finish</li>
                        <li><strong>Item Code:</strong> {quickViewProduct.id}</li>
                      </ul>
                    )}

                    {activeDetailTab === 'care' && (
                      <p className="qv-tab-text">
                        {quickViewProduct.care || 'Keep away from direct water, alcohol, perfumes, and body lotions. Store in a cool, dry place inside an airtight cloth or zip-lock pouch.'}
                      </p>
                    )}

                    {activeDetailTab === 'delivery' && (
                      <p className="qv-tab-text">
                        Standard delivery across India takes 3 to 5 business days. Free shipping on orders over ₹499. Eligible for 7-day hassle-free return or replacement.
                      </p>
                    )}

                    {activeDetailTab === 'reviews' && (
                      <div className="reviews-tab-container">
                        {(() => {
                          const stats = getRatingStats(quickViewProduct);

                          return (
                            <>
                              <div className="reviews-summary-card">
                                <div className="summary-left">
                                  <div className="big-avg-score">{stats.count > 0 ? stats.avg : '0.0'}</div>
                                  <StarRating rating={Math.round(Number(stats.avg))} size={18} />
                                  <div className="total-rev-count">{stats.count} Verified {stats.count === 1 ? 'Rating' : 'Ratings'}</div>
                                </div>

                                <div className="summary-right">
                                  {[5, 4, 3, 2, 1].map((starVal) => {
                                    const starCount = activeProductReviews.filter(r => Number(r.rating) === starVal).length;
                                    const percentage = stats.count > 0 ? Math.round((starCount / stats.count) * 100) : 0;
                                    return (
                                      <div key={starVal} className="rating-bar-row">
                                        <span className="bar-label">{starVal} ★</span>
                                        <div className="bar-track">
                                          <div className="bar-fill" style={{ width: `${percentage}%` }}></div>
                                        </div>
                                        <span className="bar-percent">{percentage}%</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              <div className="review-filter-bar">
                                <span className="filter-label">Filter:</span>
                                <button 
                                  className={`filter-chip ${reviewFilter === 'all' ? 'active' : ''}`} 
                                  onClick={() => setReviewFilter('all')}
                                >
                                  All ({activeProductReviews.length})
                                </button>
                                {[5, 4, 3, 2, 1].map(num => (
                                  <button 
                                    key={num} 
                                    className={`filter-chip ${reviewFilter === String(num) ? 'active' : ''}`}
                                    onClick={() => setReviewFilter(String(num))}
                                  >
                                    {num} ★ ({activeProductReviews.filter(r => Number(r.rating) === num).length})
                                  </button>
                                ))}
                                <button 
                                  className={`filter-chip ${reviewFilter === 'photos' ? 'active' : ''}`}
                                  onClick={() => setReviewFilter('photos')}
                                >
                                  📷 With Photos ({activeProductReviews.filter(r => Boolean(r.imageUrl)).length})
                                </button>
                              </div>

                              <div className="add-review-form-box">
                                <h4>Write a Customer Review</h4>
                                <form onSubmit={handleAddReview}>
                                  <div className="star-picker-row">
                                    <span>Select Rating:</span>
                                    <StarRating 
                                      rating={newReviewRating} 
                                      hoverRating={hoverReviewRating}
                                      interactive={true}
                                      size={22}
                                      onSelect={(r) => setNewReviewRating(r)}
                                      onHover={(r) => setHoverReviewRating(r)}
                                      onLeave={() => setHoverReviewRating(0)}
                                    />
                                    <span className="star-rating-hint">
                                      {hoverReviewRating || newReviewRating ? `${hoverReviewRating || newReviewRating} Stars` : 'Tap to rate'}
                                    </span>
                                  </div>

                                  {!currentUser && (
                                    <input 
                                      type="text" 
                                      placeholder="Your Name (e.g. Ananya S.)"
                                      className="auth-input"
                                      value={newReviewAuthor}
                                      onChange={(e) => setNewReviewAuthor(e.target.value)}
                                      style={{ marginBottom: '10px' }}
                                    />
                                  )}

                                  <div className="review-file-upload-box" style={{ marginBottom: '12px' }}>
                                    {!reviewFilePreview ? (
                                      <label className="file-upload-label" style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '8px 14px',
                                        background: '#f1f5f9',
                                        border: '1px dashed #94a3b8',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontSize: '0.82rem',
                                        color: '#475569',
                                        fontWeight: 500
                                      }}>
                                        <span>📷 Attach Photo / Take Picture</span>
                                        <input 
                                          type="file" 
                                          accept="image/*" 
                                          onChange={handleReviewFileChange} 
                                          style={{ display: 'none' }} 
                                        />
                                      </label>
                                    ) : (
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <img 
                                          src={reviewFilePreview} 
                                          alt="Upload preview" 
                                          style={{ width: '50px', height: '50px', borderRadius: '6px', objectFit: 'cover', border: '1px solid #ddd' }} 
                                        />
                                        <button 
                                          type="button" 
                                          onClick={handleRemoveReviewFile}
                                          style={{ background: 'none', border: 'none', color: '#e53935', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
                                        >
                                          Remove Photo
                                        </button>
                                      </div>
                                    )}
                                  </div>

                                  <textarea 
                                    placeholder="Write your thoughts about this product..."
                                    rows="3"
                                    required
                                    className="review-textarea"
                                    value={newReviewComment}
                                    onChange={(e) => setNewReviewComment(e.target.value)}
                                  />

                                  <button 
                                    type="submit" 
                                    className="auth-submit-btn submit-review-btn"
                                    disabled={isSubmittingReview}
                                  >
                                    {isSubmittingReview ? 'Publishing...' : 'Submit Review'}
                                  </button>
                                </form>
                              </div>

                              <div className="reviews-list">
                                {isLoadingReviews ? (
                                  <p className="no-reviews-msg">Syncing reviews live from Firestore...</p>
                                ) : displayedReviews.length === 0 ? (
                                  <p className="no-reviews-msg">No reviews match your selected filter.</p>
                                ) : (
                                  displayedReviews.map((rev) => (
                                    <div key={rev.id} className="review-card">
                                      <div className="review-card-header">
                                        <div>
                                          <strong className="reviewer-name">{rev.author}</strong>
                                          <span className="verified-badge">✓ Verified Buyer</span>
                                        </div>
                                        <span className="review-date">{rev.date}</span>
                                      </div>
                                      <div className="review-stars">
                                        <StarRating rating={rev.rating} size={14} />
                                      </div>
                                      <p className="review-comment-text">{rev.comment}</p>

                                      {rev.imageUrl && (
                                        <div className="review-image-wrapper">
                                          <img 
                                            src={rev.imageUrl} 
                                            alt="Customer review attachment" 
                                            className="review-user-photo" 
                                            onClick={() => window.open(rev.imageUrl, '_blank')}
                                            title="Click to view full photo"
                                          />
                                        </div>
                                      )}
                                    </div>
                                  ))
                                )}
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* POLICY MODAL */}
      {isPolicyModalOpen && (
        <div className="modal-overlay" onClick={() => setIsPolicyModalOpen(false)}>
          <div className="policy-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal-btn" onClick={() => setIsPolicyModalOpen(false)}>
              <CloseIcon />
            </button>

            <div className="policy-tabs-nav">
              {Object.keys(STORE_POLICIES).map((key) => (
                <button
                  key={key}
                  className={`policy-tab-btn ${activePolicyTab === key ? 'active' : ''}`}
                  onClick={() => setActivePolicyTab(key)}
                >
                  {STORE_POLICIES[key].title}
                </button>
              ))}
            </div>

            <div className="policy-modal-body">
              <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '1.25rem', color: '#111' }}>
                {STORE_POLICIES[activePolicyTab]?.title}
              </h3>
              {STORE_POLICIES[activePolicyTab]?.content}
            </div>

            <button 
              className="auth-submit-btn" 
              style={{ width: '100%', marginTop: '24px' }}
              onClick={() => setIsPolicyModalOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ADMIN DASHBOARD MODAL */}
      {isAdmin && isAdminModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAdminModalOpen(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal-btn" onClick={() => setIsAdminModalOpen(false)}>
              <CloseIcon />
            </button>

            <h2>Admin Dashboard</h2>
            <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '15px' }}>
              Manage products, moderate customer reviews, and track customer orders.
            </p>

            <div className="admin-tab-nav">
              <button 
                className={`admin-tab-btn ${adminTab === 'inventory' ? 'active' : ''}`}
                onClick={() => setAdminTab('inventory')}
              >
                Inventory Management
              </button>
              <button 
                className={`admin-tab-btn ${adminTab === 'reviews' ? 'active' : ''}`}
                onClick={() => {
                  setAdminTab('reviews');
                  fetchAllAdminReviews();
                }}
              >
                Review Moderation Panel
              </button>
              <button 
                className={`admin-tab-btn ${adminTab === 'orders' ? 'active' : ''}`}
                onClick={() => {
                  setAdminTab('orders');
                  fetchAllAdminOrders();
                }}
              >
                Order Tracking Panel
              </button>
            </div>

            {adminTab === 'inventory' && (
              <div className="admin-layout">
                <div className="admin-form-panel">
                  <h3>{isEditingProduct ? 'Edit Product' : 'Add New Product'}</h3>
                  <form onSubmit={handleSaveProduct}>
                    <input
                      type="text"
                      name="name"
                      placeholder="Product Title"
                      required
                      className="auth-input"
                      value={adminProductForm.name}
                      onChange={(e) => setAdminProductForm({ ...adminProductForm, name: e.target.value })}
                    />

                    <input
                      type="number"
                      name="price"
                      placeholder="Price (₹ INR)"
                      step="0.01"
                      min="0"
                      required
                      className="auth-input"
                      value={adminProductForm.price}
                      onChange={(e) => setAdminProductForm({ ...adminProductForm, price: e.target.value })}
                    />

                    <input
                      type="text"
                      name="material"
                      placeholder="Material / Finish (e.g. 925 Silver, Alloy)"
                      className="auth-input"
                      value={adminProductForm.material}
                      onChange={(e) => setAdminProductForm({ ...adminProductForm, material: e.target.value })}
                    />

                    <label style={{ fontSize: '0.8rem', color: '#555', display: 'block', marginBottom: '4px' }}>
                      Category
                    </label>
                    {!isCustomCategory ? (
                      <select
                        name="category"
                        className="admin-select"
                        value={adminProductForm.category}
                        onChange={handleAdminCategorySelect}
                      >
                        {categoryData.filter(c => c.name !== 'All').map(c => (
                          <option key={c.name} value={c.name}>{c.name}</option>
                        ))}
                        <option value="__NEW_CATEGORY__">+ Add New Category...</option>
                      </select>
                    ) : (
                      <div style={{ marginBottom: '12px' }}>
                        <input
                          type="text"
                          placeholder="New Category Name (e.g. Necklaces)"
                          required
                          className="auth-input"
                          value={customCategoryName}
                          onChange={(e) => setCustomCategoryName(e.target.value)}
                        />
                        <button 
                          type="button" 
                          style={{ background: 'none', border: 'none', color: '#1976d2', cursor: 'pointer', fontSize: '0.78rem', padding: 0 }}
                          onClick={() => setIsCustomCategory(false)}
                        >
                          ← Select Existing Category
                        </button>
                      </div>
                    )}

                    <label style={{ fontSize: '0.8rem', color: '#555', display: 'block', marginBottom: '4px' }}>
                      Subcategory
                    </label>
                    {(!isCustomCategory && !isCustomSubCategory) ? (
                      <select
                        name="subCategory"
                        className="admin-select"
                        value={adminProductForm.subCategory}
                        onChange={handleAdminSubCategorySelect}
                      >
                        {availableSubCategories.map(sub => (
                          <option key={sub} value={sub}>{sub}</option>
                        ))}
                        <option value="__NEW_SUBCATEGORY__">+ Add New Subcategory...</option>
                      </select>
                    ) : (
                      <div style={{ marginBottom: '12px' }}>
                        <input
                          type="text"
                          placeholder="New Subcategory Name (e.g. Chokers)"
                          className="auth-input"
                          value={customSubCategoryName}
                          onChange={(e) => setCustomSubCategoryName(e.target.value)}
                        />
                        {!isCustomCategory && (
                          <button 
                            type="button" 
                            style={{ background: 'none', border: 'none', color: '#1976d2', cursor: 'pointer', fontSize: '0.78rem', padding: 0 }}
                            onClick={() => setIsCustomSubCategory(false)}
                          >
                            ← Select Existing Subcategory
                          </button>
                        )}
                      </div>
                    )}

                    <input
                      type="url"
                      name="image"
                      placeholder="Image URL (e.g., https://...)"
                      required
                      className="auth-input"
                      value={adminProductForm.image}
                      onChange={(e) => setAdminProductForm({ ...adminProductForm, image: e.target.value })}
                    />

                    <select
                      name="stock"
                      className="admin-select"
                      value={adminProductForm.stock}
                      onChange={(e) => setAdminProductForm({ ...adminProductForm, stock: e.target.value })}
                    >
                      <option value="In Stock">In Stock</option>
                      <option value="Low Stock">Low Stock</option>
                      <option value="Out of Stock">Out of Stock</option>
                    </select>

                    <button 
                      type="submit" 
                      className="auth-submit-btn" 
                      disabled={isAdminSubmitting}
                      style={{ width: '100%', marginTop: '5px' }}
                    >
                      {isAdminSubmitting ? 'Saving...' : (isEditingProduct ? 'Update Product' : 'Add Product')}
                    </button>

                    {isEditingProduct && (
                      <button 
                        type="button" 
                        className="admin-cancel-btn"
                        onClick={resetAdminForm}
                      >
                        Cancel Edit
                      </button>
                    )}
                  </form>
                </div>

                <div>
                  <h3 style={{ marginTop: 0, marginBottom: '15px' }}>Current Catalog ({accessories.length})</h3>
                  <div className="admin-table-container">
                    <table className="inventory-table">
                      <thead>
                        <tr>
                          <th>Item</th>
                          <th>Name</th>
                          <th>Category</th>
                          <th>Price</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {accessories.length === 0 ? (
                          <tr>
                            <td colSpan="5" style={{ textAlign: 'center', color: '#888', padding: '20px' }}>
                              No products in store.
                            </td>
                          </tr>
                        ) : (
                          accessories.map((item) => (
                            <tr key={item.id}>
                              <td>
                                <img src={item.image} alt={item.name} className="inventory-thumb" />
                              </td>
                              <td>
                                <strong>{item.name}</strong>
                                {item.subCategory && (
                                  <div style={{ fontSize: '0.75rem', color: '#777' }}>{item.subCategory}</div>
                                )}
                              </td>
                              <td>{item.category}</td>
                              <td>{formatPrice(item.price)}</td>
                              <td>
                                <button 
                                  className="admin-action-btn edit" 
                                  onClick={() => handleEditProductClick(item)}
                                  title="Edit Product"
                                >
                                  <EditIcon />
                                </button>
                                <button 
                                  className="admin-action-btn delete" 
                                  onClick={() => handleDeleteProduct(item.id)}
                                  title="Delete Product"
                                >
                                  <TrashIcon />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {adminTab === 'reviews' && (
              <div className="admin-reviews-panel">
                <div className="admin-review-filter-header">
                  <label>Filter by Product: </label>
                  <select 
                    className="admin-select" 
                    style={{ width: 'auto', display: 'inline-block', margin: 0 }}
                    value={adminSelectedProductFilter}
                    onChange={(e) => setAdminSelectedProductFilter(e.target.value)}
                  >
                    <option value="All">All Store Products</option>
                    {accessories.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                {isFetchingAdminReviews ? (
                  <p style={{ textAlign: 'center', color: '#777', padding: '30px 0' }}>Fetching store reviews...</p>
                ) : adminReviewsList.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#888', padding: '30px 0' }}>No customer reviews submitted yet.</p>
                ) : (
                  <div className="admin-table-container">
                    <table className="inventory-table">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Reviewer</th>
                          <th>Rating & Comment</th>
                          <th>Photo</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminReviewsList
                          .filter(r => adminSelectedProductFilter === 'All' || r.productId === adminSelectedProductFilter)
                          .map((rev) => (
                            <tr key={rev.id}>
                              <td><strong>{rev.productName}</strong></td>
                              <td>{rev.author}</td>
                              <td style={{ maxWidth: '280px' }}>
                                <StarRating rating={rev.rating} size={13} />
                                <div style={{ fontSize: '0.82rem', color: '#444', marginTop: '4px' }}>
                                  "{rev.comment}"
                                </div>
                              </td>
                              <td>
                                {rev.imageUrl ? (
                                  <img 
                                    src={rev.imageUrl} 
                                    alt="Review thumbnail" 
                                    className="inventory-thumb"
                                    onClick={() => window.open(rev.imageUrl, '_blank')}
                                    style={{ cursor: 'pointer' }}
                                  />
                                ) : (
                                  <span style={{ fontSize: '0.75rem', color: '#aaa' }}>None</span>
                                )}
                              </td>
                              <td>
                                <span className={`status-pill ${rev.approved === false ? 'unapproved' : 'approved'}`}>
                                  {rev.approved === false ? 'Hidden' : 'Approved'}
                                </span>
                              </td>
                              <td>
                                <button 
                                  className="admin-action-btn edit"
                                  onClick={() => handleToggleApproveReview(rev)}
                                  title={rev.approved === false ? "Approve Review" : "Hide Review"}
                                >
                                  {rev.approved === false ? 'Approve' : 'Hide'}
                                </button>
                                <button 
                                  className="admin-action-btn delete"
                                  onClick={() => handleDeleteAdminReview(rev)}
                                  title="Delete Review"
                                >
                                  <TrashIcon />
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {adminTab === 'orders' && (
              <div className="admin-orders-panel">
                <div className="admin-review-filter-header">
                  <label>Filter by Order Status: </label>
                  <select 
                    className="admin-select" 
                    style={{ width: 'auto', display: 'inline-block', margin: 0 }}
                    value={adminOrderStatusFilter}
                    onChange={(e) => setAdminOrderStatusFilter(e.target.value)}
                  >
                    <option value="All">All Statuses</option>
                    <option value="Placed">Placed</option>
                    <option value="Processing">Processing</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                {isFetchingAdminOrders ? (
                  <p style={{ textAlign: 'center', color: '#777', padding: '30px 0' }}>Fetching store orders...</p>
                ) : adminOrdersList.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#888', padding: '30px 0' }}>No customer orders placed yet.</p>
                ) : (
                  <div className="admin-table-container">
                    <table className="inventory-table">
                      <thead>
                        <tr>
                          <th>Order ID</th>
                          <th>Customer & Address</th>
                          <th>Items Purchased</th>
                          <th>Total Paid</th>
                          <th>Current Status</th>
                          <th>Change Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminOrdersList
                          .filter(o => adminOrderStatusFilter === 'All' || (o.status || 'Placed').toLowerCase() === adminOrderStatusFilter.toLowerCase())
                          .map((order) => {
                            const currentStatus = order.status || 'Placed';
                            return (
                              <tr key={order.id}>
                                <td>
                                  <strong>{order.orderId || order.id}</strong>
                                  <div style={{ fontSize: '0.75rem', color: '#777' }}>{formatDate(order.createdAt)}</div>
                                </td>
                                <td style={{ fontSize: '0.85rem' }}>
                                  <strong>{order.shippingDetails?.fullName}</strong>
                                  <div style={{ color: '#555' }}>{order.userEmail}</div>
                                  <div style={{ color: '#777', fontSize: '0.78rem' }}>
                                    {order.shippingDetails?.address}, {order.shippingDetails?.city} ({order.shippingDetails?.zipCode})
                                  </div>
                                  <div style={{ color: '#777', fontSize: '0.78rem' }}>
                                    📞 {order.shippingDetails?.fullPhone || order.shippingDetails?.phone}
                                  </div>
                                </td>
                                <td style={{ fontSize: '0.82rem' }}>
                                  {order.items?.map((item, idx) => (
                                    <div key={idx} style={{ marginBottom: '2px' }}>
                                      • {item.name} <span style={{ color: '#666' }}>(x{item.quantity})</span>
                                    </div>
                                  ))}
                                </td>
                                <td>
                                  <strong>{formatPrice(order.totalAmount)}</strong>
                                  <div style={{ fontSize: '0.75rem', color: '#666', textTransform: 'capitalize' }}>
                                    {order.paymentMethod === 'cod' ? 'COD' : 'Card'}
                                  </div>
                                </td>
                                <td>
                                  <span className={`status-pill ${currentStatus.toLowerCase()}`}>
                                    {currentStatus}
                                  </span>
                                </td>
                                <td>
                                  <select 
                                    className={`status-select ${(order.status || 'placed').toLowerCase()}`}
                                    value={order.status || 'Placed'}
                                    onChange={(e) => handleUpdateOrderStatus(order, e.target.value)}
                                  >
                                    <option value="Placed">Placed</option>
                                    <option value="Processing">Processing</option>
                                    <option value="Shipped">Shipped</option>
                                    <option value="Delivered">Delivered</option>
                                    <option value="Cancelled">Cancelled</option>
                                  </select>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      )}

      {/* WISHLIST MODAL */}
      {isWishlistOpen && (
        <div className="modal-overlay" onClick={() => setIsWishlistOpen(false)}>
          <div className="wishlist-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal-btn" onClick={() => setIsWishlistOpen(false)}>
              <CloseIcon />
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', paddingRight: '30px' }}>
              <h2 style={{ margin: 0 }}>
                {sharedWishlistItems.length > 0 ? `Shared Wishlist (${sharedWishlistItems.length})` : `Saved Items (${wishlist.length})`}
              </h2>
              <button className="share-wishlist-btn" onClick={handleShareWishlist}>
                <ShareIcon /> Share Wishlist
              </button>
            </div>

            <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '15px' }}>
              {sharedWishlistItems.length > 0 
                ? 'You are currently viewing a shared collection of products.' 
                : "Your saved favorites. Move them to your cart when you're ready to buy."}
            </p>

            {(sharedWishlistItems.length > 0 ? sharedWishlistItems : wishlist).length === 0 ? (
              <div style={{ padding: '40px 0', textAlign: 'center', color: '#888' }}>
                <p>No saved items to display.</p>
              </div>
            ) : (
              <div className="wishlist-grid">
                {(sharedWishlistItems.length > 0 ? sharedWishlistItems : wishlist).map((item) => (
                  <div key={item.id} className="wishlist-card">
                    <div>
                      <img src={item.image} alt={item.name} />
                      <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem' }}>{item.name}</h4>
                      <p style={{ fontWeight: 'normal', margin: '0', fontSize: '0.9rem' }}>
                        {formatPrice(item.price)}
                      </p>
                    </div>

                    <div className="wishlist-card-actions">
                      <button 
                        className="wishlist-add-cart-btn"
                        onClick={() => {
                          addToCart(item);
                          if (sharedWishlistItems.length === 0) {
                            toggleWishlist(item);
                          }
                        }}
                      >
                        Move to Cart
                      </button>
                      {sharedWishlistItems.length === 0 && (
                        <button 
                          className="wishlist-remove-btn"
                          onClick={() => toggleWishlist(item)}
                          title="Remove item"
                        >
                          <TrashIcon />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MY ORDERS MODAL */}
      {isOrdersModalOpen && (
        <div className="modal-overlay" onClick={() => setIsOrdersModalOpen(false)}>
          <div className="orders-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal-btn" onClick={() => setIsOrdersModalOpen(false)}>
              <CloseIcon />
            </button>

            <h2>My Order History</h2>
            <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '15px' }}>
              View your past orders, delivery details, and order progress.
            </p>

            {isFetchingOrders ? (
              <p style={{ padding: '30px 0', textAlign: 'center', color: '#777' }}>
                Loading your orders...
              </p>
            ) : userOrders.length === 0 ? (
              <div style={{ padding: '40px 0', textAlign: 'center', color: '#888' }}>
                <p>You haven't placed any orders yet.</p>
              </div>
            ) : (
              <div className="orders-list">
                {userOrders.map((order) => {
                  const statusLower = (order.status || 'placed').toLowerCase();
                  return (
                    <div key={order.id} className="order-history-card">
                      <div className="order-card-header">
                        <div>
                          <div className="order-id-title">{order.orderId || order.id}</div>
                          <div className="order-date-text">Placed on {formatDate(order.createdAt)}</div>
                        </div>
                        <span className={`status-badge ${statusLower}`}>
                          {order.status || 'Placed'}
                        </span>
                      </div>

                      <div className="order-details-grid">
                        <div className="order-detail-block">
                          <strong>Shipping Address</strong>
                          <span>{order.shippingDetails?.fullName}</span><br />
                          <span>{order.shippingDetails?.address}, {order.shippingDetails?.city}</span><br />
                          <span>ZIP: {order.shippingDetails?.zipCode}</span><br />
                          <span>Phone: {order.shippingDetails?.fullPhone || order.shippingDetails?.phone}</span>
                        </div>

                        <div className="order-detail-block">
                          <strong>Payment Method</strong>
                          <span style={{ textTransform: 'capitalize' }}>
                            {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Credit / Debit Card'}
                          </span>
                        </div>
                      </div>

                      <div className="order-items-mini-list">
                        <strong style={{ fontSize: '0.85rem', color: '#111', display: 'block', marginBottom: '6px' }}>
                          Items Purchased:
                        </strong>
                        {order.items?.map((item, idx) => (
                          <div key={idx} className="order-item-row">
                            <span>{item.name} × {item.quantity}</span>
                            <strong>{formatPrice((item.price || 0) * item.quantity)}</strong>
                          </div>
                        ))}
                      </div>

                      <div className="order-card-footer">
                        <div>
                          <span>Total Paid</span>
                          {order.discount > 0 && (
                            <span style={{ fontSize: '0.78rem', color: '#2e7d32', display: 'block' }}>
                              (Saved {formatPrice(order.discount)} via {order.appliedCoupon})
                            </span>
                          )}
                        </div>
                        <span>{formatPrice(order.totalAmount)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* AUTHENTICATION MODAL */}
      {isAuthModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAuthModalOpen(false)}>
          <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal-btn" onClick={() => setIsAuthModalOpen(false)}>
              <CloseIcon />
            </button>
            
            <h2>
              {authMode === 'login' && 'Welcome Back'}
              {authMode === 'signup' && 'Create Account'}
              {authMode === 'reset' && 'Reset Password'}
            </h2>
            <p className="auth-subtitle">
              {authMode === 'login' && 'Sign in to access your saved items and checkout.'}
              {authMode === 'signup' && 'Join Knickel Store today.'}
              {authMode === 'reset' && 'Enter your email address to receive a password reset link.'}
            </p>

            {authError && <div className="auth-error-msg">{authError}</div>}
            {authSuccess && <div className="auth-success-msg">{authSuccess}</div>}

            <form onSubmit={handleAuthSubmit} className="auth-form">
              {authMode === 'signup' && (
                <input 
                  type="text" 
                  placeholder="Full Name" 
                  required 
                  maxLength={50}
                  className="auth-input" 
                  value={fullName}
                  onChange={handleFullNameChange}
                />
              )}

              <input 
                type="email" 
                placeholder="Email Address" 
                required 
                className="auth-input" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              {authMode !== 'reset' && (
                <div className="password-input-container">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder={authMode === 'signup' ? "Password (8+ chars, 1 Upper, 1 Lower, 1 Num, 1 Symbol)" : "Password"}
                    required 
                    minLength={8}
                    className="auth-input" 
                    style={{ paddingRight: '40px' }}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button 
                    type="button" 
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              )}

              {authMode === 'login' && (
                <button 
                  type="button" 
                  className="auth-forgot-btn"
                  onClick={() => { setAuthMode('reset'); setAuthError(''); setAuthSuccess(''); }}
                >
                  Forgot password?
                </button>
              )}
              
              <button type="submit" className="auth-submit-btn" disabled={isAuthSubmitting}>
                {isAuthSubmitting ? 'Processing...' : (
                  authMode === 'login' ? 'Sign In' :
                  authMode === 'signup' ? 'Create Account' : 'Send Reset Link'
                )}
              </button>
            </form>

            <p className="auth-switch">
              {authMode === 'login' && (
                <>
                  Don't have an account?{' '}
                  <span onClick={() => { setAuthMode('signup'); setAuthError(''); setAuthSuccess(''); }}>
                    Sign Up
                  </span>
                </>
              )}
              {authMode === 'signup' && (
                <>
                  Already have an account?{' '}
                  <span onClick={() => { setAuthMode('login'); setAuthError(''); setAuthSuccess(''); }}>
                    Log In
                  </span>
                </>
              )}
              {authMode === 'reset' && (
                <>
                  Remembered your password?{' '}
                  <span onClick={() => { setAuthMode('login'); setAuthError(''); setAuthSuccess(''); }}>
                    Back to Log In
                  </span>
                </>
              )}
            </p>
          </div>
        </div>
      )}

      {/* CART DRAWER */}
      {isCartOpen && (
        <>
          <div className="cart-overlay" onClick={() => setIsCartOpen(false)} />
          <div className="cart-drawer">
            <div className="cart-header">
              <h2>Your Shopping Cart ({cartItemsCount})</h2>
              <button className="close-cart-btn" onClick={() => setIsCartOpen(false)}>
                <CloseIcon />
              </button>
            </div>

            <div className="cart-body">
              {cart.length === 0 ? (
                <div className="empty-cart">
                  <div style={{ marginBottom: '10px', color: '#ccc' }}>
                    <CartIcon width={48} height={48} />
                  </div>
                  <p>Your cart is empty.</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="cart-item">
                    <img src={item.image} alt={item.name} className="cart-item-img" />
                    <div className="cart-item-info">
                      <h4 className="cart-item-title">{item.name}</h4>
                      <p className="cart-item-price">{formatPrice(item.price)}</p>
                      <div className="cart-qty-controls">
                        <button className="qty-btn" onClick={() => updateQuantity(item.id, -1)}>-</button>
                        <span className="qty-count">{item.quantity}</span>
                        <button className="qty-btn" onClick={() => updateQuantity(item.id, 1)}>+</button>
                      </div>
                    </div>
                    <button className="remove-item-btn" onClick={() => removeFromCart(item.id)} title="Remove item">
                      <TrashIcon />
                    </button>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="cart-footer">
                <div className="promo-code-container">
                  <label className="promo-label"><TagIcon /> Promo Code</label>
                  {!appliedCoupon ? (
                    <form onSubmit={handleApplyCoupon} className="promo-input-group">
                      <input 
                        type="text"
                        placeholder="Try KNICKEL10 or FLAT50"
                        className="promo-input"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value)}
                      />
                      <button type="submit" className="promo-apply-btn">Apply</button>
                    </form>
                  ) : (
                    <div className="applied-promo-badge">
                      <span>🏷️ <strong>{appliedCoupon.code}</strong> ({appliedCoupon.label})</span>
                      <button type="button" className="remove-promo-btn" onClick={handleRemoveCoupon}>
                        <CloseIcon />
                      </button>
                    </div>
                  )}

                  {couponFeedback.text && (
                    <p className={`promo-feedback ${couponFeedback.type}`}>
                      {couponFeedback.text}
                    </p>
                  )}
                </div>

                <div className="cart-breakdown">
                  <div className="cart-subtotal-row">
                    <span>Subtotal:</span>
                    <span>{formatPrice(cartSubtotal)}</span>
                  </div>

                  {discountAmount > 0 && (
                    <div className="cart-subtotal-row discount">
                      <span>Discount ({appliedCoupon.code}):</span>
                      <span>-{formatPrice(discountAmount)}</span>
                    </div>
                  )}

                  <div className="cart-subtotal-row total">
                    <span>Total:</span>
                    <strong>{formatPrice(finalTotalDue)}</strong>
                  </div>
                </div>

                <button 
                  className="checkout-btn" 
                  disabled={cart.length === 0}
                  onClick={handleProceedToCheckout}
                >
                  Proceed to Checkout ({formatPrice(finalTotalDue)})
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* CHECKOUT MODAL */}
      {isCheckoutOpen && (
        <div className="modal-overlay" onClick={closeCheckoutModal}>
          <div className="checkout-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal-btn" onClick={closeCheckoutModal}>
              <CloseIcon />
            </button>

            {completedOrder ? (
              <div className="order-success-view">
                <div className="success-badge">
                  <CheckIcon />
                </div>
                <h2>Order Confirmed!</h2>
                <p style={{ color: '#666', fontSize: '0.95rem' }}>
                  Thank you for shopping with Knickel Store. A confirmation email has been sent to {completedOrder.userEmail}.
                </p>
                <div className="order-id-tag">Order ID: {completedOrder.id}</div>
                
                <div className="checkout-summary-box">
                  <div className="checkout-summary-row">
                    <span>Deliver to:</span>
                    <strong>{completedOrder.shippingDetails.fullName}</strong>
                  </div>
                  <div className="checkout-summary-row">
                    <span>Contact:</span>
                    <span>{completedOrder.shippingDetails.fullPhone}</span>
                  </div>
                  <div className="checkout-summary-row">
                    <span>Address:</span>
                    <span>{completedOrder.shippingDetails.address}, {completedOrder.shippingDetails.city} ({completedOrder.shippingDetails.zipCode})</span>
                  </div>
                  {completedOrder.discount > 0 && (
                    <div className="checkout-summary-row discount">
                      <span>Discount Saved:</span>
                      <span>-{formatPrice(completedOrder.discount)}</span>
                    </div>
                  )}
                  <div className="checkout-summary-row total">
                    <span>Total Paid:</span>
                    <span>{formatPrice(completedOrder.totalAmount)}</span>
                  </div>
                </div>

                <button className="auth-submit-btn" onClick={closeCheckoutModal}>
                  Continue Shopping
                </button>
              </div>
            ) : (
              <form onSubmit={handlePlaceOrder}>
                <h2>Checkout</h2>
                <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '20px' }}>
                  Complete your shipping and payment details below.
                </p>

                <div className="checkout-summary-box">
                  <div className="checkout-summary-row">
                    <span>Subtotal ({cartItemsCount} items):</span>
                    <span>{formatPrice(cartSubtotal)}</span>
                  </div>

                  {discountAmount > 0 && (
                    <div className="checkout-summary-row discount">
                      <span>Discount ({appliedCoupon.code}):</span>
                      <span>-{formatPrice(discountAmount)}</span>
                    </div>
                  )}

                  <div className="checkout-summary-row">
                    <span>Shipping:</span>
                    <span>Free</span>
                  </div>

                  <div className="checkout-summary-row total">
                    <span>Total Due:</span>
                    <span>{formatPrice(finalTotalDue)}</span>
                  </div>
                </div>

                <div className="promo-code-container checkout-promo">
                  {!appliedCoupon ? (
                    <div className="promo-input-group">
                      <input 
                        type="text"
                        placeholder="Promo Code (e.g., KNICKEL10)"
                        className="promo-input"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value)}
                      />
                      <button type="button" className="promo-apply-btn" onClick={handleApplyCoupon}>Apply</button>
                    </div>
                  ) : (
                    <div className="applied-promo-badge">
                      <span>🏷️ Promo <strong>{appliedCoupon.code}</strong> Applied</span>
                      <button type="button" className="remove-promo-btn" onClick={handleRemoveCoupon}>
                        <CloseIcon />
                      </button>
                    </div>
                  )}
                  {couponFeedback.text && (
                    <p className={`promo-feedback ${couponFeedback.type}`}>
                      {couponFeedback.text}
                    </p>
                  )}
                </div>

                <div className="checkout-section-title">Shipping Information</div>
                <div className="checkout-grid">
                  <input
                    type="text"
                    name="fullName"
                    placeholder="Full Name"
                    required
                    maxLength={60}
                    className="auth-input full-width"
                    value={shippingDetails.fullName}
                    onChange={handleInputChange}
                  />

                  <div className="full-width">
                    <input
                      type="email"
                      name="email"
                      placeholder="Email Address"
                      required
                      maxLength={80}
                      className="auth-input"
                      value={shippingDetails.email}
                      onChange={handleInputChange}
                    />
                    {validationErrors.email && (
                      <p className="validation-error">{validationErrors.email}</p>
                    )}
                  </div>

                  <input
                    type="text"
                    name="address"
                    placeholder="Street Address"
                    required
                    maxLength={120}
                    className="auth-input full-width"
                    value={shippingDetails.address}
                    onChange={handleInputChange}
                  />

                  <input
                    type="text"
                    name="city"
                    placeholder="City"
                    required
                    maxLength={50}
                    className="auth-input"
                    value={shippingDetails.city}
                    onChange={handleInputChange}
                  />

                  <div>
                    <input
                      type="text"
                      name="zipCode"
                      placeholder="ZIP / Postal Code"
                      required
                      maxLength={10}
                      className="auth-input"
                      value={shippingDetails.zipCode}
                      onChange={handleInputChange}
                    />
                    {validationErrors.zipCode && (
                      <p className="validation-error">{validationErrors.zipCode}</p>
                    )}
                  </div>

                  <div className="full-width">
                    <div className="phone-input-group">
                      <select
                        className="country-code-select"
                        value={selectedCountry.code}
                        onChange={handleCountryChange}
                      >
                        {COUNTRY_CODES.map((country) => (
                          <option key={country.code} value={country.code}>
                            {country.name}
                          </option>
                        ))}
                      </select>
                      <input
                        type="tel"
                        name="phone"
                        placeholder={`Phone Number (${selectedCountry.digits} digits)`}
                        required
                        className="auth-input"
                        value={shippingDetails.phone}
                        onChange={handleInputChange}
                      />
                    </div>
                    {validationErrors.phone && (
                      <p className="validation-error">{validationErrors.phone}</p>
                    )}
                  </div>
                </div>

                <div className="checkout-section-title">Payment Method</div>
                <div className="payment-options">
                  <div
                    className={`payment-option-card ${paymentMethod === 'card' ? 'selected' : ''}`}
                    onClick={() => setPaymentMethod('card')}
                  >
                    Credit / Debit Card
                  </div>
                  <div
                    className={`payment-option-card ${paymentMethod === 'cod' ? 'selected' : ''}`}
                    onClick={() => setPaymentMethod('cod')}
                  >
                    Cash on Delivery
                  </div>
                </div>

                {paymentMethod === 'card' && (
                  <div className="checkout-grid" style={{ marginBottom: '15px' }}>
                    <input
                      type="text"
                      placeholder="Card Number (Demo)"
                      required
                      maxLength={16}
                      className="auth-input full-width"
                    />
                    <input
                      type="text"
                      placeholder="MM/YY"
                      required
                      maxLength={5}
                      className="auth-input"
                    />
                    <input
                      type="text"
                      placeholder="CVV"
                      required
                      maxLength={4}
                      className="auth-input"
                    />
                  </div>
                )}

                <button 
                  type="submit" 
                  className="auth-submit-btn" 
                  disabled={isSubmittingOrder}
                  style={{ width: '100%', marginTop: '10px' }}
                >
                  {isSubmittingOrder ? 'Processing Order...' : `Place Order (${formatPrice(finalTotalDue)})`}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* BREADCRUMB */}
      {activeSubCategory !== 'All' && (
        <div style={{ maxWidth: '1250px', margin: '20px auto 0', padding: '0 20px', color: '#666' }}>
          Showing: <strong>{activeCategory}</strong> › <strong>{activeSubCategory}</strong>
        </div>
      )}

      {/* CATALOG GRID */}
      <div className="catalog-container">
        {isLoading ? (
          <h2 className="empty-message">Loading inventory...</h2>
        ) : filteredProducts.length === 0 ? (
          <h2 className="empty-message">No items found matching your filter criteria.</h2>
        ) : (
          filteredProducts.map((product) => {
            const isWishlisted = wishlist.some((item) => item.id === product.id);
            const ratingStats = getRatingStats(product);
            const isOutOfStock = product.stock && product.stock.toLowerCase().includes('out of stock');

            return (
              <div 
                key={product.id} 
                className={`product-card ${isOutOfStock ? 'out-of-stock-card' : ''}`}
                onClick={(e) => handleOpenQuickView(product, e)}
              >
                <button 
                  className={`wishlist-heart-btn ${isWishlisted ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleWishlist(product);
                  }}
                  title={isWishlisted ? "Remove from Saved Items" : "Save Item"}
                >
                  <HeartIcon filled={isWishlisted} />
                </button>

                <div className="product-card-img-wrap">
                  <img src={product.image} alt={product.name} className="product-image" />
                  {isOutOfStock && (
                    <div className="out-of-stock-overlay">Out of Stock</div>
                  )}
                </div>
                
                <div className="product-card-rating-badge">
                  <span className="star-symbol">★</span>
                  {ratingStats.count > 0 ? (
                    <span className="rating-num">
                      <strong>{ratingStats.avg}</strong> ({ratingStats.count})
                    </span>
                  ) : (
                    <span className="no-reviews-tag">New</span>
                  )}
                </div>

                <h3 className="product-card-title">{product.name}</h3>
                {product.price !== undefined && (
                  <p style={{ fontWeight: 'normal', margin: '5px 0' }}>{formatPrice(product.price)}</p>
                )}
                <button 
                  disabled={isOutOfStock}
                  onClick={(e) => {
                    e.stopPropagation();
                    addToCart(product);
                  }}
                  style={{
                    marginTop: '10px',
                    padding: '8px 16px',
                    backgroundColor: isOutOfStock ? '#999' : '#333',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: isOutOfStock ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* FAQ SECTION */}
      <div className="faq-section">
        <h2 className="faq-title">MOST ASKED</h2>
        <div className="faq-list">
          {faqData.map((faq, index) => (
            <div 
              key={index} 
              className="faq-item"
              onClick={() => toggleFaq(index)}
            >
              <div className="faq-question">
                <span>{faq.question}</span>
                <span className="faq-chevron">
                  {openFaq === index ? '▲' : '▼'}
                </span>
              </div>
              {openFaq === index && (
                <div className="faq-answer">
                  <p>{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* FOOTER */}
      <footer className="site-footer">
        <div className="footer-container">
          
          <div className="footer-brand-banner">
            <div className="footer-logo">
              <h1>Knickel Store</h1>
            </div>
            <p className="footer-about-text">
              Knickel Store is that one store you keep coming back to... even when you swear it's your last order. We go all in on trends, bring almost everything the market has (and a bit more), and keep the vibe real. Built with passion, packed with variety, and somehow always having what you didn't know you needed 😌
            </p>
          </div>

          <div className="footer-guest-tracking-bar">
            <div className="guest-track-widget-text">
              <PackageIcon />
              <div>
                <strong>Track Guest Order</strong>
                <span>Enter your Order ID (e.g. KNK-849201) to view status updates</span>
              </div>
            </div>
            <form onSubmit={handleSearchGuestOrder} className="footer-track-form">
              <input 
                type="text" 
                placeholder="KNK-849201"
                required
                className="footer-track-input"
                value={guestOrderIdInput}
                onChange={(e) => setGuestOrderIdInput(e.target.value)}
              />
              <button 
                type="submit" 
                className="footer-track-btn"
                onClick={() => setIsTrackModalOpen(true)}
              >
                Track Status
              </button>
            </form>
          </div>

          <div className="footer-grid">
            <div className="footer-col">
              <h4>SHOP</h4>
              <ul>
                <li><button onClick={() => handleCategoryNav('All')}>Shop All</button></li>
                <li><button onClick={() => handleCategoryNav('Pendants')}>Pendants</button></li>
                <li><button onClick={() => handleCategoryNav('Keychains')}>Keychains</button></li>
                <li><button onClick={() => handleCategoryNav('Rings')}>Rings</button></li>
                <li><button onClick={() => handleCategoryNav('Phone Charms')}>Phone Charms</button></li>
                <li><button onClick={() => handleCategoryNav('Bracelets')}>Bracelets 🔥</button></li>
                <li><button onClick={() => handleCategoryNav('Leather Cord Necklace')}>Leather Cord Necklace</button></li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>HELP</h4>
              <ul>
                <li><button onClick={() => handleOpenPolicyModal('shipping')}>Shipping Policy</button></li>
                <li><button onClick={() => handleOpenPolicyModal('privacy')}>Privacy Policy</button></li>
                <li><button onClick={() => handleOpenPolicyModal('refund')}>Refund Policy</button></li>
                <li><button onClick={() => handleOpenPolicyModal('terms')}>Terms of Service</button></li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>QUICK LINKS</h4>
              <ul>
                <li><button onClick={() => handleQuickLinkNav('track')}>Track Order</button></li>
                <li><button onClick={() => handleQuickLinkNav('story')}>Our Story</button></li>
                <li><button onClick={() => handleQuickLinkNav('login')}>Login / Register</button></li>
                <li><button onClick={() => handleQuickLinkNav('contact')}>Contact</button></li>
              </ul>
            </div>

            <div className="footer-col contact-col">
              <h4>CONTACT</h4>
              <div className="contact-pills">
                <a href="tel:+918168047667" className="contact-pill-link">
                  <div className="contact-pill">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                    <div>
                      <span className="pill-label">Call: </span>
                      <span className="pill-value">+91 8168047667</span>
                    </div>
                  </div>
                </a>

                <a href="mailto:knickelstore@gmail.com" className="contact-pill-link">
                  <div className="contact-pill">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                      <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                    <div>
                      <span className="pill-label">Email: </span>
                      <span className="pill-value">knickelstore@gmail.com</span>
                    </div>
                  </div>
                </a>
              </div>
            </div>

          </div>

          <div className="footer-bottom">
            <span>© 2026 Knickel Store</span>
            <button className="footer-terms-btn" onClick={() => handleOpenPolicyModal('terms')}>
              Terms and Policies
            </button>
          </div>

        </div>
      </footer>
    </div>
  );
}

export default App;