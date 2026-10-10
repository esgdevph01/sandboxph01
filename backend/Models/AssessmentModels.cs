using System;
using System.Collections.Generic;

namespace JanisonAssessment.Backend.Models
{
    public enum QuestionType
    {
        SingleChoice = 1,
        MultipleSelect = 2,
        ShortAnswer = 3,
        Essay = 4,
        CodeAnalysis = 5
    }

    public class QuestionOption
    {
        public string Id { get; set; } = Guid.NewGuid().ToString("N").Substring(0, 8);
        public string Text { get; set; } = string.Empty;
        public string Explanation { get; set; } = string.Empty;
    }

    public class RubricCriterion
    {
        public string Id { get; set; } = Guid.NewGuid().ToString("N").Substring(0, 8);
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int MaxPoints { get; set; }
    }

    public class QuestionItem
    {
        public string Id { get; set; } = Guid.NewGuid().ToString("N").Substring(0, 8);
        public string AssessmentId { get; set; } = string.Empty;
        public string SectionId { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Prompt { get; set; } = string.Empty;
        public string StimulusContext { get; set; } = string.Empty;
        public string CodeSnippet { get; set; } = string.Empty;
        public string CodeLanguage { get; set; } = string.Empty;
        public QuestionType Type { get; set; } = QuestionType.SingleChoice;
        public List<QuestionOption> Options { get; set; } = new List<QuestionOption>();
        public List<string> CorrectOptionIds { get; set; } = new List<string>();
        public string ModelAnswer { get; set; } = string.Empty;
        public List<RubricCriterion> RubricCriteria { get; set; } = new List<RubricCriterion>();
        public int Points { get; set; } = 10;
        public string Difficulty { get; set; } = "Medium"; // Easy, Medium, Hard
        public string DomainTopic { get; set; } = "General";
        public string BloomsTaxonomy { get; set; } = "Understanding";
    }

    public class AssessmentSection
    {
        public string Id { get; set; } = Guid.NewGuid().ToString("N").Substring(0, 8);
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int OrderIndex { get; set; }
    }

    public class Assessment
    {
        public string Id { get; set; } = Guid.NewGuid().ToString("N").Substring(0, 8);
        public string Title { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Category { get; set; } = "Digital Technologies";
        public int DurationMinutes { get; set; } = 45;
        public double PassingScorePercentage { get; set; } = 70.0;
        public bool RandomizeQuestions { get; set; } = false;
        public bool StrictProctoringEnabled { get; set; } = true;
        public bool AllowCalculator { get; set; } = true;
        public bool AllowReviewBeforeSubmit { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public List<AssessmentSection> Sections { get; set; } = new List<AssessmentSection>();
        public List<QuestionItem> Questions { get; set; } = new List<QuestionItem>();
    }
}
