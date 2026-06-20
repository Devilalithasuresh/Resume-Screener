import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

export const uploadResumes = async (files) => {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));
  const { data } = await api.post('/upload-resume', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const analyzeCandidates = async (candidateIds, jobDescription) => {
  const { data } = await api.post('/analyze', {
    candidate_ids: candidateIds,
    job_description: jobDescription,
  });
  return data;
};

export const rankCandidates = async (analysisIds) => {
  const { data } = await api.post('/rank-candidates', {
    analysis_ids: analysisIds,
  });
  return data;
};

export const getResults = async (params = {}) => {
  const { data } = await api.get('/results', { params });
  return data;
};

export const getResultById = async (analysisId) => {
  const { data } = await api.get(`/results/${analysisId}`);
  return data;
};

export const getCandidates = async () => {
  const { data } = await api.get('/candidates');
  return data;
};

export const downloadReport = async (analysisId) => {
  const response = await api.get(`/results/${analysisId}/report`, {
    responseType: 'blob',
  });
  return response.data;
};

export const exportRankingsCsv = async (analysisIds) => {
  const response = await api.get('/rankings/export', {
    params: { analysis_ids: analysisIds.join(',') },
    responseType: 'blob',
  });
  return response.data;
};

export default api;
