import pandas as pd
import numpy as np
from scipy import stats
import ta
import json

def calculate_advanced_indicators(data):
    """
    Calculates a comprehensive set of technical indicators using the 'ta' library.
    """
    if data.empty:
        return {}

    # Copy data to avoid modifying original
    df = data.copy()

    # RSI (Relative Strength Index)
    df['RSI'] = ta.momentum.RSIIndicator(close=df['Close'], window=14).rsi()

    # MACD (Moving Average Convergence Divergence)
    macd = ta.trend.MACD(close=df['Close'])
    df['MACD'] = macd.macd()
    df['MACD_Signal'] = macd.macd_signal()
    df['MACD_Hist'] = macd.macd_diff()

    # Stochastic Oscillator
    stoch = ta.momentum.StochasticOscillator(high=df['High'], low=df['Low'], close=df['Close'])
    df['Stoch_K'] = stoch.stoch()
    df['Stoch_D'] = stoch.stoch_signal()

    # Bollinger Bands
    bb = ta.volatility.BollingerBands(close=df['Close'], window=20, window_dev=2)
    df['BB_High'] = bb.bollinger_hband()
    df['BB_Low'] = bb.bollinger_lband()
    df['BB_Mid'] = bb.bollinger_mavg()
    
    # ADX (Average Directional Index)
    adx = ta.trend.ADXIndicator(high=df['High'], low=df['Low'], close=df['Close'])
    df['ADX'] = adx.adx()

    # ATR (Average True Range)
    df['ATR'] = ta.volatility.AverageTrueRange(high=df['High'], low=df['Low'], close=df['Close']).average_true_range()

    # CCI (Commodity Channel Index)
    df['CCI'] = ta.trend.CCIIndicator(high=df['High'], low=df['Low'], close=df['Close']).cci()

    # Williams %R
    df['Williams'] = ta.momentum.WilliamsRIndicator(high=df['High'], low=df['Low'], close=df['Close']).williams_r()

    # OBV (On Balance Volume)
    df['OBV'] = ta.volume.OnBalanceVolumeIndicator(close=df['Close'], volume=df['Volume']).on_balance_volume()

    # SMA/EMA for basic chart
    df['SMA_20'] = ta.trend.SMAIndicator(close=df['Close'], window=20).sma_indicator()
    df['EMA_20'] = ta.trend.EMAIndicator(close=df['Close'], window=20).ema_indicator()
    
    # Return the latest values for the dashboard cards, but keep the series for charts
    # We will attach the series to the chart_data in main.py, here we structure the "current state"
    
    latest = df.iloc[-1]
    
    indicators = {
        "RSI": latest['RSI'],
        "MACD": {"macd": latest['MACD'], "signal": latest['MACD_Signal'], "hist": latest['MACD_Hist']},
        "Stoch": {"k": latest['Stoch_K'], "d": latest['Stoch_D']},
        "BB": {"high": latest['BB_High'], "low": latest['BB_Low'], "mid": latest['BB_Mid'], "price": latest['Close']},
        "ADX": latest['ADX'],
        "ATR": latest['ATR'],
        "CCI": latest['CCI'],
        "Williams": latest['Williams'],
        "OBV": latest['OBV']
    }
    
    return df, indicators

def calculate_seasonality(data):
    """
    Calculates monthly and day-of-week average returns.
    """
    df = data.copy()
    df['Returns'] = df['Close'].pct_change()
    df['Month'] = df.index.month
    df['DayOfWeek'] = df.index.dayofweek # 0=Mon, 6=Sun
    df['Year'] = df.index.year

    # Monthly Returns Heatmap Data
    # Pivot table: Year vs Month
    monthly_returns = df.groupby(['Year', 'Month'])['Returns'].apply(lambda x: (x + 1).prod() - 1).reset_index()
    monthly_heatmap = monthly_returns.pivot(index='Year', columns='Month', values='Returns')
    
    # Average returns
    avg_monthly = df.groupby('Month')['Returns'].mean() * 21 # Approx trading days per month for magnitude
    avg_daily = df.groupby('DayOfWeek')['Returns'].mean() * 100 # In percent

    return {
        "monthly_heatmap": json.loads(monthly_heatmap.fillna(0).to_json(orient="split")),
        "avg_monthly": avg_monthly.to_dict(),
        "avg_daily": avg_daily.to_dict()
    }

