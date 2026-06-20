import ScoreChart from './ScoreChart';
import SkillBadges from './SkillBadges';

function InsightList({ title, items, icon, colorClass }) {
  return (
    <div className="glass-card p-6 animate-slide-up">
      <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${colorClass}`}>
        {icon}
        {title}
      </h3>
      <ul className="space-y-2">
        {(items || []).map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-current flex-shrink-0 opacity-60"></span>
            {item}
          </li>
        ))}
        {(!items || items.length === 0) && (
          <li className="text-sm text-gray-400">No items identified</li>
        )}
      </ul>
    </div>
  );
}

export default function ResultsDashboard({ result, onDownloadReport }) {
  if (!result) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="glass-card p-8">
        <div className="flex flex-col lg:flex-row items-center gap-8">
          <ScoreChart score={result.ats_score} />
          <div className="flex-1 text-center lg:text-left">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{result.name || 'Candidate'}</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">{result.email || 'No email found'}</p>
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Skills', value: result.skill_match_score },
                { label: 'Experience', value: result.experience_match_score },
                { label: 'Education', value: result.education_match_score },
                { label: 'Semantic', value: result.semantic_similarity_score },
              ].map((item) => (
                <div key={item.label} className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{item.label}</p>
                  <p className="text-lg font-bold text-primary-600">{Math.round(item.value || 0)}%</p>
                </div>
              ))}
            </div>
            {onDownloadReport && (
              <button onClick={() => onDownloadReport(result.analysis_id)} className="btn-secondary mt-4 text-sm">
                Download PDF Report
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Candidate Summary</h3>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Name</dt>
              <dd className="font-medium text-gray-900 dark:text-white">{result.name || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Email</dt>
              <dd className="font-medium text-gray-900 dark:text-white">{result.email || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Experience</dt>
              <dd className="font-medium text-gray-900 dark:text-white whitespace-pre-line line-clamp-4">
                {result.experience || 'N/A'}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Education</dt>
              <dd className="font-medium text-gray-900 dark:text-white whitespace-pre-line line-clamp-3">
                {result.education || 'N/A'}
              </dd>
            </div>
          </dl>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Skills Analysis</h3>
          <SkillBadges
            matchedSkills={result.matched_skills}
            missingSkills={result.missing_skills}
          />
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <InsightList
          title="Strengths"
          items={result.strengths}
          colorClass="text-green-600 dark:text-green-400"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <InsightList
          title="Weaknesses"
          items={result.weaknesses}
          colorClass="text-amber-600 dark:text-amber-400"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
        />
        <InsightList
          title="Recommendations"
          items={result.recommendations}
          colorClass="text-primary-600 dark:text-primary-400"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
        />
      </div>

      {result.interview_questions?.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Interview Questions (Based on Missing Skills)
          </h3>
          <ol className="space-y-3">
            {result.interview_questions.map((q, i) => (
              <li key={i} className="flex gap-3 text-sm text-gray-600 dark:text-gray-300">
                <span className="flex-shrink-0 w-6 h-6 bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 rounded-full flex items-center justify-center text-xs font-bold">
                  {i + 1}
                </span>
                {q}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
