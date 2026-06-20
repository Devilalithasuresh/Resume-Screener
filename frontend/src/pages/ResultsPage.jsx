import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import ResultsDashboard from '../components/ResultsDashboard';
import { getResults, downloadReport } from '../services/api';

export default function ResultsPage() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [minScore, setMinScore] = useState('');
  const [selected, setSelected] = useState(null);

  const fetchResults = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (search) params.search = search;
      if (minScore) params.min_score = parseFloat(minScore);
      const data = await getResults(params);
      setResults(data.results);
      if (data.results.length > 0 && !selected) {
        setSelected(data.results[0]);
      }
    } catch {
      setError('Failed to load results.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchResults();
  };

  const handleDownloadReport = async (analysisId) => {
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
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analysis Results</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Browse and search past screening results</p>
      </div>

      <form onSubmit={handleSearch} className="glass-card p-4 mb-6 flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field flex-1"
        />
        <input
          type="number"
          placeholder="Min score"
          min="0"
          max="100"
          value={minScore}
          onChange={(e) => setMinScore(e.target.value)}
          className="input-field w-full sm:w-32"
        />
        <button type="submit" className="btn-primary">Search</button>
      </form>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <LoadingSpinner message="Loading results..." />
      ) : results.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">No results found.</p>
          <Link to="/screening" className="btn-primary mt-4 inline-flex">Start Screening</Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-3 max-h-[70vh] overflow-y-auto">
            {results.map((result) => (
              <button
                key={result.analysis_id}
                onClick={() => setSelected(result)}
                className={`w-full text-left glass-card p-4 transition-all hover:-translate-y-0.5 ${
                  selected?.analysis_id === result.analysis_id
                    ? 'ring-2 ring-primary-500'
                    : ''
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{result.name}</p>
                    <p className="text-xs text-gray-500">{result.email}</p>
                  </div>
                  <span
                    className={`text-lg font-bold ${
                      result.ats_score >= 80
                        ? 'text-green-600'
                        : result.ats_score >= 60
                        ? 'text-primary-600'
                        : 'text-amber-600'
                    }`}
                  >
                    {Math.round(result.ats_score)}%
                  </span>
                </div>
              </button>
            ))}
          </div>
          <div className="lg:col-span-2">
            {selected ? (
              <ResultsDashboard result={selected} onDownloadReport={handleDownloadReport} />
            ) : (
              <div className="glass-card p-12 text-center text-gray-500">Select a result to view details</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
