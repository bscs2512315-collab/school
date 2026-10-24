"use client";

import { Typography } from "@/components/ui/Typography";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

interface BoardDistributionProps {
  data: {
    name: string;
    value: number;
  }[];
}

const COLORS = [
  "var(--color-primary)",
  "#3b82f6",
  "#a855f7",
  "#f59e0b",
  "#06b6d4",
  "#ec4899",
  "#10b981",
];

export default function BoardDistribution({ data }: BoardDistributionProps) {
  const filteredData = data.filter((d) => d.value > 0);
  const totalStudents = filteredData.reduce((acc, d) => acc + d.value, 0);

  return (
    <div className="rounded-2xl sm:rounded-3xl border border-border/60 bg-card p-4 sm:p-6 shadow-xs flex flex-col justify-between">
      <div className="mb-4 flex items-center justify-between gap-2 sm:mb-5">
        <div>
          <Typography variant="h3" className="text-base font-bold sm:text-lg text-foreground">
            Board-wise Enrollment
          </Typography>
          <p className="text-xs font-medium text-muted-foreground mt-0.5">
            Affiliated examination boards breakdown
          </p>
        </div>
        <span className="text-xs font-bold text-muted-foreground">
          {totalStudents} students ({filteredData.length} boards)
        </span>
      </div>

      <div className="h-56 w-full sm:h-64">
        {filteredData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={filteredData}
                cx="50%"
                cy="45%"
                innerRadius={48}
                outerRadius={70}
                paddingAngle={4}
                dataKey="value"
              >
                {filteredData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: 14,
                  border: "1px solid var(--color-border)",
                  backgroundColor: "var(--color-card)",
                  color: "var(--color-foreground)",
                  fontSize: 12,
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                }}
              />
              <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center">
            <Typography variant="muted">No board data available</Typography>
          </div>
        )}
      </div>
    </div>
  );
}
