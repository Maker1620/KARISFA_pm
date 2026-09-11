import React, { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { ProjectData, TeamMember, JournalEntry, MeetingMinute, ActionItem, Task, Milestone, Deliverable, ProjectResource } from '../types';
import { generateCharterContent, generateProjectPlan, generateMeetingActionItems, generateStatusReport } from '../services/geminiService';
// @ts-ignore
import html2pdf from 'html2pdf.js';

interface DocumentViewProps {
  project: ProjectData;
  team: TeamMember[];
  journal: JournalEntry[];
  setJournal: React.Dispatch<React.SetStateAction<JournalEntry[]>>;
  meetingMinutes?: MeetingMinute[];
  setMeetingMinutes?: React.Dispatch<React.SetStateAction<MeetingMinute[]>>;
  tasks?: Task[];
  milestones?: Milestone[];
  deliverables?: Deliverable[];
  resources?: ProjectResource[];
}

export const DocumentView: React.FC<DocumentViewProps> = ({ 
    project, team, journal, setJournal, meetingMinutes = [], setMeetingMinutes, 
    tasks = [], milestones = [], deliverables = [], resources = [] 
}) => {
  const [activeDoc, setActiveDoc] = useState<'charter' | 'plan' | 'journal' | 'minutes' | 'status'>('charter');
  const [charterContent, setCharterContent] = useState('');
  const [planContent, setPlanContent] = useState('');
  const [statusContent, setStatusContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const [newJournalEntry, setNewJournalEntry] = useState('');
  
  // Meeting Minutes State
  const [isCreatingMinute, setIsCreatingMinute] = useState(false);
  const [newMinuteTitle, setNewMinuteTitle] = useState('');
  const [newMinuteNotes, setNewMinuteNotes] = useState('');
  const [newMinuteActionItems, setNewMinuteActionItems] = useState<ActionItem[]>([]);
  const [extractingAI, setExtractingAI] = useState(false);
  
  const contentRef = useRef<HTMLDivElement>(null);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      if (activeDoc === 'charter') {
        const content = await generateCharterContent(project, team);
        setCharterContent(content);
      } else if (activeDoc === 'plan') {
        const content = await generateProjectPlan(project);
        setPlanContent(content);
      } else if (activeDoc === 'status') {
        const content = await generateStatusReport(project, tasks, milestones, resources);
        setStatusContent(content);
      }
    } catch (e: any) {
      if (e.message !== "API_KEY_MISSING") {
        console.error(e);
        alert("Failed to generate document.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!contentRef.current) return;
    setIsDownloading(true);

    const docName = activeDoc === 'charter' ? 'Charter' : activeDoc === 'plan' ? 'Plan' : 'Status_Report';
    const filename = `${(project.name || 'Project').replace(/\s+/g, '_')}_${docName}.pdf`;

    const opt = {
      margin:       1,
      filename:     filename,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(contentRef.current).save().then(() => {
        setIsDownloading(false);
    }).catch((e: any) => {
        console.error("PDF generation failed", e);
        setIsDownloading(false);
        alert("Failed to generate PDF.");
    });
  };

  const handleAddJournal = () => {
      if (!newJournalEntry.trim()) return;
      const newEntry: JournalEntry = {
          id: `journal-${Date.now()}`,
          date: new Date().toISOString(),
          content: newJournalEntry
      };
      setJournal([newEntry, ...journal]);
      setNewJournalEntry('');
  };

  const handleDeleteJournal = (id: string) => {
      setJournal(journal.filter(j => j.id !== id));
  };

  const handleExtractActionItems = async () => {
      if (!newMinuteNotes.trim()) return;
      setExtractingAI(true);
      try {
          const items = await generateMeetingActionItems(newMinuteNotes, tasks, team);
          // Auto-generate IDs for them so they can be mapped properly
          const withIds = items.map(item => ({ ...item, id: `ai-${Date.now()}-${Math.random().toString(36).substring(2,9)}` }));
          setNewMinuteActionItems(withIds);
      } catch (e: any) {
          if (e.message !== "API_KEY_MISSING") {
              alert("Failed to extract action items.");
              console.error(e);
          }
      } finally {
          setExtractingAI(false);
      }
  };

  const handleUpdateNewActionItem = (id: string, updates: Partial<ActionItem>) => {
      setNewMinuteActionItems(newMinuteActionItems.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const handleRemoveNewActionItem = (id: string) => {
      setNewMinuteActionItems(newMinuteActionItems.filter(item => item.id !== id));
  };

  const handleSaveMeetingMinute = () => {
      if (!newMinuteTitle.trim() || !setMeetingMinutes) return;
      const newMinute: MeetingMinute = {
          id: `min-${Date.now()}`,
          date: new Date().toISOString(),
          title: newMinuteTitle,
          rawNotes: newMinuteNotes,
          actionItems: newMinuteActionItems
      };
      setMeetingMinutes([newMinute, ...meetingMinutes]);
      // reset form
      setNewMinuteTitle('');
      setNewMinuteNotes('');
      setNewMinuteActionItems([]);
      setIsCreatingMinute(false);
  };

  const handleDeleteMeetingMinute = (id: string) => {
      if (setMeetingMinutes) {
          setMeetingMinutes(meetingMinutes.filter(m => m.id !== id));
      }
  };

  const content = activeDoc === 'charter' ? charterContent : activeDoc === 'plan' ? planContent : statusContent;

  return (
    <div className="h-full flex flex-col space-y-6">
       <div className="flex justify-between items-center flex-wrap gap-4">
           <div className="flex bg-slate-200 p-1 rounded-lg">
               <button 
                  onClick={() => setActiveDoc('charter')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeDoc === 'charter' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
               >
                   Project Charter
               </button>
               <button 
                  onClick={() => setActiveDoc('plan')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeDoc === 'plan' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
               >
                   Project Plan
               </button>
               <button 
                  onClick={() => setActiveDoc('status')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeDoc === 'status' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
               >
                   Status Report
               </button>
               <button 
                  onClick={() => setActiveDoc('journal')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeDoc === 'journal' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
               >
                   Project Journal
               </button>
               <button 
                  onClick={() => setActiveDoc('minutes')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeDoc === 'minutes' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
               >
                   Meeting Minutes
               </button>
           </div>
           
           <div className="flex gap-3">
               {activeDoc !== 'journal' && activeDoc !== 'minutes' && content && (
                   <button
                       onClick={handleDownloadPDF}
                       disabled={isDownloading}
                       className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 disabled:opacity-50 transition"
                   >
                       <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                       {isDownloading ? 'Generating...' : 'Download PDF Report'}
                   </button>
               )}
               {activeDoc !== 'journal' && activeDoc !== 'minutes' && (
                 <button
                  onClick={handleGenerate}
                  disabled={loading || !project.name}
                  className="flex items-center gap-2 px-5 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 disabled:opacity-50 transition"
                 >
                    {loading ? 'Drafting...' : `Generate ${activeDoc === 'charter' ? 'Charter' : activeDoc === 'plan' ? 'Plan' : 'Status'}`}
                 </button>
               )}
           </div>
       </div>

       <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
           {activeDoc === 'minutes' ? (
               <div className="flex-1 flex flex-col overflow-hidden">
                   {isCreatingMinute ? (
                       <div className="flex-1 flex flex-col p-6 overflow-y-auto">
                           <div className="flex justify-between items-center mb-4">
                               <h3 className="text-lg font-semibold text-slate-800">New Meeting Minutes</h3>
                               <button onClick={() => setIsCreatingMinute(false)} className="text-slate-500 hover:text-slate-700 font-medium text-sm">Cancel</button>
                           </div>
                           <div className="space-y-4">
                               <input 
                                   type="text" 
                                   value={newMinuteTitle}
                                   onChange={(e) => setNewMinuteTitle(e.target.value)}
                                   placeholder="Meeting Title (e.g. Weekly Sync)"
                                   className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                               />
                               <textarea 
                                   value={newMinuteNotes}
                                   onChange={(e) => setNewMinuteNotes(e.target.value)}
                                   placeholder="Paste raw meeting notes, transcript, or rough bullet points here..."
                                   className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none h-48 font-mono text-sm"
                               />
                               <div className="flex justify-end">
                                   <button 
                                       onClick={handleExtractActionItems}
                                       disabled={!newMinuteNotes.trim() || extractingAI}
                                       className="px-5 py-2 bg-indigo-100 text-indigo-700 font-medium rounded-lg hover:bg-indigo-200 disabled:opacity-50 transition flex items-center gap-2"
                                   >
                                       {extractingAI ? '✨ Extracting...' : '✨ AI Extract Action Items'}
                                   </button>
                               </div>

                               {newMinuteActionItems.length > 0 && (
                                   <div className="mt-6 border-t border-slate-200 pt-6">
                                       <h4 className="font-semibold text-slate-800 mb-3">Extracted Action Items</h4>
                                       <div className="space-y-3">
                                           {newMinuteActionItems.map(item => (
                                               <div key={item.id} className="flex gap-2 items-start bg-slate-50 p-3 rounded border border-slate-200">
                                                   <input 
                                                       type="text" 
                                                       value={item.description}
                                                       onChange={(e) => handleUpdateNewActionItem(item.id, { description: e.target.value })}
                                                       className="flex-1 bg-transparent border-none focus:ring-1 focus:ring-indigo-500 p-1 rounded"
                                                   />
                                                   <select 
                                                       value={item.assigneeId || ''}
                                                       onChange={(e) => handleUpdateNewActionItem(item.id, { assigneeId: e.target.value })}
                                                       className="w-32 bg-white border border-slate-200 rounded px-2 py-1 text-xs outline-none"
                                                   >
                                                       <option value="">Unassigned</option>
                                                       {team.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                                   </select>
                                                   <select 
                                                       value={item.linkedTaskId || ''}
                                                       onChange={(e) => handleUpdateNewActionItem(item.id, { linkedTaskId: e.target.value })}
                                                       className="w-40 bg-white border border-slate-200 rounded px-2 py-1 text-xs outline-none"
                                                   >
                                                       <option value="">No Linked Task</option>
                                                       {tasks.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                                   </select>
                                                   <button onClick={() => handleRemoveNewActionItem(item.id)} className="text-slate-400 hover:text-red-500 mt-1">
                                                       <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                                                   </button>
                                               </div>
                                           ))}
                                       </div>
                                   </div>
                               )}
                               
                               <div className="mt-8 flex justify-end">
                                    <button 
                                       onClick={handleSaveMeetingMinute}
                                       disabled={!newMinuteTitle.trim()}
                                       className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
                                   >
                                       Save Meeting Minutes
                                   </button>
                               </div>
                           </div>
                       </div>
                   ) : (
                       <>
                           <div className="p-6 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                               <div>
                                   <h3 className="text-lg font-semibold text-slate-800 mb-1">Meeting Minutes & Action Items</h3>
                                   <p className="text-sm text-slate-500">Record notes and use AI to automatically extract action items.</p>
                               </div>
                               <button 
                                   onClick={() => setIsCreatingMinute(true)}
                                   className="px-5 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition"
                               >
                                   + New Meeting Note
                               </button>
                           </div>
                           <div className="flex-1 overflow-y-auto p-6 space-y-6">
                               {meetingMinutes.length === 0 ? (
                                   <div className="text-center text-slate-400 py-12">
                                       <div className="text-3xl mb-3">🎙️</div>
                                       <p>No meeting minutes recorded yet.</p>
                                   </div>
                               ) : (
                                   meetingMinutes.map(minute => (
                                       <div key={minute.id} className="border border-slate-200 rounded-lg p-5 relative group hover:border-slate-300 transition-colors">
                                           <div className="flex justify-between items-start mb-3">
                                               <div>
                                                   <h4 className="font-bold text-slate-800">{minute.title}</h4>
                                                   <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded mt-1 inline-block">
                                                       {new Date(minute.date).toLocaleDateString()}
                                                   </span>
                                               </div>
                                               <button 
                                                    onClick={() => handleDeleteMeetingMinute(minute.id)}
                                                    className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    title="Delete minute"
                                               >
                                                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                                               </button>
                                           </div>
                                           <div className="text-slate-600 text-sm whitespace-pre-wrap mb-4 bg-slate-50 p-3 rounded">
                                               {minute.rawNotes}
                                           </div>
                                           {minute.actionItems && minute.actionItems.length > 0 && (
                                               <div>
                                                   <h5 className="font-semibold text-slate-700 text-sm mb-2">Action Items:</h5>
                                                   <ul className="space-y-2">
                                                       {minute.actionItems.map(item => (
                                                           <li key={item.id} className="flex items-start gap-2 text-sm bg-white border border-slate-100 p-2 rounded shadow-sm">
                                                               <span className="text-indigo-500 mt-0.5">
                                                                   <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 16 16 12 12 8"></polyline><line x1="8" y1="12" x2="16" y2="12"></line></svg>
                                                               </span>
                                                               <div className="flex-1">
                                                                   <span className="text-slate-800">{item.description}</span>
                                                                   <div className="flex gap-3 mt-1 text-xs text-slate-500">
                                                                       {item.assigneeId && (
                                                                           <span className="flex items-center gap-1">
                                                                               <span className="font-medium text-slate-600">Assignee:</span> 
                                                                               {team.find(t => t.id === item.assigneeId)?.name || 'Unknown'}
                                                                           </span>
                                                                       )}
                                                                       {item.linkedTaskId && (
                                                                           <span className="flex items-center gap-1">
                                                                               <span className="font-medium text-slate-600">Task:</span> 
                                                                               {tasks.find(t => t.id === item.linkedTaskId)?.name || 'Unknown'}
                                                                           </span>
                                                                       )}
                                                                   </div>
                                                               </div>
                                                           </li>
                                                       ))}
                                                   </ul>
                                               </div>
                                           )}
                                       </div>
                                   ))
                               )}
                           </div>
                       </>
                   )}
               </div>
           ) : activeDoc === 'journal' ? (
               <div className="flex-1 flex flex-col overflow-hidden">
                   <div className="p-6 border-b border-slate-200 bg-slate-50">
                       <h3 className="text-lg font-semibold text-slate-800 mb-2">Project Journal</h3>
                       <p className="text-sm text-slate-500 mb-4">Attach dated notes, updates, or meeting minutes to track historical progress.</p>
                       <div className="flex gap-3">
                           <textarea 
                               value={newJournalEntry}
                               onChange={(e) => setNewJournalEntry(e.target.value)}
                               placeholder="What's the latest update?"
                               className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
                               rows={3}
                           />
                           <button 
                               onClick={handleAddJournal}
                               disabled={!newJournalEntry.trim()}
                               className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
                           >
                               Add Note
                           </button>
                       </div>
                   </div>
                   <div className="flex-1 overflow-y-auto p-6 space-y-6">
                       {journal.length === 0 ? (
                           <div className="text-center text-slate-400 py-12">
                               <div className="text-3xl mb-3">📝</div>
                               <p>No journal entries yet.</p>
                           </div>
                       ) : (
                           journal.map(entry => (
                               <div key={entry.id} className="border border-slate-200 rounded-lg p-5 relative group hover:border-slate-300 transition-colors">
                                   <div className="flex justify-between items-start mb-3">
                                       <span className="text-sm font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                                           {new Date(entry.date).toLocaleDateString()} at {new Date(entry.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                       </span>
                                       <button 
                                            onClick={() => handleDeleteJournal(entry.id)}
                                            className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Delete entry"
                                       >
                                           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                                       </button>
                                   </div>
                                   <div className="text-slate-700 whitespace-pre-wrap">
                                       {entry.content}
                                   </div>
                               </div>
                           ))
                       )}
                   </div>
               </div>
           ) : content ? (
               <div className="flex-1 overflow-y-auto p-12">
                   <div ref={contentRef} className="prose prose-slate max-w-none p-4">
                       <ReactMarkdown>{content}</ReactMarkdown>
                   </div>
               </div>
           ) : (
               <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-12 text-center">
                   <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-2xl">
                       {activeDoc === 'charter' ? '📜' : activeDoc === 'plan' ? '🗓️' : '📊'}
                   </div>
                   <h3 className="text-lg font-medium text-slate-600 mb-1">No Document Generated</h3>
                   <p className="max-w-md">
                       Click the generate button to create a comprehensive {activeDoc === 'charter' ? 'Project Charter' : activeDoc === 'plan' ? 'Project Plan' : 'Status Report'} using AI based on your inputs.
                   </p>
               </div>
           )}
       </div>
    </div>
  );
};