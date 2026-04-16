export function MaintenanceModal({ message }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-8 max-w-md text-center shadow-xl">
        <div className="text-4xl mb-3">🚧</div>

        <h1 className="text-xl font-bold mb-2">
          Under Maintenance
        </h1>

        <p className="text-gray-600 text-sm">
          {message}
        </p>
      </div>
    </div>
  );
}