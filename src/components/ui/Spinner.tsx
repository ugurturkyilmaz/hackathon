export function Spinner({ size = 24 }: { size?: number }) {
  return (
    <div
      className="inline-block animate-spin rounded-full border-2 border-gray-300 border-t-indigo-600"
      style={{ width: size, height: size }}
      aria-label="Yükleniyor"
    />
  );
}

export function FullPageSpinner({ label = "Yükleniyor..." }: { label?: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3">
      <Spinner size={32} />
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}
