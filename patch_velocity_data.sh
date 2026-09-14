sed -i '/const sprintBurnupData = useMemo/i \
    const velocityChartData = useMemo(() => {\
        const sortedSprints = [...sprints]\
            .filter(s => s.status === "Completed" || s.status === "Active")\
            .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());\
        const lastFive = sortedSprints.slice(-5);\
        const data = lastFive.map(sprint => {\
            let completedPoints = 0;\
            sprint.taskIds.forEach(tId => {\
                const t = tasks.find(task => task.id === tId);\
                if (t && t.status === "Done") {\
                    completedPoints += (t.storyPoints || 0);\
                }\
            });\
            return {\
                sprintName: sprint.name,\
                "Story Points": completedPoints\
            };\
        });\
        if (data.length === 0) {\
            return [{ sprintName: "No Sprints", "Story Points": 0 }];\
        }\
        return data;\
    }, [sprints, tasks]);\
' components/ProgressInsights.tsx
