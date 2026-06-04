import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import TopNav from './components/TopNav';
import GraphExplorer from './components/GraphExplorer';
import Timeline from './components/Timeline';
import TechTree from './components/TechTree';
import Saved from './components/Saved';
import About from './components/About';
import NodeProfile from './components/NodeProfile';
import ReviewPanel from './components/ReviewPanel';
import SearchExplorer from './components/SearchExplorer';
import { useAppStore } from './store';

export default function App() {
  const loadGraphFromApi = useAppStore((state) => state.loadGraphFromApi);

  useEffect(() => {
    void loadGraphFromApi();
  }, [loadGraphFromApi]);

  return (
    <BrowserRouter>
      <div className="w-screen h-dvh flex flex-col bg-transparent overflow-hidden">
        <TopNav />
        <main className="flex-1 relative overflow-hidden">
          <Routes>
            <Route path="/" element={<GraphExplorer />} />
            <Route path="/explore" element={<GraphExplorer />} />
            <Route path="/node/:id" element={<NodeProfile />} />
            <Route path="/search" element={<SearchExplorer />} />
            <Route path="/timeline" element={<Timeline />} />
            <Route path="/tech" element={<TechTree />} />
            <Route path="/saved" element={<Saved />} />
            <Route path="/review" element={<ReviewPanel />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
