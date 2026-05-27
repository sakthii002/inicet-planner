import React, { useMemo } from 'react';
import { useStore, getTopicProgress } from '../store';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { format, eachDayOfInterval, addDays, differenceInDays } from 'date-fns';

export const Analytics: React.FC = () => {
  const { dayData, examDate, subjects } = useStore();

  // ─── Bandwidth Forecaster ───────────────────────────────────
  const forecast = useMemo(() => {
    const todayDate = new Date();
    const examDateObj = new Date(examDate);
    const daysUntilExam = Math.max(1, Math.ceil(differenceInDays(examDateObj, todayDate)));

    let totalAvailableHours = 0;
    let redDays = 0;
    let greenDays = 0;
    let normalDays = 0;

    for (let i = 0; i < daysUntilExam; i++) {
      const dateStr = format(addDays(todayDate, i), 'yyyy-MM-dd');
      const dow = addDays(todayDate, i).getDay();
      const day = dayData[dateStr];
      const intensity = day?.intensity || 'normal';
      const shiftHours = day?.shiftHours || (dow === 0 || dow === 6 ? 0 : 6);

      if (intensity === 'red') { redDays++; totalAvailableHours += Math.max(0.5, 3 - shiftHours * 0.3); }
      else if (intensity === 'green') { greenDays++; totalAvailableHours += 6; }
      else { normalDays++; totalAvailableHours += Math.max(1, 5 - shiftHours * 0.4); }
    }

    const totalTopics = subjects.reduce((a, s) => a + s.topics.length, 0);
    const completedTopics = subjects.reduce((a, s) => a + s.topics.filter(t => t.checklist.learn && t.checklist.pyq && t.checklist.flashcards).length, 0);
    const remainingTopics = totalTopics - completedTopics;
    const hoursPerTopic = totalAvailableHours / Math.max(1, remainingTopics);
    const dailyAvg = totalAvailableHours / Math.max(1, daysUntilExam);

    return {
      daysUntilExam,
      totalAvailableHours: Math.round(totalAvailableHours * 10) / 10,
      redDays,
      greenDays,
      normalDays,
      totalTopics,
      completedTopics,
      remainingTopics,
      hoursPerTopic: Math.round(hoursPerTopic * 100) / 100,
      dailyAvg: Math.round(dailyAvg * 10) / 10,
    };
  }, [dayData, examDate, subjects]);

  // ─── Dual-axis chart data ──────────────────────────────────
  const chartData = useMemo(() => {
    const last30 = eachDayOfInterval({ start: addDays(new Date(), -29), end: new Date() });
    return last30.map((day) => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const d = dayData[dateStr];
      return {
        date: format(day, 'MMM d'),
        hospitalHours: d?.shiftHours || 0,
        studyMinutes: d?.sprintMinutes || 0,
        mcqs: d?.mcqsCompleted || 0,
      };
    });
  }, [dayData]);

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {/* Forecaster Card */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 rounded-xl p-5 border border-gray-800">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">🔮</span>
          <div>
            <h2 className="text-lg font-bold text-white">Bandwidth Forecaster</h2>
            <p className="text-xs text-gray-500">Real available study hours, not just a countdown</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
          <div className="bg-gray-800/60 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-white">{forecast.daysUntilExam}</p>
            <p className="text-[10px] text-gray-500 mt-1">Days Until Exam</p>
          </div>
          <div className="bg-gray-800/60 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-emerald-400">{forecast.totalAvailableHours}h</p>
            <p className="text-[10px] text-gray-500 mt-1">Est. Study Hours</p>
          </div>
          <div className="bg-gray-800/60 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-amber-400">{forecast.dailyAvg}h</p>
            <p className="text-[10px] text-gray-500 mt-1">Daily Average</p>
          </div>
          <div className="bg-gray-800/60 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-red-400">{forecast.hoursPerTopic}h</p>
            <p className="text-[10px] text-gray-500 mt-1">Hrs per Topic</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-red-950/30 border border-red-800/40 rounded-lg p-3 text-center">
            <p className="text-xl font-bold text-red-400">{forecast.redDays}</p>
            <p className="text-[10px] text-red-400/60">🔴 Heavy Days</p>
          </div>
          <div className="bg-green-950/30 border border-green-800/40 rounded-lg p-3 text-center">
            <p className="text-xl font-bold text-green-400">{forecast.greenDays}</p>
            <p className="text-[10px] text-green-400/60">🟢 Light Days</p>
          </div>
          <div className="bg-gray-800/30 border border-gray-700/40 rounded-lg p-3 text-center">
            <p className="text-xl font-bold text-gray-400">{forecast.normalDays}</p>
            <p className="text-[10px] text-gray-400/60">⚪ Normal Days</p>
          </div>
        </div>

        <div className="flex items-center justify-between bg-gray-800/40 rounded-lg px-4 py-3">
          <span className="text-sm text-gray-400">Topics remaining</span>
          <span className="text-sm font-bold text-white">
            <span className="text-red-400">{forecast.remainingTopics}</span>
            <span className="text-gray-600"> / {forecast.totalTopics}</span>
          </span>
        </div>
      </div>

      {/* Burnout Chart */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">📊</span>
          <div>
            <h2 className="text-lg font-bold text-white">Workload vs Study Volume</h2>
            <p className="text-xs text-gray-500">Last 30 days — Hospital hours vs Study output</p>
          </div>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#6b7280" tick={{ fontSize: 10 }} />
              <YAxis yAxisId="left" stroke="#f59e0b" tick={{ fontSize: 10 }} />
              <YAxis yAxisId="right" orientation="right" stroke="#10b981" tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', fontSize: '12px' }}
                labelStyle={{ color: '#9ca3af' }}
              />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="hospitalHours"
                stroke="#f59e0b"
                fill="#f59e0b"
                fillOpacity={0.15}
                name="Hospital Hours"
              />
              <Area
                yAxisId="right"
                type="monotone"
                dataKey="studyMinutes"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.15}
                name="Study Minutes"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center justify-center gap-6 mt-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-amber-500/30 border border-amber-500" />
            <span className="text-[10px] text-gray-400">Hospital Hours</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-emerald-500/30 border border-emerald-500" />
            <span className="text-[10px] text-gray-400">Study Minutes</span>
          </div>
        </div>
      </div>

      {/* MCQ Progress Bar Chart */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">🎯</span>
          <div>
            <h2 className="text-lg font-bold text-white">Daily MCQ Output</h2>
            <p className="text-xs text-gray-500">Last 30 days</p>
          </div>
        </div>

        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#6b7280" tick={{ fontSize: 10 }} />
              <YAxis stroke="#6b7280" tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', fontSize: '12px' }}
              />
              <Bar dataKey="mcqs" fill="#8b5cf6" radius={[3, 3, 0, 0]} name="MCQs" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Subject Progress Summary */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
        <h2 className="text-lg font-bold text-white mb-4">📚 Subject Progress</h2>
        <div className="space-y-3">
          {subjects
            .map((s) => {
              const avg = s.topics.reduce((a, t) => a + getTopicProgress(t), 0) / s.topics.length;
              return { ...s, avgProgress: avg };
            })
            .sort((a, b) => b.avgProgress - a.avgProgress)
            .map((s) => (
              <div key={s.id} className="flex items-center gap-3">
                <span className="text-sm w-6 text-center">{s.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-300 truncate">{s.name}</span>
                    <span className="text-xs font-bold" style={{ color: s.color }}>{Math.round(s.avgProgress)}%</span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${s.avgProgress}%`, backgroundColor: s.color }}
                    />
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};
