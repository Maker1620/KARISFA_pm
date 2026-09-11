import React from 'react';
import { Task, Milestone, TeamMember } from '../types';

interface GanttChartProps {
  tasks: Task[];
  milestones: Milestone[];
  team: TeamMember[];
}

export const GanttChart: React.FC<GanttChartProps> = ({ tasks, milestones, team }) => {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 py-20 bg-white  border border-slate-200">
        <span className="text-4xl mb-4">📊</span>
        <h3 className="text-lg font-medium text-slate-600">No Tasks to Display</h3>
        <p>Add tasks with Start and Due dates in the Work Breakdown tab to see the Gantt chart.</p>
      </div>
    );
  }

  // 1. Determine timeline bounds
  const getTaskDates = (task: Task) => {
    const start = task.startDate ? new Date(task.startDate) : new Date();
    const end = task.dueDate ? new Date(task.dueDate) : new Date(start.getTime() + 86400000 * 5); // Default 5 days if no end
    if (end < start) return { start, end: start };
    return { start, end };
  };

  let minDate = new Date();
  let maxDate = new Date();
  
  tasks.forEach((t, i) => {
    const { start, end } = getTaskDates(t);
    if (i === 0) {
      minDate = start;
      maxDate = end;
    } else {
      if (start < minDate) minDate = start;
      if (end > maxDate) maxDate = end;
    }
  });

  // Pad the timeline
  minDate = new Date(minDate);
  minDate.setDate(minDate.getDate() - 2);
  maxDate = new Date(maxDate);
  maxDate.setDate(maxDate.getDate() + 5);

  const totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
  const dateArray = Array.from({ length: totalDays + 1 }, (_, i) => {
    const d = new Date(minDate);
    d.setDate(d.getDate() + i);
    return d;
  });

  // Helper to calculate bar positioning
  const getBarStyles = (task: Task) => {
    const { start, end } = getTaskDates(task);
    const startOffset = Math.ceil((start.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
    const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    // Safety check
    const safeStart = Math.max(0, startOffset);
    const safeDuration = Math.max(1, duration); // Minimum 1 day width

    return {
      gridColumnStart: safeStart + 1,
      gridColumnEnd: `span ${safeDuration}`,
    };
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-400 border-red-500';
      case 'Medium': return 'bg-yellow-400 border-yellow-500';
      case 'Low': return 'bg-green-400 border-green-500';
      default: return 'bg-blue-400 border-blue-500';
    }
  };

  return (
    <div className="bg-white  shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
        <div>
           <h3 className="text-lg font-bold text-slate-800">Project Gantt Chart</h3>
           <p className="text-xs text-slate-500">Visual timeline of tasks and milestones.</p>
        </div>
        <div className="flex gap-4 text-xs">
            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-400 "></div> High</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-yellow-400 "></div> Medium</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-400 "></div> Low</div>
        </div>
      </div>
      
      <div className="overflow-auto flex-1 p-6">
        <div className="inline-block min-w-full">
           {/* Timeline Grid */}
           <div className="grid gap-y-2" style={{ 
               gridTemplateColumns: `200px repeat(${totalDays}, 40px)` 
           }}>
              {/* Header Row */}
              <div className="font-bold text-slate-700 sticky left-0 bg-white z-10 px-2 py-1 border-b border-slate-200">
                  Task
              </div>
              {dateArray.map((date, i) => (
                  <div key={i} className={`text-[10px] text-center text-slate-500 border-l border-slate-100 py-1 ${date.getDay() === 0 || date.getDay() === 6 ? 'bg-slate-50' : ''}`}>
                      <div className="font-bold">{date.getDate()}</div>
                      <div>{date.toLocaleString('default', { month: 'short' })}</div>
                  </div>
              ))}

              {/* Task Rows */}
              {tasks.map(task => {
                   const assignee = team.find(t => t.id === task.assigneeId);
                   return (
                      <React.Fragment key={task.id}>
                          {/* Label Column */}
                          <div className="sticky left-0 bg-white z-10 px-2 py-2 flex flex-col justify-center border-r border-slate-100 h-10 shadow-[4px_0_4px_-4px_rgba(0,0,0,0.1)]">
                              <span className="text-xs font-semibold text-slate-700 truncate block max-w-[180px]" title={task.name}>{task.name}</span>
                              <div className="flex gap-2 text-[10px]">
                                <span className="text-slate-500">{assignee ? assignee.name.split(' ')[0] : 'Unassigned'}</span>
                                {task.milestoneId && (
                                    <span className="text-blue-700 font-bold truncate max-w-[80px]">
                                        MS: {milestones.find(m => m.id === task.milestoneId)?.name || 'Unknown'}
                                    </span>
                                )}
                              </div>
                          </div>

                          {/* Bar Container */}
                          <div className="col-span-full relative h-10 border-b border-slate-50" style={{ gridColumnStart: 2, gridColumnEnd: -1 }}>
                              {/* Background grid lines for this row */}
                              <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${totalDays}, 40px)` }}>
                                   {dateArray.map((_, i) => (
                                       <div key={i} className="border-l border-slate-100 h-full"></div>
                                   ))}
                              </div>

                              {/* The Gantt Bar */}
                              <div 
                                className="absolute top-2 h-6  shadow-sm border opacity-90 transition hover:opacity-100 hover:shadow-md cursor-pointer z-0 group"
                                style={{
                                    ...getBarStyles(task),
                                    display: 'grid', // to allow grid positioning
                                }}
                              >
                                 <div 
                                    className={`h-full w-full  ${getPriorityColor(task.priority)}`}
                                 ></div>
                              </div>
                          </div>
                      </React.Fragment>
                   );
              })}
           </div>
        </div>

        {/* Improved Table Implementation */}
        <div className="mt-8">
            <div className="relative min-w-full overflow-x-auto border border-slate-200  bg-white mt-[-2rem] z-30">
                 <div style={{ width: `${250 + (totalDays * 40)}px` }}>
                     <div className="flex bg-slate-100 border-b border-slate-200">
                         <div className="w-[250px] shrink-0 p-2 font-bold text-xs text-slate-700 sticky left-0 bg-slate-100 z-20 border-r border-slate-200">Task Details</div>
                         {dateArray.map((d, i) => (
                             <div key={i} className="w-[40px] shrink-0 text-center border-r border-slate-200 p-1 text-[10px]">
                                 <div className="font-bold">{d.getDate()}</div>
                                 <div className="text-slate-500">{d.toLocaleString('default', { month: 'short' })}</div>
                             </div>
                         ))}
                     </div>

                     {tasks.map(task => {
                         const style = getBarStyles(task);
                         const width = parseInt(style.gridColumnEnd.split(' ')[1]) * 40;
                         const left = (style.gridColumnStart - 1) * 40;
                         const assignee = team.find(t => t.id === task.assigneeId);
                         const milestone = milestones.find(m => m.id === task.milestoneId);

                         return (
                             <div key={task.id} className="flex border-b border-slate-100 relative h-12 hover:bg-slate-50 transition">
                                 <div className="w-[250px] shrink-0 p-2 flex flex-col justify-center border-r border-slate-200 sticky left-0 bg-white z-20 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                                     <div className="font-semibold text-xs text-slate-800 truncate">{task.name}</div>
                                     <div className="flex gap-2 text-[10px] mt-0.5">
                                        {assignee && <span className="text-slate-500">{assignee.name.split(' ')[0]}</span>}
                                        {milestone && <span className="text-blue-800 bg-slate-50 px-1 ">MS: {milestone.name}</span>}
                                     </div>
                                 </div>
                                 <div className="flex-1 relative" style={{ backgroundImage: 'repeating-linear-gradient(to right, transparent, transparent 39px, #f1f5f9 40px)' }}>
                                     {/* Bar */}
                                     <div 
                                        className={`absolute top-2 h-8  border shadow-sm flex items-center px-2 text-[10px] text-white font-medium whitespace-nowrap overflow-hidden ${getPriorityColor(task.priority)}`}
                                        style={{
                                            left: `${left}px`,
                                            width: `${width}px`
                                        }}
                                        title={`${task.name} (${task.status})`}
                                     >
                                         {width > 40 && task.status}
                                     </div>
                                 </div>
                             </div>
                         );
                     })}
                 </div>
            </div>

         </div>
      </div>
    </div>
  );
};