import React, { useState } from 'react';
import { useStore, getTopicProgress, isTopicComplete } from '../store';
import { Topic } from '../types';

export const TopicPanel: React.FC = () => {
  const { subjects, setSelectedTopicId, addTopicToDate } = useStore();
  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState<string>('all');

  const toggleSubject = (id: string) => {
    setExpandedSubjects((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredSubjects = subjects.map((s) => {
    const topics = s.topics.filter((t) => {
      const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterSubject === 'all' || filterSubject === s.id;
      return matchesSearch && matchesFilter;
    });
    return { ...s, topics };
  });

  const TopicCard = ({ topic }: { topic: Topic }) => {
    const subject = subjects.find((s) => s.id === topic.subjectId)!;
    const progress = getTopicProgress(topic);
    const complete = isTopicComplete(topic);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().split('T')[0]);
    const [feedback, setFeedback] = useState<string | null>(null);

    const flashFeedback = (msg: string) => {
      setFeedback(msg);
      setTimeout(() => setFeedback(null), 1200);
    };

    const scheduleToday = (e: React.MouseEvent) => {
      e.stopPropagation();
      const today = new Date().toISOString().split('T')[0];
      addTopicToDate(topic.id, today);
      flashFeedback('✓ Added to today');
    };

    const scheduleCustom = (e: React.FormEvent) => {
      e.preventDefault();
      e.stopPropagation();
      addTopicToDate(topic.id, scheduleDate);
      setShowDatePicker(false);
      flashFeedback(`✓ Added ${scheduleDate}`);
    };

    return (
      <div className="group relative">
        <div
          onClick={() => setSelectedTopicId(topic.id)}
          className={`relative flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all text-xs hover:bg-gray-800/60 ${
            complete ? 'border-l-2' : ''
          }`}
          style={{ borderLeftColor: complete ? '#22c55e' : subject.color }}
        >
          <div className="flex-1 min-w-0">
            <p className={`truncate font-medium ${complete ? 'text-green-400 line-through' : 'text-gray-200'}`}>
              {topic.name}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="flex-1 h-1 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: subject.color }} />
              </div>
              <span className="text-[10px] text-gray-500 w-8 text-right">{progress}%</span>
            </div>
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <button
              onClick={scheduleToday}
              className="px-1.5 py-0.5 rounded bg-gray-700 hover:bg-emerald-600 text-[9px] text-gray-300 hover:text-white transition-colors"
              title="Schedule for today"
            >
              📅 Today
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setShowDatePicker(!showDatePicker); }}
              className="px-1.5 py-0.5 rounded bg-gray-700 hover:bg-gray-600 text-[9px] text-gray-300 transition-colors"
              title="Pick a date"
            >
              🗓️
            </button>
          </div>

          {complete && <span className="text-green-400 text-xs">✓</span>}
        </div>

        {/* Feedback toast */}
        {feedback && (
          <div className="absolute right-1 top-full mt-1 z-20 px-2 py-1 rounded-md bg-emerald-600 text-white text-[9px] font-medium shadow-lg animate-pulse whitespace-nowrap">
            {feedback}
          </div>
        )}

        {/* Date picker popover */}
        {showDatePicker && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute right-0 top-full mt-1 z-30 bg-gray-900 border border-gray-700 rounded-lg shadow-xl p-2 flex items-center gap-1"
          >
            <input
              type="date"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-[10px] text-white focus:outline-none focus:border-emerald-500"
            />
            <button
              onClick={scheduleCustom}
              className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-medium"
            >
              Add
            </button>
            <button
              onClick={() => setShowDatePicker(false)}
              className="px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 text-[10px]"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-gray-950 border-r border-gray-800">
      {/* Search & Filter */}
      <div className="p-3 space-y-2 border-b border-gray-800">
        <input
          type="text"
          placeholder="🔍 Search topics..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
        />
        <select
          value={filterSubject}
          onChange={(e) => setFilterSubject(e.target.value)}
          className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-emerald-500"
        >
          <option value="all">All Subjects</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
          ))}
        </select>
      </div>

      {/* Subject List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredSubjects.map((subject) => {
          if (subject.topics.length === 0) return null;
          const isExpanded = expandedSubjects[subject.id];
          const completed = subject.topics.filter(isTopicComplete).length;
          const total = subject.topics.length;

          return (
            <div key={subject.id}>
              <button
                onClick={() => toggleSubject(subject.id)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-800/40 transition-colors text-left"
              >
                <span className="text-sm">{subject.icon}</span>
                <span className="flex-1 text-xs font-semibold text-gray-200 truncate">{subject.name}</span>
                <span className="text-[10px] text-gray-500">{completed}/{total}</span>
                <span className={`text-[10px] transition-transform ${isExpanded ? 'rotate-90' : ''}`}>▶</span>
              </button>

              {isExpanded && (
                <div className="ml-4 space-y-0.5 border-l-2 pl-2" style={{ borderColor: subject.color + '40' }}>
                  {subject.topics.map((topic) => (
                    <TopicCard key={topic.id} topic={topic} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Stats */}
      <div className="p-3 border-t border-gray-800 bg-gray-950">
        <div className="grid grid-cols-3 gap-2 text-center">
          {(() => {
            const totalTopics = subjects.reduce((a, s) => a + s.topics.length, 0);
            const completed = subjects.reduce((a, s) => a + s.topics.filter(isTopicComplete).length, 0);
            const scheduled = subjects.reduce((a, s) => a + s.topics.reduce((b, t) => b + t.scheduledDates.length, 0), 0);
            return (
              <>
                <div>
                  <p className="text-lg font-bold text-white">{totalTopics}</p>
                  <p className="text-[10px] text-gray-500">Total</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-green-400">{completed}</p>
                  <p className="text-[10px] text-gray-500">Done</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-emerald-400">{scheduled}</p>
                  <p className="text-[10px] text-gray-500">Scheduled</p>
                </div>
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
};
