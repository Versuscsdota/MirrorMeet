import { Outlet, NavLink } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { usePermissions } from '../hooks/usePermissions';

export default function Layout() {
  const { user, logout } = useAuthStore();
  const { canAccessModule, hasPermission, isRoot } = usePermissions();

  return (
    <div className="layout">
      <header className="header">
        <div className="container">
          <div className="header-content">
            <h1 className="logo">Mirror CRM</h1>
            <nav className="nav">
              {canAccessModule('models') && (
                <NavLink to="/models" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                  Модели
                </NavLink>
              )}
              {canAccessModule('slots') && (
                <NavLink to="/slots" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                  Расписание
                </NavLink>
              )}
              {canAccessModule('shifts') && (
                <NavLink to="/shifts" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                  Смены
                </NavLink>
              )}
              {canAccessModule('shifts') && (
                <NavLink to="/apartments" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                  Студии
                </NavLink>
              )}
              {hasPermission('users', 'view') && (
                <NavLink to="/employees" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                  Сотрудники
                </NavLink>
              )}
              {canAccessModule('analytics') && (
                <NavLink to="/analytics" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                  Аналитика
                </NavLink>
              )}
              {hasPermission('audit', 'view') && (
                <NavLink to="/audit" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                  Аудит
                </NavLink>
              )}
              {isRoot && (
                <NavLink to="/roles" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                  Роли
                </NavLink>
              )}
            </nav>
            <div className="header-user">
              <span className="username">{user?.username}</span>
              <button onClick={logout} className="btn btn-secondary btn-sm">
                Выйти
              </button>
            </div>
          </div>
        </div>
      </header>
      <main className="main">
        <div className="container">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
