"use client";

import { Typography } from "@/components/ui/Typography";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface ClassDistributionProps {
  data: {
    name: string;
    value: number;
  }[];
}

const COLORS = [
  "var(--color-primary)",
  "color-mix(in oklab, var(--color-primary) 80%, white)",
  "color-mix(in oklab, var(--color-primary) 60%, white)",
  "color-mix(in oklab, var(--color-primary) 40%, white)",
];

export default function ClassDistribution({ data }: ClassDistributionProps) {
  const totalEnrolled = data.reduce((acc, d) => acc + d.value, 0);

  return (
    <div className="rounded-2xl sm:rounded-3xl border border-border/60 bg-card p-4 sm:p-6 shadow-xs flex flex-col justify-between">
      <div className="mb-4 flex items-center justify-between gap-2 sm:mb-5">
        <div>
          <Typography variant="h3" className="text-base font-bold sm:text-lg text-foreground">
            Students by Class
          </Typography>
          <p className="text-xs font-medium text-muted-foreground mt-0.5">
            Active candidate enrollment by grade
          </p>
        </div>
        <span className="text-xs font-bold text-muted-foreground">
          {totalEnrolled} total enrolled
        </span>
      </div>

      <div className="h-56 w-full sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 12, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="var(--color-border)"
              opacity={0.6}
            />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
              tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
            />
            <Tooltip
              cursor={{ fill: "color-mix(in oklab, var(--color-primary) 6%, transparent)" }}
              contentStyle={{
                borderRadius: 14,
                border: "1px solid var(--color-border)",
                backgroundColor: "var(--color-card)",
                color: "var(--color-foreground)",
                fontSize: 12,
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
              }}
            />
            <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={36}>
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
