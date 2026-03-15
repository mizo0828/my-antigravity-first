"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, TrendingDown, TrendingUp, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StockQuote {
  symbol: string;
  regularMarketPrice: number;
  regularMarketChangePercent: number;
  shortName: string;
}

interface PortfolioManagerProps {
  symbols: string[];
  setSymbols: (symbols: string[]) => void;
}

export function PortfolioManager({ symbols, setSymbols }: PortfolioManagerProps) {
  const [inputSymbol, setInputSymbol] = useState("");
  const [quotes, setQuotes] = useState<StockQuote[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchQuotes = async () => {
    if (symbols.length === 0) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/market-data?symbols=${symbols.join(",")}&period=1mo`);
      const result = await res.json();
      if (result.data) {
        const fetchedQuotes = result.data
          .filter((item: any) => !item.error)
          .map((item: any) => ({
            symbol: item.symbol,
            ...item.quote,
          }));
        setQuotes(fetchedQuotes);
      }
    } catch (error) {
      console.error("Failed to fetch quotes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, [symbols]);

  const addSymbol = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputSymbol.trim()) return;
    
    // 簡易的な重複・形式チェック（大文字化して追加）
    const newSymbol = inputSymbol.trim().toUpperCase();
    if (!symbols.includes(newSymbol)) {
      setSymbols([...symbols, newSymbol]);
    }
    setInputSymbol("");
  };

  const removeSymbol = (symbolToRemove: string) => {
    setSymbols(symbols.filter((s) => s !== symbolToRemove));
    setQuotes(quotes.filter((q) => q.symbol !== symbolToRemove));
  };

  return (
    <Card className="shadow-lg border-muted/50 w-full h-full flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold">ポートフォリオ管理</CardTitle>
          <Button variant="ghost" size="icon" onClick={fetchQuotes} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-muted-foreground" : "text-muted-foreground hover:text-foreground"}`} />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col gap-6">
        {/* 追加フォーム */}
        <form onSubmit={addSymbol} className="flex gap-2">
          <Input
            placeholder="銘柄コード (例: 7203.T, AAPL)"
            value={inputSymbol}
            onChange={(e) => setInputSymbol(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" variant="secondary">
            <Plus className="mr-2 h-4 w-4" /> 追加
          </Button>
        </form>

        {/* 銘柄リスト */}
        <div className="flex-1 overflow-auto rounded-md border bg-muted/10 p-2">
          {quotes.length === 0 && !loading ? (
            <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
              銘柄が追加されていません
            </div>
          ) : (
             <div className="flex flex-col gap-2">
              {quotes.map((quote) => {
                const isPositive = quote.regularMarketChangePercent >= 0;
                return (
                  <div key={quote.symbol} className="flex items-center justify-between p-3 rounded-lg bg-card border shadow-sm transition-all hover:border-primary/50">
                    <div className="flex flex-col">
                      <span className="font-bold text-sm">{quote.symbol}</span>
                      <span className="text-xs text-muted-foreground truncate max-w-[120px]">{quote.shortName}</span>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-end">
                        <span className="font-mono font-medium">
                          {quote.regularMarketPrice ? quote.regularMarketPrice.toLocaleString(undefined, { maximumFractionDigits: 2 }) : 'N/A'}
                        </span>
                        <div className={`flex items-center text-xs font-medium ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                          {quote.regularMarketChangePercent ? `${quote.regularMarketChangePercent.toFixed(2)}%` : '0.00%'}
                        </div>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                        onClick={() => removeSymbol(quote.symbol)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
              {loading && quotes.length === 0 && (
                 <div className="flex justify-center p-4">
                   <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                 </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
