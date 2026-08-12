import { getToken, setToken, clearToken, authHeaders } from './auth'

beforeEach(() => localStorage.clear())

describe('auth token storage', () => {
  it('returns null when no token is stored', () => {
    expect(getToken()).toBeNull()
  })

  it('round-trips a token through setToken/getToken', () => {
    setToken('abc.def')
    expect(getToken()).toBe('abc.def')
  })

  it('removes the token on clearToken', () => {
    setToken('abc.def')
    clearToken()
    expect(getToken()).toBeNull()
  })

  it('authHeaders is empty when no token is stored', () => {
    expect(authHeaders()).toEqual({})
  })

  it('authHeaders includes a Bearer Authorization header when a token is stored', () => {
    setToken('abc.def')
    expect(authHeaders()).toEqual({ Authorization: 'Bearer abc.def' })
  })
})
