export const displayOptions = {
  metrics: {
    uploadSpeed: {
      enabled: true,
      format: 'Mbps',
    },
    downloadSpeed: {
      enabled: true,
      format: 'Mbps',
    },
    pingLatency: {
      enabled: true,
      format: 'ms',
    },
  },
  ui: {
    showMeters: true,
    meterColor: {
      upload: '#4caf50',
      download: '#2196f3',
      ping: '#ff9800',
    },
    layout: 'horizontal', // options: 'horizontal', 'vertical'
  },
};