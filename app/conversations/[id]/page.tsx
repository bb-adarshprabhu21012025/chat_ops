"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import AppLayout from "@/components/app-layout"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, MessageSquare, CheckCircle, XCircle, Clock } from "lucide-react"

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

interface Conversation {
  id: string
  title: string
  createdAt: Date
  lastActivity: Date
  messageCount: number
  status: "active" | "completed" | "error"
  summary: string
  messages: Message[]
}

// Mock conversation data with messages
const mockConversations: Record<string, Conversation> = {
  "conv-001": {
    id: "conv-001",
    title: "Kafka Topic Creation - prod-events",
    createdAt: new Date("2024-01-15T10:30:00"),
    lastActivity: new Date("2024-01-15T10:45:00"),
    messageCount: 8,
    status: "completed",
    summary: "Successfully created Kafka topic for production events processing",
    messages: [
      {
        id: "msg-001-1",
        content: "Hello, I need to create a new Kafka topic for production events.",
        role: "user",
        timestamp: new Date("2024-01-15T10:30:00"),
      },
      {
        id: "msg-001-2",
        content: "Sure, I can help with that. What should the topic name be and which cluster should it be created on?",
        role: "system",
        timestamp: new Date("2024-01-15T10:31:00"),
        status: "success",
      },
      {
        id: "msg-001-3",
        content: "create-kafka-topic prod-events prod-cluster",
        role: "user",
        timestamp: new Date("2024-01-15T10:32:00"),
      },
      {
        id: "msg-001-4",
        content:
          "I'll create a Kafka topic named 'prod-events' on the 'prod-cluster'. What partition count and replication factor would you like?",
        role: "system",
        timestamp: new Date("2024-01-15T10:33:00"),
        status: "success",
      },
      {
        id: "msg-001-5",
        content: "6 partitions with replication factor 3 please",
        role: "user",
        timestamp: new Date("2024-01-15T10:34:00"),
      },
      {
        id: "msg-001-6",
        content: "Creating Kafka topic 'prod-events' on 'prod-cluster' with 6 partitions and replication factor 3...",
        role: "system",
        timestamp: new Date("2024-01-15T10:35:00"),
        status: "pending",
      },
      {
        id: "msg-001-7",
        content:
          "✅ Kafka topic 'prod-events' created successfully.\n📋 Ticket #TKT-001 has been generated for tracking.\n⏱️ Estimated completion: 5-10 minutes",
        role: "system",
        timestamp: new Date("2024-01-15T10:40:00"),
        status: "success",
        metadata: {
          command: "create-kafka-topic prod-events prod-cluster",
          ticketId: "TKT-001",
        },
      },
      {
        id: "msg-001-8",
        content: "Thanks! Can you verify the topic is accessible?",
        role: "user",
        timestamp: new Date("2024-01-15T10:42:00"),
      },
      {
        id: "msg-001-9",
        content:
          "✅ Topic 'prod-events' is accessible and ready for use. The configuration has been applied successfully and the topic is available on all brokers in the prod-cluster.",
        role: "system",
        timestamp: new Date("2024-01-15T10:45:00"),
        status: "success",
      },
    ],
  },
  "conv-002": {
    id: "conv-002",
    title: "Service Restart - payment-api",
    createdAt: new Date("2024-01-15T09:15:00"),
    lastActivity: new Date("2024-01-15T09:30:00"),
    messageCount: 12,
    status: "completed",
    summary: "Restarted payment API service after memory leak detection",
    messages: [
      {
        id: "msg-002-1",
        content: "We're seeing high memory usage on the payment-api service. Can you help restart it?",
        role: "user",
        timestamp: new Date("2024-01-15T09:15:00"),
      },
      {
        id: "msg-002-2",
        content: "I can help with that. Would you like me to restart the payment-api service now?",
        role: "system",
        timestamp: new Date("2024-01-15T09:16:00"),
        status: "success",
      },
      {
        id: "msg-002-3",
        content: "Yes, please restart it. We've already notified the team.",
        role: "user",
        timestamp: new Date("2024-01-15T09:17:00"),
      },
      {
        id: "msg-002-4",
        content: "restart-service payment-api",
        role: "user",
        timestamp: new Date("2024-01-15T09:18:00"),
      },
      {
        id: "msg-002-5",
        content:
          "🔄 Service 'payment-api' restart initiated.\n📋 Ticket #TKT-002 created for tracking.\n⚠️ This action requires approval from team lead.",
        role: "system",
        timestamp: new Date("2024-01-15T09:19:00"),
        status: "pending",
        metadata: {
          command: "restart-service payment-api",
          ticketId: "TKT-002",
        },
      },
      {
        id: "msg-002-6",
        content: "How long will the approval take?",
        role: "user",
        timestamp: new Date("2024-01-15T09:20:00"),
      },
      {
        id: "msg-002-7",
        content: "Approval requests are typically processed within 5-15 minutes. I'll notify you once it's approved.",
        role: "system",
        timestamp: new Date("2024-01-15T09:21:00"),
        status: "success",
      },
      {
        id: "msg-002-8",
        content: "✅ Restart request for 'payment-api' has been approved by jane.smith@company.com.",
        role: "system",
        timestamp: new Date("2024-01-15T09:25:00"),
        status: "success",
      },
      {
        id: "msg-002-9",
        content: "🔄 Restarting payment-api service...",
        role: "system",
        timestamp: new Date("2024-01-15T09:26:00"),
        status: "pending",
      },
      {
        id: "msg-002-10",
        content:
          "✅ Service 'payment-api' has been successfully restarted.\n⏱️ Downtime: 45 seconds\n🔍 Health check: Passed",
        role: "system",
        timestamp: new Date("2024-01-15T09:28:00"),
        status: "success",
      },
      {
        id: "msg-002-11",
        content: "Great, thanks! Is the memory usage back to normal?",
        role: "user",
        timestamp: new Date("2024-01-15T09:29:00"),
      },
      {
        id: "msg-002-12",
        content:
          "✅ Memory usage has returned to normal levels. Current usage: 42% (was 89% before restart). I'll continue to monitor for the next hour and alert if any anomalies are detected.",
        role: "system",
        timestamp: new Date("2024-01-15T09:30:00"),
        status: "success",
      },
    ],
  },
  "conv-003": {
    id: "conv-003",
    title: "App Deployment - user-dashboard v2.1.0",
    createdAt: new Date("2024-01-15T08:00:00"),
    lastActivity: new Date("2024-01-15T08:45:00"),
    messageCount: 15,
    status: "active",
    summary: "Ongoing deployment of user dashboard to staging environment",
    messages: [
      {
        id: "msg-003-1",
        content: "I need to deploy the new version of the user dashboard to staging.",
        role: "user",
        timestamp: new Date("2024-01-15T08:00:00"),
      },
      {
        id: "msg-003-2",
        content: "I can help with that. Which version of the user dashboard would you like to deploy?",
        role: "system",
        timestamp: new Date("2024-01-15T08:01:00"),
        status: "success",
      },
      {
        id: "msg-003-3",
        content: "Version 2.1.0 please",
        role: "user",
        timestamp: new Date("2024-01-15T08:02:00"),
      },
      {
        id: "msg-003-4",
        content: "deploy-app user-dashboard staging v2.1.0",
        role: "user",
        timestamp: new Date("2024-01-15T08:03:00"),
      },
      {
        id: "msg-003-5",
        content:
          "🚀 Deployment pipeline triggered for user-dashboard v2.1.0 to staging.\n📋 Ticket #TKT-003 created.\n✅ Pre-deployment checks initiated...",
        role: "system",
        timestamp: new Date("2024-01-15T08:04:00"),
        status: "pending",
        metadata: {
          command: "deploy-app user-dashboard staging v2.1.0",
          ticketId: "TKT-003",
        },
      },
      {
        id: "msg-003-6",
        content: "✅ Pre-deployment checks passed.\n🔍 Running unit tests...",
        role: "system",
        timestamp: new Date("2024-01-15T08:10:00"),
        status: "success",
      },
      {
        id: "msg-003-7",
        content: "✅ Unit tests passed (124 tests, 0 failures).\n🔍 Running integration tests...",
        role: "system",
        timestamp: new Date("2024-01-15T08:15:00"),
        status: "success",
      },
      {
        id: "msg-003-8",
        content: "✅ Integration tests passed (36 tests, 0 failures).\n🏗️ Building deployment artifacts...",
        role: "system",
        timestamp: new Date("2024-01-15T08:25:00"),
        status: "success",
      },
      {
        id: "msg-003-9",
        content: "✅ Deployment artifacts built successfully.\n⏳ Awaiting final approval...",
        role: "system",
        timestamp: new Date("2024-01-15T08:35:00"),
        status: "pending",
      },
      {
        id: "msg-003-10",
        content: "How much longer will the approval take?",
        role: "user",
        timestamp: new Date("2024-01-15T08:40:00"),
      },
      {
        id: "msg-003-11",
        content:
          "The approval request has been sent to the release manager. Typically, approvals are processed within 15-30 minutes during business hours. I'll notify you as soon as it's approved.",
        role: "system",
        timestamp: new Date("2024-01-15T08:41:00"),
        status: "success",
      },
      {
        id: "msg-003-12",
        content: "Can you also notify the QA team that the deployment is pending?",
        role: "user",
        timestamp: new Date("2024-01-15T08:43:00"),
      },
      {
        id: "msg-003-13",
        content:
          "✅ Notification sent to the QA team via Slack channel #qa-notifications. They have been informed that user-dashboard v2.1.0 deployment to staging is pending approval.",
        role: "system",
        timestamp: new Date("2024-01-15T08:45:00"),
        status: "success",
      },
    ],
  },
  "conv-004": {
    id: "conv-004",
    title: "Database Migration - user_profiles",
    createdAt: new Date("2024-01-14T16:20:00"),
    lastActivity: new Date("2024-01-14T17:10:00"),
    messageCount: 20,
    status: "error",
    summary: "Database migration failed due to constraint violations",
    messages: [
      {
        id: "msg-004-1",
        content: "I need to run the database migration for the user_profiles table.",
        role: "user",
        timestamp: new Date("2024-01-14T16:20:00"),
      },
      {
        id: "msg-004-2",
        content: "migrate-database user_profiles",
        role: "user",
        timestamp: new Date("2024-01-14T16:21:00"),
      },
      {
        id: "msg-004-3",
        content:
          "I'll help you run the database migration for user_profiles. Which environment would you like to run this on?",
        role: "system",
        timestamp: new Date("2024-01-14T16:22:00"),
        status: "success",
      },
      {
        id: "msg-004-4",
        content: "Production please",
        role: "user",
        timestamp: new Date("2024-01-14T16:23:00"),
      },
      {
        id: "msg-004-5",
        content: "⚠️ This is a production database migration. Would you like me to create a backup before proceeding?",
        role: "system",
        timestamp: new Date("2024-01-14T16:24:00"),
        status: "pending",
      },
      {
        id: "msg-004-6",
        content: "Yes, please create a backup first",
        role: "user",
        timestamp: new Date("2024-01-14T16:25:00"),
      },
      {
        id: "msg-004-7",
        content: "📋 Creating backup of user_profiles table in production database...",
        role: "system",
        timestamp: new Date("2024-01-14T16:26:00"),
        status: "pending",
      },
      {
        id: "msg-004-8",
        content: "✅ Backup created successfully: user_profiles_20240114_162600.bak\n🔍 Validating migration script...",
        role: "system",
        timestamp: new Date("2024-01-14T16:35:00"),
        status: "success",
      },
      {
        id: "msg-004-9",
        content:
          "✅ Migration script validated.\n📋 Ticket #TKT-004 created for tracking.\n⚠️ This action requires approval from database administrator.",
        role: "system",
        timestamp: new Date("2024-01-14T16:40:00"),
        status: "pending",
        metadata: {
          command: "migrate-database user_profiles production",
          ticketId: "TKT-004",
        },
      },
      {
        id: "msg-004-10",
        content: "✅ Migration approved by sarah.johnson@company.com.\n🔄 Running migration...",
        role: "system",
        timestamp: new Date("2024-01-14T16:50:00"),
        status: "pending",
      },
      {
        id: "msg-004-11",
        content:
          "❌ Migration failed with error: Foreign key constraint violation.\nError details: Cannot add foreign key constraint 'fk_user_profiles_address' - referenced table 'addresses' does not exist.",
        role: "system",
        timestamp: new Date("2024-01-14T17:00:00"),
        status: "error",
      },
      {
        id: "msg-004-12",
        content: "Oh, I forgot we need to create the addresses table first. Can we roll back?",
        role: "user",
        timestamp: new Date("2024-01-14T17:05:00"),
      },
      {
        id: "msg-004-13",
        content:
          "✅ No changes were applied to the database due to the error. The migration was automatically rolled back.\n✅ The database is in its original state.\n📋 Would you like me to help create the addresses table first?",
        role: "system",
        timestamp: new Date("2024-01-14T17:10:00"),
        status: "success",
      },
    ],
  },
  "conv-005": {
    id: "conv-005",
    title: "Scale Service - notification-worker",
    createdAt: new Date("2024-01-14T14:30:00"),
    lastActivity: new Date("2024-01-14T14:35:00"),
    messageCount: 6,
    status: "completed",
    summary: "Scaled notification worker service from 3 to 8 replicas",
    messages: [
      {
        id: "msg-005-1",
        content:
          "We're seeing increased load on our notification system. Can you scale up the notification-worker service?",
        role: "user",
        timestamp: new Date("2024-01-14T14:30:00"),
      },
      {
        id: "msg-005-2",
        content: "I can help with that. How many replicas would you like to scale to?",
        role: "system",
        timestamp: new Date("2024-01-14T14:31:00"),
        status: "success",
      },
      {
        id: "msg-005-3",
        content: "scale-service notification-worker 8",
        role: "user",
        timestamp: new Date("2024-01-14T14:32:00"),
      },
      {
        id: "msg-005-4",
        content: "🔄 Scaling notification-worker service from 3 to 8 replicas...",
        role: "system",
        timestamp: new Date("2024-01-14T14:33:00"),
        status: "pending",
        metadata: {
          command: "scale-service notification-worker 8",
          ticketId: "TKT-005",
        },
      },
      {
        id: "msg-005-5",
        content:
          "✅ Service 'notification-worker' successfully scaled to 8 replicas.\n⏱️ Scale operation completed in 45 seconds.\n🔍 All instances passed health checks.",
        role: "system",
        timestamp: new Date("2024-01-14T14:35:00"),
        status: "success",
      },
    ],
  },
  "conv-006": {
    id: "conv-006",
    title: "SSL Certificate Renewal",
    createdAt: new Date("2024-01-14T11:00:00"),
    lastActivity: new Date("2024-01-14T11:20:00"),
    messageCount: 10,
    status: "completed",
    summary: "Renewed SSL certificates for api.company.com",
    messages: [
      {
        id: "msg-006-1",
        content: "We need to renew the SSL certificate for api.company.com",
        role: "user",
        timestamp: new Date("2024-01-14T11:00:00"),
      },
      {
        id: "msg-006-2",
        content: "renew-ssl-cert api.company.com",
        role: "user",
        timestamp: new Date("2024-01-14T11:01:00"),
      },
      {
        id: "msg-006-3",
        content:
          "I'll help you renew the SSL certificate for api.company.com.\n📋 Checking current certificate status...",
        role: "system",
        timestamp: new Date("2024-01-14T11:02:00"),
        status: "pending",
      },
      {
        id: "msg-006-4",
        content:
          "⚠️ Current certificate for api.company.com expires in 14 days (Jan 28, 2024).\n📋 Ticket #TKT-006 created for SSL certificate renewal.\n⚠️ This action requires approval from security team.",
        role: "system",
        timestamp: new Date("2024-01-14T11:05:00"),
        status: "pending",
        metadata: {
          command: "renew-ssl-cert api.company.com",
          ticketId: "TKT-006",
        },
      },
      {
        id: "msg-006-5",
        content: "✅ Renewal request approved by david.lee@company.com.\n🔄 Generating new certificate...",
        role: "system",
        timestamp: new Date("2024-01-14T11:10:00"),
        status: "pending",
      },
      {
        id: "msg-006-6",
        content: "✅ New certificate generated successfully.\n🔄 Installing certificate on load balancers...",
        role: "system",
        timestamp: new Date("2024-01-14T11:15:00"),
        status: "pending",
      },
      {
        id: "msg-006-7",
        content: "✅ Certificate installed successfully on all load balancers.\n🔍 Verifying certificate...",
        role: "system",
        timestamp: new Date("2024-01-14T11:18:00"),
        status: "pending",
      },
      {
        id: "msg-006-8",
        content:
          "✅ Certificate verification passed.\n✅ New certificate for api.company.com is valid until Jan 14, 2025 (1 year).\n🔒 TLS 1.2 and 1.3 supported with strong cipher suites.",
        role: "system",
        timestamp: new Date("2024-01-14T11:20:00"),
        status: "success",
      },
    ],
  },
}

