import { useState } from 'react';
import SpeedTestControls from '../components/SpeedTestControls';
import SpeedResults from '../components/SpeedResults';
import { performSpeedTest } from '../utils/cloudflareSpeedTest';
import { displayOptions } from '../config/displayOptions';

const Home = () => {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleStartTest = async () => {
    setLoading(true);
    const speedResults = await performSpeedTest();
    setResults(speedResults);
    setLoading(false);
  };

  return (
    <div>
      <h1>Internet Speed Test</h1>
      <SpeedTestControls onStartTest={handleStartTest} loading={loading} />
      {results && (
        <SpeedResults results={results} displayOptions={displayOptions} />
      )}
    </div>
  );
};

export default Home;