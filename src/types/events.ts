export type EventType =
  | "adoption_fair"
  | "vaccination_campaign"
  | "awareness"
  | "workshop"
  | "other";

export type EventStatus = "upcoming" | "ongoing" | "completed" | "cancelled";

export interface EventLocation {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  coordinates?: { lat?: number; lng?: number };
}

export interface EventParticipant {
  userId: string;
  registeredAt?: string;
}

export interface PetEvent {
  _id: string;
  title: string;
  description: string;
  eventType: EventType;
  startDate: string;
  endDate: string;
  location: EventLocation;
  organizer: string;
  organizerName?: string;
  maxParticipants?: number | null;
  currentParticipants: number;
  participants: EventParticipant[];
  status: EventStatus;
  imageUrl?: string;
  tags?: string[];
}

export interface EventsResponse {
  success: boolean;
  data: PetEvent[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface CreateEventPayload {
  title: string;
  description: string;
  eventType: EventType;
  startDate: string;
  endDate: string;
  location: EventLocation;
  maxParticipants?: number;
  imageUrl?: string;
  tags?: string[];
}
