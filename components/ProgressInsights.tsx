import React, { useMemo } from 'react';
import { Task, Milestone, TeamMember } from '../types';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    PieChart, Pie, Cell, Legend, BarChart, Bar 
} from 'recharts';

interface ProgressInsightsProps {
    tasks: Task[];
    milestones: Milestone[];
    team: TeamMember[];
}

export const ProgressInsights: React.FC<ProgressInsightsProps> = ({ tasks, milestones, team }) => {
    // Colors
    const COLORS = {
        Todo: '#cbd5e1', // slate-300
        'In Progress': '#93c5fd', // blue-300
        Done: '#86efac', // green-300
        StartedLine: '#8b5cf6', // violet-500
        DueLine: '#ef4444' // red-500
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

    // 2. Timeline Burn-up (Area Chart)
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

        return sortedDates.map(date => {
            // Count tasks exactly on this date
            const startedOnDate = tasks.filter(t => t.startDate === date).length;
            const dueOnDate = tasks.filter(t => t.dueDate === date).length;
            
            cumStarted += startedOnDate;
            cumDue += dueOnDate;

            return {
                date: new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                fullDate: date,
                'Tasks Started': cumStarted,
                'Tasks Due (Deadline)': cumDue
            };
        });
    }, [tasks, milestones]);

    // 3. Assignee Workload (Bar Chart)
    const assigneeData = useMemo(() => {
        const data = team.map(member => {
            const memberTasks = tasks.filter(t => t.assigneeId === member.id);
            return {
                name: member.name.split(' ')[0], // First name for compactness
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

    // Quick Stats
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'Done').length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    return (
        <div className="space-y-6">
            
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
                    <p className="text-sm font-medium text-slate-500 mb-1">Milestones</p>
                    <p className="text-3xl font-bold text-slate-800">{milestones.length}</p>
                </div>
            </div>

            {totalTasks === 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500">
                    <p className="text-lg">No task data available.</p>
                    <p className="text-sm mt-1">Add tasks in the Work Breakdown section to see insights.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Burn-up Chart */}
                    <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Cumulative Scope Timeline</h3>
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={timelineData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorStarted" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={COLORS.StartedLine} stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor={COLORS.StartedLine} stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="colorDue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={COLORS.DueLine} stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor={COLORS.DueLine} stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 12 }} tickMargin={10} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                                    <Area type="stepAfter" dataKey="Tasks Started" stroke={COLORS.StartedLine} strokeWidth={2} fillOpacity={1} fill="url(#colorStarted)" />
                                    <Area type="stepAfter" dataKey="Tasks Due (Deadline)" stroke={COLORS.DueLine} strokeWidth={2} fillOpacity={1} fill="url(#colorDue)" />
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

                    {/* Assignee Workload */}
                    <div className="lg:col-span-3 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Workload by Assignee</h3>
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

                </div>
            )}
        </div>
    );
};
