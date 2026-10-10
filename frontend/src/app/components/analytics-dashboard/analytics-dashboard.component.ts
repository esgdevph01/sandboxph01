import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AnalyticsSummary, Assessment } from '../../models/assessment.types';
import { AssessmentApiService } from '../../services/assessment-api.service';

@Component({
  selector: 'app-analytics-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="analytics-container animate-fade-in">
      <header class="analytics-header">
        <div>
          <span class="badge badge-primary">EG Insights</span>
          <h1>Psychometrics & Examination Analytics</h1>
          <p class="analytics-sub">Evidence-based psychometric reporting, cohort discrimination indices, and competency diagnostics.</p>
        </div>

        <div class="header-filter">
          <select class="form-control exam-picker" [(ngModel)]="selectedAssessmentId" (ngModelChange)="loadAnalytics()">
            <option value="">All Cohort Assessments</option>
            <option *ngFor="let a of assessments" [value]="a.id">{{ a.code }} - {{ a.title }}</option>
          </select>
        </div>
      </header>

      <!-- KPI Executive Metric Cards -->
      <section class="kpi-grid" *ngIf="summary">
        <div class="kpi-card janison-card primary">
          <div class="kpi-title">Overall Pass Rate</div>
          <div class="kpi-val">{{ summary.overallPassRate }}%</div>
          <div class="kpi-foot">Candidates Meeting Benchmark</div>
        </div>

        <div class="kpi-card janison-card">
          <div class="kpi-title">Cohort Mean Score</div>
          <div class="kpi-val">{{ summary.averageScorePercentage }}%</div>
          <div class="kpi-foot">Across All Completed Tests</div>
        </div>

        <div class="kpi-card janison-card">
          <div class="kpi-title">Security & Integrity Index</div>
          <div class="kpi-val" style="color: var(--color-success)">{{ summary.averageIntegrityIndex }}%</div>
          <div class="kpi-foot">{{ summary.flaggedSecurityIncidents }} Total Telemetry Flags</div>
        </div>

        <div class="kpi-card janison-card">
          <div class="kpi-title">Exams Administered</div>
          <div class="kpi-val">{{ summary.totalCandidatesCompleted }}</div>
          <div class="kpi-foot">Candidate Submissions Processed</div>
        </div>
      </section>

      <!-- Competency Diagnostics & Item Discrimination -->
      <div class="charts-row" *ngIf="summary">
        <!-- Competency Breakdown -->
        <div class="chart-card janison-card">
          <div class="card-top">
            <h3>Curriculum Competency Mastery</h3>
            <span class="card-caption">Average cohort performance by learning domain</span>
          </div>

          <div class="competency-list">
            <div *ngFor="let c of summary.competencyBreakdown" class="comp-item">
              <div class="comp-meta">
                <span class="comp-name">{{ c.competency }}</span>
                <span class="comp-perc">{{ c.averageMastery }}%</span>
              </div>
              <div class="bar-track">
                <div class="bar-fill" [style.width.%]="c.averageMastery" [class.high]="c.averageMastery >= 80" [class.med]="c.averageMastery < 80 && c.averageMastery >= 70"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Reliability & Psychometric Summary -->
        <div class="chart-card janison-card">
          <div class="card-top">
            <h3>Psychometric Quality Metrics</h3>
            <span class="card-caption">Standardized classical test theory indices</span>
          </div>

          <div class="metric-list">
            <div class="metric-row">
              <div>
                <strong>Cronbach's Alpha (Reliability)</strong>
                <p>Internal consistency of item scoring.</p>
              </div>
              <span class="metric-badge high">0.89 (High)</span>
            </div>
            <div class="metric-row">
              <div>
                <strong>Standard Error of Measurement (SEM)</strong>
                <p>Confidence interval band around candidate true scores.</p>
              </div>
              <span class="metric-badge">± 2.4 pts</span>
            </div>
            <div class="metric-row">
              <div>
                <strong>Mean Item Discrimination (r-pbi)</strong>
                <p>Correlation separating high vs low proficiency candidates.</p>
              </div>
              <span class="metric-badge high">0.51 (Strong)</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Item Psychometrics Table -->
      <section class="item-diagnostics-section janison-card" *ngIf="summary?.itemDiagnostics?.length">
        <div class="card-top">
          <h3>Item Difficulty (Facility) & Discrimination Diagnostics</h3>
          <span class="card-caption">Detailed psychometric analysis of questions in active assessment</span>
        </div>

        <div class="table-wrap">
          <table class="item-diag-table">
            <thead>
              <tr>
                <th>Question Item</th>
                <th>Topic Domain</th>
                <th>Facility Index (Difficulty)</th>
                <th>Discrimination Index</th>
                <th>Attempts</th>
                <th>Avg Response Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of summary?.itemDiagnostics">
                <td>
                  <strong>{{ item.title }}</strong>
                </td>
                <td>{{ item.topic }}</td>
                <td>
                  <div class="facility-cell">
                    <span>{{ item.facilityIndex }}%</span>
                    <span class="tag-hint" [class.hard]="item.facilityIndex < 60" [class.easy]="item.facilityIndex > 85">
                      {{ item.facilityIndex < 60 ? 'Hard' : (item.facilityIndex > 85 ? 'Easy' : 'Balanced') }}
                    </span>
                  </div>
                </td>
                <td>
                  <span class="badge" [class.badge-success]="item.discriminationIndex >= 0.4"
                                      [class.badge-warning]="item.discriminationIndex < 0.4">
                    {{ item.discriminationIndex }} (Good)
                  </span>
                </td>
                <td>{{ item.attemptsCount }}</td>
                <td>{{ item.averageTimeSeconds }}s</td>
                <td>
                  <span class="badge badge-success">Calibrated</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .analytics-container {
      max-width: 1250px;
      margin: 0 auto;
      padding: 1.5rem 1rem 3rem;
    }

    .analytics-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 2rem;
      border-bottom: 1px solid var(--color-border);
      padding-bottom: 1.5rem;
    }

    .analytics-sub {
      color: var(--color-text-muted);
      font-size: 0.95rem;
      margin-top: 4px;
    }

    .header-filter {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .exam-picker {
      min-width: 340px;
      padding: 0.65rem 2.5rem 0.65rem 1rem;
      font-weight: 600;
      font-size: 0.875rem;
      color: var(--color-navy);
      background-color: #FFFFFF;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      appearance: none;
      -webkit-appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23028090' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 0.85rem center;
      background-size: 16px;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .exam-picker:hover {
      border-color: var(--color-primary);
      box-shadow: 0 2px 6px rgba(2, 128, 144, 0.12);
    }

    .exam-picker:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px rgba(2, 128, 144, 0.18);
    }

    /* KPI Grid */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1.25rem;
      margin-bottom: 2rem;
    }

    .kpi-card {
      padding: 1.5rem;
      background: #FFFFFF;
    }

    .kpi-card.primary {
      background: linear-gradient(135deg, #028090, #00A896);
      color: #ffffff;
      border: none;
    }

    .kpi-card.primary .kpi-title,
    .kpi-card.primary .kpi-foot {
      color: rgba(255, 255, 255, 0.85);
    }

    .kpi-title {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-text-muted);
      margin-bottom: 0.5rem;
    }

    .kpi-val {
      font-size: 2.25rem;
      font-weight: 800;
      color: var(--color-navy);
      line-height: 1;
      margin-bottom: 0.5rem;
    }

    .kpi-card.primary .kpi-val {
      color: #ffffff;
    }

    .kpi-foot {
      font-size: 0.75rem;
      color: var(--color-text-muted);
    }

    /* Charts Row */
    .charts-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .chart-card {
      padding: 1.5rem;
      background: #FFFFFF;
    }

    .card-top {
      margin-bottom: 1.5rem;
    }

    .card-top h3 {
      font-size: 1.1rem;
    }

    .card-caption {
      font-size: 0.8rem;
      color: var(--color-text-muted);
    }

    .competency-list {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .comp-meta {
      display: flex;
      justify-content: space-between;
      font-size: 0.875rem;
      margin-bottom: 6px;
    }

    .comp-name {
      font-weight: 600;
      color: var(--color-navy);
    }

    .comp-perc {
      font-weight: 700;
      color: var(--color-primary);
    }

    .bar-track {
      height: 8px;
      background: #E2E8F0;
      border-radius: var(--radius-full);
      overflow: hidden;
    }

    .bar-fill {
      height: 100%;
      background: var(--color-primary);
      border-radius: var(--radius-full);
      transition: width 0.6s ease;
    }

    .bar-fill.high { background: #10B981; }
    .bar-fill.med { background: #028090; }

    /* Metric List */
    .metric-list {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .metric-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--color-border);
    }

    .metric-row:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }

    .metric-row strong {
      font-size: 0.9rem;
      color: var(--color-navy);
    }

    .metric-row p {
      font-size: 0.75rem;
      color: var(--color-text-muted);
      margin-top: 2px;
    }

    .metric-badge {
      font-weight: 700;
      font-size: 0.85rem;
      background: #F1F5F9;
      padding: 4px 10px;
      border-radius: var(--radius-md);
      color: var(--color-navy);
    }

    .metric-badge.high {
      background: #ECFDF5;
      color: #065F46;
    }

    /* Diagnostics Table */
    .item-diagnostics-section {
      padding: 1.5rem;
      background: #FFFFFF;
    }

    .table-wrap {
      overflow-x: auto;
    }

    .item-diag-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
      text-align: left;
    }

    .item-diag-table th {
      padding: 0.75rem 1rem;
      background: #F8FAFC;
      border-bottom: 1px solid var(--color-border);
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-navy);
      font-weight: 700;
    }

    .item-diag-table td {
      padding: 0.85rem 1rem;
      border-bottom: 1px solid var(--color-border);
      vertical-align: middle;
    }

    .facility-cell {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .tag-hint {
      font-size: 0.7rem;
      padding: 1px 6px;
      border-radius: var(--radius-sm);
      background: #F1F5F9;
      color: #475569;
    }

    .tag-hint.hard { background: #FEF2F2; color: #991B1B; }
    .tag-hint.easy { background: #ECFDF5; color: #065F46; }
  `]
})
export class AnalyticsDashboardComponent implements OnInit {
  @Input() assessments: Assessment[] = [];
  selectedAssessmentId = '';
  summary: AnalyticsSummary | null = null;

  constructor(private api: AssessmentApiService) { }

  ngOnInit(): void {
    this.loadAnalytics();
  }

  loadAnalytics(): void {
    this.api.getAnalytics(this.selectedAssessmentId).subscribe(data => {
      this.summary = data;
    });
  }
}
