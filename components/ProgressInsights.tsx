import React, { useMemo, useRef, useState } from 'react';
import { Task, Milestone, TeamMember, Deliverable, ProjectResource } from '../types';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    PieChart, Pie, Cell, Legend, BarChart, Bar, LineChart, Line
} from 'recharts';
// @ts-ignore
import html2pdf from 'html2pdf.js';

interface ProgressInsightsProps {
    tasks: Task[];
    milestones: Milestone[];
    team: TeamMember[];
    deliverables: Deliverable[];
    resources: ProjectResource[];
}

export const ProgressInsights: React.FC<ProgressInsightsProps> = ({ tasks, milestones, team, deliverables, resources }) => {
    const [isDownloading, setIsDownloading] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);
    
    const handleDownloadPDF = () => {
        if (!contentRef.current) return;
        setIsDownloading(true);

        const opt = {
            margin:       0.5,
            filename:     'Progress_Insights_Dashboard.pdf',
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2 },
            jsPDF:        { unit: 'in', format: 'letter', orientation: 'landscape' }
        };

        html2pdf().set(opt).from(contentRef.current).save().then(() => {
            setIsDownloading(false);
        }).catch((e: any) => {
            console.error("PDF generation failed", e);
            setIsDownloading(false);
            alert("Failed to generate PDF.");
        });
    };

    // Colors
    const COLORS = {
        Todo: '#cbd5e1',
        'In Progress': '#93c5fd',
        Done: '#86efac',
        StartedLine: '#8b5cf6',
        DueLine: '#ef4444',
        Budget: '#e2e8f0',
        Spent: '#f59e0b'
    };

    // 1. Task Status Distribution (Pie Chart)
    const statusData = useMemo(() => {
        const counts = { Todo: 0, 'In Progress': 0, Done: 0 };
        tasks.forEach(t => {
            if (t.status === 'Todo' || t.status === 'In Progress' || t.status === 'Done') {
                counts[t.status]++;
            } else {
                counts.Todo++; // Fallback
            }
        });
        return [
            { name: 'Todo', value: counts.Todo, color: COLORS.Todo },
            { name: 'In Progress', value: counts['In Progress'], color: COLORS['In Progress'] },
            { name: 'Done', value: counts.Done, color: COLORS.Done }
        ];
    }, [tasks]);

    // 2. Timeline Burn-up (Area Chart) + Velocity
    const timelineData = useMemo(() => {
        const dates = new Set<string>();
        tasks.forEach(t => {
            if (t.startDate) dates.add(t.startDate);
            if (t.dueDate) dates.add(t.dueDate);
        });
        milestones.forEach(m => {
            if (m.date) dates.add(m.date);
        });
        
        const sortedDates = Array.from(dates).sort();
        
        if (sortedDates.length === 0) return [];

        let cumStarted = 0;
        let cumDue = 0;
        let cumCompleted = 0;

        return sortedDates.map(date => {
            const startedOnDate = tasks.filter(t => t.startDate === date).length;
            const dueOnDate = tasks.filter(t => t.dueDate === date).length;
            const completedOnDate = tasks.filter(t => t.dueDate === date && t.status === 'Done').length; // Proxy for completion date
            
            cumStarted += startedOnDate;
            cumDue += dueOnDate;
            cumCompleted += completedOnDate;

            return {
                date: new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                fullDate: date,
                'Tasks Started': cumStarted,
                'Tasks Due': cumDue,
                'Tasks Completed': cumCompleted
            };
        });
    }, [tasks, milestones]);

    // 3. Assignee Workload (Bar Chart)
    const assigneeData = useMemo(() => {
        const data = team.map(member => {
            const memberTasks = tasks.filter(t => t.assigneeId === member.id);
            return {
                name: member.name.split(' ')[0],
                Todo: memberTasks.filter(t => t.status === 'Todo').length,
                'In Progress': memberTasks.filter(t => t.status === 'In Progress').length,
                Done: memberTasks.filter(t => t.status === 'Done').length,
            };
        });
        
        const unassignedTasks = tasks.filter(t => !t.assigneeId);
        if (unassignedTasks.length > 0) {
            data.push({
                name: 'Unassigned',
                Todo: unassignedTasks.filter(t => t.status === 'Todo').length,
                'In Progress': unassignedTasks.filter(t => t.status === 'In Progress').length,
                Done: unassignedTasks.filter(t => t.status === 'Done').length,
            });
        }
        
        return data.filter(d => d.Todo + d['In Progress'] + d.Done > 0);
    }, [tasks, team]);

    // 4. Financial Tracking
    const { totalBudget, actualSpend } = useMemo(() => {
        let budget = 0;
        let spend = 0;
        resources.forEach(r => {
            const cost = r.type === 'People' ? r.totalCost : r.cost;
            budget += cost || 0;
            // Since we don't have an explicit actual cost field yet, we'll estimate based on completed tasks linked to resources
            // For MVP, if a resource is linked to a task/milestone that is done, we count it as actual spend.
            // If it's a person, we calculate based on task status.
            if (r.type === 'People' && r.taskId) {
                const task = tasks.find(t => t.id === r.taskId);
                if (task?.status === 'Done') spend += cost;
                else if (task?.status === 'In Progress') spend += cost * 0.5; // Roughly half
            } else if (r.type !== 'People' && r.linkedIds?.length > 0) {
                // Check if any linked item is complete
                const isComplete = r.linkedIds.some(id => {
                    const task = tasks.find(t => t.id === id);
                    if (task && task.status === 'Done') return true;
                    // Note: We don't track milestone completion explicitly, just rely on tasks
                    return false;
                });
                if (isComplete) spend += cost;
            }
        });
        return { totalBudget: budget, actualSpend: spend };
    }, [resources, tasks]);

    const budgetUtilization = totalBudget > 0 ? Math.round((actualSpend / totalBudget) * 100) : 0;

    // 5. Deliverable Progress
    const deliverableProgress = useMemo(() => {
        return deliverables.map(del => {
            // Find milestones for this deliverable
            const delMilestones = milestones.filter(m => m.deliverableId === del.id);
            const delTasks = tasks.filter(t => delMilestones.some(m => m.id === t.milestoneId));
            
            const total = delTasks.length;
            const completed = delTasks.filter(t => t.status === 'Done').length;
            const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
            
            return {
                id: del.id,
                name: del.name,
                total,
                completed,
                percent
            };
        });
    }, [deliverables, milestones, tasks]);

    // Quick Stats
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'Done').length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    return (
        <div className="space-y-6 pb-12">
            <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                    <h2 className="text-lg font-bold text-slate-800">Progress Insights Dashboard</h2>
                    <p className="text-sm text-slate-500">Live overview of project status, key milestones, and financial metrics.</p>
                </div>
                <button
                    onClick={handleDownloadPDF}
                    disabled={isDownloading || totalTasks === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 disabled:opacity-50 transition shadow-sm"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                    {isDownloading ? 'Generating PDF...' : 'Download PDF Report'}
                </button>
            </div>

            <div ref={contentRef} className="space-y-6">
                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    <p className="text-sm font-medium text-slate-500 mb-1">Total Tasks</p>
                    <p className="text-3xl font-bold text-slate-800">{totalTasks}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    <p className="text-sm font-medium text-slate-500 mb-1">Completed Tasks</p>
                    <p className="text-3xl font-bold text-green-600">{completedTasks}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    <p className="text-sm font-medium text-slate-500 mb-1">Completion Rate</p>
                    <div className="flex items-end gap-2">
                        <p className="text-3xl font-bold text-indigo-600">{completionRate}%</p>
                    </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    <p className="text-sm font-medium text-slate-500 mb-1">Budget Utilized</p>
                    <div className="flex items-end gap-2">
                        <p className={`text-3xl font-bold ${budgetUtilization > 100 ? 'text-red-600' : 'text-slate-800'}`}>
                            {budgetUtilization}%
                        </p>
                        <p className="text-xs text-slate-400 mb-1 pb-0.5 whitespace-nowrap">
                            (${actualSpend.toLocaleString()} / ${totalBudget.toLocaleString()})
                        </p>
                    </div>
                </div>
            </div>

            {totalTasks === 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500">
                    <p className="text-lg">No task data available.</p>
                    <p className="text-sm mt-1">Add tasks in the Work Breakdown section to see insights.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Burn-up Chart + Velocity */}
                    <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Velocity & Scope Burn-up</h3>
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={timelineData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorStarted" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={COLORS.StartedLine} stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor={COLORS.StartedLine} stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="colorDue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={COLORS.DueLine} stopOpacity={0.1}/>
                                            <stop offset="95%" stopColor={COLORS.DueLine} stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="colorDone" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={COLORS.Done} stopOpacity={0.5}/>
                                            <stop offset="95%" stopColor={COLORS.Done} stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 12 }} tickMargin={10} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                                    <Area type="stepAfter" dataKey="Tasks Due" stroke={COLORS.DueLine} strokeWidth={2} fillOpacity={1} fill="url(#colorDue)" />
                                    <Area type="stepAfter" dataKey="Tasks Started" stroke={COLORS.StartedLine} strokeWidth={2} fillOpacity={1} fill="url(#colorStarted)" />
                                    <Area type="stepAfter" dataKey="Tasks Completed" stroke={COLORS.Done} strokeWidth={3} fillOpacity={1} fill="url(#colorDone)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Status Pie Chart */}
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Task Status</h3>
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={statusData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {statusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        itemStyle={{ color: '#1e293b' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                                    />
                                    <Legend verticalAlign="bottom" height={36}/>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Assignee Workload & Capacity */}
                    <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Team Capacity & Workload</h3>
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={assigneeData}
                                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                                    <Tooltip 
                                        cursor={{ fill: '#f8fafc' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                                    <Bar dataKey="Todo" stackId="a" fill={COLORS.Todo} radius={[0, 0, 0, 0]} />
                                    <Bar dataKey="In Progress" stackId="a" fill={COLORS['In Progress']} radius={[0, 0, 0, 0]} />
                                    <Bar dataKey="Done" stackId="a" fill={COLORS.Done} radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Deliverable Progress */}
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm overflow-hidden flex flex-col">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Deliverable Progress</h3>
                        <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                            {deliverableProgress.length === 0 ? (
                                <p className="text-sm text-slate-400 italic">No deliverables mapped to tasks yet.</p>
                            ) : (
                                deliverableProgress.map(del => (
                                    <div key={del.id} className="space-y-1.5">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="font-medium text-slate-700 truncate pr-2" title={del.name}>{del.name}</span>
                                            <span className="text-xs font-bold text-slate-500">{del.percent}%</span>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-2">
                                            <div 
                                                className={`h-2 rounded-full ${del.percent === 100 ? 'bg-green-400' : 'bg-indigo-500'}`} 
                                                style={{ width: `${del.percent}%` }}
                                            ></div>
                                        </div>
                                        <p className="text-[10px] text-slate-400">{del.completed} / {del.total} tasks completed</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                </div>
            )}
            </div>
        </div>
    );
};
