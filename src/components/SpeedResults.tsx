import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store'; // Assuming you have a Redux store set up

const SpeedResults: React.FC = () => {
    const { downloadSpeed, uploadSpeed, pingLatency, displayOptions } = useSelector((state: RootState) => state.speedTest);

    const formatSpeed = (speed: number, unit: string) => {
        switch (unit) {
            case 'Mbps':
                return (speed / 1e6).toFixed(2) + ' Mbps';
            case 'Kbps':
                return (speed / 1e3).toFixed(2) + ' Kbps';
            case 'Bps':
            default:
                return speed.toFixed(2) + ' Bps';
        }
    };

    return (
        <div className="speed-results">
            {displayOptions.showDownload && (
                <div className="result">
                    <h3>Download Speed</h3>
                    <p>{formatSpeed(downloadSpeed, displayOptions.downloadUnit)}</p>
                </div>
            )}
            {displayOptions.showUpload && (
                <div className="result">
                    <h3>Upload Speed</h3>
                    <p>{formatSpeed(uploadSpeed, displayOptions.uploadUnit)}</p>
                </div>
            )}
            {displayOptions.showPing && (
                <div className="result">
                    <h3>Ping Latency</h3>
                    <p>{pingLatency} ms</p>
                </div>
            )}
        </div>
    );
};

export default SpeedResults;