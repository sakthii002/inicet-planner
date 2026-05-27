import React, { useState } from 'react';
import { useStore } from '../store';
import { Subject, Topic } from '../types';
import { v4 as uuidv4 } from 'uuid';

// ─── Topic Card sub-component ─────────────────────────────────
const TopicCard: React.FC<{
  topic: Topic;
  subject: Subject;
  progress: number;
  onEdit: () => void;
  onDelete: () => void;
  onSelect: () => void;
  onScheduleToday: () => void;
}> = ({ topic, subject, progress, onEdit, onDelete, onSelect, onScheduleToday }) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().split('T')[0]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const { addTopicToDate } = useStore();

  const flash = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 1200);
  };

  const handleToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    onScheduleToday();
    flash('✓ Added to today');
  };

  const handleCustom = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addTopicToDate(topic.id, scheduleDate);
    setShowDatePicker(false);
    flash(`✓ Added ${scheduleDate}`);
  };

  return (
    <div className="group relative">
      <div
        className="relative flex items-start gap-2 p-3 rounded-lg bg-gray-800/40 hover:bg-gray-800/70 transition-colors cursor-pointer"
        style={{ borderLeft: `3px solid ${subject.color}` }}
        onClick={onSelect}
      >
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-200 truncate">{topic.name}</p>
          <div className="flex items-center gap-1 mt-1 flex-wrap">
            <span className={`text-[9px] px-1.5 py-0.5 rounded ${topic.checklist.learn ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-500'}`}>L</span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded ${topic.checklist.pyq ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-500'}`}>P</span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded ${topic.checklist.flashcards ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-500'}`}>F</span>
          </div>
        </div>

        <div className="flex flex-col gap-0.5 items-end flex-shrink-0">
          {progress === 3 && <span className="text-green-400 text-xs">✓</span>}
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleToday}
              className="px-1.5 py-0.5 rounded bg-gray-700 hover:bg-emerald-600 text-[9px] text-gray-300 hover:text-white"
              title="Schedule for today"
            >
              📅 Today
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setShowDatePicker(!showDatePicker); }}
              className="px-1.5 py-0.5 rounded bg-gray-700 hover:bg-gray-600 text-[9px] text-gray-300"
              title="Pick a date"
            >
              🗓️
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="text-gray-500 hover:text-emerald-400 text-xs px-1"
              title="Edit"
            >
              ✏️
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); if (window.confirm(`Delete topic "${topic.name}"?`)) onDelete(); }}
              className="text-gray-500 hover:text-red-400 text-xs px-1"
              title="Delete"
            >
              🗑
            </button>
          </div>
        </div>
      </div>

      {/* Feedback toast */}
      {feedback && (
        <div className="absolute right-1 top-full mt-1 z-30 px-2 py-1 rounded-md bg-emerald-600 text-white text-[9px] font-medium shadow-lg whitespace-nowrap">
          {feedback}
        </div>
      )}

      {/* Date picker popover */}
      {showDatePicker && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute right-2 top-full mt-1 z-40 bg-gray-900 border border-gray-700 rounded-lg shadow-xl p-2 flex items-center gap-1"
        >
          <input
            type="date"
            value={scheduleDate}
            onChange={(e) => setScheduleDate(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-[10px] text-white focus:outline-none focus:border-emerald-500"
          />
          <button
            onClick={handleCustom}
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

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f43f5e', '#3b82f6', '#d946ef', '#a855f7',
  '#0ea5e9', '#6366f1', '#f59e0b', '#10b981', '#84cc16', '#78716c',
];

const PRESET_ICONS = ['📚', '🩺', '🦴', '🫀', '🧪', '🔬', '💊', '🦠', '⚖️', '🏥', '🔪', '🤰', '👶', '🦿', '👁️', '👂', '🧠', '📡', '💨', '🩻', '🧬', '🦷', '👨‍⚕️', '🩸'];

export const SubjectsManager: React.FC = () => {
  const { subjects, setSelectedTopicId, addSubject, updateSubject, deleteSubject, addTopic, updateTopic, deleteTopic, addTopicToDate } = useStore();
  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [editingTopic, setEditingTopic] = useState<{ topic: Topic; subjectId: string } | null>(null);
  const [showNewSubject, setShowNewSubject] = useState(false);
  const [addingTopicTo, setAddingTopicTo] = useState<string | null>(null);
  const [newTopicName, setNewTopicName] = useState('');
  const filteredSubjects = subjects.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.topics.some((t) => t.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddTopic = (subjectId: string) => {
    if (!newTopicName.trim()) return;
    addTopic(subjectId, {
      id: uuidv4(),
      name: newTopicName.trim(),
      subjectId,
      checklist: { learn: false, pyq: false, flashcards: false },
      scheduledDates: [],
    });
    setNewTopicName('');
    setAddingTopicTo(null);
  };

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {/* Header */}
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-bold text-white">📚 Subjects & Topics</h2>
            <p className="text-xs text-gray-500">Click pencil to edit · Drag topics to calendar</p>
          </div>
          <button
            onClick={() => setShowNewSubject(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg transition-colors"
          >
            <span>+</span> New Subject
          </button>
        </div>
        <input
          type="text"
          placeholder="🔍 Search subjects or topics..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* Subject Cards */}
      <div className="space-y-3">
        {filteredSubjects.length === 0 && (
          <div className="bg-gray-900 rounded-xl p-8 text-center border border-gray-800 border-dashed">
            <p className="text-sm text-gray-500">No subjects yet. Click "New Subject" to create one!</p>
          </div>
        )}

        {filteredSubjects.map((subject) => {
          const isExpanded = expandedSubjects[subject.id];
          const completed = subject.topics.filter((t) => t.checklist.learn && t.checklist.pyq && t.checklist.flashcards).length;

          return (
            <div key={subject.id} className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
              {/* Subject Header */}
              <div className="flex items-center gap-3 p-4 hover:bg-gray-800/30 transition-colors">
                <button
                  onClick={() => setExpandedSubjects((prev) => ({ ...prev, [subject.id]: !prev[subject.id] }))}
                  className="flex items-center gap-3 flex-1 text-left"
                >
                  <span className="text-2xl">{subject.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-white">{subject.name}</h3>
                      <span className="text-xs text-gray-400">{completed}/{subject.topics.length}</span>
                    </div>
                    <div className="mt-2 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: subject.topics.length > 0 ? `${(completed / subject.topics.length) * 100}%` : '0%',
                          backgroundColor: subject.color,
                        }}
                      />
                    </div>
                  </div>
                  <span className={`text-gray-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`}>▶</span>
                </button>

                {/* Subject actions */}
                <div className="flex gap-1">
                  <button
                    onClick={() => setEditingSubject(subject)}
                    className="text-gray-500 hover:text-emerald-400 p-1.5 rounded hover:bg-gray-800"
                    title="Edit subject"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Delete "${subject.name}" and all its ${subject.topics.length} topics?`)) {
                        deleteSubject(subject.id);
                      }
                    }}
                    className="text-gray-500 hover:text-red-400 p-1.5 rounded hover:bg-gray-800"
                    title="Delete subject"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {/* Topics List */}
              {isExpanded && (
                <div className="border-t border-gray-800 p-3 space-y-2">
                  {subject.topics.length === 0 && (
                    <p className="text-xs text-gray-600 text-center py-3">No topics yet</p>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {subject.topics.map((topic) => {
                      const progress = [topic.checklist.learn, topic.checklist.pyq, topic.checklist.flashcards].filter(Boolean).length;
                      return (
                        <TopicCard
                          key={topic.id}
                          topic={topic}
                          subject={subject}
                          progress={progress}
                          onEdit={() => setEditingTopic({ topic, subjectId: subject.id })}
                          onDelete={() => deleteTopic(topic.id)}
                          onSelect={() => setSelectedTopicId(topic.id)}
                          onScheduleToday={() => addTopicToDate(topic.id, new Date().toISOString().split('T')[0])}
                        />
                      );
                    })}
                  </div>

                  {/* Add new topic */}
                  {addingTopicTo === subject.id ? (
                    <div className="bg-gray-800/60 rounded-lg p-3 border border-emerald-500/30">
                      <input
                        type="text"
                        autoFocus
                        placeholder="Topic name..."
                        value={newTopicName}
                        onChange={(e) => setNewTopicName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleAddTopic(subject.id); if (e.key === 'Escape') setAddingTopicTo(null); }}
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => setAddingTopicTo(null)}
                          className="flex-1 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded-lg"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleAddTopic(subject.id)}
                          className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded-lg"
                        >
                          Add Topic
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAddingTopicTo(subject.id)}
                      className="w-full py-2 text-xs text-gray-500 hover:text-emerald-400 border border-dashed border-gray-700 hover:border-emerald-500/50 rounded-lg transition-colors"
                    >
                      + Add Topic to {subject.name}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* New / Edit Subject Modal */}
      {(showNewSubject || editingSubject) && (
        <SubjectEditModal
          subject={editingSubject}
          onSave={(s) => {
            if (editingSubject) updateSubject(editingSubject.id, s);
            else addSubject({ ...s, id: uuidv4(), topics: [] });
            setShowNewSubject(false);
            setEditingSubject(null);
          }}
          onClose={() => { setShowNewSubject(false); setEditingSubject(null); }}
        />
      )}

      {/* Edit Topic Modal */}
      {editingTopic && (
        <TopicEditModal
          topic={editingTopic.topic}
          onSave={(patch) => {
            updateTopic(editingTopic.topic.id, patch);
            setEditingTopic(null);
          }}
          onClose={() => setEditingTopic(null)}
        />
      )}
    </div>
  );
};

