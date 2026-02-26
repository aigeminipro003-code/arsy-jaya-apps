import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { ToastContainer } from './components/ui/Toast'
import Login from './pages/Login'
import AppLayout from './components/layout/AppLayout'
import OperatorDashboard from './pages/operator/Dashboard'
import ProductionForm from './pages/operator/ProductionForm'
import TeamHistory from './pages/operator/TeamHistory'
import AdminDashboard from './pages/admin/AdminDashboard'
import UserManagement from './pages/admin/UserManagement'
import MaterialManagement from './pages/admin/MaterialManagement'
import HistoryEditor from './pages/admin/HistoryEditor'
import CSVExporter from './pages/admin/CSVExporter'
import MachineManagement from './pages/admin/MachineManagement'

function ProtectedRoute({ children, adminOnly = false }) {
  const { session, isAdmin, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!session) return <Navigate to="/login" replace />
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />
  return children
}

function LoadingScreen() {
  return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg-primary)' }}>
      <div style={{ width: 40, height: 40, border: '3px solid var(--color-border)', borderTopColor: 'var(--color-accent)', borderRadius: '50%' }} className="animate-spin" />
    </div>
  )
}

export default function App() {
  const { session, isAdmin, loading } = useAuth()

  if (loading) return <LoadingScreen />

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={session ? <Navigate to="/" replace /> : <Login />} />
          <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            {/* Operator routes */}
            <Route index element={isAdmin ? <Navigate to="/admin" replace /> : <OperatorDashboard />} />
            <Route path="production" element={<ProductionForm />} />
            <Route path="team-history" element={<TeamHistory />} />
            {/* Admin routes */}
            <Route path="admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
            <Route path="admin/users" element={<ProtectedRoute adminOnly><UserManagement /></ProtectedRoute>} />
            <Route path="admin/materials" element={<ProtectedRoute adminOnly><MaterialManagement /></ProtectedRoute>} />
            <Route path="materials" element={<ProtectedRoute><MaterialManagement /></ProtectedRoute>} />
            <Route path="admin/machines" element={<ProtectedRoute adminOnly><MachineManagement /></ProtectedRoute>} />
            <Route path="admin/history" element={<ProtectedRoute adminOnly><HistoryEditor /></ProtectedRoute>} />
            <Route path="admin/export" element={<ProtectedRoute adminOnly><CSVExporter /></ProtectedRoute>} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <ToastContainer />
    </>
  )
}
