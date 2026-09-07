export interface TeamMember {
  id: string;
  name: string;
  role: string;
  email?: string;
  skills?: string;
  type?: 'Internal' | 'External';
}

export interface ProjectData {
  name: string;
  description: string;
  objectives: string;
  scope: string;
  timeline: string;
  googleDriveFolderId?: string;
  googleDriveFolderName?: string;
  googleDriveSpreadsheetId?: string;
}

export enum RaciRole {
  R = 'R',
  A = 'A',
  C = 'C',
  I = 'I',
  None = '-'
}

export interface RaciAssignment {
  personId: string; // Maps to TeamMember.id
  role: RaciRole;
}

export interface RaciRow {
  id: string;
  task: string;
  assignments: Record<string, RaciRole>; // Key is TeamMember.id
}

export interface RiskItem {
  id: string;
  name: string;
  probability: number; // 0-100
  impact: number; // 0-100
  mitigation: string;
  ownerId?: string; // Maps to TeamMember.id
  status: 'Open' | 'In Progress' | 'Mitigated' | 'Closed';
}

export interface GeneratedPlan {
  phases: {
    name: string;
    tasks: string[];
    duration: string;
  }[];
}

export interface GeneratedCharter {
  executiveSummary: string;
  businessCase: string;
  deliverables: string[];
}

// Work Breakdown Structure - Flat Architecture with Foreign Keys
export interface Task {
  id: string;
  name: string;
  status: 'Todo' | 'In Progress' | 'Done';
  priority: 'High' | 'Medium' | 'Low';
  assigneeId?: string; // FK to TeamMember
  milestoneId?: string; // FK to Milestone
  startDate?: string;
  dueDate?: string;
  dependencies?: string[]; // IDs of predecessor tasks
}

export interface Milestone {
  id: string;
  name: string;
  dueDate?: string;
  deliverableId?: string; // FK to Deliverable
}

export interface Deliverable {
  id: string;
  name: string;
  description?: string;
  dueDate?: string;
}

// --- Resource & Costing Types ---

export interface PeopleCost {
  id: string;
  type: 'People';
  personId: string;
  taskId: string;
  unitType: string; // e.g., 'Hours', 'Days'
  units: number;
  rate: number;
  totalCost: number;
}

export interface ServiceCost {
  id: string;
  type: 'Service';
  provider: string;
  serviceName: string;
  linkedId: string; // Task, Milestone, or Deliverable ID
  linkedType: 'Task' | 'Milestone' | 'Deliverable';
  cost: number;
}

export interface MaterialCost {
  id: string;
  type: 'Material';
  vendor: string;
  materialName: string;
  linkedIds: string[]; // Can normally link to multiple
  cost: number;
}

export interface OtherCost {
  id: string;
  type: 'Other';
  category: string; // Travel, Software, etc.
  description: string;
  cost: number;
}

export type ProjectResource = PeopleCost | ServiceCost | MaterialCost | OtherCost;

// Complete save state structure
export interface NexusProjectState {
  projectData: ProjectData;
  team: TeamMember[];
  raciData: RaciRow[];
  risks: RiskItem[];
  tasks: Task[];
  milestones: Milestone[];
  deliverables: Deliverable[];
  resources: ProjectResource[];
  lastSaved?: string;
}