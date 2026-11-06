# Mock API mode

The app has no backend yet, so every `/api/*` call is answered by an in-memory
mock served from the Next catch-all route `src/app/api/[...path]/route.ts`.
Existing `fetch("/api/...")` calls and `apiClient` work unchanged.

## Files

| File          | Purpose                                                              |
| ------------- | -------------------------------------------------------------------- |
| `data.ts`     | Seed data (Bangladesh school, 2 sessions, classes 6-XII, 18 subjects, 25 students, 3 exams, marks, grading, rules, routine) plus the `seed-dalta` extension |
| `store.ts`    | Mutable in-memory DB on `globalThis` (survives HMR), `getStore`, `resetStore`, `uid` |
| `results.ts`  | Result engine: pass/fail, grades, combined papers, 4th-subject GPA bonus, ranks, report builders |
| `handlers.ts` | `handleMockRequest(method, pathSegments, searchParams, body?) => { status, body }` |
| `index.ts`    | Exports `handleMockRequest`, `resetMockStore`                        |

## Behaviour

- Responses are `{ success: true, data }` or `{ success: false, error }`.
  Some endpoints also return extra top-level keys the UI reads
  (`rows`, `tabulation`, `reportCards`, `list`, `institution`, ...).
- Unknown paths return `404 { success: false, error: "Not found" }`;
  known paths with an unsupported method return `405`.
- Writes (POST/PUT/PATCH/DELETE) mutate the in-memory store, so changes show up
  in later GETs. Restarting the dev server restores the seed.
- Reset without restarting: `POST /api/setup/seed`. Load the larger demo set
  (adds Class XI students and the "Year Final Examination-2026" exam):
  `POST /api/setup/seed-dalta`.
- Single tenant: institution `inst_1`, current session `2025-2026`.

## Demo credentials

Institution code `108254`, admin ID `admin_108254`, password `Smart@1234`.

## Sample endpoints

`academic-years`, `classes`, `subjects`, `students` (+ `/bulk`, `/promote`),
`exams` (+ `/subjects`), `exam-routine`, `marks`, `process-result`,
`setup/class-subjects`, `setup/seed`, `setup/seed-dalta`, `rules/grading`,
`rules/combined`, `rules/components`, `rules/templates` (+ `/apply`),
`reports/tabulation`, `reports/at-a-glance`, `reports/fail-list`,
`reports/marksheet/:id`, `reports/marksheet/bulk`, `sms/dispatch`,
`sms/custom`, `sms/attendance`, `auth/portal-info`, `auth/portal-login`,
`super-admin/institutions` (+ `/:id`).

Try: `/api/reports/tabulation?examId=exm_1`, `/api/students?classId=cls_10`.

## Swapping in a real backend

Delete `src/app/api/[...path]/route.ts` (or replace its body with a proxy);
the UI code does not depend on `src/mock`.
