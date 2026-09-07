import React from 'react';
import { ProjectData } from '../types';

interface ProjectFormProps {
  data: ProjectData;
  onChange: (data: ProjectData) => void;
}

export const ProjectForm: React.FC<ProjectFormProps> = ({ data, onChange }) => {
  const handleChange = (field: keyof ProjectData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 space-y-6">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Project Name</label>
          <input
            type="text"
            value={data.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition text-lg bg-white text-slate-600 placeholder:text-slate-400"
            placeholder="Enter project name..."
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
          <textarea
            value={data.description}
            onChange={(e) => handleChange('description', e.target.value)}
            rows={4}
            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition bg-white text-slate-600 placeholder:text-slate-400"
            placeholder="What is this project about? (This is used by AI to generate suggestions)"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Key Objectives</label>
            <textarea
                value={data.objectives}
                onChange={(e) => handleChange('objectives', e.target.value)}
                rows={4}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition bg-white text-slate-600 placeholder:text-slate-400"
                placeholder="What are the success criteria?"
            />
            </div>
            <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Scope Boundaries</label>
            <textarea
                value={data.scope}
                onChange={(e) => handleChange('scope', e.target.value)}
                rows={4}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition bg-white text-slate-600 placeholder:text-slate-400"
                placeholder="What is in and out of scope?"
            />
            </div>
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Timeline / Constraints</label>
          <input
            type="text"
            value={data.timeline}
            onChange={(e) => handleChange('timeline', e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition bg-white text-slate-600 placeholder:text-slate-400"
            placeholder="e.g. Q3 2024 launch, strict budget of $50k..."
          />
        </div>
      </div>
      
      <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg flex gap-3 text-blue-800 text-sm">
        <span className="text-xl">💡</span>
        <p>Tip: The more details you provide here, the better the AI can generate your RACI matrix and Project Charter.</p>
      </div>
    </div>
  );
};