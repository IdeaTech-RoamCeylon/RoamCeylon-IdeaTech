import { MetricCard } from "../../../components/ui/MetricCard";
import { LineChart } from "../../../components/charts/LineChart";
import { BarChart } from "../../../components/charts/BarChart";
import { Users, Map, Cpu, Star } from 'lucide-react';

const mockLineData = [
  { date: 'Jan 1', users: 2400 },
  { date: 'Jan 5', users: 3100 },
  { date: 'Jan 10', users: 2800 },
  { date: 'Jan 15', users: 3800 },
  { date: 'Jan 20', users: 4300 },
  { date: 'Jan 25', users: 4100 },
  { date: 'Jan 30', users: 4800 },
];

const mockBarData = [
  { source: 'Organic', visits: 4500 },
  { source: 'Direct', visits: 3500 },
  { source: 'Referral', visits: 2000 },
];

export default function AnalyticsPage() {
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
          title="Total Users"
          value="12,482"
          icon={<Users className="w-5 h-5" />}
          trend={{ value: 12.5, label: "from last month" }}
          colorVariant="blue"
        />
        <MetricCard
          title="Active Trips"
          value="3,892"
          icon={<Map className="w-5 h-5" />}
          trend={{ value: 8.2, label: "from last month" }}
          colorVariant="purple"
        />
        <MetricCard
          title="AI Tokens Used"
          value="2.4M"
          icon={<Cpu className="w-5 h-5" />}
          trend={{ value: -2.4, label: "from last month" }}
          colorVariant="orange"
        />
        <MetricCard
          title="Avg. Trip Rating"
          value="4.8"
          icon={<Star className="w-5 h-5" />}
          trend={{ value: 2.1, label: "from last month" }}
          colorVariant="yellow"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Main Line Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col">
          <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
            <h3 className="font-semibold text-lg">Platform Usage</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Daily active users over the last 30 days.</p>
          </div>
          <div className="p-6 flex-1 w-full min-h-[350px]">
            <LineChart
              data={mockLineData}
              index="date"
              categories={['users']}
              colors={['#3b82f6']}
            />
          </div>
        </div>

        {/* Bar Chart Replacement */}
        <div className="bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col">
          <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
            <h3 className="font-semibold text-lg">Traffic Sources</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Where your users are coming from.</p>
          </div>
          <div className="p-6 flex-1 w-full min-h-[350px]">
            <BarChart
              data={mockBarData}
              index="source"
              categories={['visits']}
              colors={['#8b5cf6']}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
