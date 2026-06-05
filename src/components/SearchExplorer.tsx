import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store';
import { Link, useSearchParams } from 'react-router-dom';
import { Zap, Box, Compass, Sparkles, ArrowRight } from 'lucide-react';
import AIGenerationBlock from './AIGenerationBlock';
import {
  ApiRequestError,
  createAiSearchDraft,
  fetchSearchScope,
  fetchSearchResults,
  type AiResult,
  type ImportBatch,
  type SearchDraftScopeError,
} from '../api';
import type { GraphNode } from '../types';

export default function SearchExplorer() {
  const { addSearchHistory } = useAppStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const rawQuery = searchParams.get('q') || '';
  const query = rawQuery.trim().toLowerCase();
  const [apiResults, setApiResults] = useState<GraphNode[] | null>(null);
  const [aiInterpretation, setAiInterpretation] = useState<AiResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [draftBatch, setDraftBatch] = useState<ImportBatch | null>(null);
  const [isCreatingDraft, setIsCreatingDraft] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [scopeNotice, setScopeNotice] = useState<SearchDraftScopeError | null>(null);
  const [autoDraftQuery, setAutoDraftQuery] = useState<string | null>(null);

  const results = apiResults ?? [];

  useEffect(() => {
    let cancelled = false;
    setApiResults(null);
    setAiInterpretation(null);
    setSearchError(null);
    setDraftBatch(null);
    setDraftError(null);
    setScopeNotice(null);
    setAutoDraftQuery(null);

    if (!rawQuery.trim()) {
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    void fetchSearchResults(rawQuery).then((response) => {
      if (cancelled) return;
      setApiResults(response.items);
      setAiInterpretation(response.aiInterpretation ?? null);
      addSearchHistory(response.query);
      if (response.items.length === 0) {
        void fetchSearchScope(rawQuery).then((scope) => {
          if (cancelled) return;
          if (scope.eligible === false) {
            setScopeNotice(scope);
            return;
          }
          if (scope.reason === 'ai_related') {
            void createDraft(rawQuery, true);
          }
        }).catch(() => undefined);
      }
    }).catch((error) => {
      if (!cancelled) setSearchError(error instanceof Error ? error.message : 'Backend search request failed.');
    }).finally(() => {
      if (!cancelled) setIsSearching(false);
    });

    return () => {
      cancelled = true;
    };
  }, [rawQuery, addSearchHistory]);

  const createDraft = async (queryText: string, automatic = false) => {
    if (!queryText.trim()) return;
    if (automatic && autoDraftQuery === queryText.trim()) return;
    if (automatic) setAutoDraftQuery(queryText.trim());

    setIsCreatingDraft(true);
    setDraftError(null);
    try {
      const response = await createAiSearchDraft(queryText);
      setDraftBatch(response.batch);
    } catch (error) {
      if (error instanceof ApiRequestError && isSearchDraftScopeError(error.data)) {
        setScopeNotice(error.data);
        setDraftError(null);
      } else {
        setDraftError(error instanceof Error ? error.message : 'AI draft request failed.');
      }
    } finally {
      setIsCreatingDraft(false);
    }
  };

  const handleCreateDraft = async () => {
    if (!rawQuery.trim() || isCreatingDraft) return;
    await createDraft(rawQuery);
  };

  const exampleQueries = scopeNotice?.suggestions?.length ? scopeNotice.suggestions : ['OpenAI', 'Transformer', 'Claude', 'RAG'];
  const showOutOfScope = results.length === 0 && !isSearching && scopeNotice?.reason === 'out_of_scope';
  const showProviderUnavailable = results.length === 0 && !isSearching && scopeNotice?.reason === 'provider_unavailable';

  return (
    <div className="w-full h-full pt-14 flex overflow-hidden grid-bg">
      
      {/* Left Sidebar - Result Type Filters (UI only for MVP) */}
      <div className="w-64 border-r border-gray-200 bg-white/50 backdrop-blur-sm p-6 hidden md:block overflow-y-auto">
        <h3 className="font-mono text-[10px] uppercase tracking-widest text-gray-500 mb-6">Filter Results</h3>
        <div className="space-y-2">
          <button className="block w-full text-left font-sans text-sm text-black font-medium border-l-2 border-black pl-3 py-1">All Results ({results.length})</button>
          <button className="block w-full text-left font-sans text-sm text-gray-500 hover:text-black border-l-2 border-transparent hover:border-gray-300 pl-3 py-1">Companies</button>
          <button className="block w-full text-left font-sans text-sm text-gray-500 hover:text-black border-l-2 border-transparent hover:border-gray-300 pl-3 py-1">Products</button>
          <button className="block w-full text-left font-sans text-sm text-gray-500 hover:text-black border-l-2 border-transparent hover:border-gray-300 pl-3 py-1">Models</button>
        </div>
      </div>

      {/* Main Results Area */}
      <div className="flex-1 overflow-y-auto p-6 md:p-12">
        <div className="max-w-3xl">
          <div className="mb-10">
            <h1 className="font-serif text-4xl mb-2">Search Results</h1>
            <p className="font-mono text-xs uppercase tracking-widest text-gray-500">
              Query: [{rawQuery || 'None'}] // {results.length} records found
              {isSearching ? ' // syncing backend index' : ''}
            </p>
          </div>

          {!query ? (
             <div className="border border-gray-200 p-12 text-center bg-white">
                <Compass className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="font-serif text-2xl mb-2 text-gray-400">Search the Universe</h3>
                <p className="font-sans text-gray-500">Enter a query above to explore entities, people, and technologies.</p>
             </div>
          ) : searchError ? (
             <div className="border border-red-200 p-12 text-center bg-white">
                <Box className="w-12 h-12 text-red-200 mx-auto mb-4" />
                <h3 className="font-serif text-2xl mb-2">Backend Index Offline</h3>
                <p className="font-sans text-gray-500 mb-3">Search now depends on the real backend graph index. Start `npm.cmd run dev:api` and retry.</p>
                <p className="font-mono text-[10px] uppercase tracking-widest text-gray-400 break-all">{searchError}</p>
             </div>
          ) : showOutOfScope ? (
             <div className="border border-gray-200 p-8 md:p-12 text-center bg-white">
                <Box className="size-12 text-gray-300 mx-auto mb-4" />
                <h3 className="font-serif text-2xl mb-2 text-balance">这个关键词不在当前知识图谱范围内</h3>
                <p className="font-sans text-gray-500 text-pretty max-w-xl mx-auto">
                  OpenConstellation 当前聚焦 AI 生态。请尝试搜索 AI 公司、模型、产品、技术、论文、人物或开源项目，例如 OpenAI、Transformer、Claude、RAG。
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                  {exampleQueries.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setSearchParams({ q: item })}
                      className="min-h-9 border border-gray-200 bg-white px-3 py-1.5 font-mono text-[10px] uppercase text-black hover:border-black"
                    >
                      {item}
                    </button>
                  ))}
                </div>
             </div>
          ) : showProviderUnavailable ? (
             <div className="border border-amber-200 p-8 md:p-12 text-center bg-white">
                <Box className="size-12 text-amber-300 mx-auto mb-4" />
                <h3 className="font-serif text-2xl mb-2 text-balance">当前无法确认该关键词是否适合加入图谱</h3>
                <p className="font-sans text-gray-500 text-pretty max-w-xl mx-auto">
                  请换一个 AI 相关关键词，或稍后重试 AI 判断。系统不会把未经确认的关键词写入主图谱。
                </p>
                <p className="mt-4 font-mono text-[10px] uppercase text-gray-400 break-all">{scopeNotice?.message}</p>
             </div>
          ) : results.length === 0 && !isSearching ? (
             <div className="border border-gray-200 p-8 md:p-12 text-center bg-white">
                <Box className="size-12 text-gray-300 mx-auto mb-4" />
                <h3 className="font-serif text-2xl mb-2 text-balance">
                  {isCreatingDraft ? 'Generating AI Draft' : draftBatch ? 'AI Draft Ready for Review' : 'No Curated Match Yet'}
                </h3>
                <p className="font-sans text-gray-500 text-pretty max-w-xl mx-auto">
                  {draftBatch
                    ? 'This AI-related keyword is not in the curated graph yet. A structured draft has been sent to the review queue before it becomes graph data.'
                    : isCreatingDraft
                      ? 'This AI-related keyword is not in the curated graph yet. The system is calling AI to prepare a structured draft for review.'
                      : 'No curated entities match this query yet. Generate a structured AI draft only if this belongs in the AI ecosystem, then send it to the review queue before it becomes graph data.'}
                </p>
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleCreateDraft}
                    disabled={isCreatingDraft || Boolean(draftBatch)}
                    className="inline-flex min-h-10 items-center justify-center gap-2 border border-black bg-black px-5 py-2 font-mono text-[10px] uppercase text-white disabled:cursor-not-allowed disabled:border-gray-300 disabled:bg-gray-300"
                  >
                    <Sparkles className="size-3.5" />
                    {isCreatingDraft ? 'Drafting' : draftBatch ? 'Draft Queued' : 'Generate Draft'}
                  </button>
                  {draftBatch ? (
                    <Link
                      to="/review"
                      className="inline-flex min-h-10 items-center justify-center gap-2 border border-gray-200 bg-white px-5 py-2 font-mono text-[10px] uppercase text-black hover:border-black"
                    >
                      Review Queue
                      <ArrowRight className="size-3.5" />
                    </Link>
                  ) : null}
                </div>
                {draftBatch ? (
                  <p className="mt-4 font-mono text-[10px] uppercase text-gray-500">
                    Batch {draftBatch.id} created with {draftBatch.nodes.length} node and {draftBatch.edges.length} edge drafts.
                  </p>
                ) : null}
                {draftError ? (
                  <p className="mt-4 font-mono text-[10px] uppercase text-red-500 break-all">{draftError}</p>
                ) : null}
             </div>
          ) : results.length === 0 ? (
             <div className="border border-gray-200 p-12 text-center bg-white">
                <Compass className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="font-serif text-2xl mb-2 text-gray-400">Synchronizing Index</h3>
                <p className="font-sans text-gray-500">Querying the backend graph and AI interpretation service.</p>
             </div>
          ) : (
            <div className="space-y-6">
              {results.map(r => (
                <div key={r.id} className="block border border-white/50 bg-white/30 backdrop-blur-xl p-8 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.03)] hover:shadow-[0_16px_48px_rgba(0,0,0,0.06)] hover:bg-white/50 hover:border-white/80 transition-all duration-500 group relative overflow-hidden">
                  {/* Subtle cosmic glow effect inside the card */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-100/30 to-purple-50/10 rounded-full blur-3xl -z-10 group-hover:opacity-100 opacity-40 transition-opacity duration-500 pointer-events-none"></div>

                  <Link to={`/node/${r.id}`} className="block z-10 relative">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-3 gap-3">
                      <h2 className="font-serif text-2xl md:text-3xl font-medium text-black drop-shadow-sm group-hover:text-indigo-950 transition-colors md:pr-28 break-words">{r.name}</h2>
                      <span className="font-mono text-[10px] uppercase tracking-widest bg-white/60 backdrop-blur-md border border-white/50 shadow-sm rounded-full px-3 py-1.5 text-gray-700 font-medium self-start">{r.type}</span>
                    </div>
                    <p className="font-sans text-base text-gray-600 mb-6 max-w-2xl leading-relaxed">{r.subtitle}</p>
                    <div className="flex items-center gap-3">
                      {r.tags.slice(0,3).map(t => (
                        <span key={t} className="font-mono text-[10px] uppercase tracking-widest text-gray-500 bg-white/40 px-3 py-1.5 rounded-full border border-white/60 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
                          #{t}
                        </span>
                      ))}
                    </div>
                  </Link>
                  <div className="md:absolute static mt-6 md:mt-0 flex justify-end bottom-8 right-8 md:top-8 md:bottom-auto opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-500 transform md:translate-y-2 md:group-hover:translate-y-0 z-20">
                    <Link 
                      to="/explore" 
                      onClick={() => useAppStore.getState().setSelectedNodeId(r.id)}
                      className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] border border-gray-200 md:border-white/80 bg-white/80 backdrop-blur-md shadow-sm md:shadow-lg rounded-full px-5 py-2.5 hover:scale-105 hover:bg-white text-black transition-all"
                    >
                      <Compass className="w-3.5 h-3.5" />
                      Locate Map
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar - AI Interpretation */}
      <div className="w-80 border-l border-gray-200 bg-gray-50 p-6 hidden lg:block overflow-y-auto">
        <div className="sticky top-0">
          
          {query ? (
             <div className="space-y-6">
               <AIGenerationBlock 
                 content={aiInterpretation?.content || `The concept of "${query}" appears frequently within foundational layers of the model ecosystem. Entities returning in this cluster generally represent high-visibility infrastructure or primary application interfaces.`}
                 confidence={aiInterpretation?.confidence || 0.92}
                 label={aiInterpretation?.provider === 'deepseek' ? 'DeepSeek Cluster Synthesis' : 'Cluster Synthesis'}
               />
              <div className="border border-gray-200 p-4 bg-white mt-6">
                <h4 className="font-serif italic text-sm text-gray-500 mb-3">Suggested Exploration Vectors</h4>
                <ul className="space-y-2 font-sans text-sm">
                  {(aiInterpretation?.suggestions?.length ? aiInterpretation.suggestions : [
                    'Trace structural derivations to Tech Tree branches.',
                    'Observe parallel competitor topologies.',
                  ]).slice(0, 3).map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="text-gray-400 mt-0.5">·</span>
                      <span>{item.includes('Tech Tree') ? <><Link to="/tech" className="underline">Tech Tree</Link> branches reveal the structural derivations.</> : item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 mb-4">
                 <Zap className="w-4 h-4 text-gray-400" />
                 <h3 className="font-mono text-[10px] uppercase tracking-widest font-medium text-gray-400">AI Interpretation</h3>
              </div>
              <p className="font-sans text-sm text-gray-500 italic">
                Awaiting query coordinates to begin synthesis...
              </p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

function isSearchDraftScopeError(value: unknown): value is SearchDraftScopeError {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<SearchDraftScopeError>;
  return candidate.eligible === false && (candidate.reason === 'out_of_scope' || candidate.reason === 'provider_unavailable');
}
