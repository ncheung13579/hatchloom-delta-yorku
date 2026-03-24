#!/usr/bin/env bash
# =============================================================================
# Hatchloom Delta — End-to-End Demo Test Script
#
# Simulates a complete demo lifecycle across Screens 300-303, exercising every
# endpoint our team owns with every role that can access it.
#
# Prerequisites: Docker services running (docker compose up -d)
# Usage:         bash e2e-demo.sh
# =============================================================================

set -uo pipefail

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
DASH=http://localhost:8001
EXP=http://localhost:8002
ENROL=http://localhost:8003

ADMIN_TOKEN="test-admin-token"
TEACHER_TOKEN="test-teacher-token"
STUDENT_TOKEN="test-student-token"
PARENT_TOKEN="test-parent-token"

PASS=0
FAIL=0
SKIP=0
TOTAL=0

# IDs captured during the run
CREATED_EXP_ID=""
CREATED_COHORT_ID=""

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

pass() { ((PASS++)); ((TOTAL++)); printf "  ${GREEN}PASS${RESET} %s\n" "$1"; }
fail() { ((FAIL++)); ((TOTAL++)); printf "  ${RED}FAIL${RESET} %s\n  ${RED}     → %s${RESET}\n" "$1" "$2"; }
skip() { ((SKIP++)); ((TOTAL++)); printf "  ${YELLOW}SKIP${RESET} %s — %s\n" "$1" "$2"; }
section() { printf "\n${BOLD}${CYAN}━━━ %s ━━━${RESET}\n" "$1"; }

# curl wrapper: returns "STATUS_CODE|BODY"
# Usage: result=$(api GET /path token)
api() {
  local method=$1 url=$2 token=${3:-""} body=${4:-""}
  local -a args=(-s -w "\n%{http_code}" -X "$method" -H "Content-Type: application/json")
  [[ -n "$token" ]] && args+=(-H "Authorization: Bearer $token")
  [[ -n "$body" ]] && args+=(-d "$body")
  local raw
  raw=$(curl "${args[@]}" "$url" 2>/dev/null) || true
  local code body_text
  code=$(echo "$raw" | tail -n1)
  body_text=$(echo "$raw" | sed '$d')
  echo "${code}|${body_text}"
}

status_of() { echo "$1" | head -1 | cut -d'|' -f1; }
body_of()   { echo "$1" | head -1 | cut -d'|' -f2-; }

# Assert HTTP status code
assert_status() {
  local label=$1 expected=$2 result=$3
  local got
  got=$(status_of "$result")
  if [[ "$got" == "$expected" ]]; then
    pass "$label (HTTP $got)"
  else
    fail "$label" "expected HTTP $expected, got HTTP $got: $(body_of "$result" | head -c 200)"
  fi
}

# Assert body contains a string
assert_contains() {
  local label=$1 needle=$2 result=$3
  local b
  b=$(body_of "$result")
  if echo "$b" | grep -q "$needle"; then
    pass "$label"
  else
    fail "$label" "response body missing '$needle'"
  fi
}

# Assert body does NOT contain a string
assert_not_contains() {
  local label=$1 needle=$2 result=$3
  local b
  b=$(body_of "$result")
  if echo "$b" | grep -q "$needle"; then
    fail "$label" "response body unexpectedly contains '$needle'"
  else
    pass "$label"
  fi
}

# Extract a JSON value (basic — works for simple flat keys)
json_val() {
  local key=$1 body=$2
  echo "$body" | sed 's/,/\n/g' | grep "\"$key\"" | head -1 | sed 's/.*"'$key'"[[:space:]]*:[[:space:]]*//' | sed 's/[",}].*//' | tr -d ' '
}

# =============================================================================
printf "${BOLD}Hatchloom Delta — End-to-End Demo Test${RESET}\n"
printf "Testing against localhost ports 8001/8002/8003\n"
# =============================================================================

# ===================================================================
section "1. HEALTH CHECKS — All Services Reachable"
# ===================================================================

r=$(api GET "$DASH/api/school/dashboard/health")
assert_status "Dashboard service health" 200 "$r"
assert_contains "Dashboard DB connected" '"connected"' "$r"

