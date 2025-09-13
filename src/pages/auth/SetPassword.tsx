"use client"

import React, { useEffect, useState } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { apiFetch } from "@/lib/api"

export default function SetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { toast } = useToast()

  const token = searchParams.get("token") || ""
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [validToken, setValidToken] = useState<boolean>(!!token)

  useEffect(() => {
    setValidToken(!!token)
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!token) {
      setError("Missing or invalid link. Please use the latest invitation email.")
      return
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.")
      return
    }
    if (password !== confirm) {
      setError("Passwords do not match.")
      return
    }

    setLoading(true)
    try {
      const res = await apiFetch<{ success: boolean; error?: string }>("/api/auth/set-password", {
        method: "POST",
        body: JSON.stringify({ token, password })
      })

      if ((res as any)?.success) {
        toast({ title: "Success", description: "Password set successfully. You can now log in." })
        setTimeout(() => navigate("/login"), 800)
      } else {
        setError((res as any)?.error || "Failed to set password. Try again.")
      }
    } catch (err: any) {
      setError("Failed to set password. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <Card className="w-full max-w-md shadow-xl border-blue-100">
        <CardHeader>
          <CardTitle className="text-2xl text-blue-900">Create Your Password</CardTitle>
          <CardDescription>Set a password to activate your Excellence Academia account.</CardDescription>
        </CardHeader>
        <CardContent>
          {!validToken && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>
                Invitation link is missing or invalid. Please use the latest invitation email.
              </AlertDescription>
            </Alert>
          )}
          {error && (
            <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm Password</Label>
              <Input
                id="confirm"
                type="password"
                placeholder="Re-enter password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={loading || !validToken} className="w-full">
              {loading ? "Setting Password..." : "Set Password"}
            </Button>
            <Button type="button" variant="ghost" className="w-full" onClick={() => navigate("/login")}>Back to Login</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
