import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AssessmentApiService } from './services/assessment-api.service';
import { Assessment, CandidateSession } from './models/assessment.types';
import { AssessmentPortalComponent } from './components/assessment-portal/assessment-portal.component';
import { TestPlayerComponent } from './components/test-player/test-player.component';
import { AuthoringStudioComponent } from './components/authoring-studio/authoring-studio.component';
import { ProctorMarkingComponent } from './components/proctor-marking/proctor-marking.component';
import { AnalyticsDashboardComponent } from './components/analytics-dashboard/analytics-dashboard.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    AssessmentPortalComponent,
    TestPlayerComponent,
    AuthoringStudioComponent,
    ProctorMarkingComponent,
    AnalyticsDashboardComponent
  ],
  template: `
    <div class="app-shell">
      <!-- Global Platform Navigation (hidden when in full candidate testing mode if desired, or compact) -->
      <nav class="global-navbar" *ngIf="activeTab !== 'player'">
        <div class="nav-left">
          <div class="logo-group" (click)="activeTab = 'portal'">
            <div class="logo-mark">J</div>
            <div class="brand-text">
              <span class="brand-title">EG</span>
              <span class="brand-sub">Assessment Suite</span>
            </div>
          </div>

          <div class="nav-tabs">
            <button class="nav-tab" [class.active]="isTab('portal')" (click)="activeTab = 'portal'">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
              <span>Assessment Portal</span>
            </button>

            <button class="nav-tab" *ngIf="activeSession" [class.active]="isTab('player')" (click)="activeTab = 'player'">
              <span class="live-pulse"></span>
              <span>Candidate Player (Active)</span>
            </button>

            <button class="nav-tab" [class.active]="isTab('author')" (click)="activeTab = 'author'">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
              </svg>
              <span>Authoring Studio</span>
            </button>

            <button class="nav-tab" [class.active]="isTab('proctor')" (click)="activeTab = 'proctor'">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
              <span>Proctoring & Marking</span>
            </button>

            <button class="nav-tab" [class.active]="isTab('analytics')" (click)="activeTab = 'analytics'">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="20" x2="18" y2="10"></line>
                <line x1="12" y1="20" x2="12" y2="4"></line>
                <line x1="6" y1="20" x2="6" y2="14"></line>
              </svg>
              <span>Psychometrics & Insights</span>
            </button>
          </div>
        </div>

        <div class="nav-right">
          <!-- Backend Connection Status Pill -->
          <div class="backend-status-pill" [class.online]="backendOnline" [class.offline]="!backendOnline">
            <span class="status-indicator"></span>
            <span class="status-label">
              {{ backendOnline ? '.NET Framework 4.8 API Connected' : 'Connecting to .NET 4.8 API (Port 5000)...' }}
            </span>
          </div>

          <button class="btn btn-primary btn-sm" *ngIf="assessments.length > 0" (click)="quickLaunchDemo()">
            <span>Quick Start ICAS Exam</span>
          </button>
        </div>
      </nav>

      <!-- Main Router / Switcher Content -->
      <main class="main-content">
        <!-- Tab 1: Portal -->
        <app-assessment-portal
          *ngIf="activeTab === 'portal'"
          [assessments]="assessments"
          (startAssessment)="onStartAssessment($event)">
        </app-assessment-portal>

        <!-- Tab 2: Candidate Test Player -->
        <app-test-player
          *ngIf="activeTab === 'player' && activeAssessment && activeSession"
          [assessment]="activeAssessment"
          [session]="activeSession"
          (exitToPortal)="onExitToPortal()">
        </app-test-player>

        <!-- Tab 3: Authoring Studio -->
        <app-authoring-studio
          *ngIf="activeTab === 'author'"
          [assessments]="assessments">
        </app-authoring-studio>

        <!-- Tab 4: Proctoring & Marking -->
        <app-proctor-marking
          *ngIf="activeTab === 'proctor'"
          [assessments]="assessments">
        </app-proctor-marking>

        <!-- Tab 5: Analytics & Insights -->
        <app-analytics-dashboard
          *ngIf="activeTab === 'analytics'"
          [assessments]="assessments">
        </app-analytics-dashboard>
      </main>
    </div>
  `,
  styles: [`
    .app-shell {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    .global-navbar {
      background: #0B192C;
      color: #FFFFFF;
      height: 64px;
      padding: 0 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      position: sticky;
      top: 0;
      z-index: 50;
    }

    .nav-left {
      display: flex;
      align-items: center;
      gap: 2rem;
    }

    .logo-group {
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
    }

    .logo-mark {
      width: 34px;
      height: 34px;
      background: linear-gradient(135deg, #028090 0%, #00A896 100%);
      color: #ffffff;
      font-weight: 800;
      font-size: 1.2rem;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(2, 128, 144, 0.4);
    }

    .brand-text {
      display: flex;
      flex-direction: column;
      line-height: 1.1;
    }

    .brand-title {
      font-size: 1.1rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: #FFFFFF;
    }

    .brand-sub {
      font-size: 0.65rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #94A3B8;
    }

    .nav-tabs {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .nav-tab {
      background: transparent;
      border: none;
      color: #94A3B8;
      font-family: var(--font-primary);
      font-size: 0.825rem;
      font-weight: 600;
      padding: 0.5rem 0.85rem;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .nav-tab:hover {
      color: #FFFFFF;
      background: rgba(255, 255, 255, 0.06);
    }

    .nav-tab.active {
      color: #FFFFFF;
      background: rgba(2, 128, 144, 0.25);
      border: 1px solid rgba(2, 128, 144, 0.4);
    }

    .live-pulse {
      width: 8px;
      height: 8px;
      background: #10B981;
      border-radius: 50%;
      box-shadow: 0 0 6px #10B981;
      animation: pulseGlow 1.5s infinite;
    }

    .nav-right {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .backend-status-pill {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 12px;
      border-radius: var(--radius-full);
      font-size: 0.75rem;
      font-weight: 600;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.12);
    }

    .status-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }

    .backend-status-pill.online .status-indicator {
      background: #10B981;
      box-shadow: 0 0 6px #10B981;
    }

    .backend-status-pill.online .status-label {
      color: #A7F3D0;
    }

    .backend-status-pill.offline .status-indicator {
      background: #F59E0B;
    }

    .backend-status-pill.offline .status-label {
      color: #FCD34D;
    }

    .btn-sm {
      padding: 0.4rem 0.85rem;
      font-size: 0.8rem;
    }

    .main-content {
      flex: 1;
    }
  `]
})
export class AppComponent implements OnInit {
  private api = inject(AssessmentApiService);

