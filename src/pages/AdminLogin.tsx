import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Shield, LogIn, UserPlus, Mail, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function AdminLogin() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('estebanico10@gmail.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/admin');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    if (!email.trim() || !password.trim()) {
      setError('Por favor, ingresa correo y contraseña.');
      setLoading(false);
      return;
    }

    if (mode === 'signin') {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (signInError) {
        setError(
          'Correo o contraseña incorrectos. Si aún no has creado tu cuenta de administrador en Supabase, selecciona "Registrar Administrador".'
        );
      } else {
        navigate('/admin');
      }
    } else {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
      });

      if (signUpError) {
        setError('Error al registrar: ' + signUpError.message);
      } else if (data.session) {
        navigate('/admin');
      } else {
        setSuccessMsg(
          'Cuenta de administrador creada correctamente. Ya puedes iniciar sesión con tus credenciales.'
        );
        setMode('signin');
      }
    }

    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto mt-16 animate-fade-in px-4">
      <div className="bg-surface-light dark:bg-surface-dark p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800">
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-primary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
          <Shield className="w-8 h-8" />
        </div>

        <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-gray-100 mb-2">
          {mode === 'signin' ? 'Acceso Administrativo' : 'Registrar Administrador'}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
          {mode === 'signin'
            ? 'Ingresa con tu cuenta para gestionar árboles, personas y relaciones.'
            : 'Crea tu cuenta de administrador para obtener permisos de edición en el sistema.'}
        </p>

        {/* Pestañas de modo */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-gray-100 dark:bg-gray-800/80 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setError('');
              setSuccessMsg('');
            }}
            className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
              mode === 'signin'
                ? 'bg-white dark:bg-gray-700 text-primary shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>Iniciar Sesión</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setError('');
              setSuccessMsg('');
            }}
            className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
              mode === 'signup'
                ? 'bg-white dark:bg-gray-700 text-primary shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Registrar</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                placeholder="ej: admin@arbol.local"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm"
                required
              />
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 p-3.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-xl text-red-600 dark:text-red-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-start gap-2.5 p-3.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/40 rounded-xl text-green-700 dark:text-green-300 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-blue-600 text-white font-semibold py-3.5 px-4 rounded-xl transition-colors disabled:opacity-70 flex justify-center items-center gap-2 shadow-sm"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : mode === 'signin' ? (
              <>
                <LogIn className="w-5 h-5" />
                <span>Entrar al Panel Admin</span>
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                <span>Crear Cuenta y Entrar</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
