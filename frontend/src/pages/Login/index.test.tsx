import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { http, HttpResponse } from 'msw'

import Login from './index'
import { server } from '../../../mocks/server'
import { getToken } from '../../auth'

const fillAndSubmit = async (name: string, accessCode: string) => {
  const user = userEvent.setup()
  render(
    <MemoryRouter initialEntries={['/login']}>
      <Login />
    </MemoryRouter>,
  )
  await user.type(screen.getByLabelText(/name/i), name)
  await user.type(screen.getByLabelText(/access code/i), accessCode)
  await user.click(screen.getByRole('button', { name: /log in/i }))
}

beforeEach(() => localStorage.clear())

test('renders name and access code fields', () => {
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>,
  )
  expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
  expect(screen.getByLabelText(/access code/i)).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /log in/i })).toBeDisabled()
})

test('stores the token and clears the error on successful login', async () => {
  server.use(
    http.post('http://localhost:3000/api/login', async ({ request }) => {
      const body = (await request.json()) as { name: string; accessCode: string }
      expect(body).toEqual({ name: 'Jason', accessCode: 'secret' })
      return HttpResponse.json({ token: 'signed.token', name: 'Jason' })
    }),
  )

  await fillAndSubmit('Jason', 'secret')

  await waitFor(() => expect(getToken()).toBe('signed.token'))
})

test('shows an error and does not store a token on failed login', async () => {
  server.use(
    http.post('http://localhost:3000/api/login', () =>
      HttpResponse.json({ error: 'Invalid name or access code' }, { status: 401 }),
    ),
  )

  await fillAndSubmit('Jason', 'wrong-code')

  await waitFor(() =>
    expect(screen.getByText('Invalid name or access code')).toBeInTheDocument(),
  )
  expect(getToken()).toBeNull()
})
