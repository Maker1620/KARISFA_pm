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