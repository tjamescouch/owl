import { useState, useEffect } from 'react'
import axios from 'axios'

const API_BASE = 'http://localhost:3000'

function App() {
  const [balance, setBalance] = useState(0)
  const [token, setToken] = useState(localStorage.getItem('token') || '')

  useEffect(() => {
    if (token) {
      axios.get(`${API_BASE}/balance/user1`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => setBalance(res.data.balance))
    }
  }, [token])

  const login = () => {
    const newToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InVzZXIxIn0.demo' // Mock
    setToken(newToken)
    localStorage.setItem('token', newToken)
  }

  const makePayment = async (amount) => {
    if (!token) return
    try {
      await axios.post(`${API_BASE}/payments`, { amount: parseInt(amount), to: 'user2' }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      alert('Payment successful!')
      // Refresh balance
      const res = await axios.get(`${API_BASE}/balance/user1`, { headers: { Authorization: `Bearer ${token}` } })
      setBalance(res.data.balance)
    } catch (err) {
      alert('Payment failed: ' + err.response.data.error)
    }
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Personal Banking Dashboard</h1>
      {!token ? (
        <button onClick={login}>Login</button>
      ) : (
        <div>
          <p>Balance: ${balance}</p>
          <input type="number" placeholder="Amount" id="amount" />
          <button onClick={() => makePayment(document.getElementById('amount').value)}>Pay</button>
          <button onClick={() => setToken('')}>Logout</button>
        </div>
      )}
    </div>
  )
}

export default App