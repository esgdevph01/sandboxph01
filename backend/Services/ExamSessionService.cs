using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using JanisonAssessment.Backend.Models;

namespace JanisonAssessment.Backend.Services
{
    public interface IExamSessionService
    {
        CandidateSession StartSession(StartSessionRequest request);
        CandidateSession GetSession(string sessionId);
        IEnumerable<CandidateSession> GetAllSessions();
        CandidateSession SaveAnswer(string sessionId, SaveAnswerRequest request);
        CandidateSession LogProctoringEvent(string sessionId, ProctoringEventRequest request);
        CandidateSession SubmitExam(string sessionId);
        CandidateSession ManualGrade(string sessionId, ManualGradeRequest request);
    }

    public class ExamSessionService : IExamSessionService
    {
        private readonly ConcurrentDictionary<string, CandidateSession> _sessions = new ConcurrentDictionary<string, CandidateSession>();
        private readonly IAssessmentRepository _assessmentRepo;
        private readonly GradingEngine _gradingEngine;

        public ExamSessionService(IAssessmentRepository assessmentRepo, GradingEngine gradingEngine)
        {
            _assessmentRepo = assessmentRepo;
            _gradingEngine = gradingEngine;
            SeedSimulatedSessions();
        }

        public CandidateSession StartSession(StartSessionRequest request)
        {
            var assessment = _assessmentRepo.GetAssessmentById(request.AssessmentId);
            if (assessment == null)
            {
                throw new ArgumentException($"Assessment {request.AssessmentId} not found.");
            }

            var session = new CandidateSession
            {
                SessionId = Guid.NewGuid().ToString("N"),
                AssessmentId = assessment.Id,
                CandidateName = string.IsNullOrWhiteSpace(request.CandidateName) ? "Alice Chen" : request.CandidateName,
                CandidateEmail = string.IsNullOrWhiteSpace(request.CandidateEmail) ? "alice.chen@example.edu" : request.CandidateEmail,
                CandidateRegistrationId = "JAN-" + new Random().Next(100000, 999999),
                StartTime = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddMinutes(assessment.DurationMinutes),
                Status = SessionStatus.InProgress,
                CurrentQuestionIndex = 0,
                IntegrityScore = 100.0,
                Answers = new Dictionary<string, CandidateAnswer>()
            };

            // Initialize placeholder answers
            foreach (var q in assessment.Questions)
            {
                session.Answers[q.Id] = new CandidateAnswer
                {
                    QuestionId = q.Id,
                    SelectedOptionIds = new List<string>(),
                    TextResponse = string.Empty,
                    IsFlaggedForReview = false,
                    TimeSpentSeconds = 0
                };
            }

            _sessions[session.SessionId] = session;
            return session;
        }

        public CandidateSession GetSession(string sessionId)
        {
            _sessions.TryGetValue(sessionId, out var session);
            return session;
        }

        public IEnumerable<CandidateSession> GetAllSessions()
        {
            return _sessions.Values.OrderByDescending(s => s.StartTime).ToList();
        }

        public CandidateSession SaveAnswer(string sessionId, SaveAnswerRequest request)
        {
            if (!_sessions.TryGetValue(sessionId, out var session))
            {
                return null;
            }

            if (session.Status != SessionStatus.InProgress)
            {
                return session; // Locked once submitted
            }

            if (!session.Answers.TryGetValue(request.QuestionId, out var answer))
            {
                answer = new CandidateAnswer { QuestionId = request.QuestionId };
                session.Answers[request.QuestionId] = answer;
            }

            answer.SelectedOptionIds = request.SelectedOptionIds ?? new List<string>();
            answer.TextResponse = request.TextResponse ?? string.Empty;
            answer.IsFlaggedForReview = request.IsFlaggedForReview;
            answer.TimeSpentSeconds += request.TimeSpentSeconds;
            answer.LastSavedAt = DateTime.UtcNow;

            return session;
        }

