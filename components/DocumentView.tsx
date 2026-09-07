import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { ProjectData, TeamMember } from '../types';
import { generateCharterContent, generateProjectPlan } from '../services/geminiService';

interface DocumentViewProps {
  project: ProjectData;
  team: TeamMember[];
}

export const DocumentView: React.FC<DocumentViewProps> = ({ project, team }) => {
  const [activeDoc, setActiveDoc] = useState<'charter' | 'plan'>('charter');
  const [charterContent, setCharterContent] = useState('');
  const [planContent, setPlanContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      if (activeDoc === 'charter') {
        const content = await generateCharterContent(project, team);
        setCharterContent(content);
      } else {
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

  const content = activeDoc === 'charter' ? charterContent : planContent;

  return (
    <div className="h-full flex flex-col space-y-6">
       <div className="flex justify-between items-center">
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
           </div>
           
           <button
            onClick={handleGenerate}
            disabled={loading || !project.name}
            className="flex items-center gap-2 px-5 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 disabled:opacity-50 transition"
           >
              {loading ? 'Drafting...' : `Generate ${activeDoc === 'charter' ? 'Charter' : 'Plan'}`}
           </button>
       </div>

       <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
           {content ? (
               <div className="flex-1 overflow-y-auto p-12 prose prose-slate max-w-none">
                   <ReactMarkdown>{content}</ReactMarkdown>
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