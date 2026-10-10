using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using JanisonAssessment.Backend.Models;

namespace JanisonAssessment.Backend.Services
{
    public interface IAssessmentRepository
    {
        IEnumerable<Assessment> GetAllAssessments();
        Assessment GetAssessmentById(string id);
        Assessment CreateAssessment(Assessment assessment);
        bool DeleteAssessment(string id);
        QuestionItem AddQuestion(string assessmentId, QuestionItem question);
    }

    public class AssessmentRepository : IAssessmentRepository
    {
        private readonly ConcurrentDictionary<string, Assessment> _assessments = new ConcurrentDictionary<string, Assessment>();

        public AssessmentRepository()
        {
            SeedInitialAssessments();
        }

        public IEnumerable<Assessment> GetAllAssessments()
        {
            return _assessments.Values.ToList();
        }

        public Assessment GetAssessmentById(string id)
        {
            _assessments.TryGetValue(id, out var assessment);
            return assessment;
        }

        public Assessment CreateAssessment(Assessment assessment)
        {
            if (string.IsNullOrWhiteSpace(assessment.Id))
            {
                assessment.Id = Guid.NewGuid().ToString("N").Substring(0, 8);
            }
            _assessments[assessment.Id] = assessment;
            return assessment;
        }

        public bool DeleteAssessment(string id)
        {
            return _assessments.TryRemove(id, out _);
        }

        public QuestionItem AddQuestion(string assessmentId, QuestionItem question)
        {
            if (_assessments.TryGetValue(assessmentId, out var assessment))
            {
                if (string.IsNullOrWhiteSpace(question.Id))
                {
                    question.Id = Guid.NewGuid().ToString("N").Substring(0, 8);
                }
                question.AssessmentId = assessmentId;
                assessment.Questions.Add(question);
                return question;
            }
            return null;
        }

