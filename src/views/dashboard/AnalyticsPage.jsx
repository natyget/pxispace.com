'use client';

import { motion } from 'framer-motion';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine } from 'recharts';
import { Activity, MessageSquare, UploadCloud, Zap, TrendingUp } from 'lucide-react';

function buildSeries() {
    return Array.from({ length: 48 }, (_, i) => {
        const hour = 10 + Math.floor((i * 5) / 60);
        const minute = (i * 5) % 60;
        const hh = String(hour % 24).padStart(2, '0');
        const mm = String(minute).padStart(2, '0');
        let baseHype = 28 + ((i * 7) % 26);
        if (i > 15 && i < 20) baseHype += 35;
        if (i > 35 && i < 40) baseHype += 30;
        const hype = Math.max(0, Math.min(100, Math.round(baseHype)));
        return {
            time: `${hh}:${mm}`,
            hype,
            isPeak: i === 18 || i === 38,
            event: i === 18 ? 'Mass Upload Event' : i === 38 ? 'Peak Message Velocity' : null,
        };
    });
}

const DATA = buildSeries();

function CustomTooltip({ active, payload, label }) {
    if (!active || !payload || !payload.length) return null;
    const dataPoint = payload[0].payload;
    return (
        <div className="bg-[#0A0A0A] border border-white/10 p-4 rounded-[16px] shadow-2xl">
            <p className="text-white/50 text-[12px] font-mono mb-2 font-medium">{label}</p>
            <p className="text-white font-[900] text-[20px] flex items-center tracking-tight">
                <Activity className="w-5 h-5 mr-2 text-white" />
                {dataPoint.hype} Score
            </p>
            {dataPoint.event && (
                <div className="mt-3 pt-3 border-t border-white/10">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-white/70">
                        {dataPoint.event}
                    </p>
                </div>
            )}
        </div>
    );
}

export default function AnalyticsPage() {
    return (
        <div className="max-w-6xl mx-auto space-y-12">
            <div className="flex flex-col space-y-1">
                <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Hype Level Analytics</h1>
                <p className="text-zinc-500 text-sm">Real-time engagement tracking for your live event activity.</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-zinc-900/40 overflow-hidden">
                <div className="border-b border-white/5 px-8 py-6">
                    <h2 className="text-[16px] font-bold text-white flex items-center gap-3 tracking-tight">
                        <Activity className="w-5 h-5 text-white/70" />
                        Temporal Hype Index
                    </h2>
                </div>
                <div className="h-[450px] w-full pt-8 pr-8 pb-6">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorHype" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ffffff" stopOpacity={0.15} />
                                    <stop offset="95%" stopColor="#000000" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis
                                dataKey="time"
                                stroke="rgba(255,255,255,0.1)"
                                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11, fontFamily: 'monospace', fontWeight: 500 }}
                                tickLine={false}
                                axisLine={false}
                                minTickGap={30}
                            />
                            <YAxis
                                stroke="rgba(255,255,255,0.1)"
                                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11, fontFamily: 'monospace', fontWeight: 500 }}
                                tickLine={false}
                                axisLine={false}
                                domain={[0, 100]}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1, strokeDasharray: '4 4' }} />
                            {DATA.filter((d) => d.isPeak).map((peak, i) => (
                                <ReferenceLine
                                    key={i}
                                    x={peak.time}
                                    stroke="#ffffff"
                                    strokeDasharray="4 4"
                                    strokeOpacity={0.5}
                                    label={{ position: 'top', value: 'PEAK', fill: '#ffffff', fontSize: 11, fontWeight: 'bold', opacity: 0.8 }}
                                />
                            ))}
                            <Area
                                type="monotone"
                                dataKey="hype"
                                stroke="#ffffff"
                                strokeWidth={2.5}
                                fillOpacity={1}
                                fill="url(#colorHype)"
                                activeDot={{ r: 6, fill: '#ffffff', stroke: '#000000', strokeWidth: 3 }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-white/10 bg-zinc-900/40 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/5 overflow-hidden"
            >
                <MetricCard
                    title="Message Velocity"
                    value="142"
                    unit="/min"
                    trend="+24% vs Avg"
                    trendUp
                    icon={MessageSquare}
                />
                <MetricCard
                    title="Upload Velocity"
                    value="38"
                    unit="/min"
                    trend="+12% vs Avg"
                    trendUp
                    icon={UploadCloud}
                />
                <MetricCard
                    title="Total Reactions"
                    value="8,492"
                    trend="-4% vs Avg"
                    icon={Zap}
                    trendDown
                />
            </motion.div>
        </div>
    );
}

function MetricCard({ title, value, unit, trend, trendUp, trendDown, icon: Icon }) {
    return (
        <div className="p-6 md:p-8 flex flex-col justify-between min-h-[160px] md:min-h-[180px]">
            <div className="flex items-center justify-between mb-4 md:mb-6">
                <span className="text-[11px] md:text-[12px] font-bold tracking-widest text-white/40 uppercase">
                    {title}
                </span>
                <Icon className="h-4 w-4 md:h-5 md:w-5 text-white/40" />
            </div>
            <div className="mt-auto flex flex-col items-start gap-3 md:gap-4">
                <div className="text-3xl lg:text-[40px] font-[900] text-white tracking-tighter leading-none">
                    {value}
                    {unit && <span className="text-[14px] md:text-[18px] text-white/40 font-medium ml-1">{unit}</span>}
                </div>
                <div className={`inline-flex items-center space-x-1.5 px-2.5 py-1 md:px-3 md:py-1.5 rounded-full text-[10px] md:text-[11px] font-bold tracking-wider uppercase ${
                    trendDown
                        ? 'bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/20'
                        : trendUp
                            ? 'bg-[#4ade80]/10 text-[#4ade80] border border-[#4ade80]/20'
                            : 'bg-white/5 text-white/50 border border-white/10'
                }`}>
                    <TrendingUp className={`w-3 h-3 md:w-3.5 md:h-3.5 ${trendDown ? 'rotate-180' : ''}`} />
                    <span>{trend}</span>
                </div>
            </div>
        </div>
    );
}
