import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class NgSpeedTest {
  private iterations: number;
  private retryDelay: number;

  constructor(iterations: number = 5, retryDelay: number = 1000) {
    this.iterations = iterations;
    this.retryDelay = retryDelay;
  }

  public async getSpeed(): Promise<{ download: number; upload: number; ping: number }> {
    const downloadSpeed = await this.measureDownloadSpeed();
    const uploadSpeed = await this.measureUploadSpeed();
    const ping = await this.measurePing();

    return { download: downloadSpeed, upload: uploadSpeed, ping };
  }

  private async measureDownloadSpeed(): Promise<number> {
    // Implement download speed measurement logic here
    return new Promise((resolve) => {
      setTimeout(() => resolve(Math.random() * 100), this.retryDelay);
    });
  }

  private async measureUploadSpeed(): Promise<number> {
    // Implement upload speed measurement logic here
    return new Promise((resolve) => {
      setTimeout(() => resolve(Math.random() * 100), this.retryDelay);
    });
  }

  private async measurePing(): Promise<number> {
    // Implement ping measurement logic here
    return new Promise((resolve) => {
      setTimeout(() => resolve(Math.random() * 50), this.retryDelay);
    });
  }
}