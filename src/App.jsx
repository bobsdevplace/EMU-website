import { useState, useEffect } from 'react'
import './App.css'
import SydneyMap from './components/SydneyMap'
import './components/SydneyMap.css'
import Restaurants from './components/Restaurants'
import RestaurantsWithAPI from './components/RestaurantsWithAPI'
import './components/Restaurants.css'
import LoginModal from './components/LoginModal'

function App() {
  const [currentPage, setCurrentPage] = useState('home')
  const [useAPI, setUseAPI] = useState(true) // Toggle between localStorage and MongoDB
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [loggedInUser, setLoggedInUser] = useState(null)

  // Load logged-in user from localStorage on app initialization
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('loggedInUser')
      if (savedUser) {
        setLoggedInUser(savedUser)
      }
    } catch (error) {
      console.error('Error loading user from localStorage:', error)
    }
  }, [])

  const handleLogin = (username) => {
    setLoggedInUser(username)
    // Save to localStorage
    try {
      localStorage.setItem('loggedInUser', username)
    } catch (error) {
      console.error('Error saving user to localStorage:', error)
    }
  }

  const handleLogout = () => {
    setLoggedInUser(null)
    // Remove from localStorage
    try {
      localStorage.removeItem('loggedInUser')
    } catch (error) {
      console.error('Error removing user from localStorage:', error)
    }
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'map':
        return <SydneyMap loggedInUser={loggedInUser} />
      case 'restaurants':
        return useAPI ? <RestaurantsWithAPI loggedInUser={loggedInUser} /> : <Restaurants loggedInUser={loggedInUser} />
      default:
        return <HomePage />
    }
  }

  const HomePage = () => (
    <>
      {/* Hero Section */}
      <main className="hero">
        <div className="hero-container">
          <div className="hero-content">
            <h1 className="hero-title">Experience rewards everywhere</h1>
            <p className="hero-subtitle">
              Get the app that lets you earn status, perks, and points at world-class restaurants.
            </p>
            <div className="hero-buttons">
              <button className="btn-primary">Download App</button>
              <button className="btn-secondary">Learn More</button>
            </div>
          </div>
          <div className="hero-visual">
            <div className="phone-mockup">
              <div className="phone-screen">
                <div className="app-preview">
                  <div className="app-header">EMU</div>
                  <div className="app-content">
                    <div className="reward-card"></div>
                    <div className="reward-card"></div>
                    <div className="reward-card"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section className="features" id="features">
        <div className="features-container">
          <h2>Why choose EMU?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3>Earn Points</h3>
              <p>Collect points with every visit to participating restaurants</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⭐</div>
              <h3>Unlock Status</h3>
              <p>Build your status and unlock exclusive perks and benefits</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎁</div>
              <h3>Get Rewards</h3>
              <p>Redeem your points for free meals and special experiences</p>
            </div>
          </div>
        </div>
      </section>
    </>
  )

  return (
    <div className="app">
      {/* Navigation Header */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-logo">
            <h2 onClick={() => setCurrentPage('home')} style={{ cursor: 'pointer' }}>EMU</h2>
          </div>
          <div className="nav-links">
            <a href="#features" onClick={(e) => { e.preventDefault(); setCurrentPage('home'); }}>Features</a>
            <a href="#map" onClick={(e) => { e.preventDefault(); setCurrentPage('map'); }}>Map</a>
            {loggedInUser && (
              <a href="#restaurants" onClick={(e) => { e.preventDefault(); setCurrentPage('restaurants'); }}>Restaurants</a>
            )}
            <a href="#about" onClick={(e) => { e.preventDefault(); setCurrentPage('home'); }}>About</a>
            <a href="#contact" onClick={(e) => { e.preventDefault(); setCurrentPage('home'); }}>Contact</a>
            {loggedInUser ? (
              <button
                onClick={handleLogout}
                style={{
                  background: '#f44336',
                  color: 'white',
                  border: 'none',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Logout
              </button>
            ) : (
              <button
                onClick={() => setIsLoginModalOpen(true)}
                style={{
                  background: '#2196F3',
                  color: 'white',
                  border: 'none',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Login
              </button>
            )}
            <button
              onClick={() => setUseAPI(!useAPI)}
              style={{
                background: useAPI ? '#4CAF50' : '#ff9800',
                color: 'white',
                border: 'none',
                padding: '8px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              {useAPI ? 'MongoDB' : 'LocalStorage'}
            </button>
          </div>
        </div>
      </nav>

      {renderPage()}

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLogin={handleLogin}
      />

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-content">
            <div className="footer-brand">
              <h3>EMU</h3>
              <p>Experience rewards everywhere</p>
            </div>
            <div className="footer-links">
              <div className="footer-column">
                <h4>Product</h4>
                <a href="#features">Features</a>
                <a href="#pricing">Pricing</a>
                <a href="#support">Support</a>
              </div>
              <div className="footer-column">
                <h4>Company</h4>
                <a href="#about">About</a>
                <a href="#careers">Careers</a>
                <a href="#contact">Contact</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2024 EMU. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
