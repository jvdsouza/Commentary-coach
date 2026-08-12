import { createBrowserRouter } from 'react-router'

import Layout from './components/Layout/Layout'
import RequireAuth from './components/RequireAuth'
import Index from './pages/Index'
import Login from './pages/Login'
import Review from './pages/Review'
import Notfound from './pages/Notfound'

const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <Layout>
        <Login />
      </Layout>
    ),
  },
  {
    path: '/',
    element: (
      <Layout>
        <RequireAuth>
          <Index />
        </RequireAuth>
      </Layout>
    ),
  },
  {
    path: '/review/:id',
    element: (
      <Layout>
        <RequireAuth>
          <Review />
        </RequireAuth>
      </Layout>
    ),
  },
  {
    path: '*',
    element: (
      <Layout>
        <Notfound />
      </Layout>
    ),
  },
])

export default router
