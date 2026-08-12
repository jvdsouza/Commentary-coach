import type { PropsWithChildren } from 'react'
import React from 'react'
import { Navigate } from 'react-router'
import { getToken } from '../auth'

const RequireAuth: React.FC<PropsWithChildren> = ({ children }) => {
  if (!getToken()) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

export default RequireAuth
