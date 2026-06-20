import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAnalysis } from '../hooks/useAnalysis';
import { rankCandidates, exportRankingsCsv, getResults } from '../services/api';

export default function RankingPage() {
  const { analysisResults, setAnalysisResults } = useAnalysis();
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortField, setSortField] = useState('rank');
  const [sortDir, setSortDir] = useState('asc');
  const [filterMin, setFilterMin] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadRankings = async () => {
      setLoading(true);
      try {
        let results = analysisResults;
        if (results.length === 0) {
          const data = await getResults();
          results = data.results;
          setAnalysisResults(results);
        }
        if (results.length === 0) {
          setRankings([]);
          return;
        }
        const analysisIds = results.map((r) => r.analysis_id);
        const data = await rankCandidates(analysisIds);
        setRankings(data.rankings);
      } catch {
        setError('Failed to load rankings.');
      } finally {
        setLoading(false);
      }
    };
    loadRankings();
  }, [analysisResults, setAnalysisResults]);

  const filteredRankings = useMemo(() => {
    let filtered = [...rankings];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.name?.toLowerCase().includes(term) ||
          r.email?.toLowerCase().includes(term)
      );
    }
    if (filterMin) {
      filtered = filtered.filter((r) => r.ats_score >= parseFloat(filterMin));
    }
    filtered.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (sortField === 'rank') {
        aVal = a.rank;
        bVal = b.rank;
      }
      if (typeof aVal === 'string') {
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });
    return filtered;
  }, [rankings, searchTerm, filterMin, sortField, sortDir]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir(field === 'ats_score' ? 'desc' : 'asc');
    }
  };

  const handleExportCsv = async () => {
    try {
      const ids = rankings.map((r) => r.analysis_id);
      const blob = await exportRankingsCsv(ids);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'candidate_rankings.csv';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      setError('Failed to export CSV.');
    }
  };

  const SortIcon = ({ field }) => (
    <span className="ml-1 inline-block">
      {sortField === field ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
    </span>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Candidate Rankings</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Compare and rank multiple candidates</p>
        </div>
        {rankings.length > 0 && (
          <button onClick={handleExportCsv} className="btn-secondary text-sm">
            Export to CSV
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      {rankings.length > 0 && (
        <div className="glass-card p-4 mb-6 flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Search candidates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field flex-1"
          />
          <input
            type="number"
            placeholder="Min score filter"
            min="0"
            max="100"
            value={filterMin}
            onChange={(e) => setFilterMin(e.target.value)}
            className="input-field w-full sm:w-40"
          />
        </div>
      )}

      {loading ? (
        <LoadingSpinner message="Loading rankings..." />
      ) : rankings.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">No rankings available yet.</p>
          <Link to="/screening" className="btn-primary inline-flex">Upload & Analyze Resumes</Link>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-800/50">
                  <th
                    onClick={() => handleSort('rank')}
                    className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-primary-600"
                  >
                    Rank <SortIcon field="rank" />
                  </th>
                  <th
                    onClick={() => handleSort('name')}
                    className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-primary-600"
                  >
                    Candidate <SortIcon field="name" />
                  </th>
                  <th
                    onClick={() => handleSort('ats_score')}
                    className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-primary-600"
                  >
                    Score <SortIcon field="ats_score" />
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Matched Skills
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                {filteredRankings.map((candidate) => (
                  <tr key={candidate.analysis_id} className="hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                          candidate.rank === 1
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300'
                            : candidate.rank === 2
                            ? 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-gray-300'
                            : candidate.rank === 3
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                            : 'bg-gray-50 text-gray-500 dark:bg-slate-800 dark:text-gray-400'
                        }`}
                      >
                        {candidate.rank}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900 dark:text-white">{candidate.name}</p>
                      <p className="text-xs text-gray-500">{candidate.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary-600 rounded-full transition-all"
                            style={{ width: `${candidate.ats_score}%` }}
                          />
                        </div>
                        <span className="font-bold text-primary-600">{Math.round(candidate.ats_score)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {candidate.matched_skills.slice(0, 3).map((s) => (
                          <span key={s} className="badge-match text-xs">{s}</span>
                        ))}
                        {candidate.matched_skills.length > 3 && (
                          <span className="text-xs text-gray-400">+{candidate.matched_skills.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        to={`/profile/${candidate.analysis_id}`}
                        className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                      >
                        View Profile
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
