import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import { Toaster } from 'react-hot-toast';

import { useUserStore } from './stores/userStore';
import { useChatStore } from './stores/chatStore';

import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Chat from './pages/Chat';
import KnowledgeGraph from './pages/KnowledgeGraph';
import Settings from './pages/Settings';
import LoadingSpinner from './components/LoadingSpinner';

const App: React.FC = () => {
  const { isAuthenticated, isLoading, initializeAuth } = useUserStore();
  const { initializeSocket } = useChatStore();

  useEffect(() => {
    initializeAuth();
    initializeSocket();
  }, [initializeAuth, initializeSocket]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#3b82f6',
          borderRadius: 8,
        },
      }}
    >
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route
              path="/login"
              element={
                isAuthenticated ? <Navigate to="/chat" replace /> : <Login />
              }
            />
            <Route
              path="/register"
              element={
                isAuthenticated ? <Navigate to="/chat" replace /> : <Register />
              }
            />
            <Route
              path="/"
              element={
                isAuthenticated ? (
                  <Layout />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            >
              <Route index element={<Navigate to="/chat" replace />} />
              <Route path="chat" element={<Chat />} />
              <Route path="knowledge" element={<KnowledgeGraph />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
        </div>
      </Router>
    </ConfigProvider>
  );
};

export default App;
