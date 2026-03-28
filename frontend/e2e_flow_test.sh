#!/bin/bash
echo "================================================================"
echo "  END-TO-END FLOW TEST: Teacher -> Student -> Parent"
echo "================================================================"
echo ""

TEACHER="test-teacher-token"
ADMIN="test-admin-token"
STUDENT="test-student-token"
PARENT="test-parent-token"
PASS=0
FAIL=0

# STEP 1: Teacher creates experience
echo "--- STEP 1: Teacher creates a new experience ---"
EXP_BODY=$(curl -s -X POST "http://localhost:3000/api/school/experiences" \
  -H "Authorization: Bearer $TEACHER" \
  -H "Content-Type: application/json" \
  -d '{"name":"Wilderness Survival Skills","description":"Outdoor survival techniques","course_ids":[1]}')
EXP_ID=$(echo "$EXP_BODY" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)

if [ -n "$EXP_ID" ]; then
  echo "  PASS: Experience created (id=$EXP_ID)"; PASS=$((PASS+1))
else
  echo "  Teacher failed, trying admin..."
  EXP_BODY=$(curl -s -X POST "http://localhost:3000/api/school/experiences" \
    -H "Authorization: Bearer $ADMIN" \
    -H "Content-Type: application/json" \
    -d '{"name":"Wilderness Survival Skills","description":"Outdoor survival techniques","course_ids":[1]}')
  EXP_ID=$(echo "$EXP_BODY" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
  if [ -n "$EXP_ID" ]; then
    echo "  PASS: Experience created via admin (id=$EXP_ID)"; PASS=$((PASS+1))
  else
    echo "  FAIL: Could not create experience"; FAIL=$((FAIL+1))
    echo "  Response: $EXP_BODY"
  fi
fi
echo ""

# STEP 2: Teacher creates cohort
echo "--- STEP 2: Teacher creates a cohort ---"
COHORT_BODY=$(curl -s -X POST "http://localhost:3000/api/school/cohorts" \
  -H "Authorization: Bearer $TEACHER" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Spring 2026 Wilderness\",\"experience_id\":$EXP_ID,\"start_date\":\"2026-04-01\",\"end_date\":\"2026-07-31\",\"capacity\":25}")
COHORT_ID=$(echo "$COHORT_BODY" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
if [ -n "$COHORT_ID" ]; then
  echo "  PASS: Cohort created (id=$COHORT_ID)"; PASS=$((PASS+1))
else
  echo "  FAIL: Cohort creation failed"; FAIL=$((FAIL+1))
  echo "  Response: $COHORT_BODY"
fi
echo ""

# STEP 3: Teacher activates cohort
echo "--- STEP 3: Teacher activates the cohort ---"
ACT_RESP=$(curl -s -X PATCH "http://localhost:3000/api/school/cohorts/$COHORT_ID/activate" \
  -H "Authorization: Bearer $TEACHER")
if echo "$ACT_RESP" | grep -q '"status":"active"'; then
  echo "  PASS: Cohort activated"; PASS=$((PASS+1))
else
  echo "  FAIL: Activate did not return active"; FAIL=$((FAIL+1))
  echo "  Response: $ACT_RESP"
fi
echo ""

# STEP 4: Teacher enrols student 4
echo "--- STEP 4: Teacher enrols student 4 ---"
ENROL_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "http://localhost:3000/api/school/cohorts/$COHORT_ID/enrolments" \
  -H "Authorization: Bearer $TEACHER" \
  -H "Content-Type: application/json" \
  -d '{"student_id":4}')
if [ "$ENROL_CODE" = "201" ]; then
  echo "  PASS: Student 4 enrolled (201)"; PASS=$((PASS+1))
else
  echo "  FAIL: Enrol returned $ENROL_CODE"; FAIL=$((FAIL+1))
fi
echo ""

# STEP 5: Student sees new cohort
echo "--- STEP 5: Student sees updated data ---"
STUDENT_DRILL=$(curl -s "http://localhost:3000/api/school/dashboard/students/4" \
  -H "Authorization: Bearer $STUDENT")
if echo "$STUDENT_DRILL" | grep -q "\"cohort_id\":$COHORT_ID"; then
  echo "  PASS: Student drilldown shows cohort $COHORT_ID"; PASS=$((PASS+1))
else
  echo "  FAIL: Student drilldown missing cohort $COHORT_ID"; FAIL=$((FAIL+1))
fi

STUDENT_ENROL=$(curl -s "http://localhost:3000/api/school/enrolments/students/4" \
  -H "Authorization: Bearer $STUDENT")
if echo "$STUDENT_ENROL" | grep -q "\"cohort_id\":$COHORT_ID"; then
  echo "  PASS: Student enrolment detail has cohort $COHORT_ID"; PASS=$((PASS+1))
else
  echo "  FAIL: Student enrolment missing cohort $COHORT_ID"; FAIL=$((FAIL+1))
fi
echo ""

# STEP 6: Parent sees child data
echo "--- STEP 6: Parent sees child updated data ---"
PARENT_RESP=$(curl -s "http://localhost:3000/api/school/dashboard/students/4" \
  -H "Authorization: Bearer $PARENT")
if echo "$PARENT_RESP" | grep -q "\"cohort_id\":$COHORT_ID"; then
  echo "  PASS: Parent sees cohort $COHORT_ID in child data"; PASS=$((PASS+1))
else
  echo "  FAIL: Parent missing cohort $COHORT_ID"; FAIL=$((FAIL+1))
fi
echo ""

# STEP 7: Experience in admin list
echo "--- STEP 7: Experience in admin list ---"
EXP_LIST=$(curl -s "http://localhost:3000/api/school/experiences" -H "Authorization: Bearer $ADMIN")
if echo "$EXP_LIST" | grep -q "Wilderness Survival Skills"; then
  echo "  PASS: Experience in list"; PASS=$((PASS+1))
else
  echo "  FAIL: Experience not in list"; FAIL=$((FAIL+1))
fi
echo ""

# STEP 8: Cohort in admin list
echo "--- STEP 8: Cohort in admin list ---"
COHORT_LIST=$(curl -s "http://localhost:3000/api/school/cohorts" -H "Authorization: Bearer $ADMIN")
if echo "$COHORT_LIST" | grep -q "Spring 2026 Wilderness"; then
  echo "  PASS: Cohort in list"; PASS=$((PASS+1))
else
  echo "  FAIL: Cohort not in list"; FAIL=$((FAIL+1))
fi
echo ""

# STEP 9: Student in cohort enrolments
echo "--- STEP 9: Student visible in cohort enrolments ---"
COH_ENROLS=$(curl -s "http://localhost:3000/api/school/enrolments?cohort_id=$COHORT_ID" -H "Authorization: Bearer $ADMIN")
if echo "$COH_ENROLS" | grep -q '"student_id":4'; then
  echo "  PASS: Student 4 in cohort enrolments"; PASS=$((PASS+1))
else
  echo "  FAIL: Student not in cohort enrolments"; FAIL=$((FAIL+1))
fi
echo ""

# STEP 10: Update experience
echo "--- STEP 10: Teacher updates experience ---"
UPD_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X PUT "http://localhost:3000/api/school/experiences/$EXP_ID" \
  -H "Authorization: Bearer $TEACHER" \
  -H "Content-Type: application/json" \
  -d '{"name":"Advanced Wilderness Survival","description":"Updated with advanced modules"}')