export default function ConversationDetailPage({ params }: { params: { id: string } }) {
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // In a real app, you would fetch this data from an API
    const fetchConversation = async () => {
      setIsLoading(true)
      try {
        // Simulate API call delay
        await new Promise((resolve) => setTimeout(resolve, 500))

        const conversationData = mockConversations[params.id]
        if (conversationData) {
          setConversation(conversationData)
        }
      } catch (error) {
        console.error("Error fetching conversation:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchConversation()
  }, [params.id])

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

  const getConversationStatusBadge = (status: string) => {
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

  return (
    <AppLayout>
      <div className="flex-1 flex flex-col h-full">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Button variant="ghost" size="sm" onClick={() => router.push("/conversations")} className="mr-2">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <MessageSquare className="h-6 w-6 text-blue-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">
                {isLoading ? "Loading conversation..." : conversation?.title || "Conversation Not Found"}
              </h1>
            </div>
            {conversation && (
              <div className="flex items-center space-x-3">
                {getConversationStatusBadge(conversation.status)}
                <span className="text-sm text-gray-500">
                  {conversation.messageCount} messages • ID: {conversation.id}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Conversation Detail */}
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-500">Loading conversation...</p>
            </div>
          </div>
        ) : !conversation ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center">
              <XCircle className="h-12 w-12 text-red-500 mb-4" />
              <h2 className="text-xl font-medium text-gray-900 mb-2">Conversation Not Found</h2>
              <p className="text-gray-500 mb-4">
                The conversation you're looking for doesn't exist or has been deleted.
              </p>
              <Button onClick={() => router.push("/conversations")}>Back to Conversations</Button>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-4">
              {/* Conversation Summary */}
              <Card className="p-4 bg-blue-50 border-blue-200">
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Conversation Summary</h3>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-500">Created: {conversation.createdAt.toLocaleString()}</span>
                      <span className="text-sm text-gray-500">
                        Last activity: {conversation.lastActivity.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700">{conversation.summary}</p>
                </div>
              </Card>

              {/* Messages */}
              {conversation.messages.map((message) => (
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
                            className={`text-sm font-medium ${message.role === "user" ? "text-blue-700" : "text-gray-700"}`}
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
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