def calculate_distribution(data):
    """
    Calculates return distribution metrics.
    """
    returns = data['Close'].pct_change().dropna()
    
    return {
        "histogram": np.histogram(returns, bins=50)[0].tolist(),
        "bins": np.histogram(returns, bins=50)[1].tolist(),
        "mean": returns.mean(),
        "median": returns.median(),
        "skew": stats.skew(returns),
        "kurtosis": stats.kurtosis(returns)
    }

def calculate_drawdowns(data):
    """
    Calculates top 5 worst drawdowns.
    """
    cumulative = (1 + data['Close'].pct_change()).cumprod()
    peak = cumulative.expanding(min_periods=1).max()
    drawdown = (cumulative / peak) - 1
    
    # Identify drawdowns... this is a bit complex to get exact start/end dates for top 5 efficiently
    # Simplified approach: just return the max drawdown series for the chart
    
    return {
        "max_drawdown": drawdown.min(),
        "current_drawdown": drawdown.iloc[-1],
        "drawdown_series": json.loads(drawdown.to_json(orient="values"))
    }

def calculate_ratios(info):
    """
    Extracts and organizes fundamental ratios from yfinance info dict.
    """
    # Helper to safely get value or "N/A"
    def g(key):
        return info.get(key, "N/A")
    
    return {
        "Valuation": {
            "Trailing P/E": g("trailingPE"),
            "Forward P/E": g("forwardPE"),
            "PEG Ratio": g("pegRatio"),
            "Price/Book": g("priceToBook"),
            "Price/Sales": g("priceToSalesTrailing12Months"),
            "Enterprise Value/EBITDA": g("enterpriseToEbitda"),
        },
        "Profitability": {
            "Profit Margin": g("profitMargins"),
            "Operating Margin": g("operatingMargins"),
            "Return on Assets": g("returnOnAssets"),
            "Return on Equity": g("returnOnEquity"),
            "EBITDA Margins": g("ebitdaMargins"),
        },
        "Liquidity & Debt": {
            "Current Ratio": g("currentRatio"),
            "Quick Ratio": g("quickRatio"),
            "Debt/Equity": g("debtToEquity"),
            "Total Cash": g("totalCash"),
            "Total Debt": g("totalDebt"),
        },
        "Growth": {
            "Revenue Growth": g("revenueGrowth"),
            "Earnings Growth": g("earningsGrowth"),
        },
        "Dividends": {
            "Dividend Rate": g("dividendRate"),
            "Dividend Yield": g("dividendYield"),
            "Payout Ratio": g("payoutRatio"),
        },
        "General": {
            "Market Cap": g("marketCap"),
            "Beta": g("beta"),
            "Employees": g("fullTimeEmployees"),
            "Sector": g("sector"),
            "Industry": g("industry"),
        }
    }

def calculate_statistics(history):
    # Re-using the logic, but ensuring it returns the simple stats card data
    log_returns = np.log(history['Close'] / history['Close'].shift(1)).dropna()
    if len(log_returns) == 0: return {}
    
    volatility = log_returns.std() * np.sqrt(252)
    total_return = (history['Close'].iloc[-1] / history['Close'].iloc[0]) - 1
    risk_free_rate = 0.04
    excess_returns = log_returns.mean() * 252 - risk_free_rate
    sharpe_ratio = excess_returns / volatility if volatility != 0 else 0
    
    cumulative = (1 + log_returns).cumprod()
    peak = cumulative.expanding(min_periods=1).max()
    drawdown = (cumulative / peak) - 1
    max_drawdown = drawdown.min()
    
    return {
        "current_price": history['Close'].iloc[-1],
        "total_return_pct": total_return * 100,
        "annualized_volatility_pct": volatility * 100,
        "sharpe_ratio": sharpe_ratio,
        "max_drawdown_pct": max_drawdown * 100
    }
