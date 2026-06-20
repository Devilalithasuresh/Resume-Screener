import { useCallback, useState } from 'react';

const ACCEPTED = ['.pdf', '.docx'];

export default function ResumeUpload({ files, setFiles, multiple = true }) {
  const [dragActive, setDragActive] = useState(false);

  const validateAndAdd = useCallback(
    (incoming) => {
      const valid = Array.from(incoming).filter((file) => {
        const ext = '.' + file.name.split('.').pop().toLowerCase();
        return ACCEPTED.includes(ext);
      });
      if (valid.length === 0) return;
      setFiles((prev) => (multiple ? [...prev, ...valid] : valid.slice(0, 1)));
    },
    [multiple, setFiles]
  );

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    validateAndAdd(e.dataTransfer.files);
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 ${
          dragActive
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
            : 'border-gray-300 dark:border-slate-600 hover:border-primary-400 dark:hover:border-primary-500'
        }`}
      >
        <input
          type="file"
          accept=".pdf,.docx"
          multiple={multiple}
          onChange={(e) => validateAndAdd(e.target.files)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="pointer-events-none">
          <div className="w-16 h-16 mx-auto mb-4 bg-primary-100 dark:bg-primary-900/40 rounded-2xl flex items-center justify-center">
            <svg className="w-8 h-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <p className="text-gray-700 dark:text-gray-200 font-medium">
            Drag & drop resumes here, or click to browse
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Supports PDF and DOCX {multiple ? '(multiple files allowed)' : '(single file)'}
          </p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center justify-between p-3 glass-card rounded-xl"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/40 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <button
                onClick={() => removeFile(index)}
                className="p-1.5 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
