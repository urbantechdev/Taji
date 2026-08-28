import React, { useState } from 'react';
import Markdown from 'react-markdown';
import {
  BookOpen,
  Download,
  FileText,
  FileCode,
  Copy,
  Check,
  X,
  Printer,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Search
} from 'lucide-react';
import {
  README_MARKDOWN_CONTENT,
  downloadReadmeMarkdown,
  downloadReadmePDF,
  downloadReadmeText
} from '../../utils/downloadReadme';
import ReflectionOverlay from '../common/ReflectionOverlay';

interface ReadmeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToGuide?: () => void;
}

export const ReadmeModal: React.FC<ReadmeModalProps> = ({ isOpen, onClose, onNavigateToGuide }) => {
  const [copied, setCopied] = useState(false);
  const [activeViewTab, setActiveViewTab] = useState<'formatted' | 'raw'>('formatted');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(README_MARKDOWN_CONTENT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredContent = searchQuery.trim()
    ? README_MARKDOWN_CONTENT.split('\n')
        .filter(line => line.toLowerCase().includes(searchQuery.toLowerCase()))
        .join('\n')
    : README_MARKDOWN_CONTENT;

  return (
    <div
      id="readme-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-3 sm:p-6 animate-in fade-in duration-200"
    >
      <div
        id="readme-modal-container"
        className="bg-white rounded-3xl shadow-2xl border border-rose-100 max-w-5xl w-full h-[90vh] max-h-[850px] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Header Banner with Gradient & Reflection */}
        <div className="relative bg-gradient-to-r from-rose-700 via-rose-600 to-pink-700 text-white p-5 sm:p-6 shrink-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 overflow-hidden">
          <ReflectionOverlay />

          <div className="relative z-10 space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-white/15 rounded-xl backdrop-blur-xs border border-white/20">
                <BookOpen className="w-5 h-5 text-rose-100" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  <span>Taji ERP Documentation &amp; User Manual</span>
                  <span className="text-[11px] font-mono font-black px-2 py-0.5 rounded-full bg-rose-900/60 border border-white/20 text-rose-200">
                    README.md
                  </span>
                </h3>
                <p className="text-xs text-rose-100/90 font-medium">
                  Official architecture specifications, module user guides, and compliance references.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons & Close */}
          <div className="relative z-10 flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            
            {/* Download MD Button */}
            <button
              id="readme-download-md-btn"
              onClick={() => downloadReadmeMarkdown()}
              className="px-3 py-2 bg-white text-rose-700 hover:bg-rose-50 font-bold text-xs rounded-xl shadow transition-all flex items-center gap-1.5 cursor-pointer"
              title="Download raw README.md file"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download README.md</span>
            </button>

            {/* Download PDF Button */}
            <button
              id="readme-download-pdf-btn"
              onClick={() => downloadReadmePDF()}
              className="px-3 py-2 bg-slate-900/80 hover:bg-slate-900 text-white font-bold text-xs rounded-xl border border-white/20 shadow transition-all flex items-center gap-1.5 cursor-pointer"
              title="Download formatted A4 PDF Manual"
            >
              <FileText className="w-3.5 h-3.5 text-rose-300" />
              <span>PDF Manual</span>
            </button>

            {/* Close Button */}
            <button
              id="readme-modal-close-btn"
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer ml-1"
              title="Close Documentation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar: Views & Search */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* View Mode Toggle */}
            <div className="bg-slate-200/80 p-0.5 rounded-xl flex items-center text-xs font-bold">
              <button
                onClick={() => setActiveViewTab('formatted')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeViewTab === 'formatted'
                    ? 'bg-white text-rose-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Formatted Guide
              </button>
              <button
                onClick={() => setActiveViewTab('raw')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeViewTab === 'raw'
                    ? 'bg-white text-rose-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Raw Markdown (.md)
              </button>
            </div>

            {/* Copy Markdown */}
            <button
              onClick={handleCopyMarkdown}
              className="px-3 py-1.5 bg-white border border-slate-300 hover:border-rose-400 hover:text-rose-700 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy Markdown</span>
                </>
              )}
            </button>

            {onNavigateToGuide && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateToGuide();
                }}
                className="px-3 py-1.5 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-rose-600" />
                <span>Searchable How-To Guides</span>
              </button>
            )}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search documentation..."
              className="w-full pl-8.5 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none placeholder:text-slate-400 font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
              >
                &times;
              </button>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8 bg-white min-h-0 text-slate-800 font-sans selection:bg-rose-100 selection:text-rose-900">
          {activeViewTab === 'formatted' ? (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="prose prose-slate prose-rose max-w-none text-sm leading-relaxed">
                <Markdown
                  components={{
                    h1: ({ children }) => (
                      <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 border-b border-rose-100 pb-3 mb-4 tracking-tight flex items-center gap-2">
                        <span>{children}</span>
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-8 mb-3 border-b border-slate-100 pb-2 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-rose-600 inline-block"></span>
                        <span>{children}</span>
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-base font-bold text-rose-900 mt-5 mb-2">
                        {children}
                      </h3>
                    ),
                    p: ({ children }) => (
                      <p className="text-slate-700 leading-relaxed mb-3 text-xs sm:text-sm">
                        {children}
                      </p>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc list-inside space-y-1.5 mb-4 text-slate-700 text-xs sm:text-sm pl-2">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal list-inside space-y-1.5 mb-4 text-slate-700 text-xs sm:text-sm pl-2">
                        {children}
                      </ol>
                    ),
                    li: ({ children }) => (
                      <li className="leading-relaxed">{children}</li>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-bold text-slate-900">{children}</strong>
                    ),
                    code: ({ children }) => (
                      <code className="bg-slate-100 text-rose-700 px-1.5 py-0.5 rounded text-[11px] font-mono font-bold border border-slate-200">
                        {children}
                      </code>
                    ),
                    pre: ({ children }) => (
                      <pre className="bg-slate-900 text-slate-100 p-4 rounded-2xl overflow-x-auto text-xs font-mono my-4 border border-slate-800 shadow-inner">
                        {children}
                      </pre>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-rose-500 pl-4 py-1 my-3 bg-rose-50/50 rounded-r-xl text-slate-700 italic text-xs">
                        {children}
                      </blockquote>
                    ),
                    table: ({ children }) => (
                      <div className="overflow-x-auto my-4 rounded-xl border border-slate-200 shadow-2xs">
                        <table className="min-w-full divide-y divide-slate-200 text-xs">
                          {children}
                        </table>
                      </div>
                    ),
                    thead: ({ children }) => (
                      <thead className="bg-rose-50/80 text-rose-950 font-bold">{children}</thead>
                    ),
                    th: ({ children }) => (
                      <th className="px-3.5 py-2.5 text-left font-bold border-b border-rose-100">{children}</th>
                    ),
                    td: ({ children }) => (
                      <td className="px-3.5 py-2 border-b border-slate-100 text-slate-700">{children}</td>
                    ),
                    hr: () => <hr className="my-6 border-slate-200" />
                  }}
                >
                  {filteredContent}
                </Markdown>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              <pre className="p-4 sm:p-6 bg-slate-950 text-slate-100 rounded-2xl text-xs font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto border border-slate-800 shadow-inner">
                {filteredContent}
              </pre>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3.5 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-500 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Taji Textile ERP v2026.1 • Enterprise Architecture &amp; User Manual</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => downloadReadmeText()}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold rounded-xl transition-colors cursor-pointer"
            >
              Plain Text (.txt)
            </button>
            <button
              onClick={() => downloadReadmeMarkdown()}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download README.md</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
