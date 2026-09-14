sed -i '/{\/\* Assignee Workload & Capacity \*\/}/i \
                    {/* Velocity Chart */}\
                    <div className="bg-white border border-slate-200 p-6 shadow-sm">\
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Sprint Velocity</h3>\
                        <div className="h-72">\
                            <ResponsiveContainer width="100%" height="100%">\
                                <BarChart data={velocityChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>\
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />\
                                    <XAxis dataKey="sprintName" tick={{ fill: '"'#64748b'"', fontSize: 12 }} tickMargin={10} axisLine={false} tickLine={false} />\
                                    <YAxis tick={{ fill: '"'#64748b'"', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />\
                                    <Tooltip \
                                        cursor={{ fill: '"'#f8fafc'"' }}\
                                        contentStyle={{ borderRadius: '"'8px'"', border: '"'none'"', boxShadow: '"'0 4px 6px -1px rgb(0 0 0 / 0.1)'"' }}\
                                    />\
                                    <Bar dataKey="Story Points" fill={COLORS.Done} radius={[4, 4, 0, 0]} />\
                                </BarChart>\
                            </ResponsiveContainer>\
                        </div>\
                    </div>\
' components/ProgressInsights.tsx
