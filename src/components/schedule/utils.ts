
import { daysOfWeek } from './constants';
import { ScheduleEntry } from './types';

export const timeToMinutes = (timeStr: string): number => {
  if (!timeStr) return 0;
  if (timeStr === '24:00') return 1440;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

export const minutesToTime = (totalMinutes: number): string => {
  if (totalMinutes >= 1440) return '24:00';
  if (totalMinutes <= 0) return '00:00';
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

export const formatTimeToDisplayOnStrip = (timeStr: string): string => {
  if (!timeStr) return '';
  if (timeStr === '24:00') return '00:00';
  return timeStr;
};

export const createInitialSchedules = (): ScheduleEntry[] => {
  return daysOfWeek.map((_, i) => ({
    id: `sched-day-${i}`,
    day: i,
    startTime: '00:00',
    endTime: '24:00',
  }));
};