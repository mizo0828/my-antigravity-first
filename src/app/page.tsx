"use client";

import { useState, useEffect } from "react";
import { ModeToggle } from "@/components/mode-toggle";
import { PortfolioManager } from "@/components/dashboard/portfolio-manager";
import { ComparisonChart } from "@/components/dashboard/comparison-chart";
import { AssetAllocationChart } from "@/components/dashboard/asset-allocation-chart";

// ダッシュボード全体で共有する状態管理用のラッパーコンポーネント
export default function DashboardClient() {
  // デフォルト銘柄（トヨタ、日経平均、S&P500）
  const [symbols, setSymbols] = useState<string[]>(["7203.T", "^N225", "^GSPC"]);

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
          <PortfolioManager symbols={symbols} setSymbols={setSymbols} />
        </div>

        {/* 右側: チャート類 */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <ComparisonChart symbols={symbols} />
          <AssetAllocationChart symbols={symbols} />
        </div>
      </main>
    </div>
  );
}
