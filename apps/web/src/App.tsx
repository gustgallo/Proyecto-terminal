import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Public Pages
import { HomePage } from './pages/public/HomePage';
import { SolucionesPage } from './pages/public/SolucionesPage';
import { ServiciosPage } from './pages/public/ServiciosPage';
import { ProyectosPage } from './pages/public/ProyectosPage';
import { NosotrosPage } from './pages/public/NosotrosPage';
import { ContactoPage } from './pages/public/ContactoPage';

// Intranet Pages
import { IntranetLayout } from './components/intranet/IntranetLayout';
import { LoginPage } from './pages/intranet/LoginPage';
import { DashboardHome } from './pages/intranet/DashboardHome';
import { OvertimeModule } from './pages/intranet/OvertimeModule';
import { BonusesModule } from './pages/intranet/BonusesModule';
import { RequisitionsModule } from './pages/intranet/RequisitionsModule';
import { ProjectsModule } from './pages/intranet/ProjectsModule';
import { InternalRequestsModule } from './pages/intranet/InternalRequestsModule';
import { ChatbotModule } from './pages/intranet/ChatbotModule';
import { UsersModule } from './pages/intranet/UsersModule';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/intranet/login" replace />;
  }
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rutas Públicas B2B */}
          <Route path="/" element={<HomePage />} />
          <Route path="/soluciones" element={<SolucionesPage />} />
          <Route path="/servicios" element={<ServiciosPage />} />
          <Route path="/proyectos" element={<ProyectosPage />} />
          <Route path="/nosotros" element={<NosotrosPage />} />
          <Route path="/contacto" element={<ContactoPage />} />

          {/* Login Intranet */}
          <Route path="/intranet/login" element={<LoginPage />} />

          {/* Rutas Protegidas Intranet SWGRHP-IG */}
          <Route
            path="/intranet"
            element={
              <ProtectedRoute>
                <IntranetLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/intranet/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardHome />} />
            <Route path="horas-extras" element={<OvertimeModule />} />
            <Route path="bonificaciones" element={<BonusesModule />} />
            <Route path="materiales" element={<RequisitionsModule />} />
            <Route path="proyectos" element={<ProjectsModule />} />
            <Route path="solicitudes" element={<InternalRequestsModule />} />
            <Route path="chatbot" element={<ChatbotModule />} />
            <Route path="usuarios" element={<UsersModule />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
