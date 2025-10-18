"use client";

import React, { memo } from "react";
import { ScheduleEntry } from "./types";
import { timeToMinutes, formatTimeToDisplayOnStrip } from "./utils";

interface TimeStripProps {
  schedule: ScheduleEntry;
  onDragStart: (
    day: number,
    handle: "start" | "end" | "move",
    id: string,
    e: React.MouseEvent
  ) => void;
  heightStyle: string;
  topOffset: string;
  onEditRequest: (schedule: ScheduleEntry) => void;
}

export const TimeStrip: React.FC<TimeStripProps> = memo(
  ({ schedule, onDragStart, heightStyle, topOffset, onEditRequest }) => {
    const startMinutes = timeToMinutes(schedule.startTime);
    const endMinutes = timeToMinutes(schedule.endTime);
    if (endMinutes - startMinutes <= 0) return null;

    return (
      <div
        className="absolute bg-sky-300/30 text-black flex items-center justify-center overflow-hidden shadow-sm border border-sky-400/70 cursor-move"
        style={{
          left: `${(startMinutes / 1440) * 100}%`,
          width: `${((endMinutes - startMinutes) / 1440) * 100}%`,
          height: heightStyle,
          top: topOffset,
        }}
        onMouseDown={(e) => onDragStart(schedule.day, "move", schedule.id, e)}
        onClick={(e) => {
          e.stopPropagation();
          onEditRequest(schedule);
        }}
        title={`Düzenle: ${formatTimeToDisplayOnStrip(
          schedule.startTime
        )} - ${formatTimeToDisplayOnStrip(schedule.endTime)}`}
      >
        <div
          className="absolute left-0 top-0 h-full w-3 z-10 cursor-ew-resize"
          onMouseDown={(e) => {
            e.stopPropagation();
            onDragStart(schedule.day, "start", schedule.id, e);
          }}
        />
        <div className="truncate px-1.5 text-center text-[10px] font-semibold leading-tight pointer-events-none mr-auto">
          {formatTimeToDisplayOnStrip(schedule.startTime)} -{" "}
          {formatTimeToDisplayOnStrip(schedule.endTime)}
        </div>
        <div
          className="absolute right-0 top-0 h-full w-3 z-10 cursor-ew-resize"
          onMouseDown={(e) => {
            e.stopPropagation();
            onDragStart(schedule.day, "end", schedule.id, e);
          }}
        />
      </div>
    );
  }
);
TimeStrip.displayName = "TimeStrip";