        private void SeedInitialAssessments()
        {
            // 1. Janison Benchmark: ICAS International Digital Technologies & Computational Thinking
            var icas = new Assessment
            {
                Id = "icas-dt-2026",
                Code = "ICAS-DT-L8",
                Title = "ICAS International Digital Technologies & Computational Thinking",
                Description = "Official digital competency assessment benchmark developed for standardized evaluation of algorithmic reasoning, cyber security hygiene, database structures, and digital systems analysis.",
                Category = "Computational Thinking & STEM",
                DurationMinutes = 35,
                PassingScorePercentage = 70.0,
                RandomizeQuestions = false,
                StrictProctoringEnabled = true,
                AllowCalculator = true,
                AllowReviewBeforeSubmit = true,
                Sections = new List<AssessmentSection>
                {
                    new AssessmentSection { Id = "sec-algo", Title = "Section 1: Algorithmic Logic & Flow", OrderIndex = 1 },
                    new AssessmentSection { Id = "sec-data", Title = "Section 2: Data Structures & Query Analysis", OrderIndex = 2 },
                    new AssessmentSection { Id = "sec-sec", Title = "Section 3: Security & Digital Ethics", OrderIndex = 3 }
                }
            };

            icas.Questions = new List<QuestionItem>
            {
                new QuestionItem
                {
                    Id = "q-icas-1",
                    AssessmentId = icas.Id,
                    SectionId = "sec-algo",
                    Title = "Time Complexity of Binary Search Trees",
                    StimulusContext = "A software engineering team is evaluating an index lookup algorithm for candidate records. The index tree is currently balanced.",
                    Prompt = "Given an AVL self-balancing binary search tree holding N unique student records, what is the worst-case time complexity of retrieving a specific candidate by their unique National ID?",
                    Type = QuestionType.SingleChoice,
                    Points = 10,
                    Difficulty = "Medium",
                    DomainTopic = "Algorithms",
                    BloomsTaxonomy = "Analyzing",
                    Options = new List<QuestionOption>
                    {
                        new QuestionOption { Id = "opt-1a", Text = "O(1) - Constant execution time regardless of tree depth", Explanation = "Constant time is typical for hash maps with ideal hashing, not binary trees." },
                        new QuestionOption { Id = "opt-1b", Text = "O(log N) - Logarithmic bound maintained by automatic rotations", Explanation = "Correct. AVL trees maintain balance factor [-1, 0, 1] ensuring height is strictly O(log N)." },
                        new QuestionOption { Id = "opt-1c", Text = "O(N) - Linear degradation due to unbalanced branch skew", Explanation = "Unbalanced BSTs can degenerate to O(N), but AVL trees strictly prohibit skew." },
                        new QuestionOption { Id = "opt-1d", Text = "O(N log N) - Log-linear traversal across adjacent leaves", Explanation = "This complexity corresponds to sorting, not single element retrieval." }
                    },
                    CorrectOptionIds = new List<string> { "opt-1b" }
                },
                new QuestionItem
                {
                    Id = "q-icas-2",
                    AssessmentId = icas.Id,
                    SectionId = "sec-algo",
                    Title = "Pseudocode Trace & State Invariant",
                    StimulusContext = "Review the following algorithmic routine designed to process a sequence of telemetry packet timestamps.",
                    CodeLanguage = "csharp",
                    CodeSnippet = @"int ProcessDeltas(int[] packets) {
    int maxGap = 0;
    int currentRun = 0;
    for (int i = 1; i < packets.Length; i++) {
        int diff = packets[i] - packets[i - 1];
        if (diff > 5) {
            currentRun++;
            if (currentRun > maxGap) maxGap = currentRun;
        } else {
            currentRun = 0;
        }
    }
    return maxGap;
}",
                    Prompt = "If the input array `packets` contains values `[10, 12, 20, 28, 35, 37, 45, 52]`, what integer value is returned by `ProcessDeltas`?",
                    Type = QuestionType.ShortAnswer,
                    Points = 15,
                    Difficulty = "Hard",
                    DomainTopic = "Algorithms",
                    BloomsTaxonomy = "Evaluating",
                    ModelAnswer = "3",
                    CorrectOptionIds = new List<string>()
                },
                new QuestionItem
                {
                    Id = "q-icas-3",
                    AssessmentId = icas.Id,
                    SectionId = "sec-data",
                    Title = "Relational ACID Properties & Isolation",
                    StimulusContext = "An online examination engine records hundreds of simultaneous candidate submissions.",
                    Prompt = "Select ALL anomalies that can occur under the 'Read Committed' transaction isolation level in a relational database engine.",
                    Type = QuestionType.MultipleSelect,
                    Points = 15,
                    Difficulty = "Medium",
                    DomainTopic = "Database",
                    BloomsTaxonomy = "Analyzing",
                    Options = new List<QuestionOption>
                    {
                        new QuestionOption { Id = "opt-3a", Text = "Dirty Read (Reading uncommitted modifications made by another concurrent transaction)", Explanation = "Dirty reads are prohibited at Read Committed level." },
                        new QuestionOption { Id = "opt-3b", Text = "Non-Repeatable Read (Rereading data reveals modifications committed by concurrent transactions)", Explanation = "Permitted under Read Committed because row locks are released immediately after read." },
                        new QuestionOption { Id = "opt-3c", Text = "Phantom Read (Concurrent transaction inserts rows satisfying search predicate)", Explanation = "Permitted under Read Committed; prevented only at Serializable or Repeatable Read (with range locks)." },
                        new QuestionOption { Id = "opt-3d", Text = "Corrupt Write (Concurrent transaction overwrites without atomicity)", Explanation = "Write atomicity is strictly enforced at all isolation levels." }
                    },
                    CorrectOptionIds = new List<string> { "opt-3b", "opt-3c" }
                },
                new QuestionItem
                {
                    Id = "q-icas-4",
                    AssessmentId = icas.Id,
                    SectionId = "sec-sec",
                    Title = "Zero-Trust Architecture & Token Verification",
                    StimulusContext = "An e-Assessment remote proctoring system communicates between student browser clients and edge verification microservices.",
                    Prompt = "Which mechanism provides the highest integrity guarantee against man-in-the-middle tampering of candidate exam telemetry payloads in transit?",
                    Type = QuestionType.SingleChoice,
                    Points = 10,
                    Difficulty = "Easy",
                    DomainTopic = "Security",
                    BloomsTaxonomy = "Remembering",
                    Options = new List<QuestionOption>
                    {
                        new QuestionOption { Id = "opt-4a", Text = "Base64 payload encoding with client-side hashing", Explanation = "Base64 is simple encoding without cryptographic secrecy or authenticity." },
                        new QuestionOption { Id = "opt-4b", Text = "mTLS (Mutual Transport Layer Security) with asymmetric HMAC payload signature", Explanation = "mTLS authenticates both client and server certificates and HMAC cryptographically guarantees tamper detection." },
                        new QuestionOption { Id = "opt-4c", Text = "CORS header allowlisting with wildcard origin", Explanation = "Wildcard CORS actually relaxes cross-origin protections." },
                        new QuestionOption { Id = "opt-4d", Text = "Basic Authentication credentials cached in local storage", Explanation = "Basic auth sent in plaintext and stored locally is vulnerable to XSS extraction." }
                    },
                    CorrectOptionIds = new List<string> { "opt-4b" }
                },
                new QuestionItem
                {
                    Id = "q-icas-5",
                    AssessmentId = icas.Id,
                    SectionId = "sec-data",
                    Title = "SQL Index Optimization Strategy",
                    StimulusContext = "Examine the following database schema and candidate assessment submission query:",
                    CodeLanguage = "sql",
                    CodeSnippet = @"-- Query executed 50,000 times during national test release:
SELECT s.SessionId, s.CandidateName, s.ScorePercentage
FROM CandidateSessions s
WHERE s.AssessmentId = 'icas-dt-2026'
  AND s.Status = 'Submitted'
ORDER BY s.ScorePercentage DESC;",
                    Prompt = "Which composite index on `CandidateSessions` will maximize index-seek efficiency and avoid costly sort operations?",
                    Type = QuestionType.SingleChoice,
                    Points = 15,
                    Difficulty = "Hard",
                    DomainTopic = "Database",
                    BloomsTaxonomy = "Evaluating",
                    Options = new List<QuestionOption>
                    {
                        new QuestionOption { Id = "opt-5a", Text = "INDEX (ScorePercentage, AssessmentId, Status) INCLUDE (SessionId, CandidateName)", Explanation = "Leading with ScorePercentage prevents index seek on the equality filters." },
                        new QuestionOption { Id = "opt-5b", Text = "INDEX (AssessmentId, Status, ScorePercentage DESC) INCLUDE (CandidateName)", Explanation = "Correct. Filtering on equality columns first (AssessmentId, Status), followed by ordering column (ScorePercentage) enables an index seek and pre-sorted stream." },
                        new QuestionOption { Id = "opt-5c", Text = "INDEX (CandidateName, SessionId)", Explanation = "Does not index any of the filter or sorting attributes." },
                        new QuestionOption { Id = "opt-5d", Text = "Single column index on Status only", Explanation = "Low cardinality column leads to index scan rather than seek." }
                    },
                    CorrectOptionIds = new List<string> { "opt-5b" }
                },
                new QuestionItem
                {
                    Id = "q-icas-6",
                    AssessmentId = icas.Id,
                    SectionId = "sec-sec",
                    Title = "High-Stakes Online Exam Integrity Architecture",
                    StimulusContext = "You are designing the resilience architecture for a global digital exam platform accommodating 100,000 concurrent students experiencing intermittent Wi-Fi connectivity.",
                    Prompt = "Provide an architectural proposal explaining: (1) How client-side offline storage and conflict resolution should be structured, (2) How tamper-proof telemetry ensures exam fairness without penalizing transient network drops, and (3) The trade-offs between continuous WebSocket streaming versus batched idempotency.",
                    Type = QuestionType.Essay,
                    Points = 25,
                    Difficulty = "Hard",
                    DomainTopic = "System Design",
                    BloomsTaxonomy = "Creating",
                    ModelAnswer = "Expected key concepts: IndexedDB with cryptographic signing (HMAC with session nonce); optimistic local commits with exponential backoff sync; idempotent submission endpoints using UUID idempotency keys; event sequencing numbers for proctoring audit log reconciliation.",
                    RubricCriteria = new List<RubricCriterion>
                    {
                        new RubricCriterion { Id = "rub-1", Name = "Offline Sync & Conflict Resolution", Description = "Clarity on local caching (IndexedDB/CacheStorage) and monotonic version sequencing.", MaxPoints = 10 },
                        new RubricCriterion { Id = "rub-2", Name = "Telemetry & Fairness", Description = "Handling of benign network disconnects vs deliberate unplugging; heartbeat tolerance window.", MaxPoints = 8 },
                        new RubricCriterion { Id = "rub-3", Name = "Protocols & Idempotency", Description = "Evaluation of HTTP batched POST with idempotency keys vs persistent WebSocket connection.", MaxPoints = 7 }
                    }
                }
            };

