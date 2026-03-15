"use client";

import { useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RefreshCw } from "lucide-react";

const COLORS = [
  "#3b82f6", // blue-500
  "#ef4444", // red-500
  "#10b981", // emerald-500
  "#f59e0b", // amber-500
  "#8b5cf6", // violet-500
  "#ec4899", // pink-500
  "#06b6d4", // cyan-500
];

interface AssetAllocationChartProps {
  symbols: string[];
}

export function AssetAllocationChart({ symbols }: AssetAllocationChartProps) {
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/market-data?symbols=${symbols.join(",")}&period=1mo`);
      const result = await res.json();
      
      if (result.data) {
        // 現在の価格を基に疑似的な資産構成割合を算出
        // ※実際はユーザーの「保有株数 × 現在価格」で計算しますが、今回はデモとして均等保有(1株ずつ)と仮定
        const allocationData = result.data
          .filter((item: any) => !item.error && item.quote?.regularMarketPrice)
          .map((item: any) => ({
            name: item.quote?.shortName || item.symbol,
            symbol: item.symbol,
            value: item.quote.regularMarketPrice,
          }));

        setChartData(allocationData);
      }
    } catch (error) {
      console.error("Failed to fetch current quotes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [symbols]);

  // 通貨フォーマット (簡易的に数値のみカンマ区切り)
  const formatValue = (value: number) => {
    return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
  };

  return (
    <Card className="shadow-lg border-muted/50 w-full h-[450px] flex flex-col">
      <CardHeader className="pb-2">
         <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold">資産構成比率</CardTitle>
            <CardDescription>現在価格ベースの保有比率（デモ）</CardDescription>
          </div>
          <button onClick={fetchData} disabled={loading} className="p-2 rounded-md hover:bg-muted/50">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-muted-foreground" : "text-muted-foreground"}`} />
          </button>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 pb-6 w-full h-full min-h-[300px]">
        {loading && chartData.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: any) => [formatValue(Number(value)), '評価額']}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  borderColor: 'hsl(var(--border))',
                  color: 'hsl(var(--card-foreground))',
                  borderRadius: 'var(--radius)',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
                }}
              />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
            <p>データがありません</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
