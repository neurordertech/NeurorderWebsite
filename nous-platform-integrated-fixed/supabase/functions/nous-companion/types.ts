export type NousMode =
  | "news"
  | "calendar"
  | "education"
  | "business"
  | "personal"
  | "general";

export type NousContext = {
  title?: string;
  category?: string;
  summary?: string;
  source?: string;
  url?: string;
  metadata?: Record<string, unknown>;
};

export type NousRequestBody = {
  message?: string;
  mode?: NousMode;
  context?: NousContext | null;
  conversationId?: string | null;
};

export type NousRoute = {
  mode: NousMode;
  instructions: string;
  contextText: string;
};

export type OpenAIUsage = {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
};

export type OpenAIResult = {
  responseId: string | null;
  answer: string;
  model: string;
  usage: OpenAIUsage;
};

export type MembershipAccess = {
  planCode: string;
  dailyLimit: number;
  usedToday: number;
  remainingToday: number;
  allowed: boolean;
};

export type AuthenticatedUser = {
  id: string;
  email?: string;
};