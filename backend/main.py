from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import yfinance as yf
import pandas as pd
import json
from deep_translator import GoogleTranslator
from analysis import (
    calculate_advanced_indicators, 
    calculate_seasonality, 
    calculate_distribution, 
    calculate_drawdowns, 
    calculate_ratios,
    calculate_statistics
)

app = FastAPI(
    title="Financial Analyzer API",
    description="Backend for Financial Analysis Dashboard",
    version="2.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Financial Analyzer API v2 is running"}

@app.get("/api/search")
def search_ticker(q: str = Query(..., min_length=1)):
    """
    Search for tickers using Yahoo Finance.
    """
    try:
        import requests
        url = f"https://query2.finance.yahoo.com/v1/finance/search?q={q}"
        headers = {'User-Agent': 'Mozilla/5.0'}
        response = requests.get(url, headers=headers, timeout=5)
        data = response.json()
        
        results = []
        if 'quotes' in data:
            for quote in data['quotes']:
                results.append({
                    "symbol": quote.get('symbol'),
                    "shortname": quote.get('shortname', quote.get('longname')),
                    "type": quote.get('quoteType'),
                    "exchange": quote.get('exchange')
                })
        return results
    except Exception as e:
        print(f"Search error: {e}")
        return []

@app.get("/api/ticker/{symbol}")
def get_ticker_data(symbol: str, period: str = "max", interval: str = "1d"):
    try:
        # Fetch Data
        ticker = yf.Ticker(symbol)
        history = ticker.history(period=period, interval=interval)
        
        if history.empty:
            raise HTTPException(status_code=404, detail="No data found for symbol")
            
        # Basic Info & Translation
        info = ticker.info
        summary_en = info.get('longBusinessSummary') or info.get('description') or "No summary available."
        
        # try:
        #     summary_es = GoogleTranslator(source='auto', target='es').translate(summary_en)
        # except Exception as e:
        #     print(f"Translation failed: {e}")
        #     summary_es = summary_en # Fallback
        summary_es = summary_en # Direct fallback to avoid hanging

        info['longBusinessSummary_es'] = summary_es
        
        # 1. Advanced Indicators (TA)
        # We use the full history for calculation accuracy, but might chop it for the chart if too big?
        # For now, let's keep it simple. If period is 'max', calculations are robust.
        # We'll calculate indicators on the full dataset.
        df_indicators, technical_indicators = calculate_advanced_indicators(history)
        
        # 2. Seasonality
        seasonality = calculate_seasonality(history)
        
        # 3. Distribution & Drawdowns
        distribution = calculate_distribution(history)
        drawdowns = calculate_drawdowns(history)
        
        # 4. Ratios (Fundamentals)
        ratios = calculate_ratios(info)
        
        # 5. Basic Stats (for top cards)
        # Recalculate basic stats on specific periods if user changes it in frontend? 
        # For now, let's calc stats on the last 1 year for the "Overview" cards or pass the full history stats.
        # Let's trust the 'period' param handled by frontend for the MAIN chart, 
        # but for advanced stats we might want to ensure we have enough data.
        # The endpoint defaults to 'max' to serve all tabs.
        stats_card = calculate_statistics(history.tail(252)) # Last year for the "Current" stats card
        
        # Prepare Chart Data (optimize size if needed, but sending full 'max' might be heavy)
        # If period is 'max', finding the start date.
        # Recommendation: The frontend should request specific periods for the CHART.
        # But this endpoint is doing EVERYTHING.
        # Optimization: Return only last 5 years for chart if max is huge, or let frontend slice.
        # We will return the DataFrame as JSON.
        
        df_indicators.reset_index(inplace=True)
        df_indicators['Date'] = df_indicators['Date'].dt.strftime('%Y-%m-%d')
        chart_data = json.loads(df_indicators.to_json(orient="records"))
        
        return {
            "symbol": symbol,
            "info": info,
            "stats": stats_card,
            "chart_data": chart_data,
            "analysis": {
                "technical": technical_indicators,
                "seasonality": seasonality,
                "distribution": distribution,
                "drawdowns": drawdowns,
                "ratios": ratios
            }
        }
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Error fetching data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
