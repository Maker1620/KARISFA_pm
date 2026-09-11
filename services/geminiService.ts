import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ProjectData, TeamMember, RaciRow, RaciRole, RiskItem } from "../types";

const getAiClient = () => {
  const apiKey = localStorage.getItem('gemini_user_api_key') || '';
  if (!apiKey) {
    window.dispatchEvent(new CustomEvent('require-ai-key'));
    throw new Error("API_KEY_MISSING");
  }
  return new GoogleGenAI({ apiKey });
};

const modelName = 'gemini-3-flash-preview';

export const generateRaciMatrix = async (
  project: ProjectData,
  team: TeamMember[]
): Promise<RaciRow[]> => {
  if (!project.description || team.length === 0) {
    throw new Error("Project description and team members are required.");
  }

  const ai = getAiClient();
  const teamContext = team.map(t => `${t.name} (Role: ${t.role}, ID: ${t.id})`).join(', ');

  const prompt = `
    Generate a RACI matrix for the following project:
    Project Name: ${project.name}
    Description: ${project.description}
    Objectives: ${project.objectives}
    
    Available Team Members: ${teamContext}

    For each major task required for this project, assign R, A, C, or I roles to the team members.
    Ensure every task has at least one Responsible (R) and exactly one Accountable (A).
    Return a list of tasks with assignments.
  `;

  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          tasks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                taskName: { type: Type.STRING },
                assignments: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      personId: { type: Type.STRING, description: "The exact ID of the team member provided in context" },
                      role: { type: Type.STRING, enum: ["R", "A", "C", "I"] }
                    },
                    required: ["personId", "role"]
                  }
                }
              },
              required: ["taskName", "assignments"]
            }
          }
        }
      }
    }
  });

  const jsonText = response.text || "{}";
  const data = JSON.parse(jsonText);

  // Transform to internal RaciRow format
  const rows: RaciRow[] = (data.tasks || []).map((t: any, index: number) => {
    const assignmentsMap: Record<string, RaciRole> = {};
    // Default all to None
    team.forEach(m => assignmentsMap[m.id] = RaciRole.None);
    
    // Fill from AI
    if (t.assignments && Array.isArray(t.assignments)) {
        t.assignments.forEach((a: any) => {
            // Validate ID exists in team to avoid AI hallucinations
            if (team.some(m => m.id === a.personId)) {
                 assignmentsMap[a.personId] = a.role as RaciRole;
            }
        });
    }

    return {
      id: `task-${Date.now()}-${index}`,
      task: t.taskName,
      assignments: assignmentsMap
    };
  });

  return rows;
};

export const generateRiskAnalysis = async (project: ProjectData): Promise<RiskItem[]> => {
    const ai = getAiClient();
    const prompt = `
      Identify potential risks for this project:
      Name: ${project.name}
      Description: ${project.description}
      Scope: ${project.scope}

      Return a list of 5-8 key risks. For each, estimate probability (0-100) and impact (0-100), and a brief mitigation strategy.
    `;
  
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            risks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  probability: { type: Type.INTEGER },
                  impact: { type: Type.INTEGER },
                  mitigation: { type: Type.STRING }
                },
                required: ["name", "probability", "impact", "mitigation"]
              }
            }
          }
        }
      }
    });
  
    const data = JSON.parse(response.text || "{}");
    // Map to RiskItem with IDs
    return (data.risks || []).map((risk: any, index: number) => ({
        id: `risk-ai-${Date.now()}-${index}`,
        name: risk.name,
        probability: risk.probability,
        impact: risk.impact,
        mitigation: risk.mitigation,
        status: 'Open',
        ownerId: undefined
    }));
};

export const generateCharterContent = async (project: ProjectData, team: TeamMember[]): Promise<string> => {
    const ai = getAiClient();
    const prompt = `
      Write a professional Project Charter for:
      Name: ${project.name}
      Description: ${project.description}
      Objectives: ${project.objectives}
      Scope: ${project.scope}
      Key Stakeholders: ${team.map(t => `${t.name} (${t.role})`).join(', ')}

      Format the output as clean Markdown with the following headers:
      # Executive Summary
      # Business Case
      # Project Objectives
      # Scope Statement
      # Key Stakeholders & Roles
      # Constraints & Assumptions
      
      Keep it concise but professional.
    `;

    const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt
    });

    return response.text || "";
};

