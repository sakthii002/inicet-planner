import React, { useState } from 'react';
import { useStore } from '../store';
import { v4 as uuidv4 } from 'uuid';
import { Intensity } from '../types';

export const PostingsManager: React.FC = () => {
  const { shifts, addShift, removeShift, showPostingsManager, setShowPostingsManager, dayData, setDayIntensity, setDayShiftHours } = useStore();
  const [postingName, setPostingName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  const handleAdd = () => {
    const errs: string[] = [];
    if (!postingName.trim()) errs.push('Posting name is required');
    if (!startDate) errs.push('Start date is required');
    if (!endDate) errs.push('End date is required');
    if (startDate && endDate && startDate > endDate) errs.push('Start must be before end');
    if (errs.length) { setErrors(errs); return; }
    setErrors([]);
    addShift({ id: uuidv4(), postingName: postingName.trim(), startDate, endDate });
    setPostingName('');
    setStartDate('');
    setEndDate('');
  };

  const autoSetDays = (shift: typeof shifts[0]) => {
    const start = new Date(shift.startDate);
    const end = new Date(shift.endDate);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const dow = d.getDay();
      // Skip weekends for default (they're days off)
      if (dow === 0 || dow === 6) continue;
      const existing = dayData[dateStr];
      if (!existing) {
        setDayIntensity(dateStr, 'red');
        setDayShiftHours(dateStr, 8);
      }
    }
  };

  if (!showPostingsManager) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowPostingsManager(false)}>
      <div className="bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-xl max-h-[80vh] overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h2 className="text-lg font-bold text-white">🏥 Hospital Postings & Shifts</h2>
          <button onClick={() => setShowPostingsManager(false)} className="text-gray-400 hover:text-white text-xl leading-none">&times;</button>
        </div>

        <div className="p-5 overflow-y-auto max-h-[calc(80vh-80px)] space-y-6">
          {/* Add Posting Form */}
          <div className="bg-gray-800/50 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-300">Add Posting</h3>
            {errors.length > 0 && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2">
                {errors.map((e, i) => <p key={i} className="text-xs text-red-400">{e}</p>)}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Posting name (e.g., Medicine Ward)"
                value={postingName}
                onChange={(e) => setPostingName(e.target.value)}
                className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 col-span-2"
              />
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleAdd} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg py-2 transition-colors">
                Add Posting
              </button>
              <button
                onClick={() => {
                  if (postingName && startDate && endDate) {
                    const shift = { id: uuidv4(), postingName, startDate, endDate };
                    autoSetDays(shift);
                    handleAdd();
                  }
                }}
                className="flex-1 bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium rounded-lg py-2 transition-colors"
              >
                Add & Mark Days Red
              </button>
            </div>
          </div>

          {/* Quick Day Intensity */}
          <div className="bg-gray-800/50 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-300">Quick Day Marker</h3>
            <p className="text-xs text-gray-500">Set today's intensity on the calendar, or use this quick tool:</p>
            <div className="flex gap-2">
              {(['red', 'green', 'normal'] as Intensity[]).map((intensity) => (
                <button
                  key={intensity}
                  onClick={() => {
                    const today = new Date().toISOString().split('T')[0];
                    setDayIntensity(today, intensity);
                  }}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                    intensity === 'red' ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' :
                    intensity === 'green' ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' :
                    'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                >
                  {intensity === 'red' ? '🔴 Heavy' : intensity === 'green' ? '🟢 Light' : '⚪ Normal'}
                </button>
              ))}
            </div>
          </div>

          {/* Existing Postings */}
          {shifts.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-300">Active Postings</h3>
              {shifts.map((shift) => (
                <div key={shift.id} className="flex items-center justify-between bg-gray-800/30 rounded-lg px-3 py-2">
                  <div>
                    <p className="text-sm text-white font-medium">{shift.postingName}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(shift.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} — {new Date(shift.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <button
                    onClick={() => removeShift(shift.id)}
                    className="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded hover:bg-red-500/10 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
