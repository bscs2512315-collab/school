"use client";

import { Typography } from "@/components/ui/Typography";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

export interface SubmissionsTimelinePoint {
  day: string;
  pendingManual: number;
  pendingAI: number;
  graded: number;
  failed: number;
}

interface LiveSubmissionsChartProps {
  data: SubmissionsTimelinePoint[];
}

function formatDay(day: string) {
  const d = new Date(day);
  if (Number.isNaN(d.getTime())) return day;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function LiveSubmissionsChart({
  data,
}: LiveSubmissionsChartProps) {
  const chartData = data.map((p) => ({
    day: formatDay(p.day),
    fullDate: p.day,
    pending: p.pendingManual + p.pendingAI,
    graded: p.graded,
  }));

  const totalGraded = data.reduce((acc, p) => acc + p.graded, 0);
  const totalPending = data.reduce((acc, p) => acc + (p.pendingManual + p.pendingAI), 0);

  return (
    <div className="flex h-full flex-col justify-between rounded-2xl sm:rounded-3xl border border-border/60 bg-card p-4 sm:p-6 shadow-xs">
      <div>
        {/* Header */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 sm:mb-5">
          <div>
            <Typography variant="h3" className="text-base font-bold sm:text-lg text-foreground">
              Paper II Submissions Trend
            </Typography>
            <p className="text-xs font-medium text-muted-foreground mt-0.5">
              {totalGraded} papers graded in past 14 days
            </p>
          </div>

          <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
            14 Days Trend
          </span>
        </div>

        {/* Recharts Area */}
        <div className="h-52 w-full sm:h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="gradedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="pendingGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="var(--color-border)"
                opacity={0.4}
              />
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                allowDecimals={false}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const item = payload[0].payload;
                  return (
                    <div className="rounded-2xl border border-border/60 bg-card p-3 shadow-xl text-xs space-y-1">
                      <p className="font-bold text-foreground">{item.day}</p>
                      <p className="font-semibold text-primary">
                        Graded: {item.graded} submissions
                      </p>
                      <p className="font-medium text-amber-600 dark:text-amber-400">
                        Pending: {item.pending} submissions
                      </p>
                    </div>
                  );
                }}
              />
              <Area
                type="monotone"
                dataKey="graded"
                name="Graded"
                stroke="var(--color-primary)"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#gradedGradient)"
              />
              <Area
                type="monotone"
                dataKey="pending"
                name="Pending"
                stroke="#f59e0b"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#pendingGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Footer Metrics */}
      <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-primary" />
          <span className="font-semibold text-foreground">{totalGraded} Graded</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-amber-500" />
          <span className="font-semibold text-amber-600 dark:text-amber-400">{totalPending} Pending</span>
        </div>
      </div>
    </div>
  );
}
