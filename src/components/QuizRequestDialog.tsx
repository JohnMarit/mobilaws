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
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Sparkles, Send } from 'lucide-react';
import { toast } from 'sonner';
import { getApiUrl } from '@/lib/api';
import { useAuth } from '@/contexts/FirebaseAuthContext';

interface QuizRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  moduleId: string;
  moduleName: string;
  lessonId?: string;
  lessonName?: string;
}

export default function QuizRequestDialog({
  open,
  onOpenChange,
  moduleId,
  moduleName,
  lessonId,
  lessonName,
}: QuizRequestDialogProps) {
  const { user } = useAuth();
  const [numberOfQuizzes, setNumberOfQuizzes] = useState(5);
  const [difficulty, setDifficulty] = useState('medium');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Please sign in to request quizzes');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(getApiUrl('learning/quiz-request'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          userName: user.name || 'User',
          userEmail: user.email || '',
          moduleId,
          lessonId,
          message: message || `Please create ${numberOfQuizzes} ${difficulty} quizzes for this content.`,
          numberOfQuizzes,
          difficulty,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('✅ Quiz request submitted!', {
          description: 'Our tutors will create additional quizzes for you soon.',
        });
        onOpenChange(false);
        setMessage('');
        setNumberOfQuizzes(5);
        setDifficulty('medium');
      } else {
        toast.error('Failed to submit request: ' + data.error);
      }
    } catch (error) {
      console.error('Error submitting quiz request:', error);
      toast.error('Failed to submit request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Request More Quizzes
          </DialogTitle>
          <DialogDescription>
            Ask tutors to create additional practice quizzes for{' '}
            <span className="font-semibold">{lessonName || moduleName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Number of Quizzes */}
          <div className="space-y-3">
            <Label>Number of Quizzes: {numberOfQuizzes}</Label>
            <Slider
              value={[numberOfQuizzes]}
              onValueChange={(value) => setNumberOfQuizzes(value[0])}
              min={1}
              max={20}
              step={1}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Request between 1-20 additional quiz questions
            </p>
          </div>

          {/* Difficulty Level */}
          <div className="space-y-3">
            <Label>Difficulty Level</Label>
            <RadioGroup value={difficulty} onValueChange={setDifficulty}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="easy" id="easy" />
                <Label htmlFor="easy" className="font-normal cursor-pointer">
                  Easy - Basic concepts and definitions
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="medium" id="medium" />
                <Label htmlFor="medium" className="font-normal cursor-pointer">
                  Medium - Application and analysis
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="hard" id="hard" />
                <Label htmlFor="hard" className="font-normal cursor-pointer">
                  Hard - Complex scenarios and critical thinking
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Additional Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Additional Notes (Optional)</Label>
            <Textarea
              id="message"
              placeholder="Any specific topics or areas you'd like the quizzes to focus on?"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              <>
                <Send className="h-4 w-4 mr-2 animate-pulse" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Submit Request
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

