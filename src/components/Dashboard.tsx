import React, { useMemo } from 'react';
import { useStore, getTopicProgress, isTopicComplete } from '../store';
import { format, addDays, subDays } from 'date-fns';
import { GoogleSync } from './GoogleSync';

export const Dashboard: React.FC = () => {
  const { subjects, dayData, examDate, sprints, setShowSprint, setActiveTab, setCalendarDate } = useStore();

  const today = new Date().toISOString().split('T')[0];
  const todayData = dayData[today];
  const daysUntilExam = Math.max(0, Math.ceil((new Date(examDate).getTime() - Date.now()) / 86400000));

  const stats = useMemo(() => {
    const totalTopics = subjects.reduce((a, s) => a + s.topics.length, 0);
    const completed = subjects.reduce((a, s) => a + s.topics.filter(isTopicComplete).length, 0);

    const todaySprints = sprints.filter(s => s.date === today);
    const todayMcqs = todaySprints.reduce((a, s) => a + s.mcqs, 0);
    const todayFC = todaySprints.reduce((a, s) => a + s.flashcards, 0);
    const todayMinutes = todaySprints.reduce((a, s) => a + s.durationMinutes, 0);

    // Last 7 days total
    const weekAgo = subDays(new Date(), 7);
    const weekSprints = sprints.filter(s => new Date(s.date) >= weekAgo);
    const weekMcqs = weekSprints.reduce((a, s) => a + s.mcqs, 0);
    const weekMinutes = weekSprints.reduce((a, s) => a + s.durationMinutes, 0);

    // Today's scheduled topics
    const todayTopics = todayData?.scheduledTopicIds || [];

    return {
      totalTopics, completed,
      todayMcqs, todayFC, todayMinutes, weekMcqs, weekMinutes, todayTopics
    };
  }, [subjects, sprints, todayData]);

  // Upcoming scheduled topics (next 7 days)
  const upcomingTopics = useMemo(() => {
    const result: { date: string; topic: import('../types').Topic; subject: import('../types').Subject }[] = [];
    for (let i = 0; i <= 7; i++) {
      const dateStr = format(addDays(new Date(), i), 'yyyy-MM-dd');
      const data = dayData[dateStr];
      if (data?.scheduledTopicIds) {
        data.scheduledTopicIds.forEach((topicId) => {
          for (const s of subjects) {
            const t = s.topics.find((t) => t.id === topicId);
            if (t) { result.push({ date: dateStr, topic: t, subject: s }); break; }
          }
        });
      }
    }
    return result;
  }, [dayData, subjects]);

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-900/40 via-teal-900/30 to-cyan-900/20 rounded-xl p-5 border border-emerald-800/30">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, Doctor 👨‍⚕️</h2>
            <p className="text-sm text-gray-400 mt-1">
              <span className="text-emerald-400 font-bold">{daysUntilExam} days</span> until INICET · Stay focused
            </p>
          </div>
          <button
            onClick={() => setShowSprint(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-3 rounded-xl font-semibold text-sm transition-colors shadow-lg shadow-emerald-900/30"
          >
            <span className="text-lg">⚡</span>
            <div className="text-left">
              <p>Quick Sprint</p>
              <p className="text-[10px] text-emerald-200/60">Start a micro-study session</p>
            </div>
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 text-center">
          <p className="text-2xl font-bold text-white">{stats.completed}<span className="text-sm text-gray-600">/{stats.totalTopics}</span></p>
          <p className="text-[10px] text-gray-500 mt-1">Topics Mastered</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 text-center">
          <p className="text-2xl font-bold text-emerald-400">{stats.todayMinutes}<span className="text-sm text-emerald-600">m</span></p>
          <p className="text-[10px] text-gray-500 mt-1">Today's Study</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 text-center">
          <p className="text-2xl font-bold text-blue-400">{stats.todayMcqs}</p>
          <p className="text-[10px] text-gray-500 mt-1">Today's MCQs</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 text-center">
          <p className="text-2xl font-bold text-amber-400">{stats.weekMcqs}</p>
          <p className="text-[10px] text-gray-500 mt-1">Week MCQs</p>
        </div>
      </div>

      {/* Today Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Today's Schedule */}
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-300">📅 Today's Schedule</h3>
            <button
              onClick={() => { setCalendarDate(today); setActiveTab('calendar'); }}
              className="text-[10px] text-emerald-400 hover:text-emerald-300"
            >
              Open Calendar →
            </button>
          </div>

          {todayData?.intensity && (
            <div className={`text-xs px-3 py-2 rounded-lg mb-3 ${
              todayData.intensity === 'red' ? 'bg-red-500/10 text-red-400' :
              todayData.intensity === 'green' ? 'bg-green-500/10 text-green-400' :
              'bg-gray-800 text-gray-400'
            }`}>
              {todayData.intensity === 'red' ? '🔴 Heavy posting day' :
               todayData.intensity === 'green' ? '🟢 Light day - great for study!' :
               '⚪ Normal day'}
              {todayData.shiftHours > 0 && ` · ${todayData.shiftHours}h shift`}
            </div>
          )}

          {stats.todayTopics.length > 0 ? (
            <div className="space-y-1.5">
              {stats.todayTopics.map((topicId) => {
                let topic: import('../types').Topic | undefined;
                let subject: import('../types').Subject | undefined;
                for (const s of subjects) {
                  topic = s.topics.find((t) => t.id === topicId);
                  if (topic) { subject = s; break; }
                }
                if (!topic || !subject) return null;
                return (
                  <div
                    key={topicId}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-800/50 rounded-lg"
                    style={{ borderLeft: `3px solid ${subject.color}` }}
                  >
                    <span>{subject.icon}</span>
                    <span className="text-xs text-gray-200 flex-1 truncate">{topic.name}</span>
                    <span className="text-[10px] text-gray-500">{getTopicProgress(topic)}%</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-gray-600 text-center py-4">No topics scheduled today. Drag topics from the Calendar view!</p>
          )}
        </div>

        {/* Upcoming Topics */}
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">📋 Upcoming (Next 7 Days)</h3>
          {upcomingTopics.length > 0 ? (
            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {upcomingTopics.slice(0, 10).map((item, idx) => (
                <div key={`${item.topic.id}-${item.date}`} className="flex items-center gap-2 px-3 py-2 bg-gray-800/30 rounded-lg">
                  <span className="text-[10px] text-gray-500 w-14">
                    {idx === 0 ? 'Today' : format(new Date(item.date), 'MMM d')}
                  </span>
                  <span>{item.subject.icon}</span>
                  <span className="text-xs text-gray-300 flex-1 truncate">{item.topic.name}</span>
                </div>
              ))}
              {upcomingTopics.length > 10 && (
                <p className="text-[10px] text-gray-600 text-center py-2">+{upcomingTopics.length - 10} more...</p>
              )}
            </div>
          ) : (
            <p className="text-xs text-gray-600 text-center py-4">No upcoming topics. Start scheduling in the Calendar view!</p>
          )}
        </div>
      </div>

      {/* Quick Subject Overview */}
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">📚 Subject Progress</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {subjects.map((s) => {
            const avg = s.topics.reduce((a, t) => a + getTopicProgress(t), 0) / s.topics.length;
            return (
              <button
                key={s.id}
                onClick={() => { setActiveTab('subjects'); }}
                className="bg-gray-800/50 rounded-xl p-3 text-center hover:bg-gray-800 transition-colors group"
              >
                <span className="text-xl block mb-1">{s.icon}</span>
                <p className="text-[10px] text-gray-300 font-medium truncate">{s.name}</p>
                <div className="mt-1.5 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${avg}%`, backgroundColor: s.color }} />
                </div>
                <p className="text-[10px] mt-0.5 font-bold" style={{ color: s.color }}>{Math.round(avg)}%</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Google Calendar Sync */}
      <GoogleSync />
    </div>
  );
};