  activeTab: 'portal' | 'player' | 'author' | 'proctor' | 'analytics' = 'portal';
  assessments: Assessment[] = [];
  backendOnline = false;

  activeAssessment: Assessment | null = null;
  activeSession: CandidateSession | null = null;

  ngOnInit(): void {
    this.api.backendOnline$.subscribe(online => {
      this.backendOnline = online;
    });

    this.api.getAssessments().subscribe(list => {
      this.assessments = list;
    });
  }

  onStartAssessment(event: { assessmentId: string; name: string; email: string }): void {
    const found = this.assessments.find(a => a.id === event.assessmentId);
    if (!found) return;

    this.activeAssessment = found;
    this.api.startSession({
      assessmentId: event.assessmentId,
      candidateName: event.name,
      candidateEmail: event.email
    }).subscribe(sess => {
      this.activeSession = sess;
      this.activeTab = 'player';
    });
  }

  quickLaunchDemo(): void {
    if (this.assessments.length === 0) return;
    const target = this.assessments[0];
    this.onStartAssessment({
      assessmentId: target.id,
      name: 'Alice Chen',
      email: 'alice.chen@university.edu'
    });
  }

  isTab(tab: string): boolean {
    return this.activeTab === tab;
  }

  onExitToPortal(): void {
    this.activeTab = 'portal';
    // Refresh assessment list
    this.api.getAssessments().subscribe(l => this.assessments = l);
  }
}
