import React, { Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';

// Lazy load pages for performance
const Home = lazy(() => import('./pages/Home'));
const Unitoolbox = lazy(() => import('./pages/Unitoolbox'));
const HustleFinder = lazy(() => import('./pages/HustleFinder'));
const ResumeBuilder = lazy(() => import('./pages/ResumeBuilder'));
const FinanceTools = lazy(() => import('./pages/FinanceTools'));
const CodeXRay = lazy(() => import('./pages/CodeXRay'));

const Loading = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
  </div>
);

const App: React.FC = () => {
  return (
    <HashRouter>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="unitoolbox" element={<Unitoolbox />} />
            <Route path="hustlefinder" element={<HustleFinder />} />
            <Route path="resume-builder" element={<ResumeBuilder />} />
            <Route path="finance-tools" element={<FinanceTools />} />
            <Route path="code-xray" element={<CodeXRay />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </HashRouter>
  );
};

export default App;