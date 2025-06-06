"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import AppLayout from "@/components/app-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Send, Terminal, CheckCircle, XCircle, Clock } from "lucide-react"

interface Message {
  id: string
  content: string
  role: "user" | "system"
  timestamp: Date
  status?: "success" | "error" | "pending"
  metadata?: {
    command?: string
    ticketId?: string
  }
}

export default function HomePage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content:
        "Welcome to ChatOps Assistant! You can execute operational commands like:\n• create-kafka-topic <topic-name> <cluster-name>\n• restart-service <service-name>\n• deploy-app <app-name> <environment>\n• scale-service <service-name> <replicas>",
      role: "system",
      timestamp: new Date(),
      status: "success",
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [isUserScrolling, setIsUserScrolling] = useState(false)

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
  }, [messages, isUserScrolling])

  const simulateCommandExecution = async (command: string): Promise<Message> => {
    await new Promise((resolve) => setTimeout(resolve, 1500))

    const commandLower = command.toLowerCase()

    if (commandLower.includes("create-kafka-topic")) {
      const parts = command.split(" ")
      const topicName = parts[1] || "unknown-topic"
      return {
        id: Date.now().toString(),
        content: `✅ Kafka topic "${topicName}" created successfully.\n📋 Ticket #TKT-${Math.floor(Math.random() * 1000)} has been generated for approval.\n⏱️ Estimated completion: 5-10 minutes`,
        role: "system",
        timestamp: new Date(),
        status: "success",
        metadata: {
          command: command,
          ticketId: `TKT-${Math.floor(Math.random() * 1000)}`,
        },
      }
    } else if (commandLower.includes("restart-service")) {
      const parts = command.split(" ")
      const serviceName = parts[1] || "unknown-service"
      return {
        id: Date.now().toString(),
        content: `🔄 Service "${serviceName}" restart initiated.\n📋 Ticket #TKT-${Math.floor(Math.random() * 1000)} created for tracking.\n⚠️ This action requires approval from team lead.`,
        role: "system",
        timestamp: new Date(),
        status: "pending",
        metadata: {
          command: command,
          ticketId: `TKT-${Math.floor(Math.random() * 1000)}`,
        },
      }
    } else if (commandLower.includes("deploy-app")) {
      return {
        id: Date.now().toString(),
        content: `🚀 Deployment pipeline triggered.\n📋 Ticket #TKT-${Math.floor(Math.random() * 1000)} created.\n✅ Pre-deployment checks passed.\n⏳ Awaiting final approval...`,
        role: "system",
        timestamp: new Date(),
        status: "pending",
        metadata: {
          command: command,
          ticketId: `TKT-${Math.floor(Math.random() * 1000)}`,
        },
      }
    } else {
      return {
        id: Date.now().toString(),
        content: `❌ Command not recognized: "${command}"\n\nAvailable commands:\n• create-kafka-topic <topic-name> <cluster-name>\n• restart-service <service-name>\n• deploy-app <app-name> <environment>\n• scale-service <service-name> <replicas>`,
        role: "system",
        timestamp: new Date(),
        status: "error",
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const systemResponse = await simulateCommandExecution(input)
      setMessages((prev) => [...prev, systemResponse])
    } catch (error) {
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: "An error occurred while processing your command. Please try again.",
        role: "system",
        timestamp: new Date(),
        status: "error",
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return null
    }
  }

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "success":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Success
          </Badge>
        )
      case "error":
        return <Badge variant="destructive">Error</Badge>
      case "pending":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            Pending
          </Badge>
        )
      default:
        return null
    }
  }

  return (
    <AppLayout>
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center">
            <Terminal className="h-6 w-6 text-blue-600 mr-3" />
            <h1 className="text-xl font-semibold text-gray-900">Command Center</h1>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 relative">
          <div className="absolute inset-0 overflow-y-auto p-6 space-y-4" onScroll={handleScroll}>
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-3xl ${message.role === "user" ? "ml-12" : "mr-12"}`}>
                  <Card
                    className={`p-4 ${
                      message.role === "user" ? "bg-blue-50 border-blue-200" : "bg-white border-gray-200"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`text-sm font-medium ${
                            message.role === "user" ? "text-blue-700" : "text-gray-700"
                          }`}
                        >
                          {message.role === "user" ? "You" : "System"}
                        </span>
                        {message.status && getStatusIcon(message.status)}
                      </div>
                      <div className="flex items-center space-x-2">
                        {message.status && getStatusBadge(message.status)}
                        <span className="text-xs text-gray-500">{message.timestamp.toLocaleTimeString()}</span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-900 whitespace-pre-wrap">{message.content}</div>
                    {message.metadata?.ticketId && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <span className="text-xs text-gray-500">Ticket ID: {message.metadata.ticketId}</span>
                      </div>
                    )}
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
                      <span className="text-sm text-gray-600">Processing command...</span>
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
              placeholder="Enter operational command (e.g., create-kafka-topic test-topic prod-cluster)"
              className="flex-1"
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
          <p className="text-xs text-gray-500 mt-2">
            Type commands like: create-kafka-topic, restart-service, deploy-app, scale-service
          </p>
        </div>
      </div>
    </AppLayout>
  )
}
