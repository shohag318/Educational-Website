// src/lib/engine/nctb-engine.ts

export interface ComponentConfig {
  componentName: string;
  fullMarks: number;
  passMarks: number;
  isMandatoryPass: boolean;
}

export interface SubjectConfig {
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  passMode: "COMPONENT_WISE" | "AGGREGATE_ONLY" | "BOTH";
  aggregatePassMark: number;
  totalFullMarks: number;
  components: ComponentConfig[];
}

export interface CombinedSubjectRuleConfig {
  id?: string;
  name?: string | null;
  primarySubjectId: string;
  secondarySubjectId: string;
  combinedPassMark: number;
  combinedFullMarks: number;
  passMode: "AGGREGATE_ONLY" | "BOTH"; // AGGREGATE_ONLY = Paper 1 + Paper 2 >= combinedPassMark; BOTH = each paper must pass too
  gradeMode: "AVERAGE" | "INDIVIDUAL"; // AVERAGE = (MarksA+MarksB)/Full * 100 determines grade for both
}

export interface GradeSlab {
  letterGrade: string;
  gradePoint: number;
  markMin: number;
  markMax: number;
  isFail: boolean;
}

export interface RawStudentMarkEntry {
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  subjectType: "MANDATORY" | "GROUP_ELECTIVE" | "OPTIONAL_4TH";
  isAbsent: boolean;
  components: {
    componentName: string;
    obtainedMarks: number;
  }[];
}

export interface ProcessedSubjectDetail {
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  subjectType: "MANDATORY" | "GROUP_ELECTIVE" | "OPTIONAL_4TH";
  totalObtainedMarks: number;
  letterGrade: string;
  gradePoint: number;
  isPassed: boolean;
  failureReason: string | null;
  isCombined?: boolean;
  combinedPairSubjectId?: string | null;
  combinedMarks?: number | null;
  componentBreakdown: {
    componentName: string;
    obtainedMarks: number;
    passMarks: number;
    fullMarks: number;
    passed: boolean;
  }[];
}

export interface ProcessedStudentOutput {
  enrollmentId: string;
  totalObtainedMarks: number;
  gpaWithoutFourth: number;
  fourthSubjectBonusPoints: number;
  finalGpa: number;
  finalLetterGrade: string;
  isPassed: boolean;
  totalFailedSubjects: number;
  subjectResults: ProcessedSubjectDetail[];
}

export class NCTBResultEngine {
  private gradeSlabs: GradeSlab[];
  private fourthSubjectThreshold: number;
  private maxGpa: number;

  constructor(slabs: GradeSlab[], fourthThreshold = 2.0, maxGpa = 5.0) {
    // Sort descending by min mark to match highest threshold first
    this.gradeSlabs = [...slabs].sort((a, b) => b.markMin - a.markMin);
    this.fourthSubjectThreshold = fourthThreshold;
    this.maxGpa = maxGpa;
  }

  public resolveGradeFromMark(marks: number): { letter: string; point: number; isFail: boolean } {
    const clampedMark = Math.round(marks * 100) / 100;
    for (const slab of this.gradeSlabs) {
      if (clampedMark >= slab.markMin && clampedMark <= slab.markMax) {
        return { letter: slab.letterGrade, point: slab.gradePoint, isFail: slab.isFail };
      }
    }
    // Fallback if below minimum
    return { letter: "F", point: 0.0, isFail: true };
  }

  public resolveGradeFromGpa(gpa: number): string {
    for (const slab of this.gradeSlabs) {
      if (!slab.isFail && gpa >= slab.gradePoint) {
        return slab.letterGrade;
      }
    }
    return "F";
  }

