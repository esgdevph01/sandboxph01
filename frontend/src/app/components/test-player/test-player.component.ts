import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription, debounceTime } from 'rxjs';
import {
  Assessment,
  CandidateSession,
  QuestionItem,
  QuestionType,
  CandidateAnswer
} from '../../models/assessment.types';
import { AssessmentApiService } from '../../services/assessment-api.service';

@Component({
  selector: 'app-test-player',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="player-wrapper animate-fade-in" [class.fullscreen-active]="isFullscreen">
      <!-- 1. Top Assessment Header & Proctoring Telemetry Bar -->
      <header class="player-top-bar">
        <div class="header-left">
          <div class="brand-badge">
            <span class="janison-symbol">J</span>
            <span class="platform-name">EG Delivery</span>
          </div>
          <div class="divider-v"></div>
          <div class="exam-info">
            <h1 class="exam-title">{{ assessment.title }}</h1>
            <span class="candidate-tag">{{ session.candidateName }} ({{ session.candidateRegistrationId }})</span>
          </div>
        </div>

        <div class="header-center">
          <!-- Countdown Timer -->
          <div class="timer-card" [class.warning]="remainingSeconds < 300" [class.critical]="remainingSeconds < 60">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <div class="timer-display">
              <span class="timer-value">{{ formattedTime }}</span>
              <span class="timer-caption">Time Remaining</span>
            </div>
          </div>
        </div>

        <div class="header-right">
          <!-- Live Telemetry & Auto-save Status -->
          <div class="telemetry-pill" [class.syncing]="isSyncing">
            <span class="sync-dot"></span>
            <span>{{ isSyncing ? 'Syncing...' : 'Synced to Cloud' }}</span>
          </div>

          <!-- Integrity Score Pill -->
          <div class="integrity-pill" [class.penalized]="session.integrityScore < 90" title="Proctoring Integrity Index">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
            <span>{{ session.integrityScore }}% Integrity</span>
          </div>

          <!-- Fullscreen Lock Toggle -->
          <button class="icon-action-btn" (click)="toggleFullscreen()" [title]="isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'">
            <svg *ngIf="!isFullscreen" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
            </svg>
            <svg *ngIf="isFullscreen" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"></path>
            </svg>
          </button>
        </div>
      </header>

      <!-- Security Violation Warning Alert -->
      <div *ngIf="securityWarning" class="security-banner animate-slide-down">
        <div class="alert-icon">⚠️</div>
        <div class="alert-text">
          <strong>Proctoring Notice: {{ securityWarning }}</strong>
          <span>This event was recorded in your session audit log and reported to exam adjudicators.</span>
        </div>
        <button class="dismiss-btn" (click)="securityWarning = null">Acknowledge</button>
      </div>

      <!-- Main Testing Canvas & Question Navigator -->
      <div class="player-body" *ngIf="session.status === 1">
        <!-- Center Item Canvas -->
        <main class="question-canvas">
          <div class="canvas-header">
            <div class="question-meta-bar">
              <div class="q-progress-badge">
                Item {{ currentIndex + 1 }} of {{ totalQuestions }}
              </div>
              <div class="q-tags">
                <span class="badge badge-neutral">{{ currentQuestion.domainTopic }}</span>
                <span class="badge badge-primary">{{ currentQuestion.points }} Points</span>
                <span class="badge" [class.badge-success]="currentQuestion.difficulty === 'Easy'"
                                    [class.badge-warning]="currentQuestion.difficulty === 'Medium'"
                                    [class.badge-danger]="currentQuestion.difficulty === 'Hard'">
                  {{ currentQuestion.difficulty }}
                </span>
              </div>
            </div>

            <!-- Flag For Review Toggle -->
            <button class="flag-btn" [class.flagged]="currentAnswer.isFlaggedForReview" (click)="toggleFlag()">
              <svg width="16" height="16" viewBox="0 0 24 24" [attr.fill]="currentAnswer.isFlaggedForReview ? '#F59E0B' : 'none'" stroke="#F59E0B" stroke-width="2">
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
                <line x1="4" y1="22" x2="4" y2="15"></line>
              </svg>
              <span>{{ currentAnswer.isFlaggedForReview ? 'Flagged for Review' : 'Flag Question' }}</span>
            </button>
          </div>

          <!-- Stimulus / Context Box -->
          <div *ngIf="currentQuestion.stimulusContext" class="stimulus-card">
            <div class="stimulus-title">Context & Scenario</div>
            <p>{{ currentQuestion.stimulusContext }}</p>
          </div>

          <!-- Code Snippet Display -->
          <div *ngIf="currentQuestion.codeSnippet" class="code-container">
            <div class="code-toolbar">
              <span class="code-lang">{{ currentQuestion.codeLanguage || 'code' }}</span>
              <span class="code-hint">Read carefully before answering</span>
            </div>
            <pre class="code-block"><code>{{ currentQuestion.codeSnippet }}</code></pre>
          </div>

          <!-- Question Prompt -->
          <div class="prompt-box">
            <h2 class="question-prompt">{{ currentQuestion.prompt }}</h2>
          </div>

          <!-- Dynamic Question Response Inputs -->
          <div class="response-area">
            <!-- 1. Single Choice (MCQ) -->
            <div *ngIf="currentQuestion.type === 1" class="options-group">
              <label *ngFor="let opt of currentQuestion.options"
                     class="option-card"
                     [class.selected]="currentAnswer.selectedOptionIds.includes(opt.id)"
                     (click)="selectSingleChoice(opt.id)">
                <input type="radio"
                       name="mcq-options"
                       [value]="opt.id"
                       [checked]="currentAnswer.selectedOptionIds.includes(opt.id)"
                       class="sr-only" />
                <div class="radio-indicator">
                  <span class="indicator-inner"></span>
                </div>
                <div class="option-content">
                  <span class="option-text">{{ opt.text }}</span>
                </div>
              </label>
            </div>

            <!-- 2. Multiple Select (Multi-choice) -->
            <div *ngIf="currentQuestion.type === 2" class="options-group">
              <div class="selection-hint">Select all applicable answers:</div>
              <label *ngFor="let opt of currentQuestion.options"
                     class="option-card"
                     [class.selected]="currentAnswer.selectedOptionIds.includes(opt.id)"
                     (click)="toggleMultipleChoice(opt.id)">
                <div class="checkbox-indicator">
                  <span *ngIf="currentAnswer.selectedOptionIds.includes(opt.id)">✓</span>
                </div>
                <div class="option-content">
                  <span class="option-text">{{ opt.text }}</span>
                </div>
              </label>
            </div>

            <!-- 3. Short Answer Text -->
            <div *ngIf="currentQuestion.type === 3" class="short-answer-box">
              <label class="input-label">Type your exact numerical or textual response:</label>
              <input type="text"
                     class="short-input"
                     [(ngModel)]="currentAnswer.textResponse"
                     (ngModelChange)="onTextChange($event)"
                     placeholder="Enter your concise answer here..." />
            </div>

            <!-- 4. Essay / Extended Written Response -->
            <div *ngIf="currentQuestion.type === 4" class="essay-box">
              <div class="essay-header">
                <span class="input-label">Extended Written Response</span>
                <div class="word-counter">
                  <span>{{ getWordCount(currentAnswer.textResponse) }} words</span>
                  <span class="divider-dot">•</span>
                  <span>{{ currentAnswer.textResponse.length || 0 }} chars</span>
                </div>
              </div>
              <textarea
                class="essay-textarea"
                rows="9"
                [(ngModel)]="currentAnswer.textResponse"
                (ngModelChange)="onTextChange($event)"
                placeholder="Compose your comprehensive response. Auto-saved continuously...">
              </textarea>
              <div class="essay-rubric-reminder" *ngIf="currentQuestion.rubricCriteria?.length">
                <div class="rubric-label">Evaluation Criteria:</div>
                <div class="rubric-chips">
                  <span *ngFor="let rub of currentQuestion.rubricCriteria" class="rubric-chip">
                    {{ rub.name }} (Max {{ rub.maxPoints }} pts)
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Bottom Navigation Controls -->
          <footer class="canvas-footer">
            <button class="btn btn-secondary" (click)="goToPrevious()" [disabled]="currentIndex === 0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              <span>Previous Item</span>
            </button>

            <div class="footer-center-msg">
              <span *ngIf="isItemAnswered(currentQuestion.id)" class="status-answered">
                ✓ Response Recorded
              </span>
              <span *ngIf="!isItemAnswered(currentQuestion.id)" class="status-unanswered">
                ○ Not yet answered
              </span>
            </div>

            <div class="nav-right-group">
              <button *ngIf="currentIndex < totalQuestions - 1" class="btn btn-primary" (click)="goToNext()">
                <span>Next Item</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>

              <button class="btn btn-accent" (click)="openReviewModal()">
                <span>Review & Submit</span>
              </button>
            </div>
          </footer>
        </main>

        <!-- Right Question Navigator Palette Drawer -->
        <aside class="palette-drawer">
          <div class="drawer-header">
            <h3>Question Palette</h3>
            <span class="answered-summary">{{ answeredCount }}/{{ totalQuestions }} Answered</span>
          </div>

          <!-- Legend -->
          <div class="palette-legend">
            <div class="legend-item"><span class="legend-box answered"></span> Answered</div>
            <div class="legend-item"><span class="legend-box flagged"></span> Flagged</div>
            <div class="legend-item"><span class="legend-box unanswered"></span> Unanswered</div>
          </div>

          <!-- Grid of items -->
          <div class="palette-grid">
            <button *ngFor="let q of assessment.questions; let i = index"
                    class="palette-btn"
                    [class.current]="i === currentIndex"
                    [class.answered]="isItemAnswered(q.id)"
                    [class.flagged]="isItemFlagged(q.id)"
                    (click)="jumpToQuestion(i)">
              <span class="btn-index">{{ i + 1 }}</span>
              <span *ngIf="isItemFlagged(q.id)" class="flag-indicator">⚑</span>
            </button>
          </div>

          <div class="drawer-instructions">
            <div class="instruction-title">Examination Security</div>
            <p>Do not navigate away from this browser window. Window defocus events are logged in the candidate integrity report.</p>
          </div>
        </aside>
      </div>

      <!-- 2. Submission Results View ("Candidate Scorecard") -->
      <div *ngIf="session.status === 2 || session.status === 3" class="results-container animate-fade-in">
        <div class="scorecard janison-card">
          <div class="scorecard-header">
            <div class="result-badge" [class.passed]="session.passed" [class.failed]="!session.passed">
              {{ session.passed ? 'ASSESSMENT PASSED' : 'ASSESSMENT COMPLETED' }}
            </div>
            <h2>Candidate Performance Scorecard</h2>
            <p class="scorecard-sub">{{ assessment.title }}</p>
          </div>

          <div class="score-summary-grid">
            <div class="score-tile primary">
              <div class="tile-val">{{ session.scorePercentage }}%</div>
              <div class="tile-lbl">Final Score</div>
              <div class="tile-sub">{{ session.totalScore }} / {{ session.maxPossibleScore }} Points</div>
            </div>

            <div class="score-tile">
              <div class="tile-val" [class.high]="session.integrityScore >= 95" [class.warn]="session.integrityScore < 95">
                {{ session.integrityScore }}%
              </div>
              <div class="tile-lbl">Integrity Index</div>
              <div class="tile-sub">{{ session.proctoringEvents.length || 0 }} Telemetry Signals</div>
            </div>

            <div class="score-tile">
              <div class="tile-val">{{ assessment.passingScorePercentage }}%</div>
              <div class="tile-lbl">Pass Threshold</div>
              <div class="tile-sub">Standard Benchmark</div>
            </div>

            <div class="score-tile">
              <div class="tile-val">{{ answeredCount }} / {{ totalQuestions }}</div>
              <div class="tile-lbl">Items Attempted</div>
              <div class="tile-sub">100% Completion</div>
            </div>
          </div>

          <!-- Competency Mastery Breakdown -->
          <div class="competency-section" *ngIf="session.topicScores">
            <h3>Competency Mastery Breakdown</h3>
            <div class="topic-bars">
              <div *ngFor="let topic of getTopicList()" class="topic-bar-row">
                <div class="topic-name-wrap">
                  <span class="topic-title">{{ topic.topic }}</span>
                  <span class="topic-score">{{ topic.earnedPoints }}/{{ topic.totalPoints }} pts ({{ topic.percentage }}%)</span>
                </div>
                <div class="progress-track">
                  <div class="progress-fill" [style.width.%]="topic.percentage"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Item by Item Breakdown -->
          <div class="item-breakdown-section">
            <h3>Question Evaluation Summary</h3>
            <div class="item-table-wrap">
              <table class="item-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Topic</th>
                    <th>Type</th>
                    <th>Points Awarded</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let q of assessment.questions; let i = index">
                    <td>
                      <strong>Item {{ i + 1 }}:</strong> {{ q.title }}
                    </td>
                    <td>{{ q.domainTopic }}</td>
                    <td>{{ getQuestionTypeName(q.type) }}</td>
                    <td>
                      <strong>{{ getAnswer(q.id)?.awardedPoints ?? 'Pending Review' }}</strong> / {{ q.points }}
                    </td>
                    <td>
                      <span class="badge" [class.badge-success]="(getAnswer(q.id)?.awardedPoints || 0) > 0"
                                          [class.badge-warning]="getAnswer(q.id)?.awardedPoints === null"
                                          [class.badge-danger]="getAnswer(q.id)?.awardedPoints === 0">
                        {{ getAnswer(q.id)?.awardedPoints === null ? 'Rubric Pending' : ((getAnswer(q.id)?.awardedPoints || 0) > 0 ? 'Correct' : 'Needs Review') }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="scorecard-actions">
            <button class="btn btn-secondary" (click)="exitToPortal.emit()">Return to Assessments Portal</button>
            <button class="btn btn-primary" (click)="printScorecard()">Print Candidate Transcript</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 3. Pre-Submission Review Modal -->
    <div *ngIf="showReviewModal" class="modal-backdrop" (click)="closeReviewModal()">
      <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <span class="badge badge-warning">Final Submission</span>
              <h2 style="margin-top: 6px;">Confirm Assessment Submission</h2>
            </div>
            <button class="close-btn" (click)="closeReviewModal()">&times;</button>
          </div>

          <div class="modal-body">
            <p style="color: var(--color-text-muted); margin-bottom: 1.25rem;">
              Review your question completion status before sealing and submitting your responses. Once submitted, answers cannot be edited.
            </p>

            <div class="review-stats-grid">
              <div class="rev-stat-card answered">
                <div class="rev-val">{{ answeredCount }}</div>
                <div class="rev-lbl">Answered Items</div>
              </div>
              <div class="rev-stat-card unanswered">
                <div class="rev-val">{{ totalQuestions - answeredCount }}</div>
                <div class="rev-lbl">Unanswered Items</div>
              </div>
              <div class="rev-stat-card flagged">
                <div class="rev-val">{{ flaggedCount }}</div>
                <div class="rev-lbl">Flagged for Review</div>
              </div>
            </div>

            <div *ngIf="totalQuestions - answeredCount > 0" class="unanswered-warning">
              ⚠️ You have <strong>{{ totalQuestions - answeredCount }} unanswered item(s)</strong>. Unanswered questions receive zero points.
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeReviewModal()">Back to Test</button>
            <button class="btn btn-accent" (click)="confirmSubmission()">Seal & Submit Final Exam</button>
          </div>
        </div>
      </div>
  `,
  styles: [`
    .player-wrapper {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background: #F8FAFC;
    }

    .fullscreen-active {
      background: #FFFFFF;
    }

    /* Top Bar */
    .player-top-bar {
      height: 72px;
      background: #0B192C;
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 1.5rem;
      border-bottom: 2px solid var(--color-primary);
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .brand-badge {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .janison-symbol {
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, #028090, #00A896);
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      color: #ffffff;
      font-size: 1.1rem;
    }

    .platform-name {
      font-weight: 700;
      font-size: 0.95rem;
      letter-spacing: 0.02em;
      color: #FFFFFF;
    }

    .divider-v {
      width: 1px;
      height: 28px;
      background: rgba(255, 255, 255, 0.15);
    }

    .exam-title {
      font-size: 0.95rem;
      color: #E2E8F0;
      margin: 0;
      max-width: 320px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .candidate-tag {
      font-size: 0.75rem;
      color: #94A3B8;
    }

    /* Timer */
    .timer-card {
      display: flex;
      align-items: center;
      gap: 10px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      padding: 6px 16px;
      border-radius: var(--radius-full);
      color: #02C39A;
      transition: all 0.2s ease;
    }

    .timer-card.warning {
      color: #F59E0B;
      border-color: rgba(245, 158, 11, 0.4);
      background: rgba(245, 158, 11, 0.1);
    }

    .timer-card.critical {
      color: #EF4444;
      border-color: rgba(239, 68, 68, 0.4);
      background: rgba(239, 68, 68, 0.15);
      animation: pulseGlow 1s infinite;
    }

    .timer-display {
      display: flex;
      flex-direction: column;
      line-height: 1.1;
    }

    .timer-value {
      font-family: var(--font-mono);
      font-weight: 800;
      font-size: 1.15rem;
    }

    .timer-caption {
      font-size: 0.65rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      opacity: 0.8;
    }

    /* Header Right */
    .header-right {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .telemetry-pill {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.75rem;
      color: #CBD5E1;
      background: rgba(255, 255, 255, 0.08);
      padding: 4px 10px;
      border-radius: var(--radius-full);
    }

    .sync-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #10B981;
    }

    .telemetry-pill.syncing .sync-dot {
      background: #F59E0B;
      animation: pulseGlow 1s infinite;
    }

    .integrity-pill {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      color: #10B981;
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.25);
      padding: 4px 10px;
      border-radius: var(--radius-full);
    }

    .integrity-pill.penalized {
      color: #EF4444;
      background: rgba(239, 68, 68, 0.1);
      border-color: rgba(239, 68, 68, 0.25);
    }

    .icon-action-btn {
      background: rgba(255, 255, 255, 0.1);
      border: none;
      color: #ffffff;
      width: 36px;
      height: 36px;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background 0.15s;
    }

    .icon-action-btn:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    /* Security Warning Banner */
    .security-banner {
      background: #FEF2F2;
      border-bottom: 1px solid #FCA5A5;
      padding: 0.75rem 1.5rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      color: #991B1B;
    }

    .alert-icon {
      font-size: 1.25rem;
    }

    .alert-text {
      display: flex;
      flex-direction: column;
      font-size: 0.85rem;
      flex: 1;
    }

    .dismiss-btn {
      background: #991B1B;
      color: #ffffff;
      border: none;
      padding: 4px 12px;
      border-radius: var(--radius-sm);
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
    }

    /* Player Body Layout */
    .player-body {
      display: grid;
      grid-template-columns: 1fr 320px;
      flex: 1;
      height: calc(100vh - 72px);
      overflow: hidden;
    }

    .question-canvas {
      padding: 2rem 2.5rem;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
    }

    .canvas-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .question-meta-bar {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .q-progress-badge {
      font-size: 1.1rem;
      font-weight: 800;
      color: var(--color-navy);
    }

    .q-tags {
      display: flex;
      gap: 0.5rem;
    }

    .flag-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      background: #FFFFFF;
      border: 1px solid var(--color-border);
      padding: 6px 14px;
      border-radius: var(--radius-md);
      font-size: 0.825rem;
      font-weight: 600;
      color: var(--color-text-muted);
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .flag-btn.flagged {
      background: #FFFBEB;
      border-color: #F59E0B;
      color: #B45309;
    }

    /* Stimulus & Code Blocks */
    .stimulus-card {
      background: #F1F5F9;
      border-left: 4px solid var(--color-primary);
      padding: 1rem 1.25rem;
      border-radius: 0 var(--radius-md) var(--radius-md) 0;
      margin-bottom: 1.25rem;
    }

    .stimulus-title {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-primary);
      margin-bottom: 0.35rem;
    }

    .code-container {
      background: #0B192C;
      border-radius: var(--radius-md);
      margin-bottom: 1.5rem;
      overflow: hidden;
      border: 1px solid #1E2E45;
    }

    .code-toolbar {
      display: flex;
      justify-content: space-between;
      padding: 6px 12px;
      background: #112239;
      color: #94A3B8;
      font-size: 0.75rem;
      font-family: var(--font-mono);
      border-bottom: 1px solid #1E2E45;
    }

    .code-block {
      padding: 1rem 1.25rem;
      color: #E2E8F0;
      font-size: 0.875rem;
      overflow-x: auto;
      line-height: 1.6;
    }

    /* Prompt */
    .prompt-box {
      margin-bottom: 1.5rem;
    }

    .question-prompt {
      font-size: 1.25rem;
      color: var(--color-navy);
      line-height: 1.45;
      font-weight: 600;
    }

    /* Response Options */
    .response-area {
      flex: 1;
      margin-bottom: 2rem;
    }

    .options-group {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }

    .option-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.1rem 1.25rem;
      background: #FFFFFF;
      border: 2px solid var(--color-border);
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .option-card:hover {
      border-color: var(--color-primary-hover);
      background: #F8FAFC;
    }

    .option-card.selected {
      border-color: var(--color-primary);
      background: #F0FDF4;
      box-shadow: 0 2px 6px rgba(2, 128, 144, 0.15);
    }

    .radio-indicator {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      border: 2px solid var(--color-border-hover);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .option-card.selected .radio-indicator {
      border-color: var(--color-primary);
    }

    .indicator-inner {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: transparent;
      transition: background 0.15s ease;
    }

    .option-card.selected .indicator-inner {
      background: var(--color-primary);
    }

    .checkbox-indicator {
      width: 22px;
      height: 22px;
      border-radius: var(--radius-sm);
      border: 2px solid var(--color-border-hover);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      color: #ffffff;
      flex-shrink: 0;
    }

    .option-card.selected .checkbox-indicator {
      border-color: var(--color-primary);
      background: var(--color-primary);
    }

    .option-text {
      font-size: 0.95rem;
      color: var(--color-text-main);
      font-weight: 500;
    }

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      border: 0;
    }

    /* Short Answer & Essay */
    .short-input {
      width: 100%;
      padding: 0.85rem 1rem;
      font-size: 1.05rem;
      font-family: var(--font-primary);
      border: 2px solid var(--color-border);
      border-radius: var(--radius-md);
      outline: none;
      transition: border-color 0.15s;
    }

    .short-input:focus {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px rgba(2, 128, 144, 0.15);
    }

    .essay-box {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .essay-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .input-label {
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--color-navy);
    }

    .word-counter {
      font-size: 0.75rem;
      color: var(--color-text-muted);
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .divider-dot {
      color: var(--color-text-subtle);
    }

    .essay-textarea {
      width: 100%;
      padding: 1rem;
      font-family: var(--font-primary);
      font-size: 0.95rem;
      line-height: 1.6;
      border: 2px solid var(--color-border);
      border-radius: var(--radius-md);
      outline: none;
      resize: vertical;
      transition: border-color 0.15s;
    }

    .essay-textarea:focus {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px rgba(2, 128, 144, 0.15);
    }

    .essay-rubric-reminder {
      background: #F8FAFC;
      border: 1px solid var(--color-border);
      padding: 0.75rem 1rem;
      border-radius: var(--radius-md);
      margin-top: 0.5rem;
    }

    .rubric-label {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--color-navy);
      margin-bottom: 0.35rem;
    }

    .rubric-chips {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .rubric-chip {
      font-size: 0.75rem;
      background: #E2E8F0;
      padding: 2px 8px;
      border-radius: var(--radius-sm);
      color: #334155;
    }

    /* Footer Controls */
    .canvas-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 1.5rem;
      border-top: 1px solid var(--color-border);
    }

    .status-answered {
      color: var(--color-success);
      font-size: 0.85rem;
      font-weight: 600;
    }

    .status-unanswered {
      color: var(--color-text-subtle);
      font-size: 0.85rem;
    }

    .nav-right-group {
      display: flex;
      gap: 0.75rem;
    }

    /* Right Palette Drawer */
    .palette-drawer {
      background: #FFFFFF;
      border-left: 1px solid var(--color-border);
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
    }

    .drawer-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .drawer-header h3 {
      font-size: 1rem;
    }

    .answered-summary {
      font-size: 0.8rem;
      color: var(--color-text-muted);
      font-weight: 600;
    }

    .palette-legend {
      display: flex;
      gap: 0.75rem;
      margin-bottom: 1.25rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid var(--color-border);
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.75rem;
      color: var(--color-text-muted);
    }

    .legend-box {
      width: 10px;
      height: 10px;
      border-radius: 2px;
    }

    .legend-box.answered { background: #10B981; }
    .legend-box.flagged { background: #F59E0B; }
    .legend-box.unanswered { background: #E2E8F0; }

    .palette-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.65rem;
      margin-bottom: 1.5rem;
    }

    .palette-btn {
      aspect-ratio: 1;
      border-radius: var(--radius-md);
      background: #F8FAFC;
      border: 1px solid var(--color-border);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      position: relative;
      cursor: pointer;
      font-weight: 700;
      color: var(--color-text-muted);
      transition: all 0.15s ease;
    }

    .palette-btn:hover {
      border-color: var(--color-primary);
    }

    .palette-btn.current {
      border: 2px solid var(--color-navy);
      box-shadow: 0 0 0 3px rgba(11, 25, 44, 0.15);
      color: var(--color-navy);
    }

    .palette-btn.answered {
      background: #ECFDF5;
      border-color: #A7F3D0;
      color: #065F46;
    }

    .palette-btn.flagged {
      background: #FFFBEB;
      border-color: #FDE68A;
      color: #92400E;
    }

    .flag-indicator {
      position: absolute;
      top: 2px;
      right: 4px;
      font-size: 0.7rem;
      color: #F59E0B;
    }

    .drawer-instructions {
      margin-top: auto;
      background: #F8FAFC;
      padding: 1rem;
      border-radius: var(--radius-md);
      border: 1px solid var(--color-border);
    }

    .instruction-title {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--color-navy);
      margin-bottom: 0.35rem;
    }

    .drawer-instructions p {
      font-size: 0.75rem;
      color: var(--color-text-muted);
      line-height: 1.4;
    }

    /* Scorecard / Results */
    .results-container {
      max-width: 960px;
      margin: 2.5rem auto;
      padding: 0 1rem;
    }

    .scorecard {
      padding: 2.5rem;
    }

    .scorecard-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .result-badge {
      display: inline-block;
      padding: 4px 14px;
      border-radius: var(--radius-full);
      font-size: 0.75rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      margin-bottom: 0.75rem;
    }

    .result-badge.passed {
      background: #ECFDF5;
      color: #065F46;
      border: 1px solid #A7F3D0;
    }

    .result-badge.failed {
      background: #FEF2F2;
      color: #991B1B;
      border: 1px solid #FECACA;
    }

    .scorecard-sub {
      color: var(--color-text-muted);
      margin-top: 4px;
    }

    .score-summary-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      margin-bottom: 2.5rem;
    }

    .score-tile {
      background: #F8FAFC;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: 1.25rem 1rem;
      text-align: center;
    }

    .score-tile.primary {
      background: linear-gradient(135deg, #028090, #00A896);
      color: #ffffff;
      border: none;
    }

    .score-tile.primary .tile-lbl,
    .score-tile.primary .tile-sub {
      color: rgba(255, 255, 255, 0.85);
    }

    .tile-val {
      font-size: 1.75rem;
      font-weight: 800;
      margin-bottom: 2px;
    }

    .tile-val.high { color: #10B981; }
    .tile-val.warn { color: #F59E0B; }

    .tile-lbl {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-navy);
    }

    .tile-sub {
      font-size: 0.75rem;
      color: var(--color-text-muted);
      margin-top: 4px;
    }

    .competency-section {
      margin-bottom: 2.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--color-border);
    }

    .competency-section h3,
    .item-breakdown-section h3 {
      font-size: 1.1rem;
      margin-bottom: 1rem;
    }

    .topic-bars {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .topic-name-wrap {
      display: flex;
      justify-content: space-between;
      font-size: 0.875rem;
      margin-bottom: 4px;
    }

    .topic-title {
      font-weight: 600;
      color: var(--color-navy);
    }

    .topic-score {
      color: var(--color-text-muted);
      font-weight: 500;
    }

    .progress-track {
      height: 8px;
      background: #E2E8F0;
      border-radius: var(--radius-full);
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #028090, #00A896);
      border-radius: var(--radius-full);
      transition: width 0.6s ease;
    }

    .item-table-wrap {
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      overflow: hidden;
      margin-bottom: 2rem;
    }

    .item-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
      text-align: left;
    }

    .item-table th {
      background: #F8FAFC;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--color-border);
      font-weight: 700;
      color: var(--color-navy);
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .item-table td {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--color-border);
      color: var(--color-text-main);
    }

    .item-table tr:last-child td {
      border-bottom: none;
    }

    .scorecard-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
    }

    /* Review Modal */
    /* Pre-Submission Review Modal */
    .modal-header {
      padding: 1.25rem 1.5rem 1rem;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 1px solid var(--color-border);
      background: #ffffff;
    }

    .modal-header h2 {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--color-navy);
      margin: 0;
    }

    .close-btn {
      background: transparent;
      border: none;
      font-size: 1.5rem;
      line-height: 1;
      color: var(--color-text-muted);
      cursor: pointer;
      padding: 0.25rem 0.5rem;
      border-radius: var(--radius-sm);
      transition: all 0.15s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .close-btn:hover {
      color: var(--color-navy);
      background: rgba(0, 0, 0, 0.05);
    }

    .modal-body {
      padding: 1.5rem;
    }

    .modal-footer {
      padding: 1rem 1.5rem;
      background: #F8FAFC;
      border-top: 1px solid var(--color-border);
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 0.75rem;
    }

    .review-stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      margin-bottom: 1.25rem;
    }

    .rev-stat-card {
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: 1.25rem 1rem;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.35rem;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }

    .rev-stat-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-sm);
    }

    .rev-stat-card.answered {
      background: #ECFDF5;
      border-color: #A7F3D0;
    }
    .rev-stat-card.answered .rev-val {
      color: #059669;
    }

    .rev-stat-card.unanswered {
      background: #FEF2F2;
      border-color: #FECACA;
    }
    .rev-stat-card.unanswered .rev-val {
      color: #DC2626;
    }

    .rev-stat-card.flagged {
      background: #FFFBEB;
      border-color: #FDE68A;
    }
    .rev-stat-card.flagged .rev-val {
      color: #D97706;
    }

    .rev-val {
      font-size: 1.75rem;
      font-weight: 800;
      line-height: 1;
      font-family: var(--font-mono);
    }

    .rev-lbl {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-text-muted);
    }

    .unanswered-warning {
      background: #FFFBEB;
      border: 1px solid #FDE68A;
      color: #92400E;
      padding: 0.85rem 1.15rem;
      border-radius: var(--radius-md);
      font-size: 0.875rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      line-height: 1.4;
      margin-top: 0.75rem;
    }
  `]
})
export class TestPlayerComponent implements OnInit, OnDestroy {
  @Input({ required: true }) assessment!: Assessment;
  @Input({ required: true }) session!: CandidateSession;
  @Output() exitToPortal = new EventEmitter<void>();

  currentIndex = 0;
  isFullscreen = false;
  securityWarning: string | null = null;
  showReviewModal = false;
  isSyncing = false;

  private answerSubject$ = new Subject<void>();
  private sub = new Subscription();
  private timerInterval: any;
  remainingSeconds = 0;

  constructor(private api: AssessmentApiService) { }

  ngOnInit(): void {
    this.calculateRemainingTime();
    this.startTimer();

    // Debounced autosave
    this.sub.add(
      this.answerSubject$.pipe(debounceTime(400)).subscribe(() => {
        this.syncCurrentAnswer();
      })
    );

    // Watch sync state
    this.sub.add(
      this.api.isSyncing$.subscribe(s => this.isSyncing = s)
    );
  }

  ngOnDestroy(): void {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.sub.unsubscribe();
  }

  // Proctoring telemetry: Tab blur detection
  @HostListener('window:blur')
  onWindowBlur(): void {
    if (this.session.status === 1) {
      this.securityWarning = 'Browser window defocus detected. Stay focused on exam.';
      this.session.integrityScore = Math.max(0, this.session.integrityScore - 5);
      this.api.logProctoringEvent(this.session.sessionId, {
        eventType: 'TAB_BLUR',
        severity: 'Medium',
        details: 'Candidate navigated away from assessment window.'
      }).subscribe();
    }
  }

  // Proctoring telemetry: Fullscreen change
  @HostListener('document:fullscreenchange')
  onFullscreenChange(): void {
    this.isFullscreen = !!document.fullscreenElement;
    if (!this.isFullscreen && this.session.status === 1 && this.assessment.strictProctoringEnabled) {
      this.securityWarning = 'Secured fullscreen mode exited.';
      this.session.integrityScore = Math.max(0, this.session.integrityScore - 8);
      this.api.logProctoringEvent(this.session.sessionId, {
        eventType: 'FULLSCREEN_EXIT',
        severity: 'High',
        details: 'Candidate exited fullscreen test delivery container.'
      }).subscribe();
    }
  }

  toggleFullscreen(): void {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => { });
      this.isFullscreen = true;
    } else {
      document.exitFullscreen().catch(() => { });
      this.isFullscreen = false;
    }
  }

  get totalQuestions(): number {
    return this.assessment.questions.length;
  }

  get currentQuestion(): QuestionItem {
    return this.assessment.questions[this.currentIndex];
  }

  get currentAnswer(): CandidateAnswer {
    const qId = this.currentQuestion.id;
    if (!this.session.answers[qId]) {
      this.session.answers[qId] = {
        questionId: qId,
        selectedOptionIds: [],
        textResponse: '',
        isFlaggedForReview: false,
        timeSpentSeconds: 0
      };
    }
    return this.session.answers[qId];
  }

  get answeredCount(): number {
    return Object.values(this.session.answers).filter(a => {
      return (a.selectedOptionIds && a.selectedOptionIds.length > 0) || (a.textResponse && a.textResponse.trim().length > 0);
    }).length;
  }

  get flaggedCount(): number {
    return Object.values(this.session.answers).filter(a => a.isFlaggedForReview).length;
  }

  getAnswer(qId: string): CandidateAnswer | undefined {
    return this.session?.answers ? this.session.answers[qId] : undefined;
  }

  isItemAnswered(qId: string): boolean {
    const a = this.session.answers[qId];
    if (!a) return false;
    return !!((a.selectedOptionIds && a.selectedOptionIds.length > 0) || (a.textResponse && a.textResponse.trim().length > 0));
  }

  isItemFlagged(qId: string): boolean {
    return !!this.session.answers[qId]?.isFlaggedForReview;
  }

  selectSingleChoice(optionId: string): void {
    this.currentAnswer.selectedOptionIds = [optionId];
    this.answerSubject$.next();
  }

  toggleMultipleChoice(optionId: string): void {
    const arr = this.currentAnswer.selectedOptionIds || [];
    const index = arr.indexOf(optionId);
    if (index > -1) {
      arr.splice(index, 1);
    } else {
      arr.push(optionId);
    }
    this.currentAnswer.selectedOptionIds = [...arr];
    this.answerSubject$.next();
  }

  onTextChange(val: string): void {
    this.answerSubject$.next();
  }

  toggleFlag(): void {
    this.currentAnswer.isFlaggedForReview = !this.currentAnswer.isFlaggedForReview;
    this.syncCurrentAnswer();
  }

  goToPrevious(): void {
    if (this.currentIndex > 0) {
      this.currentIndex--;
    }
  }

  goToNext(): void {
    if (this.currentIndex < this.totalQuestions - 1) {
      this.currentIndex++;
    }
  }

  jumpToQuestion(index: number): void {
    this.currentIndex = index;
  }

  syncCurrentAnswer(): void {
    const ans = this.currentAnswer;
    this.api.saveAnswer(this.session.sessionId, {
      questionId: ans.questionId,
      selectedOptionIds: ans.selectedOptionIds,
      textResponse: ans.textResponse,
      isFlaggedForReview: ans.isFlaggedForReview,
      timeSpentSeconds: 5
    }).subscribe();
  }

  openReviewModal(): void {
    this.showReviewModal = true;
  }

  closeReviewModal(): void {
    this.showReviewModal = false;
  }

  confirmSubmission(): void {
    this.showReviewModal = false;
    this.api.submitExam(this.session.sessionId).subscribe(updatedSession => {
      this.session = updatedSession;
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => { });
      }
    });
  }

  getWordCount(text?: string): number {
    if (!text || !text.trim()) return 0;
    return text.trim().split(/\s+/).length;
  }

  getQuestionTypeName(type: QuestionType): string {
    switch (type) {
      case 1: return 'Single Choice';
      case 2: return 'Multiple Select';
      case 3: return 'Short Answer';
      case 4: return 'Extended Essay';
      case 5: return 'Code Analysis';
      default: return 'Standard';
    }
  }

  getTopicList(): any[] {
    if (!this.session.topicScores) return [];
    return Object.values(this.session.topicScores);
  }

  printScorecard(): void {
    window.print();
  }

  private calculateRemainingTime(): void {
    const expires = new Date(this.session.expiresAt).getTime();
    const now = new Date().getTime();
    this.remainingSeconds = Math.max(0, Math.floor((expires - now) / 1000));
  }

  private startTimer(): void {
    this.timerInterval = setInterval(() => {
      if (this.remainingSeconds > 0) {
        this.remainingSeconds--;
      } else {
        clearInterval(this.timerInterval);
        if (this.session.status === 1) {
          this.confirmSubmission();
        }
      }
    }, 1000);
  }

  get formattedTime(): string {
    const m = Math.floor(this.remainingSeconds / 60);
    const s = this.remainingSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
}
