import { useAuthStore } from '../store/useAuthStore';

interface UserPermissions {
  models: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
    export: boolean;
  };
  slots: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
    manage: boolean;
  };
  shifts: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
    manage: boolean;
  };
  analytics: {
    view: boolean;
    edit: boolean;
    export: boolean;
  };
  users: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
    manage_roles: boolean;
  };
  audit: {
    view: boolean;
    export: boolean;
  };
  settings: {
    view: boolean;
    edit: boolean;
  };
}

const DEFAULT_PERMISSIONS: UserPermissions = {
  models: { view: false, create: false, edit: false, delete: false, export: false },
  slots: { view: false, create: false, edit: false, delete: false, manage: false },
  shifts: { view: false, create: false, edit: false, delete: false, manage: false },
  analytics: { view: false, edit: false, export: false },
  users: { view: false, create: false, edit: false, delete: false, manage_roles: false },
  audit: { view: false, export: false },
  settings: { view: false, edit: false }
};

const ROLE_PERMISSIONS: Record<string, UserPermissions> = {
  admin: {
    models: { view: true, create: true, edit: true, delete: true, export: true },
    slots: { view: true, create: true, edit: true, delete: true, manage: true },
    shifts: { view: true, create: true, edit: true, delete: true, manage: true },
    analytics: { view: true, edit: true, export: true },
    users: { view: true, create: true, edit: true, delete: true, manage_roles: true },
    audit: { view: true, export: true },
    settings: { view: true, edit: true }
  },
  producer: {
    models: { view: true, create: true, edit: true, delete: false, export: true },
    slots: { view: true, create: true, edit: true, delete: false, manage: true },
    shifts: { view: true, create: true, edit: true, delete: false, manage: true },
    analytics: { view: true, edit: false, export: true },
    users: { view: true, create: false, edit: false, delete: false, manage_roles: false },
    audit: { view: false, export: false },
    settings: { view: false, edit: false }
  },
  curator: {
    models: { view: true, create: false, edit: true, delete: false, export: false },
    slots: { view: true, create: false, edit: true, delete: false, manage: false },
    shifts: { view: true, create: false, edit: true, delete: false, manage: false },
    analytics: { view: true, edit: false, export: false },
    users: { view: true, create: false, edit: false, delete: false, manage_roles: false },
    audit: { view: false, export: false },
    settings: { view: false, edit: false }
  },
  interviewer: {
    models: { view: true, create: false, edit: true, delete: false, export: false },
    slots: { view: true, create: false, edit: false, delete: false, manage: false },
    shifts: { view: true, create: false, edit: false, delete: false, manage: false },
    analytics: { view: false, edit: false, export: false },
    users: { view: false, create: false, edit: false, delete: false, manage_roles: false },
    audit: { view: false, export: false },
    settings: { view: false, edit: false }
  },
  operator: {
    models: { view: true, create: false, edit: false, delete: false, export: false },
    slots: { view: true, create: false, edit: false, delete: false, manage: false },
    shifts: { view: true, create: false, edit: false, delete: false, manage: false },
    analytics: { view: false, edit: false, export: false },
    users: { view: false, create: false, edit: false, delete: false, manage_roles: false },
    audit: { view: false, export: false },
    settings: { view: false, edit: false }
  },
  inactive: DEFAULT_PERMISSIONS
};

export const usePermissions = () => {
  const { user } = useAuthStore();
  
  console.log('usePermissions - user:', user);
  
  const getUserPermissions = (): UserPermissions => {
    if (!user || !user.role) {
      console.log('No user or role, returning default permissions');
      return DEFAULT_PERMISSIONS;
    }
    
    // If user has modules in their role data, use that
    if (user.role && typeof user.role === 'object' && 'modules' in user.role && user.role.modules) {
      console.log('Using role modules from user data:', user.role.modules);
      // Ensure the modules match our UserPermissions structure
      const modules = user.role.modules as UserPermissions;
      return modules;
    }
    
    // Fallback to static role permissions
    const roleName = typeof user.role === 'string' ? user.role : (user.role as any)?.name;
    console.log('User role:', roleName, 'Available roles:', Object.keys(ROLE_PERMISSIONS));
    return ROLE_PERMISSIONS[roleName] || DEFAULT_PERMISSIONS;
  };
  
  const hasPermission = (module: keyof UserPermissions, permission: string): boolean => {
    // Root has all permissions
    if (user?.username === 'root') {
      return true;
    }
    
    const permissions = getUserPermissions();
    return permissions[module]?.[permission as keyof typeof permissions[typeof module]] || false;
  };
  
  const canAccessModule = (module: keyof UserPermissions): boolean => {
    // Root can access all modules
    if (user?.username === 'root') {
      return true;
    }
    
    const permissions = getUserPermissions();
    const modulePerms = permissions[module];
    return Object.values(modulePerms).some(perm => perm === true);
  };
  
  return {
    permissions: getUserPermissions(),
    hasPermission,
    canAccessModule,
    isRoot: user?.username === 'root'
  };
};
