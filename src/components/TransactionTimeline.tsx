import React from "react";
import { CheckCircle2, Circle, Loader2, XCircle } from "lucide-react";

export type TimelineStepStatus = "pending" | "active" | "completed" | "failed";

export interface TimelineStep {
  id: string;
  label: string;
  description?: string;
  status: TimelineStepStatus;
}

interface TransactionTimelineProps {
  steps: TimelineStep[];
  className?: string;
}

const statusIcon = (status: TimelineStepStatus) => {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="h-5 w-5 text-emerald-400" />;
    case "active":
      return <Loader2 className="h-5 w-5 text-blue-400 animate-spin" />;
    case "failed":
      return <XCircle className="h-5 w-5 text-red-400" />;
    case "pending":
      return <Circle className="h-5 w-5 text-slate-600" />;
  }
};

const statusLine = (status: TimelineStepStatus) => {
  switch (status) {
    case "completed":
      return "bg-emerald-500/50";
    case "active":
      return "bg-blue-500/50";
    case "failed":
      return "bg-red-500/50";
    case "pending":
      return "bg-slate-700";
  }
};

export const TransactionTimeline: React.FC<TransactionTimelineProps> = ({
  steps,
  className = "",
}) => {
  return (
    <div
      className={`space-y-0 ${className}`}
      role="list"
      aria-label="Transaction progress"
    >
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        return (
          <div key={step.id} role="listitem" className="flex gap-3">
            <div className="flex flex-col items-center">
              {statusIcon(step.status)}
              {!isLast && (
                <div className={`w-0.5 h-8 mt-1 ${statusLine(step.status)}`} />
              )}
            </div>
            <div className={`pb-6 ${isLast ? "pb-0" : ""}`}>
              <p
                className={`text-sm font-semibold ${
                  step.status === "completed"
                    ? "text-emerald-300"
                    : step.status === "active"
                      ? "text-blue-300"
                      : step.status === "failed"
                        ? "text-red-300"
                        : "text-slate-500"
                }`}
              >
                {step.label}
              </p>
              {step.description && (
                <p className="text-xs text-slate-400 mt-0.5">
                  {step.description}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
