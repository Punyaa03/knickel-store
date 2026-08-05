import './App.css';
import { useState, useRef, useEffect } from 'react';

// --- NEW: WE IMPORTED 'db' AND FIRESTORE TOOLS ---
import { auth, db } from './firebase'; 
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { collection, getDocs } from 'firebase/firestore'; 

function App() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeSubCategory, setActiveSubCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('Newest');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeHover, setActiveHover] = useState(null); 

  // --- NEW: STATE TO HOLD OUR CLOUD PRODUCTS ---
  const [accessories, setAccessories] = useState([]); 

  const [currentUser, setCurrentUser] = useState(null); 
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false); 
  const [isLoginMode, setIsLoginMode] = useState(true); 
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const hoverTimeout = useRef(null);

  // --- NEW: FETCH PRODUCTS FROM FIRESTORE ---
  // This runs automatically when the page first loads
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Go into the 'products' folder in our database
        const querySnapshot = await getDocs(collection(db, "products"));
        
        // Loop through everything it finds and format it for React
        const productsData = querySnapshot.docs.map(doc => ({
          id: doc.id,       // The Auto-ID Firebase generated
          ...doc.data()     // The name, category, subCategory, and image
        }));
        
        // Save it to our state!
        setAccessories(productsData);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };

    fetchProducts();
  }, []);

  // --- AUTH LISTENER ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        setCurrentUser(null);
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

  const handleAuthSubmit = async (e) => {
    e.preventDefault(); 
    setAuthError(''); 
    try {
      if (isLoginMode) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      setIsAuthModalOpen(false); 
      setEmail('');
      setPassword('');
    } catch (error) {
      setAuthError(error.message.replace('Firebase: ', '')); 
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

  // Filter our new cloud data!
  let filteredProducts = accessories.filter(product => {
    const matchesMain = activeCategory === 'All' || product.category === activeCategory;
    const matchesSub = activeSubCategory === 'All' || product.subCategory === activeSubCategory;
    
    // Safety check just in case a product is missing a name in the database
    const productName = product.name || ""; 
    const matchesSearch = productName.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesMain && matchesSub && matchesSearch;
  });

  const categoryData = [
    { name: 'All', subs: [] },
    { name: 'Pendants', subs: ['Silver Pendants', 'Minimalist Pendants', 'Statement Pieces'] },
    { name: 'Keychains', subs: ['Anime', 'Marvel', 'Music Artists', 'Pokemon'] },
    { name: 'Rings', subs: ['Adjustable Rings', 'Statement Pieces'] },
    { name: 'Phone Charms', subs: ['Beaded Charms', 'Y2K Style'] },
    { name: 'Bracelets', subs: ['Chain Bracelets', 'Charm Bracelets'] }
  ];

  return (
    <div className="app-container">
      <nav className="store-navbar">
        <div className="navbar-left">
          <div className="store-logo">
            <span style={{ fontSize: '0.8rem', color: '#888' }}>Logo</span>
          </div>
          <h1>Knickel Store</h1>
        </div>

        <div className="navbar-center">
          {categoryData.map(cat => (
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
                    {cat.subs.map(sub => (
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
          <select className="nav-dropdown mini-sort" value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
            <option value="Newest">Sort: Newest</option>
            <option value="Price: Low to High">Price: Low to High</option>
            <option value="Price: High to Low">Price: High to Low</option>
          </select>

          <div 
            className={`search-container ${isSearchOpen ? 'expanded' : ''}`}
            onMouseEnter={() => setIsSearchOpen(true)}
            onMouseLeave={() => { if (!searchTerm) setIsSearchOpen(false); }}
          >
            <button className="icon-btn search-icon">🔍</button>
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
                <button className="icon-btn" title="Account">👤</button>
                
                {isAccountMenuOpen && (
                  <div className="profile-dropdown">
                    <p style={{fontSize: '0.8rem', wordBreak: 'break-all'}}><strong>{currentUser.email}</strong></p>
                    <hr />
                    <button className="profile-link">My Orders</button>
                    <button className="profile-link">Saved Items</button>
                    <button className="profile-link logout-btn" onClick={handleLogout}>Sign Out</button>
                  </div>
                )}
              </div>
            ) : (
              <button className="icon-btn" title="Sign In" onClick={() => setIsAuthModalOpen(true)}>
                👤
              </button>
            )}
          </div>

          <button className="icon-btn" title="Cart">🛍️</button>
        </div>
      </nav>

      {isAuthModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAuthModalOpen(false)}>
          <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal-btn" onClick={() => setIsAuthModalOpen(false)}>✕</button>
            
            <h2>{isLoginMode ? 'Welcome Back' : 'Create Account'}</h2>
            <p className="auth-subtitle">
              {isLoginMode ? 'Sign in to access your custom jewelry.' : 'Join Knickel Store today.'}
            </p>

            {authError && <p style={{color: 'red', fontSize: '0.85rem', margin: '0 0 10px 0'}}>{authError}</p>}

            <form onSubmit={handleAuthSubmit} className="auth-form">
              {!isLoginMode && (
                <input type="text" placeholder="Full Name" className="auth-input" />
              )}
              <input 
                type="email" 
                placeholder="Email Address" 
                required 
                className="auth-input" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input 
                type="password" 
                placeholder="Password (min 6 chars)" 
                required 
                className="auth-input" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              
              <button type="submit" className="auth-submit-btn">
                {isLoginMode ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            <p className="auth-switch">
              {isLoginMode ? "Don't have an account? " : "Already have an account? "}
              <span onClick={() => {
                setIsLoginMode(!isLoginMode);
                setAuthError(''); 
              }}>
                {isLoginMode ? 'Sign Up' : 'Log In'}
              </span>
            </p>
          </div>
        </div>
      )}

      {activeSubCategory !== 'All' && (
        <div style={{ maxWidth: '1200px', margin: '20px auto 0', padding: '0 20px', color: '#666' }}>
          Showing: <strong>{activeCategory}</strong>  <strong>{activeSubCategory}</strong>
        </div>
      )}

      <div className="catalog-container">
        {filteredProducts.length === 0 ? (
          <h2 className="empty-message">Loading inventory... ✨</h2>
        ) : (
          filteredProducts.map(product => (
            <div key={product.id} className="product-card">
              <img src={product.image} alt={product.name} className="product-image" />
              <h3>{product.name}</h3>
              <p className="category-label">Category: {product.category}</p>
              {product.subCategory && <p className="category-label" style={{marginTop: '-10px', fontSize: '0.8rem'}}>Type: {product.subCategory}</p>}
            </div>
          ))
        )}
      </div>

    </div>
  );
}

export default App;