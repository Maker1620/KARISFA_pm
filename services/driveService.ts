// Add declarations for global variables injected by script tags
declare var gapi: any;
declare var google: any;
import { NexusProjectState, RaciRole, PeopleCost, ServiceCost, MaterialCost, OtherCost } from '../types';

// Helper to get Client ID from Env or LocalStorage
export const getClientId = () => {
    return '217275101727-tpduauhn45mlsm19keb66bk0hpsmc1o6.apps.googleusercontent.com';
};

export const setStoredClientId = (id: string) => {
    localStorage.setItem('GOOGLE_CLIENT_ID', id);
};

// Helper to get App ID (Project Number) for Picker API
export const getAppId = () => {
    return '217275101727';
};

export const setStoredAppId = (id: string) => {
    localStorage.setItem('GOOGLE_APP_ID', id);
};

export const getApiKey = () => {
    return localStorage.getItem('GOOGLE_API_KEY') || '';
};

export const setStoredApiKey = (key: string) => {
    localStorage.setItem('GOOGLE_API_KEY', key);
};

const DISCOVERY_DOCS = [
    'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
    'https://sheets.googleapis.com/$discovery/rest?version=v4'
];
// Include Spreadsheets scope, Drive File scope, and Drive Readonly scope for reading docs
const SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.readonly';

let tokenClient: any;
let gapiInited = false;
let gisInited = false;
let pickerInited = false;

const waitForScripts = (): Promise<void> => {
    return new Promise((resolve) => {
        const interval = setInterval(() => {
            if (typeof gapi !== 'undefined' && typeof google !== 'undefined') {
                clearInterval(interval);
                resolve();
            }
        }, 100);
    });
};

export const initDriveApi = async (): Promise<boolean> => {
    await waitForScripts();

    const clientId = getClientId();
    if (clientId === 'YOUR_CLIENT_ID_HERE') {
        console.warn("Google Drive Client ID not set. Drive features will be simulated.");
        return false;
    }

    return new Promise((resolve) => {
        gapi.load('client:picker', async () => {
            try {
                const initConfig: any = {
                    discoveryDocs: DISCOVERY_DOCS,
                };
                const apiKey = getApiKey();
                if (apiKey) {
                    initConfig.apiKey = apiKey;
                }
                
                await gapi.client.init(initConfig);
                gapiInited = true;
                pickerInited = true;
                if (gisInited) resolve(true);
            } catch (error) {
                console.error("Error initializing gapi client:", error);
                resolve(false);
            }
        });

        tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: SCOPES,
            callback: () => {}, // Initial dummy callback
        });
        gisInited = true;
        if (gapiInited) resolve(true);
    });
};

export const signInToDrive = async (): Promise<string | null> => {
    const clientId = getClientId();
    if (clientId === 'YOUR_CLIENT_ID_HERE') {
        // Simulation mode
        return "simulated-token";
    }

    if (!tokenClient) {
        await initDriveApi();
        if (!tokenClient) {
            console.error("Token client failed to initialize.");
            return null;
        }
    }

    return new Promise((resolve, reject) => {
        tokenClient.callback = async (resp: any) => {
            if (resp.error) {
                console.error("Token client callback error:", resp);
                reject(resp);
                return;
            }
            // IMPORTANT: Set token for gapi.client so subsequent API calls (like creating files) work
            if (resp.access_token) {
                gapi.client.setToken(resp);
            }
            resolve(resp.access_token);
        };

        // If we don't have a token, force consent to ensure we get one reliably.
        // If we do have one, passing {} (empty object) allows the library to decide (usually silent auth).
        // WARNING: Passing { prompt: '' } causes Error 400: invalid_request.
        if (gapi.client.getToken() === null) {
            tokenClient.requestAccessToken({ prompt: 'consent' });
        } else {
            tokenClient.requestAccessToken({});
        }
    });
};

