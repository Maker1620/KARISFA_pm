import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { TeamManager } from './components/TeamManager';
import { ProjectForm } from './components/ProjectForm';
import { RaciMatrix } from './components/RaciMatrix';
import { DocumentView } from './components/DocumentView';
import { ProgressInsights } from './components/ProgressInsights';
import { RiskChart } from './components/RiskChart';
import { WorkBreakdown } from './components/WorkBreakdown';
import { GanttChart } from './components/GanttChart';
import { ResourceCosting } from './components/ResourceCosting';
import { SettingsModal } from './components/SettingsModal';
import { AiSettingsModal } from './components/AiSettingsModal';
import { 
    ProjectData, TeamMember, RaciRow, RiskItem, Deliverable, Milestone, Task, 
    NexusProjectState, ProjectResource, JournalEntry 
} from './types';
import { initDriveApi, signInToDrive, saveProjectAsSheet, openFolderPicker, getFilesInFolder, getFileText } from './services/driveService';
import { extractProjectDataFromDocs } from './services/geminiService';
import { loadLocalProject, saveLocalProject } from './services/storageService';

function App() {
  const [activeTab, setActiveTab] = useState('project');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAiSettingsOpen, setIsAiSettingsOpen] = useState(false);
  const [isAiActive, setIsAiActive] = useState(
    !!localStorage.getItem('gemini_user_api_key') || !!process.env.API_KEY
  );
  
  const [projectData, setProjectData] = useState<ProjectData>({
    name: '',
    description: '',
    objectives: '',
    scope: '',
    timeline: ''
  });

  const [team, setTeam] = useState<TeamMember[]>([]);
  const [raciData, setRaciData] = useState<RaciRow[]>([]);
  const [risks, setRisks] = useState<RiskItem[]>([]);
  
  // WBS State - Flat Structure
  const [tasks, setTasks] = useState<Task[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  
  // Resource State
  const [resources, setResources] = useState<ProjectResource[]>([]);

  // Journal State
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [meetingMinutes, setMeetingMinutes] = useState<MeetingMinute[]>([]);

  const [isSignedIn, setIsSignedIn] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [isImportingDocs, setIsImportingDocs] = useState(false);

  // Load from Local Storage on Mount
  useEffect(() => {
      const localState = loadLocalProject();
      if (localState && localState.projectData) {
          setProjectData(localState.projectData);
          setTeam(localState.team || []);
          setRaciData(localState.raciData || []);
          setRisks(localState.risks || []);
          setTasks(localState.tasks || []);
          setMilestones(localState.milestones || []);
          setDeliverables(localState.deliverables || []);
          setResources(localState.resources || []);
          setJournalEntries(localState.journalEntries || []);
          setMeetingMinutes(localState.meetingMinutes || []);
      }
      // Attempt to init Drive API silently
      initDriveApi().catch(console.error);
  }, []);

  // Listen for AI Key events
  useEffect(() => {
      const handleRequireKey = () => setIsAiSettingsOpen(true);
      const handleKeyUpdated = () => setIsAiActive(!!localStorage.getItem('gemini_user_api_key') || !!process.env.API_KEY);
      
      window.addEventListener('require-ai-key', handleRequireKey);
      window.addEventListener('ai-key-updated', handleKeyUpdated);
      
      return () => {
          window.removeEventListener('require-ai-key', handleRequireKey);
          window.removeEventListener('ai-key-updated', handleKeyUpdated);
      };
  }, []);

  // Auto-save to Local Storage on change
  useEffect(() => {
      const timer = setTimeout(() => {
          const state: NexusProjectState = {
              projectData, team, raciData, risks, tasks, milestones, deliverables, resources, journalEntries, meetingMinutes,
              lastSaved: new Date().toISOString()
          };
          saveLocalProject(state);
      }, 2000); // Debounce save
  }, [projectData, team, raciData, risks, tasks, milestones, deliverables, resources, journalEntries, meetingMinutes]);

  const handleSignIn = async () => {
      try {
          await initDriveApi();
          const token = await signInToDrive();
          if (token) {
              setAccessToken(token);
              setIsSignedIn(true);
              if (token === 'simulated-token') {
                alert("Signed In (Demo Mode). Next, please pick a folder to store your project.");
              }
              // Automatically prompt for folder picker after sign-in if none selected
              if (!projectData.googleDriveFolderId) {
                  setTimeout(() => handlePickFolder(token), 500);
              }
          }
      } catch (err) {
          console.error(err);
          alert("Failed to sign in. Check console for details.");
      }
  };

  const handlePickFolder = async (tokenOverride?: string) => {
      const token = tokenOverride || accessToken;
      if (!token) {
          alert("Please sign in first.");
          return;
      }
      try {
          const folder = await openFolderPicker(token);
          if (folder) {
              setProjectData(prev => ({
                  ...prev,
                  googleDriveFolderId: folder.id,
                  googleDriveFolderName: folder.name
              }));
          }
      } catch (e) {
          console.error(e);
          alert("Failed to pick folder.");
      }
  };

  const handleSave = async () => {
      if (!projectData.name) {
          alert("Please provide a Project Name before saving.");
          return;
      }

      // If NOT signed in, simple local save confirmation
      if (!isSignedIn) {
          const state: NexusProjectState = {
              projectData, team, raciData, risks, tasks, milestones, deliverables, resources, journalEntries, meetingMinutes,
              lastSaved: new Date().toISOString()
          };
          saveLocalProject(state);
          alert("Project saved to Local Browser Storage.");
          return;
      }

      // If Signed In, require folder
      if (!projectData.googleDriveFolderId) {
          alert("Please select a Google Drive folder first.");
          return;
      }

      setSaving(true);
      try {
          // Prepare payload
          const state: NexusProjectState = {
              projectData,
              team,
              raciData,
              risks,
              tasks,
              milestones,
              deliverables,
              resources,
              journalEntries,
              meetingMinutes,
              lastSaved: new Date().toISOString()
          };

          // Save to Google Sheet
          const spreadsheetId = await saveProjectAsSheet(projectData.googleDriveFolderId, state);
          
          if (spreadsheetId === 'simulated-sheet-id') {
              alert("Save Complete (Simulation Mode).\n\nBecause no Google Cloud Client ID is configured, this was a simulation.");
          } else {
              // Update local state with the sheet ID so future saves update the same sheet
              setProjectData(prev => ({ ...prev, googleDriveSpreadsheetId: spreadsheetId }));
              alert(`Project synced to Google Sheet in folder "${projectData.googleDriveFolderName}":\n\n"${projectData.name}"`);
          }
      } catch (e) {
          console.error(e);
          alert("Error saving to Drive/Sheets.");
      } finally {
          setSaving(false);
      }
  };

  const handleExport = () => {
      if (!projectData.name) {
          if(!confirm("Project has no name. Export anyway?")) return;
      }
      const state: NexusProjectState = {
          projectData, team, raciData, risks, tasks, milestones, deliverables, resources, journalEntries, meetingMinutes,
          lastSaved: new Date().toISOString()
      };
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `${(projectData.name || "project").replace(/\s+/g, '_')}_backup.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              const importedState = JSON.parse(event.target?.result as string) as NexusProjectState;
              
              // Validate minimal structure
              if (!importedState.projectData) throw new Error("Invalid project file");

              setProjectData(importedState.projectData);
              setTeam(importedState.team || []);
              setRaciData(importedState.raciData || []);
              setRisks(importedState.risks || []);
              setTasks(importedState.tasks || []);
              setMilestones(importedState.milestones || []);
              setDeliverables(importedState.deliverables || []);
              setResources(importedState.resources || []);
              setJournalEntries(importedState.journalEntries || []);
              setMeetingMinutes(importedState.meetingMinutes || []);
              
              saveLocalProject(importedState); // Also save to local storage immediately
              alert("Project loaded successfully!");
          } catch (err) {
              console.error(err);
              alert("Failed to load project file. It may be corrupted or invalid.");
          }
      };
      reader.readAsText(file);
      // Reset input value to allow re-importing same file if needed
      e.target.value = '';
  };

  const handleImportDocsFolder = async () => {
      let token = accessToken;
      if (!token) {
          try {
              await initDriveApi();
              token = await signInToDrive();
              if (token) {
                  setAccessToken(token);
                  setIsSignedIn(true);
              } else {
                  return;
              }
          } catch (e) {
              alert("Sign in failed");
              return;
          }
      }

      try {
          const folder = await openFolderPicker(token);
          if (!folder) return;
          if (folder.id === 'simulated-folder-id') {
              alert("Simulation Mode: Cannot read actual files.");
              return;
          }

          setIsImportingDocs(true);
          const files = await getFilesInFolder(folder.id);
          let combinedText = '';
          for (const file of files.slice(0, 5)) {
              const text = await getFileText(file.id, file.mimeType, token);
              if (text) combinedText += `\n--- File: ${file.name} ---\n${text}\n`;
          }

          if (!combinedText) {
              alert("No readable text documents found in the selected folder.");
              return;
          }

          const extracted = await extractProjectDataFromDocs(combinedText);
          
          setProjectData(prev => ({
              ...prev,
              name: extracted.name || prev.name,
              description: extracted.description || prev.description,
              objectives: extracted.objectives || prev.objectives,
              scope: extracted.scope || prev.scope,
              timeline: extracted.timeline || prev.timeline,
          }));

          if (extracted.team && Array.isArray(extracted.team)) {
              const newTeam = extracted.team.map((t: any, i: number) => ({
                  id: `team-${Date.now()}-${i}`,
                  name: t.name || 'Unknown',
                  role: t.role || 'Member',
                  skills: t.skills || '',
                  type: 'Internal',
                  email: ''
              }));
              setTeam(prev => [...prev, ...newTeam]);
          }

          if (extracted.tasks && Array.isArray(extracted.tasks)) {
              const newTasks = extracted.tasks.map((t: any, i: number) => ({
                  id: `task-${Date.now()}-${i}`,
                  name: t.name || 'Untitled Task',
                  status: 'Todo',
                  priority: 'Medium',
                  startDate: new Date().toISOString().split('T')[0],
                  dueDate: '',
                  milestoneId: '',
                  assigneeId: '',
                  dependencies: []
              }));
              setTasks(prev => [...prev, ...newTasks]);
          }
          
          if (extracted.resources && Array.isArray(extracted.resources)) {
              const newResources = extracted.resources.map((r: any, i: number) => {
                  if (r.type === 'People') {
                      return {
                          id: `res-${Date.now()}-${i}`,
                          type: 'People',
                          personId: r.name || 'Unknown', 
                          units: 1,
                          unitType: 'hours',
                          rate: r.cost || 0,
                          totalCost: r.cost || 0,
                          taskId: ''
                      };
                  } else {
                      return {
                          id: `res-${Date.now()}-${i}`,
                          type: 'Other',
                          category: 'AI Extracted',
                          description: r.name || 'Unknown Resource',
                          cost: r.cost || 0
                      };
                  }
              });
              setResources(prev => [...prev, ...newResources] as any);
          }

          alert("Project details successfully extracted from documentation!");

      } catch (e: any) {
          if (e.message !== "API_KEY_MISSING") {
              console.error(e);
              alert("Failed to extract details from docs.");
          }
      } finally {
          setIsImportingDocs(false);
      }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'project':
        return <ProjectForm data={projectData} onChange={setProjectData} onImportDocs={handleImportDocsFolder} isImportingDocs={isImportingDocs} />;
      case 'team':
        return <TeamManager team={team} setTeam={setTeam} />;
      case 'wbs':
        return (
          <WorkBreakdown 
            tasks={tasks} setTasks={setTasks}
            milestones={milestones} setMilestones={setMilestones}
            deliverables={deliverables} setDeliverables={setDeliverables}
            team={team} 
          />
        );
      case 'resources':
        return (
          <ResourceCosting 
            resources={resources} setResources={setResources}
            team={team} tasks={tasks} milestones={milestones} deliverables={deliverables}
          />
        );
      case 'raci':
        return <RaciMatrix data={raciData} setData={setRaciData} team={team} project={projectData} />;
      case 'risks':
        return <RiskChart project={projectData} risks={risks} setRisks={setRisks} team={team} />;
      case 'docs':
        return <DocumentView project={projectData} team={team} journal={journalEntries} setJournal={setJournalEntries} meetingMinutes={meetingMinutes} setMeetingMinutes={setMeetingMinutes} tasks={tasks} />;
      case 'insights':
        return <ProgressInsights tasks={tasks} milestones={milestones} team={team} deliverables={deliverables} resources={resources} />;
      case 'gantt':
        return <GanttChart tasks={tasks} milestones={milestones} team={team} />;
      default:
        return <ProjectForm data={projectData} onChange={setProjectData} />;
    }
  };

  return (
    <>
      <Layout 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
          onSignIn={handleSignIn}
          isSignedIn={isSignedIn}
          selectedFolderName={projectData.googleDriveFolderName}
          onPickFolder={() => handlePickFolder()}
          onSave={handleSave}
          onExport={handleExport}
          onImport={handleImport}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenAiSettings={() => setIsAiSettingsOpen(true)}
          isAiActive={isAiActive}
      >
        {renderContent()}
      </Layout>
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <AiSettingsModal isOpen={isAiSettingsOpen} onClose={() => setIsAiSettingsOpen(false)} />
    </>
  );
}

export default App;