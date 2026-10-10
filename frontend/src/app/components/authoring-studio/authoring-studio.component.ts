import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Assessment, QuestionItem, QuestionType } from '../../models/assessment.types';
import { AssessmentApiService } from '../../services/assessment-api.service';

@Component({
  selector: 'app-authoring-studio',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="author-container animate-fade-in">
      <!-- Top Studio Header -->
      <header class="studio-header">
        <div>
          <span class="badge badge-primary">EG Author Studio</span>
          <h1>Item Bank & Assessment Blueprints</h1>
          <p class="studio-sub">Create, categorize, and calibrate curriculum-aligned examination items with scoring rubrics.</p>
        </div>

        <div class="studio-actions">
          <button class="btn btn-secondary" (click)="openCreateExamModal()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="12" y1="8" x2="12" y2="16"></line>
              <line x1="8" y1="12" x2="16" y2="12"></line>
            </svg>
            <span>New Assessment</span>
          </button>
          <button class="btn btn-primary" (click)="openAddQuestionModal()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>Add Item to Bank</span>
          </button>
        </div>
      </header>

      <!-- Assessment Selector & Overview -->
      <section class="blueprint-summary janison-card">
        <div class="summary-left">
          <label class="select-label">Active Assessment Blueprint:</label>
          <select class="form-control exam-select" [(ngModel)]="selectedAssessmentId" (ngModelChange)="onSelectAssessment()">
            <option *ngFor="let a of assessments" [value]="a.id">
              {{ a.code }} - {{ a.title }} ({{ a.questions.length }} items)
            </option>
          </select>
        </div>

        <div class="blueprint-meta" *ngIf="currentAssessment">
          <div class="meta-cell">
            <span class="cell-label">Duration</span>
            <span class="cell-value">{{ currentAssessment.durationMinutes }}m</span>
          </div>
          <div class="meta-cell">
            <span class="cell-label">Pass Score</span>
            <span class="cell-value">{{ currentAssessment.passingScorePercentage }}%</span>
          </div>
          <div class="meta-cell">
            <span class="cell-label">Total Points</span>
            <span class="cell-value">{{ calculateTotalPoints() }} pts</span>
          </div>
          <div class="meta-cell">
            <span class="cell-label">Strict Proctoring</span>
            <span class="cell-value">{{ currentAssessment.strictProctoringEnabled ? 'Enabled' : 'Disabled' }}</span>
          </div>
        </div>
      </section>

      <!-- Questions List / Item Table -->
      <section class="items-inventory-section">
        <div class="inventory-header">
          <h2>Item Bank Questions ({{ currentAssessment?.questions?.length || 0 }})</h2>
          <div class="inventory-filters">
            <span class="filter-count">Showing all items in active blueprint</span>
          </div>
        </div>

        <div class="items-list" *ngIf="currentAssessment">
          <div *ngFor="let q of currentAssessment.questions; let i = index" class="item-card janison-card">
            <div class="item-card-header">
              <div class="item-id-pill">
                <span class="item-index">#{{ i + 1 }}</span>
                <span class="item-type-badge">{{ getTypeName(q.type) }}</span>
              </div>
              <div class="item-pill-group">
                <span class="badge badge-neutral">{{ q.domainTopic }}</span>
                <span class="badge" [class.badge-success]="q.difficulty === 'Easy'"
                                    [class.badge-warning]="q.difficulty === 'Medium'"
                                    [class.badge-danger]="q.difficulty === 'Hard'">
                  {{ q.difficulty }}
                </span>
                <span class="badge badge-primary">{{ q.points }} Points</span>
                <span class="bloom-badge">Bloom's: {{ q.bloomsTaxonomy }}</span>
              </div>
            </div>

            <h3 class="item-title">{{ q.title }}</h3>
            <p class="item-prompt-preview">{{ q.prompt }}</p>

            <div *ngIf="q.stimulusContext" class="stimulus-preview">
              <span class="stimulus-tag">Context:</span> {{ q.stimulusContext }}
            </div>

            <!-- Options Preview -->
            <div *ngIf="q.options?.length" class="options-preview-box">
              <div *ngFor="let opt of q.options" class="opt-preview-item" [class.is-correct]="q.correctOptionIds?.includes(opt.id)">
                <span class="check-mark">{{ q.correctOptionIds?.includes(opt.id) ? '✓ Correct:' : '○' }}</span>
                <span>{{ opt.text }}</span>
              </div>
            </div>

            <!-- Model Answer or Rubrics -->
            <div *ngIf="q.type === 4 && q.rubricCriteria?.length" class="rubrics-preview-box">
              <span class="rubric-header-lbl">Scoring Rubric Dimensions:</span>
              <div class="rubric-tags">
                <span *ngFor="let rub of q.rubricCriteria" class="rub-tag">
                  {{ rub.name }} (Max {{ rub.maxPoints }} pts)
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- Modal: Add Question Item -->
    <div *ngIf="showAddModal" class="modal-backdrop" (click)="closeAddModal()">
      <div class="modal-content modal-lg" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <span class="badge badge-primary">Authoring Assistant</span>
              <h2 style="margin-top: 6px;">Add New Question Item</h2>
            </div>
            <button class="close-btn" (click)="closeAddModal()">&times;</button>
          </div>

          <div class="modal-body">
            <div class="form-row-2">
              <div class="form-group">
                <label>Question Title</label>
                <input type="text" class="form-control" [(ngModel)]="newQ.title" placeholder="e.g., Cache Invalidation Strategies" />
              </div>
              <div class="form-group">
                <label>Question Type</label>
                <select class="form-control" [(ngModel)]="newQ.type">
                  <option [ngValue]="1">Single Choice (MCQ)</option>
                  <option [ngValue]="2">Multiple Select</option>
                  <option [ngValue]="3">Short Text Answer</option>
                  <option [ngValue]="4">Extended Essay (Rubric Scored)</option>
                  <option [ngValue]="5">Code / Script Analysis</option>
                </select>
              </div>
            </div>

            <div class="form-row-3">
              <div class="form-group">
                <label>Points Value</label>
                <input type="number" class="form-control" [(ngModel)]="newQ.points" />
              </div>
              <div class="form-group">
                <label>Difficulty</label>
                <select class="form-control" [(ngModel)]="newQ.difficulty">
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
              <div class="form-group">
                <label>Domain Topic</label>
                <input type="text" class="form-control" [(ngModel)]="newQ.domainTopic" placeholder="e.g. Algorithms" />
              </div>
            </div>

            <div class="form-group">
              <label>Stimulus / Context Scenario (Optional)</label>
              <textarea class="form-control" rows="2" [(ngModel)]="newQ.stimulusContext" placeholder="Case study or background scenario..."></textarea>
            </div>

            <div class="form-group">
              <label>Question Prompt (The Question Candidate Sees)</label>
              <textarea class="form-control" rows="3" [(ngModel)]="newQ.prompt" placeholder="Formulate the prompt clearly..."></textarea>
            </div>

            <!-- Code Snippet if applicable -->
            <div class="form-group" *ngIf="newQ.type === 5 || newQ.type === 1">
              <label>Code Snippet (Optional)</label>
              <textarea class="form-control code-font" rows="3" [(ngModel)]="newQ.codeSnippet" placeholder="Optional source code snippet..."></textarea>
            </div>

            <!-- Multiple Choice Options Editor -->
            <div class="options-editor" *ngIf="newQ.type === 1 || newQ.type === 2">
              <div class="options-editor-hdr">
                <label>Response Options & Correct Answer</label>
                <button class="btn btn-secondary btn-sm" (click)="addOptionToNewQ()">+ Add Option</button>
              </div>

              <div *ngFor="let opt of newQ.options; let idx = index" class="opt-edit-row">
                <input type="checkbox"
                       [checked]="newQ.correctOptionIds.includes(opt.id)"
                       (change)="toggleCorrectOption(opt.id)"
                       title="Mark as correct answer" />
                <input type="text" class="form-control" [(ngModel)]="opt.text" placeholder="Option text..." />
                <button class="delete-btn" (click)="removeOption(idx)">&times;</button>
              </div>
            </div>

            <!-- Short Answer Expected String -->
            <div class="form-group" *ngIf="newQ.type === 3">
              <label>Exact Expected Answer</label>
              <input type="text" class="form-control" [(ngModel)]="newQ.modelAnswer" placeholder="e.g. 42 or O(log N)" />
            </div>

            <!-- Essay Rubric -->
            <div class="form-group" *ngIf="newQ.type === 4">
              <label>Model Answer / Rubric Guidance</label>
              <textarea class="form-control" rows="2" [(ngModel)]="newQ.modelAnswer" placeholder="Key points candidate should cover..."></textarea>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeAddModal()">Cancel</button>
            <button class="btn btn-primary" (click)="saveNewQuestion()" [disabled]="!newQ.title || !newQ.prompt">
              Save Item to Assessment
            </button>
          </div>
        </div>
      </div>

    <!-- Modal: Create Assessment -->
    <div *ngIf="showCreateExamModal" class="modal-backdrop" (click)="closeCreateExamModal()">
      <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <span class="badge badge-primary">New Test Blueprint</span>
              <h2 style="margin-top: 6px;">Create Assessment</h2>
            </div>
            <button class="close-btn" (click)="closeCreateExamModal()">&times;</button>
          </div>

          <div class="modal-body">
            <div class="form-group">
              <label>Assessment Title</label>
              <input type="text" class="form-control" [(ngModel)]="newExam.title" placeholder="e.g., National Digital Literacy Test" />
            </div>
            <div class="form-row-2">
              <div class="form-group">
                <label>Test Code</label>
                <input type="text" class="form-control" [(ngModel)]="newExam.code" placeholder="e.g., NDL-2026" />
              </div>
              <div class="form-group">
                <label>Category</label>
                <input type="text" class="form-control" [(ngModel)]="newExam.category" placeholder="e.g., STEM" />
              </div>
            </div>
            <div class="form-row-2">
              <div class="form-group">
                <label>Duration (Minutes)</label>
                <input type="number" class="form-control" [(ngModel)]="newExam.durationMinutes" />
              </div>
              <div class="form-group">
                <label>Pass Score (%)</label>
                <input type="number" class="form-control" [(ngModel)]="newExam.passingScorePercentage" />
              </div>
            </div>
            <div class="form-group">
              <label>Description</label>
              <textarea class="form-control" rows="3" [(ngModel)]="newExam.description"></textarea>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeCreateExamModal()">Cancel</button>
            <button class="btn btn-primary" (click)="saveNewExam()" [disabled]="!newExam.title || !newExam.code">
              Publish Blueprint
            </button>
          </div>
        </div>
      </div>
  `,
  styles: [`
    .author-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 1.5rem 1rem 3rem;
    }

    .studio-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 2rem;
      border-bottom: 1px solid var(--color-border);
      padding-bottom: 1.5rem;
    }

    .studio-sub {
      color: var(--color-text-muted);
      font-size: 0.95rem;
      margin-top: 4px;
    }

    .studio-actions {
      display: flex;
      gap: 0.75rem;
    }

    .blueprint-summary {
      padding: 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      background: #FFFFFF;
    }

    .summary-left {
      min-width: 380px;
    }

    .select-label {
      display: block;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-navy);
      margin-bottom: 0.35rem;
    }

    .exam-select {
      font-weight: 600;
    }

    .blueprint-meta {
      display: flex;
      gap: 2rem;
    }

    .meta-cell {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }

    .cell-label {
      font-size: 0.75rem;
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .cell-value {
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--color-navy);
    }

    .inventory-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .filter-count {
      font-size: 0.85rem;
      color: var(--color-text-muted);
    }

    .items-list {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .item-card {
      padding: 1.5rem;
      background: #FFFFFF;
    }

    .item-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }

    .item-id-pill {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .item-index {
      font-family: var(--font-mono);
      font-weight: 800;
      color: var(--color-primary);
    }

    .item-type-badge {
      font-size: 0.75rem;
      font-weight: 600;
      background: #F1F5F9;
      color: #334155;
      padding: 2px 8px;
      border-radius: var(--radius-sm);
    }

    .item-pill-group {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .bloom-badge {
      font-size: 0.75rem;
      color: #64748B;
      font-style: italic;
    }

    .item-title {
      font-size: 1.1rem;
      margin-bottom: 0.5rem;
    }

    .item-prompt-preview {
      color: var(--color-text-main);
      font-size: 0.95rem;
      line-height: 1.5;
      margin-bottom: 0.75rem;
    }

    .stimulus-preview {
      background: #F8FAFC;
      border-left: 3px solid var(--color-primary);
      padding: 0.5rem 0.75rem;
      border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
      font-size: 0.85rem;
      color: var(--color-text-muted);
      margin-bottom: 0.75rem;
    }

    .stimulus-tag {
      font-weight: 700;
      color: var(--color-navy);
    }

    .options-preview-box {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 0.5rem;
      margin-top: 0.75rem;
    }

    .opt-preview-item {
      font-size: 0.85rem;
      background: #F8FAFC;
      border: 1px solid var(--color-border);
      padding: 0.5rem 0.75rem;
      border-radius: var(--radius-sm);
      display: flex;
      gap: 6px;
    }

    .opt-preview-item.is-correct {
      background: #ECFDF5;
      border-color: #A7F3D0;
      color: #065F46;
      font-weight: 600;
    }

    .check-mark {
      font-weight: 700;
    }

    .rubrics-preview-box {
      margin-top: 0.75rem;
      background: #F8FAFC;
      padding: 0.5rem 0.75rem;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .rubric-header-lbl {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--color-navy);
    }

    .rubric-tags {
      display: flex;
      gap: 0.5rem;
    }

    .rub-tag {
      font-size: 0.75rem;
      background: #E2E8F0;
      padding: 2px 8px;
      border-radius: var(--radius-sm);
    }

    /* Modal Form Utilities */
    .modal-lg {
      max-width: 760px;
    }

    .form-row-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .form-row-3 {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 1rem;
    }

    .code-font {
      font-family: var(--font-mono);
      font-size: 0.85rem;
    }

    .options-editor {
      background: #F8FAFC;
      border: 1px solid var(--color-border);
      padding: 1rem;
      border-radius: var(--radius-md);
      margin-bottom: 1rem;
    }

    .options-editor-hdr {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }

    .options-editor-hdr label {
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--color-navy);
    }

    .btn-sm {
      padding: 0.25rem 0.65rem;
      font-size: 0.75rem;
    }

    .opt-edit-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }

    .delete-btn {
      background: none;
      border: none;
      color: #EF4444;
      font-size: 1.25rem;
      cursor: pointer;
      padding: 0 4px;
    }

    .modal-header {
      padding: 1.5rem 1.5rem 1rem;
      display: flex;
      justify-content: space-between;
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
      display: flex;
      flex-direction: column;
      gap: 1rem;
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
export class AuthoringStudioComponent implements OnInit {
  @Input() assessments: Assessment[] = [];

  selectedAssessmentId = '';
  currentAssessment: Assessment | null = null;
  showAddModal = false;
  showCreateExamModal = false;

  newQ: any = {
    title: '',
    prompt: '',
    stimulusContext: '',
    codeSnippet: '',
    type: 1,
    points: 10,
    difficulty: 'Medium',
    domainTopic: 'Algorithms',
    bloomsTaxonomy: 'Analyzing',
    options: [
      { id: 'opt-a', text: 'Option A' },
      { id: 'opt-b', text: 'Option B' }
    ],
    correctOptionIds: ['opt-a'],
    modelAnswer: ''
  };

  newExam: any = {
    title: '',
    code: '',
    category: 'STEM & Digital Skills',
    durationMinutes: 40,
    passingScorePercentage: 70,
    description: '',
    strictProctoringEnabled: true
  };

  constructor(private api: AssessmentApiService) { }

  ngOnInit(): void {
    if (this.assessments.length > 0) {
      this.selectedAssessmentId = this.assessments[0].id;
      this.currentAssessment = this.assessments[0];
    }
  }

  onSelectAssessment(): void {
    this.currentAssessment = this.assessments.find(a => a.id === this.selectedAssessmentId) || null;
  }

  calculateTotalPoints(): number {
    if (!this.currentAssessment) return 0;
    return this.currentAssessment.questions.reduce((sum, q) => sum + q.points, 0);
  }

  getTypeName(type: QuestionType): string {
    switch (type) {
      case 1: return 'Single Choice';
      case 2: return 'Multiple Select';
      case 3: return 'Short Answer';
      case 4: return 'Essay (Rubric)';
      case 5: return 'Code Analysis';
      default: return 'Item';
    }
  }

  openAddQuestionModal(): void {
    this.showAddModal = true;
  }

  closeAddModal(): void {
    this.showAddModal = false;
  }

  addOptionToNewQ(): void {
    const nextId = 'opt-' + Math.random().toString(36).substring(2, 6);
    this.newQ.options.push({ id: nextId, text: '' });
  }

  removeOption(index: number): void {
    this.newQ.options.splice(index, 1);
  }

  toggleCorrectOption(id: string): void {
    if (this.newQ.type === 1) {
      this.newQ.correctOptionIds = [id];
    } else {
      const idx = this.newQ.correctOptionIds.indexOf(id);
      if (idx > -1) {
        this.newQ.correctOptionIds.splice(idx, 1);
      } else {
        this.newQ.correctOptionIds.push(id);
      }
    }
  }

  saveNewQuestion(): void {
    if (!this.currentAssessment) return;
    this.api.addQuestion(this.currentAssessment.id, this.newQ).subscribe(savedQ => {
      this.currentAssessment?.questions.push(savedQ);
      this.closeAddModal();
      // Reset form
      this.newQ.title = '';
      this.newQ.prompt = '';
    });
  }

  openCreateExamModal(): void {
    this.showCreateExamModal = true;
  }

  closeCreateExamModal(): void {
    this.showCreateExamModal = false;
  }

  saveNewExam(): void {
    this.api.createAssessment(this.newExam).subscribe(savedExam => {
      this.assessments.push(savedExam);
      this.selectedAssessmentId = savedExam.id;
      this.currentAssessment = savedExam;
      this.closeCreateExamModal();
    });
  }
}
