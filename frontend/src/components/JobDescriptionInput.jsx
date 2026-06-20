const MAX_CHARS = 5000;

export default function JobDescriptionInput({ value, onChange }) {
  const charCount = value.length;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
        Job Description
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, MAX_CHARS))}
        placeholder="Paste the full job description here. Include required skills, experience level, education requirements, and responsibilities for accurate ATS matching..."
        rows={10}
        className="input-field resize-none"
      />
      <div className="flex justify-between text-xs">
        <span className={`${charCount < 50 ? 'text-amber-500' : 'text-gray-400'}`}>
          {charCount < 50 ? 'Minimum 50 characters required' : 'Ready for analysis'}
        </span>
        <span className={`${charCount >= MAX_CHARS ? 'text-red-500' : 'text-gray-400'}`}>
          {charCount} / {MAX_CHARS}
        </span>
      </div>
    </div>
  );
}
