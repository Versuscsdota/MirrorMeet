import { ReactNode } from 'react';
import { usePermissions } from '../hooks/usePermissions';

interface ProtectedRouteProps {
  children: ReactNode;
  module?: 'models' | 'slots' | 'shifts' | 'analytics' | 'users' | 'audit' | 'settings';
  permission?: string;
  requireRoot?: boolean;
  fallback?: ReactNode;
}

export const ProtectedRoute = ({ 
  children, 
  module, 
  permission, 
  requireRoot = false, 
  fallback = <div className="access-denied">Доступ запрещен</div> 
}: ProtectedRouteProps) => {
  const { hasPermission, canAccessModule, isRoot } = usePermissions();

  console.log('ProtectedRoute check:', { module, permission, requireRoot, isRoot });

  // Check root access
  if (requireRoot && !isRoot) {
    console.log('Access denied: requireRoot but not root');
    return <>{fallback}</>;
  }

  // Check module access
  if (module && !canAccessModule(module)) {
    console.log('Access denied: cannot access module', module);
    return <>{fallback}</>;
  }

  // Check specific permission
  if (module && permission && !hasPermission(module, permission)) {
    console.log('Access denied: no permission', module, permission);
    return <>{fallback}</>;
  }

  console.log('Access granted');
  return <>{children}</>;
};
