export enum QuestionType {
  SingleChoice = 1,
  MultipleSelect = 2,
  ShortAnswer = 3,
  Essay = 4,
  CodeAnalysis = 5
}

export interface QuestionOption {
  id: string;
  text: string;
  explanation?: string;
}

export interface RubricCriterion {
  id: string;
  name: string;
  description: string;
  maxPoints: number;
}

export interface QuestionItem {
  id: string;
  assessmentId: string;
  sectionId: string;
  title: string;
  prompt: string;
  stimulusContext?: string;
  codeSnippet?: string;
  codeLanguage?: string;
  type: QuestionType;
  options: QuestionOption[];
  correctOptionIds?: string[];
  modelAnswer?: string;
  rubricCriteria?: RubricCriterion[];
  points: number;
  difficulty: string; // Easy, Medium, Hard
  domainTopic: string;
  bloomsTaxonomy: string;
}

export interface AssessmentSection {
  id: string;
  title: string;
  description?: string;
  orderIndex: number;
}

export interface Assessment {
  id: string;
  title: string;
  code: string;
  description: string;
  category: string;
  durationMinutes: number;
  passingScorePercentage: number;
  randomizeQuestions: boolean;
  strictProctoringEnabled: boolean;
  allowCalculator: boolean;
  allowReviewBeforeSubmit: boolean;
  createdAt: string;
  sections: AssessmentSection[];
  questions: QuestionItem[];
}

export interface CandidateAnswer {
  questionId: string;
  selectedOptionIds: string[];
  textResponse: string;
  isFlaggedForReview: boolean;
  timeSpentSeconds: number;
  lastSavedAt?: string;
  awardedPoints?: number | null;
  manualFeedback?: string;
  isGraded?: boolean;
}

export interface ProctoringEvent {
  id: string;
  timestamp: string;
  eventType: string; // TAB_BLUR, FULLSCREEN_EXIT, KEY_COMBINATION, HEARTBEAT, FULLSCREEN_ENTER
  severity: 'Low' | 'Medium' | 'High';
  details: string;
}

export interface TopicPerformance {
  topic: string;
  earnedPoints: number;
  totalPoints: number;
  percentage: number;
}

export interface CandidateSession {
  sessionId: string;
  assessmentId: string;
  candidateName: string;
  candidateEmail: string;
  candidateRegistrationId: string;
  startTime: string;
  endTime?: string;
  expiresAt: string;
  status: 0 | 1 | 2 | 3 | 4; // 0=NotStarted, 1=InProgress, 2=Submitted, 3=Graded, 4=Expired
  currentQuestionIndex: number;
  answers: { [questionId: string]: CandidateAnswer };
  proctoringEvents: ProctoringEvent[];
  integrityScore: number;
  totalScore: number;
  maxPossibleScore: number;
  scorePercentage: number;
  passed: boolean;
  topicScores?: { [topic: string]: TopicPerformance };
  examinerSummaryNotes?: string;
}

export interface StartSessionRequest {
  assessmentId: string;
  candidateName: string;
  candidateEmail: string;
}

export interface SaveAnswerRequest {
  questionId: string;
  selectedOptionIds: string[];
  textResponse: string;
  isFlaggedForReview: boolean;
  timeSpentSeconds: number;
}

export interface ProctoringEventRequest {
  eventType: string;
  severity: string;
  details: string;
}

export interface ManualGradeRequest {
  questionId: string;
  awardedPoints: number;
  feedback: string;
}

export interface CompetencyMetric {
  competency: string;
  averageMastery: number;
  totalAssessedQuestions: number;
}

export interface ItemAnalytics {
  questionId: string;
  title: string;
  topic: string;
  facilityIndex: number;
  discriminationIndex: number;
  attemptsCount: number;
  averageTimeSeconds: number;
}

export interface AnalyticsSummary {
  totalAssessments: number;
  totalCandidatesCompleted: number;
  overallPassRate: number;
  averageScorePercentage: number;
  averageIntegrityIndex: number;
  flaggedSecurityIncidents: number;
  competencyBreakdown: CompetencyMetric[];
  itemDiagnostics: ItemAnalytics[];
}