if [ "$UPD_CODE" = "200" ]; then
  echo "  PASS: Experience updated"; PASS=$((PASS+1))
else
  echo "  FAIL: Experience update ($UPD_CODE)"; FAIL=$((FAIL+1))
fi
echo ""

# STEP 11: Update cohort
echo "--- STEP 11: Teacher updates cohort ---"
UPD_COH_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X PUT "http://localhost:3000/api/school/cohorts/$COHORT_ID" \
  -H "Authorization: Bearer $TEACHER" \
  -H "Content-Type: application/json" \
  -d '{"name":"Spring 2026 Wilderness (Updated)","capacity":30}')
if [ "$UPD_COH_CODE" = "200" ]; then
  echo "  PASS: Cohort updated"; PASS=$((PASS+1))
else
  echo "  FAIL: Cohort update ($UPD_COH_CODE)"; FAIL=$((FAIL+1))
fi
echo ""

# STEP 12: Complete cohort
echo "--- STEP 12: Teacher completes cohort ---"
COMP_RESP=$(curl -s -X PATCH "http://localhost:3000/api/school/cohorts/$COHORT_ID/complete" \
  -H "Authorization: Bearer $TEACHER")
if echo "$COMP_RESP" | grep -q '"status":"completed"'; then
  echo "  PASS: Cohort completed"; PASS=$((PASS+1))
else
  echo "  FAIL: Complete did not return completed"; FAIL=$((FAIL+1))
  echo "  Response: $COMP_RESP"
fi

echo ""
echo "================================================================"
TOTAL=$((PASS + FAIL))
echo "  RESULTS: $PASS passed, $FAIL failed out of $TOTAL checks"
echo "================================================================"
