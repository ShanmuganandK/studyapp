import React, { useState } from 'react';
import { PieChart, ArrowLeft } from 'lucide-react';

const VisualFractions = ({ onBack }) => {
    const [numerator, setNumerator] = useState(1);
    const [denominator, setDenominator] = useState(2);

    // Calculate SVG path for the pie slice
    const getCoordinatesForPercent = (percent) => {
        const x = Math.cos(2 * Math.PI * percent);
        const y = Math.sin(2 * Math.PI * percent);
        return [x, y];
    };

    const slices = [];
    for (let i = 0; i < denominator; i++) {
        const startPercent = i / denominator;
        const endPercent = (i + 1) / denominator;
        const [startX, startY] = getCoordinatesForPercent(startPercent);
        const [endX, endY] = getCoordinatesForPercent(endPercent);
        const largeArcFlag = endPercent - startPercent > 0.5 ? 1 : 0;

        // Rotate -90deg to start from top
        const pathData = [
            `M 0 0`,
            `L ${startX} ${startY}`,
            `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
            `L 0 0`,
        ].join(' ');

        slices.push({
            path: pathData,
            filled: i < numerator
        });
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={onBack} className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600">
                    <ArrowLeft size={24} />
                </button>
                <h2 className="text-2xl font-bold text-indigo-900 flex items-center gap-2">
                    <PieChart className="text-indigo-500" />
                    Visual Fractions
                </h2>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center space-y-8">
                {/* Visualization */}
                <div className="relative w-64 h-64">
                    <svg viewBox="-1.1 -1.1 2.2 2.2" className="w-full h-full transform -rotate-90">
                        {slices.map((slice, index) => (
                            <path
                                key={index}
                                d={slice.path}
                                fill={slice.filled ? '#4ade80' : '#f3f4f6'} // Green-400 or Gray-100
                                stroke="white"
                                strokeWidth="0.02"
                                className="transition-all duration-300 ease-in-out"
                            />
                        ))}
                    </svg>

                    {/* Fraction Text Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="bg-white/80 backdrop-blur-sm rounded-xl px-4 py-2 shadow-lg border border-gray-200">
                            <span className="text-4xl font-bold text-indigo-900">{numerator}</span>
                            <div className="h-1 w-full bg-indigo-900 rounded-full my-1"></div>
                            <span className="text-4xl font-bold text-indigo-900">{denominator}</span>
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="w-full max-w-xs space-y-6 bg-white p-6 rounded-2xl shadow-sm border border-indigo-50">
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <label className="font-bold text-gray-600">Numerator (Top)</label>
                            <span className="font-bold text-indigo-600 text-xl">{numerator}</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max={denominator}
                            value={numerator}
                            onChange={(e) => setNumerator(parseInt(e.target.value))}
                            className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <label className="font-bold text-gray-600">Denominator (Bottom)</label>
                            <span className="font-bold text-indigo-600 text-xl">{denominator}</span>
                        </div>
                        <input
                            type="range"
                            min="1"
                            max="12"
                            value={denominator}
                            onChange={(e) => {
                                const newDenom = parseInt(e.target.value);
                                setDenominator(newDenom);
                                if (numerator > newDenom) setNumerator(newDenom);
                            }}
                            className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VisualFractions;