export const openFolderPicker = async (oauthToken: string): Promise<{id: string, name: string} | null> => {
    if (oauthToken === 'simulated-token') {
        // Simulation Mode
        const confirmSim = window.confirm("Simulation Mode: Would you like to select 'Simulated Project Folder'?");
        if (confirmSim) {
            return { id: 'simulated-folder-id', name: 'Simulated Project Folder' };
        }
        return null;
    }

    return new Promise((resolve, reject) => {
        if (!pickerInited) {
            reject("Picker API not loaded");
            return;
        }

        const appId = getAppId(); // Project Number

        const apiKey = getApiKey();

        const view = new google.picker.DocsView(google.picker.ViewId.FOLDERS)
            .setSelectFolderEnabled(true)
            .setMimeTypes('application/vnd.google-apps.folder');

        const builder = new google.picker.PickerBuilder()
            .enableFeature(google.picker.Feature.NAV_HIDDEN)
            .setOAuthToken(oauthToken)
            .addView(view)
            .setCallback((data: any) => {
                if (data.action === google.picker.Action.PICKED) {
                    const doc = data.docs[0];
                    resolve({ id: doc.id, name: doc.name });
                } else if (data.action === google.picker.Action.CANCEL) {
                    resolve(null);
                }
            });
            
        if (apiKey) {
            builder.setDeveloperKey(apiKey);
        }

        if (appId) {
            builder.setAppId(appId);
        } else {
            console.warn("Project Number (App ID) is missing. Picker may fail or show errors.");
        }

        const picker = builder.build();
        picker.setVisible(true);
    });
};

export const getFilesInFolder = async (folderId: string): Promise<any[]> => {
    try {
        const res = await gapi.client.drive.files.list({
            q: `'${folderId}' in parents and trashed = false`,
            fields: 'files(id, name, mimeType)'
        });
        return res.result.files || [];
    } catch (err) {
        console.error("Error listing files", err);
        throw err;
    }
};

export const getFileText = async (fileId: string, mimeType: string, token: string): Promise<string> => {
    try {
        if (mimeType === 'application/vnd.google-apps.document') {
            const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                return await res.text();
            }
        } else if (mimeType.startsWith('text/')) {
            const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                return await res.text();
            }
        }
    } catch (e) {
        console.error(`Error reading file ${fileId}`, e);
    }
    return "";
};

/**
 * Creates a folder if one isn't selected (Legacy fallback)
 */
export const createProjectFolder = async (projectName: string): Promise<string> => {
    const clientId = getClientId();
    if (clientId === 'YOUR_CLIENT_ID_HERE') return "simulated-folder-id";

    try {
        const fileMetadata = {
            'name': `Nexus Project: ${projectName}`,
            'mimeType': 'application/vnd.google-apps.folder'
        };
        const response = await gapi.client.drive.files.create({
            resource: fileMetadata,
            fields: 'id'
        });
        return response.result.id;
    } catch (err) {
        console.error("Error creating folder", err);
        throw err;
    }
};

/**
 * Saves the project state to a multi-tab Google Sheet.
 * Maps entities (Team, Tasks, RACI, etc.) to specific worksheets.
 */
