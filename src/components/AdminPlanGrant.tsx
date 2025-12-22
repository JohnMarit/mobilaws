import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, Loader2, Gift } from 'lucide-react';

interface AdminPlanGrantProps {
  onGrantSuccess?: () => void;
}

export default function AdminPlanGrant({ onGrantSuccess }: AdminPlanGrantProps) {
  const [userEmail, setUserEmail] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'standard' | 'premium'>('basic');
  const [duration, setDuration] = useState('30'); // days
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleGrantPlan = async () => {
    if (!userEmail.trim()) {
      setResult({ success: false, message: 'Please enter a user email' });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/admin/grant-plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail: userEmail.trim(),
          planId: selectedPlan,
          durationDays: parseInt(duration)
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult({ success: true, message: data.message || 'Plan granted successfully!' });
        setUserEmail('');
        if (onGrantSuccess) onGrantSuccess();
      } else {
        setResult({ success: false, message: data.error || 'Failed to grant plan' });
      }
    } catch (error) {
      console.error('Error granting plan:', error);
      setResult({ success: false, message: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="touch-manipulation">
      <CardHeader className="pb-3 sm:pb-4 p-4 sm:p-6">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Gift className="h-5 w-5 text-primary" />
          Grant Learning Plan
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Grant Basic, Standard, or Premium learning access to users
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
        <div className="space-y-2">
          <Label htmlFor="userEmail" className="text-xs sm:text-sm">User Email</Label>
          <Input
            id="userEmail"
            type="email"
            placeholder="user@example.com"
            value={userEmail}
            onChange={(e) => setUserEmail(e.target.value)}
            disabled={loading}
            className="text-sm touch-manipulation"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="plan" className="text-xs sm:text-sm">Plan</Label>
          <Select value={selectedPlan} onValueChange={(value: any) => setSelectedPlan(value)} disabled={loading}>
            <SelectTrigger id="plan" className="text-sm touch-manipulation">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="basic">Basic - Intro + Basic lessons</SelectItem>
              <SelectItem value="standard">Standard - + Intermediate lessons</SelectItem>
              <SelectItem value="premium">Premium - Full access + guides</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="duration" className="text-xs sm:text-sm">Duration (days)</Label>
          <Input
            id="duration"
            type="number"
            min="1"
            max="365"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            disabled={loading}
            className="text-sm touch-manipulation"
          />
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            Common: 30 days (month), 90 days (quarter), 365 days (year)
          </p>
        </div>

        {result && (
          <Alert variant={result.success ? 'default' : 'destructive'} className="touch-manipulation">
            {result.success ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            <AlertDescription className="text-xs sm:text-sm">{result.message}</AlertDescription>
          </Alert>
        )}

        <Button
          onClick={handleGrantPlan}
          disabled={loading || !userEmail.trim()}
          className="w-full touch-manipulation text-sm h-9 sm:h-10"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Granting...
            </>
          ) : (
            <>
              <Gift className="mr-2 h-4 w-4" />
              Grant {selectedPlan.toUpperCase()} Plan
            </>
          )}
        </Button>

        <div className="pt-2 border-t">
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            <strong>What this does:</strong>
            <br />
            • Creates a subscription record for the user
            <br />
            • Grants immediate access to learning content
            <br />
            • Sets expiry date based on duration
            <br />
            • User can see their granted plan in their profile
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