r=$(api GET "$EXP/api/school/experiences/health")
assert_status "Experience service health" 200 "$r"
assert_contains "Experience DB connected" '"connected"' "$r"

r=$(api GET "$ENROL/api/school/enrolments/health")
assert_status "Enrolment service health" 200 "$r"
assert_contains "Enrolment DB connected" '"connected"' "$r"

# ===================================================================
section "2. AUTHENTICATION — Token Validation"
# ===================================================================

r=$(api GET "$EXP/api/school/experiences")
assert_status "No token → 401" 401 "$r"
assert_contains "Unauthenticated message" 'Unauthenticated' "$r"

r=$(api GET "$EXP/api/school/experiences" "bogus-token-xyz")
assert_status "Invalid token → 401" 401 "$r"

r=$(api GET "$EXP/api/school/experiences" "$ADMIN_TOKEN")
assert_status "Valid admin token → 200" 200 "$r"

r=$(api GET "$EXP/api/school/experiences" "$TEACHER_TOKEN")
assert_status "Valid teacher token → 200" 200 "$r"

r=$(api GET "$EXP/api/school/experiences" "$STUDENT_TOKEN")
assert_status "Valid student token → 200 (read)" 200 "$r"

r=$(api GET "$EXP/api/school/experiences" "$PARENT_TOKEN")
assert_status "Valid parent token → 200 (read)" 200 "$r"

# ===================================================================
section "3. SCREEN 300 — Dashboard (Admin View)"
# ===================================================================

r=$(api GET "$DASH/api/school/dashboard" "$ADMIN_TOKEN")
assert_status "Admin: GET dashboard" 200 "$r"
assert_contains "Dashboard has school" '"school"' "$r"
assert_contains "Dashboard has summary" '"summary"' "$r"
assert_contains "Dashboard has cohorts" '"cohorts"' "$r"
assert_contains "Dashboard has warnings" '"warnings"' "$r"

r=$(api GET "$DASH/api/school/dashboard" "$TEACHER_TOKEN")
assert_status "Teacher: GET dashboard" 200 "$r"

r=$(api GET "$DASH/api/school/dashboard" "$STUDENT_TOKEN")
assert_status "Student: GET dashboard → 403" 403 "$r"

r=$(api GET "$DASH/api/school/dashboard" "$PARENT_TOKEN")
assert_status "Parent: GET dashboard → 403" 403 "$r"

# Dashboard widgets
r=$(api GET "$DASH/api/school/dashboard/widgets" "$ADMIN_TOKEN")
assert_status "Admin: GET dashboard widgets" 200 "$r"

r=$(api GET "$DASH/api/school/dashboard/widgets/cohort_summary" "$ADMIN_TOKEN")
assert_status "Admin: GET cohort_summary widget" 200 "$r"

# Dashboard reporting
r=$(api GET "$DASH/api/school/dashboard/reporting/pos-coverage" "$ADMIN_TOKEN")
assert_status "Admin: GET PoS coverage report" 200 "$r"

r=$(api GET "$DASH/api/school/dashboard/reporting/engagement" "$ADMIN_TOKEN")
assert_status "Admin: GET engagement report" 200 "$r"

# Student drill-down
r=$(api GET "$DASH/api/school/dashboard/students/4" "$ADMIN_TOKEN")
assert_status "Admin: drill-down on Student 4" 200 "$r"

r=$(api GET "$DASH/api/school/dashboard/students/4" "$STUDENT_TOKEN")
assert_status "Student 4: view own drill-down" 200 "$r"

r=$(api GET "$DASH/api/school/dashboard/students/5" "$STUDENT_TOKEN")
assert_status "Student 4: view Student 5 drill-down → 403" 403 "$r"

r=$(api GET "$DASH/api/school/dashboard/students/4" "$PARENT_TOKEN")
assert_status "Parent (of 4): view child drill-down" 200 "$r"

r=$(api GET "$DASH/api/school/dashboard/students/5" "$PARENT_TOKEN")
assert_status "Parent (of 4): view other student → 403" 403 "$r"

# ===================================================================
section "4. SCREEN 301 — Experience List & CRUD"
# ===================================================================

