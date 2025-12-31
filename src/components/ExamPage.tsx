import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Award, Trophy, Lock, CheckCircle2, Clock, Target } from 'lucide-react';
import { certificationExams, getExamQuestionsFromFirestore, type Certificate } from '@/lib/examContent';
import { useLearning } from '@/contexts/LearningContext';
import ExamRunner from './ExamRunner';

interface ExamPageProps {
    onCertificateEarned?: (certificate: Certificate) => void;
}

export default function ExamPage({ onCertificateEarned }: ExamPageProps) {
    const { tier } = useLearning();
    const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
    const [examQuestions, setExamQuestions] = useState<any[]>([]);
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);

    const handleStartExam = async (examId: string) => {
        setIsLoadingQuestions(true);
        try {
            // Fetch questions from Firestore (tutor-uploaded modules)
            const questions = await getExamQuestionsFromFirestore(examId, tier);
            
            if (questions.length === 0) {
                alert('No exam questions available yet. Please contact your tutor admin to upload course content.');
                setIsLoadingQuestions(false);
                return;
            }
            
            setExamQuestions(questions);
            setSelectedExamId(examId);
        } catch (error) {
            console.error('Failed to load exam questions:', error);
            alert('Failed to load exam questions. Please try again.');
        } finally {
            setIsLoadingQuestions(false);
        }
    };

    const handleExamComplete = (certificate: Certificate | null) => {
        if (certificate) {
            setCertificates(prev => [...prev, certificate]);
            if (onCertificateEarned) {
                onCertificateEarned(certificate);
            }
        }
        setSelectedExamId(null);
        setExamQuestions([]);
    };

    const selectedExam = certificationExams.find(e => e.id === selectedExamId);
    const hasCertificate = (examId: string) => certificates.some(c => c.examId === examId);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="space-y-2">
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <Trophy className="h-8 w-8 text-yellow-500" />
                    Certification Exams
                </h1>
                <p className="text-muted-foreground">
                    Earn certificates by demonstrating your legal knowledge
                </p>
            </div>

            {/* Earned Certificates */}
            {certificates.length > 0 && (
                <Alert className="border-green-500 bg-green-50">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <AlertDescription className="ml-2">
                        <p className="font-semibold text-green-900">
                            You have earned {certificates.length} certificate{certificates.length !== 1 ? 's' : ''}!
                        </p>
                    </AlertDescription>
                </Alert>
            )}

            {/* Available Exams */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {certificationExams.map((exam) => {
                    const isLocked = tier === 'free' && exam.requiredTier !== 'free';
                    const hasCert = hasCertificate(exam.id);

                    return (
                        <Card
                            key={exam.id}
                            className={`relative ${isLocked ? 'opacity-60' : ''} ${hasCert ? 'border-green-500' : ''}`}
                        >
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="text-4xl">{exam.badge}</div>
                                    {hasCert && (
                                        <Badge variant="default" className="bg-green-500">
                                            <CheckCircle2 className="h-3 w-3 mr-1" />
                                            Earned
                                        </Badge>
                                    )}
                                    {isLocked && (
                                        <Badge variant="secondary">
                                            <Lock className="h-3 w-3 mr-1" />
                                            Locked
                                        </Badge>
                                    )}
                                </div>
                                <CardTitle className="text-xl">{exam.title}</CardTitle>
                                <CardDescription>{exam.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Exam Details */}
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Target className="h-4 w-4" />
                                        <span>{exam.questionCount} questions</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Award className="h-4 w-4" />
                                        <span>Pass mark: {exam.passMark}%</span>
                                    </div>
                                    {exam.timeLimit && (
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Clock className="h-4 w-4" />
                                            <span>{exam.timeLimit} minutes</span>
                                        </div>
                                    )}
                                </div>

                                {/* Action Button */}
                                {isLocked ? (
                                    <Button variant="outline" className="w-full" disabled>
                                        <Lock className="h-4 w-4 mr-2" />
                                        Upgrade to {exam.requiredTier}
                                    </Button>
                                ) : hasCert ? (
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => handleStartExam(exam.id)}
                                        disabled={isLoadingQuestions}
                                    >
                                        {isLoadingQuestions ? 'Loading...' : 'Retake Exam'}
                                    </Button>
                                ) : (
                                    <Button
                                        className="w-full"
                                        style={{ backgroundColor: exam.color }}
                                        onClick={() => handleStartExam(exam.id)}
                                        disabled={isLoadingQuestions}
                                    >
                                        <Award className="h-4 w-4 mr-2" />
                                        {isLoadingQuestions ? 'Loading...' : 'Start Exam'}
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Exam Runner Dialog */}
            {selectedExam && examQuestions.length > 0 && (
                <ExamRunner
                    open={!!selectedExamId}
                    onClose={() => setSelectedExamId(null)}
                    examId={selectedExam.id}
                    examTitle={selectedExam.title}
                    questions={examQuestions}
                    onComplete={handleExamComplete}
                />
            )}
        </div>
    );
}
