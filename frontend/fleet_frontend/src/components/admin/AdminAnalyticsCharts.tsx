"use client";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

function formatNumber(n: number) {
  try {
    return n.toLocaleString();
  } catch {
    return String(n);
  }
}

function PercentLabel({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
  value,
}: any) {
  if (!value || value <= 0) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  const p = Math.round((percent || 0) * 100);

  if (p < 5) return null; // ما نكثّروش labels الصغيرة

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      style={{ fontSize: 12, fontWeight: 800 }}
    >
      {p}%
    </text>
  );
}

export function AdminAnalyticsCharts({
  vehiclesCount,
  availableVehicles,
  inServiceVehicles,
  outVehicles,
  vehiclesNeedingMaintenance,
}: {
  vehiclesCount: number;
  availableVehicles: number;
  inServiceVehicles: number;
  outVehicles: number;
  vehiclesNeedingMaintenance: number;
}) {
  const pieData = [
    { name: "Available", value: availableVehicles },
    { name: "In service", value: inServiceVehicles },
    { name: "Out/Broken", value: outVehicles },
  ].filter((x) => x.value > 0);

  const barData = [
    { name: "Maintenance due (7d)", value: vehiclesNeedingMaintenance },
    { name: "Out/Broken", value: outVehicles },
  ];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      {/* Pie */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-extrabold text-slate-900">
                Vehicle Status Distribution
              </div>
              <div className="mt-1 text-xs font-semibold text-slate-500">
                Share of fleet by status
              </div>
            </div>

            <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-extrabold text-slate-700">
              Total: {formatNumber(vehiclesCount)}
            </div>
          </div>
        </div>

        <div className="p-5">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  formatter={(value: any, name: any) => [
                    formatNumber(Number(value)),
                    name,
                  ]}
                />
                <Legend
                  verticalAlign="bottom"
                  height={42}
                  wrapperStyle={{ fontSize: 12, fontWeight: 700 }}
                />
                <Pie
                  data={pieData.length ? pieData : [{ name: "No data", value: 1 }]}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={110}
                  innerRadius={55}
                  paddingAngle={2}
                  labelLine={false}
                  label={PercentLabel}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="text-xs font-semibold text-slate-500">Available</div>
              <div className="mt-1 text-lg font-extrabold text-slate-900">
                {formatNumber(availableVehicles)}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="text-xs font-semibold text-slate-500">In service</div>
              <div className="mt-1 text-lg font-extrabold text-slate-900">
                {formatNumber(inServiceVehicles)}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="text-xs font-semibold text-slate-500">Out/Broken</div>
              <div className="mt-1 text-lg font-extrabold text-slate-900">
                {formatNumber(outVehicles)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50">
          <div>
            <div className="text-sm font-extrabold text-slate-900">Alerts</div>
            <div className="mt-1 text-xs font-semibold text-slate-500">
              Critical counts to watch
            </div>
          </div>
        </div>

        <div className="p-5">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} barSize={42}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip
                  formatter={(value: any) => formatNumber(Number(value))}
                />
                <Bar dataKey="value" radius={[14, 14, 6, 6]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-semibold text-slate-600">
              Tip
            </div>
            <div className="mt-1 text-sm font-semibold text-slate-700">
              Reduce “Out/Broken” and upcoming maintenance to improve fleet health.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}