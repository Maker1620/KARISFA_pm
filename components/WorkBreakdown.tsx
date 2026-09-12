import React, { useState } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import { Deliverable, Milestone, Task, TeamMember, Goal } from '../types';

interface WorkBreakdownProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  milestones: Milestone[];
  setMilestones: React.Dispatch<React.SetStateAction<Milestone[]>>;
  deliverables: Deliverable[];
  setDeliverables: React.Dispatch<React.SetStateAction<Deliverable[]>>;
  goals?: Goal[];
  setGoals?: React.Dispatch<React.SetStateAction<Goal[]>>;
  team: TeamMember[];
}

export const WorkBreakdown: React.FC<WorkBreakdownProps> = ({ 
  tasks, setTasks, 
  milestones, setMilestones, 
  deliverables, setDeliverables, 
  goals = [], setGoals,
  team 
}) => {
  // --- Task State ---
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskDependency, setNewTaskDependency] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<Task['priority']>('Medium');
  const [newTaskEstHours, setNewTaskEstHours] = useState<number | "">("");
  const [newTaskStoryPoints, setNewTaskStoryPoints] = useState<number | "">("");
  
  // --- Milestone State ---
  const [newMilestoneName, setNewMilestoneName] = useState('');

  // --- Deliverable State ---
  const [newDeliverableName, setNewDeliverableName] = useState('');

  // --- Goal State ---
  const [newGoalDescription, setNewGoalDescription] = useState('');
  const [newGoalCriteria, setNewGoalCriteria] = useState('');
  const [newGoalDeliverableId, setNewGoalDeliverableId] = useState('');
  const [newGoalDueDate, setNewGoalDueDate] = useState('');
  const [newGoalProgress, setNewGoalProgress] = useState<number>(0);

  // --- Handlers ---

  const addTask = () => {
    if (!newTaskName.trim()) return;
    const newTask: Task = {
      id: `task-${Date.now()}`,
      name: newTaskName,
      status: 'Todo',
      priority: newTaskPriority,
      startDate: new Date().toISOString().split('T')[0], // Default to today
      dueDate: '',
      milestoneId: '',
      assigneeId: '',
      dependencies: newTaskDependency ? [newTaskDependency] : [],
      estHours: Number(newTaskEstHours) || 0,
      storyPoints: Number(newTaskStoryPoints) || 0,
    };
    setTasks([...tasks, newTask]);
    setNewTaskName('');
    setNewTaskDependency('');
    setNewTaskEstHours('');
    setNewTaskStoryPoints('');
    setNewTaskPriority('Medium');
  };

  const addMilestone = () => {
    if (!newMilestoneName.trim()) return;
    const newMs: Milestone = {
      id: `ms-${Date.now()}`,
      name: newMilestoneName,
      dueDate: '',
      deliverableId: ''
    };
    setMilestones([...milestones, newMs]);
    setNewMilestoneName('');
  };

  const addDeliverable = () => {
    if (!newDeliverableName.trim()) return;
    const newDel: Deliverable = {
      id: `del-${Date.now()}`,
      name: newDeliverableName,
      dueDate: ''
    };
    setDeliverables([...deliverables, newDel]);
    setNewDeliverableName('');
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const updateMilestone = (id: string, updates: Partial<Milestone>) => {
    setMilestones(milestones.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const updateDeliverable = (id: string, updates: Partial<Deliverable>) => {
    setDeliverables(deliverables.map(d => d.id === id ? { ...d, ...updates } : d));
  };

  const addGoal = () => {
    if (!newGoalDescription.trim() || !setGoals) return;
    const newGoal: Goal = {
      id: `goal-${Date.now()}`,
      description: newGoalDescription,
      criteria: newGoalCriteria,
      deliverableId: newGoalDeliverableId,
      dueDate: newGoalDueDate,
      progress: newGoalProgress,
    };
    setGoals([...goals, newGoal]);
    setNewGoalDescription('');
    setNewGoalCriteria('');
    setNewGoalDeliverableId('');
    setNewGoalDueDate('');
    setNewGoalProgress(0);
  };

  const updateGoal = (id: string, updates: Partial<Goal>) => {
    if (!setGoals) return;
    setGoals(goals.map(g => g.id === id ? { ...g, ...updates } : g));
  };

  const deleteGoal = (id: string) => {
    if (!setGoals) return;
    setGoals(goals.filter(g => g.id !== id));
  };

  const deleteTask = (id: string) => setTasks(tasks.filter(t => t.id !== id));
  const deleteMilestone = (id: string) => {
      setMilestones(milestones.filter(m => m.id !== id));
      // Optional: unassign tasks connected to this milestone
      setTasks(tasks.map(t => t.milestoneId === id ? {...t, milestoneId: ''} : t));
  };
  const deleteDeliverable = (id: string) => {
      setDeliverables(deliverables.filter(d => d.id !== id));
      // Optional: unassign milestones connected to this deliverable
      setMilestones(milestones.map(m => m.deliverableId === id ? {...m, deliverableId: ''} : m));
  };

  // Dependency Management
  const addDependency = (taskId: string, depId: string) => {
      if (!depId) return;
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;
      const currentDeps = task.dependencies || [];
      if (!currentDeps.includes(depId)) {
          updateTask(taskId, { dependencies: [...currentDeps, depId] });
      }
  };

  const removeDependency = (taskId: string, depId: string) => {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;
      const currentDeps = task.dependencies || [];
      updateTask(taskId, { dependencies: currentDeps.filter(d => d !== depId) });
  };

  // Helper to check if dependencies are met
  const isTaskBlocked = (task: Task) => {
      if (!task.dependencies || task.dependencies.length === 0) return false;
      // Find all dependency tasks
      const depTasks = tasks.filter(t => task.dependencies?.includes(t.id));
      // If any dependency is not Done, task is blocked
      return depTasks.some(t => t.status !== 'Done');
  };

  const getPriorityColor = (priority: string) => {
      switch(priority) {
          case 'High': return 'bg-red-100 text-red-700 border-red-200';
          case 'Medium': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
          case 'Low': return 'bg-green-50 text-green-700 border-green-200';
          default: return 'bg-slate-50 text-slate-600';
      }
  };

  return (
    <div className="space-y-12 pb-12">
      
      {/* --- TASKS SECTION (TOP) --- */}
      <section className="bg-white  shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
               ✅ Tasks
            </h3>
            <p className="text-xs text-slate-500">Granular activities assigned to team members.</p>
          </div>
          <div className="flex flex-wrap gap-2 w-full xl:w-auto">
             <input 
               type="text" 
               value={newTaskName}
               onChange={(e) => setNewTaskName(e.target.value)}
               placeholder="New Task Name"
               className="flex-1 sm:flex-none px-3 py-1.5 border border-slate-300  text-sm outline-none focus:border-blue-700 bg-white text-slate-600 placeholder:text-slate-400 min-w-[200px]"
               onKeyDown={(e) => e.key === 'Enter' && addTask()}
             />
             <select
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value as any)}
                className="px-3 py-1.5 border border-slate-300  text-sm outline-none focus:border-blue-700 bg-white text-slate-600 w-28"
             >
                 <option value="High">High</option>
                 <option value="Medium">Medium</option>
                 <option value="Low">Low</option>
             </select>
             <select
                value={newTaskDependency}
                onChange={(e) => setNewTaskDependency(e.target.value)}
                className="px-3 py-1.5 border border-slate-300  text-sm outline-none focus:border-blue-700 bg-white text-slate-600 max-w-[150px]"
             >
                 <option value="">No Predecessor</option>
                 {tasks.map(t => (
                     <option key={t.id} value={t.id}>{t.name}</option>
                 ))}
             </select>
             <button onClick={addTask} disabled={!newTaskName} className="bg-blue-800 text-white px-3 py-1.5  text-sm font-medium hover:bg-blue-900 disabled:opacity-50 transition shrink-0">Add Task</button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
             <thead className="bg-white text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                   <th className="px-6 py-3 min-w-[200px]">Task Name</th>
                   <th className="px-4 py-3 w-28">Priority</th>
                   <th className="px-4 py-3 min-w-[150px]">Milestone</th>
                   <th className="px-4 py-3 min-w-[200px]">Predecessors</th>
                   <th className="px-4 py-3 min-w-[150px]">Assignee</th>
                   <th className="px-4 py-3 w-28">Story Points</th>
                   <th className="px-4 py-3 w-28">Est. Hours</th>
                   <th className="px-4 py-3 w-32">Due Date</th>
                   <th className="px-4 py-3 w-10"></th>
                </tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
                {tasks
                  .sort((a, b) => {
                      // Custom sort: Priority High->Low, then by Date
                      const pScore = { High: 3, Medium: 2, Low: 1 };
                      if (pScore[a.priority] !== pScore[b.priority]) return pScore[b.priority] - pScore[a.priority];
                      return 0;
                  })
                  .map(task => {
                    const blocked = isTaskBlocked(task);
                    return (
                   <tr key={task.id} className="hover:bg-slate-50 group">
                      <td className="px-6 py-2 flex items-center gap-2">
                         <input 
                             type="checkbox"
                             checked={task.status === 'Done'}
                             onChange={(e) => updateTask(task.id, { status: e.target.checked ? 'Done' : 'Todo' })}
                             className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                             title="Mark as completed"
                         />
                         <TextareaAutosize 
                            value={task.name} 
                            onChange={(e) => updateTask(task.id, { name: e.target.value })}
                            className={`w-full bg-transparent border-none focus:ring-0 p-0 font-medium resize-none overflow-hidden ${task.status === 'Done' ? 'text-slate-400 line-through' : 'text-slate-600'}`}
                         />
                      </td>
                      <td className="px-4 py-2">
                          <select
                            value={task.priority}
                            onChange={(e) => updateTask(task.id, { priority: e.target.value as any })}
                            className={`w-full text-xs font-semibold px-2 py-1  border appearance-none cursor-pointer outline-none ${getPriorityColor(task.priority)}`}
                          >
                             <option value="High">High</option>
                             <option value="Medium">Medium</option>
                             <option value="Low">Low</option>
                          </select>
                      </td>
                      <td className="px-4 py-2">
                         <select 
                            value={task.milestoneId || ''}
                            onChange={(e) => updateTask(task.id, { milestoneId: e.target.value })}
                            className="w-full bg-transparent border border-slate-200  px-2 py-1 text-xs focus:border-blue-700 outline-none text-slate-600"
                         >
                            <option value="">-- No Milestone --</option>
                            {milestones.map(m => (
                               <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                         </select>
                      </td>
                      <td className="px-4 py-2">
                         <div className="flex flex-wrap gap-1 mb-1">
                             {task.dependencies && task.dependencies.map(depId => {
                                 const depTask = tasks.find(t => t.id === depId);
                                 if(!depTask) return null;
                                 return (
                                     <span key={depId} className={`inline-flex items-center gap-1 px-1.5 py-0.5  border text-[10px] ${depTask.status === 'Done' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700 font-semibold'}`}>
                                         <span className="truncate max-w-[80px]" title={depTask.name}>{depTask.name}</span>
                                         <button onClick={() => removeDependency(task.id, depId)} className="hover:text-red-900 transition-colors">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                                         </button>
                                     </span>
                                 )
                             })}
                         </div>
                         <select 
                            value=""
                            onChange={(e) => addDependency(task.id, e.target.value)}
                            className="w-full bg-transparent border border-slate-200  px-2 py-1 text-xs focus:border-blue-700 outline-none text-slate-400 hover:text-slate-600 transition"
                         >
                            <option value="">+ Add Predecessor</option>
                            {tasks
                                .filter(t => t.id !== task.id && !task.dependencies?.includes(t.id)) // Filter self and already selected
                                .map(t => (
                               <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                         </select>
                      </td>
                      <td className="px-4 py-2">
                         <select 
                            value={task.assigneeId || ''}
                            onChange={(e) => updateTask(task.id, { assigneeId: e.target.value })}
                            className="w-full bg-transparent border border-slate-200  px-2 py-1 text-xs focus:border-blue-700 outline-none text-slate-600"
                         >
                            <option value="">Unassigned</option>
                            {team.map(t => (
                               <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                         </select>
                      </td>
                      <td className="px-4 py-2">
                         <input 
                            type="number" 
                            min="0"
                            value={task.storyPoints || ''}
                            onChange={(e) => updateTask(task.id, { storyPoints: Number(e.target.value) || undefined })}
                            placeholder="Points"
                            className="w-full bg-transparent border border-slate-200 px-2 py-1 text-xs focus:border-blue-700 outline-none text-slate-600"
                         />
                      </td>
                      <td className="px-4 py-2">
                         <input 
                            type="number"
                            min="0"
                            step="0.5"
                            value={task.estHours || ''}
                            onChange={(e) => updateTask(task.id, { estHours: Number(e.target.value) || undefined })}
                            placeholder="Hours"
                            className="w-full bg-transparent border border-slate-200 px-2 py-1 text-xs focus:border-blue-700 outline-none text-slate-600"
                         />
                      </td>
                      <td className="px-4 py-2">
                         <input 
                            type="date" 
                            value={task.dueDate || ''}
                            onChange={(e) => updateTask(task.id, { dueDate: e.target.value })}
                            className="w-full bg-transparent text-xs text-slate-500 focus:text-slate-700 outline-none"
                         />
                      </td>
                      <td className="px-4 py-2 text-right">
                         <button onClick={() => deleteTask(task.id)} className="text-slate-300 hover:text-red-500">
                           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                         </button>
                      </td>
                   </tr>
                )})}
                {tasks.length === 0 && (
                   <tr>
                      <td colSpan={9} className="px-6 py-8 text-center text-slate-400 italic">No tasks created yet.</td>
                   </tr>
                )}
             </tbody>
          </table>
        </div>
      </section>


      {/* --- MILESTONES SECTION (MIDDLE) --- */}
      <section className="bg-white  shadow-sm border border-slate-200 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-1 h-full bg-blue-700"></div>
        <div className="bg-slate-50/30 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
               🚩 Milestones
            </h3>
            <p className="text-xs text-slate-500">Key achievements grouped by Deliverable.</p>
          </div>
          <div className="flex gap-2">
             <input 
               type="text" 
               value={newMilestoneName}
               onChange={(e) => setNewMilestoneName(e.target.value)}
               placeholder="New Milestone Name"
               className="px-3 py-1.5 border border-slate-300  text-sm outline-none focus:border-blue-700 bg-white text-slate-600 placeholder:text-slate-400"
               onKeyDown={(e) => e.key === 'Enter' && addMilestone()}
             />
             <button onClick={addMilestone} disabled={!newMilestoneName} className="bg-blue-800 text-white px-3 py-1.5  text-sm font-medium hover:bg-blue-900 disabled:opacity-50 transition">Add Milestone</button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
             <thead className="bg-white text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                   <th className="px-6 py-3 w-1/3">Milestone Name</th>
                   <th className="px-4 py-3">Linked Deliverable</th>
                   <th className="px-4 py-3 w-32">Due Date</th>
                   <th className="px-4 py-3 w-10"></th>
                </tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
                {milestones.map(ms => (
                   <tr key={ms.id} className="hover:bg-slate-50">
                      <td className="px-6 py-2">
                         <TextareaAutosize 
                            value={ms.name} 
                            onChange={(e) => updateMilestone(ms.id, { name: e.target.value })}
                            className="w-full bg-transparent border-none focus:ring-0 p-0 font-medium text-slate-600 resize-none overflow-hidden"
                         />
                      </td>
                      <td className="px-4 py-2">
                         <select 
                            value={ms.deliverableId || ''}
                            onChange={(e) => updateMilestone(ms.id, { deliverableId: e.target.value })}
                            className="w-full bg-transparent border border-slate-200  px-2 py-1 text-xs focus:border-blue-700 outline-none text-slate-600"
                         >
                            <option value="">-- No Deliverable --</option>
                            {deliverables.map(d => (
                               <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                         </select>
                      </td>
                      <td className="px-4 py-2">
                         <input 
                            type="date" 
                            value={ms.dueDate || ''}
                            onChange={(e) => updateMilestone(ms.id, { dueDate: e.target.value })}
                            className="w-full bg-transparent text-xs text-slate-500 focus:text-slate-700 outline-none"
                         />
                      </td>
                      <td className="px-4 py-2 text-right">
                         <button onClick={() => deleteMilestone(ms.id)} className="text-slate-300 hover:text-red-500">
                           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                         </button>
                      </td>
                   </tr>
                ))}
                {milestones.length === 0 && (
                   <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-slate-400 italic">No milestones created yet.</td>
                   </tr>
                )}
             </tbody>
          </table>
        </div>
      </section>

      {/* --- DELIVERABLES SECTION (BOTTOM) --- */}
      <section className="bg-white  shadow-sm border border-slate-200 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-1 h-full bg-slate-800"></div>
        <div className="bg-slate-100 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
               📦 Deliverables
            </h3>
            <p className="text-xs text-slate-500">High-level outputs of the project.</p>
          </div>
          <div className="flex gap-2">
             <input 
               type="text" 
               value={newDeliverableName}
               onChange={(e) => setNewDeliverableName(e.target.value)}
               placeholder="New Deliverable Name"
               className="px-3 py-1.5 border border-slate-300  text-sm outline-none focus:border-blue-700 bg-white text-slate-600 placeholder:text-slate-400"
               onKeyDown={(e) => e.key === 'Enter' && addDeliverable()}
             />
             <button onClick={addDeliverable} disabled={!newDeliverableName} className="bg-slate-800 text-white px-3 py-1.5  text-sm font-medium hover:bg-slate-700 disabled:opacity-50 transition">Add Deliverable</button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
             <thead className="bg-white text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                   <th className="px-6 py-3 w-1/3">Deliverable Name</th>
                   <th className="px-4 py-3">Description</th>
                   <th className="px-4 py-3 w-32">Due Date</th>
                   <th className="px-4 py-3 w-10"></th>
                </tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
                {deliverables.map(del => (
                   <tr key={del.id} className="hover:bg-slate-50">
                      <td className="px-6 py-2">
                         <TextareaAutosize 
                            value={del.name} 
                            onChange={(e) => updateDeliverable(del.id, { name: e.target.value })}
                            className="w-full bg-transparent border-none focus:ring-0 p-0 font-medium text-slate-600 resize-none overflow-hidden"
                         />
                      </td>
                      <td className="px-4 py-2">
                         <TextareaAutosize 
                            value={del.description || ''} 
                            onChange={(e) => updateDeliverable(del.id, { description: e.target.value })}
                            placeholder="Optional description..."
                            className="w-full bg-transparent border-none focus:ring-0 p-0 text-slate-400 text-xs italic resize-none overflow-hidden"
                         />
                      </td>
                      <td className="px-4 py-2">
                         <input 
                            type="date" 
                            value={del.dueDate || ''}
                            onChange={(e) => updateDeliverable(del.id, { dueDate: e.target.value })}
                            className="w-full bg-transparent text-xs text-slate-500 focus:text-slate-700 outline-none"
                         />
                      </td>
                      <td className="px-4 py-2 text-right">
                         <button onClick={() => deleteDeliverable(del.id)} className="text-slate-300 hover:text-red-500">
                           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                         </button>
                      </td>
                   </tr>
                ))}
                {deliverables.length === 0 && (
                   <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-slate-400 italic">No deliverables created yet.</td>
                   </tr>
                )}
             </tbody>
          </table>
        </div>
      </section>

      {/* --- GOALS SECTION (BOTTOM) --- */}
      <section className="bg-white shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
               🎯 Goals (SMART)
            </h3>
            <p className="text-xs text-slate-500">Specific, Measurable, Achievable, Relevant, and Time-Bound goals tied to deliverables.</p>
          </div>
          <div className="flex flex-wrap gap-2 w-full xl:w-auto">
             <input 
               type="text" 
               value={newGoalDescription}
               onChange={(e) => setNewGoalDescription(e.target.value)}
               placeholder="Goal Description"
               className="flex-1 sm:flex-none px-3 py-1.5 border border-slate-300 text-sm outline-none focus:border-blue-700 bg-white text-slate-600 placeholder:text-slate-400 min-w-[200px]"
             />
             <input 
               type="text" 
               value={newGoalCriteria}
               onChange={(e) => setNewGoalCriteria(e.target.value)}
               placeholder="Success Criteria"
               className="flex-1 sm:flex-none px-3 py-1.5 border border-slate-300 text-sm outline-none focus:border-blue-700 bg-white text-slate-600 placeholder:text-slate-400 min-w-[150px]"
             />
             <select
                value={newGoalDeliverableId}
                onChange={(e) => setNewGoalDeliverableId(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 text-sm outline-none focus:border-blue-700 bg-white text-slate-600"
             >
                <option value="">No Deliverable</option>
                {deliverables.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
             </select>
             <input 
               type="date" 
               value={newGoalDueDate}
               onChange={(e) => setNewGoalDueDate(e.target.value)}
               className="px-3 py-1.5 border border-slate-300 text-sm outline-none focus:border-blue-700 bg-white text-slate-600"
             />
             <button onClick={addGoal} className="px-4 py-1.5 bg-blue-800 text-white text-sm font-semibold hover:bg-blue-900 transition w-full sm:w-auto">
               Add Goal
             </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
             <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 text-xs uppercase tracking-wider">
                   <th className="px-6 py-3 font-semibold">Goal Description</th>
                   <th className="px-4 py-3 font-semibold">Success Criteria</th>
                   <th className="px-4 py-3 font-semibold">Deliverable (Relevant)</th>
                   <th className="px-4 py-3 font-semibold w-40">Due Date (Time-Bound)</th>
                   <th className="px-4 py-3 font-semibold w-32">Progress (%)</th>
                   <th className="px-4 py-3 font-semibold text-right w-20">Actions</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
                {goals.map(goal => (
                   <tr key={goal.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-6 py-2">
                         <input 
                            type="text"
                            value={goal.description}
                            onChange={(e) => updateGoal(goal.id, { description: e.target.value })}
                            className="w-full font-medium text-slate-800 text-sm bg-transparent focus:bg-white focus:ring-1 focus:ring-blue-700 outline-none px-1 py-0.5"
                         />
                      </td>
                      <td className="px-4 py-2">
                         <input 
                            type="text"
                            value={goal.criteria}
                            onChange={(e) => updateGoal(goal.id, { criteria: e.target.value })}
                            className="w-full text-slate-600 text-sm bg-transparent focus:bg-white focus:ring-1 focus:ring-blue-700 outline-none px-1 py-0.5"
                            placeholder="e.g., metric"
                         />
                      </td>
                      <td className="px-4 py-2">
                         <select
                            value={goal.deliverableId || ''}
                            onChange={(e) => updateGoal(goal.id, { deliverableId: e.target.value })}
                            className="w-full bg-transparent text-sm text-slate-600 focus:bg-white focus:ring-1 focus:ring-blue-700 outline-none p-1"
                         >
                            <option value="">No Deliverable</option>
                            {deliverables.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                         </select>
                      </td>
                      <td className="px-4 py-2">
                         <input 
                            type="date"
                            value={goal.dueDate || ''}
                            onChange={(e) => updateGoal(goal.id, { dueDate: e.target.value })}
                            className="w-full bg-transparent text-xs text-slate-500 focus:text-slate-700 outline-none"
                         />
                      </td>
                      <td className="px-4 py-2 flex items-center h-full pt-1.5">
                         <input 
                            type="number"
                            min="0"
                            max="100"
                            value={goal.progress || 0}
                            onChange={(e) => updateGoal(goal.id, { progress: Number(e.target.value) })}
                            className="w-16 bg-transparent text-sm text-slate-600 focus:bg-white focus:ring-1 focus:ring-blue-700 outline-none p-1 border border-slate-200"
                         /> 
                         <span className="ml-1 text-xs text-slate-500">%</span>
                      </td>
                      <td className="px-4 py-2 text-right">
                         <button onClick={() => deleteGoal(goal.id)} className="text-slate-300 hover:text-red-500">
                           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                         </button>
                      </td>
                   </tr>
                ))}
                {goals.length === 0 && (
                   <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-400 italic">No goals added yet.</td>
                   </tr>
                )}
             </tbody>
          </table>
        </div>
      </section>

    </div>
  );
};