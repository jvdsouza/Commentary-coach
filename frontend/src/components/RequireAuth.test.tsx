import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router'

import RequireAuth from './RequireAuth'
import { setToken } from '../auth'

const renderProtected = () =>
  render(
    <MemoryRouter initialEntries={['/protected']}>
      <Routes>
        <Route
          path="/protected"
          element={
            <RequireAuth>
              <div>Secret content</div>
            </RequireAuth>
          }
        />
        <Route path="/login" element={<div>Login page</div>} />
      </Routes>
    </MemoryRouter>,
  )

beforeEach(() => localStorage.clear())

test('renders children when a token is present', () => {
  setToken('signed.token')
  renderProtected()
  expect(screen.getByText('Secret content')).toBeInTheDocument()
})

test('redirects to /login when no token is present', () => {
  renderProtected()
  expect(screen.getByText('Login page')).toBeInTheDocument()
  expect(screen.queryByText('Secret content')).not.toBeInTheDocument()
})
