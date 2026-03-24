"""Update API-CONTRACT.docx — fix block examples, add scoping notes, update access levels."""
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from docx import Document

doc = Document('API-CONTRACT.docx')
changes = []

for i, p in enumerate(doc.paragraphs):
    # === Fix block response examples: title → name ===
    if '"title":' in p.text and ('block' in p.text.lower() or 'lesson' in p.text.lower() or 'challenge' in p.text.lower()):
        old = p.text
        p.text = p.text.replace('"title":', '"name":')
        if old != p.text:
            changes.append(f"Fixed block title→name in response example (para {i})")

    # === Fix any remaining "title" in block-related JSON examples ===
    if '"type": "activity"' in p.text:
        old = p.text
        p.text = p.text.replace('"type": "activity"', '"type": "lesson"')
        if old != p.text:
            changes.append(f"Fixed block type 'activity'→'lesson' in example (para {i})")

    # === Update seeded data description to reflect variable block counts ===
    if p.text.startswith('5 mock courses: IDs 1-5'):
        p.text = '5 mock courses: IDs 1-5 (hardcoded via MockCourseDataProvider, with 1-5 blocks each to test variable-length rendering)'
        changes.append(f"Updated mock courses description (para {i})")

    # === Add scoping note to enrolment list endpoint ===
    if p.text.strip() == 'Enrolment Statistics' and p.style.name.startswith('Heading'):
        # This is the statistics heading — we'll update its description below
        pass

    # === Update export endpoint descriptions ===
    if p.text.startswith('CSV download of all enrolment') or p.text == 'CSV download of all enrolments':
        p.text = 'CSV download of all enrolments. Admin and teacher only (students/parents get 403).'
        changes.append(f"Added admin-only note to enrolment export (para {i})")

    # === Update experience export access note ===
    if 'students/export' in p.text and 'CSV' in p.text and 'download' in p.text.lower():
        if '403' not in p.text:
            p.text = p.text.rstrip('.') + '. Admin and teacher only (students/parents get 403).'
            changes.append(f"Added admin-only note to experience export (para {i})")

    # === Update experience statistics access ===
    if p.text.startswith('Returns enrolment and completion statistics') or \
       (p.text.strip() == 'Experience Statistics (Screen 302)' and p.style.name.startswith('Heading')):
        pass  # Heading found, description is next

    # === Add scoping note to enrolment overview description ===
    if p.text.startswith('Returns a paginated list of students with their cohort assignments'):
        if 'student' not in p.text.lower() or 'auto-filter' not in p.text.lower():
            p.text = (
                'Returns a paginated list of students with their cohort assignments. '
                'When called by a student, results are automatically filtered to show only '
                'that student\'s own enrolments. When called by a parent, results show only '
                'the linked child\'s enrolments. Admins and teachers see all students.'
            )
            changes.append(f"Added auto-filter note to enrolment overview (para {i})")

    # === Add access restriction note to statistics ===
    if p.text.startswith('Returns aggregate enrolment statistics'):
        if '403' not in p.text:
            p.text = (
                'Returns aggregate enrolment statistics for the school, including total students, '
                'enrolled counts, and warnings. Admin and teacher only (students/parents get 403).'
            )
            changes.append(f"Added admin-only note to enrolment statistics (para {i})")

    # === Add access restriction to experience statistics ===
    if 'enrolment and completion statistics for an experience' in p.text.lower() or \
       'enrolment and completion statistics' in p.text.lower():
        if '403' not in p.text and 'experience' in p.text.lower():
            p.text = p.text.rstrip('.') + '. Admin and teacher only (students/parents get 403).'
            changes.append(f"Added admin-only note to experience statistics (para {i})")

    # === Update dashboard endpoint descriptions ===
    # PoS Coverage
    if p.text.startswith('Returns Alberta Program of Studies'):
        if '403' not in p.text:
            p.text = p.text.rstrip('.') + '. Admin and teacher only (students/parents get 403).'
            changes.append(f"Added admin-only note to PoS coverage (para {i})")

    # Engagement
    if p.text.startswith('Returns student engagement rates'):
        if '403' not in p.text:
            p.text = p.text.rstrip('.') + '. Admin and teacher only (students/parents get 403).'
            changes.append(f"Added admin-only note to engagement (para {i})")

    # Widgets
    if p.text.startswith('Returns all dashboard widgets in a single response'):
        if '403' not in p.text:
            p.text = p.text.rstrip('.') + '. Admin and teacher only (students/parents get 403).'
            changes.append(f"Added admin-only note to all-widgets (para {i})")

    if p.text.startswith('Returns a single dashboard widget by type'):
        if '403' not in p.text:
            p.text = p.text.rstrip('.') + '. Admin and teacher only (students/parents get 403).'
            changes.append(f"Added admin-only note to single-widget (para {i})")

    # === Student drill-down scoping note ===
    if p.text.startswith('Returns detailed data for a single student'):
        if 'own record' not in p.text:
            p.text = (
                'Returns detailed data for a single student including enrolments, progress, '
                'credentials, and curriculum mapping. Accessible by all roles, but students can only '
                'view their own record (403 if studentId != self) and parents can only view '
                'their linked child (403 if studentId != parent_of).'
            )
            changes.append(f"Added scoping note to student drill-down (para {i})")

    # === Update enrolment student detail scoping note ===
    if 'student detail' in p.text.lower() and 'cohort assignments' in p.text.lower() and 'credential' in p.text.lower():
        if 'own record' not in p.text:
            p.text = (
                'Returns detailed enrolment information for a single student, including all '
                'cohort assignments and credential summary. Students can only view their own '
                'record (403 if studentId != self). Parents can only view their linked child '
                '(403 if studentId != parent_of).'
            )
            changes.append(f"Added scoping note to enrolment student detail (para {i})")

    # === Fix the mock course path reference ===
    if 'experience-service/app/DataProviders/MockCourseDataProvider.php' in p.text:
        old = p.text
        p.text = p.text.replace(
            'experience-service/app/DataProviders/MockCourseDataProvider.php',
            'experience-service/app/Services/MockCourseDataProvider.php'
        )
        if old != p.text:
            changes.append(f"Fixed MockCourseDataProvider path (para {i})")

    # === Fix mock credential path reference ===
    if 'enrolment-service/app/DataProviders/MockCredentialDataProvider.php' in p.text:
        old = p.text
        p.text = p.text.replace(
            'enrolment-service/app/DataProviders/MockCredentialDataProvider.php',
            'enrolment-service/app/Services/MockCredentialDataProvider.php'
        )
        if old != p.text:
            changes.append(f"Fixed MockCredentialDataProvider path (para {i})")

    # === Fix mock progress provider path reference ===
    if 'dashboard-service/app/DataProviders/MockStudentProgressProvider.php' in p.text:
        old = p.text
        p.text = p.text.replace(
            'dashboard-service/app/DataProviders/MockStudentProgressProvider.php',
            'dashboard-service/app/Services/MockStudentProgressProvider.php'
        )
        if old != p.text:
            changes.append(f"Fixed MockStudentProgressProvider path (para {i})")

doc.save('API-CONTRACT.docx')

print(f"Applied {len(changes)} changes:")
for c in changes:
    print(f"  - {c}")
