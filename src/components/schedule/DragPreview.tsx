"use client";

import React, { useState, useEffect, memo } from "react";
import { DragState } from "./types";

interface DragPreviewProps {
  dragState: DragState;
  heightStyle: string;
  topOffset: string;
}

export const DragPreview: React.FC<DragPreviewProps> = memo(
  ({ dragState, heightStyle, topOffset }) => {
    const [currentPos, setCurrentPos] = useState(dragState.initialMouseMinutes);

    useEffect(() => {
      const handleMouseMove = (e: MouseEvent) => {
        const gridRef = document.querySelector('[data-grid-ref="true"]');
        if (!gridRef) return;
        const rect = gridRef.getBoundingClientRect();
        const dayLabelWidth = 60;
        const gridWidth = rect.width - dayLabelWidth;
        const x = e.clientX - rect.left - dayLabelWidth;
        const rawMinutes = (x / gridWidth) * 1440;
        const finalMinutes = Math.max(
          dragState.leftBoundary,
          Math.min(rawMinutes, dragState.rightBoundary)
        );
        setCurrentPos(finalMinutes);
      };
      window.addEventListener("mousemove", handleMouseMove);
      return () => window.removeEventListener("mousemove", handleMouseMove);
    }, [dragState]);

    const start = Math.min(dragState.initialMouseMinutes, currentPos);
    const end = Math.max(dragState.initialMouseMinutes, currentPos);

    if (end - start < 1) return null;

    return (
      <div
        className="absolute bg-sky-300/50 rounded-[3px] pointer-events-none border-2 border-dashed border-sky-400"
        style={{
          left: `${(start / 1440) * 100}%`,
          width: `${((end - start) / 1440) * 100}%`,
          height: heightStyle,
          top: topOffset,
        }}
      />
    );
  }
);
DragPreview.displayName = "DragPreview";
