sed -i 's/<LineChart data={timelineData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>/<LineChart data={sprintBurnupData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>/g' components/ProgressInsights.tsx

sed -i 's/<XAxis dataKey="date" tick={{ fill: '"'#64748b'"', fontSize: 12 }} tickMargin={10} axisLine={false} tickLine={false} \/>/<XAxis dataKey="sprintName" tick={{ fill: '"'#64748b'"', fontSize: 12 }} tickMargin={10} axisLine={false} tickLine={false} \/>/g' components/ProgressInsights.tsx

sed -i 's/<Line type="stepAfter" dataKey="Tasks Due" stroke={COLORS.DueLine} strokeWidth={2} fillOpacity={1} fill="url(#colorDue)" \/>//g' components/ProgressInsights.tsx
sed -i 's/<Line type="stepAfter" dataKey="Tasks Started" stroke={COLORS.StartedLine} strokeWidth={2} fillOpacity={1} fill="url(#colorStarted)" \/>/<Line type="monotone" dataKey="Total Scope" stroke={COLORS.StartedLine} strokeDasharray="5 5" strokeWidth={2} dot={false} \/>/g' components/ProgressInsights.tsx
sed -i 's/<Line type="stepAfter" dataKey="Tasks Completed" stroke={COLORS.Done} strokeWidth={3} fillOpacity={1} fill="url(#colorDone)" \/>/<Line type="monotone" dataKey="Completed Points" stroke={COLORS.Done} strokeWidth={3} activeDot={{ r: 8 }} \/>/g' components/ProgressInsights.tsx