        public CandidateSession LogProctoringEvent(string sessionId, ProctoringEventRequest request)
        {
            if (!_sessions.TryGetValue(sessionId, out var session))
            {
                return null;
            }

            var evt = new ProctoringEvent
            {
                EventType = request.EventType,
                Severity = request.Severity,
                Details = request.Details,
                Timestamp = DateTime.UtcNow
            };

            session.ProctoringEvents.Add(evt);
            session.IntegrityScore = _gradingEngine.CalculateIntegrityScore(session.ProctoringEvents);

            return session;
        }

        public CandidateSession SubmitExam(string sessionId)
        {
            if (!_sessions.TryGetValue(sessionId, out var session))
            {
                return null;
            }

            var assessment = _assessmentRepo.GetAssessmentById(session.AssessmentId);
            if (assessment == null)
            {
                return session;
            }

            session.Status = SessionStatus.Submitted;
            session.EndTime = DateTime.UtcNow;

            // Run automated grading
            _gradingEngine.EvaluateSession(session, assessment);

            // If no essay question requires review, mark as graded
            bool hasUngraded = session.Answers.Values.Any(a => !a.IsGraded);
            if (!hasUngraded)
            {
                session.Status = SessionStatus.Graded;
            }

            return session;
        }

        public CandidateSession ManualGrade(string sessionId, ManualGradeRequest request)
        {
            if (!_sessions.TryGetValue(sessionId, out var session))
            {
                return null;
            }

            var assessment = _assessmentRepo.GetAssessmentById(session.AssessmentId);
            if (assessment == null) return session;

            if (session.Answers.TryGetValue(request.QuestionId, out var ans))
            {
                ans.AwardedPoints = request.AwardedPoints;
                ans.ManualFeedback = request.Feedback;
                ans.IsGraded = true;
            }

            // Re-evaluate totals
            _gradingEngine.EvaluateSession(session, assessment);

            bool allGraded = session.Answers.Values.All(a => a.IsGraded);
            if (allGraded)
            {
                session.Status = SessionStatus.Graded;
            }

            return session;
        }

