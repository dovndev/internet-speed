import { SpeedTestOptions, speedTest } from 'network-speed';

const testServer = {
    host: 'ipv4.download.thinkbroadband.com',
    port: 80,
    path: '/5MB.zip'
};

export const testDownloadSpeed = async () => {
    const downloadSpeedTester = new SpeedTestOptions(testServer);
    const speed = await downloadSpeedTester.download();
    return speed; // Speed in Mbps
};

export const testUploadSpeed = async () => {
    const uploadSpeedTester = new SpeedTestOptions(testServer);
    const speed = await uploadSpeedTester.upload();
    return speed; // Speed in Mbps
};