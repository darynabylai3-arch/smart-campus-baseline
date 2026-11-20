export interface Booking {
  id: string;
  roomId: string;
  start: number; // minutes from 00:00
  end: number;   // minutes from 00:00
  title: string;
}

export interface Room {
  id: string;
  name: string;
  building: string;
  capacity: number;
  blocked: boolean;
}

export type ReasonCode =
  | "AVAILABLE"
  | "NO_ROOM"
  | "INVALID_TIME"
  | "INVALID_RANGE"
  | "PAST_START"
  | "TOO_LONG"
  | "ROOM_BLOCKED"
  | "OVERLAP";

export type Decision =
  | { status: "available"; roomName: string; code: ReasonCode }
  | { status: "unavailable"; reason: string; code: ReasonCode };

export type IntervalInput = {
  start: string;
  end: string;
};
