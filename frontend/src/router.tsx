import { createBrowserRouter } from 'react-router'

import Layout from './components/Layout/Layout'
import Index from './pages/Index'
import Review from './pages/Review'
import Notfound from './pages/Notfound'

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <Layout>
        <Index />
      </Layout>
    ),
  },
  {
    path: '/review/:id',
    element: (
      <Layout>
        <Review />
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
