import React, { useMemo } from 'react';
import { useStore, isTopicComplete, getTopicProgress } from '../store';

export const Heatmap: React.FC = () => {
  const { subjects } = useStore();

  const subjectStats = useMemo(() => {
    return subjects.map((subject) => {
      const topics = subject.topics;
      const topicsComplete = topics.filter(isTopicComplete).length;
      const topicsTotal = topics.length;
      const progressPct = topicsTotal > 0 ? topicsComplete / topicsTotal : 0;
      const avgProgress = topics.length > 0 ? topics.reduce((a, t) => a + getTopicProgress(t), 0) / topics.length : 0;

      return {
        ...subject,
        progressPct,
        topicsComplete,
        topicsTotal,
        avgProgress,
        topics,
      };
    });
  }, [subjects]);

  const overallProgress = subjectStats.length > 0
    ? subjectStats.reduce((a, s) => a + s.progressPct, 0) / subjectStats.length
    : 0;

  const getCellColor = (progress: number) => {
    if (progress === 0) return { bg: 'bg-gray-800', border: 'border-gray-700', text: 'text-gray-500', label: 'Not started' };
    if (progress < 50) return { bg: 'bg-red-900/60', border: 'border-red-800', text: 'text-red-300', label: 'Started' };
    if (progress < 100) return { bg: 'bg-amber-900/50', border: 'border-amber-700', text: 'text-amber-300', label: 'In progress' };
    return { bg: 'bg-green-800/70', border: 'border-green-600', text: 'text-green-300', label: 'Mastered' };
  };

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {/* Overall Stats */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-900 rounded-xl p-5 border border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white">🗺️ INICET Syllabus Heatmap</h2>
            <p className="text-xs text-gray-500">Visual progress across all subjects</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-emerald-400">{Math.round(overallProgress * 100)}%</p>
            <p className="text-[10px] text-gray-500">Overall Coverage</p>
          </div>
        </div>

        <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-red-500 via-amber-500 to-green-500 transition-all duration-700"
            style={{ width: `${overallProgress * 100}%` }} />
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 mt-3 flex-wrap">
          <span className="text-[10px] text-gray-500">Legend:</span>
          <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-gray-800 border border-gray-700" /><span className="text-[10px] text-gray-500">Not started</span></div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-red-900/60 border border-red-800" /><span className="text-[10px] text-gray-500">Started</span></div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-amber-900/50 border border-amber-700" /><span className="text-[10px] text-gray-500">In progress</span></div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-green-800/70 border border-green-600" /><span className="text-[10px] text-gray-500">Mastered</span></div>
        </div>
      </div>

      {/* Subject-by-Subject Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {subjectStats.map((subject) => (
          <div key={subject.id} className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">{subject.icon}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">{subject.name}</h3>
                  <span className="text-xs font-bold" style={{ color: subject.color }}>{Math.round(subject.progressPct * 100)}%</span>
                </div>
                <p className="text-[10px] text-gray-500">{subject.topicsComplete}/{subject.topicsTotal} topics mastered</p>
              </div>
            </div>

            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden mb-3">
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${subject.progressPct * 100}%`, backgroundColor: subject.color }} />
            </div>

            <div className="grid grid-cols-5 gap-1">
              {subject.topics.map((topic) => {
                const progress = getTopicProgress(topic);
                const color = getCellColor(progress);
                return (
                  <div key={topic.id}
                    className={`group relative ${color.bg} ${color.border} border rounded-md px-2 py-2 cursor-pointer hover:opacity-80 transition-opacity`}
                    title={`${topic.name} — ${color.label}`}>
                    <p className={`text-[9px] font-medium truncate ${color.text}`}>{topic.name}</p>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-50 bg-gray-950 border border-gray-700 rounded-lg px-2 py-1 w-36 pointer-events-none">
                      <p className="text-[10px] text-white font-medium truncate">{topic.name}</p>
                      <p className="text-[10px] text-gray-400">{color.label} · {progress}%</p>
                      <p className="text-[10px] text-gray-400">
                        L:{topic.checklist.learn ? '✓' : '○'} P:{topic.checklist.pyq ? '✓' : '○'} F:{topic.checklist.flashcards ? '✓' : '○'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
