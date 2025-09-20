import { useState } from 'react'
import './LoginModal.css'

const LoginModal = ({ isOpen, onClose, onLogin }) => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Hash the password using SHA-256
    const encoder = new TextEncoder()
    const data = encoder.encode(password)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    // Check against environment variables
    const julienHash = import.meta.env.VITE_JULIEN_HASH
    const jimmyHash = import.meta.env.VITE_JIMMY_HASH

    if (username.toLowerCase() === 'julien' && hashHex === julienHash) {
      onLogin('Julien')
      setUsername('')
      setPassword('')
      onClose()
    } else if (username.toLowerCase() === 'jimmy' && hashHex === jimmyHash) {
      onLogin('Jimmy')
      setUsername('')
      setPassword('')
      onClose()
    } else {
      setError('Invalid username or password')
    }
  }

  const handleClose = () => {
    setUsername('')
    setPassword('')
    setError('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Admin Login</h2>
          <button className="modal-close" onClick={handleClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Username:</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <button type="submit" className="login-button">Login</button>
        </form>
      </div>
    </div>
  )
}

export default LoginModal