
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { TimerPage } from './pages/TimerPage';
import { ChatPage } from './pages/ChatPage';

// Root component that provides AuthContext
function Root() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}

// Protected layout wrapper
function ProtectedLayout() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <Outlet />
      </AppLayout>
    </ProtectedRoute>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />
      },
      {
        path: "login",
        element: <LoginPage />
      },
      {
        path: "register", 
        element: <RegisterPage />
      },
      {
        path: "/",
        element: <ProtectedLayout />,
        children: [
          {
            path: "dashboard",
            element: <DashboardPage />
          },
          {
            path: "timer",
            element: <TimerPage />
          },
          {
            path: "chat",
            element: <ChatPage />
          }
        ]
      },
      {
        path: "*",
        element: <Navigate to="/dashboard" replace />
      }
    ]
  }
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
