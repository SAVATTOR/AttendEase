/**
 * Formats user role for display
 * Converts enum values (TEACHER, STUDENT) to display-friendly text
 */
export function formatRoleForDisplay(role: string | undefined | null): string {
  if (!role) return '';
  
  const roleUpper = role.toUpperCase();
  
  switch (roleUpper) {
    case 'TEACHER':
      return 'Lecturer';
    case 'STUDENT':
      return 'Student';
    default:
      return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
  }
}

