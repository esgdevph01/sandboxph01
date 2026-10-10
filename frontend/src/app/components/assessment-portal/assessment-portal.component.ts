import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Assessment } from '../../models/assessment.types';

@Component({
  selector: 'app-assessment-portal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="portal-container animate-fade-in">
      <!-- Hero Banner -->
      <header class="portal-hero">
        <div class="hero-content">
          <div class="hero-badge">
            <span class="pulse-dot"></span>
            ENTERPRISE DIGITAL EXAMINATION
          </div>
          <h1>EG Digital Assessment Hub</h1>
          <p class="hero-subtitle">
            Enterprise assessment delivery trusted by global education ministries, universities, and certification boards.
            Select an assessment to begin secured candidate verification and delivery.
          </p>
        </div>

        <div class="quick-stats">
          <div class="stat-card">
            <div class="stat-number">{{ assessments.length }}</div>
            <div class="stat-label">Published Assessments</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">ISO 27001</div>
            <div class="stat-label">Security Standard</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">99.98%</div>
            <div class="stat-label">Delivery Reliability</div>
          </div>
        </div>
      </header>

      <!-- Assessment Catalog Grid -->
      <section class="catalog-section">
        <div class="section-header">
          <div>
            <h2>Available Assessments</h2>
            <p class="section-caption">High-stakes and formative digital examination tests ready for execution.</p>
          </div>
          <div class="filter-pills">
            <button class="filter-pill active">All Categories</button>
            <button class="filter-pill">Computational Thinking</button>
            <button class="filter-pill">Software Architecture</button>
          </div>
        </div>

        <div class="assessment-grid">
          <div *ngFor="let item of assessments" class="assessment-card janison-card">
            <div class="card-header">
              <span class="code-tag">{{ item.code }}</span>
              <span class="badge badge-primary">{{ item.category }}</span>
            </div>

            <h3 class="card-title">{{ item.title }}</h3>
            <p class="card-desc">{{ item.description }}</p>

            <div class="meta-row">
              <div class="meta-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <span>{{ item.durationMinutes }} Minutes</span>
              </div>
              <div class="meta-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                </svg>
                <span>{{ item.questions.length }} Items</span>
              </div>
              <div class="meta-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
                <span>Pass: {{ item.passingScorePercentage }}%</span>
              </div>
            </div>

            <div class="card-features">
              <span *ngIf="item.strictProctoringEnabled" class="feature-tag proctor">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
                Active Proctoring
              </span>
              <span *ngIf="item.allowCalculator" class="feature-tag">Onscreen Tools</span>
              <span class="feature-tag">Instant Feedback</span>
            </div>

            <div class="card-footer">
              <button class="btn btn-primary w-full" (click)="openStartModal(item)">
                <span>Launch Assessment</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- Candidate Verification / Launch Modal -->
    <div *ngIf="selectedAssessment" class="modal-backdrop" (click)="closeStartModal()">
      <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <span class="badge badge-primary">{{ selectedAssessment.code }}</span>
              <h2 style="margin-top: 6px;">Candidate Identity & Exam Readiness</h2>
            </div>
            <button class="close-btn" (click)="closeStartModal()">&times;</button>
          </div>

          <div class="modal-body">
            <div class="assessment-brief">
              <strong>{{ selectedAssessment.title }}</strong>
              <p style="font-size: 0.85rem; color: var(--color-text-muted); margin-top: 4px;">
                Allocated Duration: {{ selectedAssessment.durationMinutes }} Minutes | Total Items: {{ selectedAssessment.questions.length }}
              </p>
            </div>

            <div class="readiness-checklist">
              <div class="check-item">
                <span class="check-icon">✓</span>
                <div>
                  <strong>Secure Browser Environment</strong>
                  <p>Telemetry will monitor window focus, tab transitions, and fullscreen compliance.</p>
                </div>
              </div>
              <div class="check-item">
                <span class="check-icon">✓</span>
                <div>
                  <strong>Offline Resilience & Auto-Save</strong>
                  <p>Responses synchronize continuously with .NET Framework 4.8 backend API.</p>
                </div>
              </div>
            </div>

            <div class="form-group">
              <label for="candidateName">Candidate Full Name</label>
              <input id="candidateName" type="text" [(ngModel)]="candidateName" placeholder="e.g., Alice Chen" class="form-control" />
            </div>

            <div class="form-group">
              <label for="candidateEmail">Candidate Email / Institutional ID</label>
              <input id="candidateEmail" type="email" [(ngModel)]="candidateEmail" placeholder="e.g., alice.chen@university.edu" class="form-control" />
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeStartModal()">Cancel</button>
            <button class="btn btn-primary" (click)="confirmStart()" [disabled]="!candidateName || !candidateEmail">
              Start Exam Now
            </button>
          </div>
        </div>
      </div>
  `,
  styles: [`
    .portal-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 1.5rem 1rem 3rem;
    }

    .portal-hero {
      background: linear-gradient(135deg, #0B192C 0%, #1E2E45 60%, #028090 100%);
      border-radius: var(--radius-xl);
      padding: 2.5rem;
      color: #ffffff;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 2rem;
      margin-bottom: 2.5rem;
      box-shadow: 0 10px 25px -5px rgba(11, 25, 44, 0.25);
    }

    .hero-content {
      max-width: 650px;
    }

    .hero-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(255, 255, 255, 0.12);
      backdrop-filter: blur(8px);
      padding: 4px 12px;
      border-radius: var(--radius-full);
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      margin-bottom: 1rem;
      color: #02C39A;
      border: 1px solid rgba(2, 195, 154, 0.3);
    }

    .pulse-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #02C39A;
      box-shadow: 0 0 8px #02C39A;
      animation: pulseGlow 1.8s infinite;
    }

    .portal-hero h1 {
      color: #ffffff;
      font-size: 2.25rem;
      line-height: 1.2;
      margin-bottom: 0.75rem;
    }

    .hero-subtitle {
      color: #CBD5E1;
      font-size: 1rem;
      line-height: 1.6;
    }

    .quick-stats {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      min-width: 220px;
    }

    .stat-card {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: var(--radius-md);
      padding: 0.85rem 1.25rem;
      backdrop-filter: blur(6px);
    }

    .stat-number {
      font-size: 1.35rem;
      font-weight: 800;
      color: #ffffff;
    }

    .stat-label {
      font-size: 0.75rem;
      color: #94A3B8;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 1.5rem;
    }

    .section-caption {
      color: var(--color-text-muted);
      font-size: 0.95rem;
      margin-top: 4px;
    }

    .filter-pills {
      display: flex;
      gap: 0.5rem;
    }

    .filter-pill {
      background: #ffffff;
      border: 1px solid var(--color-border);
      padding: 0.4rem 0.9rem;
      border-radius: var(--radius-full);
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--color-text-muted);
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .filter-pill.active {
      background: var(--color-navy);
      color: #ffffff;
      border-color: var(--color-navy);
    }

    .assessment-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
      gap: 1.5rem;
    }

    .assessment-card {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .code-tag {
      font-family: var(--font-mono);
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--color-primary);
      background: var(--color-primary-light);
      padding: 2px 8px;
      border-radius: var(--radius-sm);
    }

    .card-title {
      font-size: 1.2rem;
      margin-bottom: 0.5rem;
      line-height: 1.35;
    }

    .card-desc {
      color: var(--color-text-muted);
      font-size: 0.875rem;
      line-height: 1.5;
      margin-bottom: 1.25rem;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .meta-row {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem 0;
      border-top: 1px solid var(--color-border);
      border-bottom: 1px solid var(--color-border);
      margin-bottom: 1rem;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.8rem;
      color: var(--color-text-muted);
      font-weight: 500;
    }

    .card-features {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      margin-bottom: 1.25rem;
    }

    .feature-tag {
      font-size: 0.75rem;
      font-weight: 600;
      background: #F1F5F9;
      color: #475569;
      padding: 2px 8px;
      border-radius: var(--radius-sm);
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    .feature-tag.proctor {
      background: #EFF6FF;
      color: #1D4ED8;
    }

    .w-full {
      width: 100%;
    }

    /* Modal Styling */
    .modal-header {
      padding: 1.5rem 1.5rem 1rem;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 1px solid var(--color-border);
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      color: var(--color-text-muted);
      cursor: pointer;
    }

    .modal-body {
      padding: 1.5rem;
    }

    .assessment-brief {
      background: var(--color-bg);
      padding: 1rem;
      border-radius: var(--radius-md);
      margin-bottom: 1.25rem;
      border: 1px solid var(--color-border);
    }

    .readiness-checklist {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-bottom: 1.5rem;
    }

    .check-item {
      display: flex;
      gap: 0.75rem;
      background: #F8FAFC;
      padding: 0.75rem 1rem;
      border-radius: var(--radius-md);
      border-left: 3px solid var(--color-primary);
    }

    .check-icon {
      color: var(--color-primary);
      font-weight: 800;
    }

    .check-item p {
      font-size: 0.8rem;
      color: var(--color-text-muted);
      margin-top: 2px;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    .form-group label {
      display: block;
      font-size: 0.825rem;
      font-weight: 600;
      color: var(--color-navy);
      margin-bottom: 0.35rem;
    }

    .form-control {
      width: 100%;
      padding: 0.65rem 0.85rem;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      font-family: var(--font-primary);
      font-size: 0.9rem;
      outline: none;
      transition: border-color 0.15s ease;
    }

    .form-control:focus {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px rgba(2, 128, 144, 0.15);
    }

    .modal-footer {
      padding: 1rem 1.5rem;
      background: #F8FAFC;
      border-top: 1px solid var(--color-border);
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
    }
  `]
})
export class AssessmentPortalComponent {
  @Input() assessments: Assessment[] = [];
  @Output() startAssessment = new EventEmitter<{ assessmentId: string; name: string; email: string }>();

  selectedAssessment: Assessment | null = null;
  candidateName = 'Alice Chen';
  candidateEmail = 'alice.chen@university.edu';

  openStartModal(item: Assessment): void {
    this.selectedAssessment = item;
  }

  closeStartModal(): void {
    this.selectedAssessment = null;
  }

  confirmStart(): void {
    if (!this.selectedAssessment || !this.candidateName || !this.candidateEmail) return;
    this.startAssessment.emit({
      assessmentId: this.selectedAssessment.id,
      name: this.candidateName,
      email: this.candidateEmail
    });
    this.closeStartModal();
  }
}