            _assessments[icas.Id] = icas;

            // 2. Janison Benchmark: Cloud Architecture & High-Performance .NET Systems
            var dotnetExam = new Assessment
            {
                Id = "net-arch-2026",
                Code = "NET-ARCH-PRO",
                Title = "Enterprise .NET Framework 4.8 & Distributed Architecture Certification",
                Description = "Professional engineering assessment measuring mastery of .NET runtime mechanics, CLR memory allocation, asynchronous I/O pipelines, and scalable enterprise design patterns.",
                Category = "Software Engineering & Architecture",
                DurationMinutes = 45,
                PassingScorePercentage = 75.0,
                RandomizeQuestions = false,
                StrictProctoringEnabled = true,
                AllowCalculator = false,
                AllowReviewBeforeSubmit = true,
                Sections = new List<AssessmentSection>
                {
                    new AssessmentSection { Id = "sec-clr", Title = "CLR Internals & Garbage Collection", OrderIndex = 1 },
                    new AssessmentSection { Id = "sec-async", Title = "Asynchronous Concurrency & Threading", OrderIndex = 2 }
                },
                Questions = new List<QuestionItem>
                {
                    new QuestionItem
                    {
                        Id = "q-net-1",
                        AssessmentId = "net-arch-2026",
                        SectionId = "sec-clr",
                        Title = "Large Object Heap (LOH) Compaction & Fragmentation",
                        StimulusContext = "In high-throughput .NET Framework 4.8 services, frequent allocation of byte arrays exceeding 85,000 bytes can cause severe memory issues.",
                        Prompt = "Which CLR Garbage Collector behavior explains the risk of OutOfMemoryException even when total free physical RAM is plentiful?",
                        Type = QuestionType.SingleChoice,
                        Points = 15,
                        Difficulty = "Hard",
                        DomainTopic = "CLR & Memory",
                        BloomsTaxonomy = "Analyzing",
                        Options = new List<QuestionOption>
                        {
                            new QuestionOption { Id = "opt-net-1a", Text = "Objects above 85,000 bytes reside on the Large Object Heap (LOH) which by default is swept rather than compacted, leading to virtual address space fragmentation.", Explanation = "Correct. Historical .NET GC sweeps LOH without compacting by default, causing contiguous allocation failures." },
                            new QuestionOption { Id = "opt-net-1b", Text = "Gen 0 and Gen 1 collections do not collect objects larger than 64KB.", Explanation = "All objects >85,000 bytes directly allocate in Gen 2 (LOH), but the OOM root cause is fragmentation." },
                            new QuestionOption { Id = "opt-net-1c", Text = "The GC thread is completely suspended during high CPU periods.", Explanation = "Incorrect mechanism." },
                            new QuestionOption { Id = "opt-net-1d", Text = "Reference counters overflow on high concurrency.", Explanation = ".NET does not use reference counting; it uses a tracing garbage collector." }
                        },
                        CorrectOptionIds = new List<string> { "opt-net-1a" }
                    },
                    new QuestionItem
                    {
                        Id = "q-net-2",
                        AssessmentId = "net-arch-2026",
                        SectionId = "sec-async",
                        Title = "Async/Await SynchronizationContext Deadlock",
                        StimulusContext = "A developer in an ASP.NET / OWIN Net 4.8 application writes: `var result = GetDataAsync().Result;`",
                        Prompt = "Why can blocking synchronously on an unawaited Task (`.Result` or `.Wait()`) cause a permanent deadlock in .NET Framework?",
                        Type = QuestionType.SingleChoice,
                        Points = 15,
                        Difficulty = "Medium",
                        DomainTopic = "Async Concurrency",
                        BloomsTaxonomy = "Evaluating",
                        Options = new List<QuestionOption>
                        {
                            new QuestionOption { Id = "opt-net-2a", Text = "The Task scheduler cancels all child threads after 30 seconds.", Explanation = "Incorrect." },
                            new QuestionOption { Id = "opt-net-2b", Text = "The async method continuation captures the SynchronizationContext to resume, but the calling thread holds that single context thread waiting synchronously for the task to complete.", Explanation = "Correct! In .NET Framework, SynchronizationContext queues continuation back to the calling thread which is blocked on .Result." },
                            new QuestionOption { Id = "opt-net-2c", Text = "Garbage collector collects the Task object prematurely.", Explanation = "Active tasks are rooted until completion." },
                            new QuestionOption { Id = "opt-net-2d", Text = "Windows socket handles cannot process non-blocking callbacks.", Explanation = "Irrelevant." }
                        },
                        CorrectOptionIds = new List<string> { "opt-net-2b" }
                    }
                }
            };

            _assessments[dotnetExam.Id] = dotnetExam;
        }
    }
}
