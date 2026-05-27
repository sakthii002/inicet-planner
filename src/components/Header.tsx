import React from 'react';
import { useStore } from '../store';
import type { TabType } from '../types';

const tabs: { key: TabType; label: string; icon: string }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: '📊' },
  { key: 'calendar', label: 'Calendar', icon: '📅' },
  { key: 'subjects', label: 'Subjects', icon: '📚' },
  { key: 'heatmap', label: 'Heatmap', icon: '🗺️' },
  { key: 'analytics', label: 'Analytics', icon: '📈' },
];

export const Header: React.FC = () => {
  const { activeTab, setActiveTab, setShowSprint, setShowPostingsManager, setShowSettings, examDate } = useStore();

  const daysUntil = Math.max(0, Math.ceil((new Date(examDate).getTime() - Date.now()) / 86400000));

  return (
    <header className="sticky top-0 z-50 bg-gray-950/90 backdrop-blur-xl border-b border-gray-800">
      <div className="max-w-[1600px] mx-auto px-4">
        {/* Top Bar */}
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🩺</span>
            <div>
              <h1 className="text-lg font-bold text-white leading-tight">INICET Prep</h1>
              <p className="text-[10px] text-gray-400 leading-tight">Study Command Center</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 bg-gray-800/60 rounded-lg px-3 py-1.5">
              <span className="text-xs text-gray-400">Exam:</span>
              <span className="text-xs font-semibold text-white">{new Date(examDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
              <span className="text-xs font-bold text-amber-400">{daysUntil}d</span>
            </div>

            <button
              onClick={() => setShowPostingsManager(true)}
              className="flex items-center gap-1.5 bg-gray-800/60 hover:bg-gray-700/60 rounded-lg px-3 py-1.5 text-xs text-gray-300 transition-colors"
            >
              <span>🏥</span>
              <span className="hidden sm:inline">Postings</span>
            </button>

            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-1.5 bg-gray-800/60 hover:bg-gray-700/60 rounded-lg px-3 py-1.5 text-xs text-gray-300 transition-colors"
            >
              <span>⚙️</span>
              <span className="hidden sm:inline">Settings</span>
            </button>

            <button
              onClick={() => setShowSprint(true)}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-colors"
            >
              <span>⚡</span>
              <span className="hidden sm:inline">Quick Sprint</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex gap-1 -mb-px overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab.key
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
};
