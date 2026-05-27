import React from 'react';
import { useStore } from '../store';

export const SettingsModal: React.FC = () => {
  const { showSettings, setShowSettings, examDate, setExamDate, dailyStudyGoalHours, setDailyGoal, resetAllData } = useStore();

  if (!showSettings) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowSettings(false)}>
      <div className="bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-md shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h2 className="text-lg font-bold text-white">⚙️ Settings</h2>
          <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-white text-xl leading-none">&times;</button>
        </div>

        <div className="p-5 space-y-5">
          {/* Exam Date */}
          <div>
            <label className="text-sm text-gray-300 font-medium mb-2 block">INICET Exam Date</label>
            <input
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
            <p className="text-[10px] text-gray-500 mt-1">
              {Math.max(0, Math.ceil((new Date(examDate).getTime() - Date.now()) / 86400000))} days from today
            </p>
          </div>

          {/* Daily Goal */}
          <div>
            <label className="text-sm text-gray-300 font-medium mb-2 block">Daily Study Goal (hours)</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={1}
                max={12}
                value={dailyStudyGoalHours}
                onChange={(e) => setDailyGoal(parseInt(e.target.value))}
                className="flex-1 accent-emerald-500"
              />
              <span className="text-lg font-bold text-emerald-400 w-8 text-center">{dailyStudyGoalHours}h</span>
            </div>
          </div>

          {/* Data Management */}
          <div className="border-t border-gray-800 pt-5 space-y-2">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Data Management</h3>
            <button
              onClick={() => {
                if (window.confirm('Clear all topics but keep subjects? Your progress, schedules, and sprints will be kept.')) {
                  useStore.setState((state) => ({
                    subjects: state.subjects.map((s) => ({ ...s, topics: [] })),
                    dayData: Object.fromEntries(
                      Object.entries(state.dayData).map(([k, v]) => [k, { ...v, scheduledTopicIds: [] }])
                    ),
                  }));
                  setShowSettings(false);
                }
              }}
              className="w-full px-4 py-2.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-lg text-sm hover:bg-amber-500/20 transition-colors"
            >
              🧹 Clear All Topics (Keep Subjects)
            </button>
            <button
              onClick={() => {
                if (window.confirm('Clear all subjects AND topics? Your shifts, days, and sprints will be kept.')) {
                  useStore.setState({ subjects: [] });
                  setShowSettings(false);
                }
              }}
              className="w-full px-4 py-2.5 bg-orange-500/10 border border-orange-500/30 text-orange-400 rounded-lg text-sm hover:bg-orange-500/20 transition-colors"
            >
              🧹 Clear Subjects & Topics
            </button>
            <button
              onClick={() => {
                if (window.confirm('Are you sure? This will delete ALL your data including progress, schedules, and sprints.')) {
                  resetAllData();
                  setShowSettings(false);
                }
              }}
              className="w-full px-4 py-2.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-sm hover:bg-red-500/20 transition-colors"
            >
              🗑️ Reset All Data
            </button>
            <p className="text-[10px] text-gray-600 mt-2 text-center">All data is stored locally in your browser</p>
          </div>
        </div>
      </div>
    </div>
  );
};
