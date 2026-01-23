import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { searchTicker } from '../api';

const SearchBox = ({ onSelect }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);

    useEffect(() => {
        const fetchResults = async () => {
            if (query.length > 1) {
                try {
                    const data = await searchTicker(query);
                    setResults(data);
                    setIsOpen(true);
                } catch (error) {
                    console.error("Search failed", error);
                }
            } else {
                setResults([]);
                setIsOpen(false);
            }
        };

        const timeoutId = setTimeout(fetchResults, 300);
        return () => clearTimeout(timeoutId);
    }, [query]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={wrapperRef} className="relative w-full max-w-md">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <input
                    type="text"
                    className="w-full pl-10 pr-4 py-2 bg-secondary/50 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    placeholder="Search asset (e.g., AAPL, BTC-USD)..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => query.length > 1 && setIsOpen(true)}
                />
            </div>

            {isOpen && results.length > 0 && (
                <ul className="absolute z-50 w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                    {results.map((item, index) => (
                        <li
                            key={index}
                            className="px-4 py-2 hover:bg-accent cursor-pointer text-sm"
                            onClick={() => {
                                onSelect(item.symbol);
                                setQuery(item.symbol);
                                setIsOpen(false);
                            }}
                        >
                            <div className="font-medium">{item.symbol}</div>
                            <div className="text-xs text-muted-foreground">{item.shortname || item.longname}</div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default SearchBox;
