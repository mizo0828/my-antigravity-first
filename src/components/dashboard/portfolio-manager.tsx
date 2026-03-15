"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, Trash2, TrendingDown, TrendingUp, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Holding } from "@/types";
import { Label } from "@/components/ui/label";

interface StockQuote {
  symbol: string;
  regularMarketPrice: number;
  regularMarketChangePercent: number;
  shortName: string;
}

interface PortfolioManagerProps {
  holdings: Holding[];
  setHoldings: (holdings: Holding[]) => void;
}

export function PortfolioManager({ holdings, setHoldings }: PortfolioManagerProps) {
  const [inputSymbol, setInputSymbol] = useState("");
  const [quotes, setQuotes] = useState<StockQuote[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorVisible, setErrorVisible] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  const symbols = useMemo(() => holdings.map((h: Holding) => h.symbol), [holdings]);

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
  }, [symbols.join(",")]); // 文字列として依存関係を持たせることで配列の参照変更による再実行を防ぐ

  const addSymbol = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorVisible(false);
    const trimmedSymbol = inputSymbol.trim().toUpperCase();
    if (!trimmedSymbol) return;
    
    // 重複チェック
    if (symbols.includes(trimmedSymbol)) {
      setInputSymbol("");
      return;
    }

    setIsValidating(true);
    try {
      // 銘柄の妥当性を確認するためにAPIを叩く
      const res = await fetch(`/api/market-data?symbols=${trimmedSymbol}&period=1mo`);
      const result = await res.json();
      
      const symbolData = result.data?.[0];
      
      // エラーが含まれている、または有効な価格データがない場合は無効とみなす
      if (!symbolData || symbolData.error || !symbolData.quote?.regularMarketPrice) {
        setErrorVisible(true);
      } else {
        setHoldings([...holdings, { symbol: trimmedSymbol, quantity: 1, purchasePrice: symbolData.quote.regularMarketPrice }]);
        setInputSymbol("");
      }
    } catch (err) {
      console.error("Validation failed:", err);
      setErrorVisible(true);
    } finally {
      setIsValidating(false);
    }
  };

  const removeSymbol = (symbolToRemove: string) => {
    setHoldings(holdings.filter((h) => h.symbol !== symbolToRemove));
    setQuotes(quotes.filter((q) => q.symbol !== symbolToRemove));
  };

  const updateHolding = (symbol: string, field: keyof Holding, value: number) => {
    setHoldings(holdings.map(h => h.symbol === symbol ? { ...h, [field]: value } : h));
  };

  return (
    <Card className="shadow-lg border-muted/50 w-full h-full flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold">保有銘柄リスト</CardTitle>
          <Button variant="ghost" size="icon" onClick={fetchQuotes} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-muted-foreground" : "text-muted-foreground hover:text-foreground"}`} />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col gap-6">
        {/* 追加フォーム */}
        <div className="flex flex-col gap-2">
          <form onSubmit={addSymbol} className="flex gap-2">
            <Input
              placeholder="銘柄コード (例: 7203.T, AAPL)"
              value={inputSymbol}
              onChange={(e) => {
                setInputSymbol(e.target.value);
                if (errorVisible) setErrorVisible(false);
              }}
              className={`flex-1 ${errorVisible ? "border-destructive focus-visible:ring-destructive" : ""}`}
              disabled={isValidating}
            />
            <Button type="submit" variant="secondary" disabled={isValidating}>
              {isValidating ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <><Plus className="mr-2 h-4 w-4" /> 追加</>
              )}
            </Button>
          </form>
          {errorVisible && (
            <p className="text-xs text-destructive font-medium ml-1 animate-in fade-in slide-in-from-top-1">
              銘柄コードが間違っています
            </p>
          )}
        </div>

        {/* 銘柄リスト */}
        <div className="flex-1 overflow-auto rounded-md border bg-muted/10 p-2">
          {holdings.length === 0 && !loading ? (
            <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
              銘柄が追加されていません
            </div>
          ) : (
             <div className="flex flex-col gap-2">
              {holdings.map((holding) => {
                const quote = quotes.find(q => q.symbol === holding.symbol);
                const isPositive = quote ? quote.regularMarketChangePercent >= 0 : true;
                return (
                  <div key={holding.symbol} className="flex flex-col gap-3 p-4 rounded-lg bg-card border shadow-sm transition-all hover:border-primary/50 relative group">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="font-bold text-sm tracking-wider">{holding.symbol}</span>
                        <span className="text-xs text-muted-foreground truncate max-w-[150px]">{quote?.shortName || (loading ? '読み込み中...' : '---')}</span>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col items-end">
                          <span className="font-mono font-medium text-sm">
                            {quote?.regularMarketPrice ? quote.regularMarketPrice.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '---'}
                          </span>
                          {quote && (
                            <div className={`flex items-center text-[10px] font-medium ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                              {isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                              {quote.regularMarketChangePercent ? `${quote.regularMarketChangePercent.toFixed(2)}%` : '0.00%'}
                            </div>
                          )}
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                          onClick={() => removeSymbol(holding.symbol)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-muted/30">
                      <div className="flex flex-col gap-1">
                        <Label htmlFor={`qty-${holding.symbol}`} className="text-[10px] text-muted-foreground">保有株数</Label>
                        <Input
                          id={`qty-${holding.symbol}`}
                          type="number"
                          min="0"
                          step="any"
                          value={holding.quantity}
                          onChange={(e) => updateHolding(holding.symbol, 'quantity', parseFloat(e.target.value) || 0)}
                          className="h-7 text-xs bg-muted/20 border-none"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label htmlFor={`price-${holding.symbol}`} className="text-[10px] text-muted-foreground">購入単価</Label>
                        <Input
                          id={`price-${holding.symbol}`}
                          type="number"
                          min="0"
                          step="any"
                          value={holding.purchasePrice}
                          onChange={(e) => updateHolding(holding.symbol, 'purchasePrice', parseFloat(e.target.value) || 0)}
                          className="h-7 text-xs bg-muted/20 border-none"
                        />
                      </div>
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
