
import React, { useState } from 'react';
import { SEOParams } from '../types';

export const SEOPanel: React.FC<{ seo: SEOParams }> = ({ seo }) => {
  const [titleCopied, setTitleCopied] = useState(false);
  const [slugCopied, setSlugCopied] = useState(false);
  const [descCopied, setDescCopied] = useState(false);

  const copyField = (text: string, setter: (val: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  return (
    <div className="bg-slate-900 text-white p-6 rounded-xl shadow-lg h-fit sticky top-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <i className="fa-solid fa-magnifying-glass text-blue-400"></i> Parámetros SEO
        </h2>
      </div>

      <div className="mb-6 bg-green-500/10 border border-green-500/20 p-3 rounded-lg flex items-center gap-3">
        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
        <span className="text-xs font-bold text-green-400 uppercase tracking-tighter">Optimizado para Yoast Readability</span>
      </div>
      
      <div className="space-y-6">
        {/* Title Tag */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">SEO Title Tag</label>
            <button 
              onClick={() => copyField(seo.titleTag, setTitleCopied)}
              className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold uppercase transition-colors"
            >
              {titleCopied ? '¡Copiado!' : 'Copiar'}
            </button>
          </div>
          <p className="mt-1 text-slate-200 text-sm leading-relaxed bg-slate-800/50 p-3 rounded border border-slate-700">
            {seo.titleTag}
          </p>
        </div>

        {/* Slug */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">Slug Amigable (URL)</label>
            <button 
              onClick={() => copyField(seo.slug, setSlugCopied)}
              className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold uppercase transition-colors"
            >
              {slugCopied ? '¡Copiado!' : 'Copiar'}
            </button>
          </div>
          <div className="flex items-center gap-2 bg-slate-800/50 p-3 rounded border border-slate-700 font-mono text-xs">
            <i className="fa-solid fa-link text-slate-500"></i>
            <span className="text-indigo-300 truncate">{seo.slug}</span>
          </div>
        </div>
        
        {/* Meta Description */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">Meta Description</label>
            <button 
              onClick={() => copyField(seo.metaDescription, setDescCopied)}
              className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold uppercase transition-colors"
            >
              {descCopied ? '¡Copiado!' : 'Copiar'}
            </button>
          </div>
          <p className="mt-1 text-slate-200 text-sm leading-relaxed bg-slate-800/50 p-3 rounded border border-slate-700">
            {seo.metaDescription}
          </p>
        </div>
        
        {/* Keywords */}
        <div>
          <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">Palabras Clave</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {seo.keywords.map((kw, i) => (
              <span key={i} className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded border border-blue-500/30">
                {kw}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const SocialPanel: React.FC<{ instagram: string[], micro: string }> = ({ instagram, micro }) => {
  const [copiedType, setCopiedType] = useState<string | null>(null);

  const copy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Instagram */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2 text-pink-600">
            <i className="fa-brands fa-instagram text-xl"></i> Resumen Instagram
          </h3>
          <button 
            onClick={() => copy(instagram.join('\n\n'), 'ig')}
            className="text-xs bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded transition-colors"
          >
            {copiedType === 'ig' ? 'Copiado' : 'Copiar'}
          </button>
        </div>
        <div className="space-y-3">
          {instagram.map((p, i) => (
            <p key={i} className="text-slate-700 text-sm leading-relaxed italic bg-slate-50 p-3 rounded">{p}</p>
          ))}
        </div>
      </div>

      {/* Threads/Bluesky */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2 text-slate-800">
            <i className="fa-solid fa-at text-xl"></i> Threads / Bluesky
          </h3>
          <div className="flex items-center gap-4">
            <span className={`text-[10px] font-bold ${micro.length > 300 ? 'text-red-500' : 'text-slate-400'}`}>
              {micro.length}/300
            </span>
            <button 
              onClick={() => copy(micro, 'micro')}
              className="text-xs bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded transition-colors"
            >
              {copiedType === 'micro' ? 'Copiado' : 'Copiar'}
            </button>
          </div>
        </div>
        <p className="text-slate-700 text-sm leading-relaxed font-medium bg-slate-50 p-4 rounded border-l-4 border-slate-800">
          {micro}
        </p>
      </div>
    </div>
  );
};
