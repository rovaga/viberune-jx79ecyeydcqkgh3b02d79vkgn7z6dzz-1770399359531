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
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 bg-slate-50 text-slate-800 font-sans">
      <div className="max-w-2xl w-full space-y-6">
        
        {/* Main Header - Sets Context */}
        <header className="text-center space-y-2">
          <div className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold tracking-wide uppercase mb-2">
            Desafío de Lógica
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Laboratorio de Pesos
          </h1>
          <p className="text-slate-600 max-w-lg mx-auto">
            Utiliza la balanza para deducir los valores.
            <br/>
            <span className="text-sm opacity-80">La pesa gris vale <span className="font-bold">10</span>.</span>
          </p>
        </header>

        {/* Interactive Card */}
        <main className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Visualization Area */}
          <div className="w-full aspect-[4/3] relative bg-white border-b border-slate-100">
            <ScaleSimulation blockWeight={targetWeight} />
          </div>
          
          {/* Question & Interaction Area - Grouped for cohesion */}
          <div className="p-6 bg-slate-50 flex flex-col items-center gap-6">
            
            {/* The Question */}
            <h2 className="text-xl font-semibold text-slate-800 text-center">
              ¿Cuál es el peso de un bloque morado?
            </h2>

            {/* Options Grid */}
            <div className="w-full grid grid-cols-4 gap-4">
              {options.map((opt) => {
                let btnClass = "py-4 text-xl font-bold rounded-xl transition-all duration-200 border-2 shadow-sm ";
                
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
            <div className="h-12 w-full flex items-center justify-center">
              {gameState === 'correct' && (
                <div className="flex items-center gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center gap-2 text-green-600 font-bold text-lg">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    ¡Correcto!
                  </div>
                  <button 
                    onClick={generateQuestion}
                    className="px-6 py-2 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 transition-colors shadow-lg"
                  >
                    Siguiente
                  </button>
                </div>
              )}
              {gameState === 'wrong' && (
                <div className="text-red-500 font-medium animate-in fade-in zoom-in duration-200 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Incorrecto. ¡Prueba a pesar los bloques!
                </div>
              )}
               {gameState === 'playing' && (
                <div className="text-slate-400 text-sm italic">
                  Selecciona tu respuesta arriba
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Legend Footer */}
        <div className="flex justify-center gap-6 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-[#a855f7]"></div>
            <span>Bloque (?)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-slate-400"></div>
            <span>Pesa Fija (10)</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default App;