import React, { useState, useRef, useMemo } from 'react';
import { useStore } from '../store';
import { TimeBlock, BlockType } from '../types';
import { v4 as uuidv4 } from 'uuid';

const BLOCK_COLORS: Record<BlockType, { bg: string; border: string; text: string; emoji: string; label: string }> = {
  shift: { bg: 'bg-amber-500/30', border: 'border-amber-500', text: 'text-amber-100', emoji: '🏥', label: 'Hospital Shift' },
  study: { bg: 'bg-emerald-500/30', border: 'border-emerald-500', text: 'text-emerald-100', emoji: '📚', label: 'Study Block' },
  break: { bg: 'bg-blue-500/30', border: 'border-blue-500', text: 'text-blue-100', emoji: '☕', label: 'Break' },
  sleep: { bg: 'bg-indigo-500/30', border: 'border-indigo-500', text: 'text-indigo-100', emoji: '😴', label: 'Sleep' },
};

const HOUR_HEIGHT = 50;
const START_HOUR = -6; // 6 PM previous day
const END_HOUR = 30;   // 6 AM next day
const TIMELINE_HOURS = END_HOUR - START_HOUR; // 36 hours
const TIMELINE_HEIGHT = HOUR_HEIGHT * TIMELINE_HOURS;

const minutesToTime = (m: number): string => {
  const h = Math.floor(m / 60);
  const min = m % 60;
  const period = h < 12 || h >= 24 ? 'AM' : 'PM';
  const displayH = h <= 0 ? h + 12 : h > 12 && h < 24 ? h - 12 : h >= 24 ? h - 24 : h;
  const dh = displayH === 0 ? 12 : displayH;
  return `${dh}:${min.toString().padStart(2, '0')} ${period}`;
};

const snapToQuarter = (minutes: number): number => Math.round(minutes / 15) * 15;

interface DayTimelineProps {
  dateStr: string;
}

