import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { RefreshCw, MessageSquare, Clock, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/FirebaseAuthContext';
import { getApiUrl } from '@/lib/api';

interface TicketResponse {
  message: string;
  from: string;
  createdAt: string;
}

interface Ticket {
  id: string;
  userId: string;
  subject: string;
  message: string;
  priority: string;
  category: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  createdAt: string;
  updatedAt: string;
  responses?: TicketResponse[];
}

interface MyTicketsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function MyTickets({ open, onOpenChange }: MyTicketsProps) {
  const { user, isAuthenticated } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  useEffect(() => {
    if (open && isAuthenticated && user) {
      loadTickets();
    }
  }, [open, isAuthenticated, user]);

  const loadTickets = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const response = await fetch(getApiUrl(`support/tickets/user/${user.id}`));
      
      if (!response.ok) {
        throw new Error('Failed to load tickets');
      }

      const data = await response.json();
      setTickets(data.tickets || []);
    } catch (error) {
      console.error('Error loading tickets:', error);
      toast.error('Failed to load support tickets');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setDetailDialogOpen(true);
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
        return (
          <Badge className="bg-blue-500">
            <Clock className="h-3 w-3 mr-1" />
            Open
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge className="bg-yellow-500">
            <RefreshCw className="h-3 w-3 mr-1" />
            In Progress
          </Badge>
        );
      case 'resolved':
        return (
          <Badge className="bg-green-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            Resolved
          </Badge>
        );
      case 'closed':
        return <Badge className="bg-gray-500">Closed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              My Support Tickets
            </DialogTitle>
            <DialogDescription>
              View your submitted support requests and responses from our team
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600">
                {tickets.length} {tickets.length === 1 ? 'ticket' : 'tickets'} total
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={loadTickets}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {isLoading ? (
              <div className="text-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                <p className="text-gray-600">Loading tickets...</p>
              </div>
            ) : tickets.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">No support tickets yet</p>
                <p className="text-sm text-gray-500">
                  Submit a support request to get help from our team
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {tickets.map((ticket) => (
                  <Card key={ticket.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base">{ticket.subject}</CardTitle>
                          <CardDescription className="text-sm mt-1">
                            {new Date(ticket.createdAt).toLocaleString()}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          {getPriorityBadge(ticket.priority)}
                          {getStatusBadge(ticket.status)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Badge variant="outline">{ticket.category}</Badge>
                          </span>
                          {ticket.responses && ticket.responses.length > 0 && (
                            <span className="flex items-center gap-1 text-green-600">
                              <MessageSquare className="h-4 w-4" />
                              {ticket.responses.length} {ticket.responses.length === 1 ? 'response' : 'responses'}
                            </span>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewTicket(ticket)}
                        >
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Ticket Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ticket Details</DialogTitle>
            <DialogDescription>
              View full ticket information and responses
            </DialogDescription>
          </DialogHeader>

          {selectedTicket && (
            <div className="space-y-4">
              {/* Status and Priority */}
              <div className="flex gap-2">
                {getStatusBadge(selectedTicket.status)}
                {getPriorityBadge(selectedTicket.priority)}
                <Badge variant="outline">{selectedTicket.category}</Badge>
              </div>

              {/* Ticket ID and Date */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Ticket ID</p>
                  <p className="font-mono text-xs">{selectedTicket.id}</p>
                </div>
                <div>
                  <p className="text-gray-600">Created</p>
                  <p>{new Date(selectedTicket.createdAt).toLocaleString()}</p>
                </div>
              </div>

              {/* Subject */}
              <div>
                <p className="text-sm text-gray-600 mb-1">Subject</p>
                <p className="font-semibold">{selectedTicket.subject}</p>
              </div>

              {/* Original Message */}
              <div>
                <p className="text-sm text-gray-600 mb-2">Your Message</p>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{selectedTicket.message}</p>
                </div>
              </div>

              {/* Responses from Admin */}
              {selectedTicket.responses && selectedTicket.responses.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 mb-2 font-semibold">
                    Responses from Support Team
                  </p>
                  <div className="space-y-2">
                    {selectedTicket.responses.map((response, index) => (
                      <div key={index} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm whitespace-pre-wrap mb-2">{response.message}</p>
                        <p className="text-xs text-gray-600">
                          {new Date(response.createdAt).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedTicket.status === 'open' && (!selectedTicket.responses || selectedTicket.responses.length === 0) && (
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-sm text-yellow-800">
                    ⏳ Your ticket is waiting for a response from our support team. We'll get back to you soon!
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

