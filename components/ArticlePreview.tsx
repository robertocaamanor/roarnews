
import React, { useState } from 'react';
import { ArticleData } from '../types';

interface ArticlePreviewProps {
  data: ArticleData;
  onSave?: () => void;
  isSaved?: boolean;
}

const ArticlePreview: React.FC<ArticlePreviewProps> = ({ data, onSave, isSaved }) => {
  const [copied, setCopied] = useState(false);

  const wordCount = data.body.trim().split(/\s+/).length;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(data.body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderContent = (text: string) => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let currentList: React.ReactNode[] = [];

    const flushList = (key: number) => {
      if (currentList.length > 0) {
        elements.push(
          <ul key={`list-${key}`} className="list-disc ml-8 mb-10 space-y-4 text-slate-700 text-lg md:text-xl leading-relaxed">
            {currentList}
          </ul>
        );
        currentList = [];
      }
    };

    lines.forEach((line, idx) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) {
        flushList(idx);
        elements.push(<div key={`br-${idx}`} className="h-8" aria-hidden="true" />); 
        return;
      }

      if (trimmedLine.startsWith('## ') || (trimmedLine.startsWith('##') && !trimmedLine.startsWith('###'))) {
        flushList(idx);
        const content = trimmedLine.replace(/^##\s?/, '');
        elements.push(
          <div key={idx} className="group mt-16 mb-8">
            <h2 className="serif text-3xl md:text-4xl font-bold text-slate-900 border-l-[6px] border-indigo-600 pl-6 py-2 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl leading-tight">
              {content}
            </h2>
          </div>
        );
      } else if (trimmedLine.startsWith('### ')) {
        flushList(idx);
        const content = trimmedLine.replace(/^###\s?/, '');
        elements.push(
          <div key={idx} className="mt-12 mb-6 flex items-center gap-4">
            <span className="flex-shrink-0 w-3 h-3 bg-indigo-600 rounded-sm rotate-45"></span>
            <h3 className="serif text-2xl md:text-3xl font-bold text-slate-800 leading-tight tracking-tight">
              {content}
            </h3>
          </div>
        );
      } else if (trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ')) {
        const content = trimmedLine.substring(2);
        currentList.push(
          <li key={`li-${idx}`} className="leading-relaxed pl-2 text-slate-700">
            {renderBoldText(content)}
          </li>
        );
      } else {
        flushList(idx);
        elements.push(
          <p key={idx} className="mb-8 text-lg md:text-xl leading-[1.85] text-slate-700 font-normal whitespace-pre-wrap">
            {renderBoldText(trimmedLine)}
          </p>
        );
      }
    });

    flushList(lines.length);
    return elements;
  };

  const renderBoldText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold text-slate-950">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="bg-white p-6 md:p-20 rounded-2xl shadow-2xl border border-slate-100 ring-1 ring-slate-200/50 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-3 bg-indigo-600"></div>

      <header className="mb-16 border-b border-slate-100 pb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3 text-indigo-600 font-bold text-xs tracking-[0.25em] uppercase">
              <span className={`flex h-2 w-2 rounded-full ${isSaved ? 'bg-green-500' : 'bg-indigo-600 animate-pulse'}`}></span>
              <span>{isSaved ? 'Artículo Guardado' : 'Edición Final Preparada'}</span>
            </div>
            <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">
              Extensión: <span className={wordCount >= 350 && wordCount <= 600 ? 'text-green-500' : 'text-orange-500'}>{wordCount} palabras</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={onSave}
              disabled={isSaved}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all transform hover:scale-105 ${
                isSaved ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100'
              }`}
            >
              <i className={`fa-solid ${isSaved ? 'fa-circle-check' : 'fa-bookmark'}`}></i>
              {isSaved ? 'En Biblioteca' : 'Guardar'}
            </button>
            <button 
              onClick={copyToClipboard}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all transform hover:scale-105 ${
                copied ? 'bg-green-600 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'
              }`}
            >
              <i className={`fa-solid ${copied ? 'fa-check' : 'fa-copy'}`}></i>
              {copied ? '¡Copiado!' : 'Copiar'}
            </button>
          </div>
        </div>

        <h1 className="serif text-4xl md:text-7xl font-black leading-[1.1] text-slate-900 mb-10 tracking-tight">
          {data.title}
        </h1>
        
        {data.featuredImage && (
          <div className="mb-12 rounded-[2rem] overflow-hidden shadow-2xl border-8 border-slate-50 rotate-[-1deg] hover:rotate-0 transition-transform duration-700">
            <img 
              src={data.featuredImage} 
              alt={data.title} 
              className="w-full h-auto object-cover max-h-[500px]"
            />
          </div>
        )}

        <p className="text-xl md:text-2xl text-slate-500 font-medium leading-relaxed italic border-l-4 border-indigo-500 pl-8 py-3 bg-slate-50/50 rounded-r-2xl">
          {data.subtitle}
        </p>
      </header>
      
      <div className="max-w-none article-body selection:bg-indigo-100">
        {renderContent(data.body)}
      </div>

      {/* Grounding Sources Section */}
      {data.groundingSources && data.groundingSources.length > 0 && (
        <div className="mt-16 p-6 bg-slate-50 rounded-2xl border border-slate-200">
          <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <i className="fa-solid fa-shield-check text-green-600"></i> Fuentes Verificadas por IA
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.groundingSources.map((source, i) => (
              source.web && (
                <a 
                  key={i} 
                  href={source.web.uri} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200 hover:border-indigo-300 hover:shadow-sm transition-all group"
                >
                  <i className="fa-solid fa-link text-slate-300 group-hover:text-indigo-500"></i>
                  <span className="text-xs font-medium text-slate-600 truncate">{source.web.title || source.web.uri}</span>
                </a>
              )
            ))}
          </div>
        </div>
      )}
      
      <footer className="mt-24 pt-12 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-8 text-slate-400 text-sm">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
            <i className="fa-solid fa-wand-magic-sparkles text-indigo-400"></i>
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-slate-500">RoarNews Pro AI</span>
            <span>Verificado con Google Search Grounding</span>
          </div>
        </div>
        <div className="flex gap-10 text-2xl">
          <button className="hover:text-slate-900 transition-colors"><i className="fa-brands fa-x-twitter"></i></button>
          <button className="hover:text-blue-700 transition-colors"><i className="fa-brands fa-linkedin-in"></i></button>
          <button className="hover:text-indigo-600 transition-colors"><i className="fa-solid fa-link"></i></button>
        </div>
      </footer>
    </div>
  );
};

export default ArticlePreview;
