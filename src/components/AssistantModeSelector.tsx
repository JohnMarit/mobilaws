import { useState, useEffect } from 'react';
import { User, GraduationCap, Briefcase, ShoppingCart, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/FirebaseAuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

type AssistantMode = 'student' | 'lawyer' | 'consumer' | null;

interface AssistantModeSelectorProps {
  /** Called after a successful save; use to switch to chat + open Learning Hub */
  onSavedGoToStudy?: () => void;
  /** Called after any successful save (e.g. close profile dialog) */
  onSaved?: () => void;
  /** Compact layout for use inside a modal */
  embedded?: boolean;
}

export default function AssistantModeSelector({
  onSavedGoToStudy,
  onSaved,
  embedded = false,
}: AssistantModeSelectorProps) {
  const [selectedMode, setSelectedMode] = useState<AssistantMode>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const loadUserMode = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      if (!db) {
        console.warn('Firestore not initialized; cannot load assistant mode');
        setIsLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.id));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setSelectedMode(userData.assistantMode || null);
        }
      } catch (error) {
        console.error('Error loading assistant mode:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserMode();
  }, [user]);

  const handleSave = async () => {
    if (!user) {
      toast({
        title: 'Login required',
        description: 'Please log in to save your assistant mode preference.',
        variant: 'destructive',
      });
      return;
    }

    if (!db) {
      toast({
        title: 'Database unavailable',
        description: 'Firebase is not configured. Check your environment variables.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      await setDoc(
        doc(db, 'users', user.id),
        { assistantMode: selectedMode },
        { merge: true }
      );

      toast({
        title: 'Mode saved',
        description: onSavedGoToStudy
          ? 'Opening your study space…'
          : 'Your assistant mode preference has been saved.',
      });
      onSavedGoToStudy?.();
      onSaved?.();
    } catch (error) {
      console.error('Error saving assistant mode:', error);
      toast({
        title: 'Save failed',
        description: 'Failed to save your preference. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const modes = [
    {
      value: 'student',
      label: 'Student Mode',
      icon: GraduationCap,
      description: 'Tailored for law students. Provides educational explanations, case studies, and learning-focused responses about South Sudan law.',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      value: 'lawyer',
      label: 'Lawyer Mode',
      icon: Briefcase,
      description: 'Professional mode for practicing lawyers. Provides concise, technical legal information, precedents, and practical guidance for South Sudan legal practice.',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      value: 'consumer',
      label: 'Consumer Mode',
      icon: ShoppingCart,
      description: 'Simplified mode for general users. Provides easy-to-understand explanations of South Sudan laws, rights, and legal processes in plain language.',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
  ];

  if (isLoading) {
    return (
      <div
        className={
          embedded
            ? 'flex min-h-[120px] items-center justify-center bg-mobilaws-hero rounded-lg'
            : 'h-full flex items-center justify-center bg-mobilaws-hero'
        }
      >
        <div className="text-center">
          <p className="text-muted-foreground font-medium">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={
        embedded
          ? 'flex max-h-[min(85vh,720px)] flex-col bg-mobilaws-hero rounded-lg'
          : 'h-full flex flex-col bg-mobilaws-hero'
      }
    >
      <div className={embedded ? 'flex-1 overflow-y-auto p-4 pb-6 sm:p-6' : 'flex-1 overflow-auto p-6 pb-10'}>
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">
              <span className="text-gradient-brand">Assistant</span>{' '}
              <span className="text-slate-900">mode</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl">
              Personalize your AI assistant to match your needs. Choose a mode that best fits how you&apos;ll use the platform.
            </p>
          </div>

          <Card className="border-primary/10 shadow-elevated rounded-2xl bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Select Your Assistant Mode</CardTitle>
              <CardDescription>
                Your choice will customize how the AI responds to your questions about South Sudan law
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={selectedMode || ''} onValueChange={(value) => setSelectedMode(value as AssistantMode)}>
                <div className="space-y-4">
                  {modes.map((mode) => {
                    const Icon = mode.icon;
                    return (
                      <div key={mode.value} className="flex items-start space-x-3">
                        <RadioGroupItem value={mode.value} id={mode.value} className="mt-1" />
                        <Label
                          htmlFor={mode.value}
                          className={`flex-1 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                            selectedMode === mode.value
                              ? `${mode.bgColor} border-current ${mode.color} shadow-sm`
                              : 'bg-white/80 border-primary/10 hover:border-primary/25 hover:bg-white'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <Icon className={`h-6 w-6 flex-shrink-0 ${selectedMode === mode.value ? mode.color : 'text-gray-400'}`} />
                            <div className="flex-1">
                              <div className={`font-semibold mb-1 ${selectedMode === mode.value ? mode.color : 'text-gray-900'}`}>
                                {mode.label}
                              </div>
                              <div className="text-sm text-gray-600">
                                {mode.description}
                              </div>
                            </div>
                          </div>
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </RadioGroup>

              <div className="mt-6 pt-6 border-t border-primary/10">
                <Button
                  onClick={handleSave}
                  disabled={isSaving || !selectedMode}
                  className="w-full h-12 rounded-xl font-semibold bg-brand-gradient text-primary-foreground shadow-elevated hover:opacity-[0.97] disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Save className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Mode Preference
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {selectedMode && (
            <Card className="border-primary/15 bg-brand-gradient-soft backdrop-blur-sm rounded-2xl shadow-elevated">
              <CardHeader>
                <CardTitle className="text-slate-900">Mode selected</CardTitle>
                <CardDescription className="text-slate-600">
                  Your assistant will now respond in {modes.find(m => m.value === selectedMode)?.label.toLowerCase()}. 
                  This preference will be applied to all your future conversations.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
