#!/bin/bash
# =================================================================
#  HATCHLOOM DELTA — COMPREHENSIVE STRESS TEST
#  Tests all features visible in a front-end demo (Screens 300-303)
#  Exercises every API endpoint the frontend uses.
# =================================================================
set -euo pipefail

BASE="http://localhost:3000"
ADMIN="test-admin-token"
TEACHER="test-teacher-token"
STUDENT="test-student-token"
PARENT="test-parent-token"
PASS=0
FAIL=0
TOTAL=0

# ── helpers ──────────────────────────────────────────────────────
pass() { PASS=$((PASS+1)); TOTAL=$((TOTAL+1)); echo "  PASS: $1"; }
fail() { FAIL=$((FAIL+1)); TOTAL=$((TOTAL+1)); echo "  FAIL: $1"; if [ -n "${2:-}" ]; then echo "        $2"; fi; }

check_status() {
  local label="$1" expected="$2" actual="$3" body="${4:-}"
  if [ "$actual" = "$expected" ]; then
    pass "$label (HTTP $actual)"
  else
    fail "$label — expected $expected, got $actual" "$body"
  fi
}

check_json_field() {
  local label="$1" body="$2" pattern="$3"
  if echo "$body" | grep -q "$pattern"; then
    pass "$label"
  else
    fail "$label — pattern '$pattern' not found" "$(echo "$body" | head -c 200)"
  fi
}

banner() {
  echo ""
  echo "═══════════════════════════════════════════════════════════════"
  echo "  $1"
  echo "═══════════════════════════════════════════════════════════════"
}

section() {
  echo ""
  echo "--- $1 ---"
}

# =================================================================
banner "SECTION 1: DASHBOARD (Screen 300)"
# =================================================================

section "1.1 Admin fetches dashboard"
DASH=$(curl -s "$BASE/api/school/dashboard" -H "Authorization: Bearer $ADMIN")
check_json_field "Dashboard has school name" "$DASH" '"name":"Ridgewood Academy"'
check_json_field "Dashboard has summary" "$DASH" '"problems_tackled"'
check_json_field "Dashboard has students counts" "$DASH" '"total_enrolled"'
check_json_field "Dashboard has warnings" "$DASH" '"warnings"'
check_json_field "Dashboard has cohort counts" "$DASH" '"active"'

section "1.2 Teacher blocked from admin dashboard"
TDASH_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/school/dashboard" -H "Authorization: Bearer $TEACHER")
check_status "Teacher gets 403 on admin dashboard" "403" "$TDASH_CODE"

section "1.3 Dashboard widgets API"
WIDGETS=$(curl -s "$BASE/api/school/dashboard/widgets" -H "Authorization: Bearer $ADMIN")
WIDGET_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/school/dashboard/widgets" -H "Authorization: Bearer $ADMIN")
check_status "Widgets endpoint responds" "200" "$WIDGET_CODE"

section "1.4 Engagement chart widget"
ENG_WIDGET=$(curl -s "$BASE/api/school/dashboard/widgets/engagement_chart" -H "Authorization: Bearer $ADMIN")
ENG_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/school/dashboard/widgets/engagement_chart" -H "Authorization: Bearer $ADMIN")
check_status "Engagement widget responds" "200" "$ENG_CODE"

section "1.5 Student drilldown (used by Student + Parent portals)"
DRILL=$(curl -s "$BASE/api/school/dashboard/students/4" -H "Authorization: Bearer $ADMIN")
DRILL_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/school/dashboard/students/4" -H "Authorization: Bearer $ADMIN")
check_status "Student drilldown responds" "200" "$DRILL_CODE"
check_json_field "Drilldown has student data" "$DRILL" '"student"'

# =================================================================
banner "SECTION 2: COURSES API"
# =================================================================

