// src/lib/engine/merit-calculator.ts

export interface StudentForRanking {
  enrollmentId: string;
  classId: string;
  sectionId: string;
  classRoll: number;
  isPassed: boolean;
  finalGpa: number;
  totalObtainedMarks: number;
}

export interface RankedStudentResult {
  enrollmentId: string;
  meritRankClass: number;
  meritRankSection: number;
}

export function calculateMeritRanks(students: StudentForRanking[]): Map<string, { classRank: number; sectionRank: number }> {
  const result = new Map<string, { classRank: number; sectionRank: number }>();

  // Helper comparison
  const comparator = (a: StudentForRanking, b: StudentForRanking) => {
    // 1. Pass status first
    if (a.isPassed !== b.isPassed) {
      return a.isPassed ? -1 : 1;
    }
    // 2. Final GPA descending
    if (b.finalGpa !== a.finalGpa) {
      return b.finalGpa - a.finalGpa;
    }
    // 3. Total marks descending
    if (b.totalObtainedMarks !== a.totalObtainedMarks) {
      return b.totalObtainedMarks - a.totalObtainedMarks;
    }
    // 4. Roll ascending
    return a.classRoll - b.classRoll;
  };

  // Group by Class
  const byClass = new Map<string, StudentForRanking[]>();
  for (const s of students) {
    if (!byClass.has(s.classId)) byClass.set(s.classId, []);
    byClass.get(s.classId)!.push(s);
  }

  // Calculate Class Ranks (Dense Rank)
  const classRanks = new Map<string, number>();
  for (const [, list] of byClass) {
    const sorted = [...list].sort(comparator);
    let currentRank = 1;
    for (let i = 0; i < sorted.length; i++) {
      if (i > 0) {
        const prev = sorted[i - 1];
        const curr = sorted[i];
        const isTie =
          prev.isPassed === curr.isPassed &&
          prev.finalGpa === curr.finalGpa &&
          prev.totalObtainedMarks === curr.totalObtainedMarks;
        if (!isTie) {
          currentRank = i + 1;
        }
      }
      classRanks.set(sorted[i].enrollmentId, currentRank);
    }
  }

  // Group by Section
  const bySection = new Map<string, StudentForRanking[]>();
  for (const s of students) {
    if (!bySection.has(s.sectionId)) bySection.set(s.sectionId, []);
    bySection.get(s.sectionId)!.push(s);
  }

  // Calculate Section Ranks
  const sectionRanks = new Map<string, number>();
  for (const [, list] of bySection) {
    const sorted = [...list].sort(comparator);
    let currentRank = 1;
    for (let i = 0; i < sorted.length; i++) {
      if (i > 0) {
        const prev = sorted[i - 1];
        const curr = sorted[i];
        const isTie =
          prev.isPassed === curr.isPassed &&
          prev.finalGpa === curr.finalGpa &&
          prev.totalObtainedMarks === curr.totalObtainedMarks;
        if (!isTie) {
          currentRank = i + 1;
        }
      }
      sectionRanks.set(sorted[i].enrollmentId, currentRank);
    }
  }

  // Combine
  for (const s of students) {
    result.set(s.enrollmentId, {
      classRank: classRanks.get(s.enrollmentId) ?? 0,
      sectionRank: sectionRanks.get(s.enrollmentId) ?? 0,
    });
  }

  return result;
}
