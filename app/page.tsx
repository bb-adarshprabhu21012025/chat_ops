"use client"

import React, { useState, useRef, useEffect } from "react"
import AppLayout from "@/components/app-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Send, Terminal, Plus } from "lucide-react"

interface Message {
  id: string
  content: string
  role: "user" | "system"
  timestamp: Date
}

interface Conversation {
  conversationId: string
  createdAt: Date
  messages: Message[]
}

function generateRandomId(length = 8) {
  return crypto.getRandomValues(new Uint8Array(length))
    .reduce((acc, byte) => acc + byte.toString(16).padStart(2, "0"), "")
}

export default function HomePage() {
  const [conversation, setConversation] = useState<Conversation>({
    conversationId: generateRandomId(6),
    createdAt: new Date(),
    messages: [
      {
        id: generateRandomId(8),
        content: "Hello! I can assist you with Kafka topics, deployments, scaling services, and more. Type your command below.",
        role: "system",
        timestamp: new Date(),
      },
    ],
  })

  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [isUserScrolling, setIsUserScrolling] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)

  const scrollToBottom = () => {
    if (!isUserScrolling) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
    setIsUserScrolling(!isNearBottom)
  }

  useEffect(() => {
    scrollToBottom()
  }, [conversation.messages, isUserScrolling])

  // WebSocket connection on mount
  useEffect(() => {
    const ws = new WebSocket("ws://localhost:9000/bbkernos/ws/chat")
    wsRef.current = ws

    ws.onopen = () => {
      console.log("✅ WebSocket connected")
    }

    ws.onmessage = (event) => {
      const systemMessage: Message = {
        id: generateRandomId(8),
        content: event.data || "Received response",
        role: "system",
        timestamp: new Date(),
      }

      setConversation((prev) => ({
        ...prev,
        messages: [...prev.messages, systemMessage],
      }))
      setIsLoading(false)
    }

    ws.onerror = (err) => {
      console.error("❌ WebSocket error", err)
    }

    ws.onclose = () => {
      console.warn("⚠️ WebSocket closed")
    }

    return () => {
      ws.close()
    }
  }, [])

  const createNewConversation = () => {
    window.location.reload();
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: generateRandomId(8),
      content: input,
      role: "user",
      timestamp: new Date(),
    }

    setConversation((prev) => ({
      ...prev,
      messages: [...prev.messages, userMessage],
    }))
    setInput("")
    setIsLoading(true)

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(input)
    } else {
      console.error("WebSocket is not connected")
      setIsLoading(false)
    }
  }

  return (
    <AppLayout>
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Terminal className="h-6 w-6 text-blue-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">Command Center</h1>
              <span className="ml-4 text-xs text-gray-400">
                Conversation ID: {conversation.conversationId}
              </span>
            </div>
            <Button onClick={createNewConversation} variant="outline" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Conversation
            </Button>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 relative">
          <div className="absolute inset-0 overflow-y-auto p-6 space-y-4" onScroll={handleScroll}>
            {conversation.messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-3xl ${message.role === "user" ? "ml-12" : "mr-12"}`}>
                  <Card
                    className={`p-4 ${
                      message.role === "user" ? "bg-blue-50 border-blue-200" : "bg-white border-gray-200"
                    }`}
                  >
                    <div className="flex items-center space-x-4 mb-2">
                      <span className={`text-sm font-medium ${message.role === "user" ? "text-blue-700" : "text-gray-700"}`}>
                        {message.role === "user" ? "You" : "System"}
                      </span>
                      <span className="text-xs text-gray-500">{message.timestamp.toLocaleTimeString()}</span>
                    </div>
                    <div className="text-sm text-gray-900 whitespace-pre-wrap">
                      {message.content.replace(/\*\*/g, "")}
                    </div>
                  </Card>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-3xl mr-12">
                  <Card className="p-4 bg-white border-gray-200">
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-sm text-gray-600">Processing...</span>
                    </div>
                  </Card>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Floating Scroll to Bottom Button */}
          {isUserScrolling && (
            <div className="absolute bottom-4 right-4 z-10">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsUserScrolling(false)
                  scrollToBottom()
                }}
                className="shadow-lg bg-white hover:bg-gray-50"
              >
                ↓ Scroll to bottom
              </Button>
            </div>
          )}
        </div>

        {/* Input Form */}
        <div className="bg-white border-t border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="flex space-x-4">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a command (e.g., create-kafka-topic test-topic qa)"
              className="flex-1"
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </AppLayout>
  )
}
