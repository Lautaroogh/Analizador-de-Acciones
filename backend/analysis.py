import pandas as pd
import numpy as np
from scipy import stats
import ta
import json
import yfinance as yf
from datetime import datetime
from dateutil.relativedelta import relativedelta

def calculate_advanced_indicators(data):
    """
    Calculates a comprehensive set of technical indicators using the 'ta' library.
    """
    if data.empty:
        return {}

    # Copy data to avoid modifying original
    df = data.copy()

    # Safeguard against insufficient data
    if len(df) < 20:
        # Return basic indicators or empty structure to prevent crash
        latest = df.iloc[-1]
        return df, {
            "RSI": None,
            "MACD": {"macd": None, "signal": None, "hist": None},
            "Stoch": {"k": None, "d": None},
            "BB": {"high": None, "low": None, "mid": None, "price": latest['Close']},
            "ADX": None,
            "ATR": None,
            "CCI": None,
            "Williams": None,
            "OBV": None
        }

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

def calculate_seasonality(data, ticker=None, start_date=None, end_date=None):
    """
    Calculates monthly and day-of-week average returns.
    
    Args:
        data: DataFrame con datos diarios
        ticker: Símbolo del ticker
        start_date: Fecha de inicio en formato 'YYYY-MM-DD' (opcional)
        end_date: Fecha de fin en formato 'YYYY-MM-DD' (opcional)
    """
    df = data.copy()
    df['Returns'] = df['Close'].pct_change()
    df['Month'] = df.index.month
    df['DayOfWeek'] = df.index.dayofweek
    df['Year'] = df.index.year

    # ========================================
    # PARTE 1: MONTHLY HEATMAP Y AVG MONTHLY
    # (Usando datos MENSUALES - igual que mi script)
    # ========================================
    monthly_heatmap = None
    avg_monthly_dict = {}
    
    if ticker:
        search_ticker = ticker
        
        try:
            # ============================================
            # DESCARGA CON RANGO ESPECÍFICO (como mi script personal)
            # ============================================
            if start_date and end_date:
                # Calcular 1 mes antes para tener el mes de referencia
                # (Igual que mi script: adjusted_start = start_dt - relativedelta(months=1))
                start_dt = datetime.strptime(start_date, '%Y-%m-%d')
                adjusted_start = (start_dt - relativedelta(months=1)).strftime('%Y-%m-%d')
                
                print(f"📅 Descargando datos mensuales de {adjusted_start} a {end_date}")
                
                # Descargar con rango específico (EXACTAMENTE como mi script)
                monthly_data = yf.download(
                    search_ticker,
                    start=adjusted_start,
                    end=end_date,
                    interval="1mo",
                    auto_adjust=False,
                    progress=False
                )
                
                # Fallback con Ticker.history si download falla
                if monthly_data.empty:
                    monthly_data = yf.Ticker(search_ticker).history(
                        start=adjusted_start,
                        end=end_date,
                        interval="1mo",
                        auto_adjust=False
                    )
            else:
                # Sin rango específico, usar todo el histórico
                print(f"📅 Descargando TODOS los datos mensuales (period=max)")
                
                monthly_data = yf.Ticker(search_ticker).history(
                    period="max",
                    interval="1mo",
                    auto_adjust=False
                )
                
                if monthly_data.empty:
                    monthly_data = yf.download(
                        search_ticker,
                        period="max",
                        interval="1mo",
                        auto_adjust=False,
                        progress=False
                    )

            if not monthly_data.empty:
                # Normalizar MultiIndex si existe
                if isinstance(monthly_data.columns, pd.MultiIndex):
                    try:
                        if search_ticker in monthly_data.columns.get_level_values(1):
                            monthly_data = monthly_data.xs(search_ticker, level=1, axis=1)
                        else:
                            monthly_data = monthly_data.droplevel(1, axis=1)
                    except:
                        pass

                # CALCULAR RETORNO MENSUAL (EXACTAMENTE como mi script)
                # Mi script: data['Monthly Return (%)'] = data['Close'].pct_change() * 100
                monthly_data['Returns'] = monthly_data['Close'].pct_change()
                monthly_data['Month'] = monthly_data.index.month
                monthly_data['Year'] = monthly_data.index.year
                
                # ============================================
                # ELIMINAR PRIMER MES (tiene NaN del pct_change)
                # Esto es crítico porque el primer mes no tiene mes anterior
                # ============================================
                monthly_data = monthly_data.dropna(subset=['Returns'])
                
                # Si hay start_date, filtrar datos >= start_date
                # (para eliminar el mes "extra" que descargamos)
                if start_date:
                    monthly_data = monthly_data[monthly_data.index >= start_date]
                
                # LOGGING PARA DEBUGGING
                print(f"✓ Datos mensuales procesados: {len(monthly_data)} meses")
                if len(monthly_data) > 0:
                    print(f"  Rango: {monthly_data.index[0].strftime('%Y-%m-%d')} a {monthly_data.index[-1].strftime('%Y-%m-%d')}")
                    first_three = dict(list(monthly_data['Returns'].head(3).items()))
                    print(f"  Primeros 3 retornos: {first_three}")
                
                # HEATMAP: Año vs Mes (EXACTAMENTE como mi script)
                # Mi script: pivot_table = data.pivot_table(values='Monthly Return (%)', index='Year', columns='Month')
                monthly_heatmap = monthly_data.pivot(
                    index='Year',
                    columns='Month',
                    values='Returns'
                )
                
                # AVG MONTHLY: Promedio de retornos mensuales por mes
                # Mi script: monthly_avg_returns = data.groupby('Month')['Monthly Return (%)'].mean()
                avg_monthly_series = monthly_data.groupby('Month')['Returns'].mean()
                avg_monthly_dict = avg_monthly_series.to_dict()
                
        except Exception as e:
            print(f"❌ Error fetching monthly data for seasonality: {e}")
            import traceback
            traceback.print_exc()
    
    # ========================================
    # FALLBACK: Si no se pudieron obtener datos mensuales
    # ========================================
    if monthly_heatmap is None:
        print("⚠️ Warning: Usando fallback con composición de retornos diarios")
        
        # HEATMAP: Componer retornos diarios por mes
        monthly_returns = df.groupby(['Year', 'Month'])['Returns'].apply(
            lambda x: (x + 1).prod() - 1
        ).reset_index()
        monthly_heatmap = monthly_returns.pivot(
            index='Year',
            columns='Month',
            values='Returns'
        )
        
        # AVG MONTHLY: Promedio de retornos mensuales compuestos
        avg_monthly_series = monthly_returns.groupby('Month')['Returns'].mean()
        avg_monthly_dict = avg_monthly_series.to_dict()
    
    # ========================================
    # PARTE 2: AVG DAILY PERFORMANCE
    # (Usando datos DIARIOS - esto está correcto)
    # ========================================
    avg_daily = df.groupby('DayOfWeek')['Returns'].mean() * 100  # En porcentaje
    avg_daily_dict = avg_daily.to_dict()

    # ========================================
    # RETORNAR RESULTADOS
    # ========================================
    return {
        "monthly_heatmap": json.loads(monthly_heatmap.fillna(0).to_json(orient="split")),
        "avg_monthly": avg_monthly_dict,  # Ahora usa retornos mensuales reales
        "avg_daily": avg_daily_dict
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
    Calculates drawdown metrics including avg_drawdown, var_95, and sortino.
    """
    returns = data['Close'].pct_change().dropna()
    cumulative = (1 + returns).cumprod()
    peak = cumulative.expanding(min_periods=1).max()
    drawdown = (cumulative / peak) - 1
    
    # Average Drawdown (promedio de todos los drawdowns negativos)
    avg_drawdown = drawdown[drawdown < 0].mean() if len(drawdown[drawdown < 0]) > 0 else 0
    
    # Value at Risk (95%) - pérdida máxima diaria esperada con 95% confianza
    var_95 = returns.quantile(0.05)
    
    # Sortino Ratio - rendimiento ajustado por riesgo a la baja
    annualized_return = returns.mean() * 252
    downside_returns = returns[returns < 0]
    downside_std = downside_returns.std() * np.sqrt(252)
    sortino = annualized_return / downside_std if downside_std != 0 else 0
    
    return {
        "max_drawdown": drawdown.min(),
        "avg_drawdown": avg_drawdown,
        "var_95": var_95,
        "sortino": sortino,
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
            "Enterprise Value/Revenue": g("enterpriseToRevenue"),
        },
        "Profitability": {
            "Profit Margin": g("profitMargins"),
            "Operating Margin": g("operatingMargins"),
            "Gross Margin": g("grossMargins"),
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
            "Cash Per Share": g("totalCashPerShare"),
        },
        "Cash Flow": {
            "Operating Cash Flow": g("operatingCashflow"),
            "Free Cash Flow": g("freeCashflow"),
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
        "Analyst Targets": {
            "Target Mean Price": g("targetMeanPrice"),
            "Target High Price": g("targetHighPrice"),
            "Target Low Price": g("targetLowPrice"),
            "Recommendation": g("recommendationKey"),
        },
        "Short Info": {
            "Short Ratio": g("shortRatio"),
            "Short % of Float": g("shortPercentOfFloat"),
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