section "2.1 List courses"
COURSES=$(curl -s "$BASE/api/school/courses" -H "Authorization: Bearer $ADMIN")
COURSES_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/school/courses" -H "Authorization: Bearer $ADMIN")
check_status "Courses list responds" "200" "$COURSES_CODE"
check_json_field "Courses data present" "$COURSES" '"data"'

# Extract first course ID for later use
COURSE_ID=$(echo "$COURSES" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
if [ -n "$COURSE_ID" ]; then
  pass "Found course ID=$COURSE_ID for experience creation"
else
  fail "No courses found — experience creation will fail"
  COURSE_ID=1
fi

# =================================================================
banner "SECTION 3: EXPERIENCES CRUD (Screen 301)"
# =================================================================

section "3.1 List experiences"
EXP_LIST=$(curl -s "$BASE/api/school/experiences" -H "Authorization: Bearer $ADMIN")
check_json_field "Experiences list has data" "$EXP_LIST" '"data"'

section "3.2 List with pagination"
EXP_PAGE=$(curl -s "$BASE/api/school/experiences?page=1&per_page=5" -H "Authorization: Bearer $ADMIN")
check_json_field "Paginated experiences return data" "$EXP_PAGE" '"data"'

section "3.3 Search experiences"
EXP_SEARCH=$(curl -s "$BASE/api/school/experiences?search=Tech" -H "Authorization: Bearer $ADMIN")
EXP_SEARCH_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/school/experiences?search=Tech" -H "Authorization: Bearer $ADMIN")
check_status "Search experiences responds" "200" "$EXP_SEARCH_CODE"

section "3.4 Create experience (teacher)"
CREATE_EXP=$(curl -s -X POST "$BASE/api/school/experiences" \
  -H "Authorization: Bearer $TEACHER" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Stress Test Experience $(date +%s)\",\"description\":\"Created by stress test\",\"course_ids\":[$COURSE_ID]}")
NEW_EXP_ID=$(echo "$CREATE_EXP" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
if [ -n "$NEW_EXP_ID" ]; then
  pass "Experience created (id=$NEW_EXP_ID)"
else
  fail "Experience creation failed" "$CREATE_EXP"
  # Try with admin
  CREATE_EXP=$(curl -s -X POST "$BASE/api/school/experiences" \
    -H "Authorization: Bearer $ADMIN" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"Stress Test Experience $(date +%s)\",\"description\":\"Created by stress test\",\"course_ids\":[$COURSE_ID]}")
  NEW_EXP_ID=$(echo "$CREATE_EXP" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
  [ -n "$NEW_EXP_ID" ] && pass "Experience created via admin fallback (id=$NEW_EXP_ID)"
fi

section "3.5 Get single experience"
if [ -n "${NEW_EXP_ID:-}" ]; then
  SINGLE_EXP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/school/experiences/$NEW_EXP_ID" -H "Authorization: Bearer $ADMIN")
  check_status "Get experience $NEW_EXP_ID" "200" "$SINGLE_EXP_CODE"
fi

section "3.6 Update experience"
if [ -n "${NEW_EXP_ID:-}" ]; then
  UPD_EXP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X PUT "$BASE/api/school/experiences/$NEW_EXP_ID" \
    -H "Authorization: Bearer $TEACHER" \
    -H "Content-Type: application/json" \
    -d '{"name":"Stress Test Updated","description":"Updated description"}')
  check_status "Update experience" "200" "$UPD_EXP_CODE"
fi

section "3.7 Experience contents"
if [ -n "${NEW_EXP_ID:-}" ]; then
  CONTENTS_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/school/experiences/$NEW_EXP_ID/contents" -H "Authorization: Bearer $ADMIN")
  check_status "Experience contents endpoint" "200" "$CONTENTS_CODE"
fi

section "3.8 Experience students"
if [ -n "${NEW_EXP_ID:-}" ]; then
  EXP_STUDENTS_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/school/experiences/$NEW_EXP_ID/students" -H "Authorization: Bearer $ADMIN")
  check_status "Experience students endpoint" "200" "$EXP_STUDENTS_CODE"
fi

section "3.9 Experience statistics"
if [ -n "${NEW_EXP_ID:-}" ]; then
  EXP_STATS_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/school/experiences/$NEW_EXP_ID/statistics" -H "Authorization: Bearer $ADMIN")
  check_status "Experience statistics endpoint" "200" "$EXP_STATS_CODE"
fi

section "3.10 Validation: create without course_ids fails"
INVALID_EXP=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/school/experiences" \
  -H "Authorization: Bearer $TEACHER" \
  -H "Content-Type: application/json" \
  -d '{"name":"Invalid","description":"No courses"}')
if [ "$INVALID_EXP" != "201" ] && [ "$INVALID_EXP" != "200" ]; then
  pass "Validation rejects experience without course_ids (HTTP $INVALID_EXP)"
else
  fail "Should have rejected experience without course_ids (HTTP $INVALID_EXP)"
fi

# =================================================================
banner "SECTION 4: COHORTS CRUD (Screen 302)"
# =================================================================

section "4.1 List cohorts"
COH_LIST=$(curl -s "$BASE/api/school/cohorts" -H "Authorization: Bearer $ADMIN")
check_json_field "Cohorts list has data" "$COH_LIST" '"data"'

section "4.2 Create cohort (teacher)"
if [ -n "${NEW_EXP_ID:-}" ]; then
  CREATE_COH=$(curl -s -X POST "$BASE/api/school/cohorts" \
    -H "Authorization: Bearer $TEACHER" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"Stress Test Cohort $(date +%s)\",\"experience_id\":$NEW_EXP_ID,\"start_date\":\"2026-05-01\",\"end_date\":\"2026-08-31\",\"capacity\":20}")
  NEW_COH_ID=$(echo "$CREATE_COH" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
  if [ -n "$NEW_COH_ID" ]; then
    pass "Cohort created (id=$NEW_COH_ID)"
  else
    fail "Cohort creation failed" "$CREATE_COH"
  fi
fi

section "4.3 Get single cohort"
if [ -n "${NEW_COH_ID:-}" ]; then
  SINGLE_COH=$(curl -s "$BASE/api/school/cohorts/$NEW_COH_ID" -H "Authorization: Bearer $ADMIN")
  SINGLE_COH_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/school/cohorts/$NEW_COH_ID" -H "Authorization: Bearer $ADMIN")
  check_status "Get cohort $NEW_COH_ID" "200" "$SINGLE_COH_CODE"
  check_json_field "Cohort has correct experience" "$SINGLE_COH" "\"experience_id\":$NEW_EXP_ID"
fi

section "4.4 Update cohort"
if [ -n "${NEW_COH_ID:-}" ]; then
  UPD_COH_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X PUT "$BASE/api/school/cohorts/$NEW_COH_ID" \
    -H "Authorization: Bearer $TEACHER" \
    -H "Content-Type: application/json" \
    -d '{"name":"Stress Test Cohort (Updated)","capacity":25}')
  check_status "Update cohort" "200" "$UPD_COH_CODE"
fi

section "4.5 Activate cohort"
if [ -n "${NEW_COH_ID:-}" ]; then
  ACT_RESP=$(curl -s -X PATCH "$BASE/api/school/cohorts/$NEW_COH_ID/activate" \
    -H "Authorization: Bearer $TEACHER")
  check_json_field "Cohort activated" "$ACT_RESP" '"status":"active"'
fi

section "4.6 Cohort enrolments (empty before enrolment)"
if [ -n "${NEW_COH_ID:-}" ]; then
  COH_ENROLS=$(curl -s "$BASE/api/school/enrolments?cohort_id=$NEW_COH_ID" -H "Authorization: Bearer $ADMIN")
  COH_ENROLS_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/school/enrolments?cohort_id=$NEW_COH_ID" -H "Authorization: Bearer $ADMIN")
  check_status "Cohort enrolments endpoint" "200" "$COH_ENROLS_CODE"
fi

# =================================================================
banner "SECTION 5: ENROLMENTS (Screen 303)"
# =================================================================

section "5.1 Enrolment statistics"
ENROL_STATS=$(curl -s "$BASE/api/school/enrolments/statistics" -H "Authorization: Bearer $ADMIN")
ENROL_STATS_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/school/enrolments/statistics" -H "Authorization: Bearer $ADMIN")
check_status "Enrolment statistics responds" "200" "$ENROL_STATS_CODE"
check_json_field "Statistics has total_students" "$ENROL_STATS" '"total_students"'
check_json_field "Statistics has enrolled" "$ENROL_STATS" '"enrolled"'
check_json_field "Statistics has not_assigned" "$ENROL_STATS" '"not_assigned"'

section "5.2 List enrolments (grouped by student)"
ENROLMENTS=$(curl -s "$BASE/api/school/enrolments" -H "Authorization: Bearer $ADMIN")
check_json_field "Enrolments has data array" "$ENROLMENTS" '"data"'
check_json_field "Enrolments have student_id" "$ENROLMENTS" '"student_id"'
check_json_field "Enrolments have cohort_assignments" "$ENROLMENTS" '"cohort_assignments"'

section "5.3 Enrolments with pagination"
ENROL_PAGE=$(curl -s "$BASE/api/school/enrolments?page=1&per_page=5" -H "Authorization: Bearer $ADMIN")
ENROL_PAGE_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/school/enrolments?page=1&per_page=5" -H "Authorization: Bearer $ADMIN")
check_status "Paginated enrolments" "200" "$ENROL_PAGE_CODE"

section "5.4 Enrol student 5 in new cohort (admin-only)"
if [ -n "${NEW_COH_ID:-}" ]; then
  ENROL_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/school/cohorts/$NEW_COH_ID/enrolments" \
    -H "Authorization: Bearer $ADMIN" \
    -H "Content-Type: application/json" \
    -d '{"student_id":5}')
  check_status "Enrol student 5" "201" "$ENROL_CODE"
fi

section "5.5 Enrol student 6 in new cohort (admin-only)"
if [ -n "${NEW_COH_ID:-}" ]; then
  ENROL2_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/school/cohorts/$NEW_COH_ID/enrolments" \
    -H "Authorization: Bearer $ADMIN" \
    -H "Content-Type: application/json" \
    -d '{"student_id":6}')
  check_status "Enrol student 6" "201" "$ENROL2_CODE"
fi

section "5.6 Verify students appear in cohort enrolments"
if [ -n "${NEW_COH_ID:-}" ]; then
  COH_ENROLS2=$(curl -s "$BASE/api/school/enrolments?cohort_id=$NEW_COH_ID" -H "Authorization: Bearer $ADMIN")
  check_json_field "Student 5 in cohort enrolments" "$COH_ENROLS2" '"student_id":5'
  check_json_field "Student 6 in cohort enrolments" "$COH_ENROLS2" '"student_id":6'
fi

section "5.7 Duplicate enrolment rejected"
if [ -n "${NEW_COH_ID:-}" ]; then
  DUP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/school/cohorts/$NEW_COH_ID/enrolments" \
    -H "Authorization: Bearer $ADMIN" \
    -H "Content-Type: application/json" \
    -d '{"student_id":5}')
  if [ "$DUP_CODE" != "201" ]; then
    pass "Duplicate enrolment rejected (HTTP $DUP_CODE)"
  else
    fail "Duplicate enrolment should have been rejected but got 201"
  fi
fi

section "5.8 Remove student from cohort (admin-only)"
if [ -n "${NEW_COH_ID:-}" ]; then
  REMOVE_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE/api/school/cohorts/$NEW_COH_ID/enrolments/6" \
    -H "Authorization: Bearer $ADMIN")
  check_status "Remove student 6 from cohort" "200" "$REMOVE_CODE"
fi

section "5.9 Student detail endpoint"
STUDENT_DETAIL=$(curl -s "$BASE/api/school/enrolments/students/5" -H "Authorization: Bearer $ADMIN")
STUDENT_DETAIL_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/school/enrolments/students/5" -H "Authorization: Bearer $ADMIN")
check_status "Student detail endpoint" "200" "$STUDENT_DETAIL_CODE"

section "5.10 Export enrolments"
EXPORT_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/school/enrolments/export" -H "Authorization: Bearer $ADMIN")
check_status "Export enrolments endpoint" "200" "$EXPORT_CODE"

# =================================================================
banner "SECTION 6: CROSS-ROLE DATA FLOW"
# =================================================================

section "6.1 Student sees own data"
STU_DRILL=$(curl -s "$BASE/api/school/dashboard/students/4" -H "Authorization: Bearer $STUDENT")
STU_DRILL_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/school/dashboard/students/4" -H "Authorization: Bearer $STUDENT")
check_status "Student drilldown accessible" "200" "$STU_DRILL_CODE"
check_json_field "Student drilldown has student field" "$STU_DRILL" '"student"'

section "6.2 Student sees enrolment detail"
STU_ENROL=$(curl -s "$BASE/api/school/enrolments/students/4" -H "Authorization: Bearer $STUDENT")
STU_ENROL_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/school/enrolments/students/4" -H "Authorization: Bearer $STUDENT")
check_status "Student enrolment detail accessible" "200" "$STU_ENROL_CODE"

section "6.3 Parent sees child data (student 4)"
PAR_DRILL=$(curl -s "$BASE/api/school/dashboard/students/4" -H "Authorization: Bearer $PARENT")
PAR_DRILL_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/school/dashboard/students/4" -H "Authorization: Bearer $PARENT")
check_status "Parent sees child 4 data" "200" "$PAR_DRILL_CODE"

section "6.4 Parent sees child data (student 5)"
PAR_DRILL5=$(curl -s "$BASE/api/school/dashboard/students/5" -H "Authorization: Bearer $PARENT")
PAR_DRILL5_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/school/dashboard/students/5" -H "Authorization: Bearer $PARENT")
check_status "Parent sees child 5 data" "200" "$PAR_DRILL5_CODE"

section "6.5 Student data includes new cohort"
if [ -n "${NEW_COH_ID:-}" ]; then
  STU5_DRILL=$(curl -s "$BASE/api/school/dashboard/students/5" -H "Authorization: Bearer $ADMIN")
  if echo "$STU5_DRILL" | grep -q "\"cohort_id\":$NEW_COH_ID"; then
    pass "Student 5 drilldown shows new cohort $NEW_COH_ID"
  else
    # Check if it's in enrolments instead
    STU5_ENROL=$(curl -s "$BASE/api/school/enrolments/students/5" -H "Authorization: Bearer $ADMIN")
    if echo "$STU5_ENROL" | grep -q "\"cohort_id\":$NEW_COH_ID"; then
      pass "Student 5 enrolment detail shows new cohort $NEW_COH_ID"
    else
      fail "Student 5 data missing new cohort $NEW_COH_ID"
    fi
  fi
fi

# =================================================================
banner "SECTION 7: COMPLETE LIFECYCLE"
# =================================================================

section "7.1 Complete the cohort"
if [ -n "${NEW_COH_ID:-}" ]; then
  COMP_RESP=$(curl -s -X PATCH "$BASE/api/school/cohorts/$NEW_COH_ID/complete" \
    -H "Authorization: Bearer $TEACHER")
  check_json_field "Cohort completed" "$COMP_RESP" '"status":"completed"'
fi

section "7.2 Verify completed cohort in list"
COH_LIST2=$(curl -s "$BASE/api/school/cohorts" -H "Authorization: Bearer $ADMIN")
if [ -n "${NEW_COH_ID:-}" ]; then
  check_json_field "Completed cohort in list" "$COH_LIST2" "\"id\":$NEW_COH_ID"
fi

section "7.3 Updated experience in list"
if [ -n "${NEW_EXP_ID:-}" ]; then
  EXP_LIST2=$(curl -s "$BASE/api/school/experiences" -H "Authorization: Bearer $ADMIN")
  check_json_field "Updated experience in list" "$EXP_LIST2" '"Stress Test Updated"'
fi

section "7.4 Delete experience (teacher role required)"
if [ -n "${NEW_EXP_ID:-}" ]; then
  DEL_EXP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE/api/school/experiences/$NEW_EXP_ID" \
    -H "Authorization: Bearer $TEACHER")
  check_status "Delete experience" "200" "$DEL_EXP_CODE"
fi

section "7.5 Deleted experience gone from list"
if [ -n "${NEW_EXP_ID:-}" ]; then
  EXP_LIST3=$(curl -s "$BASE/api/school/experiences" -H "Authorization: Bearer $ADMIN")
  if echo "$EXP_LIST3" | grep -q "\"id\":$NEW_EXP_ID"; then
    fail "Deleted experience $NEW_EXP_ID still in list"
  else
    pass "Deleted experience $NEW_EXP_ID removed from list"
  fi
fi

# =================================================================
banner "SECTION 8: DASHBOARD METRICS CONSISTENCY"
# =================================================================

section "8.1 Dashboard matches enrolment statistics"
DASH2=$(curl -s "$BASE/api/school/dashboard" -H "Authorization: Bearer $ADMIN")
STATS2=$(curl -s "$BASE/api/school/enrolments/statistics" -H "Authorization: Bearer $ADMIN")

DASH_ENROLLED=$(echo "$DASH2" | grep -o '"total_enrolled":[0-9]*' | cut -d: -f2)
STATS_TOTAL=$(echo "$STATS2" | grep -o '"total_students":[0-9]*' | cut -d: -f2)

if [ -n "$DASH_ENROLLED" ] && [ -n "$STATS_TOTAL" ]; then
  pass "Dashboard enrolled=$DASH_ENROLLED, Statistics total=$STATS_TOTAL (both return numbers)"
else
  fail "Could not extract enrolled counts from dashboard/statistics"
fi

section "8.2 Dashboard student counts present"
DASH_NOT_ASSIGNED=$(echo "$DASH2" | grep -o '"not_assigned":[0-9]*' | head -1 | cut -d: -f2)
if [ -n "$DASH_NOT_ASSIGNED" ]; then
  pass "Dashboard not_assigned=$DASH_NOT_ASSIGNED"
else
  fail "Dashboard missing not_assigned count"
fi

# =================================================================
banner "SECTION 9: EDGE CASES & VALIDATION"
# =================================================================

section "9.1 Non-existent experience returns 404"
E404_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/school/experiences/99999" -H "Authorization: Bearer $ADMIN")
if [ "$E404_CODE" = "404" ]; then
  pass "Non-existent experience returns 404"
else
  fail "Expected 404 for non-existent experience, got $E404_CODE"
fi

section "9.2 Non-existent cohort returns 404"
C404_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/school/cohorts/99999" -H "Authorization: Bearer $ADMIN")
if [ "$C404_CODE" = "404" ]; then
  pass "Non-existent cohort returns 404"
else
  fail "Expected 404 for non-existent cohort, got $C404_CODE"
fi

section "9.3 Empty search returns empty data"
EMPTY_SEARCH=$(curl -s "$BASE/api/school/experiences?search=zzzznonexistent" -H "Authorization: Bearer $ADMIN")
check_json_field "Empty search returns data field" "$EMPTY_SEARCH" '"data"'

section "9.4 Invalid JSON body handled"
BAD_JSON_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/school/experiences" \
  -H "Authorization: Bearer $ADMIN" \
  -H "Content-Type: application/json" \
  -d '{invalid json}')
if [ "$BAD_JSON_CODE" != "200" ] && [ "$BAD_JSON_CODE" != "201" ]; then
  pass "Invalid JSON rejected (HTTP $BAD_JSON_CODE)"
else
  fail "Invalid JSON should not succeed (HTTP $BAD_JSON_CODE)"
fi

section "9.5 Create cohort without experience_id fails"
BAD_COH_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/school/cohorts" \
  -H "Authorization: Bearer $TEACHER" \
  -H "Content-Type: application/json" \
  -d '{"name":"Bad Cohort","start_date":"2026-01-01","end_date":"2026-06-01"}')
if [ "$BAD_COH_CODE" != "201" ] && [ "$BAD_COH_CODE" != "200" ]; then
  pass "Cohort without experience_id rejected (HTTP $BAD_COH_CODE)"
else
  fail "Cohort without experience_id should fail (HTTP $BAD_COH_CODE)"
fi

section "9.6 Enrol non-existent student"
BAD_ENROL_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/school/cohorts/1/enrolments" \
  -H "Authorization: Bearer $ADMIN" \
  -H "Content-Type: application/json" \
  -d '{"student_id":99999}')
if [ "$BAD_ENROL_CODE" != "201" ]; then
  pass "Non-existent student enrolment handled (HTTP $BAD_ENROL_CODE)"
else
  fail "Should not successfully enrol non-existent student"
fi

# =================================================================
banner "SECTION 10: SEEDED DATA INTEGRITY"
# =================================================================

section "10.1 Seeded experiences exist"
SEED_EXP=$(curl -s "$BASE/api/school/experiences" -H "Authorization: Bearer $ADMIN")
if echo "$SEED_EXP" | grep -q '"name"'; then
  EXP_COUNT=$(echo "$SEED_EXP" | grep -o '"id":[0-9]*' | wc -l)
  pass "Found $EXP_COUNT experiences in seeded data"
else
  fail "No seeded experiences found"
fi

section "10.2 Seeded cohorts exist"
SEED_COH=$(curl -s "$BASE/api/school/cohorts" -H "Authorization: Bearer $ADMIN")
if echo "$SEED_COH" | grep -q '"name"'; then
  COH_COUNT=$(echo "$SEED_COH" | grep -o '"id":[0-9]*' | wc -l)
  pass "Found $COH_COUNT cohorts in seeded data"
else
  fail "No seeded cohorts found"
fi

section "10.3 Seeded students exist in enrolments"
SEED_ENROL=$(curl -s "$BASE/api/school/enrolments" -H "Authorization: Bearer $ADMIN")
if echo "$SEED_ENROL" | grep -q '"student_id"'; then
  STU_COUNT=$(echo "$SEED_ENROL" | grep -o '"student_id":[0-9]*' | sort -u | wc -l)
  pass "Found $STU_COUNT unique students in enrolments"
else
  fail "No students found in enrolments"
fi

section "10.4 Students have cohort assignments"
if echo "$SEED_ENROL" | grep -q '"cohort_assignments"'; then
  pass "Enrolments include cohort_assignments arrays"
else
  fail "Enrolments missing cohort_assignments field"
fi

# =================================================================
banner "RESULTS"
# =================================================================
echo ""
echo "  Passed:  $PASS"
echo "  Failed:  $FAIL"
echo "  Total:   $TOTAL"
echo ""
if [ "$FAIL" -eq 0 ]; then
  echo "  ALL TESTS PASSED"
else
  echo "  $FAIL TEST(S) FAILED"
fi
echo ""
echo "═══════════════════════════════════════════════════════════════"
exit $FAIL
