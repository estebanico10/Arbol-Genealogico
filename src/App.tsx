import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import TreePage from './pages/TreePage';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminArbol from './pages/AdminArbol';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { DataProvider } from './context/DataContext';

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <DataProvider>
          <HashRouter>
            <Routes>
              {/* Rutas con Layout estándar (Home, Dashboard) */}
              <Route path="/" element={<Layout />}>
                <Route index element={<HomePage />} />
                <Route path="login" element={<AdminLogin />} />
                <Route path="admin" element={<AdminDashboard />} />
                <Route path="admin/tree/:id" element={<AdminArbol />} />
              </Route>

              {/* Ruta Inmersiva Full-Screen Canvas sin barras globales ni scrollbars */}
              <Route path="/tree/:id" element={<TreePage />} />
            </Routes>
          </HashRouter>
        </DataProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
