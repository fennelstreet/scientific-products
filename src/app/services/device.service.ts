import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, shareReplay, tap } from 'rxjs';

export interface DeviceAnswers {
  [questionKey: string]: string[];
}

export interface DevicesData {
  [deviceName: string]: DeviceAnswers;
}

@Injectable({
  providedIn: 'root'
})
export class DeviceService {
  private devicesData: DevicesData = {};
  private deviceOrder: string[] = [];
  private devicesRequest$?: Observable<DevicesData>;

  constructor(private readonly http: HttpClient) {}

  loadDevices(): Observable<DevicesData> {
    if (!this.devicesRequest$) {
      this.devicesRequest$ = this.http.get<DevicesData>('assets/devices.json').pipe(
        tap((devicesData) => {
          this.devicesData = devicesData ?? {};
          this.deviceOrder = Object.keys(this.devicesData);
        }),
        shareReplay(1)
      );
    }

    return this.devicesRequest$;
  }

  getAllDeviceNames(): string[] {
    return [...this.deviceOrder];
  }

  getQuestionKeys(): string[] {
    const questionKeys = new Set<string>();

    Object.values(this.devicesData).forEach((deviceAnswers) => {
      Object.keys(deviceAnswers).forEach((questionKey) => questionKeys.add(questionKey));
    });

    return Array.from(questionKeys);
  }

  getAvailableAnswers(questionKey: string, remainingDevices: string[]): string[] {
    const availableAnswers = new Set<string>();

    remainingDevices.forEach((deviceName) => {
      (this.devicesData[deviceName]?.[questionKey] ?? []).forEach((answer) => availableAnswers.add(answer));
    });

    return Array.from(availableAnswers).sort((left, right) => left.localeCompare(right));
  }

  isSingleSelectQuestion(questionKey: string): boolean {
    return this.getAvailableAnswers(questionKey, this.getAllDeviceNames()).length <= 2;
  }

  filterDevices(currentDevices: string[], questionKey: string, selectedAnswers: string[]): string[] {
    if (!selectedAnswers.length) {
      return [...currentDevices];
    }

    const isSingleSelectQuestion = this.isSingleSelectQuestion(questionKey);

    const filtered = currentDevices.filter((deviceName) => {
      const deviceAnswers = this.devicesData[deviceName]?.[questionKey] ?? [];

      if (isSingleSelectQuestion) {
        return deviceAnswers.includes(selectedAnswers[0]);
      }

      return selectedAnswers.every((selectedAnswer) => deviceAnswers.includes(selectedAnswer));
    });

    // Maintain original JSON order
    return filtered.sort((a, b) => this.deviceOrder.indexOf(a) - this.deviceOrder.indexOf(b));
  }
}
