import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8000/api', // FastAPI URL
});

export const searchTicker = async (query) => {
    const response = await api.get(`/search?q=${query}`);
    return response.data;
};

export const getTickerData = async (symbol, period = '1y', interval = '1d') => {
    const response = await api.get(`/ticker/${symbol}?period=${period}&interval=${interval}`);
    return response.data;
};

export default api;
