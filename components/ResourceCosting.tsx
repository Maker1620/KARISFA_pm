import React, { useState, useMemo } from 'react';
import { 
    ProjectResource, PeopleCost, ServiceCost, MaterialCost, OtherCost, 
    TeamMember, Task, Milestone, Deliverable 
} from '../types';

interface ResourceCostingProps {
    resources: ProjectResource[];
    setResources: React.Dispatch<React.SetStateAction<ProjectResource[]>>;
    team: TeamMember[];
    tasks: Task[];
    milestones: Milestone[];
    deliverables: Deliverable[];
}

export const ResourceCosting: React.FC<ResourceCostingProps> = ({ 
    resources, setResources, team, tasks, milestones, deliverables 
}) => {
    const [activeTab, setActiveTab] = useState<'People' | 'Service' | 'Material' | 'Other'>('People');

    // --- Totals Calculation ---
    const totals = useMemo(() => {
        return resources.reduce((acc, curr) => {
            acc[curr.type] = (acc[curr.type] || 0) + (curr.type === 'People' ? curr.totalCost : curr.cost);
            acc.All = (acc.All || 0) + (curr.type === 'People' ? curr.totalCost : curr.cost);
            return acc;
        }, { People: 0, Service: 0, Material: 0, Other: 0, All: 0 });
    }, [resources]);

    const deleteResource = (id: string) => {
        setResources(resources.filter(r => r.id !== id));
    };

    const renderSummary = () => (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-indigo-600 p-4 rounded-xl text-white shadow-md">
                <p className="text-indigo-200 text-xs font-medium uppercase">Total Budget</p>
                <p className="text-2xl font-bold">${totals.All.toLocaleString()}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-slate-500 text-xs font-medium uppercase">People</p>
                <p className="text-xl font-semibold text-slate-700">${totals.People.toLocaleString()}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-slate-500 text-xs font-medium uppercase">Services</p>
                <p className="text-xl font-semibold text-slate-700">${totals.Service.toLocaleString()}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-slate-500 text-xs font-medium uppercase">Materials</p>
                <p className="text-xl font-semibold text-slate-700">${totals.Material.toLocaleString()}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-slate-500 text-xs font-medium uppercase">Other</p>
                <p className="text-xl font-semibold text-slate-700">${totals.Other.toLocaleString()}</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            {renderSummary()}
            
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="flex border-b border-slate-200">
                    {['People', 'Service', 'Material', 'Other'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`flex-1 py-4 text-sm font-medium transition-colors border-b-2 ${
                                activeTab === tab 
                                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' 
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                            }`}
                        >
                            {tab} Cost
                        </button>
                    ))}
                </div>
                
                <div className="p-6">
                    {activeTab === 'People' && (
                        <PeopleForm 
                            resources={resources.filter(r => r.type === 'People') as PeopleCost[]}
                            addResource={(r: any) => setResources([...resources, r])}
                            deleteResource={deleteResource}
                            team={team}
                            tasks={tasks}
                        />
                    )}
                    {activeTab === 'Service' && (
                        <ServiceForm 
                            resources={resources.filter(r => r.type === 'Service') as ServiceCost[]}
                            addResource={(r: any) => setResources([...resources, r])}
                            deleteResource={deleteResource}
                            tasks={tasks}
                            milestones={milestones}
                            deliverables={deliverables}
                        />
                    )}
                    {activeTab === 'Material' && (
                        <MaterialForm 
                            resources={resources.filter(r => r.type === 'Material') as MaterialCost[]}
                            addResource={(r: any) => setResources([...resources, r])}
                            deleteResource={deleteResource}
                            tasks={tasks}
                            milestones={milestones}
                            deliverables={deliverables}
                        />
                    )}
                    {activeTab === 'Other' && (
                        <OtherForm 
                            resources={resources.filter(r => r.type === 'Other') as OtherCost[]}
                            addResource={(r: any) => setResources([...resources, r])}
                            deleteResource={deleteResource}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Sub-Components ---

const inputClass = "w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition text-sm bg-white text-slate-600 placeholder:text-slate-400";
const labelClass = "block text-xs font-semibold text-slate-500 mb-1";

const PeopleForm = ({ resources, addResource, deleteResource, team, tasks }: any) => {
    const [state, setState] = useState({ personId: '', taskId: '', units: 0, rate: 0, unitType: 'Hours' });

    const handleAdd = () => {
        if (!state.personId || !state.taskId) return;
        addResource({
            id: `res-people-${Date.now()}`,
            type: 'People',
            ...state,
            totalCost: state.units * state.rate
        });
        setState({ personId: '', taskId: '', units: 0, rate: 0, unitType: 'Hours' });
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end bg-slate-50 p-6 rounded-xl border border-slate-200">
                <div className="md:col-span-1">
                    <label className={labelClass}>Person</label>
                    <select className={inputClass} value={state.personId} onChange={e => setState({...state, personId: e.target.value})}>
                        <option value="">Select...</option>
                        {team.map((t: TeamMember) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                </div>
                <div className="md:col-span-1">
                    <label className={labelClass}>Task</label>
                    <select className={inputClass} value={state.taskId} onChange={e => setState({...state, taskId: e.target.value})}>
                        <option value="">Select...</option>
                        {tasks.map((t: Task) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                </div>
                <div className="md:col-span-1">
                    <label className={labelClass}>Unit Type</label>
                    <input type="text" className={inputClass} placeholder="Hours" value={state.unitType} onChange={e => setState({...state, unitType: e.target.value})} />
                </div>
                <div className="md:col-span-1">
                    <label className={labelClass}>Quantity</label>
                    <input type="number" className={inputClass} value={state.units} onChange={e => setState({...state, units: Number(e.target.value)})} />
                </div>
                <div className="md:col-span-1">
                    <label className={labelClass}>Rate ($)</label>
                    <input type="number" className={inputClass} value={state.rate} onChange={e => setState({...state, rate: Number(e.target.value)})} />
                </div>
                <button onClick={handleAdd} className="w-full px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition text-sm shadow-sm h-[38px] flex items-center justify-center">Add</button>
            </div>

            <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                    <tr>
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">Task</th>
                        <th className="px-4 py-3 text-right">Units</th>
                        <th className="px-4 py-3 text-right">Rate</th>
                        <th className="px-4 py-3 text-right">Total</th>
                        <th className="px-4 py-3 w-10"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {resources.map((r: PeopleCost) => (
                        <tr key={r.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3 font-medium text-slate-800">{team.find((t:any) => t.id === r.personId)?.name || 'Unknown'}</td>
                            <td className="px-4 py-3 text-slate-600">{tasks.find((t:any) => t.id === r.taskId)?.name || 'Unknown'}</td>
                            <td className="px-4 py-3 text-right text-slate-600">{r.units} {r.unitType}</td>
                            <td className="px-4 py-3 text-right text-slate-600">${r.rate}</td>
                            <td className="px-4 py-3 text-right font-bold text-slate-700">${r.totalCost.toLocaleString()}</td>
                            <td className="px-4 py-3 text-right">
                                <button onClick={() => deleteResource(r.id)} className="text-slate-400 hover:text-red-600 transition">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                                </button>
                            </td>
                        </tr>
                    ))}
                    {resources.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400 italic">No people costs allocated yet.</td></tr>}
                </tbody>
            </table>
        </div>
    );
};

const ServiceForm = ({ resources, addResource, deleteResource, tasks, milestones, deliverables }: any) => {
    const [state, setState] = useState({ provider: '', serviceName: '', cost: 0, linkedType: 'Task', linkedId: '' });

    const getLinkOptions = () => {
        if (state.linkedType === 'Task') return tasks;
        if (state.linkedType === 'Milestone') return milestones;
        return deliverables;
    };

    const handleAdd = () => {
        if (!state.provider || !state.serviceName || !state.linkedId) return;
        addResource({ id: `res-serv-${Date.now()}`, type: 'Service', ...state });
        setState({ ...state, provider: '', serviceName: '', cost: 0, linkedId: '' });
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end bg-slate-50 p-6 rounded-xl border border-slate-200">
                <div className="md:col-span-1">
                    <label className={labelClass}>Provider</label>
                    <input type="text" className={inputClass} value={state.provider} onChange={e => setState({...state, provider: e.target.value})} placeholder="Acme Corp" />
                </div>
                <div className="md:col-span-1">
                    <label className={labelClass}>Service</label>
                    <input type="text" className={inputClass} value={state.serviceName} onChange={e => setState({...state, serviceName: e.target.value})} placeholder="Consulting" />
                </div>
                <div className="md:col-span-1">
                    <label className={labelClass}>Link Type</label>
                    <select className={inputClass} value={state.linkedType} onChange={e => setState({...state, linkedType: e.target.value, linkedId: ''})}>
                        <option value="Task">Task</option>
                        <option value="Milestone">Milestone</option>
                        <option value="Deliverable">Deliverable</option>
                    </select>
                </div>
                <div className="md:col-span-1">
                    <label className={labelClass}>Linked Item</label>
                    <select className={inputClass} value={state.linkedId} onChange={e => setState({...state, linkedId: e.target.value})}>
                        <option value="">Select...</option>
                        {getLinkOptions().map((i: any) => <option key={i.id} value={i.id}>{i.name}</option>)}
                    </select>
                </div>
                <div className="md:col-span-1">
                    <label className={labelClass}>Cost ($)</label>
                    <input type="number" className={inputClass} value={state.cost} onChange={e => setState({...state, cost: Number(e.target.value)})} />
                </div>
                <button onClick={handleAdd} className="w-full px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition text-sm shadow-sm h-[38px] flex items-center justify-center">Add</button>
            </div>

            <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                    <tr>
                        <th className="px-4 py-3">Provider</th>
                        <th className="px-4 py-3">Service</th>
                        <th className="px-4 py-3">Linked To</th>
                        <th className="px-4 py-3 text-right">Cost</th>
                        <th className="px-4 py-3 w-10"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {resources.map((r: ServiceCost) => {
                        let linkedName = 'Unknown';
                        if (r.linkedType === 'Task') linkedName = tasks.find((t:any) => t.id === r.linkedId)?.name;
                        else if (r.linkedType === 'Milestone') linkedName = milestones.find((m:any) => m.id === r.linkedId)?.name;
                        else linkedName = deliverables.find((d:any) => d.id === r.linkedId)?.name;

                        return (
                            <tr key={r.id} className="hover:bg-slate-50">
                                <td className="px-4 py-3 font-medium text-slate-800">{r.provider}</td>
                                <td className="px-4 py-3 text-slate-600">{r.serviceName}</td>
                                <td className="px-4 py-3 text-slate-500"><span className="text-[10px] uppercase font-bold mr-2 border border-slate-200 bg-slate-100 rounded px-1.5 py-0.5 text-slate-500">{r.linkedType.charAt(0)}</span>{linkedName}</td>
                                <td className="px-4 py-3 text-right font-bold text-slate-700">${r.cost.toLocaleString()}</td>
                                <td className="px-4 py-3 text-right">
                                    <button onClick={() => deleteResource(r.id)} className="text-slate-400 hover:text-red-600 transition">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                    {resources.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400 italic">No service costs added yet.</td></tr>}
                </tbody>
            </table>
        </div>
    );
};

const MaterialForm = ({ resources, addResource, deleteResource, tasks, milestones, deliverables }: any) => {
    const [state, setState] = useState<{ vendor: string, materialName: string, cost: number, linkedIds: string[] }>({ 
        vendor: '', materialName: '', cost: 0, linkedIds: [] 
    });

    const allItems = [
        ...tasks.map((t: any) => ({...t, type: 'Task'})),
        ...milestones.map((m: any) => ({...m, type: 'Milestone'})),
        ...deliverables.map((d: any) => ({...d, type: 'Deliverable'}))
    ];

    const handleAdd = () => {
        if (!state.vendor || !state.materialName || state.linkedIds.length === 0) return;
        addResource({ id: `res-mat-${Date.now()}`, type: 'Material', ...state });
        setState({ vendor: '', materialName: '', cost: 0, linkedIds: [] });
    };

    const toggleLink = (id: string) => {
        if (state.linkedIds.includes(id)) {
            setState({...state, linkedIds: state.linkedIds.filter(i => i !== id)});
        } else {
            setState({...state, linkedIds: [...state.linkedIds, id]});
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-6 rounded-xl border border-slate-200">
                <div className="md:col-span-1">
                     <label className={labelClass}>Vendor</label>
                     <input type="text" className={inputClass} value={state.vendor} onChange={e => setState({...state, vendor: e.target.value})} placeholder="Supplier Inc" />
                </div>
                <div className="md:col-span-1">
                     <label className={labelClass}>Material</label>
                     <input type="text" className={inputClass} value={state.materialName} onChange={e => setState({...state, materialName: e.target.value})} placeholder="Steel Beams" />
                </div>
                <div className="md:col-span-1">
                     <label className={labelClass}>Cost ($)</label>
                     <input type="number" className={inputClass} value={state.cost} onChange={e => setState({...state, cost: Number(e.target.value)})} />
                </div>
                <div className="md:col-span-1 flex items-end">
                    <button onClick={handleAdd} className="w-full px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition text-sm shadow-sm h-[38px] flex items-center justify-center">Add Material</button>
                </div>
                
                <div className="md:col-span-4">
                    <label className={labelClass}>Link to (Select one or more)</label>
                    <div className="max-h-32 overflow-y-auto border border-slate-300 rounded-lg bg-white p-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {allItems.map((item: any) => (
                            <label key={item.id} className="flex items-center gap-2 text-xs p-1.5 hover:bg-slate-50 rounded cursor-pointer transition">
                                <input 
                                    type="checkbox" 
                                    checked={state.linkedIds.includes(item.id)}
                                    onChange={() => toggleLink(item.id)}
                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="font-bold text-slate-400 text-[10px] w-4">{item.type.charAt(0)}</span>
                                <span className="truncate text-slate-700">{item.name}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>

            <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                    <tr>
                        <th className="px-4 py-3">Vendor</th>
                        <th className="px-4 py-3">Material</th>
                        <th className="px-4 py-3">Linked Items</th>
                        <th className="px-4 py-3 text-right">Cost</th>
                        <th className="px-4 py-3 w-10"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {resources.map((r: MaterialCost) => (
                        <tr key={r.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3 font-medium text-slate-800">{r.vendor}</td>
                            <td className="px-4 py-3 text-slate-600">{r.materialName}</td>
                            <td className="px-4 py-3 text-slate-500">
                                <div className="flex flex-wrap gap-1">
                                    {r.linkedIds.map(id => {
                                        const item = allItems.find((i: any) => i.id === id);
                                        return item ? (
                                            <span key={id} className="text-[10px] bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5 text-slate-600" title={item.name}>
                                                {item.type.charAt(0)}: {item.name.substring(0, 15)}...
                                            </span>
                                        ) : null;
                                    })}
                                </div>
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-slate-700">${r.cost.toLocaleString()}</td>
                            <td className="px-4 py-3 text-right">
                                <button onClick={() => deleteResource(r.id)} className="text-slate-400 hover:text-red-600 transition">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                                </button>
                            </td>
                        </tr>
                    ))}
                    {resources.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400 italic">No material costs added yet.</td></tr>}
                </tbody>
            </table>
        </div>
    );
};

const OtherForm = ({ resources, addResource, deleteResource }: any) => {
    const [state, setState] = useState({ category: 'Consultant Fees', description: '', cost: 0 });
    const categories = ['Consultant Fees', 'Software Licenses', 'Travel', 'Telephone', 'Rental Space', 'Office Equipment', 'Insurance', 'Other'];

    const handleAdd = () => {
        if (!state.description) return;
        addResource({ id: `res-other-${Date.now()}`, type: 'Other', ...state });
        setState({ ...state, description: '', cost: 0 });
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-slate-50 p-6 rounded-xl border border-slate-200">
                <div className="md:col-span-1">
                     <label className={labelClass}>Category</label>
                     <select className={inputClass} value={state.category} onChange={e => setState({...state, category: e.target.value})}>
                         {categories.map(c => <option key={c} value={c}>{c}</option>)}
                     </select>
                </div>
                <div className="md:col-span-1">
                     <label className={labelClass}>Description</label>
                     <input type="text" className={inputClass} value={state.description} onChange={e => setState({...state, description: e.target.value})} placeholder="Item description" />
                </div>
                <div className="md:col-span-1">
                     <label className={labelClass}>Cost ($)</label>
                     <input type="number" className={inputClass} value={state.cost} onChange={e => setState({...state, cost: Number(e.target.value)})} />
                </div>
                <button onClick={handleAdd} className="md:col-span-1 w-full px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition text-sm shadow-sm h-[38px] flex items-center justify-center">Add Expense</button>
            </div>

            <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                    <tr>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3">Description</th>
                        <th className="px-4 py-3 text-right">Cost</th>
                        <th className="px-4 py-3 w-10"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {resources.map((r: OtherCost) => (
                        <tr key={r.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3 font-medium text-slate-700">{r.category}</td>
                            <td className="px-4 py-3 text-slate-600">{r.description}</td>
                            <td className="px-4 py-3 text-right font-bold text-slate-700">${r.cost.toLocaleString()}</td>
                            <td className="px-4 py-3 text-right">
                                <button onClick={() => deleteResource(r.id)} className="text-slate-400 hover:text-red-600 transition">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                                </button>
                            </td>
                        </tr>
                    ))}
                    {resources.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400 italic">No other expenses added yet.</td></tr>}
                </tbody>
            </table>
        </div>
    );
};