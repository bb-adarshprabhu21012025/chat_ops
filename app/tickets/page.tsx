"use client"

import { useState } from "react"
import AppLayout from "@/components/app-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Ticket, Search, Filter, Edit, Calendar, User, AlertTriangle, CheckCircle, Clock, XCircle } from "lucide-react"

interface TicketItem {
  id: string
  summary: string
  description: string
  status: "pending" | "approved" | "rejected" | "completed"
  priority: "low" | "medium" | "high"
  createdAt: Date
  updatedAt: Date
  assignee: string
  conversationId: string
  command: string
}

const mockTickets: TicketItem[] = [
  {
    id: "TKT-001",
    summary: "Create Kafka topic: prod-events",
    description: "Create new Kafka topic for production event streaming with 6 partitions and replication factor 3",
    status: "completed",
    priority: "high",
    createdAt: new Date("2024-01-15T10:30:00"),
    updatedAt: new Date("2024-01-15T10:45:00"),
    assignee: "john.doe",
    conversationId: "conv-001",
    command: "create-kafka-topic prod-events prod-cluster",
  },
  {
    id: "TKT-002",
    summary: "Restart payment-api service",
    description: "Restart payment API service due to memory leak detection and performance degradation",
    status: "approved",
    priority: "high",
    createdAt: new Date("2024-01-15T09:15:00"),
    updatedAt: new Date("2024-01-15T09:25:00"),
    assignee: "jane.smith",
    conversationId: "conv-002",
    command: "restart-service payment-api",
  },
  {
    id: "TKT-003",
    summary: "Deploy user-dashboard v2.1.0",
    description: "Deploy new version of user dashboard with enhanced analytics and bug fixes",
    status: "pending",
    priority: "medium",
    createdAt: new Date("2024-01-15T08:00:00"),
    updatedAt: new Date("2024-01-15T08:00:00"),
    assignee: "mike.wilson",
    conversationId: "conv-003",
    command: "deploy-app user-dashboard staging",
  },
  {
    id: "TKT-004",
    summary: "Database migration: user_profiles",
    description: "Execute database migration for user profiles table schema changes",
    status: "rejected",
    priority: "medium",
    createdAt: new Date("2024-01-14T16:20:00"),
    updatedAt: new Date("2024-01-14T16:45:00"),
    assignee: "sarah.johnson",
    conversationId: "conv-004",
    command: "migrate-database user_profiles",
  },
  {
    id: "TKT-005",
    summary: "Scale notification-worker service",
    description: "Scale notification worker service from 3 to 8 replicas to handle increased load",
    status: "completed",
    priority: "low",
    createdAt: new Date("2024-01-14T14:30:00"),
    updatedAt: new Date("2024-01-14T14:35:00"),
    assignee: "alex.brown",
    conversationId: "conv-005",
    command: "scale-service notification-worker 8",
  },
  {
    id: "TKT-006",
    summary: "SSL Certificate Renewal",
    description: "Renew SSL certificates for api.company.com before expiration",
    status: "pending",
    priority: "high",
    createdAt: new Date("2024-01-14T11:00:00"),
    updatedAt: new Date("2024-01-14T11:00:00"),
    assignee: "david.lee",
    conversationId: "conv-006",
    command: "renew-ssl-cert api.company.com",
  },
]

export default function TicketsPage() {
  const [tickets, setTickets] = useState<TicketItem[]>(mockTickets)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  const [selectedTicket, setSelectedTicket] = useState<TicketItem | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter
    const matchesPriority = priorityFilter === "all" || ticket.priority === priorityFilter
    return matchesSearch && matchesStatus && matchesPriority
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        )
      case "approved":
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        )
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return (
          <Badge variant="destructive">
            <AlertTriangle className="h-3 w-3 mr-1" />
            High
          </Badge>
        )
      case "medium":
        return (
          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
            Medium
          </Badge>
        )
      case "low":
        return <Badge variant="outline">Low</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const handlePriorityChange = (ticketId: string, newPriority: "low" | "medium" | "high") => {
    setTickets((prev) =>
      prev.map((ticket) =>
        ticket.id === ticketId ? { ...ticket, priority: newPriority, updatedAt: new Date() } : ticket,
      ),
    )
    setIsEditDialogOpen(false)
    setSelectedTicket(null)
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
              <Ticket className="h-6 w-6 text-blue-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">Tickets</h1>
            </div>
            <div className="text-sm text-gray-500">{filteredTickets.length} tickets</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search tickets..."
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
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="completed">Completed</option>
              </select>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">All Priority</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tickets List */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <div className="space-y-4">
              {filteredTickets.map((ticket) => (
                <Card key={ticket.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-medium text-gray-900">{ticket.summary}</h3>
                          {getStatusBadge(ticket.status)}
                          {getPriorityBadge(ticket.priority)}
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{ticket.description}</p>
                        <div className="flex items-center space-x-6 text-xs text-gray-500 mb-2">
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            Created: {formatDate(ticket.createdAt)}
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            Updated: {formatDate(ticket.updatedAt)}
                          </div>
                          <div className="flex items-center">
                            <User className="h-3 w-3 mr-1" />
                            Assignee: {ticket.assignee}
                          </div>
                        </div>
                        <div className="text-xs text-gray-400 font-mono bg-gray-50 p-2 rounded">
                          Command: {ticket.command}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-400">{ticket.id}</span>
                        <Dialog
                          open={isEditDialogOpen && selectedTicket?.id === ticket.id}
                          onOpenChange={setIsEditDialogOpen}
                        >
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setSelectedTicket(ticket)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit Ticket Priority</DialogTitle>
                              <DialogDescription>Change the priority level for ticket {ticket.id}</DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                              <Select
                                defaultValue={ticket.priority}
                                onValueChange={(value: "low" | "medium" | "high") =>
                                  handlePriorityChange(ticket.id, value)
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="low">Low Priority</SelectItem>
                                  <SelectItem value="medium">Medium Priority</SelectItem>
                                  <SelectItem value="high">High Priority</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                                Cancel
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
