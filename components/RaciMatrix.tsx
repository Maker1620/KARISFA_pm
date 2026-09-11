import React, { useState } from 'react';
import { RaciRow, TeamMember, RaciRole, ProjectData } from '../types';
import { generateRaciMatrix } from '../services/geminiService';

interface RaciMatrixProps {
  data: RaciRow[];
  setData: (rows: RaciRow[]) => void;
  team: TeamMember[];
  project: ProjectData;
}

export const RaciMatrix: React.FC<RaciMatrixProps> = ({ data, setData, team, project }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (team.length === 0) {
      setError("Please add team members first.");
      return;
    }
    if (!project.description) {
      setError("Please add a project description first.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const newRows = await generateRaciMatrix(project, team);
      setData(newRows);
    } catch (e: any) {
      if (e.message !== "API_KEY_MISSING") {
        setError("Failed to generate RACI matrix. Please check your API Key and try again.");
      }
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const updateAssignment = (taskId: string, personId: string, newRole: RaciRole) => {
    const newData = data.map(row => {
      if (row.id === taskId) {
        return {
          ...row,
          assignments: {
            ...row.assignments,
            [personId]: newRole
          }
        };
      }
      return row;
    });
    setData(newData);
  };

  const getRoleColor = (role: RaciRole) => {
    switch (role) {
      case RaciRole.R: return 'bg-red-100 text-red-700 font-bold border-red-200';
      case RaciRole.A: return 'bg-orange-100 text-orange-700 font-bold border-orange-200';
      case RaciRole.C: return 'bg-blue-100 text-blue-700 font-bold border-blue-200';
      case RaciRole.I: return 'bg-green-100 text-green-700 font-bold border-green-200';
      default: return 'text-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4  shadow-sm border border-slate-200">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Responsibility Assignment Matrix</h3>
          <p className="text-sm text-slate-500">Define who is Responsible, Accountable, Consulted, and Informed.</p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-800 text-white  font-medium hover:bg-blue-900 disabled:opacity-50 transition shadow-sm"
        >
          {loading ? (
             <>
               <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
               </svg>
               Generating...
             </>
          ) : (
             <>
               <span>✨</span> Auto-Generate with AI
             </>
          )}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700  border border-red-100">
          {error}
        </div>
      )}

      {data.length > 0 && (
        <div className="bg-white  shadow-sm border border-slate-200 overflow-hidden overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 min-w-[250px]">Task / Activity</th>
                {team.map(member => (
                  <th key={member.id} className="px-4 py-4 text-center min-w-[120px]">
                    <div className="flex flex-col items-center">
                      <span>{member.name}</span>
                      <span className="text-xs text-slate-400 font-normal">{member.role}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-800">{row.task}</td>
                  {team.map((member) => (
                    <td key={member.id} className="px-4 py-3 text-center">
                      <select
                        value={row.assignments[member.id] || RaciRole.None}
                        onChange={(e) => updateAssignment(row.id, member.id, e.target.value as RaciRole)}
                        className={`px-3 py-1.5  border text-center font-bold cursor-pointer outline-none focus:ring-2 focus:ring-blue-700 appearance-none ${getRoleColor(row.assignments[member.id])}`}
                      >
                        {Object.values(RaciRole).map(role => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </select>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {data.length === 0 && !loading && (
        <div className="text-center py-20 bg-white  border-2 border-dashed border-slate-200">
           <div className="text-5xl mb-4">📊</div>
           <p className="text-slate-500">No RACI matrix generated yet.</p>
           <p className="text-slate-400 text-sm mt-1">Fill in project details and team members, then click Generate.</p>
        </div>
      )}
    </div>
  );
};