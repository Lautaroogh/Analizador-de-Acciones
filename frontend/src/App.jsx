import React, { useState, useEffect, useMemo } from 'react';
import SearchBox from './components/SearchBox';
import StockChart from './components/StockChart';
import StatsGrid from './components/StatsGrid';
import Tabs from './components/Tabs';
import TechnicalAnalysis from './components/TechnicalAnalysis';
import Statistics from './components/Statistics';
import Ratios from './components/Ratios';
import StatsRangeSelector from './components/StatsRangeSelector';
import { getTickerData } from './api';
import { LayoutDashboard, TrendingUp, Activity } from 'lucide-react';
import {
    calculateTotalReturn,
    calculateVolatility,
    calculateSharpeRatio,
    calculateMaxDrawdown
} from './utils/finance';
import {
    calculateMonthlyReturnsHeatmap,
    calculateAvgMonthlyPerformance,
    calculateAvgDailyPerformance,
    calculateDistributionOfReturns,
    calculateDrawdownAnalysis
} from './utils/statistics';

function App() {
    const [symbol, setSymbol] = useState('SPY');
    const [historicalData, setHistoricalData] = useState([]); // Raw MAX data
    const [backendData, setBackendData] = useState(null); // Full backend response for access to .info, etc
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // --- STATES ---
    const [activeTab, setActiveTab] = useState('chart');
    const [translatedSummary, setTranslatedSummary] = useState('');

    // 1. Chart Period State
    const [chartPeriod, setChartPeriod] = useState('1y');

    // 2. Stats Date Range State - Ensure safe initialization
    const [statsDateRange, setStatsDateRange] = useState(() => {
        const now = new Date();
        return {
            startMonth: 0,
            startYear: now.getFullYear() - 5,
            endMonth: now.getMonth(),
            endYear: now.getFullYear()
        };
    });

    const [isLoadingStats, setIsLoadingStats] = useState(false);

    // --- COMPUTED STATES ---
    const [topMetrics, setTopMetrics] = useState({});
    const [statistics, setStatistics] = useState(null);
    const [technicalIndicators, setTechnicalIndicators] = useState(null);

    // DEBUG: Global State Check
    useEffect(() => {
        console.log('========================================');
        console.log('DEBUGGING COMPLETO - ESTADO DE LA APP');
        console.log('========================================');
        console.log('1. historicalData:', {
            existe: !!historicalData,
            length: historicalData?.length,
            primer_dato: historicalData?.[0],
            ultimo_dato: historicalData?.[historicalData.length - 1]
        });
        console.log('2. chartPeriod:', chartPeriod);
        console.log('3. statsDateRange:', statsDateRange);
        console.log('4. statistics:', {
            existe: !!statistics,
            keys: statistics ? Object.keys(statistics) : []
        });
        console.log('5. isLoadingStats:', isLoadingStats);
        console.log('========================================');
    }, [historicalData, chartPeriod, statsDateRange, statistics, isLoadingStats]);

    // --- FETCH DATA (ALWAYS MAX) ---
    useEffect(() => {
        fetchData(symbol);
    }, [symbol]);

    const fetchData = async (sym) => {
        setLoading(true);
        setError(null);
        try {
            // Always fetch MAX to allow client-side filtering
            const result = await getTickerData(sym, 'max', '1d');

            // STANDARDIZE KEYS to lowercase immediately
            // valid backend keys: Date, Open, High, Low, Close, Volume
            const rawData = result.chart_data || [];
            const standardizedData = rawData.map(item => ({
                ...item,
                date: item.Date || item.date,
                open: item.Open || item.open,
                high: item.High || item.high,
                low: item.Low || item.low,
                close: item.Close || item.close,
                volume: item.Volume || item.volume
            }));

            setBackendData(result);
            setHistoricalData(standardizedData);

            // Initial translation if available
            if (result?.info?.longBusinessSummary) {
                setTranslatedSummary(result.info.longBusinessSummary_es || result.info.longBusinessSummary);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
            setError("Failed to load data. Please check if the backend is running.");
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (newSymbol) => {
        setSymbol(newSymbol);
    };

    // --- FILTER HELPER ---
    // --- FILTER HELPER (ROBUST) ---
    const filterDataByPeriod = (data, period) => {
        if (!data || data.length === 0) {
            console.error('No hay datos para filtrar');
            return [];
        }

        if (period === 'max' || period === 'MAX') return data;

        const now = new Date();
        const cutoff = new Date();

        // Safe lowercase check
        const p = period.toLowerCase();

        switch (p) {
            case '1mo':
            case '1m':
                cutoff.setMonth(now.getMonth() - 1); break;
            case '3mo':
            case '3m':
                cutoff.setMonth(now.getMonth() - 3); break;
            case '6mo':
            case '6m':
                cutoff.setMonth(now.getMonth() - 6); break;
            case '1y': cutoff.setFullYear(now.getFullYear() - 1); break;
            case '2y': cutoff.setFullYear(now.getFullYear() - 2); break;
            case '5y': cutoff.setFullYear(now.getFullYear() - 5); break;
            case 'ytd': cutoff.setMonth(0); cutoff.setDate(1); break; // Jan 1st current year
            default: return data;
        }

        const filtered = data.filter(item => new Date(item.date) >= cutoff);
        console.log(`Datos filtrados por período (${period}):`, filtered.length, 'de', data.length);
        return filtered;
    };

    // --- EFFECT 1: CHART PERIOD UPDATES (Metrics & Technicals) ---
    useEffect(() => {
        if (!historicalData || historicalData.length === 0) return;

        const chartData = filterDataByPeriod(historicalData, chartPeriod);

        // 1. Calculate Top Metrics
        if (chartData.length > 0) {
            const lastPrice = chartData[chartData.length - 1].close || chartData[chartData.length - 1].Close;
            const metrics = {
                currentPrice: lastPrice,
                totalReturn: calculateTotalReturn(chartData),
                volatility: calculateVolatility(chartData),
                sharpeRatio: calculateSharpeRatio(chartData),
                maxDrawdown: calculateMaxDrawdown(chartData)
            };
            setTopMetrics(metrics);
        }

        // 2. Prepare Technical Analysis Data 
        // (TechnicalAnalysis component currently does its own calc mostly, 
        // but we pass filtered data to it)

    }, [historicalData, chartPeriod]);


    // --- EFFECT 2: STATS RANGE UPDATES (Statistics Tab) ---
    useEffect(() => {
        const loadStatistics = async () => {
            console.log('=== DEBUG CARGA DE ESTADÍSTICA ===');
            console.log('symbol:', symbol);
            console.log('statsDateRange:', statsDateRange);

            if (!symbol) {
                console.error('No hay símbolo seleccionado');
                return;
            }

            try {
                setIsLoadingStats(true);

                // Construir fechas en formato YYYY-MM-DD
                const startDate = new Date(statsDateRange.startYear, statsDateRange.startMonth, 1);
                const endDate = new Date(statsDateRange.endYear, statsDateRange.endMonth + 1, 0); // Último día del mes

                const startDateStr = startDate.toISOString().split('T')[0];
                const endDateStr = endDate.toISOString().split('T')[0];

                console.log(`Llamando al backend con rango: ${startDateStr} a ${endDateStr}`);

                // **LLAMAR AL BACKEND CON RANGO DE FECHAS**
                const result = await getTickerData(symbol, 'max', '1d', startDateStr, endDateStr);

                if (result && result.analysis) {
                    console.log('✓ Estadísticas recibidas del backend');
                    setStatistics(result.analysis);
                } else {
                    console.error('Backend no tiene datos de análisis');
                    setStatistics(null);
                }

                setIsLoadingStats(false);
            } catch (error) {
                console.error('Error cargando estadísticas:', error);
                setIsLoadingStats(false);
            }
        };

        loadStatistics();

    }, [symbol, statsDateRange]);



    const tabs = [
        { id: 'chart', label: 'GRÁFICO' },
        { id: 'technical', label: 'ANÁLISIS TÉCNICO' },
        { id: 'stats', label: 'ESTADÍSTICA' },
        { id: 'ratios', label: 'RATIOS' },
    ];

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            {/* Header */}
            <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-primary p-2 rounded-lg">
                            <TrendingUp className="text-primary-foreground h-6 w-6" />
                        </div>
                        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
                            FinAnalyzer
                        </h1>
                    </div>
                    <SearchBox onSelect={handleSearch} />
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 container mx-auto px-4 py-8">

                {/* Header Info */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-3xl font-bold">{backendData?.info?.shortName || symbol}</h2>
                        <div className="text-muted-foreground flex gap-4 mt-1">
                            <span>{symbol}</span>
                            <span>•</span>
                            <span>{backendData?.info?.sector || "ETF/Index"}</span>
                            <span>•</span>
                            <span>{backendData?.info?.currency}</span>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-lg mb-6 text-center">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    backendData && (
                        <>
                            {/* TOP METRICS (Uses Chart Period) */}
                            <StatsGrid
                                metrics={topMetrics}
                                period={chartPeriod}
                            />

                            <Tabs activeTab={activeTab} onTabChange={setActiveTab} tabs={tabs} />

                            <div className="animate-in fade-in duration-500">
                                {activeTab === 'chart' && (
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                        <div className="lg:col-span-2">
                                            {/* Pass filtered data to Chart or let it filter? 
                                                Plan said: "Ensure it displays data for chartPeriod only"
                                                We can pass raw data + period and let it filter, OR pass filtered data.
                                                StockChart usually takes 'data' and 'period'.
                                                Let's pass raw `historicalData` but ensure StockChart respects `chartPeriod`.
                                                Wait, if we pass `historicalData` (MAX), StockChart needs to know `chartPeriod`.
                                            */}
                                            <StockChart
                                                data={historicalData}
                                                period={chartPeriod}
                                                onPeriodChange={setChartPeriod}
                                            />
                                        </div>
                                        <div className="bg-card border border-border rounded-lg p-6 max-h-[600px] overflow-y-auto">
                                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                                <Activity className="h-5 w-5" />
                                                Información general
                                            </h3>
                                            <div className="space-y-4 text-sm text-muted-foreground">
                                                <p>
                                                    El precio actual es <span className="text-foreground font-medium">${topMetrics.currentPrice?.toFixed(2)}</span>.
                                                    La volatilidad anualizada es <span className="text-foreground font-medium">{topMetrics.volatility?.toFixed(2)}%</span>.
                                                </p>
                                                <div className="p-4 bg-secondary/50 rounded-md mt-4">
                                                    <h4 className="font-semibold text-foreground mb-2">Información de la Empresa</h4>
                                                    <p className="whitespace-pre-wrap text-sm">{translatedSummary || "Cargando..."}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'technical' && (
                                    <TechnicalAnalysis
                                        data={backendData.analysis?.technical} // This might need update if we want client-side indicators? 
                                        // The prompt said "Los indicadores técnicos usan el período del GRÁFICO"
                                        // "calculate indicators... setTechnicalIndicators" in App.
                                        // Current TechnicalAnalysis component primarily RENDERS data passed to it OR calculates?
                                        // Let's check TechnicalAnalysis later. For now pass chart-period filtered data.
                                        chartData={filterDataByPeriod(historicalData, chartPeriod)}
                                        period={chartPeriod}
                                    />
                                )}

                                {activeTab === 'stats' && (
                                    <div>
                                        <StatsRangeSelector
                                            statsDateRange={statsDateRange}
                                            setStatsDateRange={setStatsDateRange}
                                            historicalData={historicalData}
                                        />
                                        {isLoadingStats ? (
                                            <div className="flex items-center justify-center h-96">
                                                <div className="text-center">
                                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                                                    <p className="text-gray-400">Cargando estadística...</p>
                                                </div>
                                            </div>
                                        ) : statistics ? (
                                            <Statistics data={statistics} />
                                        ) : (
                                            <div className="text-center text-gray-400 py-12">
                                                <p>No se pudieron cargar las estadísticas. Intente seleccionar un rango más amplio.</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'ratios' && (
                                    <Ratios data={backendData.analysis?.ratios} />
                                )}
                            </div>
                        </>
                    )
                )
                }
            </main>

            {/* Footer */}
            <footer className="border-t border-border bg-card/50 backdrop-blur-sm py-6 mt-auto">
                <div className="container mx-auto px-4 text-center">
                    <p className="text-muted-foreground text-sm mb-2">
                        Esta página web está hecha con fines educativos. No constituye asesoramiento financiero.
                    </p>
                    <p className="text-muted-foreground/60 text-xs">
                        © {new Date().getFullYear()} Lautaroogh. Todos los derechos reservados.
                    </p>
                </div>
            </footer>
        </div>
    );
}

export default App;
