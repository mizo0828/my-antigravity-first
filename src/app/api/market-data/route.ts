import { NextResponse } from 'next/server';
import yf from 'yahoo-finance2';
// @ts-ignore
const YF = yf.default || yf;
const yahooFinance = typeof YF === 'function' ? new YF() : YF;

const SYMBOL_NAME_MAP: Record<string, string> = {
  '^N225': '日経平均',
  '^GSPC': 'S&P 500',
  '^DJI': 'NYダウ',
  '^IXIC': 'NASDAQ',
  'USDJPY=X': '米ドル/円',
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbolsParam = searchParams.get('symbols');
  const period = searchParams.get('period') || '1mo'; // 1mo, 3mo, 6mo, 1y, 5y

  if (!symbolsParam) {
    return NextResponse.json(
      { error: 'Symbols parameter is required (comma-separated)' },
      { status: 400 }
    );
  }

  const symbols = symbolsParam.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 20);

  if (symbols.length === 0) {
    return NextResponse.json(
      { error: 'Valid symbols are required' },
      { status: 400 }
    );
  }

  // yahoo-finance2の期間設定マッピング
  let period1 = new Date();
  switch (period) {
    case '1mo':
      period1.setMonth(period1.getMonth() - 1);
      break;
    case '3mo':
      period1.setMonth(period1.getMonth() - 3);
      break;
    case '6mo':
      period1.setMonth(period1.getMonth() - 6);
      break;
    case '1y':
      period1.setFullYear(period1.getFullYear() - 1);
      break;
    case '5y':
      period1.setFullYear(period1.getFullYear() - 5);
      break;
    default:
      period1.setMonth(period1.getMonth() - 1);
  }

  const queryOptions = {
    period1: period1,
    period2: new Date(),
    interval: '1d' as const,
  };

  try {
    const results = await Promise.all(
      symbols.map(async (symbol) => {
        try {
          // 過去の履歴データを取得 (チャート用)
          const chartData = await yahooFinance.chart(symbol, queryOptions);
          const historical = chartData.quotes;
          // 最新のクォート情報を取得 (現在価格など)
          const quote = await yahooFinance.quote(symbol);

          return {
            symbol,
            quote: {
              regularMarketPrice: (quote as any).regularMarketPrice,
              regularMarketChangePercent: (quote as any).regularMarketChangePercent,
              shortName: SYMBOL_NAME_MAP[symbol] || (quote as any).shortName || symbol,
            },
            historical: Array.isArray(historical) ? (historical as any[]).map((item: any) => ({
              date: item.date instanceof Date ? item.date.toISOString().split('T')[0] : item.date,
              close: item.close,
            })).filter(item => item.date && item.close !== null) : [],
          };
        } catch (err) {
          console.error(`Error fetching data for ${symbol}:`, err);
          if (err instanceof Error) {
            console.error(err.message, err.stack);
          }
          return {
            symbol,
            error: err instanceof Error ? err.message : 'Failed to fetch data',
          };
        }
      })
    );

    return NextResponse.json({ data: results });
  } catch (error) {
    console.error('Market data fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch market data' },
      { status: 500 }
    );
  }
}
