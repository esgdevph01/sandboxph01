import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CandidateSession, Assessment, CandidateAnswer } from '../../models/assessment.types';
import { AssessmentApiService } from '../../services/assessment-api.service';

@Component({
  selector: 'app-proctor-marking',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="proctor-container animate-fade-in">
      <header class="proctor-header">
        <div>
          <span class="badge badge-warning">EG Proctor & Marking</span>
          <h1>Live Integrity Telemetry & Rubric Grading</h1>
          <p class="proctor-sub">Review candidate session audit logs, proctoring security flags, and evaluate essay rubrics.</p>
        </div>

        <button class="btn btn-secondary" (click)="refreshSessions()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 4 23 10 17 10"></polyline>
            <polyline points="1 20 1 14 7 14"></polyline>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
          </svg>
          <span>Refresh Feed</span>
        </button>
      </header>

      <!-- Main Layout: Session Table + Inspection Drawer -->
      <div class="proctor-layout">
        <!-- Sessions Table -->
        <div class="sessions-pane janison-card">
          <div class="pane-header">
            <h3>Candidate Sessions ({{ sessions.length }})</h3>
            <span class="pane-caption">Real-time telemetry stream</span>
          </div>

          <div class="table-wrap">
            <table class="session-table">
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Assessment</th>
                  <th>Status</th>
                  <th>Score</th>
                  <th>Integrity</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let s of sessions" [class.selected-row]="selectedSession?.sessionId === s.sessionId">
                  <td>
                    <div class="cand-name">{{ s.candidateName }}</div>
                    <div class="cand-id">{{ s.candidateRegistrationId }}</div>
                  </td>
                  <td>
                    <span class="exam-code">{{ s.assessmentId }}</span>
                  </td>
                  <td>
                    <span class="badge" [class.badge-success]="s.status === 3"
                                        [class.badge-warning]="s.status === 2"
                                        [class.badge-primary]="s.status === 1">
                      {{ getStatusLabel(s.status) }}
                    </span>
                  </td>
                  <td>
                    <strong>{{ s.scorePercentage }}%</strong>
                    <div class="score-sub">{{ s.totalScore }}/{{ s.maxPossibleScore }} pts</div>
                  </td>
                  <td>
                    <span class="integrity-pill" [class.danger]="s.integrityScore < 90">
                      {{ s.integrityScore }}%
                    </span>
                  </td>
                  <td>
                    <button class="btn btn-secondary btn-sm" (click)="inspectSession(s)">
                      Inspect & Mark
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Inspection & Rubric Grading Pane -->
        <div class="inspect-pane janison-card" *ngIf="selectedSession">
          <div class="pane-header">
            <div>
              <h3>Candidate Audit: {{ selectedSession.candidateName }}</h3>
              <span class="pane-caption">ID: {{ selectedSession.candidateRegistrationId }}</span>
            </div>
            <button class="close-btn" (click)="selectedSession = null">&times;</button>
          </div>

          <!-- Integrity Score & Incident Summary -->
          <div class="integrity-summary-box" [class.alert]="selectedSession.integrityScore < 90">
            <div class="integrity-gauge">
              <span class="gauge-val">{{ selectedSession.integrityScore }}%</span>
              <span class="gauge-lbl">Security Rating</span>
            </div>
            <div class="integrity-details">
              <strong>Audit Verdict: {{ selectedSession.integrityScore >= 95 ? 'High Integrity' : 'Security Flags Present' }}</strong>
              <p>{{ selectedSession.proctoringEvents.length || 0 }} total telemetry events logged during test delivery.</p>
            </div>
          </div>

          <!-- Proctoring Event Log Timeline -->
          <div class="telemetry-timeline">
            <h4>Security Event Timeline</h4>
            <div class="timeline-list">
              <div *ngFor="let evt of selectedSession.proctoringEvents" class="timeline-item">
                <span class="evt-dot" [class.medium]="evt.severity === 'Medium'" [class.high]="evt.severity === 'High'"></span>
                <div class="evt-content">
                  <div class="evt-header">
                    <span class="evt-type">{{ evt.eventType }}</span>
                    <span class="evt-time">{{ evt.timestamp | date:'HH:mm:ss' }}</span>
                  </div>
                  <p class="evt-desc">{{ evt.details }}</p>
                </div>
              </div>
              <div *ngIf="!selectedSession.proctoringEvents.length" class="empty-state">
                No security infractions or anomalies recorded.
              </div>
            </div>
          </div>

          <!-- Essay Rubric Marking Section -->
          <div class="essay-marking-section">
            <h4>Manual Rubric Evaluation</h4>
            <p class="section-sub">Score candidate responses for subjective extended items.</p>

            <div *ngFor="let essayQ of getEssayQuestions()" class="essay-eval-card">
              <div class="essay-q-title">
                <strong>{{ essayQ.title }}</strong>
                <span class="badge badge-primary">Max {{ essayQ.points }} pts</span>
              </div>
              <p class="essay-prompt">{{ essayQ.prompt }}</p>

              <!-- Candidate's Response -->
              <div class="candidate-response-box">
                <span class="response-lbl">Candidate Response:</span>
                <div class="response-text">
                  {{ getAnswer(essayQ.id)?.textResponse || '(No response submitted)' }}
                </div>
              </div>

              <!-- Rubric Evaluation Slider -->
              <div class="rubric-slider-group">
                <div class="slider-header">
                  <label>Awarded Rubric Score:</label>
                  <span class="score-display">{{ gradingPoints[essayQ.id] || 0 }} / {{ essayQ.points }} Points</span>
                </div>
                <input type="range"
                       min="0"
                       [max]="essayQ.points"
                       step="1"
                       [(ngModel)]="gradingPoints[essayQ.id]"
                       class="score-slider" />
              </div>

              <div class="feedback-group">
                <label>Examiner Feedback Notes:</label>
                <textarea rows="2" class="form-control" [(ngModel)]="gradingFeedback[essayQ.id]" placeholder="Provide constructive criteria feedback..."></textarea>
              </div>

              <div class="grading-actions">
                <button class="btn btn-primary btn-sm" (click)="submitManualGrade(essayQ.id)">
                  Commit Question Grade
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .proctor-container {
      max-width: 1300px;
      margin: 0 auto;
      padding: 1.5rem 1rem 3rem;
    }

    .proctor-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 2rem;
      border-bottom: 1px solid var(--color-border);
      padding-bottom: 1.5rem;
    }

    .proctor-sub {
      color: var(--color-text-muted);
      font-size: 0.95rem;
      margin-top: 4px;
    }

    .proctor-layout {
      display: grid;
      grid-template-columns: 1fr 480px;
      gap: 1.5rem;
      align-items: start;
    }

    .sessions-pane, .inspect-pane {
      background: #FFFFFF;
      padding: 1.5rem;
    }

    .pane-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.25rem;
    }

    .pane-caption {
      font-size: 0.8rem;
      color: var(--color-text-muted);
    }

    .table-wrap {
      overflow-x: auto;
    }

    .session-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
      text-align: left;
    }

    .session-table th {
      padding: 0.75rem 1rem;
      background: #F8FAFC;
      border-bottom: 1px solid var(--color-border);
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-navy);
      font-weight: 700;
    }

    .session-table td {
      padding: 0.85rem 1rem;
      border-bottom: 1px solid var(--color-border);
      vertical-align: middle;
    }

    .selected-row {
      background: #F0FDF4;
    }

    .cand-name {
      font-weight: 700;
      color: var(--color-navy);
    }

    .cand-id {
      font-size: 0.75rem;
      color: var(--color-text-muted);
      font-family: var(--font-mono);
    }

    .exam-code {
      font-family: var(--font-mono);
      font-size: 0.75rem;
      color: var(--color-primary);
      background: var(--color-primary-light);
      padding: 2px 6px;
      border-radius: var(--radius-sm);
    }

    .score-sub {
      font-size: 0.75rem;
      color: var(--color-text-muted);
    }

    .integrity-pill {
      display: inline-block;
      padding: 2px 8px;
      border-radius: var(--radius-full);
      font-size: 0.75rem;
      font-weight: 700;
      background: #ECFDF5;
      color: #065F46;
    }

    .integrity-pill.danger {
      background: #FEF2F2;
      color: #991B1B;
    }

    .btn-sm {
      padding: 0.35rem 0.75rem;
      font-size: 0.75rem;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      color: var(--color-text-muted);
      cursor: pointer;
    }

    /* Inspection Pane */
    .integrity-summary-box {
      background: #F8FAFC;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: 1rem;
      display: flex;
      align-items: center;
      gap: 1.25rem;
      margin-bottom: 1.5rem;
    }

    .integrity-summary-box.alert {
      background: #FEF2F2;
      border-color: #FECACA;
    }

    .integrity-gauge {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .gauge-val {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--color-navy);
    }

    .gauge-lbl {
      font-size: 0.65rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-text-muted);
    }

    .integrity-details strong {
      font-size: 0.9rem;
      color: var(--color-navy);
    }

    .integrity-details p {
      font-size: 0.8rem;
      color: var(--color-text-muted);
      margin-top: 2px;
    }

    .telemetry-timeline {
      margin-bottom: 1.5rem;
    }

    .telemetry-timeline h4 {
      font-size: 0.95rem;
      margin-bottom: 0.75rem;
    }

    .timeline-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      max-height: 220px;
      overflow-y: auto;
      padding-right: 4px;
    }

    .timeline-item {
      display: flex;
      gap: 0.75rem;
      font-size: 0.825rem;
      padding: 0.5rem;
      background: #F8FAFC;
      border-radius: var(--radius-sm);
    }

    .evt-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10B981;
      margin-top: 5px;
      flex-shrink: 0;
    }

    .evt-dot.medium { background: #F59E0B; }
    .evt-dot.high { background: #EF4444; }

    .evt-content {
      flex: 1;
    }

    .evt-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 2px;
    }

    .evt-type {
      font-weight: 700;
      color: var(--color-navy);
    }

    .evt-time {
      font-size: 0.75rem;
      color: var(--color-text-muted);
      font-family: var(--font-mono);
    }

    .evt-desc {
      color: var(--color-text-muted);
    }

    .empty-state {
      font-size: 0.85rem;
      color: var(--color-text-muted);
      font-style: italic;
    }

    /* Rubric Marking */
    .essay-marking-section h4 {
      font-size: 0.95rem;
      margin-bottom: 2px;
    }

    .section-sub {
      font-size: 0.8rem;
      color: var(--color-text-muted);
      margin-bottom: 1rem;
    }

    .essay-eval-card {
      background: #F8FAFC;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }

    .essay-q-title {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.9rem;
    }

    .essay-prompt {
      font-size: 0.825rem;
      color: var(--color-text-muted);
    }

    .candidate-response-box {
      background: #FFFFFF;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      padding: 0.75rem;
    }

    .response-lbl {
      display: block;
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--color-navy);
      margin-bottom: 4px;
    }

    .response-text {
      font-size: 0.85rem;
      color: var(--color-text-main);
      white-space: pre-wrap;
      line-height: 1.5;
    }

    .rubric-slider-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .slider-header {
      display: flex;
      justify-content: space-between;
      font-size: 0.825rem;
      font-weight: 600;
    }

    .score-display {
      color: var(--color-primary);
      font-weight: 800;
    }

    .score-slider {
      width: 100%;
      accent-color: var(--color-primary);
      cursor: pointer;
    }

    .feedback-group label {
      display: block;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--color-navy);
      margin-bottom: 4px;
    }

    .form-control {
      width: 100%;
      padding: 0.5rem;
      font-size: 0.85rem;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      outline: none;
    }

    .grading-actions {
      display: flex;
      justify-content: flex-end;
    }
  `]
})
export class ProctorMarkingComponent implements OnInit {
  @Input() assessments: Assessment[] = [];
  sessions: CandidateSession[] = [];
  selectedSession: CandidateSession | null = null;

  gradingPoints: { [qId: string]: number } = {};
  gradingFeedback: { [qId: string]: string } = {};

  constructor(private api: AssessmentApiService) { }

  ngOnInit(): void {
    this.refreshSessions();
  }

  refreshSessions(): void {
    this.api.getAllSessions().subscribe(data => {
      this.sessions = data;
      if (this.sessions.length > 0 && !this.selectedSession) {
        this.inspectSession(this.sessions[0]);
      }
    });
  }

  inspectSession(s: CandidateSession): void {
    this.selectedSession = s;
    // Preload grading values
    if (s.answers) {
      Object.keys(s.answers).forEach(qId => {
        this.gradingPoints[qId] = s.answers[qId].awardedPoints || 0;
        this.gradingFeedback[qId] = s.answers[qId].manualFeedback || '';
      });
    }
  }

  getStatusLabel(status: number): string {
    switch (status) {
      case 1: return 'In Progress';
      case 2: return 'Submitted';
      case 3: return 'Graded';
      case 4: return 'Expired';
      default: return 'Pending';
    }
  }

  getEssayQuestions(): any[] {
    if (!this.selectedSession) return [];
    const assess = this.assessments.find(a => a.id === this.selectedSession?.assessmentId);
    if (!assess) return [];
    return assess.questions.filter(q => q.type === 4); // Essay type
  }

  getAnswer(qId: string): CandidateAnswer | undefined {
    return this.selectedSession?.answers ? this.selectedSession.answers[qId] : undefined;
  }

  submitManualGrade(questionId: string): void {
    if (!this.selectedSession) return;
    this.api.manualGrade(this.selectedSession.sessionId, {
      questionId,
      awardedPoints: Number(this.gradingPoints[questionId] || 0),
      feedback: this.gradingFeedback[questionId] || 'Assessed against rubric standard.'
    }).subscribe(updated => {
      this.selectedSession = updated;
      const idx = this.sessions.findIndex(s => s.sessionId === updated.sessionId);
      if (idx > -1) {
        this.sessions[idx] = updated;
      }
    });
  }
}
