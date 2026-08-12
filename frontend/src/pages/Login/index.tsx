import React, { useState } from 'react'
import { useNavigate } from 'react-router'
import { apiBaseUrl } from '../../config'
import { setToken } from '../../auth'

const Login: React.FC = () => {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [accessCode, setAccessCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`${apiBaseUrl}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, accessCode }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error((json as { error?: string }).error ?? 'Login failed')
      }
      setToken((json as { token: string }).token)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full flex justify-center py-16">
      <div className="w-full max-w-[380px] flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Commentary Coach</h1>
          <p className="text-muted text-sm mt-2 leading-relaxed">
            Enter the name and access code you were given to continue.
          </p>
        </div>

        <form
          onSubmit={(e) => { void handleSubmit(e) }}
          className="bg-surface rounded-lg border border-white/10 p-6 flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1.5">
            <label htmlFor="login-name" className="text-sm text-muted">Name</label>
            <input
              id="login-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              className="bg-black/20 border border-white/10 rounded-md px-3 py-2 text-white text-sm"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="login-code" className="text-sm text-muted">Access code</label>
            <input
              id="login-code"
              type="password"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              disabled={loading}
              className="bg-black/20 border border-white/10 rounded-md px-3 py-2 text-white text-sm"
              required
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !name || !accessCode}
            className="w-full mt-1 py-3.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-25 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors"
          >
            {loading ? 'Logging in…' : 'Log in'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login
