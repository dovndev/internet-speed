import { SpeedTest } from '@cloudflare/speedtest';

const speedTest = new SpeedTest();

export const runSpeedTest = async () => {
    try {
        const results = await speedTest.getSpeed();
        return {
            download: results.download,
            upload: results.upload,
            ping: results.ping,
        };
    } catch (error) {
        console.error('Error running speed test:', error);
        throw error;
    }
};

export const configureSpeedTest = (options) => {
    speedTest.setOptions(options);
};