import { Decision } from "@/types";
import { CheckCircle2, XCircle } from "lucide-react";

interface Props {
  decision: Decision | null;
}

export function ResultPanel({ decision }: Props) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      {!decision && (
        <p className="text-sm text-slate-400">
          Select a room and enter a start/end time to check availability.
        </p>
      )}

      {decision && decision.status === "available" && (
        <div className="flex items-start gap-3 rounded-lg bg-emerald-50 p-4">
          <CheckCircle2 className="h-6 w-6 flex-shrink-0 text-emerald-600" />
          <div>
            <p className="font-semibold text-emerald-800">Available</p>
            <p className="text-sm text-emerald-700">
              {decision.roomName} is free for your requested interval. No bookings will be changed.
            </p>
          </div>
        </div>
      )}

      {decision && decision.status === "unavailable" && (
        <div className="flex items-start gap-3 rounded-lg bg-rose-50 p-4">
          <XCircle className="h-6 w-6 flex-shrink-0 text-rose-600" />
          <div>
            <p className="font-semibold text-rose-800">Unavailable</p>
            <p className="text-sm text-rose-700">{decision.reason}</p>
          </div>
        </div>
      )}
    </div>
  );
}
