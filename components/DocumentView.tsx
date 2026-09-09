import React, { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { ProjectData, TeamMember, JournalEntry } from '../types';
import { generateCharterContent, generateProjectPlan } from '../services/geminiService';
// @ts-ignore
import html2pdf from 'html2pdf.js';

interface DocumentViewProps {
  project: ProjectData;
  team: TeamMember[];
  journal: JournalEntry[];
  setJournal: React.Dispatch<React.SetStateAction<JournalEntry[]>>;
}

export const DocumentView: React.FC<DocumentViewProps> = ({ project, team, journal, setJournal }) => {
  const [activeDoc, setActiveDoc] = useState<'charter' | 'plan' | 'journal'>('charter');
  const [charterContent, setCharterContent] = useState('');
  const [planContent, setPlanContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const [newJournalEntry, setNewJournalEntry] = useState('');
  
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

    const docName = activeDoc === 'charter' ? 'Charter' : 'Plan';
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

  const content = activeDoc === 'charter' ? charterContent : planContent;

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
                  onClick={() => setActiveDoc('journal')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeDoc === 'journal' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
               >
                   Project Journal
               </button>
           </div>
           
           <div className="flex gap-3">
               {activeDoc !== 'journal' && content && (
                   <button
                       onClick={handleDownloadPDF}
                       disabled={isDownloading}
                       className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 disabled:opacity-50 transition"
                   >
                       <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                       {isDownloading ? 'Generating...' : 'Download PDF Report'}
                   </button>
               )}
               {activeDoc !== 'journal' && (
                 <button
                  onClick={handleGenerate}
                  disabled={loading || !project.name}
                  className="flex items-center gap-2 px-5 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 disabled:opacity-50 transition"
                 >
                    {loading ? 'Drafting...' : `Generate ${activeDoc === 'charter' ? 'Charter' : 'Plan'}`}
                 </button>
               )}
           </div>
       </div>

       <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
           {activeDoc === 'journal' ? (
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
                       {activeDoc === 'charter' ? '📜' : '🗓️'}
                   </div>
                   <h3 className="text-lg font-medium text-slate-600 mb-1">No Document Generated</h3>
                   <p className="max-w-md">
                       Click the generate button to create a comprehensive {activeDoc === 'charter' ? 'Project Charter' : 'Project Plan'} using AI based on your inputs.
                   </p>
               </div>
           )}
       </div>
    </div>
  );
};