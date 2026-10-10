export const mockAssessments = [
  {
    id: 'icas-cs-2026',
    title: 'ICAS Computer Science & Computational Thinking',
    code: 'ICAS-CS-01',
    description: 'Premier national digital examination evaluating algorithm analysis, systems design, and cyber safety.',
    category: 'Computational Thinking',
    durationMinutes: 60,
    passingScorePercentage: 70,
    randomizeQuestions: false,
    strictProctoringEnabled: true,
    allowCalculator: true,
    allowReviewBeforeSubmit: true,
    questions: [
      {
        id: 'q-1',
        assessmentId: 'icas-cs-2026',
        sectionId: 'sec-1',
        title: 'Asymptotic Complexity Analysis',
        prompt: 'What is the worst-case time complexity of searching in a balanced Binary Search Tree (AVL or Red-Black)?',
        type: 1, // SingleChoice
        options: [
          { id: 'opt-1', text: 'O(1) constant time' },
          { id: 'opt-2', text: 'O(log n) logarithmic time' },
          { id: 'opt-3', text: 'O(n) linear time' },
          { id: 'opt-4', text: 'O(n log n) linearithmic time' }
        ],
        correctOptionIds: ['opt-2'],
        points: 5,
        difficulty: 'Medium',
        domainTopic: 'Algorithms & Logic',
        bloomsTaxonomy: 'Analysis'
      },
      {
        id: 'q-2',
        assessmentId: 'icas-cs-2026',
        sectionId: 'sec-1',
        title: 'ACID Database Properties',
        prompt: 'Select all properties that ensure reliable processing of database transactions under ACID principles:',
        type: 2, // MultipleSelect
        options: [
          { id: 'opt-a', text: 'Atomicity' },
          { id: 'opt-b', text: 'Consistency' },
          { id: 'opt-c', text: 'Availability (CAP Theorem)' },
          { id: 'opt-d', text: 'Durability' }
        ],
        correctOptionIds: ['opt-a', 'opt-b', 'opt-d'],
        points: 5,
        difficulty: 'Medium',
        domainTopic: 'Database Systems & ACID',
        bloomsTaxonomy: 'Understanding'
      },
      {
        id: 'q-3',
        assessmentId: 'icas-cs-2026',
        sectionId: 'sec-2',
        title: 'Microservices Communication Architectural Tradeoffs',
        prompt: 'Explain the tradeoffs between synchronous HTTP/REST and asynchronous event-driven messaging (Kafka/RabbitMQ) in distributed systems.',
        type: 4, // Essay
        options: [],
        rubricCriteria: [
          { id: 'rub-1', name: 'Coupling & Latency Analysis', description: 'Accurate contrast of temporal vs spatial decoupling', maxPoints: 5 },
          { id: 'rub-2', name: 'Failure Handling & Resiliency', description: 'Discussion of dead letter queues, circuit breakers, and retries', maxPoints: 5 }
        ],
        points: 10,
        difficulty: 'Hard',
        domainTopic: 'Architecture & Scalability',
        bloomsTaxonomy: 'Evaluation'
      }
    ]
  }
];

export const mockSession = {
  sessionId: 'sess-test-101',
  assessmentId: 'icas-cs-2026',
  candidateName: 'Alice Chen',
  candidateRegistrationId: 'REG-2026-9901',
  candidateEmail: 'alice.chen@university.edu',
  status: 1, // InProgress
  startedAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  integrityScore: 100,
  answers: {},
  proctoringEvents: [],
  scorePercentage: 0,
  totalScore: 0,
  maxPossibleScore: 20
};

export const mockSubmittedSession = {
  ...mockSession,
  status: 2, // Submitted
  passed: true,
  scorePercentage: 85,
  totalScore: 17,
  maxPossibleScore: 20,
  submittedAt: new Date().toISOString(),
  topicScores: {
    'Algorithms & Logic': { topic: 'Algorithms & Logic', earnedPoints: 5, totalPoints: 5, percentage: 100 },
    'Database Systems & ACID': { topic: 'Database Systems & ACID', earnedPoints: 5, totalPoints: 5, percentage: 100 },
    'Architecture & Scalability': { topic: 'Architecture & Scalability', earnedPoints: 7, totalPoints: 10, percentage: 70 }
  },
  answers: {
    'q-1': { questionId: 'q-1', selectedOptionIds: ['opt-2'], awardedPoints: 5 },
    'q-2': { questionId: 'q-2', selectedOptionIds: ['opt-a', 'opt-b', 'opt-d'], awardedPoints: 5 },
    'q-3': { questionId: 'q-3', textResponse: 'Event-driven provides loose coupling and resilience.', awardedPoints: 7 }
  }
};

export const mockAnalytics = {
  totalAssessments: 1,
  totalCandidatesCompleted: 42,
  overallPassRate: 88.5,
  averageScorePercentage: 79.2,
  averageIntegrityIndex: 96.8,
  flaggedSecurityIncidents: 2,
  competencyBreakdown: [
    { competency: 'Algorithms & Logic', averageMastery: 84.5, totalAssessedQuestions: 42 },
    { competency: 'Database Systems & ACID', averageMastery: 78.0, totalAssessedQuestions: 42 },
    { competency: 'Architecture & Scalability', averageMastery: 75.2, totalAssessedQuestions: 42 }
  ],
  itemDiagnostics: []
};
