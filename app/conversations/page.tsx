"use client"

import { useState, useEffect } from "react"
import AppLayout from "@/components/app-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  MessageSquare,
  Search,
  Calendar,
  Clock,
  ChevronRight,
  Filter,
  Loader2,
  RefreshCw,
  AlertCircle,
} from "lucide-react"
import Link from "next/link"

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://hqa-svc.bigbasket.com/jira/api/v1"

interface APIResponse {
  success: boolean
  message: string
  data: ConversationData[]
}

interface ConversationData {
  conversation_id: number
  email_id: string
  jira_id: string
  status_of_jira: string
  priority: string
  jenkins_job_id: number
  conversation: {
    topic: string
    summary: string
    conversation?: { content: string }[]
  }
  status_of_conversation: string
  template_id: number
  em_approval_status: boolean
  elt_approval_status: boolean
  data_approval_status: boolean
  security_approval_status: boolean
  all_approval_final_status: boolean
}

interface Conversation {
  id: string
  title: string
  createdAt: Date
  lastActivity: Date
  messageCount: number
  status: "active" | "completed" | "error"
  summary: string
  priority: string
  jiraId?: string
  emailId: string
  module?: string
  parameters: any
}

// Helper to render parameters as nested bullet list
function renderParameters(obj: any, level = 0): React.ReactNode {
  if (typeof obj !== "object" || obj === null) {
    return <span>{String(obj)}</span>
  }
  return (
    <ul style={{ paddingLeft: level * 16 }} className="list-disc list-inside text-sm text-gray-700">
      {Object.entries(obj).map(([key, value]) => (
        <li key={key}>
          <strong>{key}:</strong>{" "}
          {typeof value === "object" && value !== null ? renderParameters(value, level + 1) : String(value)}
        </li>
      ))}
    </ul>
  )
}

// Transform API data to internal Conversation object
const transformConversationData = (data: ConversationData): Conversation => {
  if (!data || !data.conversation) {
    throw new Error('Invalid conversation data')
  }
  
  return {
    id: data.conversation_id.toString(),
    title: data.jira_id || 'No JIRA',
    createdAt: new Date(), // API doesn't provide dates
    lastActivity: new Date(),
    messageCount: data.conversation.conversation?.length || 0,
    status: (data.status_of_conversation || 'active').toLowerCase() as "active" | "completed" | "error",
    summary: '',
    priority: data.priority || 'Low',
    jiraId: data.jira_id,
    emailId: data.email_id,
    module: '',
    parameters: {
      jenkinsJobId: data.jenkins_job_id,
      jiraStatus: data.status_of_jira,
      approvals: {
        em: data.em_approval_status,
        elt: data.elt_approval_status,
        data: data.data_approval_status,
        security: data.security_approval_status,
        final: data.all_approval_final_status
      }
    }
  }
}

// Fetch conversations from API
const fetchConversations = async (params?: { email_id?: string; conversation_id?: string }): Promise<Conversation[]> => {
  try {
    let url = `${API_BASE_URL}/conversations`
    
    // Add query parameters if provided
    if (params) {
      const queryParams = new URLSearchParams()
      if (params.email_id) queryParams.append('email_id', params.email_id)
      if (params.conversation_id) queryParams.append('conversation_id', params.conversation_id)
      
      const queryString = queryParams.toString()
      if (queryString) {
        url += `?${queryString}`
      }
    }

    const response = await fetch(url)
    if (!response.ok) throw new Error('Failed to fetch conversations')
    const data: ConversationData[] = await response.json()
    return data.map(transformConversationData)
  } catch (error) {
    console.error('Error fetching conversations:', error)
    throw error
  }
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [refreshing, setRefreshing] = useState(false)

  const itemsPerPage = 5

  useEffect(() => {
    if (typeof window !== "undefined") {
      loadConversations()
    }
  }, [])
  const storedUser = localStorage.getItem("chatops-user")
  const email = storedUser ? JSON.parse(storedUser).email : "adarsh.b@bigbasket.com"

  const loadConversations = async () => {
    try {
      setError(null)
      setLoading(true)


      const conversationsData = await fetchConversations({ email_id: email })
      setConversations(conversationsData)
      console.log(conversationsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load conversations")
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      const conversationsData = await fetchConversations({ email_id: email })
      setConversations(conversationsData)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to refresh conversations")
    } finally {
      setRefreshing(false)
    }
  }

  const filteredConversations = conversations.filter((conv) => {
    const matchesSearch =
      conv.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.emailId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (conv.jiraId && conv.jiraId.toLowerCase().includes(searchTerm.toLowerCase()))
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

  const formatDate = (date: Date) => {
    return (
      date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    )
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading conversations...</p>
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
            <div className="flex items-center">
              <MessageSquare className="h-6 w-6 text-blue-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">Conversations</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">{filteredConversations.length} conversations</div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center space-x-2"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="px-6 py-4 bg-red-50 border-b border-red-200">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error}
                <Button variant="outline" size="sm" onClick={handleRefresh} className="ml-2">
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search conversations, emails, or JIRA IDs..."
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
            {paginatedConversations.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No conversations found</h3>
                <p className="text-gray-500">
                  {searchTerm || statusFilter !== "all"
                    ? "Try adjusting your search or filter criteria"
                    : "No conversations available"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {paginatedConversations.map((conversation) => (
                  <Card key={conversation.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                              {conversation.jiraId || 'No JIRA'}
                            </span>
                            {getStatusBadge(conversation.status)}
                            {getPriorityBadge(conversation.priority)}
                          </div>

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
                          <div className="mt-2 text-xs text-gray-400">
                            Email: {conversation.emailId}
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {conversation.parameters.approvals.em && (
                              <Badge variant="outline" className="bg-blue-50">EM Approved</Badge>
                            )}
                            {conversation.parameters.approvals.elt && (
                              <Badge variant="outline" className="bg-green-50">ELT Approved</Badge>
                            )}
                            {conversation.parameters.approvals.data && (
                              <Badge variant="outline" className="bg-purple-50">Data Approved</Badge>
                            )}
                            {conversation.parameters.approvals.security && (
                              <Badge variant="outline" className="bg-red-50">Security Approved</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center">
                          <Link href={`/conversations/${conversation.id}`} onClick={() => {
                            localStorage.setItem('current-conversation-id', conversation.id);
                          }}>
                            <Button variant="ghost" size="sm" className="flex items-center space-x-1">
                              <span className="text-xs text-gray-400">View</span>
                              <ChevronRight className="h-4 w-4 text-gray-400" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

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
