import React from "react";
import { PackageOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = "",
}) => {
  return (
    <div
      className={`grid min-h-48 place-items-center rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-8 text-center ${className}`}
    >
      <div className="max-w-xs">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-700/30 text-slate-400">
          {icon ?? <PackageOpen className="h-7 w-7" />}
        </div>
        <h3 className="mt-4 text-lg font-semibold text-white">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
        {action && (
          <Button
            onClick={action.onClick}
            className="mt-5 h-9 bg-cyan-200 text-slate-950 hover:bg-cyan-100 px-5"
          >
            {action.label}
          </Button>
        )}
      </div>
    </div>
  );
};
