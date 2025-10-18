// src/components/schedule/ScheduleEditor.tsx
"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X as CloseIcon, GripVertical } from "lucide-react";
import { ScheduleEntry, DragState } from "./types";
import { timeHeaders, daysOfWeek, shortDaysOfWeek } from "./constants";
import {
  timeToMinutes,
  minutesToTime,
  formatTimeToDisplayOnStrip,
  createInitialSchedules,
} from "./utils";
import { TimeStrip } from "./TimeStrip";
import { DragPreview } from "./DragPreview";

interface ScheduleEditorProps {
  onSave: (schedules: ScheduleEntry[]) => void;
  timezone?: string;
  initialSchedules?: ScheduleEntry[];
}

const ScheduleEditor: React.FC<ScheduleEditorProps> = ({
  onSave,
  timezone = "Türkiye Saati",
  initialSchedules,
}) => {
  const [schedules, setSchedules] = useState<ScheduleEntry[]>(
    initialSchedules || createInitialSchedules()
  );

  useEffect(() => {
    setSchedules(initialSchedules || createInitialSchedules());
  }, [initialSchedules]);

  const [dragState, setDragState] = useState<DragState | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const [hoveredDayIndex, setHoveredDayIndex] = useState<number | null>(null);
  const [isManualEntryPanelOpen, setIsManualEntryPanelOpen] = useState(false);
  const [manualPanelPosition, setManualPanelPosition] = useState({
    x: 150,
    y: 100,
  });
  const [isDraggingManualPanel, setIsDraggingManualPanel] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const manualPanelRef = useRef<HTMLDivElement>(null);

  const [manualEntryData, setManualEntryData] = useState<{
    days: Set<number>;
    startTime: string;
    endTime: string;
    editingId: string | null;
  }>({
    days: new Set(),
    startTime: "00:00",
    endTime: "23:59",
    editingId: null,
  });

  const dayRowHeightClass = "h-16";
  const timeStripHeightStyle = "calc(100% - 8px)";
  const timeStripTopOffset = "6px";
  const timeHeaderHeightClass = "h-8";

  const getGridProperties = useCallback(() => {
    if (!gridRef.current) return null;
    const rect = gridRef.current.getBoundingClientRect();
    const dayLabelWidth = 60;
    const gridWidth = rect.width - dayLabelWidth;
    return { rect, dayLabelWidth, gridWidth };
  }, []);

  const getBoundaries = useCallback(
    (
      dayIndex: number,
      excludeId?: string,
      dragInfo?: { initialMouseMinutes: number }
    ): { leftBoundary: number; rightBoundary: number } => {
      const daySchedules = schedules
        .filter((s) => s.day === dayIndex && s.id !== excludeId)
        .sort(
          (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
        );
      let leftBoundary = 0;
      let rightBoundary = 1440;
      const mousePos = dragInfo?.initialMouseMinutes;
      if (mousePos === undefined) return { leftBoundary, rightBoundary };
      for (const schedule of daySchedules) {
        const start = timeToMinutes(schedule.startTime);
        const end = timeToMinutes(schedule.endTime);
        if (end <= mousePos) leftBoundary = Math.max(leftBoundary, end);
        if (start >= mousePos) {
          rightBoundary = Math.min(rightBoundary, start);
          break;
        }
      }
      return { leftBoundary, rightBoundary };
    },
    [schedules]
  );

  const handleRowMouseDown = useCallback(
    (dayIndex: number, e: React.MouseEvent) => {
      e.preventDefault();
      const gridProps = getGridProperties();
      if (!gridProps) return;
      const x = e.clientX - gridProps.rect.left - gridProps.dayLabelWidth;
      const initialMouseMinutes =
        Math.round(((x / gridProps.gridWidth) * 1440) / 15) * 15;
      const isInsideExistingBlock = schedules.some(
        (s) =>
          s.day === dayIndex &&
          initialMouseMinutes >= timeToMinutes(s.startTime) &&
          initialMouseMinutes < timeToMinutes(s.endTime)
      );
      if (isInsideExistingBlock) return;
      const { leftBoundary, rightBoundary } = getBoundaries(
        dayIndex,
        undefined,
        { initialMouseMinutes }
      );
      setDragState({
        isDragging: true,
        type: "create",
        dayIndex,
        handle: "new",
        initialMouseMinutes,
        leftBoundary,
        rightBoundary,
      });
    },
    [getGridProperties, schedules, getBoundaries]
  );

  const handleStripDragStart = useCallback(
    (
      dayIndex: number,
      handle: "start" | "end" | "move",
      scheduleId: string,
      e: React.MouseEvent
    ) => {
      e.preventDefault();
      e.stopPropagation();
      const gridProps = getGridProperties();
      if (!gridProps) return;
      const x = e.clientX - gridProps.rect.left - gridProps.dayLabelWidth;
      const initialMouseMinutes =
        Math.round(((x / gridProps.gridWidth) * 1440) / 15) * 15;
      const scheduleToDrag = schedules.find((s) => s.id === scheduleId);
      if (!scheduleToDrag) return;
      const { leftBoundary, rightBoundary } = getBoundaries(
        dayIndex,
        scheduleId,
        { initialMouseMinutes }
      );
      setDragState({
        isDragging: true,
        type: "edit",
        dayIndex,
        handle,
        scheduleId,
        initialMouseMinutes,
        initialStartMinutes: timeToMinutes(scheduleToDrag.startTime),
        leftBoundary,
        rightBoundary,
      });
    },
    [getGridProperties, schedules, getBoundaries]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragState) return;
      const gridProps = getGridProperties();
      if (!gridProps) return;
      const x = e.clientX - gridProps.rect.left - gridProps.dayLabelWidth;
      const rawMinutes = (x / gridProps.gridWidth) * 1440;
      const currentMinutes =
        Math.round(
          Math.max(
            dragState.leftBoundary,
            Math.min(rawMinutes, dragState.rightBoundary)
          ) / 15
        ) * 15;

      if (dragState.type === "edit" && dragState.scheduleId) {
        setSchedules((prev) =>
          prev.map((schedule) => {
            if (schedule.id === dragState.scheduleId) {
              const newSchedule = { ...schedule };
              const startMinutes = timeToMinutes(schedule.startTime);
              const endMinutes = timeToMinutes(schedule.endTime);
              if (dragState.handle === "start") {
                newSchedule.startTime = minutesToTime(
                  Math.min(currentMinutes, endMinutes)
                );
              } else if (dragState.handle === "end") {
                newSchedule.endTime = minutesToTime(
                  Math.max(currentMinutes, startMinutes)
                );
              } else if (dragState.handle === "move") {
                const deltaMinutes =
                  currentMinutes - dragState.initialMouseMinutes;
                const blockDuration = endMinutes - startMinutes;
                const newStart =
                  (dragState.initialStartMinutes || 0) + deltaMinutes;
                const clampedStart = Math.max(
                  dragState.leftBoundary,
                  Math.min(newStart, dragState.rightBoundary - blockDuration)
                );
                newSchedule.startTime = minutesToTime(clampedStart);
                newSchedule.endTime = minutesToTime(
                  clampedStart + blockDuration
                );
              }
              return newSchedule;
            }
            return schedule;
          })
        );
      }
    },
    [dragState, getGridProperties]
  );

  const handleMouseUp = useCallback(
    (e: MouseEvent) => {
      if (!dragState) return;
      if (dragState.type === "create") {
        const gridProps = getGridProperties();
        if (!gridProps) {
          setDragState(null);
          return;
        }
        const x = e.clientX - gridProps.rect.left - gridProps.dayLabelWidth;
        const rawMinutes = (x / gridProps.gridWidth) * 1440;
        const finalMinutes =
          Math.round(
            Math.max(
              dragState.leftBoundary,
              Math.min(rawMinutes, dragState.rightBoundary)
            ) / 15
          ) * 15;
        const startTime = minutesToTime(
          Math.min(dragState.initialMouseMinutes, finalMinutes)
        );
        const endTime = minutesToTime(
          Math.max(dragState.initialMouseMinutes, finalMinutes)
        );
        if (timeToMinutes(endTime) - timeToMinutes(startTime) >= 15) {
          const newSchedule: ScheduleEntry = {
            id: `sched-${Date.now()}`,
            day: dragState.dayIndex,
            startTime,
            endTime,
          };
          setSchedules((prev) =>
            [...prev, newSchedule].sort(
              (a, b) =>
                a.day - b.day ||
                timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
            )
          );
        }
      }
      setDragState(null);
    },
    [dragState, getGridProperties]
  );

  useEffect(() => {
    if (dragState?.isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp, { once: true });
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragState, handleMouseMove, handleMouseUp]);

  const openManualEntryPanel = useCallback((scheduleToEdit?: ScheduleEntry) => {
    if (scheduleToEdit) {
      setManualEntryData({
        days: new Set([scheduleToEdit.day]),
        startTime: scheduleToEdit.startTime,
        endTime:
          scheduleToEdit.endTime === "24:00" ? "23:59" : scheduleToEdit.endTime,
        editingId: scheduleToEdit.id,
      });
    } else {
      setManualEntryData({
        days: new Set(),
        startTime: "00:00",
        endTime: "23:59",
        editingId: null,
      });
    }
    const initialX = window.innerWidth / 2 - 210;
    const initialY = window.innerHeight / 3;
    setManualPanelPosition({
      x: Math.max(0, initialX),
      y: Math.max(0, initialY),
    });
    setIsManualEntryPanelOpen(true);
  }, []);

  const closeManualEntryPanel = useCallback(
    () => setIsManualEntryPanelOpen(false),
    []
  );

  const handleManualEntrySave = useCallback(() => {
    const { days, startTime, endTime, editingId } = manualEntryData;
    if (days.size === 0) {
      toast.warning("Lütfen en az bir gün seçin.");
      return;
    }
    const startMins = timeToMinutes(startTime);
    const endMins = timeToMinutes(endTime === "23:59" ? "24:00" : endTime);
    if (endMins <= startMins) {
      toast.error("Bitiş saati, başlangıç saatinden sonra olmalıdır.");
      return;
    }
    const finalEndTime = minutesToTime(endMins);
    let conflictingSchedulesRemoved = false;
    setSchedules((prevSchedules) => {
      let updatedSchedules = [...prevSchedules];
      if (editingId) {
        updatedSchedules = updatedSchedules.filter((s) => s.id !== editingId);
      }
      days.forEach((day) => {
        const schedulesOnDay = updatedSchedules.filter((s) => s.day === day);
        const nonConflictingSchedules = schedulesOnDay.filter((s) => {
          const existingStart = timeToMinutes(s.startTime);
          const existingEnd = timeToMinutes(s.endTime);
          const isOverlapping =
            startMins < existingEnd && endMins > existingStart;
          if (isOverlapping) {
            conflictingSchedulesRemoved = true;
          }
          return !isOverlapping;
        });
        const otherDaysSchedules = updatedSchedules.filter(
          (s) => s.day !== day
        );
        updatedSchedules = [...otherDaysSchedules, ...nonConflictingSchedules];
      });
      days.forEach((day) => {
        updatedSchedules.push({
          id: `manual-sched-${Date.now()}-${day}`,
          day: day,
          startTime: startTime,
          endTime: finalEndTime,
        });
      });
      return updatedSchedules.sort(
        (a, b) =>
          a.day - b.day ||
          timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
      );
    });
    if (conflictingSchedulesRemoved) {
      toast.success(editingId ? "Zamanlama güncellendi" : "Zamanlama eklendi", {
        description:
          "Yeni aralık eklendi ve çakışan eski zamanlamalar kaldırıldı.",
      });
    } else if (editingId) {
      toast.success("Zamanlama güncellendi", {
        description: `Zamanlama başarıyla güncellendi/taşındı.`,
      });
    } else {
      toast.success("Zamanlama eklendi", {
        description: `${days.size} gün için yeni zamanlama başarıyla eklendi.`,
      });
    }
    closeManualEntryPanel();
  }, [manualEntryData, closeManualEntryPanel]);

  const handleDeleteScheduleFromManualPanel = useCallback(() => {
    if (!manualEntryData.editingId) return;
    const scheduleToDelete = schedules.find(
      (s) => s.id === manualEntryData.editingId
    );
    setSchedules((prevSchedules) =>
      prevSchedules.filter(
        (schedule) => schedule.id !== manualEntryData.editingId
      )
    );
    if (scheduleToDelete) {
      toast.info(
        `${
          daysOfWeek[scheduleToDelete.day]
        } günündeki ${formatTimeToDisplayOnStrip(
          scheduleToDelete.startTime
        )} - ${formatTimeToDisplayOnStrip(
          scheduleToDelete.endTime
        )} aralığındaki zamanlama silindi.`
      );
    } else {
      toast.info("Seçili zamanlama silindi.");
    }
    closeManualEntryPanel();
  }, [manualEntryData.editingId, schedules, closeManualEntryPanel]);

  const onManualPanelDragMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!manualPanelRef.current) return;
      if (!(e.target as HTMLElement).closest(".cursor-grab")) return;
      setIsDraggingManualPanel(true);
      setDragOffset({
        x: e.clientX - manualPanelPosition.x,
        y: e.clientY - manualPanelPosition.y,
      });
      e.preventDefault();
    },
    [manualPanelPosition]
  );

  const onWindowMouseMoveForPanel = useCallback(
    (e: MouseEvent) => {
      if (!isDraggingManualPanel || !manualPanelRef.current) return;
      let newX = e.clientX - dragOffset.x;
      let newY = e.clientY - dragOffset.y;
      const panelWidth = manualPanelRef.current.offsetWidth;
      const panelHeight = manualPanelRef.current.offsetHeight;
      newX = Math.max(0, Math.min(newX, window.innerWidth - panelWidth));
      newY = Math.max(0, Math.min(newY, window.innerHeight - panelHeight));
      setManualPanelPosition({ x: newX, y: newY });
    },
    [isDraggingManualPanel, dragOffset]
  );

  const onWindowMouseUpForPanel = useCallback(() => {
    if (isDraggingManualPanel) {
      setIsDraggingManualPanel(false);
      document.body.style.cursor = "default";
      document.body.style.userSelect = "auto";
    }
  }, [isDraggingManualPanel]);

  useEffect(() => {
    if (isDraggingManualPanel) {
      document.body.style.cursor = "grabbing";
      document.body.style.userSelect = "none";
      window.addEventListener("mousemove", onWindowMouseMoveForPanel);
      window.addEventListener("mouseup", onWindowMouseUpForPanel);
    }
    return () => {
      document.body.style.cursor = "default";
      document.body.style.userSelect = "auto";
      window.removeEventListener("mousemove", onWindowMouseMoveForPanel);
      window.removeEventListener("mouseup", onWindowMouseUpForPanel);
    };
  }, [
    isDraggingManualPanel,
    onWindowMouseMoveForPanel,
    onWindowMouseUpForPanel,
  ]);

  const handleFinalSave = useCallback(() => {
    onSave(schedules);
    toast.success("Tüm Değişiklikler Kaydedildi");
  }, [onSave, schedules]);

  const handleDeleteDaySchedules = useCallback((dayIndexToDelete: number) => {
    setSchedules((prevSchedules) =>
      prevSchedules.filter((schedule) => schedule.day !== dayIndexToDelete)
    );
    toast.info(
      `${daysOfWeek[dayIndexToDelete]} günündeki tüm zamanlamalar silindi.`
    );
  }, []);

  const schedulesByDay = useMemo(() => {
    return schedules.reduce((acc, schedule) => {
      (acc[schedule.day] = acc[schedule.day] || []).push(schedule);
      return acc;
    }, {} as Record<number, ScheduleEntry[]>);
  }, [schedules]);

  return (
    <div className="flex h-full flex-col bg-white text-sm select-none relative">
      <div className="flex items-center ml-auto px-4 py-3 sm:px-6 ">
        <div className="flex items-center space-x-3">
          <Button
            onClick={() => openManualEntryPanel()}
            variant="outline"
            size="sm"
            className="text-xs rounded-full px-6 py-1.5 "
          >
            Elle Ekle/Düzenle
          </Button>
          <div className="text-xs text-gray-500 sm:text-sm">{timezone}</div>
        </div>
      </div>
      <ScrollArea className="flex-grow custom-scrollbar">
        <div className="p-4 sm:p-2 ">
          <div
            ref={gridRef}
            data-grid-ref="true"
            className="relative grid min-w-[800px]"
            style={{ gridTemplateColumns: `60px 1fr` }}
          >
            <div className="sticky top-0 z-20 bg-white">
              <div className={timeHeaderHeightClass} />
              {daysOfWeek.map((day, dayIndex) => (
                <div
                  key={day}
                  className={`flex ${dayRowHeightClass} items-center justify-end border-r border-t border-gray-200 bg-white pr-2 text-right text-[11px] font-medium text-gray-500 sm:text-xs relative group`}
                  onMouseEnter={() => setHoveredDayIndex(dayIndex)}
                  onMouseLeave={() => setHoveredDayIndex(null)}
                >
                  {hoveredDayIndex === dayIndex ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteDaySchedules(dayIndex);
                      }}
                      className="absolute inset-0 flex items-center justify-center text-red-500"
                      title={`${day} için tüm zamanlamaları sil`}
                    >
                      <CloseIcon className="h-4 w-4 " />
                    </button>
                  ) : (
                    <span>{day}</span>
                  )}
                </div>
              ))}
            </div>
            <div className="relative">
              <div
                className={`sticky top-0 z-10 ${timeHeaderHeightClass} bg-white`}
              >
                <div className="relative h-full ">
                  {timeHeaders.map((hour, index) => {
                    const isFirst = index === 0;
                    const isLast = index === timeHeaders.length - 1;
                    const leftPosition =
                      (index / (timeHeaders.length - 1)) * 100;
                    let transformStyle = "translateX(-50%)";
                    let textAlignClass = "justify-center";
                    if (isFirst) {
                      transformStyle = "translateX(0)";
                      textAlignClass = "justify-start";
                    } else if (isLast) {
                      transformStyle = "translateX(-100%)";
                      textAlignClass = "justify-end";
                    }
                    return (
                      <div
                        key={`${hour}-${index}`}
                        className={`absolute top-0 flex h-full items-end pb-1 text-[10px] text-gray-400 sm:text-xs whitespace-nowrap ${textAlignClass}`}
                        style={{
                          left: `${leftPosition}%`,
                          transform: transformStyle,
                        }}
                      >
                        {hour}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="relative">
                {daysOfWeek.map((_, dayIndex) => (
                  <div
                    key={dayIndex}
                    className={`relative ${dayRowHeightClass} cursor-crosshair`}
                    onMouseDown={(e) => handleRowMouseDown(dayIndex, e)}
                  >
                    <div className="absolute inset-0 grid grid-cols-12 pointer-events-none">
                      {Array.from({ length: 12 }).map((_, index) => (
                        <div
                          key={index}
                          className="h-full border-r border-t border-gray-200"
                        />
                      ))}
                    </div>
                    {(schedulesByDay[dayIndex] || []).map((s) => (
                      <TimeStrip
                        key={s.id}
                        schedule={s}
                        onDragStart={handleStripDragStart}
                        heightStyle={timeStripHeightStyle}
                        topOffset={timeStripTopOffset}
                        onEditRequest={openManualEntryPanel}
                      />
                    ))}
                    {dragState?.type === "create" &&
                      dragState.dayIndex === dayIndex && (
                        <DragPreview
                          dragState={dragState}
                          heightStyle={timeStripHeightStyle}
                          topOffset={timeStripTopOffset}
                        />
                      )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
      <div className="border-t border-gray-200 px-4 py-3 sm:px-6">
        <div className="flex justify-end">
          <Button
            className="rounded-full bg-sky-500 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-700"
            onClick={handleFinalSave}
          >
            Kaydet
          </Button>
        </div>
      </div>
      {isManualEntryPanelOpen && (
        <div
          ref={manualPanelRef}
          style={{
            position: "fixed",
            top: `${manualPanelPosition.y}px`,
            left: `${manualPanelPosition.x}px`,
            zIndex: 50,
          }}
          className="bg-white rounded-lg shadow-xl border border-gray-200 w-[420px] text-sm flex flex-col"
        >
          <div
            className="flex items-center justify-between p-3 border-b border-gray-200 cursor-grab"
            onMouseDown={onManualPanelDragMouseDown}
          >
            <div className="flex items-center">
              <GripVertical size={18} className="text-gray-400 mr-2" />
              <h3 className="font-semibold text-gray-700">Elle Zaman Ayarı</h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full hover:bg-gray-100"
              onClick={closeManualEntryPanel}
            >
              <CloseIcon size={16} className="text-gray-500" />
            </Button>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="manualStartTime"
                  className="block text-xs font-medium text-gray-700 mb-1"
                >
                  Başlangıç Saati
                </label>
                <input
                  type="time"
                  id="manualStartTime"
                  value={manualEntryData.startTime}
                  onChange={(e) =>
                    setManualEntryData((prev) => ({
                      ...prev,
                      startTime: e.target.value,
                    }))
                  }
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-sky-300 focus:border-sky-500 sm:text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="manualEndTime"
                  className="block text-xs font-medium text-gray-700 mb-1"
                >
                  Bitiş Saati
                </label>
                <input
                  type="time"
                  id="manualEndTime"
                  step="60"
                  value={manualEntryData.endTime}
                  onChange={(e) =>
                    setManualEntryData((prev) => ({
                      ...prev,
                      endTime: e.target.value,
                    }))
                  }
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Uygulanacak Günler
              </label>
              <div className="flex items-center space-x-1">
                {shortDaysOfWeek.map((dayName, dayIndex) => {
                  const isSelected = manualEntryData.days.has(dayIndex);
                  return (
                    <Button
                      key={dayIndex}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      className={`h-10 w-10 p-0 text-xs ${
                        isSelected
                          ? "bg-sky-500 hover:bg-sky-700 text-white"
                          : "text-gray-600 bg-gray-200/70 hover:bg-gray-300"
                      }`}
                      onClick={() => {
                        const newSelectedDays = new Set(manualEntryData.days);
                        if (newSelectedDays.has(dayIndex)) {
                          newSelectedDays.delete(dayIndex);
                        } else {
                          newSelectedDays.add(dayIndex);
                        }
                        setManualEntryData((prev) => ({
                          ...prev,
                          days: newSelectedDays,
                        }));
                      }}
                    >
                      {dayName}
                    </Button>
                  );
                })}
              </div>
            </div>
            <div className="flex justify-end space-x-3 pt-2 border-t border-gray-200">
              {manualEntryData.editingId ? (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteScheduleFromManualPanel}
                  className="px-4 rounded-full"
                >
                  Sil
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={closeManualEntryPanel}
                  className="px-4 rounded-full"
                >
                  İptal
                </Button>
              )}
              <Button
                onClick={handleManualEntrySave}
                size="sm"
                className="bg-sky-600 hover:bg-sky-700 text-white px-4 rounded-full"
              >
                {manualEntryData.editingId
                  ? "Zamanlamayı Güncelle"
                  : "Zamanlama Ekle"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleEditor;
