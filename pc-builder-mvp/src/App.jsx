import React, { useState, useEffect, useRef } from 'react';
import partsData from './data/parts.json';
import Visualizer3D from './components/Visualizer3D';
import { validateBuild } from './utils/cspSolver';

// Currency conversion rates and symbols relative to USD
const CURRENCIES = {
  USD: { symbol: '$', rate: 1 },
  EUR: { symbol: '€', rate: 0.92 },
  GBP: { symbol: '£', rate: 0.79 },
  INR: { symbol: '₹', rate: 83 }
};

export default function App() {
  const [selectedParts, setSelectedParts] = useState({
    cpu: null,
    motherboard: null,
    ram: null,
    gpu: null,
    psu: null
  });

  const [currency, setCurrency] = useState('USD');

  const handleSelect = (category, part) => {
    setSelectedParts(prev => ({
      ...prev,
      [category]: part
    }));
  };

  const handleReset = () => {
    setSelectedParts({ cpu: null, motherboard: null, ram: null, gpu: null, psu: null });
  };

  const validation = validateBuild(selectedParts);
  const rawTotalPrice = Object.values(selectedParts).reduce((sum, part) => sum + (part?.price || 0), 0);
  
  // Format price helper based on selected currency
  const formatPrice = (priceInUSD) => {
    if (!priceInUSD) return `${CURRENCIES[currency].symbol}0`;
    const converted = Math.round(priceInUSD * CURRENCIES[currency].rate);
    return `${CURRENCIES[currency].symbol}${converted.toLocaleString()}`;
  };

  // Calculate total system power draw
  const totalTdp = (selectedParts.cpu?.tdp || 0) + (selectedParts.gpu?.tdp || 0);
  const psuWattage = selectedParts.psu?.wattage || 0;
  const powerPercentage = psuWattage > 0 ? Math.min(Math.round((totalTdp / psuWattage) * 100), 100) : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500 selection:text-white pb-16">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-md sticky top-0 z-30 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 text-xl font-black">
              VP
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Virtual PC Builder <span className="text-[10px] uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full font-mono">MVP v1.0</span>
              </h1>
              <p className="text-xs text-slate-400">Hybrid AI Heuristics & CSP Deterministic Engine</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Currency Selector Dropdown */}
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="bg-slate-900 border border-slate-700/80 text-slate-200 text-xs font-semibold rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 shadow-sm cursor-pointer"
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="INR">INR (₹)</option>
            </select>

            <button 
              onClick={handleReset}
              className="px-4 py-2 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition shadow-sm hover:shadow"
            >
              ↺ Reset Config
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="max-w-7xl mx-auto px-6 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left 2 Columns: Searchable Dropdown Part Selectors */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold text-slate-200 tracking-wide uppercase text-xs">Hardware Selection Matrix</h2>
              <span className="text-xs text-slate-400 font-mono">5 Categories Active</span>
            </div>

            <SearchableSelectCategory 
              title="Processor (CPU)" 
              parts={partsData.cpus}
              selectedPart={selectedParts.cpu}
              onSelect={(part) => handleSelect('cpu', part)}
              renderDetails={(part) => `Socket: ${part.socket} • TDP: ${part.tdp}W`}
              formatPrice={formatPrice}
            />

            <SearchableSelectCategory 
              title="Motherboard" 
              parts={partsData.motherboards}
              selectedPart={selectedParts.motherboard}
              onSelect={(part) => handleSelect('motherboard', part)}
              renderDetails={(part) => `Socket: ${part.socket} • RAM: ${part.ramType}`}
              formatPrice={formatPrice}
            />

            <SearchableSelectCategory 
              title="Memory (RAM)" 
              parts={partsData.ram}
              selectedPart={selectedParts.ram}
              onSelect={(part) => handleSelect('ram', part)}
              renderDetails={(part) => `Module Type: ${part.type}`}
              formatPrice={formatPrice}
            />

            <SearchableSelectCategory 
              title="Graphics Card (GPU)" 
              parts={partsData.gpus}
              selectedPart={selectedParts.gpu}
              onSelect={(part) => handleSelect('gpu', part)}
              renderDetails={(part) => `Estimated TDP: ${part.tdp}W`}
              formatPrice={formatPrice}
            />

            <SearchableSelectCategory 
              title="Power Supply (PSU)" 
              parts={partsData.psus}
              selectedPart={selectedParts.psu}
              onSelect={(part) => handleSelect('psu', part)}
              renderDetails={(part) => `Max Output: ${part.wattage}W`}
              formatPrice={formatPrice}
            />

            {/* Empty footer spacer div to ensure room below PSU dropdown */}
            <div className="h-48" aria-hidden="true"></div>
          </div>

          {/* Right Column: Dynamic Build Inspection & CSP Status */}
          <div className="space-y-6">
            <Visualizer3D selectedParts="{selectedParts}"/>
            <div className="bg-slate-900/80 backdrop-blur border border-slate-800/80 rounded-2xl p-6 sticky top-24 shadow-2xl shadow-black/50">
              
              {/* Price & Summary Header */}
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-5">
                <div>
                  <h2 className="text-base font-semibold text-white">System Diagnostics</h2>
                  <p className="text-xs text-slate-400">Real-time CSP validation</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase text-slate-500 font-semibold block">Total Estimate</span>
                  <span className="text-2xl font-mono font-bold text-emerald-400">{formatPrice(rawTotalPrice)}</span>
                </div>
              </div>

              {/* CSP Validation Status Banner */}
              <div className="mb-6 space-y-3">
                {validation.isValid && Object.values(selectedParts).some(Boolean) ? (
                  <div className="bg-gradient-to-r from-emerald-950/60 to-slate-900 border border-emerald-500/40 text-emerald-200 p-4 rounded-xl shadow-lg shadow-emerald-950/20">
                    <div className="flex items-center gap-2 font-semibold text-emerald-400 text-sm">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      Build Verified Compatible
                    </div>
                    <p className="text-xs text-emerald-300/80 mt-1">Constraint solver confirms zero electrical or socket conflicts.</p>
                  </div>
                ) : !Object.values(selectedParts).some(Boolean) ? (
                  <div className="bg-slate-950/60 border border-slate-800 text-slate-400 p-4 rounded-xl text-xs text-center">
                    Select components on the left to initialize constraint verification.
                  </div>
                ) : (
                  <div className="bg-gradient-to-r from-rose-950/60 to-slate-900 border border-rose-500/40 text-rose-200 p-4 rounded-xl shadow-lg shadow-rose-950/20">
                    <div className="flex items-center gap-2 font-semibold text-rose-400 text-sm">
                      <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                      Compatibility Conflict Detected
                    </div>
                    <ul className="text-xs text-rose-300/80 mt-2 space-y-1.5 list-disc list-inside">
                      {validation.issues.map((err, idx) => (
                        <li key={idx} className="leading-relaxed">{err}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Warnings */}
                {validation.warnings.length > 0 && (
                  <div className="bg-amber-950/40 border border-amber-500/30 text-amber-200 p-3 rounded-xl text-xs">
                    <p className="font-semibold text-amber-400 flex items-center gap-1.5">
                      <span>⚠️</span> System Recommendation Notice:
                    </p>
                    <ul className="mt-1.5 space-y-1 list-disc list-inside text-amber-300/80">
                      {validation.warnings.map((warn, idx) => (
                        <li key={idx}>{warn}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Power Headroom Meter */}
              {selectedParts.psu && (
                <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-xl mb-6">
                  <div className="flex justify-between items-center text-xs mb-2">
                    <span className="text-slate-400">Est. Power Draw vs PSU</span>
                    <span className="font-mono text-slate-200">{totalTdp}W / {psuWattage}W</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${powerPercentage > 85 ? 'bg-amber-500' : 'bg-blue-500'}`}
                      style={{ width: `${powerPercentage}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Configured Parts Inventory */}
              <div className="space-y-3">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Active Hardware Stack</p>
                <div className="space-y-2">
                  {Object.entries(selectedParts).map(([key, part]) => (
                    <div key={key} className="flex justify-between items-center p-2.5 bg-slate-950/40 border border-slate-800/50 rounded-lg text-xs">
                      <span className="text-slate-400 capitalize font-medium">{key}:</span>
                      <span className="font-semibold text-slate-200 text-right truncate max-w-[160px]">
                        {part ? part.name : <span className="text-slate-600 italic">Unassigned</span>}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

// Custom Searchable Dropdown Select Component
function SearchableSelectCategory({ title, parts, selectedPart, onSelect, renderDetails, formatPrice }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter parts based on search query
  const filteredParts = parts.filter(part => {
    const details = renderDetails(part).toLowerCase();
    const query = searchQuery.toLowerCase();
    return part.name.toLowerCase().includes(query) || details.includes(query);
  });

  return (
    <div 
      ref={dropdownRef}
      className={`bg-slate-900/60 backdrop-blur border border-slate-800/80 rounded-2xl p-5 shadow-lg transition hover:border-slate-700/80 relative ${
        isOpen ? 'z-50 ring-2 ring-blue-500/40' : 'z-10'
      }`}
    >
      <div className="mb-3">
        <h2 className="text-base font-semibold text-slate-100">{title}</h2>
      </div>

      {/* Dropdown Container */}
      <div className="relative">
        {/* Trigger Button */}
        <div 
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full p-3.5 rounded-xl border transition flex items-center justify-between cursor-pointer ${
            selectedPart 
              ? 'bg-blue-600/10 border-blue-500/80 text-blue-100 shadow-md shadow-blue-500/10 ring-1 ring-blue-500/50' 
              : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 text-slate-400'
          }`}
        >
          {selectedPart ? (
            <div className="flex justify-between items-center w-full pr-2">
              <div>
                <p className="font-semibold text-sm text-white">{selectedPart.name}</p>
                <p className="text-xs text-blue-300/80 font-mono mt-0.5">{renderDetails(selectedPart)}</p>
              </div>
              <span className="font-mono text-emerald-400 font-bold text-sm ml-4">{formatPrice(selectedPart.price)}</span>
            </div>
          ) : (
            <span className="text-sm">Click to search or select a {title.toLowerCase()}...</span>
          )}

          <div className="flex items-center gap-2 ml-3 shrink-0">
            {selectedPart && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(null);
                }}
                className="text-slate-400 hover:text-rose-400 p-1 text-xs font-bold"
                title="Clear selection"
              >
                ✕
              </button>
            )}
            <span className={`text-xs transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
          </div>
        </div>

        {/* Dropdown Menu Panel */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl">
            {/* Search Input */}
            <div className="p-2 border-b border-slate-800 bg-slate-950/60">
              <input
                type="text"
                placeholder={`Type to search ${title.toLowerCase()}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Options List */}
            <div className="max-h-56 overflow-y-auto divide-y divide-slate-800/50">
              {filteredParts.length > 0 ? (
                filteredParts.map(part => {
                  const isSelected = selectedPart?.id === part.id;
                  return (
                    <div
                      key={part.id}
                      onClick={() => {
                        onSelect(part);
                        setIsOpen(false);
                        setSearchQuery('');
                      }}
                      className={`p-3 cursor-pointer transition flex items-center justify-between hover:bg-blue-600/20 ${
                        isSelected ? 'bg-blue-600/20 text-blue-200' : 'text-slate-300'
                      }`}
                    >
                      <div>
                        <p className="font-semibold text-sm">{part.name}</p>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">{renderDetails(part)}</p>
                      </div>
                      <span className="font-mono text-emerald-400 font-bold text-xs shrink-0 ml-4">{formatPrice(part.price)}</span>
                    </div>
                  );
                })
              ) : (
                <div className="p-4 text-center text-slate-500 text-xs">
                  No matching components found.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}