  public processStudent(
    enrollmentId: string,
    marks: RawStudentMarkEntry[],
    configs: Map<string, SubjectConfig>,
    combinedRules: CombinedSubjectRuleConfig[] = []
  ): ProcessedStudentOutput {
    let grandTotalMarks = 0;
    const processedSubjects: ProcessedSubjectDetail[] = [];
    const initialSubjectPassed: boolean[] = [];

    // Phase 1: Evaluate each subject individually
    for (const item of marks) {
      const config = configs.get(item.subjectId);

      if (item.isAbsent) {
        processedSubjects.push({
          subjectId: item.subjectId,
          subjectCode: item.subjectCode,
          subjectName: item.subjectName,
          subjectType: item.subjectType,
          totalObtainedMarks: 0,
          letterGrade: "F",
          gradePoint: 0.0,
          isPassed: false,
          failureReason: "Absent in Exam",
          componentBreakdown: [],
        });
        initialSubjectPassed.push(false);
        continue;
      }

      let subjectTotal = 0;
      let subjectPassed = true;
      const failureReasons: string[] = [];
      const componentBreakdown: ProcessedSubjectDetail["componentBreakdown"] = [];

      for (const comp of item.components) {
        subjectTotal += comp.obtainedMarks;
        const compConfig = config?.components.find((c) => c.componentName === comp.componentName);
        const passMarks = compConfig ? compConfig.passMarks : 0;
        const fullMarks = compConfig ? compConfig.fullMarks : 100;
        const passedComp = compConfig && compConfig.isMandatoryPass ? comp.obtainedMarks >= passMarks : true;

        if (!passedComp) {
          subjectPassed = false;
          failureReasons.push(`Failed in ${comp.componentName} (${comp.obtainedMarks}/${passMarks})`);
        }

        componentBreakdown.push({
          componentName: comp.componentName,
          obtainedMarks: comp.obtainedMarks,
          passMarks,
          fullMarks,
          passed: passedComp,
        });
      }

      // Check aggregate pass if configured
      if (config && (config.passMode === "AGGREGATE_ONLY" || config.passMode === "BOTH")) {
        if (subjectTotal < config.aggregatePassMark) {
          subjectPassed = false;
          failureReasons.push(`Aggregate Fail (${subjectTotal}/${config.aggregatePassMark})`);
        }
      }

      grandTotalMarks += subjectTotal;

      // Grade determination
      const slab = this.resolveGradeFromMark(subjectTotal);
      const effectivePassed = subjectPassed && !slab.isFail;
      const effectiveGradePoint = effectivePassed ? slab.point : 0.0;
      const effectiveLetterGrade = effectivePassed ? slab.letter : "F";

      processedSubjects.push({
        subjectId: item.subjectId,
        subjectCode: item.subjectCode,
        subjectName: item.subjectName,
        subjectType: item.subjectType,
        totalObtainedMarks: Math.round(subjectTotal * 100) / 100,
        letterGrade: effectiveLetterGrade,
        gradePoint: effectiveGradePoint,
        isPassed: effectivePassed,
        failureReason: failureReasons.length > 0 ? failureReasons.join("; ") : null,
        componentBreakdown,
      });
      initialSubjectPassed.push(effectivePassed);
    }

    // Phase 2: Apply Combined Subject Logic (e.g., 1st Paper + 2nd Paper pairing)
    for (const rule of combinedRules) {
      const idxA = processedSubjects.findIndex((s) => s.subjectId === rule.primarySubjectId);
      const idxB = processedSubjects.findIndex((s) => s.subjectId === rule.secondarySubjectId);

      if (idxA === -1 || idxB === -1) continue;

      const subA = processedSubjects[idxA];
      const subB = processedSubjects[idxB];

      const rawA = marks.find((m) => m.subjectId === subA.subjectId);
      const rawB = marks.find((m) => m.subjectId === subB.subjectId);

      const aAbsent = rawA?.isAbsent ?? false;
      const bAbsent = rawB?.isAbsent ?? false;

      const combinedTotal = Math.round((subA.totalObtainedMarks + subB.totalObtainedMarks) * 100) / 100;
      const combinedFull = rule.combinedFullMarks || 200;
      const combinedPass = rule.combinedPassMark || 66;

      let pairPassed = false;
      let failureReason: string | null = null;

      if (aAbsent && bAbsent) {
        pairPassed = false;
        failureReason = "Absent in both papers";
      } else if (aAbsent || bAbsent) {
        if (rule.passMode === "BOTH") {
          pairPassed = false;
          failureReason = `Absent in ${aAbsent ? subA.subjectName : subB.subjectName}`;
        } else {
          pairPassed = combinedTotal >= combinedPass;
          if (!pairPassed) {
            failureReason = `Combined Fail with one paper absent (${combinedTotal}/${combinedPass})`;
          }
        }
      } else {
        if (rule.passMode === "BOTH") {
          const aPassedIndiv = initialSubjectPassed[idxA];
          const bPassedIndiv = initialSubjectPassed[idxB];
          pairPassed = combinedTotal >= combinedPass && aPassedIndiv && bPassedIndiv;
          if (!pairPassed) {
            failureReason = `Combined Fail (${combinedTotal < combinedPass ? `${combinedTotal}/${combinedPass}` : "Paper requirement not met"})`;
          }
        } else {
          // Standard NCTB Aggregate: Paper 1 + Paper 2 >= combinedPassMark
          pairPassed = combinedTotal >= combinedPass;
          if (!pairPassed) {
            failureReason = `Combined Fail (${combinedTotal}/${combinedPass})`;
          }
        }
      }

      // Determine grade from combined average mark
      const averagePercentage = (combinedTotal / combinedFull) * 100;
      const combinedSlab = this.resolveGradeFromMark(averagePercentage);
      const effectiveCombinedPoint = pairPassed ? combinedSlab.point : 0.0;
      const effectiveCombinedLetter = pairPassed ? combinedSlab.letter : "F";

      // Update both subjects with combined status
      subA.isCombined = true;
      subA.combinedPairSubjectId = subB.subjectId;
      subA.combinedMarks = combinedTotal;
      subA.isPassed = pairPassed;
      subA.failureReason = pairPassed ? null : failureReason;

      subB.isCombined = true;
      subB.combinedPairSubjectId = subA.subjectId;
      subB.combinedMarks = combinedTotal;
      subB.isPassed = pairPassed;
      subB.failureReason = pairPassed ? null : failureReason;

      if (rule.gradeMode === "AVERAGE" || !pairPassed) {
        subA.letterGrade = effectiveCombinedLetter;
        subA.gradePoint = effectiveCombinedPoint;
        subB.letterGrade = effectiveCombinedLetter;
        subB.gradePoint = effectiveCombinedPoint;
      } else {
        // INDIVIDUAL mode: if subject was failing individually, assign combined grade
        if (subA.gradePoint === 0) {
          subA.letterGrade = effectiveCombinedLetter;
          subA.gradePoint = effectiveCombinedPoint;
        }
        if (subB.gradePoint === 0) {
          subB.letterGrade = effectiveCombinedLetter;
          subB.gradePoint = effectiveCombinedPoint;
        }
      }
    }

    // Phase 3: Recalculate GPA, 4th subject bonus, and mandatory fails
    let mandatoryElectiveGpSum = 0;
    let mandatoryElectiveCount = 0;
    let mandatoryFailedCount = 0;
    let fourthSubjectBonusPoints = 0;

    const evaluatedCombinedRules = new Set<string>();

    for (let i = 0; i < processedSubjects.length; i++) {
      const sub = processedSubjects[i];
      const is4th = sub.subjectType === "OPTIONAL_4TH";

      const activeRule = combinedRules.find(
        (r) => r.primarySubjectId === sub.subjectId || r.secondarySubjectId === sub.subjectId
      );

      if (activeRule) {
        const ruleKey = activeRule.id || `${activeRule.primarySubjectId}-${activeRule.secondarySubjectId}`;
        if (!evaluatedCombinedRules.has(ruleKey)) {
          evaluatedCombinedRules.add(ruleKey);
          if (!sub.isPassed && !is4th) {
            mandatoryFailedCount++; // Failing a combined pair counts as failing 1 subject
          }
        }
      } else {
        if (!sub.isPassed && !is4th) {
          mandatoryFailedCount++;
        }
      }

      if (is4th) {
        if (sub.isPassed && sub.gradePoint > this.fourthSubjectThreshold) {
          fourthSubjectBonusPoints = sub.gradePoint - this.fourthSubjectThreshold;
        }
      } else {
        mandatoryElectiveCount++;
        mandatoryElectiveGpSum += sub.gradePoint;
      }
    }

    const gpaWithoutFourth =
      mandatoryElectiveCount > 0
        ? parseFloat((mandatoryElectiveGpSum / mandatoryElectiveCount).toFixed(2))
        : 0.0;

    let finalGpa = 0.0;
    let finalLetterGrade = "F";
    const overallPassed = mandatoryFailedCount === 0;

    if (overallPassed && mandatoryElectiveCount > 0) {
      const rawGpa = (mandatoryElectiveGpSum + fourthSubjectBonusPoints) / mandatoryElectiveCount;
      finalGpa = Math.min(this.maxGpa, parseFloat(rawGpa.toFixed(2)));
      finalLetterGrade = this.resolveGradeFromGpa(finalGpa);
    }

    return {
      enrollmentId,
      totalObtainedMarks: Math.round(grandTotalMarks * 100) / 100,
      gpaWithoutFourth,
      fourthSubjectBonusPoints: parseFloat(fourthSubjectBonusPoints.toFixed(2)),
      finalGpa,
      finalLetterGrade,
      isPassed: overallPassed,
      totalFailedSubjects: mandatoryFailedCount,
      subjectResults: processedSubjects,
    };
  }
}
