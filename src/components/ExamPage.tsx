import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Award, Trophy, Lock, CheckCircle2, Clock, Target, Download, Eye, GraduationCap, Scale, Crown } from 'lucide-react';
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

    // Get icon for certificate level
    const getCertificateIcon = (examId: string) => {
        switch (examId) {
            case 'basic-cert':
                return <GraduationCap className="h-10 w-10 text-blue-600" />;
            case 'standard-cert':
                return <Scale className="h-10 w-10 text-blue-600" />;
            case 'premium-cert':
                return <Crown className="h-10 w-10 text-blue-600" />;
            default:
                return <Trophy className="h-10 w-10 text-blue-600" />;
        }
    };

    // Get icon for certificate level (by level name)
    const getLevelIcon = (level: string) => {
        switch (level.toLowerCase()) {
            case 'basic':
                return <GraduationCap className="h-4 w-4 text-blue-600" />;
            case 'standard':
                return <Scale className="h-4 w-4 text-blue-600" />;
            case 'premium':
                return <Crown className="h-4 w-4 text-blue-600" />;
            default:
                return <Trophy className="h-4 w-4 text-blue-600" />;
        }
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm uppercase tracking-wide text-blue-100">
                        <Trophy className="h-4 w-4" />
                        Certification Track
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold">Pass exams. Unlock certificates.</h1>
                    <p className="text-blue-100 text-sm sm:text-base">
                        Structured assessments with one-click certificate downloads.
                    </p>
                </div>
                {certificates.length > 0 && (
                    <div className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm shadow-inner">
                        <p className="font-semibold">Certificates earned</p>
                        <p className="text-blue-100 text-sm">{certificates.length} ready to view & download</p>
                    </div>
                )}
            </div>

            {/* Earned Certificates */}
            {certificates.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-blue-800">
                        <CheckCircle2 className="h-4 w-4" />
                        Your certificates
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {certificates.map((cert) => (
                            <Card key={cert.certificateNumber} className="border border-blue-100 shadow-sm hover:shadow-md transition-all bg-white">
                                <CardHeader className="space-y-1">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <CardTitle className="text-lg text-blue-800 line-clamp-2">{cert.examTitle}</CardTitle>
                                            <CardDescription className="text-xs text-slate-500">
                                                Issued {new Date(cert.issuedAt).toLocaleDateString()}
                                            </CardDescription>
                                        </div>
                                        <Badge className="bg-blue-100 text-blue-700 border border-blue-200">Completed</Badge>
                                    </div>
                                    <div className="text-xs text-slate-500 flex items-center gap-2">
                                        <span className="font-mono text-blue-800">{cert.certificateNumber}</span>
                                        <span>•</span>
                                        <span className="capitalize flex items-center gap-1">
                                            {getLevelIcon(cert.level)}
                                            {cert.level} level
                                        </span>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex gap-2">
                                    <Button
                                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                                        onClick={() => handleViewCertificate(cert)}
                                    >
                                        <Eye className="h-4 w-4 mr-2" />
                                        View / Download
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="border-blue-200 text-blue-700 flex-shrink-0"
                                        onClick={() => handleViewCertificate(cert)}
                                    >
                                        <Download className="h-4 w-4 mr-2" />
                                        PNG
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* Available Exams */}
            <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-blue-800">
                    <Award className="h-4 w-4" />
                    Available exams
                </div>
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
                            className={`relative overflow-hidden border border-blue-100 shadow-sm hover:shadow-lg transition-all ${isLocked ? 'opacity-60' : ''} ${hasCert ? 'ring-2 ring-blue-300' : ''}`}
                        >
                            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 to-blue-700" />
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
                                        {getCertificateIcon(exam.id)}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {isExamCompleted(exam.id) && (
                                            <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                                Completed
                                            </Badge>
                                        )}
                                        {hasFailedAttempts(exam.id) && !isExamCompleted(exam.id) && (
                                            <Badge variant="secondary" className="bg-blue-50 text-blue-700 border border-blue-100">
                                                <Award className="h-3 w-3 mr-1" />
                                                Retry available
                                            </Badge>
                                        )}
                                        {isLocked && (
                                            <Badge variant="secondary" className="bg-blue-50 text-blue-700 border border-blue-100">
                                                <Lock className="h-3 w-3 mr-1" />
                                                Locked
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                                <CardTitle className="text-xl text-slate-900">{exam.title}</CardTitle>
                                <CardDescription className="text-slate-600">{exam.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Exam Details */}
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <Target className="h-4 w-4 text-blue-600" />
                                        <span>{exam.questionCount} questions</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <Award className="h-4 w-4 text-blue-600" />
                                        <span>Pass mark: {exam.passMark}%</span>
                                    </div>
                                    {exam.timeLimit && (
                                        <div className="flex items-center gap-2 text-slate-500">
                                            <Clock className="h-4 w-4 text-blue-600" />
                                            <span>{exam.timeLimit} minutes</span>
                                        </div>
                                    )}
                                </div>

                                {/* Action Button */}
                                {isLocked ? (
                                    <Button variant="outline" className="w-full border-blue-200 text-blue-700" disabled>
                                        <Lock className="h-4 w-4 mr-2" />
                                        {lockMessage}
                                    </Button>
                                ) : isExamCompleted(exam.id) && !canRetake ? (
                                    // Exam passed and cannot be retaken (Basic & Standard)
                                    <Button
                                        variant="default"
                                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-sm"
                                        onClick={() => {
                                            const cert = certificates.find(c => c.examId === exam.id);
                                            if (cert) handleViewCertificate(cert);
                                        }}
                                    >
                                        <CheckCircle2 className="h-4 w-4 mr-2" />
                                        View / Download
                                    </Button>
                                ) : isExamCompleted(exam.id) && canRetake ? (
                                    // Premium exam passed but can be regenerated
                                    <div className="space-y-2">
                                        <Button
                                            variant="default"
                                            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-sm"
                                            onClick={() => {
                                                const cert = certificates.find(c => c.examId === exam.id);
                                                if (cert) handleViewCertificate(cert);
                                            }}
                                        >
                                            <CheckCircle2 className="h-4 w-4 mr-2" />
                                            View / Download
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="w-full border-blue-200 text-blue-700"
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
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                                        onClick={() => handleStartExam(exam.id)}
                                        disabled={isLoadingQuestions}
                                    >
                                        <Award className="h-4 w-4 mr-2" />
                                        {isLoadingQuestions ? 'Loading...' : 'Retake Exam'}
                                    </Button>
                                ) : (
                                    // No attempts yet - start exam
                                    <Button
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
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
