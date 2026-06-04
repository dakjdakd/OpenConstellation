import React from 'react';
import UniverseMap from './UniverseMap';
import DetailDrawer from './DetailDrawer';
import FilterPanel from './FilterPanel';
import SearchBar from './SearchBar';
import LandingScreen from './LandingScreen';
import GeneratingScreen from './GeneratingScreen';
import { useAppStore } from '../store';

export default function GraphExplorer() {
  const { filteredNodes, filteredEdges, appState } = useAppStore();

  return (
    <>
      {appState === 'landing' && (
        <div className="fixed inset-0 z-50 bg-white">
          <LandingScreen />
        </div>
      )}
      
      {appState === 'generating' && (
        <div className="fixed inset-0 z-50 bg-black">
          <GeneratingScreen />
        </div>
      )}

      <div className="relative w-full h-full bg-white overflow-hidden">
      
      {/* Isolation Overlay - removed to keep background identical to original */}
      <div className={`absolute inset-0 pointer-events-none z-10 transition-colors duration-700 bg-transparent`} />
      
      {/* Vignette effect */}
      <div className="absolute inset-0 pointer-events-none z-10 shadow-[inset_0_0_150px_rgba(0,0,0,0.08)]" />

      {/* Title Overlay with Glassmorphism Inner Border */}
      <div className="absolute top-16 md:top-20 left-1/2 -translate-x-1/2 z-20 px-4 md:px-5 py-2 md:py-2.5 rounded-3xl md:rounded-full bg-white/70 backdrop-blur-md border border-white/50 shadow-[0_4px_24px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.8)] transition-all duration-500 flex flex-col md:flex-row items-center gap-3 md:gap-6 w-[95%] md:w-auto">
        <h1 className="font-serif text-lg md:text-2xl font-bold tracking-tight text-black opacity-90 drop-shadow-sm pointer-events-none select-none md:pl-3 whitespace-nowrap mt-1 md:mt-0">
          Atlas of Intelligence
        </h1>
        <div className="h-8 w-px bg-gray-300 hidden md:block"></div>
        <div className="w-full md:w-auto mt-1 md:mt-0">
          <SearchBar />
        </div>
      </div>

      {/* The main interactive map */}
      <div className="absolute inset-0 z-10">
        <UniverseMap />
      </div>

      {/* UI Panels */}
      <FilterPanel />
      <DetailDrawer />
      
      {/* Footer Meta */}
      <div className="absolute bottom-4 left-6 z-20 font-mono text-[10px] uppercase tracking-widest text-gray-500 hidden md:block">
        <p>Vol. 1 — Epoch {new Date().getFullYear()}</p>
        <p className="mt-1 opacity-70">Data Last Synchronized: <span className="text-black">2024-05-15 08:30 UTC</span></p>
      </div>
      
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col md:flex-row items-center gap-4 w-full md:w-auto px-4 md:px-0 pointer-events-none">
        {useAppStore().isolatedNodeId && (
          <div className="bg-black text-white px-3 py-1.5 shadow-sm font-mono text-[10px] uppercase tracking-widest flex items-center gap-2 cursor-pointer hover:bg-gray-800 transition-colors pointer-events-auto" onClick={() => useAppStore.getState().setIsolatedNodeId(null)}>
            <span>Exit Focus</span>
            <span className="opacity-50">ESC</span>
          </div>
        )}
        <div className="font-mono text-[10px] uppercase tracking-widest text-gray-700 bg-white/90 px-4 py-2 border border-black/10 flex flex-wrap justify-center items-center gap-2 md:gap-4 backdrop-blur-md shadow-lg rounded-full pointer-events-auto max-w-full">
          <span className="hidden md:inline font-medium shrink-0">Map State:</span>
          {useAppStore().activeFilterType && <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded whitespace-nowrap">{useAppStore().activeFilterType}</span>}
          {useAppStore().activeRelationFilter && <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded whitespace-nowrap">{useAppStore().activeRelationFilter}</span>}
          {useAppStore().activePopularityFilter && <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded whitespace-nowrap">{useAppStore().activePopularityFilter}</span>}
          {useAppStore().activeCategoryFilter && <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded whitespace-nowrap">{useAppStore().activeCategoryFilter}</span>}
          {!useAppStore().activeFilterType && !useAppStore().activeRelationFilter && !useAppStore().activePopularityFilter && !useAppStore().activeCategoryFilter && <span className="text-gray-400 whitespace-nowrap">Default View</span>}
          <div className="w-px h-3 bg-gray-300 mx-1 hidden md:block"></div>
          <div className="flex gap-2 items-center whitespace-nowrap">
            <span className="font-medium">{filteredNodes.length} Nodes</span>
            <span className="opacity-50">·</span>
            <span className="font-medium">{filteredEdges.length} Edges</span>
          </div>
        </div>
      </div>
     </div>
    </>
  );
}
