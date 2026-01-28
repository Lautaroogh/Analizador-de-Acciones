import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api', // Use env var in prod, relative proxy in dev
});

export const searchTicker = async (query) => {
    const response = await api.get(`/search?q=${query}`);
    return response.data;
};

export const getTickerData = async (symbol, period = '1y', interval = '1d', start_date = null, end_date = null) => {
    let url = `/ticker/${symbol}?period=${period}&interval=${interval}`;
    if (start_date && end_date) {
        url += `&start_date=${start_date}&end_date=${end_date}`;
    }
    const response = await api.get(url);
    return response.data;
};

export default api;
