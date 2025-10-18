"use client";

import { useState } from "react";
import ScheduleEditor from "@/components/schedule/ScheduleEditor";
import { ScheduleEntry } from "@/components/schedule/types";

export default function Home() {
  const [schedules, setSchedules] = useState<ScheduleEntry[] | undefined>(
    undefined
  );

  const handleSave = (newSchedules: ScheduleEntry[]) => {
    console.log("Kaydedilen Zamanlamalar:", newSchedules);
    setSchedules(newSchedules);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 md:p-12 lg:p-24 bg-gray-50">
      <div className="w-full max-w-7xl h-[70vh] bg-white shadow-lg rounded-lg border border-gray-200">
        <ScheduleEditor onSave={handleSave} initialSchedules={schedules} />
      </div>
    </main>
  );
}
