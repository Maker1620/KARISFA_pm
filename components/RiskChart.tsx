import React, { useState } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis, Cell } from 'recharts';
import { ProjectData, RiskItem, TeamMember } from '../types';
import { generateRiskAnalysis } from '../services/geminiService';

interface RiskChartProps {
  project: ProjectData;
  team: TeamMember[];
  risks: RiskItem[];
  setRisks: (risks: RiskItem[]) => void;
}

export const RiskChart: React.FC<RiskChartProps> = ({ project, team, risks, setRisks }) => {
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [formState, setFormState] = useState<{
    name: string;
    probability: number;
    impact: number;
    mitigation: string;
    ownerId: string;
    status: RiskItem['status'];
  }>({
    name: '',
    probability: 50,
    impact: 50,
    mitigation: '',
    ownerId: '',
    status: 'Open'
  });

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const generatedRisks = await generateRiskAnalysis(project);
      // Append generated risks to existing ones
      setRisks([...risks, ...generatedRisks]);
    } catch (e: any) {
      if (e.message !== "API_KEY_MISSING") {
          console.error(e);
          alert('Error generating risk analysis');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddRisk = () => {
    if (!formState.name) return;
    const newRisk: RiskItem = {
      id: `risk-${Date.now()}`,
      name: formState.name,
      probability: formState.probability,
      impact: formState.impact,
      mitigation: formState.mitigation,
      ownerId: formState.ownerId || undefined,
      status: formState.status
    };
    setRisks([...risks, newRisk]);
    // Reset form
    setFormState({
        name: '',
        probability: 50,
        impact: 50,
        mitigation: '',
        ownerId: '',
        status: 'Open'
    });
  };

  const handleDeleteRisk = (id: string) => {
    setRisks(risks.filter(r => r.id !== id));
  };

  const handleUpdateRiskStatus = (id: string, status: RiskItem['status']) => {
      setRisks(risks.map(r => r.id === id ? { ...r, status } : r));
  };

  const handleUpdateRiskOwner = (id: string, ownerId: string) => {
      setRisks(risks.map(r => r.id === id ? { ...r, ownerId: ownerId || undefined } : r));
  };

  const getColor = (prob: number, impact: number) => {
      const score = prob * impact;
      if (score > 5000) return '#ef4444'; // High Risk (Red)
      if (score > 2000) return '#f97316'; // Medium Risk (Orange)
      return '#22c55e'; // Low Risk (Green)
  };

  const inputClass = "w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition text-sm bg-white text-slate-600 placeholder:text-slate-400";
  const labelClass = "block text-xs font-semibold text-slate-500 uppercase mb-1";

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-slate-200">
         <div>
            <h3 className="text-lg font-bold text-slate-800">Risk Management Log</h3>
            <p className="text-sm text-slate-500">Log, assess, and mitigate project risks.</p>
         </div>
         <button
           onClick={handleGenerate}
           disabled={loading || !project.description}
           className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition flex items-center gap-2 shadow-sm"
         >
           {loading ? 'Analyzing...' : <><span>✨</span> Identify with AI</>}
         </button>
       </div>

       <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Chart Area */}
          <div className="xl:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-[500px]">
             <h4 className="font-semibold text-slate-700 mb-4">Probability vs. Impact Matrix</h4>
             {risks.length > 0 ? (
                 <ResponsiveContainer width="100%" height="90%">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" dataKey="probability" name="Probability" unit="%" domain={[0, 100]} label={{ value: 'Probability', position: 'insideBottomRight', offset: -10 }} />
                      <YAxis type="number" dataKey="impact" name="Impact" unit="%" domain={[0, 100]} label={{ value: 'Impact', angle: -90, position: 'insideLeft' }} />
                      <ZAxis type="number" range={[100, 400]} />
                      <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              const owner = team.find(t => t.id === data.ownerId);
                              return (
                                  <div className="bg-white p-3 border border-slate-200 shadow-lg rounded-lg">
                                      <p className="font-bold text-slate-800">{data.name}</p>
                                      <p className="text-sm">Prob: {data.probability}% | Impact: {data.impact}%</p>
                                      <p className="text-xs text-slate-500 mt-1">Status: {data.status}</p>
                                      {owner && <p className="text-xs text-indigo-600 font-medium">Owner: {owner.name}</p>}
                                  </div>
                              );
                          }
                          return null;
                      }} />
                      <Scatter name="Risks" data={risks}>
                        {risks.map((entry) => (
                          <Cell key={entry.id} fill={getColor(entry.probability, entry.impact)} />
                        ))}
                      </Scatter>
                    </ScatterChart>
                 </ResponsiveContainer>
             ) : (
                 <div className="h-full flex items-center justify-center text-slate-400">
                     No risks logged yet.
                 </div>
             )}
          </div>

          {/* Add Risk Form */}
          <div className="xl:col-span-1 bg-slate-50 p-6 rounded-xl shadow-inner border border-slate-200 h-[500px] overflow-y-auto">
             <h4 className="font-semibold text-slate-800 mb-4">Log New Risk</h4>
             <div className="space-y-4">
                 <div>
                     <label className={labelClass}>Risk Description</label>
                     <input 
                        type="text" 
                        className={inputClass}
                        placeholder="e.g. Budget overrun due to..."
                        value={formState.name}
                        onChange={e => setFormState({...formState, name: e.target.value})}
                     />
                 </div>
                 
                 <div className="grid grid-cols-2 gap-3">
                     <div>
                        <label className={labelClass}>Probability: {formState.probability}%</label>
                        <input 
                            type="range" min="0" max="100" 
                            className="w-full accent-indigo-600"
                            value={formState.probability}
                            onChange={e => setFormState({...formState, probability: Number(e.target.value)})}
                        />
                     </div>
                     <div>
                        <label className={labelClass}>Impact: {formState.impact}%</label>
                        <input 
                            type="range" min="0" max="100" 
                            className="w-full accent-indigo-600"
                            value={formState.impact}
                            onChange={e => setFormState({...formState, impact: Number(e.target.value)})}
                        />
                     </div>
                 </div>

                 <div>
                     <label className={labelClass}>Mitigation Strategy</label>
                     <textarea 
                        className={inputClass}
                        rows={3}
                        placeholder="How will we prevent or handle this?"
                        value={formState.mitigation}
                        onChange={e => setFormState({...formState, mitigation: e.target.value})}
                     />
                 </div>

                 <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className={labelClass}>Owner</label>
                        <select 
                            className={inputClass}
                            value={formState.ownerId}
                            onChange={e => setFormState({...formState, ownerId: e.target.value})}
                        >
                            <option value="">Unassigned</option>
                            {team.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className={labelClass}>Status</label>
                        <select 
                            className={inputClass}
                            value={formState.status}
                            onChange={e => setFormState({...formState, status: e.target.value as any})}
                        >
                            <option value="Open">Open</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Mitigated">Mitigated</option>
                            <option value="Closed">Closed</option>
                        </select>
                    </div>
                 </div>

                 <button 
                    onClick={handleAddRisk}
                    disabled={!formState.name}
                    className="w-full py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition mt-2 shadow-sm"
                 >
                     Add Risk
                 </button>
             </div>
          </div>
       </div>

       {/* Risk Registry Table */}
       <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
           <div className="px-6 py-4 border-b border-slate-200">
               <h4 className="font-bold text-slate-800">Risk Registry</h4>
           </div>
           <div className="overflow-x-auto">
               <table className="w-full text-sm text-left">
                   <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                       <tr>
                           <th className="px-6 py-3">Risk</th>
                           <th className="px-4 py-3 text-center">Prob.</th>
                           <th className="px-4 py-3 text-center">Impact</th>
                           <th className="px-4 py-3 text-center">Score</th>
                           <th className="px-6 py-3">Mitigation</th>
                           <th className="px-4 py-3 w-40">Owner</th>
                           <th className="px-4 py-3 w-32">Status</th>
                           <th className="px-4 py-3 text-right w-16">Actions</th>
                       </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                       {risks.map(risk => {
                           const score = risk.probability * risk.impact;
                           return (
                               <tr key={risk.id} className="hover:bg-slate-50">
                                   <td className="px-6 py-3 font-medium text-slate-800 max-w-[200px] truncate" title={risk.name}>{risk.name}</td>
                                   <td className="px-4 py-3 text-center text-slate-600">{risk.probability}%</td>
                                   <td className="px-4 py-3 text-center text-slate-600">{risk.impact}%</td>
                                   <td className="px-4 py-3 text-center">
                                       <span className="px-2 py-1 rounded text-xs font-bold text-white" style={{ backgroundColor: getColor(risk.probability, risk.impact) }}>
                                           {score}
                                       </span>
                                   </td>
                                   <td className="px-6 py-3 text-slate-600 max-w-[300px] truncate" title={risk.mitigation}>{risk.mitigation || '-'}</td>
                                   <td className="px-4 py-3">
                                       <select
                                            className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 text-xs py-1 outline-none text-slate-700 cursor-pointer"
                                            value={risk.ownerId || ''}
                                            onChange={(e) => handleUpdateRiskOwner(risk.id, e.target.value)}
                                        >
                                            <option value="">-- Assign --</option>
                                            {team.map(t => (
                                                <option key={t.id} value={t.id}>{t.name}</option>
                                            ))}
                                        </select>
                                   </td>
                                   <td className="px-4 py-3">
                                       <select 
                                          className="bg-transparent border-none text-slate-700 font-medium cursor-pointer focus:ring-0 text-xs outline-none"
                                          value={risk.status}
                                          onChange={(e) => handleUpdateRiskStatus(risk.id, e.target.value as any)}
                                       >
                                           <option value="Open">Open</option>
                                           <option value="In Progress">In Progress</option>
                                           <option value="Mitigated">Mitigated</option>
                                           <option value="Closed">Closed</option>
                                       </select>
                                   </td>
                                   <td className="px-4 py-3 text-right">
                                       <button 
                                          onClick={() => handleDeleteRisk(risk.id)}
                                          className="text-slate-300 hover:text-red-500 transition"
                                          title="Delete Risk"
                                       >
                                           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                       </button>
                                   </td>
                               </tr>
                           );
                       })}
                       {risks.length === 0 && (
                           <tr>
                               <td colSpan={8} className="px-6 py-8 text-center text-slate-400 italic">
                                   No risks in the registry. Use the form to log a risk or Generate with AI.
                               </td>
                           </tr>
                       )}
                   </tbody>
               </table>
           </div>
       </div>
    </div>
  );
};