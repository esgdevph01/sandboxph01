# Janison Digital Assessment Suite (.NET Framework 4.8 + Angular)

An enterprise-grade e-Assessment prototype inspired by **[Janison](https://www.janison.com/)**, global leaders in high-stakes online examinations (trusted for OECD PISA, ICAS, national education ministries, and university accreditations).

---

## 🏗️ Architecture Overview

The platform is designed around clean domain boundaries mirroring Janison's enterprise assessment architecture:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   Janison Assessment Suite                             │
├────────────────────────────────────────────────────────────────────────┤
│ 1. Janison Delivery (Candidate Test Player)                           │
│    • Real-time countdown timer & warning thresholds                   │
│    • Question palette drawer (Answered, Unanswered, Flagged, Current)  │
│    • Interactive item types: Single Choice, Multi-Select, Short Answer,│
│      Extended Essay (with live word counter), and Code/SQL Analysis    │
│    • Integrity telemetry: Tab defocus detection, fullscreen lock,     │
│      and real-time auto-save debouncing                                │
│    • Candidate Scorecard with competency mastery breakdown             │
│                                                                        │
│ 2. Janison Author (Authoring Studio & Item Bank)                       │
│    • Assessment blueprints configuration (time limits, pass benchmark) │
│    • Question item banking with Bloom's Taxonomy & difficulty tagging  │
│    • Multi-criteria rubric builder for subjective essay questions      │
│                                                                        │
│ 3. Janison Proctor & Marking                                           │
│    • Live candidate session feed with real-time integrity ratings      │
│    • Telemetry event audit timeline (e.g. TAB_BLUR, FULLSCREEN_EXIT)   │
│    • Assessor marking dashboard with rubric sliders & examiner notes   │
│                                                                        │
│ 4. Janison Insights (Psychometrics & Analytics)                        │
│    • Cohort pass rates & score distributions                           │
│    • Curriculum competency mastery bars                                │
│    • Classical Test Theory: Item Facility Index & Discrimination (r)   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP REST + JSON (Port 5000)
┌───────────────────────────────────▼────────────────────────────────────┐
│                  .NET Framework 4.8 / C# Backend Engine                │
├────────────────────────────────────────────────────────────────────────┤
│ • Self-Hosted HttpListener Web Server (Zero external IIS dependency)    │
│ • Thread-Safe In-Memory Domain Repositories                            │
│ • Automated Psychometric & Grading Engine                              │
│ • Proctoring Integrity Calculation & Deductions                        │
│ • Static Angular SPA File Server for single-port delivery              │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 💻 Tech Stack Specification

- **Backend**:
  - **Framework**: `.NET Framework 4.8` (C# 10.0, SDK-style project)
  - **Runtime**: Windows CLR (`net48`)
  - **Server**: Asynchronous self-hosted `System.Net.HttpListener` on `http://localhost:5000/`
  - **Serialization**: `Newtonsoft.Json 13.0.3`
  - **Static Hosting**: Embedded SPA fallback server serving Angular assets directly

- **Frontend**:
  - **Framework**: `Angular 19` (Standalone Components, TypeScript 5.7, RxJS 7.8)
  - **Design System**: Janison maritime navy (`#0B192C`), teal/cyan (`#028090`, `#00A896`), crisp elevated slate cards, and accessible typography (Plus Jakarta Sans & JetBrains Mono)
  - **Telemetry**: Native `document.requestFullscreen` API, `window:blur` proctoring listener, debounced auto-save pipeline.

---

## 🚀 Running the Prototype

### Option 1: Unified Single-Port Execution (Recommended)

The .NET Framework 4.8 backend is already pre-configured to host both the REST API and the compiled Angular production bundle on port 5000:

1. **Build and Run the .NET Framework 4.8 Backend**:
   ```powershell
   dotnet build backend\JanisonAssessment.Backend.csproj
   & "backend\bin\Debug\net48\JanisonAssessment.Backend.exe"
   ```

2. **Access the Application**:
   - Open your browser to: **[http://localhost:5000/](http://localhost:5000/)**
   - API Health Check: **[http://localhost:5000/api/health](http://localhost:5000/api/health)**
   - Assessments Endpoint: **[http://localhost:5000/api/assessments](http://localhost:5000/api/assessments)**

---

### Option 2: Angular Development Server (Hot Reload)

For active frontend development with live reloading:

1. **Start the .NET Framework 4.8 Backend** (in one terminal):
   ```powershell
   & "backend\bin\Debug\net48\JanisonAssessment.Backend.exe"
   ```

2. **Start the Angular Dev Server** (in a second terminal):
   ```powershell
   cd frontend
   npm start
   ```
   - Open your browser to: **[http://localhost:4200/](http://localhost:4200/)**

---

## 📑 Pre-Seeded Assessment Blueprints

1. **ICAS International Digital Technologies & Computational Thinking (`ICAS-DT-L8`)**:
   - 6 items testing binary search trees, algorithmic state trace, database isolation levels (ACID), zero-trust security, SQL composite indexing, and an architectural essay on high-concurrency offline exam delivery.
2. **Enterprise .NET Framework 4.8 & Distributed Architecture (`NET-ARCH-PRO`)**:
   - Professional certification exam measuring Large Object Heap (LOH) memory compaction, garbage collection internals, and async/await SynchronizationContext deadlock prevention.

---

## 🛡️ Proctoring & Security Features

- **Window Defocus Detection**: Triggers warning toast and records `TAB_BLUR` events with timestamps, penalizing candidate integrity scores.
- **Fullscreen Lock Enforcement**: Monitored via the Fullscreen API; detects escape events.
- **Offline Resilience & Continuous Auto-Save**: Candidate answers sync continuously using debounced REST calls with visual connectivity status indicators.
- **Manual Rubric Grading**: Subjective essay questions can be scored by human adjudicators with rubric sliders and examiner feedback notes.
