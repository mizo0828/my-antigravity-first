"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

// 表示用カラーパレット (Tailwindライク)
const COLORS = [
  "#3b82f6", // blue-500
  "#ef4444", // red-500
  "#10b981", // emerald-500
  "#f59e0b", // amber-500
  "#8b5cf6", // violet-500
  "#ec4899", // pink-500
  "#06b6d4", // cyan-500
];

interface ComparisonChartProps {
  symbols: string[];
}

export function ComparisonChart({ symbols }: ComparisonChartProps) {
  const [period, setPeriod] = useState("1mo");
  const [chartData, setChartData] = useState<any[]>([]);
  const [lines, setLines] = useState<{ key: string; name: string; color: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/market-data?symbols=${symbols.join(",")}&period=${period}`);
      const result = await res.json();
      
      if (result.data) {
        // データを日付ベースでマージして Recharts 形式に変換
        const mergedData: Record<string, any> = {};
        const availableSymbols: string[] = [];

        result.data.forEach((item: any) => {
          if (!item.error && item.historical) {
            availableSymbols.push(item.symbol);
            
            // 基準値（最初のデータ点の終値）を計算
            const baseValue = item.historical[0]?.close || 1;

            item.historical.forEach((hist: any) => {
              if (!mergedData[hist.date]) {
                mergedData[hist.date] = { date: hist.date };
              }
              // 騰落率（初日を0%としての変動率）を計算
              const percentChange = ((hist.close - baseValue) / baseValue) * 100;
              mergedData[hist.date][item.symbol] = percentChange;
            });
          }
        });

        // 日付でソートして配列化
        const sortedData = Object.values(mergedData).sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        setChartData(sortedData);

        // ライン（凡例）の設定
        const lineConfigs = availableSymbols.map((symbol, i) => {
          const item = result.data.find((d: any) => d.symbol === symbol);
          return {
            key: symbol,
            name: `${item?.quote?.shortName || symbol}`,
            color: COLORS[i % COLORS.length],
          };
        });
        setLines(lineConfigs);
      }
    } catch (error) {
      console.error("Failed to fetch historical data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [symbols.join(","), period]);

  const formatYAxis = (tickItem: number) => {
    return `${tickItem > 0 ? '+' : ''}${tickItem.toFixed(1)}%`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  return (
    <Card className="shadow-lg border-muted/50 w-full h-[450px] flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold">パフォーマンス比較</CardTitle>
            <CardDescription>基準日からの騰落率 (%)推移</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={period} onValueChange={(val) => val && setPeriod(val)}>
              <SelectTrigger className="w-[100px] h-8 text-xs">
                <SelectValue placeholder="期間" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1mo">1ヶ月</SelectItem>
                <SelectItem value="3mo">3ヶ月</SelectItem>
                <SelectItem value="6mo">半年</SelectItem>
                <SelectItem value="1y">1年</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={fetchData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-muted-foreground" : "text-muted-foreground"}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 pb-6 w-full h-full min-h-[300px]">
        {loading && chartData.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" vertical={false} />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                tick={{ fontSize: 12, fill: 'currentColor' }}
                tickMargin={10}
                stroke="currentColor"
                strokeOpacity={0.5}
              />
              <YAxis 
                tickFormatter={formatYAxis} 
                tick={{ fontSize: 12, fill: 'currentColor' }}
                width={60}
                tickMargin={10}
                stroke="currentColor"
                strokeOpacity={0.5}
                domain={['auto', 'auto']}
              />
              <Tooltip 
                formatter={(value: any) => [`${value > 0 ? '+' : ''}${Number(value).toFixed(2)}%`, '']}
                labelFormatter={(label) => new Date(label).toLocaleDateString('ja-JP')}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  borderColor: 'hsl(var(--border))',
                  color: 'hsl(var(--card-foreground))',
                  borderRadius: 'var(--radius)',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
                }}
              />
              <Legend wrapperStyle={{ paddingTop: "10px" }} />
              {lines.map((line) => (
                <Line
                  key={line.key}
                  type="monotone"
                  dataKey={line.key}
                  name={line.name}
                  stroke={line.color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              ))}
            </LineChart>
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
