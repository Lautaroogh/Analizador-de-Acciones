import React, { useMemo } from 'react';

const StatsRangeSelector = ({ statsDateRange, setStatsDateRange, historicalData }) => {

    // Generar años disponibles
    const availableYears = useMemo(() => {
        console.log('=== DEBUG AÑOS DISPONIBLES ===');

        if (!historicalData || historicalData.length === 0) {
            console.error('No hay datos históricos para generar años');
            const currentYear = new Date().getFullYear();
            return [currentYear]; // At least return current year
        }

        // Get all years safely
        const years = historicalData.map(d => new Date(d.date).getFullYear());

        // Use reduce to safely find min/max without stack overflow from spread operator
        let minYear = new Date().getFullYear();
        let maxYear = new Date().getFullYear();

        if (years.length > 0) {
            minYear = years[0];
            maxYear = years[0];
            for (let i = 1; i < years.length; i++) {
                if (years[i] < minYear) minYear = years[i];
                if (years[i] > maxYear) maxYear = years[i];
            }
        }

        console.log('Año mínimo:', minYear);
        console.log('Año máximo:', maxYear);

        // Generate array
        const yearsArr = [];
        for (let year = minYear; year <= maxYear; year++) {
            yearsArr.push(year);
        }

        // Ensure unique and sorted
        const finalYears = [...new Set(yearsArr)].sort((a, b) => a - b);
        console.log('Años disponibles:', finalYears.length, finalYears);
        console.log('==============================');
        return finalYears;
    }, [historicalData]);

    const months = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    // Función para botones de acceso rápido
    const handleQuickSelect = (period) => {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();

        let startYear, startMonth;

        if (period === 'Todo') {
            if (historicalData && historicalData.length > 0) {
                const firstDate = new Date(historicalData[0].date);
                startYear = firstDate.getFullYear();
                startMonth = firstDate.getMonth();
            } else {
                return;
            }
        } else {
            const yearsBack = parseInt(period.replace('Y', ''));
            startYear = currentYear - yearsBack;
            startMonth = currentMonth;
        }

        setStatsDateRange({
            startMonth,
            startYear,
            endMonth: currentMonth,
            endYear: currentYear
        });
    };

    return (
        <div className="mb-6 bg-gray-900 border border-gray-800 rounded-lg p-5">
            <div className="flex items-center mb-4">
                {/* Simple inline icon or reuse Lucide if available in scope. User prompt used SVG. */}
                <svg className="w-5 h-5 text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <h3 className="text-lg font-semibold text-white">
                    Período de Análisis Estadístico
                </h3>
            </div>

            {/* Selectores de fecha */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                {/* Fecha DESDE */}
                <div>
                    <label className="block text-sm text-gray-400 mb-2">Desde:</label>
                    <div className="flex gap-2">
                        <select
                            value={statsDateRange.startMonth}
                            onChange={(e) => setStatsDateRange({ ...statsDateRange, startMonth: parseInt(e.target.value) })}
                            className="flex-1 bg-gray-800 text-white border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                        >
                            {months.map((month, idx) => (
                                <option key={idx} value={idx}>{month}</option>
                            ))}
                        </select>

                        <select
                            value={statsDateRange.startYear}
                            onChange={(e) => setStatsDateRange({ ...statsDateRange, startYear: parseInt(e.target.value) })}
                            className="w-24 bg-gray-800 text-white border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                        >
                            {availableYears.map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Fecha HASTA */}
                <div>
                    <label className="block text-sm text-gray-400 mb-2">Hasta:</label>
                    <div className="flex gap-2">
                        <select
                            value={statsDateRange.endMonth}
                            onChange={(e) => setStatsDateRange({ ...statsDateRange, endMonth: parseInt(e.target.value) })}
                            className="flex-1 bg-gray-800 text-white border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                        >
                            {months.map((month, idx) => (
                                <option key={idx} value={idx}>{month}</option>
                            ))}
                        </select>

                        <select
                            value={statsDateRange.endYear}
                            onChange={(e) => setStatsDateRange({ ...statsDateRange, endYear: parseInt(e.target.value) })}
                            className="w-24 bg-gray-800 text-white border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                        >
                            {availableYears.map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Botones de acceso rápido */}
            <div>
                <label className="block text-sm text-gray-400 mb-2">Accesos rápidos:</label>
                <div className="flex flex-wrap gap-2">
                    {['1Y', '3Y', '5Y', '10Y', 'Todo'].map((p) => (
                        <button
                            key={p}
                            onClick={() => handleQuickSelect(p)}
                            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded text-sm transition-colors text-white"
                        >
                            {p}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default StatsRangeSelector;
