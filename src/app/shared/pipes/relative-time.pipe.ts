import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'relativeTime', standalone: true, pure: false })
export class RelativeTimePipe implements PipeTransform {
  transform(value: Date | string | null): string {
    if (!value) return '';
    const date = value instanceof Date ? value : new Date(value);
    const rawSeconds = Math.floor((Date.now() - date.getTime()) / 1000);
    // A timestamp in the future (client/server clock skew) previously
    // matched `seconds < 60` and silently read as "только что" — that
    // hides a real clock problem instead of surfacing it.
    if (rawSeconds < 0) return `через ${this.formatDuration(-rawSeconds)}`;
    if (rawSeconds < 60) return 'только что';
    return `${this.formatDuration(rawSeconds)} назад`;
  }

  private formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} мин`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} ч`;
    const days = Math.floor(hours / 24);
    return `${days} д`;
  }
}
