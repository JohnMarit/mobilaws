import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, Award, ArrowLeft, ArrowRight, Trophy, Download } from 'lucide-react';
import { ExamQuestion, calculateExamScore, generateCertificateNumber, type Certificate, type ExamAttempt } from '@/lib/examContent';
import { saveExamAttempt, saveCertificate } from '@/lib/examService';
import { useAuth } from '@/contexts/FirebaseAuthContext';

interface ExamRunnerProps {
    open: boolean;
    onClose: () => void;
    examId: string;
    examTitle: string;
    questions: ExamQuestion[];
    onComplete: (certificate: Certificate | null) => void;
}

export default function ExamRunner({ open, onClose, examId, examTitle, questions, onComplete }: ExamRunnerProps) {
    const { user } = useAuth();
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, number>>({});
    const [showResults, setShowResults] = useState(false);
    const [examResults, setExamResults] = useState<{
        score: number;
        passed: boolean;
        correctCount: number;
        totalCount: number;
    } | null>(null);
    const [certificate, setCertificate] = useState<Certificate | null>(null);
    const [attemptId] = useState(`attempt-${Date.now()}`);
    const [startTime] = useState(new Date().toISOString());

    const currentQuestion = questions[currentQuestionIndex];
    const progressPercent = useMemo(
        () => Math.round(((currentQuestionIndex + 1) / questions.length) * 100),
        [currentQuestionIndex, questions.length]
    );
    const answeredCount = Object.keys(answers).length;

    useEffect(() => {
        if (open) {
            // Reset state when exam opens
            setCurrentQuestionIndex(0);
            setAnswers({});
            setShowResults(false);
            setExamResults(null);
            setCertificate(null);
        }
    }, [open]);

    const handleAnswerSelect = (optionIndex: number) => {
        setAnswers(prev => ({
            ...prev,
            [currentQuestion.id]: optionIndex
        }));
    };

    const handleNext = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const handlePrevious = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    const handleSubmit = async () => {
        const results = calculateExamScore(answers, questions);
        setExamResults(results);
        setShowResults(true);

        if (!user) return;

        const completedAt = new Date().toISOString();

        // Save exam attempt to Firebase
        const attempt: ExamAttempt = {
            id: attemptId,
            examId,
            userId: user.id,
            startedAt: startTime,
            completedAt,
            answers,
            score: results.score,
            passed: results.passed
        };

        try {
            await saveExamAttempt(attempt);
        } catch (error) {
            console.error('Failed to save exam attempt:', error);
        }

        // Generate and save certificate if passed
        if (results.passed) {
            const cert: Certificate = {
                id: `cert-${Date.now()}`,
                userId: user.id,
                userName: user.name || user.email || 'User',
                examId,
                examTitle,
                level: 'basic',
                score: results.score,
                issuedAt: completedAt,
                certificateNumber: generateCertificateNumber('basic')
            };

            try {
                await saveCertificate(cert);
                setCertificate(cert);
                onComplete(cert);
            } catch (error) {
                console.error('Failed to save certificate:', error);
                // Still show certificate locally even if save fails
                setCertificate(cert);
                onComplete(cert);
            }
        } else {
            onComplete(null);
        }
    };

    const handleClose = () => {
        onClose();
    };

    if (showResults && examResults) {
        return (
            <Dialog open={open} onOpenChange={handleClose}>
                <DialogContent className="max-w-2xl w-[95vw] sm:w-full max-h-[90vh] sm:max-h-[95vh] overflow-y-auto overflow-x-hidden p-3 sm:p-6">
                    <DialogHeader className="pr-8">
                        <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl md:text-2xl">
                            {examResults.passed ? (
                                <>
                                    <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500 flex-shrink-0" />
                                    <span className="leading-tight">Congratulations! 🎉</span>
                                </>
                            ) : (
                                <>
                                    <XCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-500 flex-shrink-0" />
                                    <span className="leading-tight">Keep Trying!</span>
                                </>
                            )}
                        </DialogTitle>
                        <DialogDescription className="text-xs sm:text-sm md:text-base">
                            {examResults.passed
                                ? 'You have successfully passed the exam and earned your certificate!'
                                : 'You need 70% to pass. Review the material and try again.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 sm:space-y-6 overflow-x-hidden">
                        {/* Score Display */}
                        <Card className={examResults.passed ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}>
                            <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6">
                                <div className="text-center space-y-3 sm:space-y-4">
                                    <div className="text-4xl sm:text-5xl md:text-6xl font-bold break-words" style={{ color: examResults.passed ? '#22c55e' : '#ef4444' }}>
                                        {examResults.score}%
                                    </div>
                                    <div className="text-sm sm:text-base md:text-lg text-muted-foreground">
                                        {examResults.correctCount} out of {examResults.totalCount} correct
                                    </div>
                                    <Progress
                                        value={examResults.score}
                                        className="h-2 sm:h-3"
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Certificate Info */}
                        {examResults.passed && certificate && (
                            <Alert className="border-yellow-500 bg-yellow-50">
                                <Award className="h-5 w-5 text-yellow-600" />
                                <AlertDescription className="ml-2">
                                    <div className="space-y-2">
                                        <p className="font-semibold text-yellow-900">Certificate Earned!</p>
                                        <p className="text-sm text-yellow-800">
                                            Certificate Number: <span className="font-mono font-bold">{certificate.certificateNumber}</span>
                                        </p>
                                        <p className="text-sm text-yellow-800">
                                            Issued: {new Date(certificate.issuedAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-end">
                            {examResults.passed && (
                                <Button variant="outline" className="gap-2 w-full sm:w-auto">
                                    <Download className="h-4 w-4" />
                                    <span className="hidden sm:inline">Download Certificate</span>
                                    <span className="sm:hidden">Download</span>
                                </Button>
                            )}
                            <Button onClick={handleClose} className="w-full sm:w-auto">
                                {examResults.passed ? 'View Certificate' : 'Close'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-4xl w-[95vw] sm:w-full max-h-[90vh] sm:max-h-[95vh] overflow-y-auto overflow-x-hidden p-3 sm:p-6">
                <DialogHeader className="pr-8">
                    <DialogTitle className="flex items-center gap-2 text-base sm:text-lg md:text-xl">
                        <Award className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                        <span className="truncate leading-tight">{examTitle}</span>
                    </DialogTitle>
                    <DialogDescription className="text-xs sm:text-sm md:text-base">
                        Question {currentQuestionIndex + 1} of {questions.length} • {answeredCount} answered
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 sm:space-y-6 overflow-x-hidden">
                    {/* Progress Bar */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs sm:text-sm text-muted-foreground">
                            <span>Progress</span>
                            <span>{progressPercent}%</span>
                        </div>
                        <Progress value={progressPercent} className="h-2" />
                    </div>

                    {/* Question Card */}
                    <Card className="overflow-hidden">
                        <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6 space-y-4 sm:space-y-6">
                            {/* Question */}
                            <div className="overflow-x-hidden">
                                <Badge variant="outline" className="mb-2 sm:mb-3 text-xs">
                                    {currentQuestion.moduleId.replace('-', ' ').toUpperCase()}
                                </Badge>
                                <h3 className="text-base sm:text-lg font-semibold leading-relaxed break-words">
                                    {currentQuestion.question}
                                </h3>
                            </div>

                            {/* Options */}
                            <div className="space-y-2 sm:space-y-3">
                                {currentQuestion.options.map((option, index) => {
                                    const isSelected = answers[currentQuestion.id] === index;
                                    return (
                                        <Button
                                            key={index}
                                            variant={isSelected ? 'default' : 'outline'}
                                            className="w-full justify-start text-left h-auto py-3 sm:py-4 px-3 sm:px-5 text-sm sm:text-base break-words"
                                            onClick={() => handleAnswerSelect(index)}
                                        >
                                            <div className="flex items-start gap-2 sm:gap-3 w-full min-w-0">
                                                <div className={`flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center mt-0.5 ${isSelected ? 'bg-white border-white' : 'border-current'
                                                    }`}>
                                                    {isSelected && <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-primary" />}
                                                </div>
                                                <span className="flex-1 leading-relaxed break-words min-w-0">{option}</span>
                                            </div>
                                        </Button>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Navigation */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 overflow-x-hidden">
                        <Button
                            variant="outline"
                            onClick={handlePrevious}
                            disabled={currentQuestionIndex === 0}
                            className="gap-2 w-full sm:w-auto text-sm sm:text-base"
                            size="sm"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            <span className="hidden sm:inline">Previous</span>
                            <span className="sm:hidden">Prev</span>
                        </Button>

                        <div className="flex gap-1 sm:gap-2 overflow-x-auto w-full sm:w-auto justify-center pb-2 sm:pb-0 scrollbar-hide">
                            {questions.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentQuestionIndex(index)}
                                    className={`flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full text-xs font-medium transition-colors ${index === currentQuestionIndex
                                        ? 'bg-primary text-primary-foreground'
                                        : answers[questions[index].id] !== undefined
                                            ? 'bg-green-100 text-green-700 border border-green-300'
                                            : 'bg-gray-100 text-gray-600 border border-gray-300'
                                        }`}
                                    title={`Question ${index + 1}${answers[questions[index].id] !== undefined ? ' (answered)' : ''}`}
                                >
                                    {index + 1}
                                </button>
                            ))}
                        </div>

                        {currentQuestionIndex === questions.length - 1 ? (
                            <Button
                                onClick={handleSubmit}
                                disabled={answeredCount < questions.length}
                                className="gap-2 w-full sm:w-auto text-sm sm:text-base"
                                size="sm"
                            >
                                <span className="hidden sm:inline">Submit Exam</span>
                                <span className="sm:hidden">Submit</span>
                                <CheckCircle2 className="h-4 w-4" />
                            </Button>
                        ) : (
                            <Button
                                onClick={handleNext}
                                disabled={currentQuestionIndex === questions.length - 1}
                                className="gap-2 w-full sm:w-auto text-sm sm:text-base"
                                size="sm"
                            >
                                Next
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        )}
                    </div>

                    {/* Submit Warning */}
                    {answeredCount < questions.length && (
                        <Alert className="overflow-x-hidden">
                            <AlertDescription className="text-xs sm:text-sm break-words">
                                You have {questions.length - answeredCount} unanswered question{questions.length - answeredCount !== 1 ? 's' : ''}.
                                Please answer all questions before submitting.
                            </AlertDescription>
                        </Alert>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
