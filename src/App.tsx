/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  Scale, 
  CheckCircle2, 
  XCircle, 
  Target, 
  Zap, 
  AlertTriangle, 
  TrendingUp, 
  ShieldAlert,
  Loader2,
  ArrowRight,
  RefreshCw,
  LayoutGrid,
  ListChecks,
  Table as TableIcon,
  BrainCircuit
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Types for the AI analysis
interface AnalysisResult {
  pros: string[];
  cons: string[];
  swot: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  comparisonTable?: {
    feature: string;
    optionA: string;
    optionB: string;
  }[];
  optionAName?: string;
  optionBName?: string;
  verdict: string;
  summary: string;
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export default function App() {
  const [decision, setDecision] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<'proscons' | 'swot' | 'comparison' | 'verdict'>('proscons');

  const analyzeDecision = async () => {
    if (!decision.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze the following decision: "${decision}". 
        Provide a detailed breakdown including pros and cons, a SWOT analysis, and if the user is comparing two distinct options, a comparison table.
        If there are two distinct options being compared, identify them clearly as optionAName and optionBName.
        Return the result in JSON format.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              pros: { type: Type.ARRAY, items: { type: Type.STRING } },
              cons: { type: Type.ARRAY, items: { type: Type.STRING } },
              swot: {
                type: Type.OBJECT,
                properties: {
                  strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                  weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
                  opportunities: { type: Type.ARRAY, items: { type: Type.STRING } },
                  threats: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ["strengths", "weaknesses", "opportunities", "threats"],
              },
              optionAName: { type: Type.STRING, description: "The name of the first option being compared" },
              optionBName: { type: Type.STRING, description: "The name of the second option being compared" },
              comparisonTable: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    feature: { type: Type.STRING },
                    optionA: { type: Type.STRING },
                    optionB: { type: Type.STRING },
                  },
                  required: ["feature", "optionA", "optionB"],
                },
              },
              verdict: { type: Type.STRING },
              summary: { type: Type.STRING },
            },
            required: ["pros", "cons", "swot", "verdict", "summary"],
          },
        },
      });

      const data = JSON.parse(response.text || "{}") as AnalysisResult;
      setResult(data);
      setActiveTab('proscons');
    } catch (error) {
      console.error("Analysis failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 font-sans selection:bg-indigo-100">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Scale className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">The Tiebreaker</h1>
          </div>
          <div className="text-xs font-mono text-slate-400 uppercase tracking-widest">
            AI Decision Engine v1.0
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Input Section */}
        <section className="mb-12">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 transition-all hover:shadow-md">
            <label htmlFor="decision-input" className="block text-sm font-medium text-slate-500 mb-4 uppercase tracking-wider">
              What's on your mind?
            </label>
            <div className="relative">
              <textarea
                id="decision-input"
                className="w-full min-h-[120px] text-2xl font-light bg-transparent border-none focus:ring-0 resize-none placeholder:text-slate-300"
                placeholder="Should I start a side project or focus on my current job?"
                value={decision}
                onChange={(e) => setDecision(e.target.value)}
              />
              <div className="absolute bottom-0 right-0 flex items-center gap-3">
                <button
                  onClick={analyzeDecision}
                  disabled={loading || !decision.trim()}
                  className={cn(
                    "flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all",
                    loading || !decision.trim() 
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                      : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200 active:scale-95"
                  )}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <BrainCircuit className="w-4 h-4" />
                      Analyze
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Results Section */}
        <AnimatePresence mode="wait">
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Summary Card */}
              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <Zap className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-indigo-900 mb-1">Quick Summary</h3>
                    <p className="text-indigo-800/80 leading-relaxed">{result.summary}</p>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-fit">
                <TabButton 
                  active={activeTab === 'proscons'} 
                  onClick={() => setActiveTab('proscons')}
                  icon={<ListChecks className="w-4 h-4" />}
                  label="Pros & Cons"
                />
                <TabButton 
                  active={activeTab === 'swot'} 
                  onClick={() => setActiveTab('swot')}
                  icon={<LayoutGrid className="w-4 h-4" />}
                  label="SWOT Analysis"
                />
                {result.comparisonTable && result.comparisonTable.length > 0 && (
                  <TabButton 
                    active={activeTab === 'comparison'} 
                    onClick={() => setActiveTab('comparison')}
                    icon={<TableIcon className="w-4 h-4" />}
                    label="Comparison"
                  />
                )}
                <TabButton 
                  active={activeTab === 'verdict'} 
                  onClick={() => setActiveTab('verdict')}
                  icon={<Target className="w-4 h-4" />}
                  label="AI Verdict"
                />
              </div>

              {/* Tab Content */}
              <div className="min-h-[400px]">
                {activeTab === 'proscons' && (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }}
                    className="grid md:grid-cols-2 gap-6"
                  >
                    <div className="bg-white rounded-2xl border border-slate-200 p-6">
                      <div className="flex items-center gap-2 mb-6 text-emerald-600">
                        <CheckCircle2 className="w-5 h-5" />
                        <h3 className="font-semibold uppercase tracking-wider text-sm">Pros</h3>
                      </div>
                      <ul className="space-y-4">
                        {result.pros.map((pro, i) => (
                          <li key={i} className="flex gap-3 text-slate-600 leading-relaxed">
                            <span className="text-emerald-400 mt-1">•</span>
                            {pro}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-200 p-6">
                      <div className="flex items-center gap-2 mb-6 text-rose-600">
                        <XCircle className="w-5 h-5" />
                        <h3 className="font-semibold uppercase tracking-wider text-sm">Cons</h3>
                      </div>
                      <ul className="space-y-4">
                        {result.cons.map((con, i) => (
                          <li key={i} className="flex gap-3 text-slate-600 leading-relaxed">
                            <span className="text-rose-400 mt-1">•</span>
                            {con}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'swot' && (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  >
                    <SWOTCard 
                      title="Strengths" 
                      items={result.swot.strengths} 
                      icon={<TrendingUp className="w-5 h-5" />} 
                      color="bg-blue-50 text-blue-700 border-blue-100"
                    />
                    <SWOTCard 
                      title="Weaknesses" 
                      items={result.swot.weaknesses} 
                      icon={<ShieldAlert className="w-5 h-5" />} 
                      color="bg-amber-50 text-amber-700 border-amber-100"
                    />
                    <SWOTCard 
                      title="Opportunities" 
                      items={result.swot.opportunities} 
                      icon={<Zap className="w-5 h-5" />} 
                      color="bg-emerald-50 text-emerald-700 border-emerald-100"
                    />
                    <SWOTCard 
                      title="Threats" 
                      items={result.swot.threats} 
                      icon={<AlertTriangle className="w-5 h-5" />} 
                      color="bg-rose-50 text-rose-700 border-rose-100"
                    />
                  </motion.div>
                )}

                {activeTab === 'comparison' && result.comparisonTable && (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden"
                  >
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Feature</th>
                          <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-indigo-600">
                            {result.optionAName || "Option A"}
                          </th>
                          <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-indigo-600">
                            {result.optionBName || "Option B"}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {result.comparisonTable.map((row, i) => (
                          <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 font-medium text-slate-700">{row.feature}</td>
                            <td className="px-6 py-4 text-slate-600">{row.optionA}</td>
                            <td className="px-6 py-4 text-slate-600">{row.optionB}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </motion.div>
                )}

                {activeTab === 'verdict' && (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }}
                    className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-2xl mx-auto"
                  >
                    <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <BrainCircuit className="w-8 h-8 text-indigo-600" />
                    </div>
                    <h3 className="text-2xl font-semibold text-slate-900 mb-4">The AI Verdict</h3>
                    <p className="text-lg text-slate-600 leading-relaxed italic">
                      "{result.verdict}"
                    </p>
                    <div className="mt-8 pt-8 border-t border-slate-100 flex items-center justify-center gap-2 text-slate-400 text-sm">
                      <RefreshCw className="w-4 h-4" />
                      <span>Analysis based on current context and data</span>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State / Welcome */}
        {!result && !loading && (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-100 mb-6">
              <Scale className="w-10 h-10 text-slate-300" />
            </div>
            <h2 className="text-2xl font-light text-slate-400 max-w-md mx-auto">
              Enter a decision above to get a comprehensive AI-powered analysis.
            </h2>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto px-6 py-12 border-t border-slate-200">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 text-slate-400">
            <Scale className="w-4 h-4" />
            <span className="text-sm font-medium">The Tiebreaker</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-400">
            <a href="#" className="hover:text-indigo-600 transition-colors">Privacy</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Terms</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">How it works</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
        active 
          ? "bg-white text-indigo-600 shadow-sm" 
          : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function SWOTCard({ title, items, icon, color }: { title: string, items: string[], icon: React.ReactNode, color: string }) {
  return (
    <div className={cn("rounded-2xl border p-6", color)}>
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h4 className="font-bold uppercase tracking-wider text-xs">{title}</h4>
      </div>
      <ul className="space-y-3">
        {items.map((item, i) => (
          <li key={i} className="text-sm leading-relaxed opacity-90 flex gap-2">
            <span className="opacity-50">•</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
