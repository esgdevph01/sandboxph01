using System;
using System.Collections.Generic;
using System.Linq;
using JanisonAssessment.Backend.Models;

namespace JanisonAssessment.Backend.Services
{
    public class GradingEngine
    {
        public void EvaluateSession(CandidateSession session, Assessment assessment)
        {
            double totalEarned = 0;
            double maxPoints = 0;
            var topicPointsEarned = new Dictionary<string, double>();
            var topicPointsTotal = new Dictionary<string, double>();

            foreach (var q in assessment.Questions)
            {
                maxPoints += q.Points;
                if (!topicPointsTotal.ContainsKey(q.DomainTopic))
                {
                    topicPointsTotal[q.DomainTopic] = 0;
                    topicPointsEarned[q.DomainTopic] = 0;
                }
                topicPointsTotal[q.DomainTopic] += q.Points;

                session.Answers.TryGetValue(q.Id, out var ans);

                if (ans == null)
                {
                    // Unanswered
                    continue;
                }

                // Auto-grading logic
                if (q.Type == QuestionType.SingleChoice)
                {
                    bool isCorrect = ans.SelectedOptionIds != null &&
                                     ans.SelectedOptionIds.Count == 1 &&
                                     q.CorrectOptionIds.Contains(ans.SelectedOptionIds[0]);

                    ans.AwardedPoints = isCorrect ? q.Points : 0;
                    ans.IsGraded = true;
                    totalEarned += ans.AwardedPoints.Value;
                    topicPointsEarned[q.DomainTopic] += ans.AwardedPoints.Value;
                }
                else if (q.Type == QuestionType.MultipleSelect)
                {
                    var selected = (ans.SelectedOptionIds ?? new List<string>()).OrderBy(x => x).ToList();
                    var correct = (q.CorrectOptionIds ?? new List<string>()).OrderBy(x => x).ToList();

                    bool exactMatch = selected.SequenceEqual(correct);
                    if (exactMatch)
                    {
                        ans.AwardedPoints = q.Points;
                    }
                    else
                    {
                        // Partial credit: correct picks minus false picks
                        int correctSelections = selected.Count(s => correct.Contains(s));
                        int incorrectSelections = selected.Count(s => !correct.Contains(s));
                        double rawPartial = ((double)correctSelections / Math.Max(1, correct.Count)) - ((double)incorrectSelections / Math.Max(1, q.Options.Count));
                        double pointsFraction = Math.Max(0, rawPartial);
                        ans.AwardedPoints = Math.Round(pointsFraction * q.Points, 1);
                    }

                    ans.IsGraded = true;
                    totalEarned += ans.AwardedPoints.Value;
                    topicPointsEarned[q.DomainTopic] += ans.AwardedPoints.Value;
                }
                else if (q.Type == QuestionType.ShortAnswer)
                {
                    string candidateText = (ans.TextResponse ?? "").Trim().ToLowerInvariant();
                    string expected = (q.ModelAnswer ?? "").Trim().ToLowerInvariant();

                    bool isMatch = !string.IsNullOrEmpty(candidateText) && candidateText.Equals(expected, StringComparison.OrdinalIgnoreCase);
                    ans.AwardedPoints = isMatch ? q.Points : 0;
                    ans.IsGraded = true;
                    totalEarned += ans.AwardedPoints.Value;
                    topicPointsEarned[q.DomainTopic] += ans.AwardedPoints.Value;
                }
                else if (q.Type == QuestionType.Essay)
                {
                    // Subjective questions require human or rubric grading
                    if (ans.AwardedPoints.HasValue)
                    {
                        totalEarned += ans.AwardedPoints.Value;
                        topicPointsEarned[q.DomainTopic] += ans.AwardedPoints.Value;
                        ans.IsGraded = true;
                    }
                    else
                    {
                        ans.IsGraded = false; // Pending manual rubric assessment
                    }
                }
            }

            session.TotalScore = Math.Round(totalEarned, 1);
            session.MaxPossibleScore = maxPoints;
            session.ScorePercentage = maxPoints > 0 ? Math.Round((session.TotalScore / maxPoints) * 100, 1) : 0;
            session.Passed = session.ScorePercentage >= assessment.PassingScorePercentage;

            // Compute Proctoring Integrity Score
            session.IntegrityScore = CalculateIntegrityScore(session.ProctoringEvents);

            // Populate Topic Performance
            session.TopicScores = new Dictionary<string, TopicPerformance>();
            foreach (var kvp in topicPointsTotal)
            {
                var topic = kvp.Key;
                var total = kvp.Value;
                var earned = topicPointsEarned.ContainsKey(topic) ? topicPointsEarned[topic] : 0;
                session.TopicScores[topic] = new TopicPerformance
                {
                    Topic = topic,
                    EarnedPoints = earned,
                    TotalPoints = total
                };
            }
        }

        public double CalculateIntegrityScore(List<ProctoringEvent> events)
        {
            if (events == null || events.Count == 0) return 100.0;

            double score = 100.0;
            int blurEvents = events.Count(e => e.EventType == "TAB_BLUR");
            int fullscreenExits = events.Count(e => e.EventType == "FULLSCREEN_EXIT");
            int keyViolations = events.Count(e => e.EventType == "KEY_COMBINATION");

            // Deduct penalties: 5% per tab blur, 8% per fullscreen exit, 3% per suspicious key
            score -= (blurEvents * 5.0);
            score -= (fullscreenExits * 8.0);
            score -= (keyViolations * 3.0);

            return Math.Max(0.0, Math.Round(score, 1));
        }
    }
}
