"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3, List } from "lucide-react";
import { Typography } from "@/components/ui/Typography";
import {
  formatVotePercent,
  getRaceLeaders,
  groupTalliesByRace,
  type RaceLeader,
  type RaceTallyGroup,
} from "@/lib/elections/analytics";
import { formatCandidateFirstName } from "@/lib/elections/format";
import { cn } from "@/lib/utils";
import CrownSVG from "@/public/svgs/CrownSVG";
import type { ElectionAnalytics, ElectionTally } from "@/types/election";

const CHART_COLORS = [
  "var(--color-primary)",
  "color-mix(in oklab, var(--color-primary) 75%, black)",
  "color-mix(in oklab, var(--color-primary) 55%, white)",
  "color-mix(in oklab, var(--color-primary) 35%, black)",
  "color-mix(in oklab, var(--color-primary) 45%, white)",
  "color-mix(in oklab, var(--color-primary) 65%, black)",
  "color-mix(in oklab, var(--color-primary) 25%, white)",
];

const TOOLTIP_STYLE = {
  borderRadius: 12,
  border: "1px solid var(--color-border)",
  backgroundColor: "var(--color-card)",
  color: "var(--color-foreground)",
};

interface ChartRow {
  name: string;
  votes: number;
  percentage: number;
}

type AnalyticsView = "list" | "charts";

