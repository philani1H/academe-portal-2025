"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Lock, User, Shield } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { withBase } from "@/lib/api"

const AdminLogin = () => {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const identifier = username.trim()
      const payload =
        identifier.includes("@")
          ? { email: identifier, password }
          : { username: identifier, password }

      const response = await fetch(withBase('/api/admin/auth/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      const data = await response.json()
      
      if (response.ok && data.success) {
        if (data.token) {
          try { localStorage.setItem('auth_token', data.token); } catch {}
        }
        
        try {
          const uname = String(data?.user?.displayName || data?.user?.username || identifier)
          const stored = {
            name: uname,
            email: identifier.includes("@") ? identifier : uname,
            role: "admin",
          }
          localStorage.setItem("user", JSON.stringify(stored))
        } catch {}
        toast({
          title: "Success",
          description: "Login successful! Redirecting to admin dashboard...",
        })
        
        // Redirect to admin dashboard after a short delay
        setTimeout(() => {
          navigate('/admin/content')
        }, 1000)
      } else {
        if (response.status === 401) {
          setError('Invalid credentials')
        } else if (response.status >= 500) {
          setError('Server error. Please try again.')
        } else {
          setError(data.message || 'Login failed')
        }
      }
    } catch (error) {
      console.error('Login error:', error)
      setError('Server unavailable. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-purple-900">
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md p-6"
      >
        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Admin Login
            </CardTitle>
            <CardDescription className="text-gray-600">
              Access the content management system
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="username">Username or Email</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter username or email"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Signing In...</span>
                  </div>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                Default credentials: admin / admin123
              </p>
            </div>
          </CardContent>
        </Card>
        
        <div className="mt-6 text-center">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="text-white hover:bg-white/10"
          >
            ← Back to Website
          </Button>
        </div>
      </motion.div>
    </div>
  )
}

export default AdminLogin
