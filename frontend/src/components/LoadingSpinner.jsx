export default function LoadingSpinner({ message = 'Processing...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-primary-200 dark:border-primary-900"></div>
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary-600 animate-spin"></div>
      </div>
      <p className="mt-4 text-gray-600 dark:text-gray-300 font-medium">{message}</p>
      <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">This may take a moment</p>
    </div>
  );
}
