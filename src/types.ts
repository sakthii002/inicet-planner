// ─── Core Types ──────────────────────────────────────────────

export type Intensity = 'red' | 'green' | 'normal';
export type CalendarViewMode = 'monthly' | 'weekly' | 'daily';
export type TabType = 'dashboard' | 'calendar' | 'subjects' | 'heatmap' | 'analytics';
export type ChecklistType = 'learn' | 'pyq' | 'flashcards';

export interface Checklist {
  learn: boolean;
  pyq: boolean;
  flashcards: boolean;
}

export interface Topic {
  id: string;
  name: string;
  weight?: number; // Deprecated/unused
  subjectId: string;
  checklist: Checklist;
  scheduledDates: string[]; // ISO date strings
}

export interface Subject {
  id: string;
  name: string;
  icon: string;
  color: string;
  topics: Topic[];
}

export interface Shift {
  id: string;
  postingName: string;
  startDate: string; // ISO
  endDate: string;   // ISO
}

export interface DayData {
  date: string;          // ISO YYYY-MM-DD
  intensity: Intensity;
  shiftHours: number;
  scheduledTopicIds: string[];
  mcqsCompleted: number;
  flashcardsCompleted: number;
  sprintMinutes: number;
  blocks?: TimeBlock[];
}

export type BlockType = 'shift' | 'study' | 'break' | 'sleep';

export interface TimeBlock {
  id: string;
  type: BlockType;
  startMinutes: number; // can be negative (before midnight) or >1440 (after midnight)
  endMinutes: number;   // same — supports cross-midnight blocks
  label: string;
  topicIds: string[];
  notes?: string;
  color?: string;
}

export interface SprintLog {
  id: string;
  date: string;       // ISO
  startTime: number;  // timestamp
  durationMinutes: number;
  mcqs: number;
  flashcards: number;
  topicId?: string;
}

export interface AppState {
  // Navigation
  activeTab: TabType;
  calendarView: CalendarViewMode;
  calendarDate: string; // ISO date - the date currently focused in calendar
  
  // Data
  subjects: Subject[];
  dayData: Record<string, DayData>; // keyed by ISO date
  shifts: Shift[];
  sprints: SprintLog[];
  
  // Settings
  examDate: string;
  dailyStudyGoalHours: number;
  
  // UI
  selectedTopicId: string | null;
  showSprint: boolean;
  showPostingsManager: boolean;
  showSettings: boolean;
  
  // Drag state (deprecated, kept for compatibility)
  draggedTopicId: string | null;
  
  // Actions
  setActiveTab: (tab: TabType) => void;
  setCalendarView: (view: CalendarViewMode) => void;
  setCalendarDate: (date: string) => void;
  
  setDayIntensity: (date: string, intensity: Intensity) => void;
  setDayShiftHours: (date: string, hours: number) => void;
  addTopicToDate: (topicId: string, date: string) => void;
  removeTopicFromDate: (topicId: string, date: string) => void;
  
  updateTopicChecklist: (topicId: string, key: ChecklistType, value: boolean) => void;
  
  // Subject CRUD
  addSubject: (subject: Subject) => void;
  updateSubject: (id: string, patch: Partial<Subject>) => void;
  deleteSubject: (id: string) => void;
  
  // Topic CRUD
  addTopic: (subjectId: string, topic: Topic) => void;
  updateTopic: (id: string, patch: Partial<Topic>) => void;
  deleteTopic: (id: string) => void;
  
  // Time blocks
  addBlock: (date: string, block: TimeBlock) => void;
  updateBlock: (date: string, blockId: string, patch: Partial<TimeBlock>) => void;
  deleteBlock: (date: string, blockId: string) => void;
  
  addShift: (shift: Shift) => void;
  removeShift: (id: string) => void;
  
  addSprint: (sprint: SprintLog) => void;
  
  setExamDate: (date: string) => void;
  setDailyGoal: (hours: number) => void;
  
  setSelectedTopicId: (id: string | null) => void;
  setShowSprint: (show: boolean) => void;
  setShowPostingsManager: (show: boolean) => void;
  setShowSettings: (show: boolean) => void;
  
  setDraggedTopicId: (id: string | null) => void;
  
  resetAllData: () => void;
}