export const extractProjectDataFromDocs = async (docsText: string): Promise<any> => {
    const ai = getAiClient();
    const prompt = `Analyze the following project documentation and extract the project details, team members, tasks, and resources.
If any information is missing, leave the field empty or make a reasonable inference based on the text.

DOCUMENTATION:
${docsText}`;

    const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    description: { type: Type.STRING },
                    objectives: { type: Type.STRING },
                    scope: { type: Type.STRING },
                    timeline: { type: Type.STRING },
                    team: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING },
                                role: { type: Type.STRING },
                                skills: { type: Type.STRING }
                            },
                            required: ["name", "role"]
                        }
                    },
                    tasks: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING }
                            },
                            required: ["name"]
                        }
                    },
                    resources: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                type: { type: Type.STRING, enum: ['People', 'Service', 'Material', 'Other'] },
                                name: { type: Type.STRING },
                                cost: { type: Type.INTEGER }
                            },
                            required: ["type", "name"]
                        }
                    }
                }
            }
        }
    });

    return JSON.parse(response.text || "{}");
};

export const generateMeetingActionItems = async (rawNotes: string, tasks: Task[], team: TeamMember[]): Promise<ActionItem[]> => {
    const ai = getAiClient();
    if (!ai) throw new Error("API_KEY_MISSING");

    const prompt = `You are a project management AI assistant.
Your task is to analyze the following raw meeting notes and extract a structured list of action items.

Context:
Existing Project Tasks: ${JSON.stringify(tasks.map(t => ({ id: t.id, name: t.name })))}
Project Team Members: ${JSON.stringify(team.map(t => ({ id: t.id, name: t.name })))}

Raw Meeting Notes:
${rawNotes}

Instructions:
1. Extract all action items or follow-ups mentioned in the notes.
2. For each action item, create a short, clear description.
3. Determine if the action item should be assigned to a specific team member. If so, provide their 'id'. If unclear, leave null.
4. Determine if the action item relates to an existing project task. If so, provide the task 'id' as 'linkedTaskId'. If no existing task matches, leave null.
5. All items should have a status of "Open".
6. Format your response as a pure JSON array of objects. Do not include markdown formatting or backticks.

Expected JSON array schema:
[
  {
    "id": "generated_id_123",
    "description": "Short description of action item",
    "assigneeId": "team_member_id_or_null",
    "linkedTaskId": "task_id_or_null",
    "status": "Open"
  }
]`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                temperature: 0.2
            }
        });
        const text = response.text();
        const jsonMatch = text?.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]) as ActionItem[];
        }
        return JSON.parse(text || "[]");
    } catch (e) {
        console.error("Error generating meeting action items:", e);
        throw new Error("Failed to generate action items.");
    }
};

export const generateProjectPlan = async (project: ProjectData): Promise<string> => {
    const ai = getAiClient();
    const prompt = `
      Create a high-level Project Plan for:
      Name: ${project.name}
      Description: ${project.description}
      Timeline Info: ${project.timeline}

      Format as Markdown. Break it down into Phases (e.g., Phase 1: Initiation, Phase 2: Planning, etc.).
      For each phase, list key activities and estimated duration.
    `;

    const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt
    });

    return response.text || "";
};

export const generateStatusReport = async (
    project: ProjectData,
    tasks: any[],
    milestones: any[],
    resources: any[]
): Promise<string> => {
    const ai = getAiClient();
    
    const completedTasks = tasks.filter(t => t.status === 'Done').length;
    const totalBudget = resources.reduce((acc, r) => acc + (r.type === 'People' ? (r.totalCost || 0) : (r.cost || 0)), 0);
    const completedMilestones = milestones.filter(m => tasks.some(t => t.milestoneId === m.id && t.status === 'Done')).length;

    const prompt = `
      Write a concise, professional Executive Status Report for the project.
      Project Name: ${project.name}
      Timeline: ${project.timeline}
      Description: ${project.description}

      Please include these exact data points in your summary organically:
      - Task Progress: ${completedTasks} out of ${tasks.length} tasks completed.
      - Financials: Total Budget estimated at $${totalBudget}.
      - Milestones: ${milestones.length} total key milestones tracked.

      Format the output as clean Markdown, suitable for a printable PDF report. Use these headers:
      # Executive Summary
      # Project Status
      # Key Milestones
      # Financials & Resources
      
      Keep it clear, professional, and structured.
    `;

    const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt
    });

    return response.text || "";
};