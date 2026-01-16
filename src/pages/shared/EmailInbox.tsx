"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/AuthContext"
import {
  Mail,
  Inbox,
  Send,
  Archive,
  Trash2,
  Star,
  StarOff,
  Search,
  RefreshCw,
  Reply,
  Paperclip,
} from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

interface Email {
  id: string
  from: string
  fromName: string
  to: string
  subject: string
  body: string
  htmlBody?: string
  timestamp: string
  read: boolean
  starred: boolean
  folder: "inbox" | "sent" | "archived" | "trash"
  attachments?: { name: string; url: string; size: number }[]
}

export default function EmailInbox() {
  const { user } = useAuth()
  const [emails, setEmails] = useState<Email[]>([])
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeFolder, setActiveFolder] = useState<"inbox" | "sent" | "archived" | "trash">("inbox")
  const [composing, setComposing] = useState(false)
  const [composeData, setComposeData] = useState({
    to: "",
    subject: "",
    body: "",
  })

  useEffect(() => {
    if (user) {
      loadEmails()
    }
  }, [user, activeFolder])

  const loadEmails = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token')
      const response = await fetch(`/api/emails?folder=${activeFolder}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error("Failed to load emails")
      }

      const data = await response.json()
      setEmails(data.emails || [])
    } catch (error) {
      console.error("Error loading emails:", error)
      toast({
        title: "Error",
        description: "Failed to load emails",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSendEmail = async () => {
    if (!composeData.to || !composeData.subject || !composeData.body) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/emails/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(composeData),
      })

      if (!response.ok) {
        throw new Error("Failed to send email")
      }

      toast({
        title: "Success",
        description: "Email sent successfully",
      })

      setComposing(false)
      setComposeData({ to: "", subject: "", body: "" })
      loadEmails()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send email",
        variant: "destructive",
      })
    }
  }

  const handleMarkAsRead = async (emailId: string, read: boolean) => {
    try {
      await fetch(`/api/emails/${emailId}/read`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ read }),
      })

      setEmails((prev) => prev.map((email) => (email.id === emailId ? { ...email, read } : email)))
    } catch (error) {
      console.error("Error marking email:", error)
    }
  }

  const handleStarEmail = async (emailId: string, starred: boolean) => {
    try {
      await fetch(`/api/emails/${emailId}/star`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ starred }),
      })

      setEmails((prev) => prev.map((email) => (email.id === emailId ? { ...email, starred } : email)))
      if (selectedEmail?.id === emailId) {
        setSelectedEmail({ ...selectedEmail, starred })
      }
    } catch (error) {
      console.error("Error starring email:", error)
    }
  }

  const handleReply = (email: Email) => {
    setComposeData({
      to: email.from,
      subject: `Re: ${email.subject}`,
      body: `\n\n---\nOn ${new Date(email.timestamp).toLocaleString()}, ${email.fromName} wrote:\n${email.body}`,
    })
    setComposing(true)
  }

  const filteredEmails = emails.filter(
    (email) =>
      email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.fromName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const unreadCount = emails.filter((e) => !e.read).length

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Email Inbox</h2>
          <p className="text-muted-foreground">
            {user?.email} - {unreadCount} unread
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadEmails}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setComposing(true)}>
            <Send className="h-4 w-4 mr-2" />
            Compose
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search emails..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs value={activeFolder} onValueChange={(v) => setActiveFolder(v as any)}>
                <TabsList className="w-full grid grid-cols-4">
                  <TabsTrigger value="inbox" className="text-xs">
                    <Inbox className="h-3 w-3 mr-1" />
                    Inbox
                  </TabsTrigger>
                  <TabsTrigger value="sent" className="text-xs">
                    <Send className="h-3 w-3 mr-1" />
                    Sent
                  </TabsTrigger>
                  <TabsTrigger value="archived" className="text-xs">
                    <Archive className="h-3 w-3 mr-1" />
                    Archive
                  </TabsTrigger>
                  <TabsTrigger value="trash" className="text-xs">
                    <Trash2 className="h-3 w-3 mr-1" />
                    Trash
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="max-h-[600px] overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : filteredEmails.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Mail className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No emails in {activeFolder}</p>
                  </div>
                ) : (
                  filteredEmails.map((email) => (
                    <div
                      key={email.id}
                      onClick={() => {
                        setSelectedEmail(email)
                        if (!email.read) {
                          handleMarkAsRead(email.id, true)
                        }
                      }}
                      className={`p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                        selectedEmail?.id === email.id ? "bg-muted" : ""
                      } ${!email.read ? "bg-blue-50 dark:bg-blue-950/20" : ""}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarFallback className="text-xs">
                              {email.fromName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm truncate ${!email.read ? "font-semibold" : ""}`}>
                              {email.fromName}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">{email.from}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleStarEmail(email.id, !email.starred)
                            }}
                          >
                            {email.starred ? (
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            ) : (
                              <StarOff className="h-4 w-4 text-muted-foreground" />
                            )}
                          </button>
                          <span className="text-xs text-muted-foreground">{formatDate(email.timestamp)}</span>
                        </div>
                      </div>
                      <p className={`text-sm mb-1 truncate ${!email.read ? "font-medium" : ""}`}>{email.subject}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{email.body}</p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="col-span-8">
          {selectedEmail ? (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start mb-4">
                  <CardTitle className="text-xl">{selectedEmail.subject}</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleReply(selectedEmail)}>
                      <Reply className="h-4 w-4 mr-2" />
                      Reply
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{selectedEmail.fromName.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{selectedEmail.fromName}</p>
                    <p className="text-sm text-muted-foreground">{selectedEmail.from}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedEmail.timestamp).toLocaleString()}
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose dark:prose-invert max-w-none">
                  {selectedEmail.htmlBody ? (
                    <div dangerouslySetInnerHTML={{ __html: selectedEmail.htmlBody }} />
                  ) : (
                    <p className="whitespace-pre-wrap">{selectedEmail.body}</p>
                  )}
                </div>
                {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                  <div className="mt-6 pt-6 border-t">
                    <h4 className="font-medium mb-3">Attachments</h4>
                    <div className="space-y-2">
                      {selectedEmail.attachments.map((attachment, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 border rounded">
                          <Paperclip className="h-4 w-4" />
                          <span className="text-sm flex-1">{attachment.name}</span>
                          <Button variant="outline" size="sm" asChild>
                            <a href={attachment.url} download>
                              Download
                            </a>
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Mail className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>Select an email to read</p>
              </div>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={composing} onOpenChange={setComposing}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Compose Email</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>To</Label>
              <Input
                placeholder="recipient@example.com"
                value={composeData.to}
                onChange={(e) => setComposeData({ ...composeData, to: e.target.value })}
              />
            </div>
            <div>
              <Label>Subject</Label>
              <Input
                placeholder="Email subject"
                value={composeData.subject}
                onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
              />
            </div>
            <div>
              <Label>Message</Label>
              <Textarea
                placeholder="Write your message..."
                rows={10}
                value={composeData.body}
                onChange={(e) => setComposeData({ ...composeData, body: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setComposing(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendEmail}>
              <Send className="h-4 w-4 mr-2" />
              Send Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
