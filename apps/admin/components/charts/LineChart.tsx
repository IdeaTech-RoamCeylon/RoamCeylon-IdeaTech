"use client";

import React from 'react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

interface LineChartProps {
  data: any[];
  index: string;
  categories: string[];
  colors?: string[];
  yAxisWidth?: number;
  valueFormatter?: (value: number) => string;
}

const defaultColors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

export function LineChart({
  data,
  index,
  categories,
  colors = defaultColors,
  yAxisWidth = 40,
  valueFormatter = (val) => val.toString(),
}: LineChartProps) {
  return (
    <div className="w-full h-full min-h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-zinc-200 dark:text-zinc-800 opacity-50" />
          <XAxis 
            dataKey={index} 
            axisLine={false} 
            tickLine={false} 
            tickMargin={10}
            fontSize={12}
            stroke="currentColor"
            className="text-zinc-500 dark:text-zinc-400"
          />
          <YAxis 
            width={yAxisWidth}
            axisLine={false} 
            tickLine={false} 
            tickFormatter={valueFormatter}
            fontSize={12}
            stroke="currentColor"
            className="text-zinc-500 dark:text-zinc-400"
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'var(--tooltip-bg, white)', 
              borderColor: 'var(--tooltip-border, #e4e4e7)',
              borderRadius: '0.5rem',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
              color: 'var(--tooltip-text, #18181b)'
            }}
            itemStyle={{ color: 'var(--tooltip-text, #18181b)' }}
            formatter={(value: any) => [valueFormatter(value as number)]}
            labelStyle={{ fontWeight: 600, marginBottom: '0.25rem' }}
          />
          <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
          {categories.map((category, idx) => (
            <Line
              key={category}
              type="monotone"
              dataKey={category}
              stroke={colors[idx % colors.length]}
              strokeWidth={2}
              activeDot={{ r: 6, strokeWidth: 0 }}
              dot={false}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}
