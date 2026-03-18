import { useEffect, useState } from 'react'
import { fetchAuthSession, signInWithRedirect, signOut, getCurrentUser } from 'aws-amplify/auth'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL

async function getAccessToken() {
  const session = await fetchAuthSession()
  return session.tokens.accessToken.toString()
}

export default function App() {
  const [user, setUser]       = useState(null)
  const [topic, setTopic]     = useState('')
  const [status, setStatus]   = useState(null)  // { type: 'success'|'error', message }
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  // Check if the user is already signed in on page load.
  useEffect(() => {
    getCurrentUser()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setChecking(false))
  }, [])

  async function handleAttachTopic(e) {
    e.preventDefault()
    if (!topic.trim()) return

    setLoading(true)
    setStatus(null)

    try {
      const token = await getAccessToken()

      const res = await fetch(`${API_URL}/attach-topic-to-user`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type':  'application/json',
        },
        body: JSON.stringify({ "topic": topic.trim() }),
      })

      if (!res.ok) throw new Error(`Request failed: ${res.status}`)

      setStatus({ type: 'success', message: `Subscribed to "${topic.trim()}" successfully.` })
      setTopic('')
    } catch (err) {
      setStatus({ type: 'error', message: err.message })
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return <div className="screen"><div className="spinner" /></div>
  }

  if (!user) {
    return (
      <div className="screen">
        <div className="card">
          <h1 className="logo">PULSE</h1>
          <p className="tagline">Subscribe to topics. Stay in the loop.</p>
          <button className="btn-primary" onClick={() => signInWithRedirect()}>
            Sign in with Google
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="screen">
      <div className="card">
        <div className="top-bar">
          <h1 className="logo">PULSE</h1>
          <button className="btn-ghost" onClick={() => signOut()}>Sign out</button>
        </div>

        <p className="welcome">Welcome back, {user.signInDetails?.loginId ?? 'there'}.</p>

        <form onSubmit={handleAttachTopic} className="form">
          <label className="label">Subscribe to a topic</label>
          <div className="input-row">
            <input
              className="input"
              type="text"
              placeholder="e.g. machine learning, geopolitics..."
              value={topic}
              onChange={e => setTopic(e.target.value)}
              disabled={loading}
            />
            <button className="btn-primary" type="submit" disabled={loading || !topic.trim()}>
              {loading ? '...' : 'Subscribe'}
            </button>
          </div>
        </form>

        {status && (
          <p className={`status ${status.type}`}>{status.message}</p>
        )}
      </div>
    </div>
  )
}