export const DayTimeline: React.FC<DayTimelineProps> = ({ dateStr }) => {
  const { dayData, addBlock, deleteBlock, updateBlock, subjects, sprints } = useStore();
  const data = dayData[dateStr];
  const blocks = data?.blocks || [];

  // Sprints logged on this date
  const daySprints = useMemo(() => sprints.filter((s) => s.date === dateStr), [sprints, dateStr]);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [editingBlock, setEditingBlock] = useState<TimeBlock | null>(null);
  const [newBlockType, setNewBlockType] = useState<BlockType>('study');
  const [creating, setCreating] = useState<{ start: number; end: number } | null>(null);
  const [dragging, setDragging] = useState<{ blockId: string; mode: 'move' | 'resize-top' | 'resize-bottom'; offsetY: number; initialStart: number; initialEnd: number } | null>(null);

  const minutesToY = (m: number): number => ((m - START_HOUR * 60) / 60) * HOUR_HEIGHT;

  const eventToMinutes = (clientY: number): number => {
    if (!timelineRef.current) return 0;
    const rect = timelineRef.current.getBoundingClientRect();
    const y = clientY - rect.top;
    const minutes = (y / HOUR_HEIGHT + START_HOUR) * 60;
    return Math.max(START_HOUR * 60, Math.min(END_HOUR * 60, minutes));
  };

  const stats = useMemo(() => {
    const totals: Record<BlockType, number> = { shift: 0, study: 0, break: 0, sleep: 0 };
    blocks.forEach((b) => {
      totals[b.type] += Math.max(0, b.endMinutes - b.startMinutes);
    });
    return totals;
  }, [blocks]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target !== e.currentTarget) return;
    const start = snapToQuarter(eventToMinutes(e.clientY));
    setCreating({ start, end: start + 30 });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (creating) {
      const current = snapToQuarter(eventToMinutes(e.clientY));
      setCreating({ ...creating, end: Math.max(current, creating.start + 15) });
    }
    if (dragging) {
      const currentMin = eventToMinutes(e.clientY);
      const delta = currentMin - dragging.offsetY;
      const snappedDelta = snapToQuarter(delta);
      if (dragging.mode === 'move') {
        const duration = dragging.initialEnd - dragging.initialStart;
        const newStart = Math.max(START_HOUR * 60, Math.min(END_HOUR * 60 - duration, dragging.initialStart + snappedDelta));
        updateBlock(dateStr, dragging.blockId, { startMinutes: newStart, endMinutes: newStart + duration });
      } else if (dragging.mode === 'resize-top') {
        const newStart = Math.max(START_HOUR * 60, Math.min(dragging.initialEnd - 15, dragging.initialStart + snappedDelta));
        updateBlock(dateStr, dragging.blockId, { startMinutes: newStart });
      } else if (dragging.mode === 'resize-bottom') {
        const newEnd = Math.max(dragging.initialStart + 15, Math.min(END_HOUR * 60, dragging.initialEnd + snappedDelta));
        updateBlock(dateStr, dragging.blockId, { endMinutes: newEnd });
      }
    }
  };

  const handleMouseUp = () => {
    if (creating && creating.end > creating.start) {
      addBlock(dateStr, {
        id: uuidv4(),
        type: newBlockType,
        startMinutes: creating.start,
        endMinutes: creating.end,
        label: BLOCK_COLORS[newBlockType].label,
        topicIds: [],
      });
    }
    setCreating(null);
    setDragging(null);
  };



  // Build hour labels
  const hourLabels = useMemo(() => {
    const labels: { hour: number; label: string; isDayBoundary: boolean }[] = [];
    for (let h = START_HOUR; h <= END_HOUR; h++) {
      const displayH = h < 0 ? h + 24 : h >= 24 ? h - 24 : h;
      const period = displayH < 12 ? 'AM' : 'PM';
      const dh = displayH === 0 ? 12 : displayH > 12 ? displayH - 12 : displayH;
      const isDayBoundary = h === 0 || h === 24;
      labels.push({ hour: h, label: `${dh} ${period}`, isDayBoundary });
    }
    return labels;
  }, []);

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h3 className="text-sm font-semibold text-gray-300">⏰ 36-Hour Timeline</h3>
          <div className="flex items-center gap-3 text-[10px] text-gray-500">
            <span>Click+drag to create</span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-1.5 h-3 rounded-sm bg-cyan-400 shadow-[0_0_4px_rgba(34,211,238,0.6)]"></span>
              <span>⚡ Sprint</span>
            </span>
          </div>
        </div>

        <div className="flex gap-1.5 flex-wrap">
          {(Object.keys(BLOCK_COLORS) as BlockType[]).map((type) => (
            <button
              key={type}
              onClick={() => setNewBlockType(type)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                newBlockType === type
                  ? `${BLOCK_COLORS[type].bg} ${BLOCK_COLORS[type].text} border ${BLOCK_COLORS[type].border}`
                  : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700'
              }`}
            >
              <span>{BLOCK_COLORS[type].emoji}</span>
              <span>{BLOCK_COLORS[type].label}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-4 gap-2 mt-3">
          {(Object.keys(BLOCK_COLORS) as BlockType[]).map((type) => {
            const mins = stats[type];
            const h = Math.floor(mins / 60);
            const m = mins % 60;
            return (
              <div key={type} className={`text-center rounded-lg py-1.5 px-2 ${BLOCK_COLORS[type].bg} ${BLOCK_COLORS[type].text}`}>
                <p className="text-[10px] opacity-70">{BLOCK_COLORS[type].emoji} {BLOCK_COLORS[type].label.split(' ')[0]}</p>
                <p className="text-sm font-bold">{h > 0 ? `${h}h` : ''}{m > 0 ? ` ${m}m` : h === 0 ? '0m' : ''}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Timeline Body */}
      <div className="flex max-h-[500px] overflow-y-auto">
        {/* Hour labels */}
        <div className="w-16 flex-shrink-0 bg-gray-950 border-r border-gray-800">
          {hourLabels.map(({ hour, label, isDayBoundary }) => (
            <div
              key={hour}
              className={`text-[10px] text-right pr-2 border-b border-gray-800/50 ${isDayBoundary ? 'bg-gray-800/50 text-emerald-400 font-bold' : 'text-gray-500'}`}
              style={{ height: HOUR_HEIGHT }}
            >
              <span className="relative -top-1.5">{label}</span>
            </div>
          ))}
        </div>

        {/* Timeline canvas */}
        <div
          ref={timelineRef}
          className="flex-1 relative cursor-crosshair select-none bg-gray-950"
          style={{ height: TIMELINE_HEIGHT }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Hour grid lines */}
          {hourLabels.map(({ hour, isDayBoundary }) => (
            <div
              key={hour}
              className={`absolute left-0 right-0 pointer-events-none ${isDayBoundary ? 'border-b border-emerald-500/40' : 'border-b border-gray-800/50'}`}
              style={{ top: (hour - START_HOUR) * HOUR_HEIGHT, height: HOUR_HEIGHT }}
            >
              <div className="absolute left-0 right-0 border-b border-gray-800/30" style={{ top: HOUR_HEIGHT / 2 }} />
            </div>
          ))}

          {/* Day boundary labels */}
          <div className="absolute left-2 top-1 text-[9px] text-emerald-500/60 font-bold pointer-events-none">← Previous Day</div>
          <div className="absolute left-2 pointer-events-none" style={{ top: (0 - START_HOUR) * HOUR_HEIGHT + 2 }}>
            <span className="text-[9px] text-emerald-400 font-bold bg-gray-950/80 px-1 rounded">CURRENT DAY</span>
          </div>
          <div className="absolute left-2 pointer-events-none" style={{ top: (24 - START_HOUR) * HOUR_HEIGHT + 2 }}>
            <span className="text-[9px] text-gray-500 font-bold bg-gray-950/80 px-1 rounded">NEXT DAY →</span>
          </div>

          {/* Current time line */}
          {(() => {
            const now = new Date();
            const todayStr = now.toISOString().split('T')[0];
            if (dateStr !== todayStr) return null;
            const nowMin = now.getHours() * 60 + now.getMinutes();
            if (nowMin < START_HOUR * 60 || nowMin > END_HOUR * 60) return null;
            return (
              <div className="absolute left-0 right-0 z-10 pointer-events-none" style={{ top: minutesToY(nowMin) }}>
                <div className="h-0.5 bg-red-500" />
                <div className="absolute -left-1 -top-1 w-2 h-2 rounded-full bg-red-500" />
                <span className="absolute right-1 -top-2 text-[9px] bg-red-500 text-white px-1 rounded">NOW</span>
              </div>
            );
          })()}

          {/* Existing blocks */}
          {blocks.map((block) => {
            const color = BLOCK_COLORS[block.type];
            const top = minutesToY(block.startMinutes);
            const height = Math.max(20, minutesToY(block.endMinutes) - top);
            const linkedSubjects = block.topicIds.map((tid) => {
              for (const s of subjects) {
                const t = s.topics.find((t) => t.id === tid);
                if (t) return { topic: t, subject: s };
              }
              return null;
            }).filter(Boolean);
            const bgColor = block.color || linkedSubjects[0]?.subject.color;

            // Sprints that overlap this block (by start time of sprint)
            const blockSprints = daySprints.filter((s) => {
              const sprintStart = new Date(s.startTime);
              const sprintMin = sprintStart.getHours() * 60 + sprintStart.getMinutes();
              return sprintMin >= block.startMinutes && sprintMin < block.endMinutes;
            });

            return (
              <div
                key={block.id}
                className={`absolute left-1 right-1 rounded-md border-l-4 ${color.bg} ${color.border} ${color.text} px-2 py-1 group overflow-hidden cursor-move shadow-sm hover:shadow-md transition-shadow`}
                style={{
                  top,
                  height,
                  backgroundColor: bgColor ? bgColor + '40' : undefined,
                  borderLeftColor: bgColor || undefined,
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  const startY = eventToMinutes(e.clientY);
                  setDragging({ blockId: block.id, mode: 'move', offsetY: startY, initialStart: block.startMinutes, initialEnd: block.endMinutes });
                }}
                onClick={(e) => { e.stopPropagation(); if (!dragging) setEditingBlock(block); }}
              >
                <div className="absolute top-0 left-0 right-0 h-1.5 cursor-ns-resize opacity-0 group-hover:opacity-100 bg-white/30"
                  onMouseDown={(e) => { e.stopPropagation(); setDragging({ blockId: block.id, mode: 'resize-top', offsetY: eventToMinutes(e.clientY), initialStart: block.startMinutes, initialEnd: block.endMinutes }); }}
                />
                <div className="flex items-center justify-between text-[10px] font-medium">
                  <span className="truncate flex items-center gap-1">
                    <span>{color.emoji}</span>
                    <span className="truncate">{block.label}</span>
                  </span>
                  <button onClick={(e) => { e.stopPropagation(); deleteBlock(dateStr, block.id); }}
                    className="opacity-0 group-hover:opacity-100 text-red-300 hover:text-red-100 ml-1 flex-shrink-0"
                  >✕</button>
                </div>
                {height > 28 && (
                  <p className="text-[9px] opacity-70 truncate">
                    {minutesToTime(block.startMinutes)} – {minutesToTime(block.endMinutes)}
                  </p>
                )}
                {height > 40 && linkedSubjects.length > 0 && (
                  <div className="flex flex-wrap gap-0.5 mt-0.5">
                    {linkedSubjects.slice(0, 3).map((ls) => (
                      <span key={ls!.topic.id} className="text-[8px] px-1 py-0.5 rounded bg-black/20 truncate max-w-full">
                        {ls!.subject.icon} {ls!.topic.name}
                      </span>
                    ))}
                    {linkedSubjects.length > 3 && <span className="text-[8px] text-gray-400">+{linkedSubjects.length - 3}</span>}
                  </div>
                )}

                {/* Nested sprint mini-blocks inside this parent block */}
                {blockSprints.map((sprint) => {
                  const sprintDate = new Date(sprint.startTime);
                  const sprintMin = sprintDate.getHours() * 60 + sprintDate.getMinutes();
                  // Relative position inside the parent block
                  const parentDur = block.endMinutes - block.startMinutes;
                  const relTop = ((sprintMin - block.startMinutes) / parentDur) * height;
                  const relHeight = Math.max(4, (sprint.durationMinutes / parentDur) * height);
                  return (
                    <div
                      key={sprint.id}
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      className="absolute right-0.5 w-1.5 rounded-sm bg-cyan-400 shadow-[0_0_4px_rgba(34,211,238,0.6)] cursor-default group/sprint"
                      style={{ top: relTop, height: relHeight }}
                      title={`⚡ Sprint: ${sprint.durationMinutes}m · ${sprint.mcqs} MCQs · ${sprint.flashcards} FC at ${sprintDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`}
                    >
                      {/* Hover tooltip */}
                      <div className="absolute right-3 top-0 hidden group-hover/sprint:block z-50 bg-cyan-950 border border-cyan-700 rounded-md px-2 py-1 w-40 text-[10px] text-cyan-100 pointer-events-none shadow-xl">
                        <p className="font-bold">⚡ Sprint · {sprint.durationMinutes}m</p>
                        <p className="opacity-80">
                          {sprintDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} – {new Date(sprint.startTime + sprint.durationMinutes * 60000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        {sprint.mcqs > 0 && <p className="opacity-80">{sprint.mcqs} MCQs</p>}
                        {sprint.flashcards > 0 && <p className="opacity-80">{sprint.flashcards} flashcards</p>}
                      </div>
                    </div>
                  );
                })}

                <div className="absolute bottom-0 left-0 right-0 h-1.5 cursor-ns-resize opacity-0 group-hover:opacity-100 bg-white/30"
                  onMouseDown={(e) => { e.stopPropagation(); setDragging({ blockId: block.id, mode: 'resize-bottom', offsetY: eventToMinutes(e.clientY), initialStart: block.startMinutes, initialEnd: block.endMinutes }); }}
                />
              </div>
            );
          })}

          {/* Orphan sprints (not inside any block) */}
          {daySprints.filter((s) => {
            const sprintDate = new Date(s.startTime);
            const sprintMin = sprintDate.getHours() * 60 + sprintDate.getMinutes();
            return !blocks.some((b) => sprintMin >= b.startMinutes && sprintMin < b.endMinutes);
          }).map((sprint) => {
            const sprintDate = new Date(sprint.startTime);
            const sprintMin = sprintDate.getHours() * 60 + sprintDate.getMinutes();
            const top = minutesToY(sprintMin);
            const height = Math.max(6, (sprint.durationMinutes / 60) * HOUR_HEIGHT);
            return (
              <div
                key={sprint.id}
                className="absolute right-1 w-2 rounded bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.7)] cursor-default group/sprint pointer-events-auto"
                style={{ top, height }}
                onMouseDown={(e) => e.stopPropagation()}
                title={`⚡ Sprint: ${sprint.durationMinutes}m at ${sprintDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`}
              >
                <div className="absolute right-4 top-0 hidden group-hover/sprint:block z-50 bg-cyan-950 border border-cyan-700 rounded-md px-2 py-1 w-40 text-[10px] text-cyan-100 pointer-events-none shadow-xl">
                  <p className="font-bold">⚡ Sprint · {sprint.durationMinutes}m</p>
                  <p className="opacity-80">{sprintDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                  {sprint.mcqs > 0 && <p className="opacity-80">{sprint.mcqs} MCQs</p>}
                  {sprint.flashcards > 0 && <p className="opacity-80">{sprint.flashcards} flashcards</p>}
                </div>
              </div>
            );
          })}

          {/* Creating preview */}
          {creating && (
            <div className={`absolute left-1 right-1 rounded-md border-l-4 ${BLOCK_COLORS[newBlockType].bg} ${BLOCK_COLORS[newBlockType].border} ${BLOCK_COLORS[newBlockType].text} px-2 py-1 opacity-70 pointer-events-none`}
              style={{ top: minutesToY(Math.min(creating.start, creating.end)), height: minutesToY(Math.abs(creating.end - creating.start)) }}
            >
              <p className="text-[10px] font-medium">
                {BLOCK_COLORS[newBlockType].emoji} {minutesToTime(Math.min(creating.start, creating.end))} – {minutesToTime(Math.max(creating.start, creating.end))}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Edit modal */}
      {editingBlock && (
        <EditBlockModal block={editingBlock} dateStr={dateStr} onClose={() => setEditingBlock(null)} />
      )}
    </div>
  );
};

// ─── Edit Block Modal ─────────────────────────────────────

const EditBlockModal: React.FC<{ block: TimeBlock; dateStr: string; onClose: () => void }> = ({ block, dateStr, onClose }) => {
  const { updateBlock, deleteBlock, subjects } = useStore();
  const [label, setLabel] = useState(block.label);
  const [type, setType] = useState<BlockType>(block.type);
  const [startMin, setStartMin] = useState(block.startMinutes);
  const [endMin, setEndMin] = useState(block.endMinutes);
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>(block.topicIds);
  const [notes, setNotes] = useState(block.notes || '');

  const minutesToInputTime = (m: number) => {
    const totalM = m < 0 ? m + 24 * 60 : m;
    const h = Math.floor(totalM / 60) % 24;
    const min = totalM % 60;
    return `${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
  };

  const inputTimeToMinutes = (t: string, isNextDay: boolean) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m + (isNextDay ? 24 * 60 : 0);
  };

  const save = () => {
    const linkedSubjects = selectedTopicIds.map((tid) => {
      for (const s of subjects) { if (s.topics.some((t) => t.id === tid)) return s; }
      return null;
    }).filter(Boolean);
    updateBlock(dateStr, block.id, {
      label,
      type,
      startMinutes: startMin,
      endMinutes: Math.max(startMin + 15, endMin),
      topicIds: selectedTopicIds,
      notes,
      color: linkedSubjects[0]?.color,
    });
    onClose();
  };

  const toggleTopic = (tid: string) => {
    setSelectedTopicIds((prev) => prev.includes(tid) ? prev.filter((id) => id !== tid) : [...prev, tid]);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-lg shadow-2xl overflow-hidden max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-800 flex-shrink-0">
          <h2 className="text-base font-bold text-white">Edit Time Block</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">&times;</button>
        </div>

        <div className="p-4 space-y-3 overflow-y-auto">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Type</label>
            <div className="grid grid-cols-4 gap-1.5">
              {(Object.keys(BLOCK_COLORS) as BlockType[]).map((t) => (
                <button key={t} onClick={() => setType(t)}
                  className={`py-2 rounded-lg text-[10px] font-medium ${type === t ? `${BLOCK_COLORS[t].bg} ${BLOCK_COLORS[t].text} border ${BLOCK_COLORS[t].border}` : 'bg-gray-800 text-gray-400 border border-gray-700'}`}>
                  {BLOCK_COLORS[t].emoji} {BLOCK_COLORS[t].label.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Label</label>
            <input type="text" value={label} onChange={(e) => setLabel(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Start (today or prev day)</label>
              <input type="time" value={minutesToInputTime(startMin)}
                onChange={(e) => setStartMin(inputTimeToMinutes(e.target.value, startMin < 0))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" />
              {startMin < 0 && <p className="text-[9px] text-amber-400 mt-0.5">Before midnight (prev day)</p>}
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">End (today or next day)</label>
              <input type="time" value={minutesToInputTime(endMin)}
                onChange={(e) => setEndMin(inputTimeToMinutes(e.target.value, endMin >= 24 * 60))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" />
              {endMin >= 24 * 60 && <p className="text-[9px] text-emerald-400 mt-0.5">After midnight (next day)</p>}
            </div>
          </div>

          {type === 'study' && (
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Linked Topics (click to toggle)</label>
              <div className="max-h-40 overflow-y-auto space-y-1 bg-gray-800/40 rounded-lg p-2">
                {subjects.map((s) => (
                  <div key={s.id}>
                    <p className="text-[10px] font-semibold text-gray-500 px-1">{s.icon} {s.name}</p>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {s.topics.map((t) => (
                        <button key={t.id} onClick={() => toggleTopic(t.id)}
                          className={`text-[10px] px-2 py-1 rounded-full transition-colors ${selectedTopicIds.includes(t.id) ? 'text-white' : 'bg-gray-800 text-gray-500 hover:bg-gray-700'}`}
                          style={selectedTopicIds.includes(t.id) ? { backgroundColor: s.color } : {}}>
                          {selectedTopicIds.includes(t.id) ? '✓ ' : ''}{t.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
          </div>

          <div className="flex gap-2 pt-2">
            <button onClick={() => { deleteBlock(dateStr, block.id); onClose(); }}
              className="px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-sm hover:bg-red-500/20">Delete</button>
            <button onClick={save}
              className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg text-sm">Save Changes</button>
          </div>
        </div>
      </div>
    </div>
  );
};
