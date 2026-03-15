export type AttendeeStatus = "pending" | "accepted" | "declined" | "maybe";

export interface RecurrenceRule {
    frequency: "daily" | "weekly" | "monthly" | "yearly";
    interval: number;
    until?: string | null;
    count?: number | null;
    byDay?: string[];
}

export interface CalendarAttendee {
    id: string;
    userId: string;
    displayName: string;
    username: string;
    status: AttendeeStatus;
    companions: number;
    declineReason: string | null;
    respondedAt: string | null;
}

export interface CalendarEvent {
    id: string;
    title: string;
    description: string | null;
    location: string | null;
    startDate: string;
    endDate: string;
    allDay: boolean;
    isPublic: boolean;
    maxAttendees: number | null;
    createdByUserId: string;
    createdByDisplayName: string;
    threadId: string | null;
    recurrenceRule: RecurrenceRule | null;
    color: string | null;
    attendeeCount: number;
    acceptedCount: number;
    myStatus: AttendeeStatus | null;
    createdAt: string;
    updatedAt: string;
}

export interface CalendarEventDetail extends CalendarEvent {
    attendees: CalendarAttendee[];
}

export interface RespondPayload {
    status: AttendeeStatus;
    companions?: number;
    declineReason?: string | null;
}

export interface CreateEventPayload {
    title: string;
    description?: string | null;
    location?: string | null;
    startDate: string;
    endDate: string;
    allDay?: boolean;
    isPublic?: boolean;
    maxAttendees?: number | null;
    recurrenceRule?: RecurrenceRule | null;
    color?: string | null;
    inviteUserIds?: string[];
}

export type CalendarView = "month" | "week" | "list";

export interface CalendarDay {
    date: Date;
    isCurrentMonth: boolean;
    isToday: boolean;
    events: CalendarEvent[];
}

export const EVENT_COLORS: { label: string; value: string; css: string }[] = [
    { label: "Blau", value: "blue", css: "bg-blue-500" },
    { label: "Grün", value: "green", css: "bg-green-500" },
    { label: "Rot", value: "red", css: "bg-red-500" },
    { label: "Lila", value: "purple", css: "bg-purple-500" },
    { label: "Orange", value: "orange", css: "bg-orange-500" },
    { label: "Pink", value: "pink", css: "bg-pink-500" }
];

export function getEventColorClass(color: string | null): string {
    switch (color) {
        case "green": return "bg-green-500";
        case "red": return "bg-red-500";
        case "purple": return "bg-purple-500";
        case "orange": return "bg-orange-500";
        case "pink": return "bg-pink-500";
        default: return "bg-blue-500";
    }
}

export function getEventBorderClass(color: string | null): string {
    switch (color) {
        case "green": return "border-green-400";
        case "red": return "border-red-400";
        case "purple": return "border-purple-400";
        case "orange": return "border-orange-400";
        case "pink": return "border-pink-400";
        default: return "border-blue-400";
    }
}