        private void SeedSimulatedSessions()
        {
            // Seed a few past candidate sessions for rich Proctoring & Analytics views
            var assessment = _assessmentRepo.GetAssessmentById("icas-dt-2026");
            if (assessment == null) return;

            // Session 1: High Achiever
            var s1 = new CandidateSession
            {
                SessionId = "demo-session-high",
                AssessmentId = assessment.Id,
                CandidateName = "Dr. Maya Lin",
                CandidateEmail = "maya.lin@sydney.edu.au",
                CandidateRegistrationId = "JAN-884102",
                StartTime = DateTime.UtcNow.AddHours(-3),
                EndTime = DateTime.UtcNow.AddHours(-2).AddMinutes(-30),
                ExpiresAt = DateTime.UtcNow.AddHours(-2),
                Status = SessionStatus.Graded,
                IntegrityScore = 100.0,
                TotalScore = 80.0,
                MaxPossibleScore = 90.0,
                ScorePercentage = 88.9,
                Passed = true,
                Answers = new Dictionary<string, CandidateAnswer>
                {
                    ["q-icas-1"] = new CandidateAnswer { QuestionId = "q-icas-1", SelectedOptionIds = new List<string> { "opt-1b" }, AwardedPoints = 10, IsGraded = true },
                    ["q-icas-2"] = new CandidateAnswer { QuestionId = "q-icas-2", TextResponse = "3", AwardedPoints = 15, IsGraded = true },
                    ["q-icas-3"] = new CandidateAnswer { QuestionId = "q-icas-3", SelectedOptionIds = new List<string> { "opt-3b", "opt-3c" }, AwardedPoints = 15, IsGraded = true },
                    ["q-icas-4"] = new CandidateAnswer { QuestionId = "q-icas-4", SelectedOptionIds = new List<string> { "opt-4b" }, AwardedPoints = 10, IsGraded = true },
                    ["q-icas-5"] = new CandidateAnswer { QuestionId = "q-icas-5", SelectedOptionIds = new List<string> { "opt-5b" }, AwardedPoints = 15, IsGraded = true },
                    ["q-icas-6"] = new CandidateAnswer { QuestionId = "q-icas-6", TextResponse = "Architecture employs IndexedDB client cache with SHA256 integrity signatures...", AwardedPoints = 22, IsGraded = true, ManualFeedback = "Superb depth on monotonic sequence ordering and offline resilience." }
                },
                ProctoringEvents = new List<ProctoringEvent>
                {
                    new ProctoringEvent { EventType = "FULLSCREEN_ENTER", Severity = "Low", Details = "Candidate engaged locked fullscreen mode", Timestamp = DateTime.UtcNow.AddHours(-3) },
                    new ProctoringEvent { EventType = "HEARTBEAT", Severity = "Low", Details = "Proctor telemetry stream stable. Ping 24ms.", Timestamp = DateTime.UtcNow.AddHours(-2).AddMinutes(-45) }
                }
            };
            _sessions[s1.SessionId] = s1;

            // Session 2: Proctoring Flagged / Under Review
            var s2 = new CandidateSession
            {
                SessionId = "demo-session-flagged",
                AssessmentId = assessment.Id,
                CandidateName = "Marcus Vance",
                CandidateEmail = "m.vance@techcorp.io",
                CandidateRegistrationId = "JAN-219403",
                StartTime = DateTime.UtcNow.AddHours(-1),
                EndTime = DateTime.UtcNow.AddMinutes(-20),
                ExpiresAt = DateTime.UtcNow,
                Status = SessionStatus.Submitted, // Needs essay review
                IntegrityScore = 78.0, // Penalized
                TotalScore = 45.0,
                MaxPossibleScore = 90.0,
                ScorePercentage = 50.0,
                Passed = false,
                Answers = new Dictionary<string, CandidateAnswer>
                {
                    ["q-icas-1"] = new CandidateAnswer { QuestionId = "q-icas-1", SelectedOptionIds = new List<string> { "opt-1b" }, AwardedPoints = 10, IsGraded = true },
                    ["q-icas-2"] = new CandidateAnswer { QuestionId = "q-icas-2", TextResponse = "2", AwardedPoints = 0, IsGraded = true },
                    ["q-icas-3"] = new CandidateAnswer { QuestionId = "q-icas-3", SelectedOptionIds = new List<string> { "opt-3a" }, AwardedPoints = 0, IsGraded = true },
                    ["q-icas-4"] = new CandidateAnswer { QuestionId = "q-icas-4", SelectedOptionIds = new List<string> { "opt-4b" }, AwardedPoints = 10, IsGraded = true },
                    ["q-icas-5"] = new CandidateAnswer { QuestionId = "q-icas-5", SelectedOptionIds = new List<string> { "opt-5b" }, AwardedPoints = 15, IsGraded = true },
                    ["q-icas-6"] = new CandidateAnswer { QuestionId = "q-icas-6", TextResponse = "We can just send requests over web sockets and retry if network fails.", AwardedPoints = null, IsGraded = false }
                },
                ProctoringEvents = new List<ProctoringEvent>
                {
                    new ProctoringEvent { EventType = "TAB_BLUR", Severity = "Medium", Details = "Window focus lost. Alt-Tab detected to external application.", Timestamp = DateTime.UtcNow.AddMinutes(-48) },
                    new ProctoringEvent { EventType = "FULLSCREEN_EXIT", Severity = "High", Details = "Candidate pressed Escape and left secured fullscreen layout.", Timestamp = DateTime.UtcNow.AddMinutes(-42) },
                    new ProctoringEvent { EventType = "TAB_BLUR", Severity = "Medium", Details = "Browser tab switch detected for 14 seconds.", Timestamp = DateTime.UtcNow.AddMinutes(-30) }
                }
            };
            _sessions[s2.SessionId] = s2;
        }
    }
}
