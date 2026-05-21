export function LoadingState({ label = 'Cargando...' }: { label?: string }) {
  return (
    <div className="grid min-h-52 place-items-center rounded-lg border border-dashed border-stone-300 bg-white/80 p-8 text-center">
      <div>
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-rose-200 border-t-rose-600" />
        <p className="text-sm font-medium text-stone-700">{label}</p>
      </div>
    </div>
  );
}
