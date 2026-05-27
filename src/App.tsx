import { useStore } from './store';
import { Header } from './components/Header';
import { CalendarView } from './components/CalendarView';
import { TopicPanel } from './components/TopicPanel';
import { TopicModal } from './components/TopicModal';
import { QuickSprint } from './components/QuickSprint';
import { PostingsManager } from './components/PostingsManager';
import { SettingsModal } from './components/SettingsModal';
import { Heatmap } from './components/Heatmap';
import { Analytics } from './components/Analytics';
import { Dashboard } from './components/Dashboard';
import { SubjectsManager } from './components/SubjectsManager';




export default function App() {
  const { activeTab } = useStore();

  return (
    <div className="h-screen flex flex-col bg-gray-950 text-white overflow-hidden">
      <Header />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {activeTab === 'calendar' && (
          <>
            {/* Topic Panel (Sidebar) - Collapsible */}
            <div className="hidden lg:block w-72 flex-shrink-0 border-r border-gray-800 overflow-hidden">
              <TopicPanel />
            </div>

            {/* Calendar */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <CalendarView />
            </div>

            {/* Mobile Topic Panel Toggle Hint */}
            <div className="lg:hidden fixed bottom-4 right-4 z-40">
              <p className="text-[10px] text-gray-600 bg-gray-900/80 px-2 py-1 rounded">
                Go to Subjects tab to drag topics
              </p>
            </div>
          </>
        )}

        {activeTab === 'dashboard' && (
          <div className="flex-1 overflow-hidden">
            <Dashboard />
          </div>
        )}

        {activeTab === 'subjects' && (
          <div className="flex-1 overflow-hidden">
            <SubjectsManager />
          </div>
        )}

        {activeTab === 'heatmap' && (
          <div className="flex-1 overflow-hidden">
            <Heatmap />
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="flex-1 overflow-hidden">
            <Analytics />
          </div>
        )}
      </div>

      {/* Modals */}
      <TopicModal />
      <QuickSprint />
      <PostingsManager />
      <SettingsModal />
    </div>
  );
}
