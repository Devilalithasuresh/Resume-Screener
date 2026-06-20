import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ResumeUpload from '../components/ResumeUpload';
import JobDescriptionInput from '../components/JobDescriptionInput';
import LoadingSpinner from '../components/LoadingSpinner';
import ResultsDashboard from '../components/ResultsDashboard';
import { useAnalysis } from '../hooks/useAnalysis';
import { uploadResumes, analyzeCandidates, downloadReport } from '../services/api';

export default function ScreeningPage() {
  const navigate = useNavigate();
  const {
    candidates,
    setCandidates,
    analysisResults,
    setAnalysisResults,
    jobDescription,
    setJobDescription,
    selectedResult,
    setSelectedResult,
  } = useAnalysis();

  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState('upload');
  const [uploadMode, setUploadMode] = useState('multiple');

  const handleUpload = async () => {
    if (files.length === 0) {
      setError('Please upload at least one resume.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const data = await uploadResumes(files);
      setCandidates(data.candidates);
      setStep('analyze');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to upload resumes.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (jobDescription.trim().length < 50) {
      setError('Job description must be at least 50 characters.');
      return;
    }
    if (candidates.length === 0) {
      setError('No candidates to analyze. Please upload resumes first.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const candidateIds = candidates.map((c) => c.id);
      const results = await analyzeCandidates(candidateIds, jobDescription);
      setAnalysisResults(results);
      setSelectedResult(results[0]);
      setStep('results');

      if (results.length > 1) {
        navigate('/ranking');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
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
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Resume Screening</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Upload resumes and analyze them against your job description
        </p>
      </div>

      <div className="flex gap-2 mb-8">
        {['upload', 'analyze', 'results'].map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step === s
                  ? 'bg-primary-600 text-white'
                  : ['upload', 'analyze', 'results'].indexOf(step) > i
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 dark:bg-slate-700 text-gray-500'
              }`}
            >
              {i + 1}
            </div>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300 capitalize hidden sm:inline">
              {s === 'upload' ? 'Upload' : s === 'analyze' ? 'Analyze' : 'Results'}
            </span>
            {i < 2 && <div className="w-8 h-0.5 bg-gray-200 dark:bg-slate-700 hidden sm:block"></div>}
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-sm">
          {typeof error === 'string' ? error : JSON.stringify(error)}
        </div>
      )}

      {loading && <LoadingSpinner message="Analyzing resumes with AI..." />}

      {!loading && step === 'upload' && (
        <div className="glass-card p-8 space-y-6">
          <div className="flex gap-3">
            <button
              onClick={() => { setUploadMode('single'); setFiles([]); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                uploadMode === 'single'
                  ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700'
                  : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700'
              }`}
            >
              Single Resume
            </button>
            <button
              onClick={() => { setUploadMode('multiple'); setFiles([]); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                uploadMode === 'multiple'
                  ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700'
                  : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700'
              }`}
            >
              Multiple Resumes
            </button>
          </div>

          <ResumeUpload
            files={files}
            setFiles={setFiles}
            multiple={uploadMode === 'multiple'}
          />

          <button onClick={handleUpload} disabled={files.length === 0} className="btn-primary w-full sm:w-auto">
            Upload & Continue
          </button>

          {candidates.length > 0 && (
            <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
              <p className="text-sm text-gray-500 mb-2">{candidates.length} candidate(s) uploaded</p>
              <button onClick={() => setStep('analyze')} className="btn-secondary text-sm">
                Skip to Analysis
              </button>
            </div>
          )}
        </div>
      )}

      {!loading && step === 'analyze' && (
        <div className="glass-card p-8 space-y-6">
          {candidates.length > 0 && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
              <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                {candidates.length} resume(s) ready for analysis
              </p>
              <ul className="mt-2 space-y-1">
                {candidates.map((c) => (
                  <li key={c.id} className="text-sm text-green-600 dark:text-green-400">
                    {c.name} — {c.filename}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <JobDescriptionInput value={jobDescription} onChange={setJobDescription} />

          <div className="flex gap-3">
            <button onClick={() => setStep('upload')} className="btn-secondary">
              Back
            </button>
            <button
              onClick={handleAnalyze}
              disabled={jobDescription.trim().length < 50}
              className="btn-primary flex-1 sm:flex-none"
            >
              Analyze Resumes
            </button>
          </div>
        </div>
      )}

      {!loading && step === 'results' && analysisResults.length > 0 && (
        <div className="space-y-6">
          {analysisResults.length > 1 && (
            <div className="flex gap-2 flex-wrap">
              {analysisResults.map((result) => (
                <button
                  key={result.analysis_id}
                  onClick={() => setSelectedResult(result)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    selectedResult?.analysis_id === result.analysis_id
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {result.name} ({Math.round(result.ats_score)}%)
                </button>
              ))}
            </div>
          )}
          <ResultsDashboard
            result={selectedResult || analysisResults[0]}
            onDownloadReport={handleDownloadReport}
          />
        </div>
      )}
    </div>
  );
}
