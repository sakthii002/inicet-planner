import React, { useEffect, useState } from 'react';
import { useStore } from '../store';

type SprintMode = 'timer' | 'retrospective';

export const QuickSprint: React.FC = () => {
  const { showSprint, setShowSprint, addSprint, subjects } = useStore();
  const [mode, setMode] = useState<SprintMode>('timer');

  // Timer mode state
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);

  // Retrospective mode state
  const [retrospectiveMinutes, setRetrospectiveMinutes] = useState(10);
  const [retrospectiveDate, setRetrospectiveDate] = useState(new Date().toISOString().split('T')[0]);

  // Common state
  const [mcqs, setMcqs] = useState(0);
  const [flashcards, setFlashcards] = useState(0);
  const [selectedTopic, setSelectedTopic] = useState('');

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  const start = () => {
    setStartTime(Date.now());
    setIsRunning(true);
    setElapsed(0);
  };

  const stop = () => setIsRunning(false);

  const save = () => {
    const duration = mode === 'timer'
      ? Math.max(1, Math.round(elapsed / 60))
      : retrospectiveMinutes;
    const date = mode === 'timer'
      ? new Date().toISOString().split('T')[0]
      : retrospectiveDate;
    const startTs = mode === 'timer' && startTime ? startTime : Date.now() - duration * 60000;

    addSprint({
      id: crypto.randomUUID(),
      date,
      startTime: startTs,
      durationMinutes: duration,
      mcqs,
      flashcards,
      topicId: selectedTopic || undefined,
    });

    // Reset
    setIsRunning(false);
    setElapsed(0);
    setStartTime(null);
    setMcqs(0);
    setFlashcards(0);
    setSelectedTopic('');
    setRetrospectiveMinutes(10);
    setShowSprint(false);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const quickMinutes = [10, 15, 30, 45, 60];

  if (!showSprint) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => { if (!isRunning) setShowSprint(false); }}>
      <div className="bg-gradient-to-b from-gray-900 to-gray-950 rounded-3xl border border-gray-800 w-full max-w-md shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="p-6 text-center border-b border-gray-800">
          <h2 className="text-xl font-bold text-white mb-1">⚡ Quick Sprint</h2>
          <p className="text-xs text-gray-500">Log a micro-study session</p>
        </div>

        {/* Mode Toggle */}
        <div className="px-6 pt-4">
          <div className="flex bg-gray-800/60 rounded-lg p-0.5">
            <button onClick={() => setMode('timer')} className={`flex-1 py-2 rounded-md text-xs font-medium transition-all ${mode === 'timer' ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}>⏱️ Live Timer</button>
            <button onClick={() => setMode('retrospective')} className={`flex-1 py-2 rounded-md text-xs font-medium transition-all ${mode === 'retrospective' ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}>📝 Retrospective</button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {mode === 'timer' ? (
            <>
              <div className="text-center">
                <div className={`text-6xl font-mono font-bold tracking-wider ${isRunning ? 'text-emerald-400' : 'text-gray-600'}`}>
                  {formatTime(elapsed)}
                </div>
                <p className="text-xs text-gray-500 mt-2">minutes : seconds</p>
              </div>
              <div className="flex gap-3 justify-center">
                {!isRunning ? (
                  <button onClick={start} className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-colors text-sm">▶ Start Sprint</button>
                ) : (
                  <button onClick={stop} className="px-8 py-3 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-xl transition-colors text-sm">⏸ Pause</button>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Retrospective: Date */}
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Date</label>
                <input type="date" value={retrospectiveDate} onChange={(e) => setRetrospectiveDate(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
              </div>

              {/* Quick minute buttons */}
              <div>
                <label className="text-xs text-gray-400 mb-2 block">How long did you study?</label>
                <div className="grid grid-cols-5 gap-2">
                  {quickMinutes.map((m) => (
                    <button key={m} onClick={() => setRetrospectiveMinutes(m)}
                      className={`py-2 rounded-lg text-xs font-medium transition-colors ${retrospectiveMinutes === m ? 'bg-emerald-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                      {m}m
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-3 mt-3">
                  <input type="range" min={1} max={180} value={retrospectiveMinutes}
                    onChange={(e) => setRetrospectiveMinutes(parseInt(e.target.value))}
                    className="flex-1 accent-emerald-500" />
                  <span className="text-sm font-bold text-emerald-400 w-12 text-right">{retrospectiveMinutes}m</span>
                </div>
              </div>
            </>
          )}

          {/* Common inputs */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Topic (optional)</label>
            <select value={selectedTopic} onChange={(e) => setSelectedTopic(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500">
              <option value="">Select topic...</option>
              {subjects.map((s) => s.topics.map((t) => (
                <option key={t.id} value={t.id}>{s.name}: {t.name}</option>
              ))).flat()}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">MCQs Solved</label>
              <input type="number" min={0} value={mcqs} onChange={(e) => setMcqs(parseInt(e.target.value) || 0)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Flashcards</label>
              <input type="number" min={0} value={flashcards} onChange={(e) => setFlashcards(parseInt(e.target.value) || 0)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
            </div>
          </div>

          <button onClick={save} disabled={mode === 'timer' && !startTime}
            className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:from-gray-700 disabled:to-gray-700 disabled:text-gray-500 text-white font-semibold rounded-xl transition-all text-sm">
            💾 Save Sprint
          </button>
        </div>
      </div>
    </div>
  );
};
