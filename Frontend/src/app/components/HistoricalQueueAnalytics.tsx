import { useMemo } from "react";

interface ServiceOption {
  _id: string;
  name: string;
}

interface QueueToken {
  _id: string;
  serviceId: string | { _id: string; name?: string };
  createdAt?: string;
}

interface HistoricalQueueAnalyticsProps {
  services: ServiceOption[];
  queueTokens: QueueToken[];
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function HistoricalQueueAnalytics({ services, queueTokens }: HistoricalQueueAnalyticsProps) {
  const analytics = useMemo(() => {
    const now = new Date();
    const currentWeekStart = new Date(now);
    currentWeekStart.setDate(now.getDate() - now.getDay());
    currentWeekStart.setHours(0, 0, 0, 0);

    const previousWeekStart = new Date(currentWeekStart);
    previousWeekStart.setDate(previousWeekStart.getDate() - 7);
    const previousWeekEnd = new Date(currentWeekStart);

    const hourCounts = Array.from({ length: 24 }, () => 0);
    const dayCounts = Array.from({ length: 7 }, () => 0);
    const serviceCounts = new Map<string, number>();

    let currentWeekTotal = 0;
    let previousWeekTotal = 0;

    const resolveServiceId = (serviceRef: QueueToken["serviceId"]) =>
      typeof serviceRef === "object" ? serviceRef._id : serviceRef;

    for (const token of queueTokens) {
      const createdDate = token.createdAt ? new Date(token.createdAt) : null;
      if (!createdDate || Number.isNaN(createdDate.getTime())) continue;

      const dayIndex = createdDate.getDay();
      const hourIndex = createdDate.getHours();
      dayCounts[dayIndex] += 1;
      hourCounts[hourIndex] += 1;

      const sid = resolveServiceId(token.serviceId);
      serviceCounts.set(sid, (serviceCounts.get(sid) || 0) + 1);

      if (createdDate >= currentWeekStart) {
        currentWeekTotal += 1;
      } else if (createdDate >= previousWeekStart && createdDate < previousWeekEnd) {
        previousWeekTotal += 1;
      }
    }

    const peakHour = hourCounts.reduce(
      (best, count, hour) => (count > best.count ? { hour, count } : best),
      { hour: 0, count: 0 }
    );

    const dailyTrend = DAY_LABELS.map((label, index) => ({
      label,
      value: dayCounts[index],
    }));

    const weeklyTrend = [
      { label: "Last Week", value: previousWeekTotal },
      { label: "This Week", value: currentWeekTotal },
    ];

    const serviceDemand = services
      .map((service) => ({
        id: service._id,
        name: service.name,
        value: serviceCounts.get(service._id) || 0,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    const maxDaily = Math.max(...dailyTrend.map((x) => x.value), 1);
    const maxWeekly = Math.max(...weeklyTrend.map((x) => x.value), 1);
    const maxService = Math.max(...serviceDemand.map((x) => x.value), 1);

    return {
      dailyTrend,
      weeklyTrend,
      serviceDemand,
      peakHour,
      maxDaily,
      maxWeekly,
      maxService,
      totalTokens: queueTokens.length,
      currentWeekTotal,
    };
  }, [queueTokens, services]);

  const peakLabel = `${String(analytics.peakHour.hour).padStart(2, "0")}:00 - ${String(
    (analytics.peakHour.hour + 1) % 24
  ).padStart(2, "0")}:00`;

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 text-white px-8 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-blue-300">Historical Queue Analytics</h1>
        <p className="mt-2 text-sm text-blue-100/80">
          Daily and weekly queue trends, peak-hour detection, and service demand insights for better planning.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="rounded-lg border border-blue-900 bg-slate-900 p-5">
          <p className="text-sm text-blue-200">Total Historical Tokens</p>
          <p className="text-3xl font-semibold mt-2">{analytics.totalTokens}</p>
        </div>
        <div className="rounded-lg border border-blue-900 bg-slate-900 p-5">
          <p className="text-sm text-blue-200">This Week Demand</p>
          <p className="text-3xl font-semibold mt-2">{analytics.currentWeekTotal}</p>
        </div>
        <div className="rounded-lg border border-blue-900 bg-slate-900 p-5">
          <p className="text-sm text-blue-200">Peak Hour</p>
          <p className="text-xl font-semibold mt-2">{peakLabel}</p>
          <p className="text-xs text-blue-100/70 mt-1">{analytics.peakHour.count} tokens on average peak</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border border-blue-900 bg-slate-900 p-5">
          <h3 className="text-blue-300 font-semibold mb-4">Daily Queue Trend</h3>
          <div className="space-y-3">
            {analytics.dailyTrend.map((item) => (
              <div key={item.label} className="grid grid-cols-[56px_1fr_48px] items-center gap-3">
                <span className="text-sm text-blue-100">{item.label}</span>
                <div className="h-3 rounded-full bg-blue-950 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-blue-400"
                    style={{ width: `${(item.value / analytics.maxDaily) * 100}%` }}
                  />
                </div>
                <span className="text-right text-sm text-blue-200">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-blue-900 bg-slate-900 p-5">
          <h3 className="text-blue-300 font-semibold mb-4">Weekly Queue Trend</h3>
          <div className="space-y-4">
            {analytics.weeklyTrend.map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-blue-100">{item.label}</span>
                  <span className="text-blue-200">{item.value}</span>
                </div>
                <div className="h-4 rounded-full bg-blue-950 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                    style={{ width: `${(item.value / analytics.maxWeekly) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-blue-900 bg-slate-900 p-5 lg:col-span-2">
          <h3 className="text-blue-300 font-semibold mb-4">Service Demand Analysis</h3>
          {analytics.serviceDemand.length === 0 ? (
            <p className="text-sm text-blue-100/80">No service demand data available yet.</p>
          ) : (
            <div className="space-y-3">
              {analytics.serviceDemand.map((item) => (
                <div key={item.id} className="grid grid-cols-[220px_1fr_48px] items-center gap-3">
                  <span className="text-sm text-blue-100 truncate">{item.name}</span>
                  <div className="h-3 rounded-full bg-blue-950 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-sky-500 to-indigo-500"
                      style={{ width: `${(item.value / analytics.maxService) * 100}%` }}
                    />
                  </div>
                  <span className="text-right text-sm text-blue-200">{item.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
