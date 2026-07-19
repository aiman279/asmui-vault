import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { FinanceProvider } from './hooks/useFinance'
import { ThemeProvider } from './hooks/useTheme'
import { CommitmentsPage } from './pages/Commitments'
import { Dashboard } from './pages/Dashboard'
import { ExpensesPage } from './pages/Expenses'
import { GoalsPage } from './pages/Goals'
import { GrabPage } from './pages/Grab'
import { IncomePage } from './pages/Income'
import { MorePage } from './pages/More'
import { SummaryPage } from './pages/Summary'

export default function App() {
  return (
    <ThemeProvider>
      <FinanceProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="grab" element={<GrabPage />} />
              <Route path="income" element={<IncomePage />} />
              <Route path="expenses" element={<ExpensesPage />} />
              <Route path="goals" element={<GoalsPage />} />
              <Route path="summary" element={<SummaryPage />} />
              <Route path="commitments" element={<CommitmentsPage />} />
              <Route path="more" element={<MorePage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </FinanceProvider>
    </ThemeProvider>
  )
}
