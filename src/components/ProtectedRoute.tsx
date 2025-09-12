"use client"

import React from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'admin' | 'tutor' | 'student'
  fallbackPath?: string
}

export default function ProtectedRoute({ 
  children, 
  requiredRole, 
  fallbackPath = '/auth/login' 
}: ProtectedRouteProps) {
  const { user, loading, isAuthenticated } = useAuth()
  const router = useRouter()

  React.useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push(fallbackPath)
        return
      }

      if (requiredRole && user?.role !== requiredRole) {
        // Redirect to appropriate dashboard based on user role
        if (user?.role === 'admin') {
          router.push('/admin/dashboard')
        } else if (user?.role === 'tutor') {
          router.push('/tutor/dashboard')
        } else if (user?.role === 'student') {
          router.push('/student/dashboard')
        } else {
          router.push(fallbackPath)
        }
        return
      }
    }
  }, [loading, isAuthenticated, user, requiredRole, router, fallbackPath])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  if (requiredRole && user?.role !== requiredRole) {
    return null
  }

  return <>{children}</>
}