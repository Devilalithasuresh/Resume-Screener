import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import ResultsDashboard from '../components/ResultsDashboard';
import { getResultById, downloadReport } from '../services/api';

export default function ProfilePage() {
  const { analysisId } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const data = await getResultById(analysisId);
        setResult(data);
      } catch {
        setError('Failed to load candidate profile.');
      } finally {
        setLoading(false);
      }
    };
    if (analysisId) fetchProfile();
  }, [analysisId]);

  const handleDownloadReport = async () => {
    try {
      const blob = await downloadReport(analysisId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `resume_analysis_${analysisId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      setError('Failed to download report.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in">
      <div className="mb-6">
        <Link to="/ranking" className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Rankings
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Candidate Profile</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Detailed analysis and interview preparation</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <LoadingSpinner message="Loading profile..." />
      ) : result ? (
        <ResultsDashboard result={result} onDownloadReport={handleDownloadReport} />
      ) : (
        <div className="glass-card p-12 text-center text-gray-500">Profile not found</div>
      )}
    </div>
  );
}
