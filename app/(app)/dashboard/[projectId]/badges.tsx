import { type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, AlertCircle, XCircle } from "lucide-react";

export function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; icon: ReactNode }> = {
    draft: {
      bg: "bg-white/5 border-white/10",
      text: "text-muted-foreground",
      icon: null,
    },
    generating: {
      bg: "bg-primary/10 border-primary/20",
      text: "text-primary",
      icon: <Loader2 className="h-3 w-3 animate-spin" />,
    },
    completed: {
      bg: "bg-green-500/10 border-green-500/20",
      text: "text-green-500",
      icon: <Check className="h-3 w-3" />,
    },
    failed: {
      bg: "bg-red-500/10 border-red-500/20",
      text: "text-red-500",
      icon: <AlertCircle className="h-3 w-3" />,
    },
    canceled: {
      bg: "bg-amber-500/10 border-amber-500/20",
      text: "text-amber-500",
      icon: <XCircle className="h-3 w-3" />,
    },
  };

  const { bg, text, icon } = config[status] || config.draft;

  return (
    <Badge variant="outline" className={`${bg} ${text} px-3 py-1 font-medium shadow-sm`}>
      <span className="flex items-center gap-1.5">
        {icon}
        <span className="text-xs capitalize tracking-wide">{status}</span>
      </span>
    </Badge>
  );
}

export function JobStatusBadge({ name, status }: { name: string; status?: string }) {
  const config: Record<string, { icon: ReactNode; bg: string; text: string }> = {
    pending: {
      icon: <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />,
      bg: "bg-white/5 border border-white/10",
      text: "text-muted-foreground",
    },
    running: {
      icon: <Loader2 className="h-3 w-3 animate-spin text-primary" />,
      bg: "bg-primary/10 border border-primary/20",
      text: "text-primary",
    },
    completed: {
      icon: <Check className="h-3 w-3 text-green-500" />,
      bg: "bg-green-500/10 border border-green-500/20",
      text: "text-green-500",
    },
    failed: {
      icon: <AlertCircle className="h-3 w-3 text-red-500" />,
      bg: "bg-red-500/10 border border-red-500/20",
      text: "text-red-500",
    },
    skipped: {
      icon: <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />,
      bg: "bg-white/5 border border-white/10",
      text: "text-muted-foreground/70",
    },
    canceled: {
      icon: <XCircle className="h-3 w-3 text-amber-500" />,
      bg: "bg-amber-500/10 border border-amber-500/20",
      text: "text-amber-500",
    },
  };

  const { icon, bg, text } = config[status || "pending"] ?? config.pending;

  return (
    <div
      role="status"
      className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs shadow-sm backdrop-blur-sm ${bg} ${text}`}
    >
      {icon}
      <span className="capitalize tracking-wide">
        {name.replace(/([A-Z])/g, " $1").trim()}
      </span>
      <span className="sr-only">{`: ${status ?? "pending"}`}</span>
    </div>
  );
}
