using System.Collections.Generic;

namespace JanisonAssessment.Backend.Models
{
    public class CompetencyMetric
    {
        public string Competency { get; set; } = string.Empty;
        public double AverageMastery { get; set; }
        public int TotalAssessedQuestions { get; set; }
    }

    public class ItemAnalytics
    {
        public string QuestionId { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Topic { get; set; } = string.Empty;
        public double FacilityIndex { get; set; } // % of candidates who got it right
        public double DiscriminationIndex { get; set; } // Correlation between item score and total score
        public int AttemptsCount { get; set; }
        public int AverageTimeSeconds { get; set; }
    }

    public class AnalyticsSummary
    {
        public int TotalAssessments { get; set; }
        public int TotalCandidatesCompleted { get; set; }
        public double OverallPassRate { get; set; }
        public double AverageScorePercentage { get; set; }
        public double AverageIntegrityIndex { get; set; }
        public int FlaggedSecurityIncidents { get; set; }
        public List<CompetencyMetric> CompetencyBreakdown { get; set; } = new List<CompetencyMetric>();
        public List<ItemAnalytics> ItemDiagnostics { get; set; } = new List<ItemAnalytics>();
    }
}
