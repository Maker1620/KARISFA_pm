sed -i '/\/\/ 3. Assignee Workload/i \
    const sprintBurnupData = useMemo(() => {\
        const totalScope = tasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);\
        const sortedSprints = [...sprints]\
            .filter(s => s.status === "Completed" || s.status === "Active")\
            .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());\
        let cumulativeCompleted = 0;\
        const data = sortedSprints.map(sprint => {\
            let sprintCompletedPoints = 0;\
            sprint.taskIds.forEach(tId => {\
                const t = tasks.find(task => task.id === tId);\
                if (t && t.status === "Done") {\
                    sprintCompletedPoints += (t.storyPoints || 0);\
                }\
            });\
            cumulativeCompleted += sprintCompletedPoints;\
            return {\
                sprintName: sprint.name,\
                "Total Scope": totalScope,\
                "Completed Points": cumulativeCompleted\
            };\
        });\
        if (data.length === 0) {\
            return [{ sprintName: "No Sprints", "Total Scope": totalScope, "Completed Points": 0 }];\
        }\
        return data;\
    }, [sprints, tasks]);\
' components/ProgressInsights.tsx
