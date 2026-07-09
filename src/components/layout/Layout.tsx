import { Outlet, Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Moon, Sun, Shield, LogOut, GitBranch } from 'lucide-react';

export default function Layout() {
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-surface-light dark:bg-surface-dark shadow-sm border-b border-gray-200 dark:border-gray-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-primary font-bold text-xl hover:opacity-80 transition-opacity">
            <GitBranch className="w-6 h-6" />
            <span>Mis Raíces</span>
          </Link>
          
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link to="/admin" className="text-sm font-medium hover:text-primary transition-colors">
                  Dashboard
                </Link>
                <button 
                  onClick={signOut}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-red-500"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <Link to="/login" className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" title="Acceso Administrador">
                <Shield className="w-5 h-5" />
              </Link>
            )}

            <button 
              onClick={toggleTheme} 
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      <footer className="bg-surface-light dark:bg-surface-dark border-t border-gray-200 dark:border-gray-800 py-6 mt-auto">
        <div className="text-center text-sm opacity-70">
          <p>© {new Date().getFullYear()} Árbol Genealógico</p>
        </div>
      </footer>
    </div>
  );
}