// ─── Subject Edit Modal ───────────────────────────────────

const SubjectEditModal: React.FC<{
  subject: Subject | null;
  onSave: (s: { name: string; icon: string; color: string }) => void;
  onClose: () => void;
}> = ({ subject, onSave, onClose }) => {
  const [name, setName] = useState(subject?.name || '');
  const [icon, setIcon] = useState(subject?.icon || '📚');
  const [color, setColor] = useState(subject?.color || PRESET_COLORS[0]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-md shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-base font-bold text-white">{subject ? 'Edit' : 'New'} Subject</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">&times;</button>
        </div>

        <div className="p-4 space-y-4">
          {/* Preview */}
          <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-xl">
            <span className="text-3xl">{icon}</span>
            <div className="flex-1">
              <p className="text-sm font-bold text-white">{name || 'Subject Name'}</p>
              <div className="h-1.5 bg-gray-700 rounded-full mt-1 overflow-hidden">
                <div className="h-full w-1/2 rounded-full" style={{ backgroundColor: color }} />
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Name</label>
            <input
              type="text"
              autoFocus
              placeholder="e.g., Cardiology"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Icon</label>
            <div className="grid grid-cols-12 gap-1">
              {PRESET_ICONS.map((i) => (
                <button
                  key={i}
                  onClick={() => setIcon(i)}
                  className={`text-lg p-1.5 rounded ${icon === i ? 'bg-emerald-600' : 'bg-gray-800 hover:bg-gray-700'}`}
                >
                  {i}
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="Or paste any emoji"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 mt-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Color</label>
            <div className="grid grid-cols-9 gap-1.5">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-full aspect-square rounded ${color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-900' : ''}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button onClick={onClose} className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded-lg">Cancel</button>
            <button
              onClick={() => { if (name.trim()) onSave({ name: name.trim(), icon, color }); }}
              disabled={!name.trim()}
              className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium text-sm rounded-lg"
            >
              {subject ? 'Save Changes' : 'Create Subject'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Topic Edit Modal ───────────────────────────────────

const TopicEditModal: React.FC<{
  topic: Topic;
  onSave: (patch: Partial<Topic>) => void;
  onClose: () => void;
}> = ({ topic, onSave, onClose }) => {
  const [name, setName] = useState(topic.name);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-md shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-base font-bold text-white">Edit Topic</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">&times;</button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Topic Name</label>
            <input
              type="text"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button onClick={onClose} className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded-lg">Cancel</button>
            <button
              onClick={() => { if (name.trim()) onSave({ name: name.trim() }); }}
              className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm rounded-lg"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