export default function ElectionAnalyticsCharts({
  analytics,
  isLive = false,
}: {
  analytics: ElectionAnalytics;
  isLive?: boolean;
}) {
  const [view, setView] = useState<AnalyticsView>("list");
  const groups = useMemo(
    () => groupTalliesByRace(analytics.tallies),
    [analytics.tallies],
  );
  const showRaceHeadings = groups.length > 1;

  return (
    <div className="space-y-6">
      {analytics.tallies.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-border p-10 text-center">
          <p className="font-bold">No candidates yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Add nominees to see live vote counts and percentages.
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-1 rounded-2xl border border-border/50 bg-card/40 p-1">
            {(
              [
                { key: "list" as const, label: "List view", icon: List },
                { key: "charts" as const, label: "Charts view", icon: BarChart3 },
              ] as const
            ).map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setView(item.key)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold transition-colors",
                  {
                    "bg-primary text-primary-foreground shadow-sm":
                      view === item.key,
                    "text-muted-foreground hover:text-foreground":
                      view !== item.key,
                  },
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </button>
            ))}
          </div>

          {view === "list" ? (
            <div className="space-y-6">
              <RaceLeaderGrid groups={groups} isLive={isLive} />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {groups.flatMap((group) =>
                  group.tallies.map((tally, index) => (
                    <TallyCard
                      key={tally.candidateId}
                      tally={tally}
                      raceLabel={group.label}
                      raceTotal={group.totalVotes}
                      color={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  )),
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {groups.map((group) => (
                <section key={group.key} className="space-y-4">
                  {showRaceHeadings ? (
                    <div className="flex items-end justify-between gap-3">
                      <h3 className="text-lg font-black tracking-tight">
                        {group.label}
                      </h3>
                      <p className="text-xs font-bold text-muted-foreground">
                        {group.totalVotes}{" "}
                        {group.totalVotes === 1 ? "vote" : "votes"}
                      </p>
                    </div>
                  ) : null}
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <SharePieChart
                      title="Vote share"
                      emptyLabel="Waiting for the first vote"
                      rows={toChartRows(group.tallies)}
                      hasVotes={group.totalVotes > 0}
                    />
                    <VotesBarChart
                      title="Votes by candidate"
                      emptyLabel="No votes yet"
                      rows={toChartRows(group.tallies)}
                    />
                  </div>
                </section>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function RaceLeaderGrid({
  groups,
  isLive,
}: {
  groups: RaceTallyGroup[];
  isLive: boolean;
}) {
  const races = useMemo(() => getRaceLeaders(groups), [groups]);

  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-sm font-black tracking-tight">
          {isLive ? "Leading by category" : "Winners by category"}
        </h3>
        <p className="text-xs text-muted-foreground">
          {isLive
            ? "Live lead in each category. Ties stay visible until a candidate pulls ahead."
            : "Final lead in each category."}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {races.map((race) => (
          <RaceLeaderCard key={race.key} race={race} isLive={isLive} />
        ))}
      </div>
    </section>
  );
}

function RaceLeaderCard({
  race,
  isLive,
}: {
  race: RaceLeader;
  isLive: boolean;
}) {
  const waiting = race.leaders.length === 0;

  return (
    <article
      className={cn(
        "flex h-full flex-col items-center rounded-2xl border bg-card/40 p-3 text-center",
        {
          "border-dashed border-border/60": waiting,
          "border-border/50": !waiting && race.isTie,
          "border-primary/20": !waiting && !race.isTie,
        },
      )}
    >
      <p className="w-full truncate text-[10px] font-black uppercase tracking-widest text-muted-foreground">
        {race.label}
      </p>
      <RaceLeaderBody race={race} isLive={isLive} />
    </article>
  );
}

function RaceLeaderBody({
  race,
  isLive,
}: {
  race: RaceLeader;
  isLive: boolean;
}) {
  const leader = race.leaders[0];

  if (race.leaders.length === 0) {
    return (
      <>
        <div className="mt-3 flex h-14 w-full items-center justify-center">
          <div className="size-14 rounded-full bg-muted" />
        </div>
        <p className="mt-2 min-h-8 w-full text-xs font-medium leading-tight text-muted-foreground">
          No votes yet
        </p>
      </>
    );
  }

  if (race.isTie) {
    return (
      <>
        <div className="mt-3 flex h-14 w-full items-center justify-center gap-1">
          {race.leaders.slice(0, 3).map((item) => (
            <img
              key={item.candidateId}
              src={item.profileImageUrl}
              alt=""
              className="size-10 rounded-full object-cover"
            />
          ))}
        </div>
        <p className="mt-2 min-h-8 w-full text-xs font-bold leading-tight">
          {race.leaders.map((item) => formatCandidateFirstName(item.candidateName)).join(" · ")}
        </p>
        <p className="text-[11px] font-semibold text-primary">
          Tied · {formatVotePercent(leader.percentage)}
        </p>
        <p className="text-[11px] text-muted-foreground">
          {leader.voteCount} {leader.voteCount === 1 ? "vote" : "votes"} each
        </p>
      </>
    );
  }

  return (
    <>
      <div className="mt-3 flex h-14 w-full items-center justify-center">
        <div className="relative size-14">
          <img
            src={leader.profileImageUrl}
            alt=""
            className="size-14 rounded-full object-cover"
          />
          <span className="absolute top-0 right-0 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <CrownSVG className="size-3" />
          </span>
        </div>
      </div>
      <p className="mt-2 min-h-8 w-full text-xs font-bold leading-tight">
        {formatCandidateFirstName(leader.candidateName)}
      </p>
      <p className="text-[11px] font-semibold text-primary">
        {isLive ? "Leading" : "Winner"} · {formatVotePercent(leader.percentage)}
      </p>
      <p className="text-[11px] text-muted-foreground">
        {leader.voteCount} {leader.voteCount === 1 ? "vote" : "votes"}
      </p>
    </>
  );
}

function TallyCard({
  tally,
  raceLabel,
  raceTotal,
  color,
}: {
  tally: ElectionTally;
  raceLabel: string;
  raceTotal: number;
  color: string;
}) {
  const widthPercent =
    raceTotal === 0 ? 0 : (tally.voteCount / raceTotal) * 100;

  return (
    <div className="rounded-2xl border border-border/50 bg-card/40 p-4">
      <div className="flex items-center gap-3">
        <img
          src={tally.profileImageUrl}
          alt=""
          className="size-12 rounded-2xl object-cover"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold">{tally.candidateName}</p>
          <p className="truncate text-xs font-semibold text-primary">
            {raceLabel}
          </p>
          <p className="text-xs text-muted-foreground">
            {tally.voteCount} {tally.voteCount === 1 ? "vote" : "votes"} ·{" "}
            {formatVotePercent(tally.percentage)}
          </p>
        </div>
        <p className="text-xl font-black text-primary">
          {formatVotePercent(tally.percentage)}
        </p>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full"
          style={{ width: `${widthPercent}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function SharePieChart({
  title,
  emptyLabel,
  rows,
  hasVotes,
}: {
  title: string;
  emptyLabel: string;
  rows: ChartRow[];
  hasVotes: boolean;
}) {
  const pieRows = rows.filter((row) => row.votes > 0);
  const showPie = hasVotes && pieRows.length > 0;

  return (
    <div className="rounded-[2rem] border border-border/50 bg-card/40 p-4 sm:p-6">
      <Typography
        variant="h3"
        className="mb-4 flex items-center gap-2 text-base font-bold"
      >
        <span className="h-5 w-1 rounded-full bg-primary" />
        {title}
      </Typography>
      <div className="h-64 w-full">
        {showPie ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieRows}
                dataKey="votes"
                nameKey="name"
                cx="50%"
                cy="45%"
                innerRadius={48}
                outerRadius={72}
                paddingAngle={4}
              >
                {pieRows.map((_, index) => (
                  <Cell
                    key={`pie-${index}`}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(value, _name, item) => {
                  const payload = item?.payload as ChartRow | undefined;
                  const votes = typeof value === "number" ? value : 0;
                  return [
                    `${votes} ${votes === 1 ? "vote" : "votes"} (${formatVotePercent(payload?.percentage ?? 0)})`,
                    payload?.name ?? "Votes",
                  ];
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                wrapperStyle={{ fontSize: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center">
            <Typography variant="muted">{emptyLabel}</Typography>
          </div>
        )}
      </div>
    </div>
  );
}

function VotesBarChart({
  title,
  emptyLabel,
  rows,
}: {
  title: string;
  emptyLabel: string;
  rows: ChartRow[];
}) {
  return (
    <div className="rounded-[2rem] border border-border/50 bg-card/40 p-4 sm:p-6">
      <Typography
        variant="h3"
        className="mb-4 flex items-center gap-2 text-base font-bold"
      >
        <span className="h-5 w-1 rounded-full bg-primary" />
        {title}
      </Typography>
      <div className="h-64 w-full">
        {rows.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={rows}
              layout="vertical"
              margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={false}
                stroke="var(--color-border)"
              />
              <XAxis
                type="number"
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={92}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
                tickFormatter={(value: string) =>
                  value.length > 12 ? `${value.slice(0, 11)}…` : value
                }
              />
              <Tooltip
                cursor={{
                  fill: "color-mix(in oklab, var(--color-primary) 6%, transparent)",
                }}
                contentStyle={TOOLTIP_STYLE}
                formatter={(value, _name, item) => {
                  const payload = item?.payload as ChartRow | undefined;
                  const votes = typeof value === "number" ? value : 0;
                  return [
                    `${votes} ${votes === 1 ? "vote" : "votes"} (${formatVotePercent(payload?.percentage ?? 0)})`,
                    "Votes",
                  ];
                }}
              />
              <Bar dataKey="votes" radius={[0, 8, 8, 0]} barSize={18}>
                {rows.map((_, index) => (
                  <Cell
                    key={`bar-${index}`}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center">
            <Typography variant="muted">{emptyLabel}</Typography>
          </div>
        )}
      </div>
    </div>
  );
}

function toChartRows(tallies: ElectionTally[]): ChartRow[] {
  return tallies.map((tally) => ({
    name: tally.candidateName,
    votes: tally.voteCount,
    percentage: tally.percentage,
  }));
}
