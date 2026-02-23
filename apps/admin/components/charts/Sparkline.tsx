'use client';

import React from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface SparklineProps {
  data: number[];
  color?: string;
}

export function Sparkline({ data, color = 'currentColor' }: SparklineProps) {
  if (!data || data.length === 0) return null;

  // Transform raw numbers into Recharts expected array of objects format
  const chartData = data.map((val, index) => ({
    value: val,
    index,
  }));

  return (
    <div className="w-full h-10 mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
