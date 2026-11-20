import { useMemo } from "react";
import { Booking, Room } from "@/types";
import { MINUTES_PER_DAY, minutesToLabel } from "@/timeUtils";

interface Props {
  room: Room | null;
  bookings: Booking[];
  candidateStart: number | null;
  candidateEnd: number | null;
}

const HOUR_MARKS = Array.from({ length: 25 }, (_, i) => i); // 0..24

export function Timeline({ room, bookings, candidateStart, candidateEnd }: Props) {
  const roomBookings = useMemo(
    () => (room ? bookings.filter((b) => b.roomId === room.id) : []),
    [room, bookings]
  );

  const hasCandidate =
    candidateStart !== null && candidateEnd !== null && candidateStart < candidateEnd;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">
          Today's Schedule {room ? `— ${room.name}` : ""}
        </h3>
        <span className="text-xs text-slate-400">00:00 → 24:00</span>
      </div>

      {/* Hour labels */}
      <div className="relative h-5 mb-1">
        {HOUR_MARKS.map((h) => (
          <span
            key={h}
            className="absolute -translate-x-1/2 text-[10px] text-slate-400"
            style={{ left: `${(h / 24) * 100}%` }}
          >
            {h % 3 === 0 ? minutesToLabel(h * 60) : ""}
          </span>
        ))}
      </div>

      {/* Track */}
      <div className="relative h-12 rounded-lg bg-slate-100 overflow-hidden">
        {/* gridlines */}
        {HOUR_MARKS.map((h) => (
          <div
            key={h}
            className="absolute top-0 bottom-0 border-l border-slate-200"
            style={{ left: `${(h / 24) * 100}%` }}
          />
        ))}

        {/* existing bookings */}
        {roomBookings.map((b) => (
          <div
            key={b.id}
            className="absolute top-1 bottom-1 rounded bg-slate-400/80 px-1 flex items-center overflow-hidden"
            style={{
              left: `${(b.start / MINUTES_PER_DAY) * 100}%`,
              width: `${((b.end - b.start) / MINUTES_PER_DAY) * 100}%`,
            }}
            title={`${b.title} (${minutesToLabel(b.start)}-${minutesToLabel(b.end)})`}
          >
            <span className="truncate text-[10px] text-white font-medium">{b.title}</span>
          </div>
        ))}

        {/* candidate interval */}
        {hasCandidate && (
          <div
            className="absolute top-0 bottom-0 border-2 border-dashed border-teal-500 bg-teal-200/50 flex items-center justify-center"
            style={{
              left: `${(candidateStart! / MINUTES_PER_DAY) * 100}%`,
              width: `${((candidateEnd! - candidateStart!) / MINUTES_PER_DAY) * 100}%`,
            }}
          >
            <span className="text-[10px] font-semibold text-teal-700">
              {minutesToLabel(candidateStart!)}–{minutesToLabel(candidateEnd!)}
            </span>
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-slate-400/80" /> Existing booking
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded border-2 border-dashed border-teal-500 bg-teal-200/50" />
          Your request
        </span>
      </div>
    </div>
  );
}