export const saveProjectAsSheet = async (folderId: string, state: NexusProjectState): Promise<string> => {
    const clientId = getClientId();
    if (clientId === 'YOUR_CLIENT_ID_HERE') {
        console.log("Simulating Save to Sheet:", state);
        return "simulated-sheet-id";
    }

    let spreadsheetId = state.projectData.googleDriveSpreadsheetId;
    
    // 1. Create Spreadsheet if it doesn't exist
    if (!spreadsheetId) {
        const resource = {
            properties: { title: `Nexus Project: ${state.projectData.name}` },
            sheets: [
                { properties: { title: 'Project Context', gridProperties: { frozenRowCount: 1 } } },
                { properties: { title: 'Team', gridProperties: { frozenRowCount: 1 } } },
                { properties: { title: 'Tasks', gridProperties: { frozenRowCount: 1 } } },
                { properties: { title: 'Milestones', gridProperties: { frozenRowCount: 1 } } },
                { properties: { title: 'Deliverables', gridProperties: { frozenRowCount: 1 } } },
                { properties: { title: 'Resources', gridProperties: { frozenRowCount: 1 } } },
                { properties: { title: 'RACI', gridProperties: { frozenRowCount: 1 } } },
                { properties: { title: 'Risks', gridProperties: { frozenRowCount: 1 } } }
            ]
        };

        const createRes = await gapi.client.sheets.spreadsheets.create({
            resource,
            fields: 'spreadsheetId'
        });
        spreadsheetId = createRes.result.spreadsheetId;

        // Move the file to the project folder
        if (folderId && spreadsheetId) {
            const file = await gapi.client.drive.files.get({
                fileId: spreadsheetId,
                fields: 'parents'
            });
            const previousParents = file.result.parents.join(',');
            await gapi.client.drive.files.update({
                fileId: spreadsheetId,
                addParents: folderId,
                removeParents: previousParents,
                fields: 'id, parents'
            });
        }
    }

    if (!spreadsheetId) throw new Error("Failed to create spreadsheet");

    // 2. Prepare Data Arrays
    
    // -- Project Context --
    const projectValues = [
        ['Field', 'Value'],
        ['Name', state.projectData.name],
        ['Description', state.projectData.description],
        ['Objectives', state.projectData.objectives],
        ['Scope', state.projectData.scope],
        ['Timeline', state.projectData.timeline],
        ['Last Saved', state.lastSaved || new Date().toISOString()]
    ];

    // -- Team --
    const teamValues = [['ID', 'Name', 'Role', 'Skills', 'Type', 'Email']];
    state.team.forEach(m => {
        teamValues.push([m.id, m.name, m.role, m.skills || '', m.type || '', m.email || '']);
    });

    // -- Tasks --
    const taskValues = [['ID', 'Name', 'Status', 'Priority', 'Start Date', 'Due Date', 'Milestone ID', 'Assignee ID', 'Dependencies']];
    state.tasks.forEach(t => {
        taskValues.push([
            t.id, 
            t.name, 
            t.status,
            t.priority || 'Medium',
            t.startDate || '',
            t.dueDate || '', 
            t.milestoneId || '', 
            t.assigneeId || '',
            t.dependencies ? t.dependencies.join(',') : ''
        ]);
    });

    // -- Milestones --
    const milestoneValues = [['ID', 'Name', 'Due Date', 'Deliverable ID']];
    state.milestones.forEach(m => {
        milestoneValues.push([m.id, m.name, m.dueDate || '', m.deliverableId || '']);
    });

    // -- Deliverables --
    const deliverableValues = [['ID', 'Name', 'Description', 'Due Date']];
    state.deliverables.forEach(d => {
        deliverableValues.push([d.id, d.name, d.description || '', d.dueDate || '']);
    });

    // -- Resources --
    const resourceValues = [['ID', 'Type', 'Name/Description', 'Details', 'Cost', 'Linked IDs']];
    state.resources.forEach(r => {
        let name = '';
        let details = '';
        let linked = '';
        
        if (r.type === 'People') {
            const pc = r as PeopleCost;
            name = state.team.find(t => t.id === pc.personId)?.name || pc.personId;
            details = `${pc.units} ${pc.unitType} @ $${pc.rate}`;
            linked = pc.taskId;
        } else if (r.type === 'Service') {
            const sc = r as ServiceCost;
            name = `${sc.provider} - ${sc.serviceName}`;
            details = sc.linkedType;
            linked = sc.linkedId;
        } else if (r.type === 'Material') {
            const mc = r as MaterialCost;
            name = `${mc.vendor} - ${mc.materialName}`;
            linked = mc.linkedIds.join(',');
        } else if (r.type === 'Other') {
            const oc = r as OtherCost;
            name = `${oc.category} - ${oc.description}`;
        }

        resourceValues.push([
            r.id,
            r.type,
            name,
            details,
            (r.type === 'People' ? (r as PeopleCost).totalCost : r.cost).toString(),
            linked
        ]);
    });

    // -- Risks --
    const riskValues = [['ID', 'Risk Name', 'Probability (%)', 'Impact (%)', 'Mitigation', 'Owner ID', 'Status']];
    state.risks.forEach(r => {
        riskValues.push([r.id, r.name, r.probability.toString(), r.impact.toString(), r.mitigation, r.ownerId || '', r.status]);
    });

    // -- RACI --
    // Header: Task | [Team Member 1] | [Team Member 2] ...
    const raciHeader = ['Task Name', ...state.team.map(m => `${m.name} (${m.role})`)];
    const raciValues = [raciHeader];
    
    state.raciData.forEach(row => {
        const rowData = [row.task];
        state.team.forEach(member => {
            rowData.push(row.assignments[member.id] || RaciRole.None);
        });
        raciValues.push(rowData);
    });

    // 3. Batch Update Values
    const data = [
        { range: 'Project Context!A1', values: projectValues },
        { range: 'Team!A1', values: teamValues },
        { range: 'Tasks!A1', values: taskValues },
        { range: 'Milestones!A1', values: milestoneValues },
        { range: 'Deliverables!A1', values: deliverableValues },
        { range: 'Resources!A1', values: resourceValues },
        { range: 'RACI!A1', values: raciValues },
        { range: 'Risks!A1', values: riskValues }
    ];

    await gapi.client.sheets.spreadsheets.values.batchUpdate({
        spreadsheetId,
        resource: {
            valueInputOption: 'RAW',
            data
        }
    });

    return spreadsheetId;
};
