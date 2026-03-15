"use client";

import { useState, useMemo } from "react";
import { ModeToggle } from "@/components/mode-toggle";
import { PortfolioManager } from "@/components/dashboard/portfolio-manager";
import { ComparisonChart } from "@/components/dashboard/comparison-chart";
import { AssetAllocationChart } from "@/components/dashboard/asset-allocation-chart";

import { Holding } from "@/types";

// ダッシュボード全体で共有する状態管理用のラッパーコンポーネント
export default function DashboardClient() {
  // デフォルト銘柄と保有状況（トヨタ、日経平均、S&P500）
  const [holdings, setHoldings] = useState<Holding[]>([
    { symbol: "7203.T", quantity: 100, purchasePrice: 2500 },
    { symbol: "^N225", quantity: 0, purchasePrice: 0 },
    { symbol: "^GSPC", quantity: 0, purchasePrice: 0 }
  ]);

  const symbols = useMemo(() => holdings.map(h => h.symbol), [holdings]);

  return (
    <div className="min-h-screen bg-background font-[family-name:var(--font-geist-sans)] p-6 md:p-12">
      <header className="flex items-center justify-between mb-8 pb-4 border-b">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">投資ダッシュボード</h1>
          <p className="text-muted-foreground mt-1">日本株・米国インデックスの管理と比較</p>
        </div>
        <ModeToggle />
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左側: 個別株管理 */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <PortfolioManager holdings={holdings} setHoldings={setHoldings} />
        </div>

        {/* 右側: チャート類 */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <ComparisonChart symbols={symbols} />
          <AssetAllocationChart holdings={holdings} />
        </div>
      </main>
    </div>
  );
}
