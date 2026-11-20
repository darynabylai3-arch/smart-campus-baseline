import { Booking, Room } from "@/types";

export const SAMPLE_ROOMS: Room[] = [
  { id: "r1", name: "Aurora Hall", building: "North Wing", capacity: 40, blocked: false },
  { id: "r2", name: "Boreal Lab", building: "North Wing", capacity: 24, blocked: false },
  { id: "r3", name: "Cedar Suite", building: "South Wing", capacity: 12, blocked: true },
  { id: "r4", name: "Delta Studio", building: "South Wing", capacity: 30, blocked: false },
  { id: "r5", name: "Echo Commons", building: "East Quad", capacity: 60, blocked: false },
];

export const SAMPLE_BOOKINGS: Booking[] = [
  { id: "b1", roomId: "r1", start: 540, end: 600, title: "Intro Lecture" },        // 09:00-10:00
  { id: "b2", roomId: "r1", start: 720, end: 780, title: "Faculty Meeting" },      // 12:00-13:00
  { id: "b3", roomId: "r2", start: 600, end: 660, title: "Lab Session A" },         // 10:00-11:00
  { id: "b4", roomId: "r2", start: 840, end: 900, title: "Lab Session B" },         // 14:00-15:00
  { id: "b5", roomId: "r4", start: 480, end: 540, title: "Design Workshop" },       // 08:00-09:00
  { id: "b6", roomId: "r4", start: 960, end: 1020, title: "Film Screening" },       // 16:00-17:00
  { id: "b7", roomId: "r5", start: 660, end: 720, title: "Open Seminar" },          // 11:00-12:00
];
