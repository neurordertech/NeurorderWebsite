export type BoyRosSource =
  | "calendar"
  | "email"
  | "microsoft_365"
  | "google_workspace"
  | "teams"
  | "linkedin"
  | "payments"
  | "projects"
  | "research"
  | "internal";

export type BoyRosSignalKind =
  | "message"
  | "meeting"
  | "deadline"
  | "document"
  | "task"
  | "opportunity"
  | "payment"
  | "risk"
  | "progress"
  | "system";

export type BoyRosPermission =
  | "profile.read"
  | "messages.metadata.read"
  | "calendar.read"
  | "documents.metadata.read"
  | "tasks.read"
  | "activity.read"
  | "payments.summary.read"
  | "reminders.create";

export type BoyRosSignal = {
  id: string;
  userId: string;
  organisationId?: string | null;

  source: BoyRosSource;
  kind: BoyRosSignalKind;

  title: string;
  summary: string;

  occurredAt: string;
  receivedAt: string;

  importance: number;
  urgency: number;
  confidence: number;

  requiredPermissions: BoyRosPermission[];

  metadata?: Record<string, unknown>;
};

export type BoyRosIdentityContext = {
  userId: string;
  organisationId?: string | null;
  email?: string | null;
  deviceId?: string | null;
  sessionId?: string | null;
};

export type BoyRosConsentContext = {
  grantedPermissions: BoyRosPermission[];
  revokedPermissions: BoyRosPermission[];
};

export type BoyRosInput = {
  identity: BoyRosIdentityContext;
  consent: BoyRosConsentContext;
  signals: BoyRosSignal[];
};

export type BoyRosPriority =
  | "low"
  | "normal"
  | "important"
  | "urgent";

export type BoyRosResult = {
  userId: string;
  organisationId?: string | null;

  processedAt: string;
  acceptedSignalCount: number;
  rejectedSignalCount: number;

  priority: BoyRosPriority;

  observations: Array<{
    source: BoyRosSource;
    title: string;
    summary: string;
    score: number;
  }>;

  contextForOrule: {
    currentFocus: string[];
    upcomingCommitments: string[];
    possibleRisks: string[];
    possibleOpportunities: string[];
  };
};