export default function Footer() {
  return (
    <footer className="mt-auto py-8 text-center text-sm text-gray-500 dark:text-gray-400">
      <p>&copy; {new Date().getFullYear()} AI Resume Screener. Built with React, FastAPI & Groq AI.</p>
    </footer>
  );
}
