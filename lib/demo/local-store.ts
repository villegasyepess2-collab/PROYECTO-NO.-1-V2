import { isLocalPocAuthBypassEnabled } from "@/lib/auth/session";
import type { TaskLifecycleStatus } from "@/lib/domain/entities";

interface DemoMeeting {
  id: string;
  title: string;
  source_kind: "teams_internal" | "in_person_recording";
  organizer_user_id: string;
  created: string;
}

interface DemoTranscript {
  id: string;
  meeting_id: string;
  source_kind: "teams_internal" | "in_person_recording";
  external_id?: string;
  normalized_text: string;
  created: string;
}

interface DemoCandidate {
  id: string;
  meeting_id: string;
  transcript_id: string;
  title: string;
  description: string;
  source_excerpt: string;
  proposed_responsible_user_id?: string;
  proposed_requester_user_id?: string;
  due_date?: string;
  confidence_score: number;
  validation_required: boolean;
  status: "requires_review" | "approved" | "rejected";
  ambiguity_reasons: string[];
  created: string;
}

interface DemoTask {
  id: string;
  meeting_id: string;
  task_candidate_id: string;
  title: string;
  description: string;
  source_excerpt: string;
  responsible_user_id: string;
  requester_user_id: string;
  due_date: string;
  status: TaskLifecycleStatus;
  created: string;
  completed_at?: string | null;
}

interface DemoState {
  seeded: boolean;
  meetings: DemoMeeting[];
  transcripts: DemoTranscript[];
  candidates: DemoCandidate[];
  tasks: DemoTask[];
}

const state: DemoState = {
  seeded: false,
  meetings: [],
  transcripts: [],
  candidates: [],
  tasks: []
};

