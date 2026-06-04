import React from 'react';
import { Hexagon, Globe2, Network, Shield, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function About() {
  return (
    <div className="w-full h-full pt-20 pb-20 px-6 overflow-y-auto grid-bg relative">
      <div className="max-w-4xl mx-auto mt-12 relative z-10 space-y-16">
        
        <header className="border-b border-gray-200 pb-12">
          <div className="flex items-center gap-3 mb-6">
            <Hexagon className="w-8 h-8 text-black shrink-0" strokeWidth={1.5} />
            <h1 className="font-serif text-3xl md:text-5xl font-bold tracking-tight text-black break-words">OpenConstellation</h1>
          </div>
          <p className="font-sans text-xl md:text-2xl text-gray-700 leading-relaxed font-light mb-6">
            Explore the AI Universe.
          </p>
          <p className="font-sans text-base md:text-lg text-gray-500 max-w-2xl leading-relaxed">
            A macroscopic map of the artificial intelligence universe. We connect companies, models, people, and research to reveal the invisible structures of the intelligence era.
          </p>
        </header>

        <section className="space-y-6">
          <h2 className="font-mono text-sm uppercase tracking-widest text-black flex items-center gap-2">
            <Globe2 className="w-4 h-4" /> Vision
          </h2>
          <div className="font-sans text-base text-gray-700 space-y-4 leading-relaxed max-w-3xl">
            <p>
              In the rapidly evolving landscape of AI, it is difficult to see the forest for the trees. New models, companies, and technologies launch daily, but their relationships, from who builds on what to who competes with whom, are often scattered across news articles, academic papers, and source code.
            </p>
            <p>
              <strong>OpenConstellation</strong> is designed not as a simple database or list, but as a living, explorable map. By representing the AI ecosystem as a network of nodes and edges, we allow researchers, investors, and builders to intuitively explore connections that would otherwise remain hidden.
            </p>
          </div>
        </section>

        <section className="space-y-6 border-t border-gray-200 pt-12">
          <h2 className="font-mono text-sm uppercase tracking-widest text-black flex items-center gap-2">
            <Network className="w-4 h-4" /> Data Sources & Methodology
          </h2>
          <div className="font-sans text-base text-gray-700 space-y-6 leading-relaxed max-w-3xl">
            <p>
              The intelligence within OpenConstellation is backed by a curated public-source graph served from the backend. Each production graph entity carries source URLs, while AI synthesis is used as an assistive layer for interpretation, learning paths, and completion drafts.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white border border-gray-200 p-6 shadow-sm">
                <h3 className="font-mono text-xs uppercase tracking-widest font-medium mb-3">Primary Sources</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2"><ArrowRight className="w-4 h-4 mt-0.5 text-gray-400" /> Official press & blogs</li>
                  <li className="flex items-start gap-2"><ArrowRight className="w-4 h-4 mt-0.5 text-gray-400" /> Academic repositories (arXiv)</li>
                  <li className="flex items-start gap-2"><ArrowRight className="w-4 h-4 mt-0.5 text-gray-400" /> Open source code (GitHub)</li>
                  <li className="flex items-start gap-2"><ArrowRight className="w-4 h-4 mt-0.5 text-gray-400" /> Public investment datasets</li>
                </ul>
              </div>
              <div className="bg-white border border-gray-200 p-6 shadow-sm">
                <h3 className="font-mono text-xs uppercase tracking-widest font-medium mb-3">AI Synthesis</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2"><ArrowRight className="w-4 h-4 mt-0.5 text-gray-400" /> Auto-generated technical summaries</li>
                  <li className="flex items-start gap-2"><ArrowRight className="w-4 h-4 mt-0.5 text-gray-400" /> Extracted technological lineages</li>
                  <li className="flex items-start gap-2"><ArrowRight className="w-4 h-4 mt-0.5 text-gray-400" /> Competitive moat analysis</li>
                  <li className="flex items-start gap-2"><ArrowRight className="w-4 h-4 mt-0.5 text-gray-400" /> Suggested learning paths</li>
                </ul>
              </div>
            </div>
            <div className="bg-gray-50 border-l-4 border-gray-300 p-4 text-sm text-gray-600 italic">
              <strong>Data note:</strong> The current map is no longer loaded from frontend mock data during normal operation. It is a backend-served curated graph built from public documentation, official product pages, papers, and open source project pages. Automated external ingestion and review workflows are still being expanded.
            </div>
          </div>
        </section>

        <section className="space-y-6 border-t border-gray-200 pt-12">
          <h2 className="font-mono text-sm uppercase tracking-widest text-black flex items-center gap-2">
            <Shield className="w-4 h-4" /> Roadmap
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border border-gray-200 bg-white p-6 shadow-sm hover:border-black transition-colors focus-within:ring group">
              <h3 className="font-sans font-medium text-black mb-3">Live Extractions</h3>
              <p className="font-sans text-sm text-gray-500 leading-relaxed mb-4">Integrating a real-time AI engine that parses daily news and suggests new nodes.</p>
              <div className="font-mono text-[10px] uppercase tracking-widest text-indigo-500">Planned</div>
            </div>
            <div className="border border-gray-200 bg-white p-6 shadow-sm hover:border-black transition-colors focus-within:ring group">
              <h3 className="font-sans font-medium text-black mb-3">User Contributions</h3>
              <p className="font-sans text-sm text-gray-500 leading-relaxed mb-4">Allowing verified users to submit corrections through a pull-request style system.</p>
              <div className="font-mono text-[10px] uppercase tracking-widest text-amber-500">In Design</div>
            </div>
            <div className="border border-gray-200 bg-white p-6 shadow-sm hover:border-black transition-colors focus-within:ring group">
              <h3 className="font-sans font-medium text-black mb-3">Data API Access</h3>
              <p className="font-sans text-sm text-gray-500 leading-relaxed mb-4">Providing a GraphQL API for developers and researchers to query the Constellation data.</p>
              <div className="font-mono text-[10px] uppercase tracking-widest text-gray-400">Future</div>
            </div>
          </div>
        </section>
        
        <section className="space-y-6 border-t border-gray-200 pt-12 pb-12">
           <p className="font-sans text-center text-lg text-black mb-6">
             Ready to explore the universe?
           </p>
           <div className="flex justify-center">
             <Link to="/explore" className="font-mono text-xs uppercase tracking-[0.2em] bg-black text-white px-8 py-4 hover:bg-gray-800 transition-colors shadow-lg">
               Enter The Map
             </Link>
           </div>
        </section>

        <div className="border-t border-gray-200 pt-8 pb-12 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] md:text-xs text-gray-400 font-mono uppercase tracking-widest text-center">
           <span>© {new Date().getFullYear()} OpenConstellation Project.</span>
           <span>contact@openconstellation.ai</span>
        </div>

      </div>
    </div>
  );
}