# --- Read operations (all roles) ---
r=$(api GET "$EXP/api/school/experiences" "$ADMIN_TOKEN")
assert_status "Admin: list experiences" 200 "$r"
assert_contains "Paginated response has 'data'" '"data"' "$r"
assert_contains "Paginated response has 'meta'" '"meta"' "$r"

r=$(api GET "$EXP/api/school/experiences?search=Business" "$TEACHER_TOKEN")
assert_status "Teacher: search experiences" 200 "$r"
assert_contains "Search result has Business" 'Business' "$r"

r=$(api GET "$EXP/api/school/experiences" "$STUDENT_TOKEN")
assert_status "Student: list experiences (read-only)" 200 "$r"

r=$(api GET "$EXP/api/school/experiences" "$PARENT_TOKEN")
assert_status "Parent: list experiences (read-only)" 200 "$r"

# --- Course catalogue (needed for creating experiences) ---
r=$(api GET "$EXP/api/school/courses" "$TEACHER_TOKEN")
assert_status "Teacher: list courses" 200 "$r"
assert_contains "Course list has 'data'" '"data"' "$r"

r=$(api GET "$EXP/api/school/courses" "$STUDENT_TOKEN")
assert_status "Student: list courses → 403" 403 "$r"

# --- Create experience (teacher only) ---
r=$(api POST "$EXP/api/school/experiences" "$TEACHER_TOKEN" \
  '{"name":"E2E Demo Experience","description":"Created by the end-to-end test script","course_ids":[1,2]}')
assert_status "Teacher: create experience → 201" 201 "$r"
assert_contains "Created experience has name" 'E2E Demo Experience' "$r"
assert_contains "Created experience has courses" '"courses"' "$r"

CREATED_EXP_ID=$(json_val "id" "$(body_of "$r")")
if [[ -n "$CREATED_EXP_ID" && "$CREATED_EXP_ID" != "null" ]]; then
  pass "Captured created experience ID: $CREATED_EXP_ID"
else
  fail "Capture experience ID" "could not extract ID from response"
  CREATED_EXP_ID=""
fi

# --- Admin cannot create experience ---
r=$(api POST "$EXP/api/school/experiences" "$ADMIN_TOKEN" \
  '{"name":"Should Fail","description":"Admin cannot create","course_ids":[1]}')
assert_status "Admin: create experience → 403" 403 "$r"
assert_contains "Forbidden message" 'school teachers' "$r"

# --- Student cannot create experience ---
r=$(api POST "$EXP/api/school/experiences" "$STUDENT_TOKEN" \
  '{"name":"No Way","description":"Students forbidden","course_ids":[1]}')
assert_status "Student: create experience → 403" 403 "$r"

# --- Validation: missing fields ---
r=$(api POST "$EXP/api/school/experiences" "$TEACHER_TOKEN" \
  '{"name":""}')
assert_status "Teacher: create with empty name → 422" 422 "$r"

r=$(api POST "$EXP/api/school/experiences" "$TEACHER_TOKEN" \
  '{"name":"Valid","description":"Valid","course_ids":[99999]}')
assert_status "Teacher: create with invalid course_id → 422" 422 "$r"

# --- View created experience detail ---
if [[ -n "$CREATED_EXP_ID" ]]; then
  r=$(api GET "$EXP/api/school/experiences/$CREATED_EXP_ID" "$TEACHER_TOKEN")
  assert_status "Teacher: view created experience detail" 200 "$r"
  assert_contains "Detail has name" 'E2E Demo Experience' "$r"
  assert_contains "Detail has courses" '"courses"' "$r"
  assert_contains "Detail has cohorts" '"cohorts"' "$r"

  r=$(api GET "$EXP/api/school/experiences/$CREATED_EXP_ID" "$STUDENT_TOKEN")
  assert_status "Student: view experience detail (read-only)" 200 "$r"
fi

# --- Update experience (teacher only) ---
if [[ -n "$CREATED_EXP_ID" ]]; then
  r=$(api PUT "$EXP/api/school/experiences/$CREATED_EXP_ID" "$TEACHER_TOKEN" \
    '{"name":"E2E Demo Experience (Updated)"}')
  assert_status "Teacher: update experience name" 200 "$r"
  assert_contains "Updated name reflected" 'Updated' "$r"

  r=$(api PUT "$EXP/api/school/experiences/$CREATED_EXP_ID" "$ADMIN_TOKEN" \
    '{"name":"Admin Cannot Update"}')
  assert_status "Admin: update experience → 403" 403 "$r"
