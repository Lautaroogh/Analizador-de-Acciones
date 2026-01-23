import React, { useState, useEffect } from 'react';
import SearchBox from './components/SearchBox';
import StockChart from './components/StockChart';
import StatsGrid from './components/StatsGrid';
import Tabs from './components/Tabs';
import TechnicalAnalysis from './components/TechnicalAnalysis';
import Statistics from './components/Statistics';
import Ratios from './components/Ratios';
import { getTickerData } from './api';
import { LayoutDashboard, TrendingUp, Activity } from 'lucide-react';

function App() {
    const [symbol, setSymbol] = useState('SPY');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [period, setPeriod] = useState('max'); // Load full history by default
    const [activeTab, setActiveTab] = useState('chart');

    useEffect(() => {
        fetchData(symbol, period);
    }, [symbol, period]);

    const fetchData = async (sym, per) => {
        setLoading(true);
        setError(null);
        try {
            // Backend handles 'max' for detailed stats internally if needed, 
            // but for chart optimization, we respect the period.
            // Note: The backend returns 'chart_data' based on the fetch. 
            // If we want detailed stats (seasonality) capable of full history 
            // while showing only 1y chart, the backend might need adjustment 
            // or we accept that "Statistics" tab uses the 'period' data.
            // For now, consistent behavior: The App shows data for the selected period.
            // Enhancement: If tab is 'stats', force max? 
            // Let's keep it simple as per plan: just pass period.
            const result = await getTickerData(sym, per, '1d');
            setData(result);
        } catch (error) {
            console.error("Error fetching data:", error);
            setError("Failed to load data. Please check if the backend is running. (Error: " + (error.response?.data?.detail || error.message) + ")");
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (newSymbol) => {
        setSymbol(newSymbol);
    };

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
                        <h2 className="text-3xl font-bold">{data?.info?.shortName || symbol}</h2>
                        <div className="text-muted-foreground flex gap-4 mt-1">
                            <span>{symbol}</span>
                            <span>•</span>
                            <span>{data?.info?.sector || "ETF/Index"}</span>
                            <span>•</span>
                            <span>{data?.info?.currency}</span>
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
                    data && (
                        <>
                            <StatsGrid stats={data.stats} period={period} />

                            <Tabs activeTab={activeTab} onTabChange={setActiveTab} tabs={tabs} />

                            <div className="animate-in fade-in duration-500">
                                {activeTab === 'chart' && (
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                        <div className="lg:col-span-2">
                                            <StockChart data={data.chart_data} period={period} onPeriodChange={setPeriod} />
                                        </div>
                                        <div className="bg-card border border-border rounded-lg p-6 max-h-[600px] overflow-y-auto">
                                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                                <Activity className="h-5 w-5" />
                                                Información general
                                            </h3>
                                            <div className="space-y-4 text-sm text-muted-foreground">
                                                <p>
                                                    El precio actual es <span className="text-foreground font-medium">${data.stats.current_price?.toFixed(2)}</span>.
                                                    La volatilidad anualizada es <span className="text-foreground font-medium">{data.stats.annualized_volatility_pct?.toFixed(2)}%</span>.
                                                </p>
                                                <div className="p-4 bg-secondary/50 rounded-md mt-4">
                                                    <h4 className="font-semibold text-foreground mb-2">Información de la Empresa</h4>
                                                    <p className="whitespace-pre-wrap">{data?.info?.longBusinessSummary_es || data?.info?.longBusinessSummary}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'technical' && (
                                    <TechnicalAnalysis data={data.analysis?.technical} />
                                )}

                                {activeTab === 'stats' && (
                                    <Statistics data={data.analysis} />
                                )}

                                {activeTab === 'ratios' && (
                                    <Ratios data={data.analysis?.ratios} />
                                )}
                            </div>
                        </>
                    )
                )}
            </main>
        </div>
    );
}

export default App;
