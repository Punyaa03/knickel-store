import './App.css';
import { useState, useRef, useEffect } from 'react';
import emailjs from '@emailjs/browser';
import { auth, db } from './firebase'; 
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { collection, getDocs, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'; 

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

const COUNTRY_CODES = [
  { code: '+1', name: 'USA / Canada (+1)', digits: 10 },
  { code: '+91', name: 'India (+91)', digits: 10 },
  { code: '+44', name: 'UK (+44)', digits: 10 },
  { code: '+61', name: 'Australia (+61)', digits: 9 },
  { code: '+971', name: 'UAE (+971)', digits: 9 }
];

function App() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeSubCategory, setActiveSubCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('Newest');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeHover, setActiveHover] = useState(null); 

  const [accessories, setAccessories] = useState([]); 
  const [isLoading, setIsLoading] = useState(true);

  // Cart States
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Auth States
  const [currentUser, setCurrentUser] = useState(null); 
  const [userProfile, setUserProfile] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false); 
  const [authMode, setAuthMode] = useState('login'); 
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false); 
  
  // Auth Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);

  // Checkout & Order States
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_CODES[0]);
  
  const [shippingDetails, setShippingDetails] = useState({
    fullName: '',
    email: '',
    address: '',
    city: '',
    zipCode: '',
    phone: ''
  });

  const [validationErrors, setValidationErrors] = useState({});
  const hoverTimeout = useRef(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "products"));
        const productsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setAccessories(productsData);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setIsLoading(false);
      }
    };

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
        } catch (err) {
          console.error("Error fetching user profile:", err);
        }
      } else {
        setCurrentUser(null);
        setUserProfile(null);
      }
    });

    return () => unsubscribe(); 
  }, []);

  const handleMouseEnter = (categoryName) => {
    clearTimeout(hoverTimeout.current);
    setActiveHover(categoryName);
  };

  const handleMouseLeave = () => {
    hoverTimeout.current = setTimeout(() => {
      setActiveHover(null);
    }, 200);
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
      case 'auth/operation-not-allowed':
        return 'Email/Password sign-in is disabled in Firebase Console.';
      case 'permission-denied':
        return 'Firestore permission denied. Update your Firestore Security Rules.';
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

      } else if (authMode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
        setIsAuthModalOpen(false); 
        resetAuthForm();

      } else if (authMode === 'reset') {
        await sendPasswordResetEmail(auth, email);
        setAuthSuccess('Password reset link sent to your email!');
        setIsAuthSubmitting(false);
      }
    } catch (error) {
      console.error("Detailed Auth Error:", error);
      setAuthError(formatAuthError(error));
      setIsAuthSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsAccountMenuOpen(false);
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

  // --- CART HANDLERS ---
  const addToCart = (product) => {
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((item) => item.id === product.id);
      if (existingIndex > -1) {
        const updated = [...prevCart];
        updated[existingIndex].quantity += 1;
        return updated;
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
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
    setCart((prevCart) => prevCart.filter((item) => item.id !== id));
  };

  const cartTotal = cart.reduce(
    (total, item) => total + (Number(item.price) || 0) * item.quantity,
    0
  );
  const cartItemsCount = cart.reduce((total, item) => total + item.quantity, 0);

  // --- CHECKOUT & VALIDATION HANDLERS ---
  const handleProceedToCheckout = () => {
    if (!currentUser) {
      setIsCartOpen(false);
      setAuthError('Please sign in or create an account to proceed to checkout.');
      openAuthModal('login');
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
    
    const invalidExtensions = ['.coms', '.con', '.coom', '.gamil.com', '.gmial.com', '.yaho.com', '.hotmial.com'];
    const emailLower = shippingDetails.email.toLowerCase().trim();
    const hasTypo = invalidExtensions.some((ext) => emailLower.endsWith(ext));

    if (!emailRegex.test(emailLower) || hasTypo) {
      errors.email = 'Please enter a valid email address ending in .com, .org, etc.';
    }

    if (shippingDetails.phone.length !== selectedCountry.digits) {
      errors.phone = `Phone number for ${selectedCountry.name} must be exactly ${selectedCountry.digits} digits.`;
    }

    if (shippingDetails.zipCode.trim().length < 4 || shippingDetails.zipCode.trim().length > 10) {
      errors.zipCode = 'ZIP/Postal code must be between 4 and 10 characters.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // --- PLACE ORDER & SEND CONFIRMATION EMAIL ---
  const handlePlaceOrder = async (e) => {
  e.preventDefault();
  if (!validateCheckoutForm()) return;

  setIsSubmittingOrder(true);

  // Generate a clean 6-digit order number (e.g., KNK-482910)
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
    totalAmount: cartTotal,
    paymentMethod,
    status: 'Placed',
    createdAt: serverTimestamp()
  };

  try {
    // 1. Save to Firestore using the custom Order ID as document key
    await setDoc(doc(db, "orders", customOrderId), orderData);

    // 2. Generate HTML Table Rows
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
          $${(item.price * item.quantity).toFixed(2)}
        </td>
      </tr>
    `).join('');

   // 3. Send Email via EmailJS using environment variables
  await emailjs.send(
  process.env.REACT_APP_EMAILJS_SERVICE_ID,
  process.env.REACT_APP_EMAILJS_TEMPLATE_ID,
  {
    to_email: shippingDetails.email,
    user_email: shippingDetails.email,
    user_name: shippingDetails.fullName,
    order_id: customOrderId,
    total_amount: cartTotal.toFixed(2),
    address: shippingDetails.address,
    city: shippingDetails.city,
    zip: shippingDetails.zipCode,
    phone: `${selectedCountry.code} ${shippingDetails.phone}`,
    items_html: itemsHtml
  },
  process.env.REACT_APP_EMAILJS_PUBLIC_KEY
);

    setCompletedOrder({ id: customOrderId, ...orderData });
    setCart([]);
  } catch (error) {
    console.error("Error creating order or sending email: ", error);
    alert("Order processed, but there was an issue triggering the email confirmation.");
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
      const productName = product.name || ""; 
      const matchesSearch = productName.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesMain && matchesSub && matchesSearch;
    })
    .sort((a, b) => {
      if (sortOption === 'Price: Low to High') {
        return (Number(a.price) || 0) - (Number(b.price) || 0);
      }
      if (sortOption === 'Price: High to Low') {
        return (Number(b.price) || 0) - (Number(a.price) || 0);
      }
      return 0;
    });

  const categoryData = [
    { name: 'All', subs: [] },
    { name: 'Pendants', subs: ['Silver Pendants', 'Minimalist Pendants', 'Statement Pieces'] },
    { name: 'Keychains', subs: ['Anime', 'Marvel', 'Music Artists', 'Pokemon'] },
    { name: 'Rings', subs: ['Adjustable Rings', 'Statement Pieces'] },
    { name: 'Phone Charms', subs: ['Beaded Charms', 'Y2K Style'] },
    { name: 'Bracelets', subs: ['Chain Bracelets', 'Charm Bracelets'] }
  ];

  const displayNameToShow = userProfile?.fullName || currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User';

  return (
    <div className="app-container">
      {/* NAVBAR */}
      <nav className="store-navbar">
        <div className="navbar-left">
          <div className="store-logo">
            <span style={{ fontSize: '0.8rem', color: '#888' }}>Logo</span>
          </div>
          <h1>Knickel Store</h1>
        </div>

        <div className="navbar-center">
          {categoryData.map((cat) => (
            <div 
              key={cat.name} 
              className="nav-item-container"
              onMouseEnter={() => handleMouseEnter(cat.name)}
              onMouseLeave={handleMouseLeave}
            >
              <button 
                className={`nav-link-btn ${activeCategory === cat.name ? 'active' : ''}`}
                onClick={() => {
                  setActiveCategory(cat.name);
                  setActiveSubCategory('All'); 
                }}
              >
                {cat.name}
              </button>

              {cat.subs.length > 0 && activeHover === cat.name && (
                <div className="mega-menu">
                  <div className="mega-menu-content">
                    {cat.subs.map((sub) => (
                      <button 
                        key={sub} 
                        className="sub-link-btn"
                        onClick={() => {
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
        </div>

        <div className="navbar-right">
          <select 
            className="nav-dropdown mini-sort" 
            value={sortOption} 
            onChange={(e) => setSortOption(e.target.value)}
          >
            <option value="Newest">Sort: Newest</option>
            <option value="Price: Low to High">Price: Low to High</option>
            <option value="Price: High to Low">Price: High to Low</option>
          </select>

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
                    <button className="profile-link">My Orders</button>
                    <button className="profile-link">Saved Items</button>
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
                      <p className="cart-item-price">${Number(item.price || 0).toFixed(2)}</p>
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

            <div className="cart-footer">
              <div className="cart-subtotal">
                <span>Subtotal:</span>
                <strong>${cartTotal.toFixed(2)}</strong>
              </div>
              <button 
                className="checkout-btn" 
                disabled={cart.length === 0}
                onClick={handleProceedToCheckout}
              >
                Proceed to Checkout
              </button>
            </div>
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
                  <div className="checkout-summary-row total">
                    <span>Total Paid:</span>
                    <span>${completedOrder.totalAmount.toFixed(2)}</span>
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
                    <span>Items ({cartItemsCount}):</span>
                    <span>${cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="checkout-summary-row">
                    <span>Shipping:</span>
                    <span>Free</span>
                  </div>
                  <div className="checkout-summary-row total">
                    <span>Total Due:</span>
                    <span>${cartTotal.toFixed(2)}</span>
                  </div>
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
                  {isSubmittingOrder ? 'Processing Order...' : `Place Order ($${cartTotal.toFixed(2)})`}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* BREADCRUMB */}
      {activeSubCategory !== 'All' && (
        <div style={{ maxWidth: '1200px', margin: '20px auto 0', padding: '0 20px', color: '#666' }}>
          Showing: <strong>{activeCategory}</strong> › <strong>{activeSubCategory}</strong>
        </div>
      )}

      {/* CATALOG GRID */}
      <div className="catalog-container">
        {isLoading ? (
          <h2 className="empty-message">Loading inventory...</h2>
        ) : filteredProducts.length === 0 ? (
          <h2 className="empty-message">No items found matching your selection.</h2>
        ) : (
          filteredProducts.map((product) => (
            <div key={product.id} className="product-card">
              <img src={product.image} alt={product.name} className="product-image" />
              <h3>{product.name}</h3>
              {product.price !== undefined && (
                <p style={{ fontWeight: 'bold', margin: '5px 0' }}>${Number(product.price).toFixed(2)}</p>
              )}
              <p className="category-label">Category: {product.category}</p>
              {product.subCategory && (
                <p className="category-label" style={{ marginTop: '-10px', fontSize: '0.8rem' }}>
                  Type: {product.subCategory}
                </p>
              )}
              <button 
                onClick={() => addToCart(product)}
                style={{
                  marginTop: '10px',
                  padding: '8px 16px',
                  backgroundColor: '#333',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Add to Cart
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default App;