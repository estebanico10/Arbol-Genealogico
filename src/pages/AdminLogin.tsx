import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Shield } from 'lucide-react';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/admin');
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // In a real scenario, the email would be an input or hardcoded securely.
    // Assuming the admin email was created as admin@arbol.local
    const { error } = await supabase.auth.signInWithPassword({
      email: 'estebanico10@gmail.com', // Reemplaza esto con el correo que usaste en Supabase Auth
      password: password,
    });

    if (error) {
      setError('Contraseña incorrecta o error de conexión.');
    } else {
      navigate('/admin');
    }
    
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto mt-20 animate-fade-in">
      <div className="bg-surface-light dark:bg-surface-dark p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 text-center">
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
          <Shield className="w-8 h-8" />
        </div>
        
        <h2 className="text-2xl font-bold mb-2">Acceso Administrativo</h2>
        <p className="opacity-70 mb-8">Ingresa la contraseña maestra para gestionar los árboles genealógicos.</p>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <input 
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              required
            />
          </div>
          
          {error && <p className="text-red-500 text-sm">{error}</p>}
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-primary hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-70 flex justify-center items-center"
          >
            {loading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
