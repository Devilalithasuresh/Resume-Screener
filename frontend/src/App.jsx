import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './hooks/useTheme';
import { AnalysisProvider } from './hooks/useAnalysis';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import ScreeningPage from './pages/ScreeningPage';
import ResultsPage from './pages/ResultsPage';
import RankingPage from './pages/RankingPage';
import ProfilePage from './pages/ProfilePage';

function AppLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-surface dark:bg-slate-900 transition-colors duration-300">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AnalysisProvider>
        <BrowserRouter>
          <AppLayout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/screening" element={<ScreeningPage />} />
              <Route path="/results" element={<ResultsPage />} />
              <Route path="/ranking" element={<RankingPage />} />
              <Route path="/profile/:analysisId" element={<ProfilePage />} />
            </Routes>
          </AppLayout>
        </BrowserRouter>
      </AnalysisProvider>
    </ThemeProvider>
  );
}
