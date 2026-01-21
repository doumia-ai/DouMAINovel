import zhCN from 'antd/locale/zh_CN';
import { ConfigProvider, theme } from 'antd';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import { ThemeProvider, useTheme } from './contexts/ThemeContext.js';
import { processRoutes } from './utils/route.utils.js';
import { routes } from './config/routes.config.js';

import './App.css';

function AppContent() {
  const { actualTheme } = useTheme();

  // Process routes with metadata wrappers
  const processedRoutes = processRoutes(routes);

  // Create router with processed routes
  const router = createBrowserRouter(processedRoutes, {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    },
  });

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: actualTheme === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: actualTheme === 'dark' ? '#5A9BA5' : '#4D8088',
          colorBgBase: actualTheme === 'dark' ? '#1a1a2e' : '#F8F6F1',
          colorBgContainer: actualTheme === 'dark' ? '#242438' : '#FFFFFF',
          colorBgElevated: actualTheme === 'dark' ? '#2D2D4A' : '#FFFFFF',
          colorBgLayout: actualTheme === 'dark' ? '#1a1a2e' : '#F8F6F1',
          colorText: actualTheme === 'dark' ? '#E8E8E8' : '#2B2B2B',
          colorTextSecondary: actualTheme === 'dark' ? '#A8A8A8' : '#595959',
          colorBorder: actualTheme === 'dark' ? '#3D3D5C' : '#D9D9D9',
          colorBorderSecondary: actualTheme === 'dark' ? '#2D2D4A' : '#F0F0F0',
        },
      }}
    >
      <RouterProvider router={router} />
    </ConfigProvider>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
