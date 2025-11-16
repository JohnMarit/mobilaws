import React, { useState, useEffect } from 'react';
import { useAdmin, SupportTicket } from '../../contexts/AdminContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { RefreshCw, LifeBuoy, MessageSquare, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function SupportManagement() {
  const { getTickets, updateTicket } = useAdmin();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [ticketDialogOpen, setTicketDialogOpen] = useState(false);
  const [responseText, setResponseText] = useState('');

  useEffect(() => {
    console.log('🔍 SupportManagement mounted, loading tickets...');
    loadTickets();
  }, [currentPage, filterStatus]);

  const loadTickets = async () => {
    console.log('🔄 loadTickets called');
    setIsLoading(true);
    try {
      console.log('🔄 Loading support tickets...', { currentPage, filterStatus });
      const result = await getTickets(currentPage, filterStatus);
      console.log('✅ Support tickets result:', result);
      
      if (result) {
        setTickets(result.tickets || []);
        setTotalPages(result.pagination?.totalPages || 1);
        setStats(result.stats || null);
        console.log('✅ Tickets state updated:', result.tickets?.length || 0, 'tickets');
      } else {
        console.warn('⚠️ No result from getTickets');
        setTickets([]);
      }
    } catch (error) {
      console.error('❌ Error loading support tickets:', error);
      toast.error('Failed to load support tickets');
      setTickets([]);
    } finally {
      setIsLoading(false);
      console.log('✅ loadTickets complete, isLoading set to false');
    }
  };

  const handleViewTicket = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setResponseText('');
    setTicketDialogOpen(true);
  };

  const handleUpdateStatus = async (status: string) => {
    if (!selectedTicket) return;

    const success = await updateTicket(selectedTicket.id, { status });
    if (success) {
      toast.success('Ticket status updated');
      setSelectedTicket({ ...selectedTicket, status: status as any });
      loadTickets();
    } else {
      toast.error('Failed to update ticket status');
    }
  };

  const handleSendResponse = async () => {
    if (!selectedTicket || !responseText.trim()) return;

    const success = await updateTicket(selectedTicket.id, { 
      response: responseText,
      status: 'in_progress'
    });
    
    if (success) {
      toast.success('Response sent successfully');
      setResponseText('');
      loadTickets();
      setTicketDialogOpen(false);
    } else {
      toast.error('Failed to send response');
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge className="bg-red-500">Urgent</Badge>;
      case 'high':
        return <Badge className="bg-orange-500">High</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500">Medium</Badge>;
      case 'low':
        return <Badge className="bg-blue-500">Low</Badge>;
      default:
        return <Badge>{priority}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge className="bg-blue-500">Open</Badge>;
      case 'in_progress':
        return <Badge className="bg-yellow-500">In Progress</Badge>;
      case 'resolved':
        return <Badge className="bg-green-500">Resolved</Badge>;
      case 'closed':
        return <Badge className="bg-gray-500">Closed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Open Tickets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.open}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                In Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {stats.inProgress}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Resolved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.resolved}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.total}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Support Tickets</CardTitle>
          <CardDescription>
            Manage user support requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <Select value={filterStatus || "all_status"} onValueChange={(value) => {
              setFilterStatus(value === "all_status" ? "" : value);
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_status">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={loadTickets}
              disabled={isLoading}
              className="ml-auto"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Tickets Table */}
          {isLoading ? (
            <div className="text-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-gray-600">Loading tickets...</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-12">
              <LifeBuoy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No tickets found</p>
            </div>
          ) : (
            <>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ticket ID</TableHead>
                      <TableHead>User ID</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tickets.map((ticket) => (
                      <TableRow key={ticket.id}>
                        <TableCell className="font-mono text-sm">
                          {ticket.id.substring(0, 16)}...
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {ticket.userId.substring(0, 12)}...
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {ticket.subject}
                        </TableCell>
                        <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                        <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                        <TableCell>
                          {new Date(ticket.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewTicket(ticket)}
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Ticket Detail Dialog */}
      <Dialog open={ticketDialogOpen} onOpenChange={setTicketDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Ticket Details
            </DialogTitle>
            <DialogDescription>
              View and respond to support ticket
            </DialogDescription>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-4">
              {/* Ticket Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Ticket ID</p>
                  <p className="font-mono text-sm">{selectedTicket.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">User ID</p>
                  <p className="font-mono text-sm">{selectedTicket.userId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Priority</p>
                  {getPriorityBadge(selectedTicket.priority)}
                </div>
                <div>
                  <p className="text-sm text-gray-600">Category</p>
                  <Badge variant="outline">{selectedTicket.category}</Badge>
                </div>
              </div>

              {/* Subject and Message */}
              <div>
                <p className="text-sm text-gray-600 mb-1">Subject</p>
                <p className="font-semibold">{selectedTicket.subject}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600 mb-1">Message</p>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm">{selectedTicket.message}</p>
                </div>
              </div>

              {/* Previous Responses */}
              {selectedTicket.responses && selectedTicket.responses.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Previous Responses</p>
                  <div className="space-y-2">
                    {selectedTicket.responses.map((response, index) => (
                      <div key={index} className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm">{response.message}</p>
                        <p className="text-xs text-gray-600 mt-1">
                          {new Date(response.createdAt).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Status Update */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUpdateStatus('in_progress')}
                  disabled={selectedTicket.status === 'in_progress'}
                >
                  Mark In Progress
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUpdateStatus('resolved')}
                  disabled={selectedTicket.status === 'resolved'}
                >
                  Mark Resolved
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUpdateStatus('closed')}
                  disabled={selectedTicket.status === 'closed'}
                >
                  Close Ticket
                </Button>
              </div>

              {/* Response Form */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Send Response</p>
                <Textarea
                  placeholder="Type your response here..."
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  rows={4}
                />
                <Button 
                  onClick={handleSendResponse}
                  disabled={!responseText.trim()}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Send Response
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
