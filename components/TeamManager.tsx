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

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editSkills, setEditSkills] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editType, setEditType] = useState<'Internal' | 'External'>('Internal');

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

  const startEditing = (member: TeamMember) => {
    setEditingId(member.id);
    setEditName(member.name);
    setEditRole(member.role);
    setEditSkills(member.skills || '');
    setEditEmail(member.email || '');
    setEditPhone(member.phone || '');
    setEditType(member.type || 'Internal');
  };

  const cancelEditing = () => {
    setEditingId(null);
  };

  const saveEditing = () => {
    if (!editName.trim() || !editRole.trim()) return;
    setTeam(team.map(m => m.id === editingId ? {
      ...m,
      name: editName,
      role: editRole,
      skills: editSkills,
      email: editEmail,
      phone: editPhone,
      type: editType
    } : m));
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6  shadow-sm border border-slate-200">
        <h3 className="text-lg font-medium text-slate-900 mb-4">Add Stakeholder / Team Member</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4 items-end">
          <div className="lg:col-span-1">
            <label className="block text-sm font-medium text-slate-600 mb-1">Name</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3 py-2  border border-slate-300 focus:ring-2 focus:ring-blue-700 focus:border-blue-700 outline-none transition text-sm bg-white text-slate-600 placeholder:text-slate-400"
              placeholder="e.g. Jane Doe"
            />
          </div>
          <div className="lg:col-span-1">
            <label className="block text-sm font-medium text-slate-600 mb-1">Role / Title</label>
            <input
              type="text"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="w-full px-3 py-2  border border-slate-300 focus:ring-2 focus:ring-blue-700 focus:border-blue-700 outline-none transition text-sm bg-white text-slate-600 placeholder:text-slate-400"
              placeholder="e.g. Product Owner"
            />
          </div>
          <div className="lg:col-span-1">
            <label className="block text-sm font-medium text-slate-600 mb-1">Email</label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full px-3 py-2  border border-slate-300 focus:ring-2 focus:ring-blue-700 focus:border-blue-700 outline-none transition text-sm bg-white text-slate-600 placeholder:text-slate-400"
              placeholder="jane@example.com"
            />
          </div>
          <div className="lg:col-span-1">
            <label className="block text-sm font-medium text-slate-600 mb-1">Phone</label>
            <input
              type="text"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              className="w-full px-3 py-2  border border-slate-300 focus:ring-2 focus:ring-blue-700 focus:border-blue-700 outline-none transition text-sm bg-white text-slate-600 placeholder:text-slate-400"
              placeholder="555-0100"
            />
          </div>
          <div className="lg:col-span-1">
            <label className="block text-sm font-medium text-slate-600 mb-1">Skills</label>
            <input
              type="text"
              value={newSkills}
              onChange={(e) => setNewSkills(e.target.value)}
              className="w-full px-3 py-2  border border-slate-300 focus:ring-2 focus:ring-blue-700 focus:border-blue-700 outline-none transition text-sm bg-white text-slate-600 placeholder:text-slate-400"
              placeholder="React, Marketing"
            />
          </div>
          <div className="lg:col-span-1">
            <label className="block text-sm font-medium text-slate-600 mb-1">Type</label>
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as 'Internal' | 'External')}
              className="w-full px-3 py-2  border border-slate-300 focus:ring-2 focus:ring-blue-700 focus:border-blue-700 outline-none transition text-sm bg-white text-slate-600"
            >
              <option value="Internal">Internal</option>
              <option value="External">External</option>
            </select>
          </div>
          <div className="lg:col-span-1">
            <button
              onClick={handleAdd}
              disabled={!newName || !newRole}
              className="w-full px-4 py-2 bg-blue-800 text-white font-medium  hover:bg-blue-900 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Add Member
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {team.map((member) => (
          <div key={member.id} className="bg-white p-5  shadow-sm border border-slate-200 flex flex-col justify-between items-start group relative transition-all">
            {editingId === member.id ? (
              <div className="w-full space-y-3">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Name"
                  className="w-full px-2 py-1.5  border border-slate-300 focus:border-blue-700 outline-none text-sm"
                />
                <input
                  type="text"
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  placeholder="Role / Title"
                  className="w-full px-2 py-1.5  border border-slate-300 focus:border-blue-700 outline-none text-sm"
                />
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="Email"
                  className="w-full px-2 py-1.5  border border-slate-300 focus:border-blue-700 outline-none text-sm"
                />
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="Phone"
                  className="w-full px-2 py-1.5  border border-slate-300 focus:border-blue-700 outline-none text-sm"
                />
                <input
                  type="text"
                  value={editSkills}
                  onChange={(e) => setEditSkills(e.target.value)}
                  placeholder="Skills"
                  className="w-full px-2 py-1.5  border border-slate-300 focus:border-blue-700 outline-none text-sm"
                />
                <select
                  value={editType}
                  onChange={(e) => setEditType(e.target.value as 'Internal' | 'External')}
                  className="w-full px-2 py-1.5  border border-slate-300 focus:border-blue-700 outline-none text-sm"
                >
                  <option value="Internal">Internal</option>
                  <option value="External">External</option>
                </select>
                <div className="flex gap-2 justify-end pt-2">
                  <button onClick={cancelEditing} className="px-3 py-1 text-sm text-slate-500 hover:text-slate-700 font-medium">Cancel</button>
                  <button onClick={saveEditing} className="px-3 py-1 text-sm bg-blue-800 text-white  hover:bg-blue-900 font-medium">Save</button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex gap-3 w-full">
                  <div className={`w-10 h-10  flex items-center justify-center font-bold text-lg shrink-0 ${member.type === 'External' ? 'bg-orange-100 text-orange-600' : 'bg-slate-200 text-blue-800'}`}>
                    {member.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                       <p className="font-semibold text-slate-800">{member.name}</p>
                       {member.type === 'External' && (
                           <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5  border border-slate-200 uppercase tracking-wider">Ext</span>
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
                                <span key={i} className="text-[10px] bg-slate-50 text-slate-600 px-1.5 py-0.5  border border-slate-100">
                                    {skill.trim()}
                                </span>
                            ))}
                        </div>
                    )}
                  </div>
                </div>
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => startEditing(member)}
                    className="text-slate-400 hover:text-blue-700 transition-colors"
                    title="Edit"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                  </button>
                  <button
                    onClick={() => handleDelete(member.id)}
                    className="text-slate-400 hover:text-red-500 transition-colors"
                    title="Remove"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
        
        {team.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-400 border-2 border-dashed border-slate-200 ">
            No team members added yet. Add stakeholders to assign roles in RACI.
          </div>
        )}
      </div>
    </div>
  );
};