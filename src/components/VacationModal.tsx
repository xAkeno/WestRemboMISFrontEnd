import { useNavigate } from "react-router-dom";

export function VacationModal({ vacationStart, vacationEnd }) {
  const navigate = useNavigate();
  
  const format = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center">
        <div className="text-5xl mb-4">🌴</div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
          We're on Vacation!
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          Our office is currently closed for vacation leave. We will be back and
          ready to serve you soon.
        </p>
        {vacationStart && vacationEnd && (
          <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl px-6 py-4 mb-4">
            <p className="text-sm text-blue-600 dark:text-blue-300 font-medium">
              Vacation Period
            </p>
            <p className="text-blue-800 dark:text-blue-100 font-semibold mt-1">
              {format(vacationStart)} – {format(vacationEnd)}
            </p>
          </div>
        )}
        <p className="text-sm text-gray-400 dark:text-gray-500 mb-6">
          Thank you for your patience and understanding.
        </p>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors duration-200"
        >
          ← Go Back
        </button>
      </div>
    </div>
  );
}