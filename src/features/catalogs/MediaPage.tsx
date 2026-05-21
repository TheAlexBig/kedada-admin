export function MediaPage() {
  return (
    <div className="rounded-lg border border-dashed border-stone-300 bg-white p-6">
      <h2 className="text-2xl font-black text-stone-950">Media / Imagenes</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
        El backend de Kedada todavia no expone endpoints para subir, listar o administrar imagenes.
        Actualmente <code>thumbnail</code> en eventos es un UUID simple. El formulario permite capturar
        ese UUID mientras se define el catalogo real de media.
      </p>
      <p className="mt-4 text-sm font-semibold text-rose-700">
        TODO backend: agregar endpoints de media antes de habilitar carga o selector visual de imagenes.
      </p>
    </div>
  );
}
