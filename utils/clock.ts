export interface Clock {
  getTime(): number;
}

export class RealClock implements Clock {
  getTime() {
    return Date.now();
  }
}
