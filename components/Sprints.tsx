import React, { useState } from 'react';
import { Sprint, Task } from '../types';

interface SprintsProps {
  sprints: Sprint[];
  setSprints: React.Dispatch<React.SetStateAction<Sprint[]>>;
  tasks: Task[];
}

export const Sprints: React.FC<SprintsProps> = ({ sprints, setSprints, tasks }) => {
  const [newSprintName, setNewSprintName] = useState('');
  const [newSprintStart, setNewSprintStart] = useState('');
  const [newSprintEnd, setNewSprintEnd] = useState('');

  const addSprint = () => {
    if (!newSprintName.trim()) return;
    const newSprint: Sprint = {
      id: `sprint-${Date.now()}`,
      name: newSprintName,
      startDate: newSprintStart,
      endDate: newSprintEnd,
      taskIds: [],
      status: 'Planned'
    };
    setSprints([...sprints, newSprint]);
    setNewSprintName('');
    setNewSprintStart('');
    setNewSprintEnd('');
  };

  const updateSprint = (id: string, updates: Partial<Sprint>) => {
    setSprints(sprints.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const deleteSprint = (id: string) => {
    setSprints(sprints.filter(s => s.id !== id));
  };

  const addTaskToSprint = (sprintId: string, taskId: string) => {
    if (!taskId) return;
    setSprints(sprints.map(s => {
      if (s.id === sprintId && !s.taskIds.includes(taskId)) {
        return { ...s, taskIds: [...s.taskIds, taskId] };
      }
      return s;
    }));
  };

  const removeTaskFromSprint = (sprintId: string, taskId: string) => {
    setSprints(sprints.map(s => {
      if (s.id === sprintId) {
        return { ...s, taskIds: s.taskIds.filter(id => id !== taskId) };
      }
      return s;
    }));
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex justify-between items-center bg-slate-50 p-4 border border-slate-200">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Sprint Planning</h2>
          <p className="text-sm text-slate-500">Plan and track your iterations</p>
        </div>
      </div>

      <div className="bg-white p-4 border border-slate-200 shadow-sm flex items-end gap-4">
        <div className="flex-1">
          <label className="block text-xs font-semibold text-slate-500 mb-1">Sprint Name</label>
          <input 
            type="text" 
            value={newSprintName}
            onChange={(e) => setNewSprintName(e.target.value)}
            placeholder="e.g., Sprint 1"
            className="w-full border border-slate-200 px-3 py-2 text-sm focus:border-blue-700 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Start Date</label>
          <input 
            type="date" 
            value={newSprintStart}
            onChange={(e) => setNewSprintStart(e.target.value)}
            className="border border-slate-200 px-3 py-2 text-sm focus:border-blue-700 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">End Date</label>
          <input 
            type="date" 
            value={newSprintEnd}
            onChange={(e) => setNewSprintEnd(e.target.value)}
            className="border border-slate-200 px-3 py-2 text-sm focus:border-blue-700 outline-none"
          />
        </div>
        <button 
          onClick={addSprint}
          className="bg-blue-700 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-800 transition"
        >
          Add Sprint
        </button>
      </div>

      <div className="space-y-6">
        {sprints.map(sprint => {
          const sprintTasks = sprint.taskIds.map(id => tasks.find(t => t.id === id)).filter(Boolean) as Task[];
          const totalPoints = sprintTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
          const totalHours = sprintTasks.reduce((sum, t) => sum + (t.estHours || 0), 0);

          return (
            <div key={sprint.id} className="bg-white border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50">
                <div className="flex items-center gap-4">
                  <input 
                    type="text"
                    value={sprint.name}
                    onChange={(e) => updateSprint(sprint.id, { name: e.target.value })}
                    className="font-bold text-lg text-slate-800 bg-transparent border-none focus:ring-0 p-0 w-48"
                  />
                  <select 
                    value={sprint.status}
                    onChange={(e) => updateSprint(sprint.id, { status: e.target.value as Sprint['status'] })}
                    className={`text-xs font-bold px-2 py-1 border appearance-none cursor-pointer outline-none ${
                      sprint.status === 'Completed' ? 'bg-green-100 text-green-700 border-green-200' :
                      sprint.status === 'Active' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                      'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    <option value="Planned">Planned</option>
                    <option value="Active">Active</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                     <input 
                        type="date"
                        value={sprint.startDate}
                        onChange={(e) => updateSprint(sprint.id, { startDate: e.target.value })}
                        className="text-xs text-slate-500 bg-transparent outline-none w-28"
                     />
                     <span className="text-slate-400">to</span>
                     <input 
                        type="date"
                        value={sprint.endDate}
                        onChange={(e) => updateSprint(sprint.id, { endDate: e.target.value })}
                        className="text-xs text-slate-500 bg-transparent outline-none w-28"
                     />
                  </div>
                  <button onClick={() => deleteSprint(sprint.id)} className="text-slate-400 hover:text-red-500 ml-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  </button>
                </div>
              </div>

              <div className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-500">Story Points:</span>
                      <span className="font-bold text-slate-800">{totalPoints}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-500">Est. Hours:</span>
                      <span className="font-bold text-slate-800">{totalHours}</span>
                    </div>
                  </div>
                  <div>
                    <select 
                      value=""
                      onChange={(e) => addTaskToSprint(sprint.id, e.target.value)}
                      className="border border-slate-200 px-3 py-1.5 text-sm focus:border-blue-700 outline-none text-slate-600 bg-slate-50"
                    >
                      <option value="">+ Add Task to Sprint</option>
                      {tasks.filter(t => !sprint.taskIds.includes(t.id)).map(t => (
                        <option key={t.id} value={t.id}>{t.name} ({t.storyPoints || 0} pts)</option>
                      ))}
                    </select>
                  </div>
                </div>

                {sprintTasks.length > 0 ? (
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 text-xs">
                      <tr>
                        <th className="px-4 py-2">Task</th>
                        <th className="px-4 py-2 w-24">Points</th>
                        <th className="px-4 py-2 w-24">Hours</th>
                        <th className="px-4 py-2 w-32">Status</th>
                        <th className="px-4 py-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {sprintTasks.map(task => (
                        <tr key={task.id} className="border-b border-slate-50 hover:bg-slate-50 text-sm group">
                          <td className="px-4 py-2 font-medium text-slate-700 flex items-center gap-2">
                            {task.status === 'Done' && <span className="text-green-500">✓</span>}
                            <span className={task.status === 'Done' ? 'line-through text-slate-400' : ''}>{task.name}</span>
                          </td>
                          <td className="px-4 py-2 text-slate-600">{task.storyPoints || 0}</td>
                          <td className="px-4 py-2 text-slate-600">{task.estHours || 0}</td>
                          <td className="px-4 py-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              task.status === 'Done' ? 'bg-green-100 text-green-700' :
                              task.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {task.status}
                            </span>
                          </td>
                          <td className="px-4 py-2">
                            <button onClick={() => removeTaskFromSprint(sprint.id, task.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-slate-400 italic text-sm py-4 text-center">No tasks in this sprint yet.</p>
                )}
              </div>
            </div>
          );
        })}
        {sprints.length === 0 && (
          <div className="text-center py-12 text-slate-500 italic">
            No sprints created. Add one above to start planning.
          </div>
        )}
      </div>
    </div>
  );
};
