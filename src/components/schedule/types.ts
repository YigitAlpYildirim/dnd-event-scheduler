export interface ScheduleEntry {
  id: string;
  day: number;
  startTime: string;
  endTime: string;
}

export interface DragState {
  isDragging: boolean;
  type: 'create' | 'edit';
  dayIndex: number;
  handle: 'start' | 'end' | 'move' | 'new';
  scheduleId?: string;
  initialStartMinutes?: number;
  initialMouseMinutes: number;
  leftBoundary: number;
  rightBoundary: number;
}