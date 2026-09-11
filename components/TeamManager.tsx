import React, { useState } from 'react';
import { TeamMember } from '../types';

interface TeamManagerProps {
  team: TeamMember[];
  setTeam: React.Dispatch<React.SetStateAction<TeamMember[]>>;
}

export const TeamManager: React.FC<TeamManagerProps> = ({ team, setTeam }) => {
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newSkills, setNewSkills] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newType, setNewType] = useState<'Internal' | 'External'>('Internal');

  const handleAdd = () => {
    if (!newName.trim() || !newRole.trim()) return;
    const member: TeamMember = {
      id: `member-${Date.now()}`,
      name: newName,
      role: newRole,
      skills: newSkills,
      email: newEmail,
      phone: newPhone,
      type: newType
    };
    setTeam([...team, member]);
    setNewName('');
    setNewRole('');
    setNewSkills('');
    setNewEmail('');
    setNewPhone('');
    setNewType('Internal');
  };

  const handleDelete = (id: string) => {
    setTeam(team.filter(m => m.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-medium text-slate-900 mb-4">Add Stakeholder / Team Member</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4 items-end">
          <div className="lg:col-span-1">
            <label className="block text-sm font-medium text-slate-600 mb-1">Name</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition text-sm bg-white text-slate-600 placeholder:text-slate-400"
              placeholder="e.g. Jane Doe"
            />
          </div>
          <div className="lg:col-span-1">
            <label className="block text-sm font-medium text-slate-600 mb-1">Role / Title</label>
            <input
              type="text"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition text-sm bg-white text-slate-600 placeholder:text-slate-400"
              placeholder="e.g. Product Owner"
            />
          </div>
          <div className="lg:col-span-1">
            <label className="block text-sm font-medium text-slate-600 mb-1">Email</label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition text-sm bg-white text-slate-600 placeholder:text-slate-400"
              placeholder="jane@example.com"
            />
          </div>
          <div className="lg:col-span-1">
            <label className="block text-sm font-medium text-slate-600 mb-1">Phone</label>
            <input
              type="text"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition text-sm bg-white text-slate-600 placeholder:text-slate-400"
              placeholder="555-0100"
            />
          </div>
          <div className="lg:col-span-1">
            <label className="block text-sm font-medium text-slate-600 mb-1">Skills</label>
            <input
              type="text"
              value={newSkills}
              onChange={(e) => setNewSkills(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition text-sm bg-white text-slate-600 placeholder:text-slate-400"
              placeholder="React, Marketing"
            />
          </div>
          <div className="lg:col-span-1">
            <label className="block text-sm font-medium text-slate-600 mb-1">Type</label>
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as 'Internal' | 'External')}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition text-sm bg-white text-slate-600"
            >
              <option value="Internal">Internal</option>
              <option value="External">External</option>
            </select>
          </div>
          <div className="lg:col-span-1">
            <button
              onClick={handleAdd}
              disabled={!newName || !newRole}
              className="w-full px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Add Member
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {team.map((member) => (
          <div key={member.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex justify-between items-start group relative">
            <div className="flex gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shrink-0 ${member.type === 'External' ? 'bg-orange-100 text-orange-600' : 'bg-indigo-100 text-indigo-600'}`}>
                {member.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                   <p className="font-semibold text-slate-800">{member.name}</p>
                   {member.type === 'External' && (
                       <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 uppercase tracking-wider">Ext</span>
                   )}
                </div>
                <p className="text-sm text-slate-500 font-medium">{member.role}</p>
                {(member.email || member.phone) && (
                    <div className="mt-1 text-xs text-slate-400 space-y-0.5">
                        {member.email && <p>📧 {member.email}</p>}
                        {member.phone && <p>📞 {member.phone}</p>}
                    </div>
                )}
                {member.skills && (
                    <div className="mt-2 flex flex-wrap gap-1">
                        {member.skills.split(',').map((skill, i) => (
                            <span key={i} className="text-[10px] bg-slate-50 text-slate-600 px-1.5 py-0.5 rounded border border-slate-100">
                                {skill.trim()}
                            </span>
                        ))}
                    </div>
                )}
              </div>
            </div>
            <button
              onClick={() => handleDelete(member.id)}
              className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity absolute top-4 right-4"
              title="Remove"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
            </button>
          </div>
        ))}
        
        {team.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
            No team members added yet. Add stakeholders to assign roles in RACI.
          </div>
        )}
      </div>
    </div>
  );
};