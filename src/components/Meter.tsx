import React from 'react';

interface MeterProps {
    value: number;
    maxValue: number;
    label: string;
    format: 'Mbps' | 'Kbps' | 'Bps';
}

const Meter: React.FC<MeterProps> = ({ value, maxValue, label, format }) => {
    const percentage = (value / maxValue) * 100;

    const formatValue = (value: number) => {
        switch (format) {
            case 'Mbps':
                return (value / 1e6).toFixed(2) + ' Mbps';
            case 'Kbps':
                return (value / 1e3).toFixed(2) + ' Kbps';
            case 'Bps':
                return value.toFixed(2) + ' Bps';
            default:
                return value.toString();
        }
    };

    return (
        <div className="meter-container">
            <div className="meter-label">{label}</div>
            <div className="meter">
                <div className="meter-fill" style={{ width: `${percentage}%` }} />
            </div>
            <div className="meter-value">{formatValue(value)}</div>
        </div>
    );
};

export default Meter;