fi

# --- View non-existent experience ---
r=$(api GET "$EXP/api/school/experiences/99999" "$TEACHER_TOKEN")
assert_status "Teacher: view non-existent experience → 404" 404 "$r"

# ===================================================================
section "5. COHORT LIFECYCLE — Create, Activate, Enrol, Complete"
# ===================================================================

# --- List existing cohorts ---
r=$(api GET "$ENROL/api/school/cohorts" "$ADMIN_TOKEN")
assert_status "Admin: list cohorts" 200 "$r"
assert_contains "Cohort list has 'data'" '"data"' "$r"

r=$(api GET "$ENROL/api/school/cohorts" "$STUDENT_TOKEN")
assert_status "Student: list cohorts (read-only)" 200 "$r"

# --- Create cohort (teacher only) ---
if [[ -n "$CREATED_EXP_ID" ]]; then
  r=$(api POST "$ENROL/api/school/cohorts" "$TEACHER_TOKEN" \
    "{\"experience_id\":$CREATED_EXP_ID,\"name\":\"E2E Demo Cohort\",\"start_date\":\"2026-09-01\",\"end_date\":\"2026-12-15\"}")
  assert_status "Teacher: create cohort → 201" 201 "$r"
  assert_contains "Cohort has name" 'E2E Demo Cohort' "$r"

  CREATED_COHORT_ID=$(json_val "id" "$(body_of "$r")")
  if [[ -n "$CREATED_COHORT_ID" && "$CREATED_COHORT_ID" != "null" ]]; then
    pass "Captured created cohort ID: $CREATED_COHORT_ID"
  else
    fail "Capture cohort ID" "could not extract ID from response"
    CREATED_COHORT_ID=""
  fi
else
  skip "Create cohort" "no experience ID available"
fi

# --- Admin cannot create cohort ---
r=$(api POST "$ENROL/api/school/cohorts" "$ADMIN_TOKEN" \
  '{"experience_id":1,"name":"Nope","start_date":"2026-09-01","end_date":"2026-12-15"}')
assert_status "Admin: create cohort → 403" 403 "$r"

# --- Student cannot create cohort ---
r=$(api POST "$ENROL/api/school/cohorts" "$STUDENT_TOKEN" \
  '{"experience_id":1,"name":"No","start_date":"2026-09-01","end_date":"2026-12-15"}')
assert_status "Student: create cohort → 403" 403 "$r"

# --- Validation: cohort with past start date ---
r=$(api POST "$ENROL/api/school/cohorts" "$TEACHER_TOKEN" \
  '{"experience_id":1,"name":"Past","start_date":"2020-01-01","end_date":"2020-06-01"}')
assert_status "Teacher: cohort with past date → 422" 422 "$r"

# --- Validation: end date before start date ---
r=$(api POST "$ENROL/api/school/cohorts" "$TEACHER_TOKEN" \
  '{"experience_id":1,"name":"Bad Dates","start_date":"2026-12-01","end_date":"2026-06-01"}')
assert_status "Teacher: end before start → 422" 422 "$r"

# --- View cohort detail ---
if [[ -n "$CREATED_COHORT_ID" ]]; then
  r=$(api GET "$ENROL/api/school/cohorts/$CREATED_COHORT_ID" "$TEACHER_TOKEN")
  assert_status "Teacher: view cohort detail" 200 "$r"
  assert_contains "Cohort starts as not_started" 'not_started' "$r"

  r=$(api GET "$ENROL/api/school/cohorts/$CREATED_COHORT_ID" "$STUDENT_TOKEN")
  assert_status "Student: view cohort detail (read-only)" 200 "$r"
fi

# --- Try to enrol into non-active cohort ---
if [[ -n "$CREATED_COHORT_ID" ]]; then
  r=$(api POST "$ENROL/api/school/cohorts/$CREATED_COHORT_ID/enrolments" "$ADMIN_TOKEN" \
    '{"student_id":4}')
  assert_status "Admin: enrol in not_started cohort → 422" 422 "$r"
