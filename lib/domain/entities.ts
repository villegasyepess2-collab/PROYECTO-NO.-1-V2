export type MeetingSourceKind = "teams_internal" | "in_person_recording";
export type CandidateStatus = "pending" | "requires_review" | "approved" | "rejected";
export type TaskLifecycleStatus = "pending" | "in_progress" | "blocked" | "overdue" | "completed";

export interface User {
  id: string;
  email: string;
  displayName: string;
  teamsUserId?: string;
  role: "member" | "reviewer" | "admin";
  createdAt: string;
}

export interface Meeting {
  id: string;
  title: string;
  sourceId: string;
  startedAt: string;
  endedAt?: string;
  organizerId: string;
}

export interface Transcript {
  id: string;
  meetingId: string;
  language: string;
  rawText: string;
  normalizedText: string;
  storagePath?: string;
  createdAt: string;
}

export interface TaskCandidate {
  id: string;
  meetingId: string;
  transcriptId: string;
  title: string;
  description: string;
  sourceExcerpt: string;
  proposedResponsibleUserId?: string;
  proposedRequesterUserId?: string;
  dueDate?: string;
  confidenceScore: number;
  validationRequired: boolean;
  status: CandidateStatus;
  ambiguityReasons?: string[];
  createdAt: string;
}

export interface Task {
  id: string;
  meetingId: string;
  taskCandidateId: string;
  title: string;
  description: string;
  sourceExcerpt: string;
  responsibleUserId: string;
  requesterUserId: string;
  dueDate: string;
  status: TaskLifecycleStatus;
  createdAt: string;
  completedAt?: string;
}
