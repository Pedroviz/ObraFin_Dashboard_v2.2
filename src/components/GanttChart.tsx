import { useEffect, useRef } from "react";
import Gantt from "frappe-gantt";
import "frappe-gantt/dist/frappe-gantt.css";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface Task {
  id: string;
  name: string;
  start: string;
  end: string;
  progress: number;
  dependencies?: string;
}

interface GanttChartProps {
  tasks: Task[];
}

const GanttChart = ({ tasks }: GanttChartProps) => {
  const ganttRef = useRef<HTMLDivElement>(null);
  const ganttInstance = useRef<any>(null);

  useEffect(() => {
    if (ganttRef.current && tasks.length > 0) {
      // Destroy previous instance
      if (ganttInstance.current) {
        ganttInstance.current = null;
      }

      // Create new Gantt instance
      ganttInstance.current = new Gantt(ganttRef.current, tasks, {
        view_mode: "Month",
        bar_height: 30,
        bar_corner_radius: 8,
        arrow_curve: 5,
        padding: 18,
        date_format: "DD/MM/YYYY",
        language: "pt",
        custom_popup_html: (task: any) => {
          return `
            <div class="p-3">
              <h5 class="font-semibold text-sm mb-2">${task.name}</h5>
              <p class="text-xs text-muted-foreground">Início: ${task._start.format("DD/MM/YYYY")}</p>
              <p class="text-xs text-muted-foreground">Fim: ${task._end.format("DD/MM/YYYY")}</p>
              <p class="text-xs text-muted-foreground mt-2">Progresso: ${task.progress}%</p>
            </div>
          `;
        }
      });
    }

    return () => {
      if (ganttInstance.current) {
        ganttInstance.current = null;
      }
    };
  }, [tasks]);

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle>Cronograma da Obra</CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={ganttRef} className="gantt-container overflow-x-auto"></div>
        <style>{`
          .gantt-container {
            min-height: 400px;
          }
          .gantt .bar {
            fill: hsl(var(--primary));
          }
          .gantt .bar-progress {
            fill: hsl(var(--accent));
          }
          .gantt .bar-label {
            fill: hsl(var(--primary-foreground));
            font-weight: 500;
          }
          .gantt .grid-header {
            fill: hsl(var(--muted));
            stroke: hsl(var(--border));
          }
          .gantt .grid-row {
            fill: transparent;
          }
          .gantt .grid-row:nth-child(even) {
            fill: hsl(var(--muted) / 0.3);
          }
          .gantt .today-highlight {
            fill: hsl(var(--accent) / 0.3);
          }
        `}</style>
      </CardContent>
    </Card>
  );
};

export default GanttChart;
