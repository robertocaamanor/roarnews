
import React, { useState } from 'react';

interface ImageSelectorProps {
  queries: string[];
  onSelect: (url: string) => void;
  currentImage?: string;
}

const ImageSelector: React.FC<ImageSelectorProps> = ({ queries, onSelect, currentImage }) => {
  const [manualUrl, setManualUrl] = useState(currentImage || '');

  const openGoogleSearch = (query: string) => {
    const encodedQuery = encodeURIComponent(query);
    // Search on Google Images with filters for large images and news style
    const url = `https://www.google.com/search?q=${encodedQuery}&tbm=isch&tbs=isz:l`;
    window.open(url, '_blank');
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualUrl.trim()) {
      onSelect(manualUrl.trim());
    }
  };

  return (
    <section className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-8 border border-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-1">
            <i className="fa-solid fa-magnifying-glass text-indigo-500"></i> Recursos Visuales
          </h3>
          <p className="text-xs text-slate-500 font-medium">Encuentra y vincula la imagen periodística ideal.</p>
        </div>
        <div className="flex gap-2">
          <span className="text-[10px] bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full font-bold uppercase border border-indigo-100">Búsqueda Optimizada</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        {queries.map((query, index) => (
          <button 
            key={index}
            onClick={() => openGoogleSearch(query)}
            className="flex flex-col items-start p-5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-xl text-left transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:border-indigo-600 group-hover:text-white transition-all">
              <i className="fa-solid fa-arrow-up-right-from-square text-xs"></i>
            </div>
            <p className="text-xs font-bold text-slate-800 line-clamp-2 leading-relaxed mb-1">
              "{query}"
            </p>
            <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-tighter">Buscar en Google Images</span>
          </button>
        ))}
      </div>

      <div className="pt-8 border-t border-slate-100">
        <form onSubmit={handleUrlSubmit} className="space-y-4">
          <label className="text-xs uppercase font-bold text-slate-500 tracking-wider flex items-center gap-2">
            <i className="fa-solid fa-link"></i> Vincular Imagen Seleccionada
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input 
              type="url" 
              placeholder="Pega aquí la URL de la imagen (ej: https://sitio.com/foto.jpg)..."
              value={manualUrl}
              onChange={(e) => setManualUrl(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-slate-800 text-sm"
            />
            <button 
              type="submit"
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-md active:scale-95 text-sm"
            >
              Establecer Imagen
            </button>
          </div>
          <p className="text-[10px] text-slate-400 italic">
            * Haz clic derecho en la imagen de Google y selecciona "Copiar dirección de la imagen" para obtener la URL directa.
          </p>
        </form>
      </div>

      {currentImage && (
        <div className="mt-8 flex items-center gap-4 p-4 bg-green-50 border border-green-100 rounded-xl">
          <div className="w-16 h-12 rounded-lg overflow-hidden border border-green-200 flex-shrink-0">
             <img src={currentImage} alt="Preview" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-green-700">Imagen vinculada con éxito</p>
            <p className="text-[10px] text-green-600 truncate max-w-[200px]">{currentImage}</p>
          </div>
          <button 
            onClick={() => { setManualUrl(''); onSelect(''); }}
            className="text-red-500 hover:text-red-700 p-2"
          >
            <i className="fa-solid fa-trash-can"></i>
          </button>
        </div>
      )}
    </section>
  );
};

export default ImageSelector;
