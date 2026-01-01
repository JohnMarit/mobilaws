import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Award, Trophy, Lock, CheckCircle2, Clock, Target, Download } from 'lucide-react';
import { certificationExams, getExamQuestionsFromFirestore, type Certificate } from '@/lib/examContent';
import { useLearning } from '@/contexts/LearningContext';
import { useAuth } from '@/contexts/FirebaseAuthContext';
import { getUserCertificates, getUserExamAttempts, hasUserPassedExam } from '@/lib/examService';
import ExamRunner from './ExamRunner';
import CertificateGenerator from './CertificateGenerator';

interface ExamPageProps {
    onCertificateEarned?: (certificate: Certificate) => void;
}

export default function ExamPage({ onCertificateEarned }: ExamPageProps) {
    const { tier } = useLearning();
    const { user } = useAuth();
    const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
    const [examQuestions, setExamQuestions] = useState<any[]>([]);
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [examAttempts, setExamAttempts] = useState<any[]>([]);
    const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
    const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
    const [showCertificateDialog, setShowCertificateDialog] = useState(false);

    // Load certificates and exam attempts from Firebase on mount
    useEffect(() => {
        const loadExamData = async () => {
            if (!user?.id) return;
            try {
                const [userCerts, userAttempts] = await Promise.all([
                    getUserCertificates(user.id),
                    getUserExamAttempts(user.id)
                ]);
                setCertificates(userCerts);
                setExamAttempts(userAttempts);
            } catch (error) {
                console.error('Failed to load exam data:', error);
            }
        };
        loadExamData();
    }, [user?.id]);

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

    const handleExamComplete = async (certificate: Certificate | null) => {
        if (user?.id) {
            // Reload certificates and attempts from Firebase to ensure we have the latest
            try {
                const [userCerts, userAttempts] = await Promise.all([
                    getUserCertificates(user.id),
                    getUserExamAttempts(user.id)
                ]);
                setCertificates(userCerts);
                setExamAttempts(userAttempts);
                
                if (certificate && onCertificateEarned) {
                    onCertificateEarned(certificate);
                }
            } catch (error) {
                console.error('Failed to reload exam data:', error);
            }
        }
    };

    const handleViewCertificate = (certificate: Certificate) => {
        setSelectedCertificate(certificate);
        setShowCertificateDialog(true);
    };

    const selectedExam = certificationExams.find(e => e.id === selectedExamId);
    const hasCertificate = (examId: string) => certificates.some(c => c.examId === examId);
    
    // Check if user has failed attempts (no certificate but has attempts that didn't pass)
    const hasFailedAttempts = (examId: string) => {
        if (hasCertificate(examId)) return false; // If passed, no failed attempts
        const attempts = examAttempts.filter(a => a.examId === examId);
        return attempts.some(a => a.passed === false || (a.score && a.score < (certificationExams.find(e => e.id === examId)?.passMark || 70)));
    };
    
    // Check if exam is completed (has certificate)
    const isExamCompleted = (examId: string) => hasCertificate(examId);

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
                    // Access control based on tier
                    let isLocked = false;
                    let lockMessage = '';
                    
                    if (exam.requiredTier === 'free') {
                        // Basic exam: available to all users
                        isLocked = false;
                    } else if (exam.requiredTier === 'basic') {
                        // Standard exam: available to basic and standard users
                        isLocked = tier === 'free';
                        lockMessage = 'Upgrade to Basic or higher';
                    } else if (exam.requiredTier === 'premium') {
                        // Premium exam: available to premium users only
                        isLocked = tier !== 'premium';
                        lockMessage = 'Upgrade to Premium';
                    }
                    
                    const hasCert = hasCertificate(exam.id);
                    const isPremiumExam = exam.id === 'premium-cert';
                    const canRetake = isPremiumExam; // Only premium exam can be retaken

                    return (
                        <Card
                            key={exam.id}
                            className={`relative ${isLocked ? 'opacity-60' : ''} ${hasCert ? 'border-green-500' : ''}`}
                        >
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="text-4xl">{exam.badge}</div>
                                    {isExamCompleted(exam.id) && (
                                        <Badge variant="default" className="bg-green-500">
                                            <CheckCircle2 className="h-3 w-3 mr-1" />
                                            Completed
                                        </Badge>
                                    )}
                                    {hasFailedAttempts(exam.id) && !isExamCompleted(exam.id) && (
                                        <Badge variant="secondary" className="bg-orange-500 text-white">
                                            <Award className="h-3 w-3 mr-1" />
                                            Failed
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
                                        {lockMessage}
                                    </Button>
                                ) : isExamCompleted(exam.id) && !canRetake ? (
                                    // Exam passed and cannot be retaken (Basic & Standard)
                                    <Button
                                        variant="default"
                                        className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                                        onClick={() => {
                                            const cert = certificates.find(c => c.examId === exam.id);
                                            if (cert) handleViewCertificate(cert);
                                        }}
                                    >
                                        <CheckCircle2 className="h-4 w-4 mr-2" />
                                        View Certificate
                                    </Button>
                                ) : isExamCompleted(exam.id) && canRetake ? (
                                    // Premium exam passed but can be regenerated
                                    <div className="space-y-2">
                                        <Button
                                            variant="default"
                                            className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                                            onClick={() => {
                                                const cert = certificates.find(c => c.examId === exam.id);
                                                if (cert) handleViewCertificate(cert);
                                            }}
                                        >
                                            <CheckCircle2 className="h-4 w-4 mr-2" />
                                            View Certificate
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="w-full"
                                            onClick={() => handleStartExam(exam.id)}
                                            disabled={isLoadingQuestions}
                                        >
                                            <Award className="h-4 w-4 mr-2" />
                                            {isLoadingQuestions ? 'Loading...' : 'Take New Exam'}
                                        </Button>
                                    </div>
                                ) : hasFailedAttempts(exam.id) ? (
                                    // Exam failed - allow retake
                                    <Button
                                        variant="default"
                                        className="w-full"
                                        style={{ backgroundColor: exam.color }}
                                        onClick={() => handleStartExam(exam.id)}
                                        disabled={isLoadingQuestions}
                                    >
                                        <Award className="h-4 w-4 mr-2" />
                                        {isLoadingQuestions ? 'Loading...' : 'Retake Exam'}
                                    </Button>
                                ) : (
                                    // No attempts yet - start exam
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
                    onClose={() => {
                        setSelectedExamId(null);
                        setExamQuestions([]);
                    }}
                    examId={selectedExam.id}
                    examTitle={selectedExam.title}
                    questions={examQuestions}
                    onComplete={handleExamComplete}
                />
            )}

            {/* Certificate Generator Dialog */}
            {selectedCertificate && (
                <CertificateGenerator
                    open={showCertificateDialog}
                    onClose={() => {
                        setShowCertificateDialog(false);
                        setSelectedCertificate(null);
                    }}
                    certificate={selectedCertificate}
                />
            )}
        </div>
    );
}
