import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Play, Pause, ChevronRight, Volume2, VolumeX } from 'lucide-react';
import { ConversationalLesson, DialogueLine } from '@/lib/learningContent';
import { motion, AnimatePresence } from 'framer-motion';

interface ConversationalLessonProps {
  lesson: ConversationalLesson;
  onComplete: () => void;
  difficulty: 'simple' | 'medium' | 'hard';
  showScript: boolean; // For hard mode, this can be false initially
}

export default function ConversationalLessonComponent({ 
  lesson, 
  onComplete, 
  difficulty,
  showScript: initialShowScript 
}: ConversationalLessonProps) {
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showScript, setShowScript] = useState(initialShowScript);
  const [audio] = useState(new Audio());
  const [hasCompletedOnce, setHasCompletedOnce] = useState(false);

  const currentLine = lesson.dialogue[currentLineIndex];
  const isComplete = currentLineIndex >= lesson.dialogue.length;

  useEffect(() => {
    return () => {
      audio.pause();
      audio.src = '';
    };
  }, [audio]);

  const playLine = (line: DialogueLine) => {
    if (line.audioUrl) {
      audio.src = line.audioUrl;
      audio.play();
      setIsPlaying(true);
      
      audio.onended = () => {
        setIsPlaying(false);
        // Auto-advance in medium and simple modes
        if (difficulty !== 'hard') {
          setTimeout(() => handleNext(), 800);
        }
      };
    } else {
      // Use speech synthesis as fallback
      const utterance = new SpeechSynthesisUtterance(line.text);
      utterance.rate = 0.9;
      utterance.onend = () => {
        setIsPlaying(false);
        if (difficulty !== 'hard') {
          setTimeout(() => handleNext(), 800);
        }
      };
      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
    }
  };

  const handleNext = () => {
    if (currentLineIndex < lesson.dialogue.length - 1) {
      setCurrentLineIndex(prev => prev + 1);
    } else if (!hasCompletedOnce) {
      setHasCompletedOnce(true);
    }
  };

  const handleReplay = () => {
    setCurrentLineIndex(0);
    setIsPlaying(false);
    audio.pause();
  };

  const toggleScript = () => {
    setShowScript(!showScript);
  };

  useEffect(() => {
    if (currentLineIndex < lesson.dialogue.length && difficulty === 'simple') {
      // Auto-play in simple mode
      playLine(currentLine);
    }
  }, [currentLineIndex, difficulty]);

  if (isComplete) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardContent className="p-8 text-center space-y-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.6 }}
            className="text-6xl mb-4"
          >
            🎉
          </motion.div>
          
          <h2 className="text-2xl font-bold text-gray-900">Conversation Complete!</h2>
          
          <div className="bg-blue-50 rounded-lg p-6 text-left">
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <span className="text-2xl">💡</span>
              Key Takeaways
            </h3>
            <ul className="space-y-2">
              {lesson.keyPoints.map((point, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-2"
                >
                  <span className="text-primary mt-1">✓</span>
                  <span className="text-gray-700">{point}</span>
                </motion.li>
              ))}
            </ul>
          </div>

          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={handleReplay}>
              Replay Conversation
            </Button>
            <Button onClick={onComplete} className="bg-gradient-to-r from-primary to-blue-600">
              Continue to Quiz
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const character = currentLine.speaker === 'character1' ? lesson.character1 : lesson.character2;
  const isLeftSide = currentLine.speaker === 'character1';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Character Display */}
      <div className="flex justify-between items-start mb-8">
        {/* Character 1 */}
        <motion.div 
          className={`flex flex-col items-center ${isLeftSide ? 'opacity-100 scale-110' : 'opacity-50 scale-100'} transition-all duration-300`}
          animate={{ scale: isLeftSide ? 1.1 : 1 }}
        >
          <div className={`w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-4xl shadow-lg ${isLeftSide ? 'ring-4 ring-blue-300' : ''}`}>
            {lesson.character1.icon}
          </div>
          <p className="mt-2 font-semibold text-gray-900">{lesson.character1.name}</p>
          <p className="text-xs text-gray-500">{lesson.character1.role}</p>
        </motion.div>

        {/* Progress Indicator */}
        <div className="flex-1 mx-8 mt-8">
          <div className="flex items-center justify-center gap-1">
            {lesson.dialogue.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index <= currentLineIndex 
                    ? 'bg-primary w-4' 
                    : 'bg-gray-200 w-2'
                }`}
              />
            ))}
          </div>
          <p className="text-center text-sm text-gray-500 mt-2">
            {currentLineIndex + 1} / {lesson.dialogue.length}
          </p>
        </div>

        {/* Character 2 */}
        <motion.div 
          className={`flex flex-col items-center ${!isLeftSide ? 'opacity-100 scale-110' : 'opacity-50 scale-100'} transition-all duration-300`}
          animate={{ scale: !isLeftSide ? 1.1 : 1 }}
        >
          <div className={`w-20 h-20 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-4xl shadow-lg ${!isLeftSide ? 'ring-4 ring-purple-300' : ''}`}>
            {lesson.character2.icon}
          </div>
          <p className="mt-2 font-semibold text-gray-900">{lesson.character2.name}</p>
          <p className="text-xs text-gray-500">{lesson.character2.role}</p>
        </motion.div>
      </div>

      {/* Dialogue Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentLineIndex}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.3 }}
        >
          <Card className={`border-2 ${isLeftSide ? 'border-blue-200 bg-blue-50' : 'border-purple-200 bg-purple-50'}`}>
            <CardContent className="p-8">
              <div className="flex items-start gap-4">
                <div className={`text-5xl ${isLeftSide ? '' : 'order-2'}`}>
                  {character.icon}
                </div>
                <div className={`flex-1 ${isLeftSide ? '' : 'order-1'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-bold text-lg text-gray-900">{character.name}</p>
                      <p className="text-xs text-gray-500">{character.role}</p>
                    </div>
                    {difficulty === 'hard' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleScript}
                        className="gap-2"
                      >
                        {showScript ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                        {showScript ? 'Hide' : 'Show'} Text
                      </Button>
                    )}
                  </div>
                  
                  {showScript ? (
                    <p className="text-lg leading-relaxed text-gray-800">
                      {currentLine.text}
                    </p>
                  ) : (
                    <div className="flex items-center gap-3 py-4">
                      <Volume2 className="h-6 w-6 text-gray-400 animate-pulse" />
                      <p className="text-gray-400 italic">Listen carefully...</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Controls */}
      <div className="flex justify-center gap-4">
        <Button
          variant="outline"
          size="lg"
          onClick={() => playLine(currentLine)}
          disabled={isPlaying}
          className="gap-2"
        >
          {isPlaying ? (
            <>
              <Pause className="h-5 w-5" />
              Playing...
            </>
          ) : (
            <>
              <Play className="h-5 w-5" />
              {difficulty === 'simple' ? 'Replay' : 'Play'}
            </>
          )}
        </Button>

        {difficulty !== 'simple' && (
          <Button
            size="lg"
            onClick={handleNext}
            disabled={isPlaying}
            className="gap-2 bg-gradient-to-r from-primary to-blue-600"
          >
            Next
            <ChevronRight className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Difficulty Badge */}
      <div className="flex justify-center">
        <div className={`px-4 py-2 rounded-full text-sm font-medium ${
          difficulty === 'simple' ? 'bg-green-100 text-green-700' :
          difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
          'bg-red-100 text-red-700'
        }`}>
          {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Mode
          {difficulty === 'hard' && ' - Listening Challenge'}
        </div>
      </div>
    </div>
  );
}