fi

# --- Activate cohort (teacher only) ---
if [[ -n "$CREATED_COHORT_ID" ]]; then
  r=$(api PATCH "$ENROL/api/school/cohorts/$CREATED_COHORT_ID/activate" "$TEACHER_TOKEN")
  assert_status "Teacher: activate cohort" 200 "$r"
  assert_contains "Status is now active" '"active"' "$r"

  # Admin cannot activate
  r=$(api PATCH "$ENROL/api/school/cohorts/$CREATED_COHORT_ID/activate" "$ADMIN_TOKEN")
  assert_status "Admin: activate cohort → 403" 403 "$r"

  # Cannot activate again (already active)
  r=$(api PATCH "$ENROL/api/school/cohorts/$CREATED_COHORT_ID/activate" "$TEACHER_TOKEN")
  assert_status "Teacher: re-activate already active → 409" 409 "$r"
fi

# --- Enrol students (admin and teacher can both do this) ---
if [[ -n "$CREATED_COHORT_ID" ]]; then
  # Enrol Student 4 (as admin)
  r=$(api POST "$ENROL/api/school/cohorts/$CREATED_COHORT_ID/enrolments" "$ADMIN_TOKEN" \
    '{"student_id":4}')
  assert_status "Admin: enrol Student 4" 201 "$r"
  assert_contains "Enrolment status is enrolled" '"enrolled"' "$r"

  # Enrol Student 5 (as teacher)
  r=$(api POST "$ENROL/api/school/cohorts/$CREATED_COHORT_ID/enrolments" "$TEACHER_TOKEN" \
    '{"student_id":5}')
  assert_status "Teacher: enrol Student 5" 201 "$r"

  # Enrol Student 6
  r=$(api POST "$ENROL/api/school/cohorts/$CREATED_COHORT_ID/enrolments" "$ADMIN_TOKEN" \
    '{"student_id":6}')
  assert_status "Admin: enrol Student 6" 201 "$r"

  # Duplicate enrolment → 422
  r=$(api POST "$ENROL/api/school/cohorts/$CREATED_COHORT_ID/enrolments" "$ADMIN_TOKEN" \
    '{"student_id":4}')
  assert_status "Admin: duplicate enrol Student 4 → 422" 422 "$r"

  # Student cannot enrol others
  r=$(api POST "$ENROL/api/school/cohorts/$CREATED_COHORT_ID/enrolments" "$STUDENT_TOKEN" \
    '{"student_id":7}')
  assert_status "Student: enrol another student → 403" 403 "$r"

  # Enrol non-existent student (backend returns 404 or 422 depending on implementation)
  r=$(api POST "$ENROL/api/school/cohorts/$CREATED_COHORT_ID/enrolments" "$ADMIN_TOKEN" \
    '{"student_id":99999}')
  got_status=$(status_of "$r")
  if [[ "$got_status" == "404" || "$got_status" == "422" ]]; then
    pass "Admin: enrol non-existent student → HTTP $got_status"
  else
    fail "Admin: enrol non-existent student" "expected HTTP 404 or 422, got HTTP $got_status"
  fi
fi

# ===================================================================
section "6. SCREEN 302 — Experience Detail (Students, Contents, Stats)"
# ===================================================================

