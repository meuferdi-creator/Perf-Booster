import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Auth Guard
import { ProtectedRoute } from './components/auth/ProtectedRoute';

// Public pages
import { LoginPage } from './pages/LoginPage';
import { ChangePasswordPage } from './pages/ChangePasswordPage';

// Agent area
import { AgentLayout } from './components/layout/AgentLayout';
import { AgentDashboardPage } from './pages/agent/AgentDashboardPage';
import { AgentEvolutionPage } from './pages/agent/AgentEvolutionPage';
import { AgentFeedbacksPage } from './pages/agent/AgentFeedbacksPage';
import { AgentQaPage } from './pages/agent/AgentQaPage';
import { AgentObjectifsPage } from './pages/agent/AgentObjectifsPage';
import { AgentGamificationPage } from './pages/agent/AgentGamificationPage';
import { AgentMonthlyPage } from './pages/agent/AgentMonthlyPage';
import { AgentAssistantPage } from './pages/agent/AgentAssistantPage';

// Manager area
import { ManagerLayout } from './components/layout/ManagerLayout';
import { ManagerDashboardPage } from './pages/manager/ManagerDashboardPage';
import { ManagerAgentsPage } from './pages/manager/ManagerAgentsPage';
import { ManagerImportPage } from './pages/manager/ManagerImportPage';
import { ManagerRcaPage } from './pages/manager/ManagerRcaPage';
import { ManagerFeedbacksPage } from './pages/manager/ManagerFeedbacksPage';
import { ManagerCommentsPage } from './pages/manager/ManagerCommentsPage';
import { ManagerCoachingPage } from './pages/manager/ManagerCoachingPage';
import { ManagerAnalyticsPage } from './pages/manager/ManagerAnalyticsPage';
import { ManagerExportsPage } from './pages/manager/ManagerExportsPage';
import { ManagerMonthlyPage } from './pages/manager/ManagerMonthlyPage';
import { ManagerSimulatorPage } from './pages/manager/ManagerSimulatorPage';
import { ManagerResultsPage } from './pages/manager/ManagerResultsPage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Routes */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/change-password" element={<ChangePasswordPage />} />

        {/* Agent Routes - Protected */}
        <Route element={<ProtectedRoute allowedRoles={['agent']} />}>
          <Route path="/agent" element={<AgentLayout />}>
            <Route index element={<AgentDashboardPage />} />
            <Route path="evolution" element={<AgentEvolutionPage />} />
            <Route path="feedbacks" element={<AgentFeedbacksPage />} />
            <Route path="qa" element={<AgentQaPage />} />
            <Route path="objectifs" element={<AgentObjectifsPage />} />
            <Route path="gamification" element={<AgentGamificationPage />} />
            <Route path="monthly" element={<AgentMonthlyPage />} />
            <Route path="assistant" element={<AgentAssistantPage />} />
          </Route>
        </Route>

        {/* Manager Routes - Protected */}
        <Route element={<ProtectedRoute allowedRoles={['manager', 'admin']} />}>
          <Route path="/manager" element={<ManagerLayout />}>
            <Route index element={<ManagerDashboardPage />} />
            <Route path="agents" element={<ManagerAgentsPage />} />
            <Route path="import" element={<ManagerImportPage />} />
            <Route path="rca" element={<ManagerRcaPage />} />
            <Route path="feedbacks" element={<ManagerFeedbacksPage />} />
            <Route path="comments" element={<ManagerCommentsPage />} />
            <Route path="coaching" element={<ManagerCoachingPage />} />
            <Route path="analytics" element={<ManagerAnalyticsPage />} />
            <Route path="exports" element={<ManagerExportsPage />} />
            <Route path="monthly" element={<ManagerMonthlyPage />} />
            <Route path="simulator" element={<ManagerSimulatorPage />} />
            <Route path="results" element={<ManagerResultsPage />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
