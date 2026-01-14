
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CalculationRecord, CalcMode } from './types';
import Button from './components/Button';
import HistoryItem from './components/HistoryItem';
import { geminiService } from './services/geminiService';

// mathjs is loaded via CDN in index.html
declare const math: any;

const App: React.FC = () => {
  const [display, setDisplay] = useState('0');
  const [history, setHistory] = useState<CalculationRecord[]>([]);
  const [mode, setMode] = useState<CalcMode>('DEG');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [lastResult, setLastResult] = useState<string>('');
  const [wordProblemMode, setWordProblemMode] = useState(false);
  const [wordProblemText, setWordProblemText] = useState('');

  // Handle calculator input
  const handleInput = (val: string) => {
    setDisplay(prev => {
      if (prev === '0' || prev === 'Error') return val;
      return prev + val;
    });
  };

  const clearDisplay = () => {
    setDisplay('0');
    setAiExplanation(null);
  };

  const deleteLastChar = () => {
    setDisplay(prev => {
      if (prev.length <= 1 || prev === 'Error') return '0';
      return prev.slice(0, -1);
    });
  };

  const calculate = useCallback(() => {
    try {
      // Configure mathjs for DEG/RAD
      const config = {
        angles: mode.toLowerCase() as 'deg' | 'rad'
      };
      
      const result = math.evaluate(display);
      const formattedResult = Number.isInteger(result) ? result.toString() : result.toFixed(8).replace(/\.?0+$/, "");
      
      setLastResult(formattedResult);
      setDisplay(formattedResult);
      
      const newRecord: CalculationRecord = {
        id: crypto.randomUUID(),
        expression: display,
        result: formattedResult,
        timestamp: Date.now()
      };
      
      setHistory(prev => [newRecord, ...prev].slice(0, 50));
    } catch (error) {
      setDisplay('Error');
    }
  }, [display, mode]);

  const handleAiExplain = async () => {
    if (!display || display === '0' || display === 'Error') return;
    setIsAiLoading(true);
    try {
      const explanation = await geminiService.explainExpression(display, lastResult || display);
      setAiExplanation(explanation);
    } catch (err) {
      setAiExplanation("Could not reach AI services.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const solveWordProblem = async () => {
    if (!wordProblemText.trim()) return;
    setIsAiLoading(true);
    try {
      const res = await geminiService.solveWordProblem(wordProblemText);
      setDisplay(res.expression);
      setLastResult(res.result);
      setAiExplanation(res.explanation);
      setWordProblemMode(false);
    } catch (err) {
      alert("AI was unable to solve that problem.");
    } finally {
      setIsAiLoading(false);
    }
  };

  // Scientific Keys
  const scientificKeys = [
    { label: 'sin', val: 'sin(' },
    { label: 'cos', val: 'cos(' },
    { label: 'tan', val: 'tan(' },
    { label: 'log', val: 'log10(' },
    { label: 'ln', val: 'log(' },
    { label: 'π', val: 'PI' },
    { label: 'e', val: 'E' },
    { label: '^', val: '^' },
    { label: '√', val: 'sqrt(' },
    { label: '(', val: '(' },
    { label: ')', val: ')' },
    { label: '!', val: '!' },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-950 text-slate-200 overflow-hidden">
      
      {/* Sidebar - History & AI */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 border-r border-slate-800 transform transition-transform duration-300 md:relative md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full flex flex-col">
          <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 backdrop-blur-md sticky top-0">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              History
            </h2>
            <button onClick={() => setSidebarOpen(false)} className="md:hidden text-slate-400">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {history.length === 0 ? (
              <div className="p-8 text-center text-slate-500 italic">No calculations yet.</div>
            ) : (
              history.map(item => (
                <HistoryItem key={item.id} item={item} onRestore={(expr) => {
                  setDisplay(expr);
                  setSidebarOpen(false);
                }} />
              ))
            )}
          </div>
          <div className="p-4 bg-slate-800/30 border-t border-slate-800">
            <button 
              onClick={() => setHistory([])}
              className="w-full py-2 text-sm text-slate-400 hover:text-rose-400 transition-colors"
            >
              Clear History
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative max-w-5xl mx-auto w-full">
        
        {/* Header */}
        <header className="p-4 md:p-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="p-2 bg-slate-800 rounded-lg md:hidden">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            </button>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">AetherCalc</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setMode(prev => prev === 'DEG' ? 'RAD' : 'DEG')}
              className="px-3 py-1 bg-slate-800 rounded-full text-xs font-bold text-indigo-400 hover:bg-slate-700 transition-colors"
            >
              {mode}
            </button>
            <button 
              onClick={() => setWordProblemMode(true)}
              className="px-3 py-1 bg-indigo-600 rounded-full text-xs font-bold text-white hover:bg-indigo-500 transition-colors flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 012 2v5a2 2 0 01-2 2H4a2 2 0 01-2-2V5z" /><path d="M15 7v2h4v2h-4v3.038A3.001 3.001 0 0115 13H5a2 2 0 002 2h8a2 2 0 002-2V7h-2z" /></svg>
              AI Solve
            </button>
          </div>
        </header>

        {/* Display Area */}
        <div className="flex-none p-4 md:p-6 space-y-4">
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-2xl min-h-[160px] flex flex-col justify-end items-end relative overflow-hidden">
            <div className="absolute top-4 left-4 flex gap-2">
               <div className="w-3 h-3 rounded-full bg-rose-500/50"></div>
               <div className="w-3 h-3 rounded-full bg-amber-500/50"></div>
               <div className="w-3 h-3 rounded-full bg-emerald-500/50"></div>
            </div>
            
            {/* Expression */}
            <div className="text-slate-500 text-lg mono w-full text-right overflow-x-auto whitespace-nowrap scrollbar-none">
              {display}
            </div>
            
            {/* Result */}
            <div className="text-4xl md:text-6xl font-bold text-slate-100 mono break-all mt-2 text-right">
              {lastResult || '0'}
            </div>

            {/* AI Loading State */}
            {isAiLoading && (
              <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center z-10">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                  <span className="text-sm font-medium text-indigo-400">Gemini is thinking...</span>
                </div>
              </div>
            )}
          </div>

          {/* AI Explanation Result */}
          {aiExplanation && (
            <div className="bg-indigo-950/30 border border-indigo-500/20 rounded-2xl p-4 text-sm text-slate-300 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="flex items-center gap-2 mb-2 text-indigo-400 font-bold uppercase tracking-wider text-[10px]">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" /></svg>
                AI Insights
              </div>
              <p className="leading-relaxed">{aiExplanation}</p>
              <button 
                onClick={() => setAiExplanation(null)}
                className="mt-2 text-indigo-400/60 hover:text-indigo-400 transition-colors"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>

        {/* Keypad */}
        <div className="flex-1 p-4 md:p-6 grid grid-cols-4 md:grid-cols-5 gap-3 max-h-[600px]">
          
          {/* Top Control Bar - Only shown on MD+ as a column */}
          <div className="hidden md:flex flex-col gap-3">
            {scientificKeys.slice(0, 5).map(k => (
              <Button key={k.label} label={k.label} variant="function" onClick={() => handleInput(k.val)} />
            ))}
            <Button label="Explain" variant="action" onClick={handleAiExplain} className="mt-auto !bg-indigo-900/40 border border-indigo-500/30 hover:!bg-indigo-600/50" />
          </div>

          {/* Scientific Overlay for Mobile (simplified) */}
          <div className="md:hidden col-span-4 grid grid-cols-4 gap-2 mb-2">
            <Button label="sin" variant="function" onClick={() => handleInput('sin(')} className="text-xs" />
            <Button label="cos" variant="function" onClick={() => handleInput('cos(')} className="text-xs" />
            <Button label="tan" variant="function" onClick={() => handleInput('tan(')} className="text-xs" />
            <Button label="^" variant="function" onClick={() => handleInput('^')} className="text-xs" />
          </div>

          {/* Main Keypad grid */}
          <div className="col-span-4 grid grid-cols-4 gap-3 h-full">
            <Button label="AC" variant="danger" onClick={clearDisplay} />
            <Button label={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z"></path></svg>} variant="action" onClick={deleteLastChar} />
            <Button label="%" variant="action" onClick={() => handleInput('/100')} />
            <Button label="÷" variant="operator" onClick={() => handleInput('/')} />

            <Button label="7" onClick={() => handleInput('7')} />
            <Button label="8" onClick={() => handleInput('8')} />
            <Button label="9" onClick={() => handleInput('9')} />
            <Button label="×" variant="operator" onClick={() => handleInput('*')} />

            <Button label="4" onClick={() => handleInput('4')} />
            <Button label="5" onClick={() => handleInput('5')} />
            <Button label="6" onClick={() => handleInput('6')} />
            <Button label="-" variant="operator" onClick={() => handleInput('-')} />

            <Button label="1" onClick={() => handleInput('1')} />
            <Button label="2" onClick={() => handleInput('2')} />
            <Button label="3" onClick={() => handleInput('3')} />
            <Button label="+" variant="operator" onClick={() => handleInput('+')} />

            <Button label="0" onClick={() => handleInput('0')} className="col-span-1" />
            <Button label="." onClick={() => handleInput('.')} />
            <Button label="ANS" variant="action" onClick={() => handleInput(lastResult || '0')} />
            <Button label="=" variant="equal" onClick={calculate} />
          </div>

          {/* Desktop Right Column Extra functions */}
          <div className="hidden md:flex flex-col gap-3">
            {scientificKeys.slice(5).map(k => (
              <Button key={k.label} label={k.label} variant="function" onClick={() => handleInput(k.val)} />
            ))}
          </div>

          {/* AI Explain button for mobile */}
          <div className="md:hidden col-span-4 mt-2">
            <Button label="Explain with Gemini AI" variant="action" onClick={handleAiExplain} className="w-full !bg-indigo-900/40 border border-indigo-500/30 font-bold" />
          </div>
        </div>

        {/* Word Problem Modal */}
        {wordProblemMode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200">
              <h3 className="text-xl font-bold text-slate-100 mb-4 flex items-center gap-2">
                <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                Solve Word Problem
              </h3>
              <p className="text-slate-400 text-sm mb-4">Describe your math problem in plain text and AetherCalc will translate it into a scientific formula.</p>
              <textarea 
                className="w-full h-32 bg-slate-800 border border-slate-700 rounded-xl p-4 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
                placeholder="e.g., If I have 15 apples and give 3 to each of my 4 friends, how many do I have left?"
                value={wordProblemText}
                onChange={(e) => setWordProblemText(e.target.value)}
              />
              <div className="flex gap-3 mt-6">
                <button 
                  onClick={() => setWordProblemMode(false)}
                  className="flex-1 py-3 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={solveWordProblem}
                  disabled={isAiLoading || !wordProblemText.trim()}
                  className="flex-[2] py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-colors font-bold disabled:opacity-50"
                >
                  {isAiLoading ? 'Analyzing...' : 'Solve'}
                </button>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Floating Gradient Blob for aesthetics */}
      <div className="fixed -bottom-32 -right-32 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="fixed -top-32 -left-32 w-96 h-96 bg-emerald-600/10 rounded-full blur-[100px] pointer-events-none"></div>
    </div>
  );
};

export default App;