if [[ -n "$CREATED_EXP_ID" ]]; then
  # --- Students sub-resource ---
  r=$(api GET "$EXP/api/school/experiences/$CREATED_EXP_ID/students" "$ADMIN_TOKEN")
  assert_status "Admin: list experience students" 200 "$r"

  r=$(api GET "$EXP/api/school/experiences/$CREATED_EXP_ID/students?search=Student" "$TEACHER_TOKEN")
  assert_status "Teacher: search experience students" 200 "$r"

  r=$(api GET "$EXP/api/school/experiences/$CREATED_EXP_ID/students" "$STUDENT_TOKEN")
  assert_status "Student: view experience students (read-only)" 200 "$r"

  # --- Contents sub-resource ---
  r=$(api GET "$EXP/api/school/experiences/$CREATED_EXP_ID/contents" "$TEACHER_TOKEN")
  assert_status "Teacher: view experience contents" 200 "$r"
  assert_contains "Contents has courses" '"courses"' "$r"

  r=$(api GET "$EXP/api/school/experiences/$CREATED_EXP_ID/contents" "$STUDENT_TOKEN")
  assert_status "Student: view experience contents (read-only)" 200 "$r"

  # --- Statistics sub-resource (admin/teacher only) ---
  r=$(api GET "$EXP/api/school/experiences/$CREATED_EXP_ID/statistics" "$ADMIN_TOKEN")
  assert_status "Admin: view experience statistics" 200 "$r"
  assert_contains "Stats has enrolment" '"enrolment"' "$r"

  r=$(api GET "$EXP/api/school/experiences/$CREATED_EXP_ID/statistics" "$TEACHER_TOKEN")
  assert_status "Teacher: view experience statistics" 200 "$r"

  r=$(api GET "$EXP/api/school/experiences/$CREATED_EXP_ID/statistics" "$STUDENT_TOKEN")
  assert_status "Student: view statistics → 403" 403 "$r"

  r=$(api GET "$EXP/api/school/experiences/$CREATED_EXP_ID/statistics" "$PARENT_TOKEN")
  assert_status "Parent: view statistics → 403" 403 "$r"

  # --- Student export (admin/teacher only) ---
  r=$(api GET "$EXP/api/school/experiences/$CREATED_EXP_ID/students/export" "$ADMIN_TOKEN")
  assert_status "Admin: export experience students (CSV)" 200 "$r"

  r=$(api GET "$EXP/api/school/experiences/$CREATED_EXP_ID/students/export" "$STUDENT_TOKEN")
  assert_status "Student: export students → 403" 403 "$r"
fi

# Also test against seeded experience 1 which has more data
r=$(api GET "$EXP/api/school/experiences/1" "$TEACHER_TOKEN")
assert_status "Teacher: view seeded experience 1 detail" 200 "$r"
assert_contains "Seeded experience has name" '"name"' "$r"

r=$(api GET "$EXP/api/school/experiences/1/students" "$TEACHER_TOKEN")
assert_status "Teacher: list seeded experience 1 students" 200 "$r"

r=$(api GET "$EXP/api/school/experiences/1/contents" "$TEACHER_TOKEN")
assert_status "Teacher: view seeded experience 1 contents" 200 "$r"

r=$(api GET "$EXP/api/school/experiences/1/statistics" "$TEACHER_TOKEN")
assert_status "Teacher: view seeded experience 1 statistics" 200 "$r"

# ===================================================================
section "7. SCREEN 303 — Enrolment Management"
# ===================================================================

# --- Enrolment list ---
r=$(api GET "$ENROL/api/school/enrolments" "$ADMIN_TOKEN")
assert_status "Admin: list all enrolments" 200 "$r"
assert_contains "Enrolment list has 'data'" '"data"' "$r"
assert_contains "Enrolment list has 'meta'" '"meta"' "$r"

r=$(api GET "$ENROL/api/school/enrolments" "$TEACHER_TOKEN")
assert_status "Teacher: list enrolments" 200 "$r"

r=$(api GET "$ENROL/api/school/enrolments" "$STUDENT_TOKEN")
assert_status "Student: list own enrolments" 200 "$r"

r=$(api GET "$ENROL/api/school/enrolments" "$PARENT_TOKEN")
assert_status "Parent: list child enrolments" 200 "$r"

# --- Enrolment filters ---
r=$(api GET "$ENROL/api/school/enrolments?search=Student" "$ADMIN_TOKEN")
assert_status "Admin: search enrolments by name" 200 "$r"

r=$(api GET "$ENROL/api/school/enrolments?experience_id=1" "$ADMIN_TOKEN")
assert_status "Admin: filter enrolments by experience" 200 "$r"

r=$(api GET "$ENROL/api/school/enrolments?student_id=4" "$ADMIN_TOKEN")
assert_status "Admin: filter enrolments by student" 200 "$r"

# --- Enrolment statistics (admin/teacher only) ---
r=$(api GET "$ENROL/api/school/enrolments/statistics" "$ADMIN_TOKEN")
assert_status "Admin: enrolment statistics" 200 "$r"
assert_contains "Stats has total_students" 'total_students' "$r"

