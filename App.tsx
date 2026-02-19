
import React, { useState, useEffect } from 'react';
import { generateArticle } from './services/geminiService';
import { ArticleData, GenerationState, HistoryItem } from './types';
import ArticlePreview from './components/ArticlePreview';
import { SEOPanel, SocialPanel } from './components/SidePanels';
import HistoryPanel from './components/HistoryPanel';
import ImageSelector from './components/ImageSelector';

const TONES = [
  { id: 'formal', label: 'Formal y objetivo', icon: 'fa-gavel' },
  { id: 'informal', label: 'Informal y conversacional', icon: 'fa-comments' },
  { id: 'analitico', label: 'Crítico y analítico', icon: 'fa-microscope' },
  { id: 'sensacionalista', label: 'Impactante / Viral', icon: 'fa-fire' },
  { id: 'urgente', label: 'URGENTE / Última hora', icon: 'fa-bolt' },
];

const App: React.FC = () => {
  const [sources, setSources] = useState<string[]>(['']);
  const [tone, setTone] = useState('formal');
  const [criticalContext, setCriticalContext] = useState('');
  const [article, setArticle] = useState<ArticleData | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [state, setState] = useState<GenerationState>('idle');
  const [error, setError] = useState<string | null>(null);

  // Load history from localStorage on startup
  useEffect(() => {
    const savedHistory = localStorage.getItem('roarnews_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Error loading history", e);
      }
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('roarnews_history', JSON.stringify(history));
  }, [history]);

  const handleSourceChange = (index: number, value: string) => {
    const newSources = [...sources];
    newSources[index] = value;
    setSources(newSources);
  };

  const addSource = () => {
    setSources([...sources, '']);
  };

  const removeSource = (index: number) => {
    if (sources.length === 1) return;
    const newSources = sources.filter((_, i) => i !== index);
    setSources(newSources);
  };

  const handleNewArticle = () => {
    setSources(['']);
    setTone('formal');
    setCriticalContext('');
    setArticle(null);
    setState('idle');
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    const validSources = sources.filter(s => s.trim().length > 0);
    if (validSources.length === 0) {
      setError("Debes ingresar al menos una fuente de información o enlace.");
      return;
    }

    setState('loading');
    setError(null);

    const selectedToneLabel = TONES.find(t => t.id === tone)?.label || tone;

    try {
      const result = await generateArticle(
        validSources, 
        selectedToneLabel, 
        tone === 'analitico' ? criticalContext : undefined
      );
      
      const newItem: ArticleData = {
        ...result,
        id: crypto.randomUUID(),
        timestamp: Date.now()
      };

      setArticle(newItem);
      setState('success');
      
      // Smooth scroll to the visual resources container
      setTimeout(() => {
        const previewElement = document.getElementById('article-controls-container');
        if (previewElement) {
          previewElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Ocurrió un error al generar el contenido.');
      setState('error');
    }
  };

  const handleImageSelect = (url: string) => {
    if (!article) return;
    setArticle({ ...article, featuredImage: url });
  };

  const handleSaveToHistory = () => {
    if (!article) return;
    
    // Check if it's already in history
    const existing = history.find(h => h.id === article.id);
    if (existing) {
      // Update existing if featuredImage changed
      if (existing.featuredImage !== article.featuredImage) {
        setHistory(prev => prev.map(h => h.id === article.id ? { ...article } as HistoryItem : h));
      }
      return;
    }

    const historyItem: HistoryItem = {
      ...article,
      id: article.id || crypto.randomUUID(),
      timestamp: article.timestamp || Date.now()
    };

    setHistory(prev => [historyItem, ...prev]);
  };

  const handleSelectHistoryItem = (item: HistoryItem) => {
    setArticle(item);
    setState('success');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteHistoryItem = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
    if (article?.id === id) {
      setArticle(null);
      setState('idle');
    }
  };

  const handleClearHistory = () => {
    if (window.confirm("¿Estás seguro de que quieres borrar todos los artículos de tu biblioteca?")) {
      setHistory([]);
      setArticle(null);
      setState('idle');
    }
  };

  const isArticleSaved = !!(article && history.some(h => h.id === article.id));

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <nav className="bg-white border-b border-slate-200 py-4 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 text-white p-2 rounded-lg">
              <i className="fa-solid fa-newspaper text-lg"></i>
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-800">Roar<span className="text-indigo-600">News</span></span>
          </div>
          
          <div className="flex items-center gap-3 sm:gap-6">
            {article && state === 'success' && (
              <button 
                onClick={handleNewArticle}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-sm font-bold transition-all shadow-md shadow-indigo-200 animate-in fade-in zoom-in duration-300"
              >
                <i className="fa-solid fa-circle-plus"></i>
                <span className="hidden sm:inline">Nuevo Artículo</span>
                <span className="sm:hidden">Nuevo</span>
              </button>
            )}
            <div className="text-slate-400 text-xs hidden lg:block font-medium uppercase tracking-widest">
              Professional Editor
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          
          {/* LEFT: Generation Form (xl:span-8) */}
          <div className="xl:col-span-8 space-y-10">
            <section className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-6 border border-slate-200">
              <form onSubmit={handleGenerate} className="space-y-8">
                <div>
                  <label className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-3 block">1. Selecciona el Tono y Estilo</label>
                  <div className="flex flex-wrap gap-2">
                    {TONES.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTone(t.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all text-sm font-medium ${
                          tone === t.id 
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200' 
                          : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:bg-indigo-50'
                        }`}
                      >
                        <i className={`fa-solid ${t.icon}`}></i>
                        {t.label}
                      </button>
                    ))}
                  </div>

                  {/* Campo de Contexto Crítico Dinámico */}
                  {tone === 'analitico' && (
                    <div className="mt-6 p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl animate-in slide-in-from-top-2 duration-300">
                      <label className="text-xs uppercase font-bold text-indigo-600 tracking-wider mb-2 block flex items-center gap-2">
                        <i className="fa-solid fa-comment-medical"></i> Contexto de la Crítica / Análisis
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Define el ángulo específico de tu análisis. ¿Qué quieres criticar o analizar específicamente en esta noticia?"
                        value={criticalContext}
                        onChange={(e) => setCriticalContext(e.target.value)}
                        className="w-full bg-white border border-indigo-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-slate-800 text-sm resize-none"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-3 block">
                    2. Fuentes de Información 
                  </label>
                  <div className="space-y-3">
                    {sources.map((source, index) => (
                      <div key={index} className="flex gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
                        <div className="flex-1 relative">
                          <textarea
                            rows={2}
                            placeholder={`Fuente ${index + 1}: Pega un enlace, URL o resumen de información...`}
                            value={source}
                            onChange={(e) => handleSourceChange(index, e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-slate-800 resize-none"
                            disabled={state === 'loading'}
                          />
                          {sources.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeSource(index)}
                              className="absolute -right-3 -top-3 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-sm"
                            >
                              <i className="fa-solid fa-xmark text-xs"></i>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <button
                    type="button"
                    onClick={addSource}
                    className="mt-4 flex items-center gap-2 text-indigo-600 font-semibold text-sm hover:text-indigo-700 transition-colors"
                    disabled={state === 'loading'}
                  >
                    <i className="fa-solid fa-circle-plus"></i>
                    Agregar otra fuente
                  </button>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <button
                    type="submit"
                    disabled={state === 'loading'}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold py-4 px-10 rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-3 w-full md:w-auto"
                  >
                    {state === 'loading' ? (
                      <>
                        <i className="fa-solid fa-circle-notch animate-spin"></i>
                        Generando...
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-wand-magic-sparkles"></i>
                        Crear Nuevo Artículo
                      </>
                    )}
                  </button>
                </div>
              </form>
            </section>

            {/* Error Message */}
            {state === 'error' && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3">
                <i className="fa-solid fa-circle-exclamation text-xl"></i>
                <p>{error}</p>
              </div>
            )}

            {/* Content Results */}
            {article && state !== 'loading' && (
              <div id="article-controls-container" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <ImageSelector 
                  queries={article.imageSearchQueries} 
                  onSelect={handleImageSelect}
                  currentImage={article.featuredImage}
                />
                
                <div id="article-preview-container">
                  <ArticlePreview 
                    data={article} 
                    onSave={handleSaveToHistory} 
                    isSaved={isArticleSaved} 
                  />
                </div>

                <div className="lg:hidden">
                   <SEOPanel seo={article.seo} />
                </div>
                <SocialPanel instagram={article.instagramSummary} micro={article.microblogSummary} />
              </div>
            )}

            {state === 'idle' && !article && (
              <div className="text-center py-20 opacity-50 bg-white rounded-2xl border border-dashed border-slate-300">
                <i className="fa-solid fa-layer-group text-6xl mb-4 text-slate-200"></i>
                <h2 className="text-xl font-semibold text-slate-400">Listo para redactar</h2>
                <p className="text-slate-400 mt-2">Completa el formulario para generar tu primera noticia inteligente.</p>
              </div>
            )}
          </div>

          {/* RIGHT: Sidebar Panels (xl:span-4) */}
          <div className="xl:col-span-4 space-y-8">
            <HistoryPanel 
              history={history} 
              onSelectItem={handleSelectHistoryItem}
              onDeleteItem={handleDeleteHistoryItem}
              onClearHistory={handleClearHistory}
              currentId={article?.id}
            />

            {article && <SEOPanel seo={article.seo} />}

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Información del Sistema</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Versión:</span>
                  <span className="font-semibold text-indigo-600">1.3</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Análisis:</span>
                  <span className="text-slate-800 font-medium">Google Search Grounding</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Imágenes:</span>
                  <span className="text-slate-800 font-medium italic text-xs">Asistente de Búsqueda</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Loading Overlay */}
      {state === 'loading' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-white p-12 rounded-[2.5rem] shadow-2xl text-center max-w-sm mx-4 border border-indigo-100">
            <div className="relative mb-8">
              <div className="w-24 h-24 border-[6px] border-indigo-50 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                 <i className="fa-solid fa-wand-magic-sparkles text-indigo-600 text-3xl animate-pulse"></i>
              </div>
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2 italic">Procesando Fuentes...</h3>
            <p className="text-slate-500 leading-relaxed text-sm">
              Analizando información y redactando tu noticia con los más altos estándares periodísticos y optimización SEO.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
