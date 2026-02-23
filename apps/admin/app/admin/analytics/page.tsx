import { MetricCard } from "../../../components/ui/MetricCard";
import { LineChart } from "../../../components/charts/LineChart";
import { BarChart } from "../../../components/charts/BarChart";
import { Map, Cpu, Star, AlertTriangle } from 'lucide-react';
import { getPlannerDailyStats, getFeedbackRate, getSystemErrors } from "../../../lib/api";

export default async function AnalyticsPage() {
  const [plannerDaily, feedbackRate, systemErrors] = await Promise.all([
    getPlannerDailyStats(),
    getFeedbackRate(),
    getSystemErrors()
  ]);

  // Aggregate stats from the Daily Planner Metrics
  const breakdown = plannerDaily?.breakdown || [];
  const plannerGenerated = breakdown.find(p => p.eventType === 'planner_generated')?._count._all || 0;
  
  // Format Response Time 
  const avgResponseMs = plannerDaily?.avgResponseTimeMs || 0;
  const avgResponseFormatted = avgResponseMs > 1000 
    ? `${(avgResponseMs / 1000).toFixed(1)}s` 
    : `${avgResponseMs}ms`;

  // Formatting for charts
  const plannerTrendData = plannerDaily?.last7Days?.map(day => ({
    date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    usage: day.count
  })) || [];

  const feedbackDistributionData = feedbackRate?.ratingDistribution?.map(stat => ({
    rating: `${stat.rating} Stars`,
    count: stat.count
  })) || [];

  return (
    <div className="space-y-6">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Overview</h2>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Track user engagement and platform metrics.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 text-sm font-medium bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-sm">
            Export Report
          </button>
          <button className="px-4 py-2 text-sm font-medium text-white bg-zinc-900 dark:bg-white dark:text-zinc-900 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors shadow-sm">
            Refresh Data
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Planner Requests (Today)"
          value={plannerGenerated.toString()}
          icon={<Cpu className="w-5 h-5" />}
          colorVariant="blue"
        />
        <MetricCard
          title="Positive Feedback"
          value={`${feedbackRate?.positiveFeedbackPercentage || 0}%`}
          icon={<Star className="w-5 h-5" />}
          colorVariant="emerald"
        />
        <MetricCard
          title="Avg Response Time"
          value={avgResponseFormatted}
          icon={<Map className="w-5 h-5" />}
          colorVariant="purple"
          sparklineData={plannerDaily?.recentResponseTimes}
        />
        <MetricCard
          title="System Errors (24h)"
          value={systemErrors?.totalErrors?.toString() || '0'}
          icon={<AlertTriangle className="w-5 h-5" />}
          trend={systemErrors ? { value: systemErrors.errorRate, label: "error rate" } : undefined}
          colorVariant="rose"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Main Line Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col">
          <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
            <h3 className="font-semibold text-lg">Planner Usage</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Total trips generated over the last 7 days.</p>
          </div>
          <div className="p-6 flex-1 w-full min-h-[350px]">
            <LineChart
              data={plannerTrendData}
              index="date"
              categories={['usage']}
              colors={['#3b82f6']}
            />
          </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col">
          <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
            <h3 className="font-semibold text-lg">Feedback Breakdown</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Distribution of 1-5 star ratings.</p>
          </div>
          <div className="p-6 flex-1 w-full min-h-[350px]">
             <BarChart
              data={feedbackDistributionData}
              index="rating"
              categories={['count']}
              colors={['#10b981']}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
