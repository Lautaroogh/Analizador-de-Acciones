import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const Tabs = ({ activeTab, onTabChange, tabs }) => {
    return (
        <div className="flex space-x-1 rounded-xl bg-secondary/20 p-1 mb-6">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={twMerge(
                        clsx(
                            'w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all duration-200',
                            'ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                            activeTab === tab.id
                                ? 'bg-card text-primary shadow-sm border-b-2 border-primary'
                                : 'text-muted-foreground hover:bg-white/[0.12] hover:text-white'
                        )
                    )}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
};

export default Tabs;
