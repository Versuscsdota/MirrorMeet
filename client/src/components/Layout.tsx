import { Outlet, NavLink } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

export default function Layout() {
  const { user, logout } = useAuthStore();

  return (
    <div className="layout">
      <header className="header">
        <div className="container">
          <div className="header-content">
            <h1 className="logo">Mirror CRM</h1>
            <nav className="nav">
              <NavLink to="/models" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                Модели
              </NavLink>
              <NavLink to="/slots" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                Слоты
              </NavLink>
              <NavLink to="/analytics" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                Аналитика
              </NavLink>
              <NavLink to="/audit" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                Аудит
              </NavLink>
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
