import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onSignIn: () => void;
  isSignedIn: boolean;
  selectedFolderName?: string;
  onPickFolder: () => void;
  onSave: () => void;
  onExport: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenSettings: () => void;
  onOpenAiSettings: () => void;
  isAiActive: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, activeTab, onTabChange, onSignIn, isSignedIn, selectedFolderName, onPickFolder, onSave,
  onExport, onImport, onOpenSettings, onOpenAiSettings, isAiActive
}) => {
  const tabs = [
    { id: 'project', label: 'Project Context', icon: '📝' },
    { id: 'team', label: 'Team & Stakeholders', icon: 'busts_in_silhouette' },
    { id: 'wbs', label: 'Work Breakdown', icon: 'card_index_dividers' },
    { id: 'resources', label: 'Resources', icon: 'money_bag' },
    { id: 'raci', label: 'RACI Matrix', icon: 'grid' },
    { id: 'risks', label: 'Risk Analysis', icon: 'chart_with_upwards_trend' },
    { id: 'docs', label: 'Plan & Charter', icon: 'page_facing_up' },
    { id: 'insights', label: 'Progress Insights', icon: 'pie_chart' },
    { id: 'gantt', label: 'Gantt It', icon: 'bar_chart' },
  ];

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col shadow-xl z-20">
        <div className="p-6 border-b border-slate-700">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8  bg-blue-700 flex items-center justify-center font-bold text-white">K</div>
                <h1 className="text-xl font-bold tracking-tight">KARISFA PM</h1>
            </div>
            <p className="text-xs text-slate-400 mt-2">AI-Powered Management</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium  transition-colors duration-200 ${
                activeTab === tab.id
                  ? 'bg-blue-800 text-white shadow-md'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span className="text-lg" role="img" aria-label={tab.label}>
                {tab.icon === 'busts_in_silhouette' ? '👥' : 
                 tab.icon === 'grid' ? '📊' : 
                 tab.icon === 'chart_with_upwards_trend' ? '📈' : 
                 tab.icon === 'page_facing_up' ? '📑' : 
                 tab.icon === 'card_index_dividers' ? '🗂️' : 
                 tab.icon === 'bar_chart' ? '📅' : 
                 tab.icon === 'pie_chart' ? '🥧' : 
                 tab.icon === 'money_bag' ? '💰' : '📝'}
              </span>
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-3">
            {/* Drive Integration Section */}
            <div className="bg-slate-800  p-3">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-300">
                        {isSignedIn ? 'Google Drive Active' : 'Offline Mode'}
                    </span>
                    <div className="flex items-center gap-2">
                        {isSignedIn ? (
                            <span className="w-2 h-2  bg-green-500" title="Connected"></span>
                        ) : (
                            <span className="w-2 h-2  bg-slate-500" title="Offline"></span>
                        )}
                        <button 
                            onClick={onOpenSettings}
                            className="text-slate-400 hover:text-white transition"
                            title="Configure Cloud Settings"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                        </button>
                    </div>
                </div>
                
                {!isSignedIn ? (
                    <div className="space-y-2">
                        <button 
                            onClick={onSave}
                            className="w-full py-1.5 px-2 bg-slate-700 text-slate-200 text-xs font-medium  hover:bg-slate-600 transition border border-slate-600 mb-2"
                        >
                            Save Locally
                        </button>
                        <button 
                            onClick={onSignIn}
                            className="w-full py-1.5 px-2 bg-white text-slate-900 text-xs font-medium  hover:bg-slate-100 transition flex items-center justify-center gap-2"
                        >
                           <img src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg" className="w-3 h-3" alt="Drive" />
                           Connect Drive
                        </button>
                        <p className="text-[10px] text-slate-500 text-center leading-tight mt-1">
                            Requires Cloud Config
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <div className="bg-slate-900/50  p-2 border border-slate-700">
                           <p className="text-[10px] text-slate-400 mb-1">Sync Location:</p>
                           {selectedFolderName ? (
                               <div className="flex items-center gap-1.5 text-blue-500 text-xs font-semibold truncate">
                                   <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                                   <span className="truncate">{selectedFolderName}</span>
                               </div>
                           ) : (
                               <p className="text-xs text-slate-500 italic">No folder selected</p>
                           )}
                           <button onClick={onPickFolder} className="text-[10px] text-blue-500 hover:text-slate-400 underline mt-1">
                               {selectedFolderName ? 'Change Folder' : 'Select Folder'}
                           </button>
                        </div>

                        <button 
                            onClick={onSave}
                            disabled={!selectedFolderName}
                            className="w-full py-1.5 px-2 bg-blue-800 text-white text-xs font-medium  hover:bg-blue-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Sync to Drive
                        </button>
                    </div>
                )}
            </div>

            {/* Local Save Section */}
            <div className="bg-slate-800  p-3">
                <span className="text-xs font-semibold text-slate-300 block mb-2">Import / Export</span>
                <div className="flex gap-2">
                    <button 
                        onClick={onExport}
                        className="flex-1 py-1.5 px-2 bg-slate-700 text-slate-200 text-xs font-medium  hover:bg-slate-600 transition border border-slate-600"
                        title="Download Project JSON"
                    >
                        Export JSON
                    </button>
                    <label className="flex-1 py-1.5 px-2 bg-slate-700 text-slate-200 text-xs font-medium  hover:bg-slate-600 transition border border-slate-600 text-center cursor-pointer">
                        Import
                        <input type="file" accept=".json" className="hidden" onChange={onImport} />
                    </label>
                </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-700">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2  ${isAiActive ? 'bg-green-500' : 'bg-amber-500'}`}></div>
                    <span className={isAiActive ? 'text-slate-300' : 'text-amber-500'}>
                        {isAiActive ? 'AI Active' : 'AI Key Needed (Free)'}
                    </span>
                </div>
                <button 
                    onClick={onOpenAiSettings}
                    className="text-slate-400 hover:text-white transition"
                    title="Enable AI Features"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                </button>
            </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative">
        <header className="bg-white border-b border-slate-200 px-8 py-4 sticky top-0 z-10 flex justify-between items-center">
           <h2 className="text-2xl font-semibold text-slate-800 capitalize">
               {tabs.find(t => t.id === activeTab)?.label}
           </h2>
        </header>
        <div className="p-8 max-w-7xl mx-auto pb-20">
          {children}
        </div>
      </main>
    </div>
  );
};