function mkId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function daysFromToday(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function isDemoLocalMode() {
  return isLocalPocAuthBypassEnabled();
}

export function seedDemoScenario() {
  state.meetings = [];
  state.transcripts = [];
  state.candidates = [];
  state.tasks = [];

  const now = new Date().toISOString();

  const meetingId = mkId("meeting");
  const transcriptId = mkId("transcript");

  state.meetings.push({
    id: meetingId,
    title: "Q2 Ops Sync - Demo",
    source_kind: "teams_internal",
    organizer_user_id: "demo.manager",
    created: now
  });

  state.transcripts.push({
    id: transcriptId,
    meeting_id: meetingId,
    source_kind: "teams_internal",
    normalized_text:
      "I need you to close the procurement checklist by next Friday. Also please take care of updating onboarding docs this week.",
    created: now
  });

  state.candidates.push(
    {
      id: mkId("candidate"),
      meeting_id: meetingId,
      transcript_id: transcriptId,
      title: "Close procurement checklist",
      description: "Finalize pending checklist items for procurement cycle.",
      source_excerpt: "I need you to close the procurement checklist by next Friday.",
      proposed_responsible_user_id: "ana.ops",
      proposed_requester_user_id: "demo.manager",
      due_date: daysFromToday(4),
      confidence_score: 0.61,
      validation_required: true,
      status: "requires_review",
      ambiguity_reasons: ["due_date_ambiguous"],
      created: now
    },
    {
      id: mkId("candidate"),
      meeting_id: meetingId,
      transcript_id: transcriptId,
      title: "Update onboarding documentation",
      description: "Refresh onboarding section with new approval steps.",
      source_excerpt: "please take care of updating onboarding docs this week.",
      proposed_responsible_user_id: "mario.hr",
      proposed_requester_user_id: "demo.manager",
      due_date: daysFromToday(2),
      confidence_score: 0.58,
      validation_required: true,
      status: "requires_review",
      ambiguity_reasons: ["requester_needs_confirmation"],
      created: now
    }
  );

  state.tasks.push({
    id: mkId("task"),
    meeting_id: meetingId,
    task_candidate_id: "seeded_direct",
    title: "Prepare weekly risk summary",
    description: "Compile open blockers and mitigation owners.",
    source_excerpt: "You are responsible for preparing the weekly risk summary.",
    responsible_user_id: "ana.ops",
    requester_user_id: "demo.manager",
    due_date: daysFromToday(1),
    status: "pending",
    created: now,
    completed_at: null
  });

  state.seeded = true;

  return {
    seeded: true,
    meetings: state.meetings.length,
    candidatesInReview: state.candidates.filter((c) => c.status === "requires_review").length,
    tasks: state.tasks.length
  };
}

export function ensureDemoScenario() {
  if (!state.seeded) return seedDemoScenario();
  return {
    seeded: true,
    meetings: state.meetings.length,
    candidatesInReview: state.candidates.filter((c) => c.status === "requires_review").length,
    tasks: state.tasks.length
  };
}

export function seedTeamsTranscriptDemo(params?: {
  meetingTitle?: string;
  transcriptText?: string;
  organizerUserId?: string;
  meetingExternalId?: string;
  transcriptExternalId?: string;
}) {
  const now = new Date().toISOString();
  const meetingId = mkId("meeting");
  const transcriptId = mkId("transcript");

  const meetingExternalId = params?.meetingExternalId ?? `teams_demo_${Date.now()}`;
  const transcriptExternalId = params?.transcriptExternalId ?? `transcript_demo_${Date.now()}`;

  state.meetings.push({
    id: meetingId,
    title: params?.meetingTitle ?? "Teams Demo Transcript Meeting",
    source_kind: "teams_internal",
    organizer_user_id: params?.organizerUserId ?? "demo.teams.organizer",
    created: now
  });

  const transcriptText =
    params?.transcriptText ??
    "I request that Ana prepare the sprint summary by next Tuesday. Please take care of sharing it with operations.";

  state.transcripts.push({
    id: transcriptId,
    meeting_id: meetingId,
    source_kind: "teams_internal",
    external_id: transcriptExternalId,
    normalized_text: transcriptText,
    created: now
  });

  state.seeded = true;

  return {
    meetingId,
    transcriptId,
    meetingExternalId,
    transcriptExternalId,
    transcriptLength: transcriptText.length
  };
}

export function getDemoMeetings() {
  return [...state.meetings];
}

export function getDemoReviewItems() {
  return state.candidates.filter((item) => item.status === "requires_review");
}

export function getDemoTasks() {
  return [...state.tasks].sort((a, b) => a.due_date.localeCompare(b.due_date));
}

export function approveDemoCandidate(params: {
  candidateId: string;
  responsibleUserId: string;
  requesterUserId: string;
  dueDate: string;
}) {
  const candidate = state.candidates.find((c) => c.id === params.candidateId);
  if (!candidate) throw new Error("Candidate not found");

  candidate.proposed_responsible_user_id = params.responsibleUserId;
  candidate.proposed_requester_user_id = params.requesterUserId;
  candidate.due_date = params.dueDate;
  candidate.status = "approved";
  candidate.validation_required = false;

  const task: DemoTask = {
    id: mkId("task"),
    meeting_id: candidate.meeting_id,
    task_candidate_id: candidate.id,
    title: candidate.title,
    description: candidate.description,
    source_excerpt: candidate.source_excerpt,
    responsible_user_id: params.responsibleUserId,
    requester_user_id: params.requesterUserId,
    due_date: params.dueDate,
    status: "pending",
    created: new Date().toISOString(),
    completed_at: null
  };

  state.tasks.push(task);

  return task;
}

export function rejectDemoCandidate(candidateId: string) {
  const candidate = state.candidates.find((c) => c.id === candidateId);
  if (!candidate) throw new Error("Candidate not found");
  candidate.status = "rejected";
  candidate.validation_required = false;
  return candidate;
}

export function updateDemoTaskStatus(taskId: string, status: TaskLifecycleStatus) {
  const task = state.tasks.find((t) => t.id === taskId);
  if (!task) throw new Error("Task not found");

  task.status = status;
  task.completed_at = status === "completed" ? new Date().toISOString() : null;
  return task;
}

export function runDemoReminders() {
  const today = new Date().toISOString().slice(0, 10);
  let remindersSent = 0;
  let overdueMarked = 0;

  for (const task of state.tasks) {
    if (task.status === "completed") continue;

    if (task.due_date < today && task.status !== "overdue") {
      task.status = "overdue";
      overdueMarked += 1;
    }

    if (task.due_date <= today) remindersSent += 1;
  }

  return { remindersSent, overdueMarked, scanned: state.tasks.length };
}

export function addDemoInpersonMeeting(meetingTitle: string) {
  const now = new Date().toISOString();
  const meetingId = mkId("meeting");
  const transcriptId = mkId("transcript");

  state.meetings.push({
    id: meetingId,
    title: meetingTitle,
    source_kind: "in_person_recording",
    organizer_user_id: "demo.local.user",
    created: now
  });

  state.transcripts.push({
    id: transcriptId,
    meeting_id: meetingId,
    source_kind: "in_person_recording",
    normalized_text: "You need to deliver the prototype notes by Monday.",
    created: now
  });

  const candidate = {
    id: mkId("candidate"),
    meeting_id: meetingId,
    transcript_id: transcriptId,
    title: "Deliver prototype notes",
    description: "Share prototype notes from in-person discussion.",
    source_excerpt: "You need to deliver the prototype notes by Monday.",
    proposed_responsible_user_id: "dev.owner",
    proposed_requester_user_id: "demo.local.user",
    due_date: daysFromToday(3),
    confidence_score: 0.62,
    validation_required: true,
    status: "requires_review" as const,
    ambiguity_reasons: ["due_date_relative_expression"],
    created: now
  };

  state.candidates.push(candidate);

  return { meetingId, transcriptId, candidateId: candidate.id };
}
