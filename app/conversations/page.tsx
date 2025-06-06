"use client"

import { useState } from "react"
import AppLayout from "@/components/app-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MessageSquare, Search, Calendar, Clock, ChevronRight, Filter } from "lucide-react"
import Link from "next/link"

interface Conversation {
  id: string
  title: string
  createdAt: Date
  lastActivity: Date
  messageCount: number
  status: "active" | "completed" | "error"
  summary: string
}

const mockConversations: Conversation[] = [
  {
    id: "conv-001",
    title: "Kafka Topic Creation - prod-events",
    createdAt: new Date("2024-01-15T10:30:00"),
    lastActivity: new Date("2024-01-15T10:45:00"),
    messageCount: 8,
    status: "completed",
    summary: "Successfully created Kafka topic for production events processing",
  },
  {
    id: "conv-002",
    title: "Service Restart - payment-api",
    createdAt: new Date("2024-01-15T09:15:00"),
    lastActivity: new Date("2024-01-15T09:30:00"),
    messageCount: 12,
    status: "completed",
    summary: "Restarted payment API service after memory leak detection",
  },
  {
    id: "conv-003",
    title: "App Deployment - user-dashboard v2.1.0",
    createdAt: new Date("2024-01-15T08:00:00"),
    lastActivity: new Date("2024-01-15T08:45:00"),
    messageCount: 15,
    status: "active",
    summary: "Ongoing deployment of user dashboard to staging environment",
  },
  {
    id: "conv-004",
    title: "Database Migration - user_profiles",
    createdAt: new Date("2024-01-14T16:20:00"),
    lastActivity: new Date("2024-01-14T17:10:00"),
    messageCount: 20,
    status: "error",
    summary: "Database migration failed due to constraint violations",
  },
  {
    id: "conv-005",
    title: "Scale Service - notification-worker",
    createdAt: new Date("2024-01-14T14:30:00"),
    lastActivity: new Date("2024-01-14T14:35:00"),
    messageCount: 6,
    status: "completed",
    summary: "Scaled notification worker service from 3 to 8 replicas",
  },
  {
    id: "conv-006",
    title: "SSL Certificate Renewal",
    createdAt: new Date("2024-01-14T11:00:00"),
    lastActivity: new Date("2024-01-14T11:20:00"),
    messageCount: 10,
    status: "completed",
    summary: "Renewed SSL certificates for api.company.com",
  },
]

export default function ConversationsPage() {
  const [conversations] = useState<Conversation[]>(mockConversations)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const itemsPerPage = 5

  const filteredConversations = conversations.filter((conv) => {
    const matchesSearch =
      conv.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.summary.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || conv.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalPages = Math.ceil(filteredConversations.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedConversations = filteredConversations.slice(startIndex, startIndex + itemsPerPage)

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

  const formatDate = (date: Date) => {
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <AppLayout>
      <div className="flex-1 flex flex-col h-full">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <MessageSquare className="h-6 w-6 text-blue-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">Conversations</h1>
            </div>
            <div className="text-sm text-gray-500">{filteredConversations.length} conversations</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="error">Error</option>
              </select>
            </div>
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <div className="space-y-4">
              {paginatedConversations.map((conversation) => (
                <Link key={conversation.id} href={`/conversations/${conversation.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-medium text-gray-900">{conversation.title}</h3>
                            {getStatusBadge(conversation.status)}
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{conversation.summary}</p>
                          <div className="flex items-center space-x-6 text-xs text-gray-500">
                            <div className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              Created: {formatDate(conversation.createdAt)}
                            </div>
                            <div className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              Last activity: {formatDate(conversation.lastActivity)}
                            </div>
                            <div className="flex items-center">
                              <MessageSquare className="h-3 w-3 mr-1" />
                              {conversation.messageCount} messages
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <span className="text-xs text-gray-400 mr-2">ID: {conversation.id}</span>
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-500">
                  Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredConversations.length)} of{" "}
                  {filteredConversations.length} conversations
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
