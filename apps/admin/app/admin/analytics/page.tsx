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
        {/* Metric 1 */}
        <div className="bg-white dark:bg-zinc-950 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex justify-between items-start">
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Total Users</p>
            <span className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </span>
          </div>
          <p className="text-3xl font-semibold mt-4">12,482</p>
          <div className="flex items-center gap-1 mt-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
            <span>+12.5% from last month</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white dark:bg-zinc-950 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex justify-between items-start">
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Active Trips</p>
            <span className="p-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
          </div>
          <p className="text-3xl font-semibold mt-4">3,892</p>
          <div className="flex items-center gap-1 mt-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
            <span>+8.2% from last month</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white dark:bg-zinc-950 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex justify-between items-start">
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">AI Tokens Used</p>
            <span className="p-2 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-lg">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </span>
          </div>
          <p className="text-3xl font-semibold mt-4">2.4M</p>
          <div className="flex items-center gap-1 mt-2 text-xs font-medium text-rose-600 dark:text-rose-400">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
            <span>-2.4% from last month</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white dark:bg-zinc-950 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex justify-between items-start">
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Avg. Trip Rating</p>
            <span className="p-2 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 rounded-lg">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </span>
          </div>
          <p className="text-3xl font-semibold mt-4">4.8</p>
          <div className="flex items-center gap-1 mt-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
            <span>+0.1 from last month</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Main Line Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col">
          <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
            <h3 className="font-semibold text-lg">Platform Usage</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Daily active users over the last 30 days.</p>
          </div>
          <div className="p-6 flex-1 flex items-end gap-2 h-64 relative group">
            {/* Horizontal Grid lines */}
            <div className="absolute inset-0 p-6 flex flex-col justify-between pointer-events-none opacity-20">
              <div className="border-t border-dashed border-zinc-400 w-full"></div>
              <div className="border-t border-dashed border-zinc-400 w-full"></div>
              <div className="border-t border-dashed border-zinc-400 w-full"></div>
              <div className="border-t border-dashed border-zinc-400 w-full"></div>
              <div className="border-t border-dashed border-zinc-400 w-full"></div>
            </div>
            
            {/* Bars placeholder */}
            <div className="flex-1 bg-blue-100 dark:bg-blue-900/30 rounded-t-sm h-[40%] hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors cursor-pointer relative"></div>
            <div className="flex-1 bg-blue-100 dark:bg-blue-900/30 rounded-t-sm h-[50%] hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors cursor-pointer"></div>
            <div className="flex-1 bg-blue-100 dark:bg-blue-900/30 rounded-t-sm h-[45%] hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors cursor-pointer"></div>
            <div className="flex-1 bg-blue-100 dark:bg-blue-900/30 rounded-t-sm h-[70%] hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors cursor-pointer"></div>
            <div className="flex-1 bg-blue-100 dark:bg-blue-900/30 rounded-t-sm h-[65%] hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors cursor-pointer"></div>
            <div className="flex-1 bg-blue-500 rounded-t-sm h-[85%] hover:bg-blue-600 transition-colors cursor-pointer shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
            <div className="flex-1 bg-blue-100 dark:bg-blue-900/30 rounded-t-sm h-[60%] hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors cursor-pointer"></div>
            <div className="flex-1 bg-blue-100 dark:bg-blue-900/30 rounded-t-sm h-[55%] hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors cursor-pointer"></div>
            <div className="flex-1 bg-blue-100 dark:bg-blue-900/30 rounded-t-sm h-[75%] hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors cursor-pointer"></div>
            <div className="flex-1 bg-blue-100 dark:bg-blue-900/30 rounded-t-sm h-[80%] hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors cursor-pointer"></div>
            <div className="flex-1 bg-blue-100 dark:bg-blue-900/30 rounded-t-sm h-[90%] hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors cursor-pointer"></div>
            <div className="flex-1 bg-blue-100 dark:bg-blue-900/30 rounded-t-sm h-[100%] hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors cursor-pointer"></div>
          </div>
        </div>

        {/* Circular Chart Placeholder */}
        <div className="bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col">
          <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
            <h3 className="font-semibold text-lg">Traffic Sources</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Where your users are coming from.</p>
          </div>
          <div className="p-6 flex-1 flex flex-col items-center justify-center">
            <div className="relative w-40 h-40">
              {/* Doughnut SVG Mockup */}
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f4f4f5" strokeWidth="15" className="dark:stroke-zinc-800" />
                {/* Purple Slice */}
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#a855f7" strokeWidth="15" strokeDasharray="251.2" strokeDashoffset="100" strokeLinecap="round" />
                {/* Blue Slice */}
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#3b82f6" strokeWidth="15" strokeDasharray="251.2" strokeDashoffset="170" strokeLinecap="round" className="origin-center rotate-[100deg]" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <span className="block text-2xl font-bold">12k</span>
                  <span className="block text-xs text-zinc-500">Visits</span>
                </div>
              </div>
            </div>
            
            <div className="mt-6 space-y-3 w-full">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span>Organic Search</span>
                </div>
                <span className="font-medium">45%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                  <span>Direct</span>
                </div>
                <span className="font-medium">35%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-zinc-200 dark:bg-zinc-700"></div>
                  <span>Referral</span>
                </div>
                <span className="font-medium">20%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