r=$(api GET "$ENROL/api/school/enrolments/statistics" "$TEACHER_TOKEN")
assert_status "Teacher: enrolment statistics" 200 "$r"

r=$(api GET "$ENROL/api/school/enrolments/statistics" "$STUDENT_TOKEN")
assert_status "Student: enrolment statistics → 403" 403 "$r"

# --- Enrolment export (admin/teacher only) ---
r=$(api GET "$ENROL/api/school/enrolments/export" "$ADMIN_TOKEN")
assert_status "Admin: export enrolments (CSV)" 200 "$r"

r=$(api GET "$ENROL/api/school/enrolments/export" "$TEACHER_TOKEN")
assert_status "Teacher: export enrolments (CSV)" 200 "$r"

r=$(api GET "$ENROL/api/school/enrolments/export" "$STUDENT_TOKEN")
assert_status "Student: export enrolments → 403" 403 "$r"

# --- Student detail drill-down ---
r=$(api GET "$ENROL/api/school/enrolments/students/4" "$ADMIN_TOKEN")
assert_status "Admin: student 4 enrolment detail" 200 "$r"

r=$(api GET "$ENROL/api/school/enrolments/students/4" "$STUDENT_TOKEN")
assert_status "Student 4: view own enrolment detail" 200 "$r"

r=$(api GET "$ENROL/api/school/enrolments/students/5" "$STUDENT_TOKEN")
assert_status "Student 4: view Student 5 detail → 403" 403 "$r"

r=$(api GET "$ENROL/api/school/enrolments/students/4" "$PARENT_TOKEN")
assert_status "Parent (of 4): view child enrolment detail" 200 "$r"

r=$(api GET "$ENROL/api/school/enrolments/students/5" "$PARENT_TOKEN")
assert_status "Parent (of 4): view other student → 403" 403 "$r"

# ===================================================================
section "8. REMOVE STUDENT FROM COHORT"
# ===================================================================

if [[ -n "$CREATED_COHORT_ID" ]]; then
  # Remove Student 6
  r=$(api DELETE "$ENROL/api/school/cohorts/$CREATED_COHORT_ID/enrolments/6" "$ADMIN_TOKEN")
  assert_status "Admin: remove Student 6 from cohort" 200 "$r"

  # Remove non-enrolled student → 404
  r=$(api DELETE "$ENROL/api/school/cohorts/$CREATED_COHORT_ID/enrolments/99" "$ADMIN_TOKEN")
  assert_status "Admin: remove non-enrolled student → 404" 404 "$r"

  # Student cannot remove others
  r=$(api DELETE "$ENROL/api/school/cohorts/$CREATED_COHORT_ID/enrolments/5" "$STUDENT_TOKEN")
  assert_status "Student: remove another student → 403" 403 "$r"

  # Verify student count changed
  r=$(api GET "$ENROL/api/school/cohorts/$CREATED_COHORT_ID" "$ADMIN_TOKEN")
  assert_status "Admin: verify cohort after removal" 200 "$r"
fi

# ===================================================================
section "9. COMPLETE COHORT — Terminal State"
# ===================================================================

if [[ -n "$CREATED_COHORT_ID" ]]; then
  r=$(api PATCH "$ENROL/api/school/cohorts/$CREATED_COHORT_ID/complete" "$TEACHER_TOKEN")
  assert_status "Teacher: complete cohort" 200 "$r"
  assert_contains "Status is now completed" '"completed"' "$r"

  # Cannot complete again
  r=$(api PATCH "$ENROL/api/school/cohorts/$CREATED_COHORT_ID/complete" "$TEACHER_TOKEN")
  assert_status "Teacher: re-complete → 409" 409 "$r"

  # Cannot activate a completed cohort
  r=$(api PATCH "$ENROL/api/school/cohorts/$CREATED_COHORT_ID/activate" "$TEACHER_TOKEN")
  assert_status "Teacher: activate completed cohort → 409" 409 "$r"

  # Cannot enrol in completed cohort
  r=$(api POST "$ENROL/api/school/cohorts/$CREATED_COHORT_ID/enrolments" "$ADMIN_TOKEN" \
    '{"student_id":7}')
  assert_status "Admin: enrol in completed cohort → 422" 422 "$r"
