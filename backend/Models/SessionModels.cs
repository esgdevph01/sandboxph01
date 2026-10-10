using System;
using System.Collections.Generic;

namespace JanisonAssessment.Backend.Models
{
    public enum SessionStatus
    {
        NotStarted = 0,
        InProgress = 1,
        Submitted = 2,
        Graded = 3,
        Expired = 4
    }

    public class CandidateAnswer
    {
        public string QuestionId { get; set; } = string.Empty;
        public List<string> SelectedOptionIds { get; set; } = new List<string>();
        public string TextResponse { get; set; } = string.Empty;
        public bool IsFlaggedForReview { get; set; } = false;
        public int TimeSpentSeconds { get; set; } = 0;
        public DateTime LastSavedAt { get; set; } = DateTime.UtcNow;
        public double? AwardedPoints { get; set; }
        public string ManualFeedback { get; set; } = string.Empty;
        public bool IsGraded { get; set; } = false;
    }

    public class ProctoringEvent
    {
        public string Id { get; set; } = Guid.NewGuid().ToString("N").Substring(0, 8);
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public string EventType { get; set; } = "HEARTBEAT"; // TAB_BLUR, FULLSCREEN_EXIT, KEY_COMBINATION, HEARTBEAT, RESUME
        public string Severity { get; set; } = "Low"; // Low, Medium, High
        public string Details { get; set; } = string.Empty;
    }

    public class TopicPerformance
    {
        public string Topic { get; set; } = string.Empty;
        public double EarnedPoints { get; set; }
        public double TotalPoints { get; set; }
        public double Percentage => TotalPoints > 0 ? Math.Round((EarnedPoints / TotalPoints) * 100, 1) : 0;
    }

    public class CandidateSession
    {
        public string SessionId { get; set; } = Guid.NewGuid().ToString("N");
        public string AssessmentId { get; set; } = string.Empty;
        public string CandidateName { get; set; } = "Candidate User";
        public string CandidateEmail { get; set; } = "candidate@assessment.org";
        public string CandidateRegistrationId { get; set; } = "JAN-" + new Random().Next(100000, 999999);
        public DateTime StartTime { get; set; } = DateTime.UtcNow;
        public DateTime? EndTime { get; set; }
        public DateTime ExpiresAt { get; set; }
        public SessionStatus Status { get; set; } = SessionStatus.InProgress;
        public int CurrentQuestionIndex { get; set; } = 0;
        
        // Keyed by QuestionId
        public Dictionary<string, CandidateAnswer> Answers { get; set; } = new Dictionary<string, CandidateAnswer>();
        public List<ProctoringEvent> ProctoringEvents { get; set; } = new List<ProctoringEvent>();
        
        public double IntegrityScore { get; set; } = 100.0;
        public double TotalScore { get; set; } = 0.0;
        public double MaxPossibleScore { get; set; } = 0.0;
        public double ScorePercentage { get; set; } = 0.0;
        public bool Passed { get; set; } = false;
        public Dictionary<string, TopicPerformance> TopicScores { get; set; } = new Dictionary<string, TopicPerformance>();
        public string ExaminerSummaryNotes { get; set; } = string.Empty;
    }

    public class StartSessionRequest
    {
        public string AssessmentId { get; set; } = string.Empty;
        public string CandidateName { get; set; } = string.Empty;
        public string CandidateEmail { get; set; } = string.Empty;
    }

    public class SaveAnswerRequest
    {
        public string QuestionId { get; set; } = string.Empty;
        public List<string> SelectedOptionIds { get; set; } = new List<string>();
        public string TextResponse { get; set; } = string.Empty;
        public bool IsFlaggedForReview { get; set; }
        public int TimeSpentSeconds { get; set; }
    }

    public class ProctoringEventRequest
    {
        public string EventType { get; set; } = string.Empty;
        public string Severity { get; set; } = "Low";
        public string Details { get; set; } = string.Empty;
    }

    public class ManualGradeRequest
    {
        public string QuestionId { get; set; } = string.Empty;
        public double AwardedPoints { get; set; }
        public string Feedback { get; set; } = string.Empty;
    }
}
