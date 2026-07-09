import { Link } from 'react-router-dom';
import { useData } from '../context/DataContext';

export default function HomePage() {
  const { arboles, loading } = useData();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight text-primary">Tus Árboles Genealógicos</h1>
        <p className="text-lg opacity-80 max-w-2xl mx-auto">
          Selecciona una familia para explorar su historia, ver las conexiones y descubrir sus raíces.
        </p>
      </div>

      {arboles.length === 0 ? (
        <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-12 text-center shadow-sm border border-gray-200 dark:border-gray-800">
          <h3 className="text-xl font-semibold mb-2">No hay árboles creados aún</h3>
          <p className="opacity-70 mb-6">Inicia sesión como administrador para crear tu primer árbol genealógico.</p>
          <Link to="/login" className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors inline-block">
            Acceso Administrador
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {arboles.map((arbol) => (
            <Link 
              key={arbol.id} 
              to={`/tree/${arbol.id}`}
              className="group block bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-md transition-all hover:-translate-y-1"
            >
              <div className="aspect-video w-full bg-gray-100 dark:bg-gray-800 relative">
                {arbol.imagen ? (
                  <img src={arbol.imagen} alt={arbol.nombre} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl opacity-20">🌳</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                  <span className="text-white font-medium">Explorar árbol &rarr;</span>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{arbol.nombre}</h3>
                {arbol.descripcion && (
                  <p className="text-sm opacity-70 line-clamp-2">{arbol.descripcion}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
