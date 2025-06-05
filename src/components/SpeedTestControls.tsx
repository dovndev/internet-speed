import React, { useState } from 'react';

const SpeedTestControls = ({ onStartTest, displayOptions }) => {
    const [isTesting, setIsTesting] = useState(false);

    const handleStartTest = () => {
        setIsTesting(true);
        onStartTest().finally(() => {
            setIsTesting(false);
        });
    };

    return (
        <div className="speed-test-controls">
            <h2>Internet Speed Test</h2>
            <button onClick={handleStartTest} disabled={isTesting}>
                {isTesting ? 'Testing...' : 'Start Test'}
            </button>
            <div className="options">
                {displayOptions.map(option => (
                    <label key={option.key}>
                        <input type="checkbox" checked={option.enabled} onChange={() => option.toggle()} />
                        {option.label}
                    </label>
                ))}
            </div>
        </div>
    );
};

export default SpeedTestControls;