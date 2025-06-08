"use client"

import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import AppLayout from "@/components/app-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  MessageSquare,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Send,
  ArrowDown,
} from "lucide-react"
import Link from "next/link"

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://hqa-svc.bigbasket.com/jira/api/v1"
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:9000/bbkernos/ws/chat"

interface Message {
  id: string
  content: string
  role: "user" | "assistant" | "system"
  timestamp: Date
  status?: "success" | "error" | "pending"
}

interface ConversationData {
  conversation_id: number
  email_id: string
  jira_id: string
  status_of_jira: string
  priority: string
  jenkins_job_id: number | null
  conversation: {
    conversation: Array<{
      role: string
      content: string
    }>
    messages?: Message[]
  }
  status_of_conversation: string
  template_id: number | null
  em_approval_status: boolean
  elt_approval_status: boolean
  data_approval_status: boolean
  security_approval_status: boolean
  all_approval_final_status: boolean
  em_slack_invocation_count: number
  em_pd_invocation_count: number
  elt_slack_invocation_count: number
  elt_pd_invocation_count: number
}

export default function ConversationDetailPage() {
  const params = useParams()
  const [conversation, setConversation] = useState<ConversationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const [isUserScrolling, setIsUserScrolling] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // Fetch conversation data
  useEffect(() => {
    const fetchConversation = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch(`${API_BASE_URL}/conversations?conversation_id=${params.id}`)
        if (!response.ok) throw new Error('Failed to fetch conversation')
        
        const data = await response.json()
        console.log('Fetched conversation data:', data)
        
        if (data && data.length > 0) {
          // Transform the messages to include IDs and timestamps
          const conversation = data[0]
          if (conversation.conversation?.conversation) {
            conversation.conversation.messages = conversation.conversation.conversation.map((msg: { role: string; content: string }, index: number) => ({
              id: `msg-${index}`,
              content: msg.content,
              role: msg.role === 'assistant' ? 'system' : msg.role,
              timestamp: new Date()
            }))
          }
          setConversation(conversation)
        } else {
          setError('Conversation not found')
        }
      } catch (err) {
        console.error('Error fetching conversation:', err)
        setError(err instanceof Error ? err.message : 'Failed to load conversation')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchConversation()
    }
  }, [params.id])

  // Initialize WebSocket connection
  useEffect(() => {
    if (!params.id) return

    const ws = new WebSocket(`ws://localhost:9000/bbkernos/ws/continue?conversation_id=${params.id}`)
    wsRef.current = ws

    ws.onopen = () => {
      console.log('WebSocket Connected')
      setIsConnected(true)
    }

    ws.onmessage = (event) => {
      try {
        let data = event.data
        console.log('Received WebSocket message:', data)

        // Handle error message for failed history fetch
        if (typeof data === 'string' && data.startsWith('❌')) {
          setError(data)
          return
        }

        // Try to parse as JSON, but keep as string if it fails
        try {
          data = JSON.parse(event.data)
        } catch (e) {
          // If parsing fails, keep the original string data
          console.log('Received plain text message:', data)
        }

        // Create a new system message
        const systemMessage: Message = {
          id: Date.now().toString(),
          content: typeof data === 'string' ? data : data.content || data.message || JSON.stringify(data),
          role: "system",
          timestamp: new Date()
        }

        // Update conversation with the new message
        setConversation(prev => {
          if (!prev) return prev
          return {
            ...prev,
            conversation: {
              ...prev.conversation,
              messages: [...(prev.conversation.messages || []), systemMessage]
            }
          }
        })
      } catch (err) {
        console.error('Error handling WebSocket message:', err)
        setError('Failed to handle server message')
      }
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      setError('Failed to connect to chat server')
    }

    ws.onclose = (event) => {
      console.log('WebSocket Disconnected:', event.code, event.reason)
      setIsConnected(false)
      if (event.code === 1008) {
        setError('Missing conversation ID')
      }
    }

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close()
      }
    }
  }, [params.id])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !conversation || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return

    try {
      setSending(true)
      
      // Create a temporary message for immediate UI feedback
      const tempMessage: Message = {
        id: Date.now().toString(),
        content: newMessage,
        role: 'user' as const,
        timestamp: new Date()
      }

      // Update UI immediately with user's message
      setConversation(prev => {
        if (!prev) return prev
        return {
          ...prev,
          conversation: {
            ...prev.conversation,
            messages: [...(prev.conversation.messages || []), tempMessage]
          }
        }
      })

      // Send message through WebSocket
      wsRef.current.send(newMessage)

      setNewMessage("")
    } catch (err) {
      console.error('Error sending message:', err)
      setError(err instanceof Error ? err.message : 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Completed
          </Badge>
        )
      case "active":
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            Active
          </Badge>
        )
      case "error":
        return <Badge variant="destructive">Error</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    const colors = {
      Low: "bg-gray-100 text-gray-800",
      Medium: "bg-yellow-100 text-yellow-800",
      High: "bg-orange-100 text-orange-800",
      Critical: "bg-red-100 text-red-800",
    }

    return (
      <Badge variant="secondary" className={colors[priority as keyof typeof colors] || colors.Low}>
        {priority}
      </Badge>
    )
  }

  // Scroll to bottom function
  const scrollToBottom = () => {
    if (!isUserScrolling) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }

  // Handle scroll events
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
    setIsUserScrolling(!isNearBottom)
  }

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom()
  }, [conversation?.conversation.messages, isUserScrolling])

  if (loading) {
    return (
      <AppLayout>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading conversation...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="flex-1 flex flex-col h-full">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/conversations">
                <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Conversations</span>
                </Button>
              </Link>
              <div className="flex items-center">
                <MessageSquare className="h-6 w-6 text-blue-600 mr-3" />
                <h1 className="text-xl font-semibold text-gray-900">Conversation Details</h1>
              </div>
            </div>
            {!isConnected && (
              <Badge variant="destructive" className="ml-4">
                Disconnected
              </Badge>
            )}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="px-6 py-4 bg-red-50 border-b border-red-200">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}

        {/* Conversation Content */}
        {conversation && (
          <div className="flex-1 flex flex-col">
            {/* Conversation Info */}
            <div className="p-6 border-b border-gray-200">
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex flex-col">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-lg bg-gray-100 px-3 py-1 rounded">
                            {conversation.jira_id}
                          </span>
                          <span className="text-gray-500">•</span>
                          <span className="text-lg font-medium text-gray-700">
                            {conversation.conversation.conversation[0]?.content.split(' ')[0] || 'Unknown Module'}
                          </span>
                        </div>
                      </div>
                      {getStatusBadge(conversation.status_of_conversation)}
                      {getPriorityBadge(conversation.priority)}
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Email:</span> {conversation.email_id}
                      </div>
                      <div>
                        <span className="text-gray-500">JIRA Status:</span> {conversation.status_of_jira}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Messages */}
            <div className="flex-1 relative">
              <div 
                ref={chatContainerRef}
                className="absolute inset-0 overflow-y-auto p-6 space-y-4"
                onScroll={handleScroll}
              >
                {(conversation.conversation.messages || []).length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No messages in this conversation yet. Start the conversation by sending a message below.
                  </div>
                ) : (
                  (conversation.conversation.messages || []).map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`max-w-3xl ${message.role === "user" ? "ml-12" : "mr-12"}`}>
                        <Card
                          className={`p-4 ${
                            message.role === "user" ? "bg-blue-50 border-blue-200" : "bg-white border-gray-200"
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <span
                              className={`text-sm font-medium ${
                                message.role === "user" ? "text-blue-700" : "text-gray-700"
                              }`}
                            >
                              {message.role === "user" ? "You" : "System"}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(message.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <div className="text-sm text-gray-900 whitespace-pre-wrap">{message.content}</div>
                        </Card>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Scroll to bottom button */}
              {!isUserScrolling && (
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute bottom-20 right-6 rounded-full p-2"
                  onClick={scrollToBottom}
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Message Input */}
            <div className="p-6 border-t border-gray-200">
              <div className="flex space-x-4">
                <Input
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  disabled={sending}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={sending || !newMessage.trim()}
                  className="flex items-center space-x-2"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  <span>Send</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
} 