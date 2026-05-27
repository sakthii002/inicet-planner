import React from 'react';
import { useStore } from '../store';

export const GoogleSync: React.FC = () => {
  const { dayData, subjects, shifts } = useStore();

  const generateICS = () => {
    const events: string[] = [];

    // Add shifts
    shifts.forEach((shift) => {
      events.push(
        `BEGIN:VEVENT\nDTSTART;VALUE=DATE:${shift.startDate.replace(/-/g, '')}\nDTEND;VALUE=DATE:${shift.endDate.replace(/-/g, '')}\nSUMMARY:${shift.postingName}\nDESCRIPTION:Hospital posting\nEND:VEVENT`
      );
    });

    // Add scheduled topics (all-day)
    Object.entries(dayData).forEach(([dateStr, data]) => {
      data.scheduledTopicIds.forEach((topicId) => {
        let topicName = '';
        let subjectName = '';
        for (const s of subjects) {
          const t = s.topics.find((t) => t.id === topicId);
          if (t) { topicName = t.name; subjectName = s.name; break; }
        }
        if (!topicName) return;
        const date = dateStr.replace(/-/g, '');
        events.push(
          `BEGIN:VEVENT\nDTSTART;VALUE=DATE:${date}\nDTEND;VALUE=DATE:${date}\nSUMMARY:📚 ${topicName}\nDESCRIPTION:Subject: ${subjectName}\\nINICET Study Topic\nCATEGORIES:INICET Study\nEND:VEVENT`
        );
      });

      // Add timed blocks
      (data.blocks || []).forEach((block) => {
        const baseDate = dateStr.replace(/-/g, '');
        const startH = Math.floor(Math.max(0, block.startMinutes) / 60).toString().padStart(2, '0');
        const startM = (Math.max(0, block.startMinutes) % 60).toString().padStart(2, '0');
        const endH = Math.floor(Math.max(0, block.endMinutes) / 60).toString().padStart(2, '0');
        const endM = (Math.max(0, block.endMinutes) % 60).toString().padStart(2, '0');
        const emoji = block.type === 'shift' ? '🏥' : block.type === 'study' ? '📚' : block.type === 'break' ? '☕' : '😴';
        events.push(
          `BEGIN:VEVENT\nDTSTART:${baseDate}T${startH}${startM}00\nDTEND:${baseDate}T${endH}${endM}00\nSUMMARY:${emoji} ${block.label}\nDESCRIPTION:${block.type.toUpperCase()} block${block.notes ? '\\n' + block.notes : ''}\nCATEGORIES:INICET - ${block.type}\nEND:VEVENT`
        );
      });
    });

    const icsContent = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//INICET Study Planner//EN\nCALSCALE:GREGORIAN\nMETHOD:PUBLISH\n${events.join('\n')}\nEND:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inicet-study-schedule.ics';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
      <h3 className="text-sm font-semibold text-gray-300 mb-3">📅 Export to Calendar</h3>
      <p className="text-xs text-gray-500 mb-4">Download an .ics file to import into Google/Apple/Outlook Calendar</p>

      <button onClick={generateICS}
        className="w-full flex items-center gap-3 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-white transition-colors">
        <span className="text-lg">📄</span>
        <div className="text-left">
          <p className="font-medium">Download .ics File</p>
          <p className="text-[10px] text-gray-500">Includes shifts, topics, and time blocks</p>
        </div>
      </button>

      <div className="mt-4 p-3 bg-gray-800/40 rounded-lg">
        <p className="text-[10px] text-gray-500">
          <strong className="text-gray-400">How to import:</strong><br />
          1. Download the .ics file<br />
          2. Open Google Calendar on desktop<br />
          3. Settings → Import & Export → Upload file<br />
          4. Select your calendar and import
        </p>
      </div>
    </div>
  );
};
