import React from 'react';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  startOfWeek, endOfWeek, addMonths, subMonths,
  addWeeks, subWeeks, addDays, subDays, isSameMonth, isToday,
} from 'date-fns';
import { useStore, getDayBlockTotals } from '../store';
import { Intensity, Topic, Subject } from '../types';
import { DayTimeline } from './DayTimeline';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function findTopic(subjects: Subject[], topicId: string): { topic: Topic; subject: Subject } | null {
  for (const s of subjects) {
    const t = s.topics.find((t) => t.id === topicId);
    if (t) return { topic: t, subject: s };
  }
  return null;
}

function getPostingForDate(shifts: import('../types').Shift[], dateStr: string): string | null {
  const d = new Date(dateStr);
  for (const shift of shifts) {
    const start = new Date(shift.startDate);
    const end = new Date(shift.endDate);
    if (d >= start && d <= end) return shift.postingName;
  }
  return null;
}

export const CalendarView: React.FC = () => {
  const { calendarDate, calendarView, setCalendarDate, setCalendarView } = useStore();
  const currentDate = new Date(calendarDate);

  const navigate = (dir: number) => {
    if (calendarView === 'monthly') setCalendarDate(dir > 0 ? addMonths(currentDate, 1).toISOString().split('T')[0] : subMonths(currentDate, 1).toISOString().split('T')[0]);
    else if (calendarView === 'weekly') setCalendarDate(dir > 0 ? addWeeks(currentDate, 1).toISOString().split('T')[0] : subWeeks(currentDate, 1).toISOString().split('T')[0]);
    else setCalendarDate(dir > 0 ? addDays(currentDate, 1).toISOString().split('T')[0] : subDays(currentDate, 1).toISOString().split('T')[0]);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-800 bg-gray-950">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 transition-colors">◀</button>
          <button onClick={() => setCalendarDate(new Date().toISOString().split('T')[0])} className="px-2 py-1 rounded-lg bg-gray-800 text-gray-300 text-xs hover:bg-gray-700 transition-colors">Today</button>
          <button onClick={() => navigate(1)} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 transition-colors">▶</button>
          <h2 className="text-sm font-bold text-white ml-2">
            {calendarView === 'monthly' && `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
            {calendarView === 'weekly' && (() => {
              const start = startOfWeek(currentDate);
              const end = endOfWeek(currentDate);
              return `${format(start, 'MMM d')} — ${format(end, 'MMM d, yyyy')}`;
            })()}
            {calendarView === 'daily' && format(currentDate, 'EEEE, MMMM d, yyyy')}
          </h2>
        </div>

        <div className="flex bg-gray-800/60 rounded-lg p-0.5">
          {(['monthly', 'weekly', 'daily'] as const).map((view) => (
            <button key={view} onClick={() => setCalendarView(view)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize ${calendarView === view ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}>
              {view}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-hidden bg-gray-950">
        {calendarView === 'monthly' && <MonthlyCalendar />}
        {calendarView === 'weekly' && <WeeklyCalendar />}
        {calendarView === 'daily' && <DailyCalendar />}
      </div>
    </div>
  );
};

// ─── Monthly View ─────────────────────────────────────────────

const MonthlyCalendar: React.FC = () => {
  const { calendarDate, dayData, subjects, setDayIntensity, setSelectedTopicId, removeTopicFromDate, shifts } = useStore();
  const current = new Date(calendarDate);
  const monthStart = startOfMonth(current);
  const monthEnd = endOfMonth(current);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const allDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  return (
    <div className="h-full flex flex-col">
      <div className="grid grid-cols-7 border-b border-gray-800 bg-gray-950">
        {DAYS.map((d) => (
          <div key={d} className="py-2 text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{d}</div>
        ))}
      </div>
      <div className="flex-1 grid grid-cols-7 grid-rows-6 overflow-hidden">
        {allDays.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const data = dayData[dateStr];
          const intensity = data?.intensity || 'normal';
          const inMonth = isSameMonth(day, current);
          const posting = getPostingForDate(shifts, dateStr);

          return (
            <div key={dateStr}
              className={`relative border-b border-r border-gray-800/50 p-1 overflow-hidden transition-all ${
                !inMonth ? 'bg-gray-950/50' :
                intensity === 'red' ? 'bg-red-950/30 hover:bg-red-950/50' :
                intensity === 'green' ? 'bg-green-950/30 hover:bg-green-950/50' :
                isToday(day) ? 'bg-emerald-950/20' : 'hover:bg-gray-900/50'
              }`}>
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-medium ${!inMonth ? 'text-gray-700' : isToday(day) ? 'text-emerald-400 font-bold' : 'text-gray-400'}`}>
                  {format(day, 'd')}
                </span>
                {inMonth && (
                  <button onClick={(e) => {
                    e.stopPropagation();
                    const next: Record<string, Intensity> = { normal: 'red', red: 'green', green: 'normal' };
                    setDayIntensity(dateStr, next[intensity]);
                  }} className={`w-2 h-2 rounded-full transition-colors ${intensity === 'red' ? 'bg-red-500' : intensity === 'green' ? 'bg-green-500' : 'bg-gray-600'}`} />
                )}
              </div>

              {/* Posting name */}
              {posting && inMonth && (
                <div className="text-[8px] text-amber-400/80 truncate mt-0.5">🏥 {posting}</div>
              )}

              {/* Derived shift & study hours from blocks */}
              {inMonth && (() => {
                const t = getDayBlockTotals(data?.blocks);
                const sh = Math.round((t.shift / 60) * 10) / 10;
                const st = Math.round((t.study / 60) * 10) / 10;
                if (sh === 0 && st === 0) return null;
                return (
                  <div className="text-[8px] flex gap-1.5">
                    {sh > 0 && <span className="text-amber-400/80">🏥{sh}h</span>}
                    {st > 0 && <span className="text-emerald-400/80">📚{st}h</span>}
                  </div>
                );
              })()}

              {/* Sprint indicator */}
              {data && data.sprintMinutes > 0 && inMonth && (
                <div className="text-[8px] text-cyan-400/80">⚡{data.sprintMinutes}m</div>
              )}

              {/* Topics */}
              <div className="mt-0.5 space-y-0.5 overflow-hidden">
                {(data?.scheduledTopicIds || []).slice(0, 3).map((topicId) => {
                  const found = findTopic(subjects, topicId);
                  if (!found) return null;
                  return (
                    <div key={topicId} onClick={() => setSelectedTopicId(topicId)}
                      className="group flex items-center gap-1 text-[9px] px-1 py-0.5 rounded truncate cursor-pointer hover:opacity-80"
                      style={{ backgroundColor: found.subject.color + '30', color: found.subject.color }}>
                      <span className="truncate flex-1">{found.topic.name}</span>
                      <button onClick={(e) => { e.stopPropagation(); removeTopicFromDate(topicId, dateStr); }}
                        className="opacity-0 group-hover:opacity-100 text-[10px] leading-none">×</button>
                    </div>
                  );
                })}
                {(data?.scheduledTopicIds || []).length > 3 && (
                  <div className="text-[8px] text-gray-600 pl-1">+{(data?.scheduledTopicIds || []).length - 3} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Weekly View ──────────────────────────────────────────────

const WeeklyCalendar: React.FC = () => {
  const { calendarDate, dayData, subjects, setDayIntensity, setSelectedTopicId, removeTopicFromDate, shifts } = useStore();
  const current = new Date(calendarDate);
  const weekStart = startOfWeek(current);
  const weekEnd = endOfWeek(current);
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Weekly totals
  const weeklyTotals = days.reduce((acc, day) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const t = getDayBlockTotals(dayData[dateStr]?.blocks);
    acc.shift += t.shift;
    acc.study += t.study;
    acc.sprint += dayData[dateStr]?.sprintMinutes || 0;
    return acc;
  }, { shift: 0, study: 0, sprint: 0 });

  return (
    <div className="h-full flex flex-col">
      {/* Weekly totals strip */}
      <div className="flex items-center justify-center gap-4 py-1.5 px-3 bg-gray-900 border-b border-gray-800 text-[10px]">
        <span className="text-gray-500">Week totals:</span>
        <span className="text-amber-400">🏥 {Math.round(weeklyTotals.shift / 60 * 10) / 10}h shift</span>
        <span className="text-emerald-400">📚 {Math.round(weeklyTotals.study / 60 * 10) / 10}h study</span>
        <span className="text-cyan-400">⚡ {weeklyTotals.sprint}m sprints</span>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-gray-800">
        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const intensity = dayData[dateStr]?.intensity || 'normal';
          const posting = getPostingForDate(shifts, dateStr);
          const t = getDayBlockTotals(dayData[dateStr]?.blocks);
          const shiftH = Math.round((t.shift / 60) * 10) / 10;
          const studyH = Math.round((t.study / 60) * 10) / 10;
          return (
            <div key={dateStr} className={`py-2 text-center border-r border-gray-800 last:border-r-0 ${
              intensity === 'red' ? 'bg-red-950/20' : intensity === 'green' ? 'bg-green-950/20' : isToday(day) ? 'bg-emerald-950/20' : ''
            }`}>
              <p className="text-[10px] text-gray-500 uppercase">{format(day, 'EEE')}</p>
              <p className={`text-sm font-bold ${isToday(day) ? 'text-emerald-400' : 'text-white'}`}>{format(day, 'd')}</p>
              {posting && <p className="text-[8px] text-amber-400/70 truncate px-1">🏥 {posting}</p>}
              {/* Hours summary */}
              <div className="flex items-center justify-center gap-1.5 mt-0.5">
                {shiftH > 0 && <span className="text-[9px] text-amber-400 font-semibold">🏥{shiftH}h</span>}
                {studyH > 0 && <span className="text-[9px] text-emerald-400 font-semibold">📚{studyH}h</span>}
              </div>
              <button onClick={() => {
                const next: Record<string, Intensity> = { normal: 'red', red: 'green', green: 'normal' };
                setDayIntensity(dateStr, next[intensity]);
              }} className={`w-2 h-2 rounded-full mx-auto mt-1 ${intensity === 'red' ? 'bg-red-500' : intensity === 'green' ? 'bg-green-500' : 'bg-gray-600'}`} />
            </div>
          );
        })}
      </div>

      <div className="flex-1 grid grid-cols-7 divide-x divide-gray-800 overflow-y-auto">
        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const data = dayData[dateStr];
          const hasSprint = data && data.sprintMinutes > 0;
          const hasMcqs = data && data.mcqsCompleted > 0;
          const hasFlash = data && data.flashcardsCompleted > 0;

          return (
            <div
              key={dateStr}
              className="p-2 min-h-0 space-y-1.5 transition-all"
            >
              {/* Sprint summary */}
              {hasSprint && (
                <div className="text-[10px] bg-cyan-500/10 text-cyan-400 px-2 py-1 rounded-lg">
                  ⚡ {data.sprintMinutes}m sprints
                  {(hasMcqs || hasFlash) && (
                    <span className="block text-[9px] opacity-70 mt-0.5">
                      {hasMcqs ? `${data.mcqsCompleted} MCQs` : ''}
                      {hasMcqs && hasFlash ? ' · ' : ''}
                      {hasFlash ? `${data.flashcardsCompleted} FC` : ''}
                    </span>
                  )}
                </div>
              )}

              {/* Time blocks preview with duration */}
              {(data?.blocks || []).slice(0, 4).map((block) => {
                const emoji = block.type === 'shift' ? '🏥' : block.type === 'study' ? '📚' : block.type === 'break' ? '☕' : '😴';
                const dur = Math.max(0, block.endMinutes - block.startMinutes);
                const h = Math.floor(dur / 60);
                const m = dur % 60;
                const durStr = h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ''}` : `${m}m`;
                return (
                  <div key={block.id} className={`text-[9px] px-2 py-1 rounded-lg flex items-center justify-between ${
                    block.type === 'shift' ? 'bg-amber-500/10 text-amber-400' :
                    block.type === 'study' ? 'bg-emerald-500/10 text-emerald-400' :
                    block.type === 'break' ? 'bg-blue-500/10 text-blue-400' :
                    'bg-indigo-500/10 text-indigo-400'
                  }`}>
                    <span className="truncate flex-1">{emoji} {block.label}</span>
                    <span className="opacity-70 ml-1 flex-shrink-0">{durStr}</span>
                  </div>
                );
              })}
              {(data?.blocks?.length || 0) > 4 && (
                <p className="text-[9px] text-gray-600 text-center">+{(data?.blocks?.length || 0) - 4} more blocks</p>
              )}

              {/* Topics */}
              {(data?.scheduledTopicIds || []).map((topicId) => {
                const found = findTopic(subjects, topicId);
                if (!found) return null;
                return (
                  <div key={topicId} onClick={() => setSelectedTopicId(topicId)}
                    className="group relative text-[10px] px-2 py-1.5 rounded-lg cursor-pointer hover:opacity-80 transition-colors"
                    style={{ backgroundColor: found.subject.color + '25', color: found.subject.color, borderLeft: `3px solid ${found.subject.color}` }}>
                    <p className="font-medium truncate">{found.subject.icon} {found.topic.name}</p>
                    <button onClick={(e) => { e.stopPropagation(); removeTopicFromDate(topicId, dateStr); }}
                      className="absolute top-0.5 right-1 opacity-0 group-hover:opacity-100 text-red-400 text-[10px]">×</button>
                  </div>
                );
              })}

              {!data?.scheduledTopicIds?.length && !data?.blocks?.length && (
                <div className="text-[10px] text-gray-700 text-center py-8 border-2 border-dashed border-gray-800 rounded-lg">Drop topics here</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Daily View ───────────────────────────────────────────────

const DailyCalendar: React.FC = () => {
  const { calendarDate, dayData, subjects, setDayIntensity, setSelectedTopicId, removeTopicFromDate, shifts } = useStore();
  const dateStr = calendarDate;
  const data = dayData[dateStr] || { date: dateStr, intensity: 'normal', shiftHours: 0, scheduledTopicIds: [], mcqsCompleted: 0, flashcardsCompleted: 0, sprintMinutes: 0 };
  const day = new Date(dateStr);
  const posting = getPostingForDate(shifts, dateStr);
  const totals = getDayBlockTotals(data.blocks);
  const shiftHours = Math.round((totals.shift / 60) * 10) / 10;
  const studyHours = Math.round((totals.study / 60) * 10) / 10;

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {/* Day Header */}
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <p className="text-xs text-gray-500">{format(day, 'EEEE')}</p>
            <h2 className="text-xl font-bold text-white">{format(day, 'MMMM d, yyyy')}</h2>
            {posting && <p className="text-xs text-amber-400 mt-1">🏥 {posting}</p>}
          </div>
          <div className="flex items-center gap-2">
            {(['normal', 'red', 'green'] as Intensity[]).map((intensity) => (
              <button key={intensity} onClick={() => setDayIntensity(dateStr, intensity)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  data.intensity === intensity
                    ? intensity === 'red' ? 'bg-red-500 text-white' : intensity === 'green' ? 'bg-green-500 text-white' : 'bg-gray-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}>
                {intensity === 'red' ? '🔴 Heavy' : intensity === 'green' ? '🟢 Light' : '⚪ Normal'}
              </button>
            ))}
          </div>
        </div>
        <p className="text-[10px] text-gray-500 mt-2">💡 Shift & study hours are computed automatically from your timeline blocks below</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-gray-900 rounded-xl p-3 text-center border border-gray-800">
          <p className="text-2xl font-bold text-amber-400">{shiftHours}<span className="text-sm text-amber-600">h</span></p>
          <p className="text-[10px] text-gray-500">🏥 Hospital</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-3 text-center border border-gray-800">
          <p className="text-2xl font-bold text-emerald-400">{studyHours}<span className="text-sm text-emerald-600">h</span></p>
          <p className="text-[10px] text-gray-500">📚 Study (planned)</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-3 text-center border border-gray-800">
          <p className="text-2xl font-bold text-cyan-400">{data.sprintMinutes || 0}<span className="text-sm text-cyan-600">m</span></p>
          <p className="text-[10px] text-gray-500">⚡ Sprints logged</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-3 text-center border border-gray-800">
          <p className="text-2xl font-bold text-blue-400">{data.mcqsCompleted || 0}</p>
          <p className="text-[10px] text-gray-500">MCQs Done</p>
        </div>
      </div>

      {/* 24h Timeline */}
      <DayTimeline dateStr={dateStr} />

      {/* Scheduled Topics */}
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">📚 Scheduled Topics</h3>
        <p className="text-[10px] text-gray-500 mb-3">Use the 📅 button on any topic (Subjects tab or sidebar) to schedule it here.</p>

        {data.scheduledTopicIds.length > 0 ? (
          <div className="space-y-2">
            {data.scheduledTopicIds.map((topicId) => {
              const found = findTopic(subjects, topicId);
              if (!found) return null;
              return (
                <div key={topicId} className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: found.subject.color + '15' }}>
                  <span className="text-lg">{found.subject.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{found.topic.name}</p>
                    <p className="text-[10px] text-gray-500">{found.subject.name}</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => setSelectedTopicId(topicId)}
                      className="text-[10px] bg-gray-800 text-gray-300 px-2 py-1 rounded hover:bg-gray-700">Details</button>
                    <button onClick={() => removeTopicFromDate(topicId, dateStr)}
                      className="text-[10px] bg-red-500/20 text-red-400 px-2 py-1 rounded hover:bg-red-500/30">Remove</button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-gray-600 text-center py-4">No topics scheduled for this day</p>
        )}
      </div>
    </div>
  );
};
