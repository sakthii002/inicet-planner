import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppState, Subject, Topic, SprintLog, DayData, ChecklistType, Shift } from './types';
import { initialSubjects } from './data/syllabus';

const getEmptyDay = (date: string): DayData => ({
  date,
  intensity: 'normal',
  shiftHours: 0,
  scheduledTopicIds: [],
  mcqsCompleted: 0,
  flashcardsCompleted: 0,
  sprintMinutes: 0,
});

const createInitialState = () => ({
  activeTab: 'dashboard' as const,
  calendarView: 'monthly' as const,
  calendarDate: new Date().toISOString().split('T')[0],
  subjects: JSON.parse(JSON.stringify(initialSubjects)) as Subject[],
  dayData: {} as Record<string, DayData>,
  shifts: [] as Shift[],
  sprints: [] as SprintLog[],
  examDate: '2026-01-25',
  dailyStudyGoalHours: 4,
  selectedTopicId: null as string | null,
  showSprint: false,
  showPostingsManager: false,
  showSettings: false,
  draggedTopicId: null as string | null,
});

export type { TabType } from './types';
export const useStore = create<AppState>()(
  persist(
    (set) => ({
      ...createInitialState(),

      setActiveTab: (activeTab) => set({ activeTab }),
      setCalendarView: (calendarView) => set({ calendarView }),
      setCalendarDate: (calendarDate) => set({ calendarDate }),

      setDayIntensity: (date, intensity) =>
        set((state) => {
          const existing = state.dayData[date] || getEmptyDay(date);
          return {
            dayData: { ...state.dayData, [date]: { ...existing, date, intensity } },
          };
        }),

      setDayShiftHours: (date, shiftHours) =>
        set((state) => {
          const existing = state.dayData[date] || getEmptyDay(date);
          return {
            dayData: { ...state.dayData, [date]: { ...existing, date, shiftHours } },
          };
        }),

      addTopicToDate: (topicId, date) =>
        set((state) => {
          const existing = state.dayData[date] || getEmptyDay(date);
          if (existing.scheduledTopicIds.includes(topicId)) return state;
          const updated: DayData = {
            ...existing,
            date,
            scheduledTopicIds: [...existing.scheduledTopicIds, topicId],
          };
          const subjects = state.subjects.map((s) => ({
            ...s,
            topics: s.topics.map((t) =>
              t.id === topicId
                ? { ...t, scheduledDates: [...new Set([...t.scheduledDates, date])] }
                : t
            ),
          }));
          return { dayData: { ...state.dayData, [date]: updated }, subjects };
        }),

      removeTopicFromDate: (topicId, date) =>
        set((state) => {
          const existing = state.dayData[date];
          if (!existing) return state;
          const updated: DayData = {
            ...existing,
            scheduledTopicIds: existing.scheduledTopicIds.filter((id) => id !== topicId),
          };
          const subjects = state.subjects.map((s) => ({
            ...s,
            topics: s.topics.map((t) =>
              t.id === topicId
                ? { ...t, scheduledDates: t.scheduledDates.filter((d) => d !== date) }
                : t
            ),
          }));
          return { dayData: { ...state.dayData, [date]: updated }, subjects };
        }),

      updateTopicChecklist: (topicId: string, key: ChecklistType, value: boolean) =>
        set((state) => {
          const subjects = state.subjects.map((s) => ({
            ...s,
            topics: s.topics.map((t) =>
              t.id === topicId ? { ...t, checklist: { ...t.checklist, [key]: value } } : t
            ),
          }));
          return { subjects };
        }),

      // ─── Subject CRUD ──────────────────────────────────────
      addSubject: (subject) =>
        set((state) => ({ subjects: [...state.subjects, subject] })),

      updateSubject: (id, patch) =>
        set((state) => ({
          subjects: state.subjects.map((s) => (s.id === id ? { ...s, ...patch } : s)),
        })),

      deleteSubject: (id) =>
        set((state) => {
          // Also remove topic schedules from days
          const subject = state.subjects.find((s) => s.id === id);
          const topicIds = subject ? subject.topics.map((t) => t.id) : [];
          const dayData = { ...state.dayData };
          Object.keys(dayData).forEach((date) => {
            dayData[date] = {
              ...dayData[date],
              scheduledTopicIds: dayData[date].scheduledTopicIds.filter(
                (tid) => !topicIds.includes(tid)
              ),
            };
          });
          return {
            subjects: state.subjects.filter((s) => s.id !== id),
            dayData,
          };
        }),

      // ─── Topic CRUD ────────────────────────────────────────
      addTopic: (subjectId, topic) =>
        set((state) => ({
          subjects: state.subjects.map((s) =>
            s.id === subjectId ? { ...s, topics: [...s.topics, topic] } : s
          ),
        })),

      updateTopic: (id, patch) =>
        set((state) => ({
          subjects: state.subjects.map((s) => ({
            ...s,
            topics: s.topics.map((t) => (t.id === id ? { ...t, ...patch } : t)),
          })),
        })),

      deleteTopic: (id) =>
        set((state) => {
          const dayData = { ...state.dayData };
          Object.keys(dayData).forEach((date) => {
            dayData[date] = {
              ...dayData[date],
              scheduledTopicIds: dayData[date].scheduledTopicIds.filter((tid) => tid !== id),
            };
          });
          return {
            subjects: state.subjects.map((s) => ({
              ...s,
              topics: s.topics.filter((t) => t.id !== id),
            })),
            dayData,
          };
        }),

      // ─── Time Blocks ──────────────────────────────────────
      addBlock: (date, block) =>
        set((state) => {
          const existing = state.dayData[date] || getEmptyDay(date);
          const blocks = [...(existing.blocks || []), block];
          return {
            dayData: { ...state.dayData, [date]: { ...existing, date, blocks } },
          };
        }),

      updateBlock: (date, blockId, patch) =>
        set((state) => {
          const existing = state.dayData[date];
          if (!existing?.blocks) return state;
          const blocks = existing.blocks.map((b) =>
            b.id === blockId ? { ...b, ...patch } : b
          );
          return {
            dayData: { ...state.dayData, [date]: { ...existing, blocks } },
          };
        }),

      deleteBlock: (date, blockId) =>
        set((state) => {
          const existing = state.dayData[date];
          if (!existing?.blocks) return state;
          const blocks = existing.blocks.filter((b) => b.id !== blockId);
          return {
            dayData: { ...state.dayData, [date]: { ...existing, blocks } },
          };
        }),

      addShift: (shift) => set((state) => ({ shifts: [...state.shifts, shift] })),
      removeShift: (id) =>
        set((state) => ({ shifts: state.shifts.filter((s) => s.id !== id) })),

      addSprint: (sprint) => {
        const date = sprint.date;
        set((state) => {
          const existing = state.dayData[date] || getEmptyDay(date);
          const updated: DayData = {
            ...existing,
            date,
            mcqsCompleted: existing.mcqsCompleted + sprint.mcqs,
            flashcardsCompleted: existing.flashcardsCompleted + sprint.flashcards,
            sprintMinutes: existing.sprintMinutes + sprint.durationMinutes,
          };
          return {
            sprints: [...state.sprints, sprint],
            dayData: { ...state.dayData, [date]: updated },
          };
        });
      },

      setExamDate: (examDate) => set({ examDate }),
      setDailyGoal: (dailyStudyGoalHours) => set({ dailyStudyGoalHours }),

      setSelectedTopicId: (selectedTopicId) => set({ selectedTopicId }),
  setShowSprint: (showSprint) => set({ showSprint }),
  setShowPostingsManager: (showPostingsManager) => set({ showPostingsManager }),
  setShowSettings: (showSettings) => set({ showSettings }),
      setDraggedTopicId: (draggedTopicId) => set({ draggedTopicId }),

      resetAllData: () => set(createInitialState()),
    }),
    {
      name: 'inicet-study-planner',
    }
  )
);

// Helper selectors
export const getTopicById = (id: string): Topic | undefined => {
  for (const s of useStore.getState().subjects) {
    const t = s.topics.find((t) => t.id === id);
    if (t) return t;
  }
  return undefined;
};

export const getSubjectById = (id: string): Subject | undefined => {
  return useStore.getState().subjects.find((s) => s.id === id);
};

export const getTopicProgress = (topic: Topic): number => {
  const total = 3;
  const done = [topic.checklist.learn, topic.checklist.pyq, topic.checklist.flashcards].filter(Boolean).length;
  return Math.round((done / total) * 100);
};

export const isTopicComplete = (topic: Topic): boolean =>
  topic.checklist.learn && topic.checklist.pyq && topic.checklist.flashcards;

// Compute total minutes per block type for a given day's blocks
export const getDayBlockTotals = (blocks: import('./types').TimeBlock[] | undefined) => {
  const totals = { shift: 0, study: 0, break: 0, sleep: 0 };
  if (!blocks) return totals;
  blocks.forEach((b) => {
    const dur = Math.max(0, b.endMinutes - b.startMinutes);
    totals[b.type] += dur;
  });
  return totals;
};
