import { useEffect, useRef } from "react";
import Gantt from "frappe-gantt";
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
          
          /* Base gantt styles */
          .gantt-container .gantt {
            width: 100%;
            overflow: hidden;
          }
          
          .gantt .grid-background {
            fill: none;
          }
          
          .gantt .grid-header {
            fill: hsl(var(--muted));
            stroke: hsl(var(--border));
            stroke-width: 1.4;
          }
          
          .gantt .grid-row {
            fill: hsl(var(--card));
          }
          
          .gantt .grid-row:nth-child(even) {
            fill: hsl(var(--muted) / 0.3);
          }
          
          .gantt .row-line {
            stroke: hsl(var(--border));
          }
          
          .gantt .tick {
            stroke: hsl(var(--border));
            stroke-width: 0.2;
          }
          
          .gantt .tick.thick {
            stroke-width: 0.4;
          }
          
          .gantt .today-highlight {
            fill: hsl(var(--accent) / 0.2);
            opacity: 0.5;
          }
          
          /* Bar styles */
          .gantt .bar {
            fill: hsl(var(--primary));
            stroke: hsl(var(--primary-dark));
            stroke-width: 0;
            transition: all 0.3s ease;
          }
          
          .gantt .bar:hover {
            opacity: 0.8;
          }
          
          .gantt .bar-progress {
            fill: hsl(var(--accent));
          }
          
          .gantt .bar-invalid {
            fill: transparent;
            stroke: hsl(var(--destructive));
            stroke-width: 1;
            stroke-dasharray: 5;
          }
          
          .gantt .bar-label {
            fill: hsl(var(--primary-foreground));
            dominant-baseline: central;
            text-anchor: middle;
            font-weight: 500;
            font-size: 12px;
            pointer-events: none;
          }
          
          .gantt .bar-label.big {
            font-size: 16px;
          }
          
          /* Handle styles */
          .gantt .handle {
            fill: hsl(var(--primary));
            cursor: ew-resize;
            opacity: 0;
            visibility: hidden;
          }
          
          .gantt .bar-wrapper:hover .handle {
            visibility: visible;
            opacity: 1;
          }
          
          /* Arrow styles */
          .gantt .arrow {
            fill: none;
            stroke: hsl(var(--muted-foreground));
            stroke-width: 1.4;
          }
          
          /* Date highlight */
          .gantt .lower-text, .gantt .upper-text {
            font-size: 12px;
            text-anchor: middle;
            fill: hsl(var(--foreground));
          }
          
          /* Popup styles */
          .gantt-container .popup-wrapper {
            position: absolute;
            top: 0;
            left: 0;
            background: hsl(var(--card));
            padding: 0;
            border-radius: 8px;
            box-shadow: var(--shadow-soft);
            pointer-events: none;
            border: 1px solid hsl(var(--border));
          }
          
          .gantt-container .popup-wrapper .title {
            border-bottom: 1px solid hsl(var(--border));
            padding: 10px;
            font-weight: 600;
            color: hsl(var(--foreground));
          }
          
          .gantt-container .popup-wrapper .subtitle {
            padding: 10px;
            color: hsl(var(--muted-foreground));
            font-size: 12px;
          }
          
          .gantt-container .popup-wrapper .pointer {
            position: absolute;
            height: 5px;
            margin: 0 0 0 -5px;
            border: 5px solid transparent;
            border-top-color: hsl(var(--card));
          }
        `}</style>
      </CardContent>
    </Card>
  );
};

export default GanttChart;
