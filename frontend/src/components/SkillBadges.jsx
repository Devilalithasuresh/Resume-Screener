export default function SkillBadges({ matchedSkills = [], missingSkills = [] }) {
  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500"></span>
          Matched Skills ({matchedSkills.length})
        </h4>
        <div className="flex flex-wrap gap-2">
          {matchedSkills.length > 0 ? (
            matchedSkills.map((skill) => (
              <span key={skill} className="badge-match">{skill}</span>
            ))
          ) : (
            <span className="text-sm text-gray-400">No matched skills identified</span>
          )}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500"></span>
          Missing Skills ({missingSkills.length})
        </h4>
        <div className="flex flex-wrap gap-2">
          {missingSkills.length > 0 ? (
            missingSkills.map((skill) => (
              <span key={skill} className="badge-missing">{skill}</span>
            ))
          ) : (
            <span className="text-sm text-gray-400">No significant skill gaps</span>
          )}
        </div>
      </div>
    </div>
  );
}
