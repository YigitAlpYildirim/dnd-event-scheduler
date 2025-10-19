# Interactive Schedule Editor for Next.js

An advanced, reusable, and highly interactive scheduling component built for modern web applications using Next.js, TypeScript, and Tailwind CSS. It provides a rich, grid-based UI for intuitive weekly time management.

This component is designed for developers who need a robust and flexible solution for creating, managing, and visualizing time-based schedules. Its modular architecture and clean API make it easy to integrate into any Next.js project.

[**View the Live Demo**](https://www.google.com/search?q=https://your-demo-link-here.com) \#\# Key Features

- **Intuitive Drag-and-Drop Interface**: Seamlessly create, resize, and move time blocks on a 7-day grid.
- **High Precision Control**: Utilizes a 15-minute interval snapping grid for accurate scheduling.
- **Dynamic State Management**: All interactions are managed client-side with React hooks for a fluid user experience.
- **Manual Adjustment Panel**: A draggable modal for fine-tuning schedules, setting exact times, and applying changes to multiple days at once.
- **Boundary-Aware Logic**: Intelligently prevents overlapping time blocks during drag and resize operations.
- **Modular & Composable**: Built with a clean separation of concerns, breaking down the UI into logical components like `TimeStrip` and `DragPreview`.
- **Fully Typed**: Written entirely in TypeScript for enhanced developer experience and code safety.
- **Professionally Styled**: Uses **shadcn/ui** and **Tailwind CSS** for a modern, clean, and easily customizable design.

## Technical Stack

- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Icons**: Lucide React

## Getting Started

Follow these instructions to set up and run the component in your local development environment.

### Prerequisites

- Node.js (v18.x or later)
- npm, yarn, or pnpm

### Installation

1.  **Clone the Repository:**

    ```bash
    git clone https://github.com/your-username/your-repo-name.git
    cd your-repo-name
    ```

2.  **Install Dependencies:**

    ```bash
    npm install
    ```

3.  **Set up shadcn/ui and Dependencies:**
    This component relies on specific `shadcn/ui` components. If you haven't already, initialize `shadcn/ui` and add the necessary components:

    ```bash
    npx shadcn-ui@latest init

    npx shadcn-ui@latest add button scroll-area sonner
    ```

    You will also need `lucide-react` for icons:

    ```bash
    npm install lucide-react
    ```

4.  **Integrate the Component:**
    Copy the entire `/src/components/schedule` directory into your project's component folder. The component is self-contained and ready to be used.

### Running the Project

To launch the development server:

```bash
npm run dev
```

Navigate to `http://localhost:3000` to view the application.

## Component API & Usage

The `ScheduleEditor` is designed to be highly configurable through its props.

### Example Implementation

Here is a standard implementation of the `ScheduleEditor`:

```tsx
// src/app/your-page/page.tsx
"use client";

import { useState, useEffect } from "react";
import ScheduleEditor from "@/components/schedule/ScheduleEditor";
import { ScheduleEntry } from "@/components/schedule/types";

// Example function to fetch initial data from an API
async function fetchInitialSchedule(): Promise<ScheduleEntry[]> {
  // In a real-world scenario, you would fetch this from your backend
  return [
    { id: "event-1", day: 0, startTime: "09:00", endTime: "11:30" },
    { id: "event-2", day: 3, startTime: "14:00", endTime: "16:00" },
  ];
}

export default function ScheduleManagementPage() {
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchInitialSchedule().then((data) => {
      setSchedule(data);
      setIsLoading(false);
    });
  }, []);

  const handleSaveChanges = (updatedSchedule: ScheduleEntry[]) => {
    console.log("Saving schedule to the backend...", updatedSchedule);
    // Here, you would typically make an API call to persist the changes
    // e.g., api.saveSchedule(updatedSchedule);
    setSchedule(updatedSchedule);
  };

  if (isLoading) {
    return <div>Loading Schedule...</div>;
  }

  return (
    <div className="w-full h-screen p-8 bg-slate-50">
      <h1 className="text-3xl font-bold mb-6">Manage Weekly Availability</h1>
      <div className="h-[75vh] border rounded-lg shadow-sm bg-white">
        <ScheduleEditor
          onSave={handleSaveChanges}
          initialSchedules={schedule}
          timezone="Europe/Istanbul"
        />
      </div>
    </div>
  );
}
```

### Props API

| Prop               | Type                                   | Default           | Description                                                                                                                                                                 |
| :----------------- | :------------------------------------- | :---------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onSave`           | `(schedules: ScheduleEntry[]) => void` | **-**             | **Required.** A callback function executed when the user clicks the "Save" button. It provides the most up-to-date array of `ScheduleEntry` objects, ready to be persisted. |
| `initialSchedules` | `ScheduleEntry[]`                      | `[]`              | An array of `ScheduleEntry` objects used to populate the editor on its initial render. This is essential for loading and editing existing schedules.                        |
| `timezone`         | `string`                               | `'Türkiye Saati'` | A string to display the relevant timezone information in the component's header. This is a display-only prop and does not affect time calculations.                         |

## Project Architecture

The component's logic is modularized for clarity, maintainability, and reusability.

```
/src/components/schedule/
├── ScheduleEditor.tsx   # The main stateful component orchestrating all logic.
├── TimeStrip.tsx        # A memoized component for rendering individual time blocks.
├── DragPreview.tsx      # A visual feedback component shown during new block creation.
├── types.ts             # Centralized TypeScript interfaces (ScheduleEntry, DragState).
├── constants.ts         # Static data like day/time labels.
└── utils.ts             # Pure helper functions for time conversion and data manipulation.
```

## Contributing

Contributions are welcome and highly encouraged\! Whether it's a bug report, a feature request, or a pull request, your input is valuable. Please feel free to open an issue or submit a PR.

## License

This project is licensed under the **MIT License**. See the [LICENSE](https://www.google.com/search?q=LICENSE) file for more details.
