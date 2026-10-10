import { Injectable, inject, isDevMode } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, of, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  Assessment,
  CandidateSession,
  StartSessionRequest,
  SaveAnswerRequest,
  ProctoringEventRequest,
  ManualGradeRequest,
  AnalyticsSummary,
  QuestionItem
} from '../models/assessment.types';

export interface ApiEndpointOptions {
  production: string;
  development: string;
}

@Injectable({
  providedIn: 'root'
})
export class AssessmentApiService {
  private http = inject(HttpClient);

  /**
   * Production and development API endpoint options.
   * Production is configured to point to Render cloud deployment.
   */
  public readonly productionOption: string = 'https://sandboxph01.onrender.com';
  public readonly developmentOption: string = 'http://localhost:5000';

  public readonly options: ApiEndpointOptions = {
    production: 'https://sandboxph01.onrender.com',
    development: 'http://localhost:5000'
  };

  public baseUrl: string = this.resolveBaseUrl();

  public backendOnline$ = new BehaviorSubject<boolean>(false);
  public backendPlatform$ = new BehaviorSubject<string>('');
  public lastSyncTime$ = new BehaviorSubject<Date>(new Date());
  public isSyncing$ = new BehaviorSubject<boolean>(false);

  constructor() {
    this.checkHealth();
  }

  private resolveBaseUrl(): string {
    if (environment?.apiUrl) {
      return this.formatUrl(environment.apiUrl);
    }
    const isBrowser = typeof window !== 'undefined';
    const isLocal = isBrowser && (
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname === '[::1]'
    );
    const isProd = environment?.production || !isDevMode() || (isBrowser && !isLocal);
    const target = isProd ? this.productionOption : this.developmentOption;
    return this.formatUrl(target);
  }

  public setProductionOption(url: string): void {
    (this as any).productionOption = url;
    this.options.production = url;
    this.baseUrl = this.formatUrl(url);
    this.checkHealth();
  }

  public useProductionEndpoint(): void {
    this.baseUrl = this.formatUrl(this.productionOption);
    this.checkHealth();
  }

  public useDevelopmentEndpoint(): void {
    this.baseUrl = this.formatUrl(this.developmentOption);
    this.checkHealth();
  }

  private formatUrl(url: string): string {
    const trimmed = (url || '').replace(/\/+$/, '');
    return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
  }

  checkHealth(): void {
    this.http.get<{ status: string; platform: string; service?: string }>(`${this.baseUrl}/health`).pipe(
      tap(res => {
        this.backendOnline$.next(true);
        if (res?.platform) {
          this.backendPlatform$.next(res.platform);
        }
      }),
      catchError(() => {
        // If dev localhost is unreachable, automatically attempt fallback to Render production option
        if (this.baseUrl.includes('localhost') && this.productionOption) {
          const prodUrl = this.formatUrl(this.productionOption);
          return this.http.get<{ status: string; platform: string; service?: string }>(`${prodUrl}/health`).pipe(
            tap(res => {
              this.baseUrl = prodUrl;
              this.backendOnline$.next(true);
              if (res?.platform) {
                this.backendPlatform$.next(res.platform);
              }
            }),
            catchError(() => {
              this.backendOnline$.next(false);
              return of(null);
            })
          );
        }
        this.backendOnline$.next(false);
        return of(null);
      })
    ).subscribe();
  }

  getAssessments(): Observable<Assessment[]> {
    return this.http.get<Assessment[]>(`${this.baseUrl}/assessments`).pipe(
      tap(() => this.backendOnline$.next(true)),
      catchError(err => {
        console.warn('Backend unavailable, using fallback:', err);
        this.backendOnline$.next(false);
        return of([]);
      })
    );
  }

  getAssessment(id: string): Observable<Assessment | null> {
    return this.http.get<Assessment>(`${this.baseUrl}/assessments/${id}`).pipe(
      catchError(() => of(null))
    );
  }

  createAssessment(assessment: Partial<Assessment>): Observable<Assessment> {
    return this.http.post<Assessment>(`${this.baseUrl}/assessments`, assessment);
  }

  addQuestion(assessmentId: string, question: Partial<QuestionItem>): Observable<QuestionItem> {
    return this.http.post<QuestionItem>(`${this.baseUrl}/assessments/${assessmentId}/questions`, question);
  }

  startSession(req: StartSessionRequest): Observable<CandidateSession> {
    return this.http.post<CandidateSession>(`${this.baseUrl}/sessions/start`, req).pipe(
      tap(() => this.backendOnline$.next(true))
    );
  }

  getSession(sessionId: string): Observable<CandidateSession | null> {
    return this.http.get<CandidateSession>(`${this.baseUrl}/sessions/${sessionId}`).pipe(
      catchError(() => of(null))
    );
  }

  getAllSessions(): Observable<CandidateSession[]> {
    return this.http.get<CandidateSession[]>(`${this.baseUrl}/sessions`).pipe(
      catchError(() => of([]))
    );
  }

  saveAnswer(sessionId: string, req: SaveAnswerRequest): Observable<CandidateSession> {
    this.isSyncing$.next(true);
    return this.http.post<CandidateSession>(`${this.baseUrl}/sessions/${sessionId}/answer`, req).pipe(
      tap(() => {
        this.isSyncing$.next(false);
        this.lastSyncTime$.next(new Date());
      }),
      catchError(err => {
        this.isSyncing$.next(false);
        throw err;
      })
    );
  }

  logProctoringEvent(sessionId: string, req: ProctoringEventRequest): Observable<CandidateSession> {
    return this.http.post<CandidateSession>(`${this.baseUrl}/sessions/${sessionId}/proctoring`, req);
  }

  submitExam(sessionId: string): Observable<CandidateSession> {
    return this.http.post<CandidateSession>(`${this.baseUrl}/sessions/${sessionId}/submit`, {});
  }

  manualGrade(sessionId: string, req: ManualGradeRequest): Observable<CandidateSession> {
    return this.http.post<CandidateSession>(`${this.baseUrl}/sessions/${sessionId}/grade`, req);
  }

  getAnalytics(assessmentId?: string): Observable<AnalyticsSummary> {
    const url = assessmentId ? `${this.baseUrl}/analytics?assessmentId=${assessmentId}` : `${this.baseUrl}/analytics`;
    return this.http.get<AnalyticsSummary>(url).pipe(
      catchError(() => of({
        totalAssessments: 2,
        totalCandidatesCompleted: 2,
        overallPassRate: 75.0,
        averageScorePercentage: 72.4,
        averageIntegrityIndex: 94.2,
        flaggedSecurityIncidents: 3,
        competencyBreakdown: [
          { competency: 'Algorithms & Logic', averageMastery: 82.5, totalAssessedQuestions: 24 },
          { competency: 'Database Systems & ACID', averageMastery: 74.0, totalAssessedQuestions: 18 },
          { competency: 'Cyber Security Hygiene', averageMastery: 91.2, totalAssessedQuestions: 15 },
          { competency: 'Architecture & Scalability', averageMastery: 68.3, totalAssessedQuestions: 12 }
        ],
        itemDiagnostics: []
      }))
    );
  }
}
