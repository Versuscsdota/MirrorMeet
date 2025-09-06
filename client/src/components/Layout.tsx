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
      
      {/* Mobile Navigation */}
      <nav className="mobile-nav">
        {canAccessModule('models') && (
          <NavLink to="/models" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
            <div className="icon">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <span className="label">Модели</span>
          </NavLink>
        )}
        {canAccessModule('slots') && (
          <NavLink to="/slots" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
            <div className="icon">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="label">Слоты</span>
          </NavLink>
        )}
        {canAccessModule('shifts') && (
          <NavLink to="/shifts" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
            <div className="icon">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="label">Смены</span>
          </NavLink>
        )}
        {canAccessModule('analytics') && (
          <NavLink to="/analytics" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
            <div className="icon">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <span className="label">Аналитика</span>
          </NavLink>
        )}
        {hasPermission('users', 'view') && (
          <NavLink to="/employees" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
            <div className="icon">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <span className="label">Люди</span>
          </NavLink>
        )}
      </nav>
    </div>
  );
}
