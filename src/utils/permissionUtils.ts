import { UserProfile, SupervisorScope, AcademicLevel, Department } from '../types';

export function isSuperAdmin(user: UserProfile | null): boolean {
  if (!user) return false;
  return user.role === 'super_admin';
}

export function isSupervisor(user: UserProfile | null): boolean {
  if (!user) return false;
  return user.role === 'supervisor' || user.role === 'department_admin' || user.role === 'super_admin';
}

/**
 * Validates whether a given user (Supervisor/Admin) has authorization
 * over a specific target entity (Course, Material, Resource, Announcement)
 */
export function isWithinSupervisorScope(
  user: UserProfile | null,
  target: {
    departmentId?: string;
    level?: AcademicLevel | string;
    courseId?: string;
  },
  action?: keyof SupervisorScope
): boolean {
  if (!user) return false;

  // Super admin has full unrestricted authority
  if (user.role === 'super_admin') return true;

  // Standard students have no supervisor permissions
  if (user.role === 'student') return false;

  const scope = user.supervisorScope;

  // Check action toggle if provided in scope
  if (action && scope && scope[action] === false) {
    return false;
  }

  const userDeptId = scope ? scope.departmentId : user.departmentId;
  const userLevel = scope ? scope.level : 'all';

  // 1. Department Scope Check
  if (userDeptId && userDeptId !== 'all' && target.departmentId) {
    const userClean = userDeptId.replace('-01', '');
    const targetClean = target.departmentId.replace('-01', '');
    if (userClean !== targetClean) {
      return false;
    }
  }

  // 2. Academic Level Scope Check
  if (userLevel && userLevel !== 'all' && target.level) {
    if (userLevel !== target.level) {
      return false;
    }
  }

  // 3. Specific Course ID Scope Check
  if (scope?.assignedCourseIds && scope.assignedCourseIds.length > 0 && target.courseId) {
    if (!scope.assignedCourseIds.includes(target.courseId)) {
      return false;
    }
  }

  return true;
}

/**
 * Formats a supervisor's scope into a human-readable Arabic label
 */
export function getSupervisorScopeLabel(
  user: UserProfile | null,
  departments: Department[] = []
): string {
  if (!user) return '';
  if (user.role === 'super_admin') return 'إشراف شامل على كافة الأقسام والمقررات (Super Admin)';
  if (user.role === 'student') return 'طالب أكاديمي';

  if (user.supervisorTitle) return user.supervisorTitle;

  const scope = user.supervisorScope;
  if (!scope) return 'أخصائي قسم محدد';

  let deptName = 'كافة الأقسام';
  if (scope.departmentId !== 'all') {
    const foundDept = departments.find(d => d.id === scope.departmentId || d.id === `${scope.departmentId}-01` || scope.departmentId.includes(d.id));
    if (foundDept) {
      deptName = foundDept.name;
    } else if (scope.departmentId === 'dept-cmp' || scope.departmentId === 'dept-cmp-01') {
      deptName = 'هندسة الحاسب والذكاء الاصطناعي';
    } else if (scope.departmentId === 'dept-mtr' || scope.departmentId === 'dept-mtr-01') {
      deptName = 'هندسة الميكاترونكس والروبوتات';
    } else {
      deptName = scope.departmentId;
    }
  }

  let levelText = 'جميع الفرائق والسنوات';
  if (scope.level && scope.level !== 'all') {
    levelText = scope.level;
  }

  return `مشرف قسم ${deptName} - [${levelText}]`;
}
