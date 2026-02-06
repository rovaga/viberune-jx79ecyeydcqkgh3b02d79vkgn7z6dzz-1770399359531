import React, { useState, useEffect } from 'react';
import ScaleSimulation from './components/ScaleSimulation';

type GameState = 'playing' | 'correct' | 'wrong';

const App: React.FC = () => {
  const [targetWeight, setTargetWeight] = useState<number>(3);
  const [options, setOptions] = useState<number[]>([]);
  const [gameState, setGameState] = useState<GameState>('playing');
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  // Helper to communicate with Robin LMS
  const sendLmsScore = (score: number, status: 'started' | 'in-progress' | 'completed') => {
    window.parent.postMessage({
      type: 'robin-lms-score',
      score: score,
      maxScore: 100,
      status: status
    }, '*');
  };

  // Generate a new question
  const generateQuestion = () => {
    // Random weight between 2 and 9
    const newWeight = Math.floor(Math.random() * 8) + 2;
    setTargetWeight(newWeight);
    
    // Generate options (1 correct, 3 wrong)
    const newOptions = new Set<number>();
    newOptions.add(newWeight);
    
    while (newOptions.size < 4) {
      // Generate distractors close to the real answer
      const offset = Math.floor(Math.random() * 5) - 2; // -2 to +2
      const val = newWeight + offset;
      if (val > 0 && val !== newWeight) {
        newOptions.add(val);
      } else {
        // Fallback for edge cases
        newOptions.add(Math.floor(Math.random() * 10) + 1);
      }
    }

    setOptions(Array.from(newOptions).sort((a, b) => a - b));
    setGameState('playing');
    setSelectedOption(null);
    
    // Notify LMS that a new attempt/activity has started
    sendLmsScore(0, 'started');
  };

  useEffect(() => {
    generateQuestion();
  }, []);

  const handleGuess = (val: number) => {
    if (gameState === 'correct') return;
    
    setSelectedOption(val);
    if (val === targetWeight) {
      setGameState('correct');
      // Notify LMS of completion with full score
      sendLmsScore(100, 'completed');
    } else {
      setGameState('wrong');
      // Notify LMS of progress (attempt made but incorrect)
      sendLmsScore(0, 'in-progress');
    }
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-slate-50 text-slate-800 font-sans flex items-center justify-center">
      <div className="w-full h-full aspect-square max-w-full max-h-full flex flex-col p-2">
        {/* Interactive Card */}
        <main className="flex-1 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col min-h-0">
          {/* Visualization Area */}
          <div className="flex-1 relative bg-white border-b border-slate-100 overflow-hidden" style={{ minHeight: '400px' }}>
            <ScaleSimulation blockWeight={targetWeight} />
          </div>
          
          {/* Question & Interaction Area - Grouped for cohesion */}
          <div className="p-2 bg-slate-50 flex flex-col items-center gap-1.5 flex-shrink-0">
            
            {/* The Question */}
            <h2 className="text-base font-semibold text-slate-800 text-center">
              ¿Cuál es el peso de un bloque morado?
            </h2>

            {/* Options Grid */}
            <div className="w-full grid grid-cols-4 gap-2">
              {options.map((opt) => {
                let btnClass = "py-2 text-base font-bold rounded-xl transition-all duration-200 border-2 shadow-sm ";
                
                if (gameState === 'correct' && opt === targetWeight) {
                  btnClass += "bg-green-500 border-green-600 text-white scale-105 shadow-green-200";
                } else if (gameState === 'wrong' && opt === selectedOption) {
                  btnClass += "bg-red-100 border-red-300 text-red-500 opacity-50";
                } else if (gameState === 'playing' || (gameState === 'wrong' && opt !== selectedOption)) {
                   btnClass += "bg-white border-slate-200 hover:border-purple-300 hover:bg-purple-50 text-slate-700";
                } else {
                   btnClass += "bg-white border-slate-200 opacity-50";
                }

                return (
                  <button
                    key={opt}
                    onClick={() => handleGuess(opt)}
                    disabled={gameState === 'correct'}
                    className={btnClass}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>

            {/* Feedback Area */}
            <div className="h-8 w-full flex items-center justify-center">
              {gameState === 'correct' && (
                <div className="flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center gap-2 text-green-600 font-bold text-sm">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    ¡Correcto!
                  </div>
                  <button 
                    onClick={generateQuestion}
                    className="px-4 py-1 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 transition-colors shadow-lg text-sm"
                  >
                    Siguiente
                  </button>
                </div>
              )}
              {gameState === 'wrong' && (
                <div className="text-red-500 font-medium animate-in fade-in zoom-in duration-200 flex items-center gap-2 text-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Incorrecto. ¡Prueba a pesar los bloques!
                </div>
              )}
               {gameState === 'playing' && (
                <div className="text-slate-400 text-xs italic">
                  Selecciona tu respuesta arriba
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;