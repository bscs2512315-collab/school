"use client";

import {
  Bar, BarChart, CartesianGrid, Legend, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

export type GrowthPoint = {
  day: string;
  registrations: number;
  practicingStudents: number;
  attempts: number;
};

export type SchoolActivityPoint = {
  name: string;
  students: number;
  practicingStudents: number;
  attempts: number;
};

export default function GrowthAndSchoolCharts({
  growth,
  schools,
  engagement,
}: {
  growth: GrowthPoint[];
  schools: SchoolActivityPoint[];
  engagement: { practicing7d: number; practicing30d: number; repeat30d: number };
}) {
  const activeSchools = schools.filter((school) => school.students > 0);
  const growthData = growth.map((point) => ({
    ...point,
    label: point.day.slice(5),
  }));
  const schoolData = activeSchools.map((school) => ({
    ...school,
    label: school.name.length > 18 ? `${school.name.slice(0, 18)}…` : school.name,
  }));

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Practiced in 7 days", value: engagement.practicing7d },
          { label: "Practiced in 30 days", value: engagement.practicing30d },
          { label: "Practiced on 2+ days", value: engagement.repeat30d },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-border/60 bg-card px-4 py-3 shadow-xs">
            <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
            <p className="mt-1 text-2xl font-black text-foreground">{item.value.toLocaleString()}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
      <section className="min-w-0 rounded-2xl border border-border/60 bg-card p-4 shadow-xs sm:p-6">
        <h3 className="text-base font-bold text-foreground sm:text-lg">Student growth and practice</h3>
        <p className="mt-1 text-xs text-muted-foreground">Daily registrations and distinct students submitting an exam, last 30 days.</p>
        <div className="mt-5 h-64 w-full" role="img" aria-label="Line chart of daily registrations and practicing students over 30 days">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={growthData} margin={{ top: 5, right: 12, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} minTickGap={20} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
              <Tooltip labelFormatter={(_, payload) => payload?.[0]?.payload?.day ?? ""} />
              <Legend />
              <Line type="monotone" dataKey="registrations" name="New students" stroke="var(--color-primary)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="practicingStudents" name="Practicing students" stroke="#f59e0b" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="min-w-0 rounded-2xl border border-border/60 bg-card p-4 shadow-xs sm:p-6">
        <h3 className="text-base font-bold text-foreground sm:text-lg">School adoption</h3>
        <p className="mt-1 text-xs text-muted-foreground">Registered students versus those who submitted an exam in the last 30 days.</p>
        {schoolData.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">No verified schools with registered students yet.</div>
        ) : (
          <div className="mt-5 h-64 w-full" role="img" aria-label="Bar chart of registered and practicing students by school">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={schoolData} layout="vertical" margin={{ top: 5, right: 8, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-border)" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="label" width={90} tick={{ fontSize: 10 }} />
                <Tooltip labelFormatter={(_, payload) => payload?.[0]?.payload?.name ?? ""} />
                <Legend />
                <Bar dataKey="students" name="Registered" fill="var(--color-primary)" radius={[0, 4, 4, 0]} />
                <Bar dataKey="practicingStudents" name="Practicing" fill="#f59e0b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>
      </div>
    </div>
  );
}
