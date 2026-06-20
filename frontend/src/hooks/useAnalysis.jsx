import { createContext, useContext, useState } from 'react';

const AnalysisContext = createContext(null);

export function AnalysisProvider({ children }) {
  const [candidates, setCandidates] = useState([]);
  const [analysisResults, setAnalysisResults] = useState([]);
  const [jobDescription, setJobDescription] = useState('');
  const [selectedResult, setSelectedResult] = useState(null);

  const reset = () => {
    setCandidates([]);
    setAnalysisResults([]);
    setJobDescription('');
    setSelectedResult(null);
  };

  return (
    <AnalysisContext.Provider
      value={{
        candidates,
        setCandidates,
        analysisResults,
        setAnalysisResults,
        jobDescription,
        setJobDescription,
        selectedResult,
        setSelectedResult,
        reset,
      }}
    >
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysis() {
  const context = useContext(AnalysisContext);
  if (!context) throw new Error('useAnalysis must be used within AnalysisProvider');
  return context;
}
