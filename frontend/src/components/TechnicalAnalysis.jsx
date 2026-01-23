import React, { useState } from 'react';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

const IndicatorTooltip = ({ title, description, interpretation, calculation, placement = 'bottom' }) => {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div className={`relative inline-block ml-2 ${isVisible ? 'z-50' : 'z-10'}`}>
            {/* Help Icon */}
            <button
                onMouseEnter={() => setIsVisible(true)}
                onMouseLeave={() => setIsVisible(false)}
                className="text-gray-400 hover:text-blue-400 transition-colors cursor-help"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                </svg>
            </button>

            {/* Tooltip Content */}
            {isVisible && (
                <div className={`absolute left-0 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-4 ${placement === 'top' ? 'bottom-full mb-2' : 'top-6'}`}>
                    <h4 className="text-white font-semibold mb-2">{title}</h4>

                    <p className="text-sm text-gray-300 mb-3">
                        {description}
                    </p>

                    {interpretation && (
                        <div className="mb-3">
                            <p className="text-xs font-semibold text-blue-400 mb-1">Interpretación:</p>
                            <ul className="text-xs text-gray-300 space-y-1">
                                {interpretation.map((item, idx) => (
                                    <li key={idx}>• {item}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {calculation && (
                        <div>
                            <p className="text-xs font-semibold text-blue-400 mb-1">Cálculo:</p>
                            <p className="text-xs text-gray-300 font-mono bg-gray-900 p-2 rounded whitespace-pre-wrap">
                                {calculation}
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const indicatorExplanations = {
    rsi: {
        title: "RSI (Relative Strength Index)",
        description: "Mide la velocidad y magnitud de los cambios de precio. Oscila entre 0 y 100. Identifica condiciones de sobrecompra y sobreventa.",
        interpretation: [
            "> 70: Sobrecompra (posible corrección bajista)",
            "30-70: Zona neutral",
            "< 30: Sobreventa (posible rebote alcista)"
        ],
        calculation: "RSI = 100 - (100 / (1 + RS))\nRS = Promedio de ganancias / Promedio de pérdidas"
    },
    macd: {
        title: "MACD (Moving Average Convergence Divergence)",
        description: "Indicador de momentum que muestra la relación entre dos medias móviles. Ayuda a identificar cambios en la tendencia.",
        interpretation: [
            "MACD > Signal: Señal alcista (momentum positivo)",
            "MACD < Signal: Señal bajista (momentum negativo)",
            "Cruce alcista: MACD cruza por encima de Signal",
            "Cruce bajista: MACD cruza por debajo de Signal"
        ],
        calculation: "MACD = EMA(12) - EMA(26)\nSignal = EMA(9) del MACD\nHistograma = MACD - Signal"
    },
    stochastic: {
        title: "Stochastic Oscillator",
        description: "Compara el precio de cierre con el rango de precios durante un período. Identifica condiciones de sobrecompra/sobreventa.",
        interpretation: [
            "> 80: Sobrecompra (posible corrección)",
            "20-80: Zona neutral",
            "< 20: Sobreventa (posible rebote)",
            "%K cruza %D alcista: Señal de compra",
            "%K cruza %D bajista: Señal de venta"
        ],
        calculation: "%K = ((Cierre - Mínimo) / (Máximo - Mínimo)) × 100\n%D = Media móvil de 3 períodos de %K"
    },
    bollingerBands: {
        title: "Bollinger Bands",
        description: "Bandas de volatilidad que se expanden y contraen basadas en la volatilidad del mercado. El precio tiende a rebotar entre las bandas.",
        interpretation: [
            "Precio cerca de banda superior: Posible sobrecompra",
            "Precio cerca de banda inferior: Posible sobreventa",
            "Bandas estrechas: Baja volatilidad (posible ruptura)",
            "Bandas anchas: Alta volatilidad"
        ],
        calculation: "Banda Media = SMA(20)\nBanda Superior = SMA(20) + (2 × Desv. Estándar)\nBanda Inferior = SMA(20) - (2 × Desv. Estándar)"
    },
    adx: {
        title: "ADX (Average Directional Index)",
        description: "Mide la fuerza de la tendencia sin indicar su dirección. Valores más altos indican tendencias más fuertes.",
        interpretation: [
            "0-25: Tendencia débil o rango lateral",
            "25-50: Tendencia moderada",
            "50-75: Tendencia fuerte",
            "> 75: Tendencia muy fuerte"
        ],
        calculation: "ADX = Media móvil de 14 períodos del DX\nDX = ((+DI - -DI) / (+DI + -DI)) × 100"
    },
    atr: {
        title: "ATR (Average True Range)",
        description: "Mide la volatilidad del mercado calculando el rango promedio entre máximos y mínimos. No indica dirección.",
        interpretation: [
            "ATR alto: Alta volatilidad (mayor riesgo/oportunidad)",
            "ATR bajo: Baja volatilidad (mercado tranquilo)",
            "ATR creciente: Volatilidad aumentando",
            "ATR decreciente: Volatilidad disminuyendo"
        ],
        calculation: "TR = max[(Alto - Bajo), |Alto - Cierre anterior|, |Bajo - Cierre anterior|]\nATR = Media móvil de 14 períodos del TR"
    },
    cci: {
        title: "CCI (Commodity Channel Index)",
        description: "Identifica niveles de sobrecompra/sobreventa y divergencias. Útil para detectar reversiones de tendencia.",
        interpretation: [
            "> +100: Sobrecompra (posible corrección)",
            "-100 a +100: Rango normal",
            "< -100: Sobreventa (posible rebote)",
            "Divergencias: Señales de cambio de tendencia"
        ],
        calculation: "CCI = (Precio Típico - SMA) / (0.015 × Desviación Media)\nPrecio Típico = (Alto + Bajo + Cierre) / 3"
    },
    williamsR: {
        title: "Williams %R",
        description: "Oscilador de momentum que mide niveles de sobrecompra/sobreventa. Similar al Stochastic pero con escala invertida.",
        interpretation: [
            "-20 a 0: Sobrecompra (posible corrección bajista)",
            "-50 a -20: Zona neutral-alcista",
            "-80 a -50: Zona neutral-bajista",
            "-100 a -80: Sobreventa (posible rebote alcista)"
        ],
        calculation: "%R = ((Máximo - Cierre) / (Máximo - Mínimo)) × -100\nPeríodo típico: 14 días"
    },
    obv: {
        title: "OBV (On Balance Volume)",
        description: "Relaciona el volumen con los cambios de precio. Un OBV creciente confirma tendencias alcistas; decreciente confirma bajistas.",
        interpretation: [
            "OBV subiendo + Precio subiendo: Tendencia alcista fuerte",
            "OBV bajando + Precio bajando: Tendencia bajista fuerte",
            "Divergencia alcista: OBV sube pero precio baja (posible rebote)",
            "Divergencia bajista: OBV baja pero precio sube (posible caída)"
        ],
        calculation: "Si Cierre > Cierre anterior: OBV = OBV anterior + Volumen\nSi Cierre < Cierre anterior: OBV = OBV anterior - Volumen\nSi Cierre = Cierre anterior: OBV = OBV anterior"
    }
};

const TechnicalAnalysis = ({ data, period, chartData }) => {
    // Robust check for essential data
    if (!data) return <div className="text-center p-8 text-muted-foreground">No technical data available.</div>;

    const getSignal = (value, type) => {
        // Guard clause for missing values to prevent errors
        if (value === undefined || value === null) {
            return { color: 'text-gray-400', icon: <Minus />, text: 'N/A' };
        }

        // Helper to determine signal color and text
        // Returns { color: 'text-green-500', icon: ..., text: '...' }
        // Logic can be complex, simplified here for display

        // Example logic
        if (type === 'RSI') {
            if (value > 70) return { color: 'text-red-500', icon: <ArrowDown />, text: 'Overbought' };
            if (value < 30) return { color: 'text-green-500', icon: <ArrowUp />, text: 'Oversold' };
            return { color: 'text-gray-400', icon: <Minus />, text: 'Neutral' };
        }
        if (type === 'MACD') {
            // Check for MACD sub-properties
            if (typeof value === 'object' && value.macd > value.signal) return { color: 'text-green-500', icon: <ArrowUp />, text: 'Bullish' };
            return { color: 'text-red-500', icon: <ArrowDown />, text: 'Bearish' };
        }
        if (type === 'Stoch') {
            // Check for Stoch sub-properties
            if (typeof value === 'object' && value.k > 80) return { color: 'text-red-500', icon: <ArrowDown />, text: 'Overbought' };
            if (typeof value === 'object' && value.k < 20) return { color: 'text-green-500', icon: <ArrowUp />, text: 'Oversold' };
            return { color: 'text-gray-400', icon: <Minus />, text: 'Neutral' };
        }
        // Default
        return { color: 'text-gray-400', icon: <Minus />, text: 'Neutral' };
    };

    const IndicatorCard = ({ title, value, signal, notes, progress, tooltipData, placement }) => (
        <div className="bg-card border border-border rounded-lg p-5 flex flex-col justify-between">
            <div>
                <div className="flex items-center mb-2">
                    <h4 className="text-sm font-medium text-muted-foreground">{title}</h4>
                    {tooltipData && <IndicatorTooltip {...tooltipData} placement={placement} />}
                </div>
                <div className="flex items-center justify-between mb-2">
                    {/* Safe rendering for value */}
                    <span className="text-2xl font-bold">{value || 'N/A'}</span>
                    {/* Check if signal exists before accessing properties */}
                    <div className={`flex items-center gap-1 text-sm font-semibold ${signal?.color || 'text-gray-400'}`}>
                        {signal?.icon}
                        {signal?.text}
                    </div>
                </div>
                {progress !== undefined && progress !== null && (
                    <div className="w-full bg-secondary rounded-full h-2 mb-2">
                        <div
                            className={`h-2 rounded-full ${signal?.color?.replace('text', 'bg') || 'bg-gray-400'}`}
                            style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
                        ></div>
                    </div>
                )}
            </div>
            <p className="text-xs text-muted-foreground mt-2 border-t border-border pt-2">{notes}</p>
        </div>
    );

    // Safely get signals using optional chaining for data properties
    const rsiSignal = getSignal(data?.RSI, 'RSI');
    const macdSignal = getSignal(data?.MACD, 'MACD');
    const stochSignal = getSignal(data?.Stoch, 'Stoch');
    // ... others

    // Date formatting for header with error handling
    const formatDate = (date) => {
        if (!date) return '-';
        try {
            return new Date(date).toLocaleDateString('es-ES', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
        } catch (e) {
            console.error("Date formatting error:", e);
            return '-';
        }
    };

    let dateRangeText = "";
    // Robust check for chartData existence and content
    if (chartData && Array.isArray(chartData) && chartData.length > 0) {
        const startDate = chartData[0]?.Date;
        const endDate = chartData[chartData.length - 1]?.Date;
        if (startDate && endDate) {
            dateRangeText = `Indicadores calculados con datos desde ${formatDate(startDate)} hasta ${formatDate(endDate)}`;
        }
    }

    return (
        <div className="space-y-6">
            {/* Period Header */}
            <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-foreground">
                            Análisis Técnico - Período: {period ? period.toUpperCase() : 'MAX'}
                        </h3>
                        {dateRangeText && (
                            <p className="text-sm text-muted-foreground mt-1">
                                {dateRangeText}
                            </p>
                        )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                        Última actualización: {formatDate(new Date())}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <IndicatorCard
                    title="RSI (14)"
                    value={data.RSI?.toFixed(2)}
                    signal={rsiSignal}
                    progress={data.RSI}
                    notes="Relative Strength Index. >70 Overbought, <30 Oversold."
                    tooltipData={indicatorExplanations.rsi}
                />
                <IndicatorCard
                    title="MACD (12, 26, 9)"
                    value={data.MACD?.macd?.toFixed(3)}
                    signal={macdSignal}
                    notes={`Signal: ${data.MACD?.signal?.toFixed(3)} | Hist: ${data.MACD?.hist?.toFixed(3)}`}
                    tooltipData={indicatorExplanations.macd}
                />
                <IndicatorCard
                    title="Stochastic Oscillator"
                    value={`${data.Stoch?.k?.toFixed(1)}%`}
                    signal={stochSignal}
                    progress={data.Stoch?.k}
                    notes={`%K: ${data.Stoch?.k?.toFixed(1)} | %D: ${data.Stoch?.d?.toFixed(1)}`}
                    tooltipData={indicatorExplanations.stochastic}
                />
                <IndicatorCard
                    title="Bollinger Bands"
                    value={`$${data.BB?.price?.toFixed(2)}`}
                    signal={{ color: 'text-blue-400', icon: <Minus />, text: 'Volatility' }}
                    notes={`Upper: ${data.BB?.high?.toFixed(2)} | Lower: ${data.BB?.low?.toFixed(2)}`}
                    tooltipData={indicatorExplanations.bollingerBands}
                    placement="top"
                />
                <IndicatorCard
                    title="ADX (Trend Strength)"
                    value={data.ADX?.toFixed(2)}
                    signal={{ color: data.ADX > 25 ? 'text-green-500' : 'text-gray-400', icon: <ArrowUp />, text: data.ADX > 25 ? 'Strong Trend' : 'Weak Trend' }}
                    notes=">25 indicates strong trend"
                    tooltipData={indicatorExplanations.adx}
                    placement="top"
                />
                <IndicatorCard
                    title="ATR (Volatility)"
                    value={data.ATR?.toFixed(2)}
                    signal={{ color: 'text-yellow-500', icon: <Minus />, text: 'Check Drawdown' }}
                    notes="Average True Range (Volatility measure)"
                    tooltipData={indicatorExplanations.atr}
                    placement="top"
                />
                <IndicatorCard
                    title="CCI"
                    value={data.CCI?.toFixed(2)}
                    signal={data.CCI > 100 ? { color: 'text-red-500', text: 'Overbought', icon: <ArrowDown /> } : data.CCI < -100 ? { color: 'text-green-500', text: 'Oversold', icon: <ArrowUp /> } : { color: 'text-gray-500', text: 'Neutral', icon: <Minus /> }}
                    notes="Commodity Channel Index"
                    tooltipData={indicatorExplanations.cci}
                    placement="top"
                />

                <IndicatorCard
                    title="Williams %R"
                    value={data.Williams?.toFixed(2)}
                    signal={data.Williams > -20 ? { color: 'text-red-500', text: 'Overbought', icon: <ArrowDown /> } : data.Williams < -80 ? { color: 'text-green-500', text: 'Oversold', icon: <ArrowUp /> } : { color: 'text-gray-500', text: 'Neutral', icon: <Minus /> }}
                    notes="Momentum indicator"
                    tooltipData={indicatorExplanations.williamsR}
                    placement="top"
                />
                <IndicatorCard
                    title="OBV"
                    value={(data.OBV / 1000000)?.toFixed(1) + 'M'}
                    signal={{ color: 'text-blue-400', text: 'Volume', icon: <Minus /> }}
                    notes="On Balance Volume"
                    tooltipData={indicatorExplanations.obv}
                    placement="top"
                />
            </div>
        </div>
    );
};

export default TechnicalAnalysis;