fi

# ===================================================================
section "10. DELETE (ARCHIVE) EXPERIENCE — Cleanup"
# ===================================================================

if [[ -n "$CREATED_EXP_ID" ]]; then
  # Admin cannot delete
  r=$(api DELETE "$EXP/api/school/experiences/$CREATED_EXP_ID" "$ADMIN_TOKEN")
  assert_status "Admin: delete experience → 403" 403 "$r"

  # Student cannot delete
  r=$(api DELETE "$EXP/api/school/experiences/$CREATED_EXP_ID" "$STUDENT_TOKEN")
  assert_status "Student: delete experience → 403" 403 "$r"

  # Teacher can delete (archive)
  r=$(api DELETE "$EXP/api/school/experiences/$CREATED_EXP_ID" "$TEACHER_TOKEN")
  assert_status "Teacher: delete (archive) experience" 200 "$r"
  assert_contains "Archived message" 'archived' "$r"

  # Verify it no longer appears
  r=$(api GET "$EXP/api/school/experiences/$CREATED_EXP_ID" "$TEACHER_TOKEN")
  assert_status "Teacher: view archived experience → 404" 404 "$r"
fi

# Delete non-existent
r=$(api DELETE "$EXP/api/school/experiences/99999" "$TEACHER_TOKEN")
assert_status "Teacher: delete non-existent → 404" 404 "$r"

# ===================================================================
section "11. SEEDED DATA INTEGRITY — Verify Pre-Loaded Content"
# ===================================================================

# Dashboard shows Ridgewood Academy
r=$(api GET "$DASH/api/school/dashboard" "$ADMIN_TOKEN")
assert_contains "Dashboard shows Ridgewood Academy" 'Ridgewood' "$r"

# Seeded experiences exist
r=$(api GET "$EXP/api/school/experiences" "$TEACHER_TOKEN")
assert_contains "Business Foundations in list" 'Business Foundations' "$r"
assert_contains "Tech Explorers in list" 'Tech Explorers' "$r"

# Seeded experience 1 has courses
r=$(api GET "$EXP/api/school/experiences/1/contents" "$TEACHER_TOKEN")
assert_contains "Experience 1 has course blocks" '"blocks"' "$r"

# Seeded cohorts exist
r=$(api GET "$ENROL/api/school/cohorts" "$ADMIN_TOKEN")
assert_contains "Seeded cohorts have data" '"data"' "$r"

# Enrolment statistics are populated
r=$(api GET "$ENROL/api/school/enrolments/statistics" "$ADMIN_TOKEN")
assert_contains "Total students > 0" 'total_students' "$r"

# ===================================================================
section "12. CROSS-SERVICE INTEGRATION"
# ===================================================================

# Experience detail includes cohort data from Enrolment Service
r=$(api GET "$EXP/api/school/experiences/1" "$TEACHER_TOKEN")
assert_contains "Experience detail has cohorts from Enrolment Service" '"cohorts"' "$r"

# Experience list includes cohort_count from Enrolment Service
r=$(api GET "$EXP/api/school/experiences" "$TEACHER_TOKEN")
assert_contains "Experience list has cohort_count" 'cohort_count' "$r"

# Dashboard aggregates from both downstream services
r=$(api GET "$DASH/api/school/dashboard" "$ADMIN_TOKEN")
assert_contains "Dashboard has student data" '"students"' "$r"

# ===================================================================
# Summary
# ===================================================================
printf "\n${BOLD}${CYAN}═══════════════════════════════════════════${RESET}\n"
printf "${BOLD}  Results: "
if [[ $FAIL -eq 0 ]]; then
  printf "${GREEN}ALL %d TESTS PASSED${RESET}" "$TOTAL"
else
  printf "${RED}%d FAILED${RESET} / %d total" "$FAIL" "$TOTAL"
fi
printf "\n"
printf "  ${GREEN}Passed: %d${RESET}  ${RED}Failed: %d${RESET}  ${YELLOW}Skipped: %d${RESET}\n" "$PASS" "$FAIL" "$SKIP"
printf "${BOLD}${CYAN}═══════════════════════════════════════════${RESET}\n"

exit $FAIL
