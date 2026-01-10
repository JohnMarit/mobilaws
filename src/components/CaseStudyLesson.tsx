import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Scale, BookOpen, ChevronRight } from 'lucide-react';
import { CaseStudy } from '@/lib/learningContent';

interface CaseStudyLessonProps {
  caseStudies: CaseStudy[];
  onComplete: (score: number) => void;
}

export default function CaseStudyLesson({ caseStudies, onComplete }: CaseStudyLessonProps) {
  const [currentCaseIndex, setCurrentCaseIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [answers, setAnswers] = useState<boolean[]>([]);
  
  const currentCase = caseStudies[currentCaseIndex];
  const isComplete = currentCaseIndex >= caseStudies.length;
  const score = isComplete ? Math.round((answers.filter(a => a).length / caseStudies.length) * 100) : 0;

  if (isComplete) {
    const passed = score >= 75;
    
    return (
      <Card className="max-w-4xl mx-auto">
        <CardContent className="p-8 text-center space-y-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.6 }}
            className="text-6xl mb-4"
          >
            {passed ? '🎉' : '📚'}
          </motion.div>
          
          <h2 className="text-2xl font-bold text-gray-900">
            {passed ? 'Excellent Work!' : 'Keep Learning!'}
          </h2>
          
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6">
            <p className="text-5xl font-bold text-primary mb-2">{score}%</p>
            <p className="text-gray-600">
              You answered {answers.filter(a => a).length} out of {caseStudies.length} cases correctly
            </p>
          </div>

          {!passed && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left">
              <p className="text-sm text-yellow-800">
                <strong>Tip:</strong> Review the explanations from each case to strengthen your understanding. 
                A score of 75% or higher is needed to pass.
              </p>
            </div>
          )}

          <Button 
            onClick={() => onComplete(score)} 
            className="bg-gradient-to-r from-primary to-blue-600"
            size="lg"
          >
            {passed ? 'Complete Lesson' : 'Try Again'}
            <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  const handleOptionSelect = (optionIndex: number) => {
    if (showExplanation) return;
    setSelectedOption(optionIndex);
  };

  const handleCheckAnswer = () => {
    if (selectedOption === null) return;
    
    const isCorrect = selectedOption === currentCase.correctAnswer;
    setAnswers([...answers, isCorrect]);
    setShowExplanation(true);
  };

  const handleNext = () => {
    setCurrentCaseIndex(prev => prev + 1);
    setSelectedOption(null);
    setShowExplanation(false);
  };

  const getDifficultyColor = (difficulty: 'simple' | 'medium' | 'hard') => {
    switch (difficulty) {
      case 'simple':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'hard':
        return 'bg-red-100 text-red-700 border-red-200';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
            <Scale className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Legal Case Analysis</h2>
            <p className="text-sm text-gray-500">Case {currentCaseIndex + 1} of {caseStudies.length}</p>
          </div>
        </div>
        
        <div className={`px-4 py-2 rounded-full text-xs font-medium border ${getDifficultyColor(currentCase.difficulty)}`}>
          {currentCase.difficulty.charAt(0).toUpperCase() + currentCase.difficulty.slice(1)}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div 
          className="bg-gradient-to-r from-primary to-purple-600 h-3 rounded-full transition-all duration-500"
          style={{ width: `${((currentCaseIndex) / caseStudies.length) * 100}%` }}
        />
      </div>

      {/* Case Scenario */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentCaseIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BookOpen className="h-5 w-5 text-purple-600" />
                Scenario
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-800 leading-relaxed whitespace-pre-line">
                {currentCase.scenario}
              </p>
            </CardContent>
          </Card>

          {/* Question */}
          <Card className="mt-6">
            <CardContent className="pt-6">
              <p className="text-lg font-semibold text-gray-900 mb-6">
                {currentCase.question}
              </p>

              {/* Options */}
              <div className="space-y-3">
                {currentCase.options.map((option, index) => {
                  const isSelected = selectedOption === index;
                  const isCorrect = index === currentCase.correctAnswer;
                  const showResult = showExplanation;
                  
                  let optionClass = 'border-2 border-gray-200 hover:border-primary hover:bg-blue-50';
                  
                  if (showResult) {
                    if (isCorrect) {
                      optionClass = 'border-2 border-green-500 bg-green-50';
                    } else if (isSelected && !isCorrect) {
                      optionClass = 'border-2 border-red-500 bg-red-50';
                    }
                  } else if (isSelected) {
                    optionClass = 'border-2 border-primary bg-blue-50';
                  }

                  return (
                    <motion.button
                      key={index}
                      onClick={() => handleOptionSelect(index)}
                      disabled={showExplanation}
                      className={`w-full text-left p-4 rounded-lg transition-all duration-200 ${optionClass} ${
                        showExplanation ? 'cursor-default' : 'cursor-pointer'
                      }`}
                      whileHover={!showExplanation ? { scale: 1.02 } : {}}
                      whileTap={!showExplanation ? { scale: 0.98 } : {}}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                          showResult && isCorrect ? 'bg-green-500 text-white' :
                          showResult && isSelected && !isCorrect ? 'bg-red-500 text-white' :
                          isSelected ? 'bg-primary text-white' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {showResult && isCorrect ? (
                            <CheckCircle2 className="h-5 w-5" />
                          ) : showResult && isSelected && !isCorrect ? (
                            <XCircle className="h-5 w-5" />
                          ) : (
                            String.fromCharCode(65 + index)
                          )}
                        </div>
                        <span className="flex-1 text-gray-800">{option}</span>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Explanation */}
              <AnimatePresence>
                {showExplanation && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-6"
                  >
                    <Card className={`border-2 ${
                      selectedOption === currentCase.correctAnswer 
                        ? 'border-green-200 bg-green-50' 
                        : 'border-yellow-200 bg-yellow-50'
                    }`}>
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-full ${
                            selectedOption === currentCase.correctAnswer 
                              ? 'bg-green-500' 
                              : 'bg-yellow-500'
                          }`}>
                            {selectedOption === currentCase.correctAnswer ? (
                              <CheckCircle2 className="h-5 w-5 text-white" />
                            ) : (
                              <BookOpen className="h-5 w-5 text-white" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 mb-2">
                              {selectedOption === currentCase.correctAnswer 
                                ? 'Correct!' 
                                : 'Not quite right'}
                            </p>
                            <p className="text-gray-700 leading-relaxed">
                              {currentCase.explanation}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action Buttons */}
              <div className="mt-6 flex gap-3 justify-end">
                {!showExplanation ? (
                  <Button
                    onClick={handleCheckAnswer}
                    disabled={selectedOption === null}
                    size="lg"
                    className="bg-gradient-to-r from-primary to-blue-600"
                  >
                    Check Answer
                  </Button>
                ) : (
                  <Button
                    onClick={handleNext}
                    size="lg"
                    className="bg-gradient-to-r from-primary to-blue-600"
                  >
                    {currentCaseIndex < caseStudies.length - 1 ? 'Next Case' : 'See Results'}
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
