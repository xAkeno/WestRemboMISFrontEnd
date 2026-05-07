import { useNavigate } from "react-router-dom";

export function VacationModal({ vacationStart, vacationEnd, vacationName }) {
  const navigate = useNavigate();

  // Log what the modal actually receives
  console.log("[VacationModal] props →", { vacationName, vacationStart, vacationEnd });

  // Parse "YYYY-MM-DD" safely without UTC timezone shift
  const format = (dateStr) => {
    if (!dateStr) return "";
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const isSingleDay = vacationStart === vacationEnd;
  const hasName = vacationName && vacationName.trim() !== "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center">

        {/* Icon */}
        <div className="text-5xl mb-4">🌴</div>

        {/* Holiday name badge */}
        {hasName && (
          <span className="inline-block bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-3">
            {vacationName}
          </span>
        )}

        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
          Our Office is Closed
        </h2>

        <p className="text-gray-500 dark:text-gray-400 mb-5">
          {hasName
            ? `In observance of ${vacationName}, our office is temporarily closed.`
            : "Our office is currently closed. We will be back and ready to serve you soon."}
        </p>

        {/* Date range card */}
        {vacationStart && vacationEnd && (
          <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl px-6 py-4 mb-5">
            <p className="text-xs text-blue-500 dark:text-blue-400 font-semibold uppercase tracking-wider mb-1">
              {isSingleDay ? "Date" : "Period"}
            </p>
            <p className="text-blue-800 dark:text-blue-100 font-semibold text-base">
              {isSingleDay
                ? format(vacationStart)
                : `${format(vacationStart)} – ${format(vacationEnd)}`}
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