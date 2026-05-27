import React from 'react';
import { useStore, getTopicProgress, isTopicComplete } from '../store';


export const TopicModal: React.FC = () => {
  const { selectedTopicId, setSelectedTopicId, subjects, updateTopicChecklist, addTopicToDate } = useStore();

  if (!selectedTopicId) return null;

  let topic: import('../types').Topic | null = null;
  let subject: import('../types').Subject | null = null;
  for (const s of subjects) {
    const t = s.topics.find((t) => t.id === selectedTopicId);
    if (t) { topic = t; subject = s; break; }
  }
  if (!topic || !subject) return null;

  const progress = getTopicProgress(topic);
  const complete = isTopicComplete(topic);

  const checklistItems = [
    { key: 'learn' as const, label: 'Learn', desc: 'Study the topic from notes/book' },
    { key: 'pyq' as const, label: 'PYQ', desc: 'Solve Previous Year Questions' },
    { key: 'flashcards' as const, label: 'Flashcards', desc: 'Review flashcards for retention' },
  ];

  const scheduledDates = topic.scheduledDates.sort();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setSelectedTopicId(null)}>
      <div className="bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-md shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="p-5 border-b border-gray-800" style={{ borderLeft: `4px solid ${subject.color}` }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">{subject.icon} {subject.name}</p>
              <h2 className="text-lg font-bold text-white">{topic.name}</h2>
            </div>
            <button onClick={() => setSelectedTopicId(null)} className="text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
          </div>
          <div className="flex items-center gap-3 mt-3">
            {complete && <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">✓ Mastered</span>}
          </div>
        </div>

        {/* Progress */}
        <div className="p-5 border-b border-gray-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Progress</span>
            <span className="text-sm font-bold" style={{ color: subject.color }}>{progress}%</span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, backgroundColor: subject.color }}
            />
          </div>
        </div>

        {/* Checklist */}
        <div className="p-5 space-y-3">
          <h3 className="text-sm font-semibold text-gray-300">Checklist</h3>
          {checklistItems.map((item) => (
            <label
              key={item.key}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-colors cursor-pointer ${
                topic.checklist[item.key]
                  ? 'bg-green-500/10 border-green-500/30'
                  : 'bg-gray-800/30 border-gray-700 hover:bg-gray-800/50'
              }`}
            >
              <input
                type="checkbox"
                checked={topic.checklist[item.key]}
                onChange={(e) => updateTopicChecklist(topic!.id, item.key, e.target.checked)}
                className="w-5 h-5 rounded border-gray-600 bg-gray-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0"
              />
              <div className="flex-1">
                <p className={`text-sm font-medium ${topic.checklist[item.key] ? 'text-green-400 line-through' : 'text-gray-200'}`}>
                  {item.label}
                </p>
                <p className="text-[10px] text-gray-500">{item.desc}</p>
              </div>
              {topic.checklist[item.key] && <span className="text-green-400">✓</span>}
            </label>
          ))}
        </div>

        {/* Scheduled Dates */}
        {scheduledDates.length > 0 && (
          <div className="px-5 pb-5">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">Scheduled On</h3>
            <div className="flex flex-wrap gap-1.5">
              {scheduledDates.map((date) => (
                <span
                  key={date}
                  className="text-[10px] bg-gray-800 text-gray-400 px-2 py-1 rounded-full"
                >
                  {new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Quick Schedule */}
        <div className="p-5 border-t border-gray-800">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">Quick Schedule</h3>
          <div className="flex gap-2">
            <input
              type="date"
              id="quick-schedule-date"
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              defaultValue={new Date().toISOString().split('T')[0]}
            />
            <button
              onClick={() => {
                const dateInput = document.getElementById('quick-schedule-date') as HTMLInputElement;
                if (dateInput?.value) {
                  addTopicToDate(topic.id, dateInput.value);
                }
              }}
              className="px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
