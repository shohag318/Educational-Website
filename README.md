# NCTB Smart School Management & Result Processing System

A complete, production-grade, highly scalable School Management and Result Processing System tailored for the **Bangladesh National Curriculum and Textbook Board (NCTB)** standards.

## 🚀 Key Features & Highlights

- **100% Dynamic Architecture**: Zero hardcoding. All subjects, component distributions (CQ, MCQ, Practical, CA), grading slabs, pass thresholds, 4th-subject surplus rules, and formulas are configured via the Admin Dashboard.
- **NCTB Grading Engine**:
  - Full support for component-wise pass/fail rules (e.g. failing MCQ fails the subject).
  - Configurable 4th-subject surplus logic ($\text{Bonus GP} = \max(0, \text{GP} - 2.00)$) which contributes to GPA without expanding the subject divisor.
  - Overall GPA capped at 5.00.
  - Automated SQL-grade tie-breaking Merit Ranking (Pass status $\rightarrow$ Final GPA $\rightarrow$ Total Marks $\rightarrow$ Class Roll).
- **Spreadsheet-Speed Mark Entry**: High-performance tabular data entry with live out-of-range mark validation and auto-save.
- **Draft & Anomaly Detection View**: Visualizes fail-rate anomalies, high-total component fails, and unrecorded marks before publishing.
- **State Machine Publish Locking**: `DRAFT` $\rightarrow$ `MARK_ENTRY` $\rightarrow$ `DRAFT_PREVIEW` $\rightarrow$ `PUBLISHED` (locks data from modification).
- **Bangladeshi SMS Gateway Integration**: Automated bulk notification dispatch to registered guardians with custom template interpolations.
- **NCTB-Compliant Reports**:
  - Master Tabulation Sheets (Class-wise & Section-wise grids with print formatting).
  - Official Printable Academic Transcripts / Mark Sheets with side-by-side NCTB grade slab legends.
  - Fail Subject List filtering by subject with exact failure reasons (e.g. `Failed in MCQ (5/8)`).

---

## 🛠️ Tech Stack

- **Frontend**: [Next.js 14 (App Router)](https://nextjs.org), TypeScript, Tailwind CSS, Lucide Icons.
- **Backend**: Next.js Server Handlers, Node.js TypeScript computation engines.
- **Database & ORM**: PostgreSQL / SQLite via [Prisma ORM](https://www.prisma.io/).

---

## 🧭 The 13-Step Administrative Workflow

```
[Phase 1: Institution Setup & Onboarding]
  ├── Step 1: Class & Section Management (/setup/classes)
  ├── Step 2: Class & Group-wise Subject Mapping (/setup/subject-mapping) [NEW]
  ├── Step 3: Student Enrollment & Guardian Registry (/setup/students)
  └── Step 4: Examination Instances & Lifecycle Management (/setup/exams)

[Phase 2: Academic Rules & Subject Mapping]
  ├── Step 5: Student 4th-Subject & Elective Matrix (/academic/subject-mapping)
  └── Step 6: Dynamic Subject Logic & Grading Rule Engine (/academic/rules)

[Phase 3: Data Entry, Processing, & Review]
  ├── Step 7: High-Speed Mark Input Spreadsheet (/marks/entry)
  ├── Step 8 & 9: Result Processing Engine & Draft Verification (/results/review)
  └── Step 10: Mark Override & Immutable Audit Trail (/marks/audit)

[Phase 4: Publication, Notification, & Reporting]
  ├── Step 11: Examination Publication & State Lock (/results/publish)
  ├── Step 12: Automated Guardian SMS Notification Gateway (/notifications/sms)
  └── Step 13: Advanced Reporting:
       ├── Master Tabulation Sheet (/reports/tabulation)
       ├── Individual Printable Report Cards (/reports/marksheet)
       └── Fail Subject Roster (/reports/fail-list)
```

---

## ⚡ Quick Start Guide

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Database
The system uses SQLite by default for zero-setup instant local execution.

```bash
# Push database schema
npx prisma db push

# Seed realistic NCTB demo data (Class 10, Science, 5 Students, 7 Subjects, Marks)
npm run db:seed
```

*(To use PostgreSQL, simply update `provider = "postgresql"` in `prisma/schema.prisma` and provide `DATABASE_URL` in `.env`)*.

### 3. Run Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🧮 NCTB Calculation Algorithm Details

### 1. Grade Resolution Formula
Given total marks $M \in [0, 100]$:
$$
\text{Grade}(M) = \begin{cases} 
\text{A+} \ (5.00), & 80 \le M \le 100 \\
\text{A} \ \ (4.00), & 70 \le M < 80 \\
\text{A-} \ (3.50), & 60 \le M < 70 \\
\text{B} \ \ (3.00), & 50 \le M < 60 \\
\text{C} \ \ (2.00), & 40 \le M < 50 \\
\text{D} \ \ (1.00), & 33 \le M < 40 \\
\text{F} \ \ (0.00), & 0 \le M < 33 
\end{cases}
$$

### 2. Component Pass Criteria
For any configured subject component $c$ (e.g., CQ, MCQ, Practical):
$$\text{If } \text{isMandatoryPass}(c) \land \text{ObtainedMarks}(c) < \text{PassMarks}(c) \implies \text{Subject Fail (F)}$$

### 3. 4th Subject Surplus Formula
$$
\text{Bonus Points} = \max(0, \text{GradePoint}_{4\text{th}} - 2.00)
$$

### 4. Overall GPA Formula
$$
\text{GPA}_{\text{final}} = \min\left(5.00, \frac{\sum_{i=1}^{N} \text{GP}_{i} + \text{Bonus Points}}{N}\right)
$$
*(Where $N$ is the count of mandatory and elective subjects, strictly excluding the 4th subject from the denominator)*.

---

## 📄 License
MIT License. Built for Bangladesh National Curriculum compliance.
