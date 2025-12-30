import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Send } from 'lucide-react';
import { toast } from 'sonner';
import { getApiUrl } from '@/lib/api';
import { useAuth } from '@/contexts/FirebaseAuthContext';

interface MessageTutorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  moduleId?: string;
  moduleName?: string;
  lessonId?: string;
  lessonName?: string;
}

export default function MessageTutorDialog({
  open,
  onOpenChange,
  moduleId,
  moduleName,
  lessonId,
  lessonName,
}: MessageTutorDialogProps) {
  const { user } = useAuth();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Please sign in to send messages');
      return;
    }

    if (!subject.trim() || !message.trim()) {
      toast.error('Please fill in both subject and message');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(getApiUrl('learning/message-tutor'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          userName: user.name || 'User',
          userEmail: user.email || '',
          subject,
          message,
          moduleId,
          lessonId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('✅ Message sent to tutor!', {
          description: 'You will receive a reply soon.',
        });
        onOpenChange(false);
        setSubject('');
        setMessage('');
      } else {
        toast.error('Failed to send message: ' + data.error);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-500" />
            Ask a Tutor
          </DialogTitle>
          <DialogDescription>
            Send a message to our expert tutors. They'll respond as soon as possible.
            {(moduleName || lessonName) && (
              <span className="block mt-1 text-sm">
                About: <span className="font-semibold">{lessonName || moduleName}</span>
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              placeholder="e.g., Question about Constitutional Rights"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground">
              Brief summary of your question or topic
            </p>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Your Question/Message *</Label>
            <Textarea
              id="message"
              placeholder="Type your question or message here...

You can ask about:
• Clarification on lesson content
• Real-world applications
• Additional resources
• Study tips and strategies
• Any other questions about the material"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={10}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Be as detailed as possible to help tutors provide the best answer
            </p>
          </div>

          {/* Quick Tips */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">💡 Tips for Better Responses</h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Be specific about what you're struggling with</li>
              <li>• Include examples if relevant</li>
              <li>• Mention if you've already tried something</li>
              <li>• Ask follow-up questions if needed</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={submitting || !subject.trim() || !message.trim()}
          >
            {submitting ? (
              <>
                <Send className="h-4 w-4 mr-2 animate-pulse" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Message
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

