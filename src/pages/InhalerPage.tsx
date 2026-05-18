import React, { useState, useMemo, useEffect } from "react";
import {
  Wind,
  HelpCircle,
  X,
  ChevronDown,
  ChevronRight,
  Activity,
  Zap,
  CheckCircle2,
  AlertCircle,
  BrainCircuit,
  ShoppingCart
} from "lucide-react";
import { useAppContext } from "../store/AppContext";
import { cn } from "../lib/utils";
import { InhalerLog } from "../lib/db";

const VARIANTS = [
  {
    id: "warm-bitter",
    name: "Warm-Bitter",
    desc: "post-meal craving",
    color: "bg-brand",
  },
  {
    id: "cool-mint",
    name: "Cool-Mint",
    desc: "stress & fatigue",
    color: "bg-brand",
  },
  {
    id: "spicy-herbal",
    name: "Spicy-Herbal",
    desc: "focus & break",
    color: "bg-brand",
  },
  {
    id: "automatic-bypass",
    name: "Auto Bypass",
    desc: "Bluetooth logger",
    color: "bg-indigo-500",
  },
] as const;

const CONTEXTS = [
  "Setelah makan",
  "Stres kerja",
  "Jeda fokus",
  "Bosan",
  "Sosial (kumpul)",
  "Pagi hari",
  "Lainnya",
];

export default function InhalerPage({ startLogging, setActiveTab }: { startLogging?: boolean, setActiveTab?: (t: any) => void }) {
  const { state, addInhalerLog, deleteInhalerLog } = useAppContext();
  const [showLogModal, setShowLogModal] = useState(startLogging || false);

  useEffect(() => {
    if (startLogging) setShowLogModal(true);
  }, [startLogging]);

  // Stats & Analytics
  const logs = state.inhalerLogs || [];

  const calculateEffectiveness = (variantId: string) => {
    const vLogs = logs.filter(
      (l) =>
        l.variantUsed === variantId &&
        l.intensityAfter !== null &&
        l.intensityBefore > l.intensityAfter,
    );
    if (vLogs.length === 0)
      return {
        avgReduction: 0,
        count: logs.filter((l) => l.variantUsed === variantId).length,
      };
    const sum = vLogs.reduce(
      (acc, l) => acc + (l.intensityBefore - (l.intensityAfter || 0)),
      0,
    );
    return {
      avgReduction: sum / vLogs.length,
      count: logs.filter((l) => l.variantUsed === variantId).length,
    };
  };

  const variantStats = VARIANTS.map((v) => ({
    ...v,
    stats: calculateEffectiveness(v.id),
  })).sort((a, b) => b.stats.avgReduction - a.stats.avgReduction);

  // Context Analysis
  const topContexts = useMemo(() => {
    const ctxCount: Record<string, number> = {};
    logs.forEach((l) => {
      l.context.forEach((c) => {
        ctxCount[c] = (ctxCount[c] || 0) + 1;
      });
    });
    return Object.entries(ctxCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
  }, [logs]);

  const topContextName = topContexts.length > 0 ? topContexts[0][0] : null;
  const bestVariantForTopContext = useMemo(() => {
    if (!topContextName) return null;
    let best = null;
    let maxRed = 0;
    VARIANTS.forEach((v) => {
      const vLogs = logs.filter(
        (l) =>
          l.variantUsed === v.id &&
          l.context.includes(topContextName) &&
          l.intensityAfter !== null,
      );
      if (vLogs.length > 0) {
        const sum = vLogs.reduce(
          (acc, l) => acc + (l.intensityBefore - (l.intensityAfter || 0)),
          0,
        );
        const avg = sum / vLogs.length;
        if (avg > maxRed) {
          maxRed = avg;
          best = v;
        }
      }
    });
    return best;
  }, [logs, topContextName]);

  // Weekly Insight
  const weeklyInsight = useMemo(() => {
    if (logs.length < 5) return null;

    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);
    const weeklyLogs = logs.filter(
      (l) => new Date(l.timestamp) >= last7Days && l.isInhalerAvailable,
    );

    if (weeklyLogs.length === 0) return null;

    const variantCount: Record<string, number> = {};
    let totalReduction = 0;
    let reductionCases = 0;

    weeklyLogs.forEach((l) => {
      variantCount[l.variantUsed] = (variantCount[l.variantUsed] || 0) + 1;
      if (l.intensityAfter !== null && l.intensityBefore > l.intensityAfter) {
        totalReduction += l.intensityBefore - l.intensityAfter;
        reductionCases++;
      }
    });

    let maxVariant = "";
    let maxCount = 0;
    Object.entries(variantCount).forEach(([v, c]) => {
      if (c > maxCount) {
        maxCount = c;
        maxVariant = v;
      }
    });

    const topVarName =
      VARIANTS.find((x) => x.id === maxVariant)?.name || maxVariant;
    const avgRed =
      reductionCases > 0 ? (totalReduction / reductionCases).toFixed(1) : "0";

    return {
      total: weeklyLogs.length,
      topVariant: topVarName,
      avgReduction: avgRed,
      insight: `This week your stress cravings decreased by an average of ${avgRed} points each time you used ${topVarName}.`,
    };
  }, [logs]);

  // Log Form State
  const [variant, setVariant] = useState<string>("");
  const [inhalerAvailable, setInhalerAvailable] = useState(true);
  const [selectedContexts, setSelectedContexts] = useState<string[]>([]);
  const [customContext, setCustomContext] = useState("");
  const [intensityBefore, setIntensityBefore] = useState(5);
  const [intensityAfter, setIntensityAfter] = useState<number | null>(null);

  const toggleContext = (c: string) => {
    if (selectedContexts.includes(c))
      setSelectedContexts(selectedContexts.filter((x) => x !== c));
    else setSelectedContexts([...selectedContexts, c]);
  };

  const saveLog = async () => {
    if (inhalerAvailable && !variant)
      return alert("Select the inhaler variant used");
    if (selectedContexts.length === 0)
      return alert("Select at least 1 craving context");

    let ctx = [...selectedContexts];
    if (ctx.includes("Other") && customContext) {
      ctx = ctx.filter((c) => c !== "Other");
      ctx.push(customContext);
    }

    try {
      await addInhalerLog({
        timestamp: new Date().toISOString(),
        variantUsed: inhalerAvailable ? (variant as any) : "none",
        context: ctx,
        intensityBefore,
        intensityAfter: intensityAfter,
        isInhalerAvailable: inhalerAvailable,
        fallbackMethod: inhalerAvailable ? null : "Sensory Override",
      });
      setShowLogModal(false);

      // Reset form
      setVariant("");
      setSelectedContexts([]);
      setCustomContext("");
      setIntensityBefore(5);
      setIntensityAfter(null);
      setInhalerAvailable(true);
    } catch (err) {
      console.error("Failed to save inhaler log:", err);
      alert("Failed to save log. Please try again.");
    }
  };

  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  // Fallback view
  if (!showLogModal && logs.length < 5) {
    // We will still show the main view, but with an onboarding prompt.
  }

  return (
    <div className="flex flex-col h-full bg-gray-50/50 pt-8 px-5 pb-24 overflow-y-auto w-full">
      <header className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            PATCHWORK <Wind className="w-5 h-5 text-gray-500" />
          </h1>
          <p className="text-gray-500 font-medium">
            Inhaler & Sensory Override
          </p>
        </div>
        <button
          onClick={() => setShowLogModal(true)}
          className="btn-primary !py-2 !px-4 shadow-brand/20"
        >
          Log Session
        </button>
      </header>

      {logs.length < 5 && (
        <div className="bg-brand-50 border border-brand-100 p-4 rounded-2xl mb-6 shadow-sm">
          <h3 className="font-bold text-brand-700 flex items-center gap-1">
            <Zap className="w-4 h-4" /> AI Calibration
          </h3>
          <p className="text-sm font-medium text-brand-600 mt-1">
            Log at least 5 sessions to get insights and personal inhaler recommendations from AI.
          </p>
        </div>
      )}

      {logs.length >= 5 && bestVariantForTopContext && (
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-3xl p-3 shadow-2xl shadow-gray-900/20 mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand/20 blur-3xl rounded-full"></div>
          <div className="flex items-center gap-2 text-brand-300 font-bold text-[10px] tracking-widest mb-3">
            <BrainCircuit className="w-4 h-4" /> AI RECOMMENDATION
          </div>
          <h3 className="text-white font-bold text-lg mb-2">
            For <span className="text-brand-400">"{topContextName}"</span> cravings, {bestVariantForTopContext.name} has proven to be the most effective.
          </h3>
          <p className="text-gray-400 text-sm font-medium">
            Keep this variant ready before that situation arises again.
          </p>
        </div>
      )}

      {weeklyInsight && (
        <div className="bg-brand-50 border-2 border-brand-100 rounded-3xl p-3 mb-8 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-brand text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">
              W
            </div>
            <div>
              <h3 className="font-bold text-brand-900 leading-tight">
                Weekly Insight
              </h3>
              <p className="text-[10px] font-bold text-brand-500 tracking-wider mt-0.5">
                Ringkasan 7 Hari Terakhir
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-white rounded-xl p-3 text-center">
              <span className="block text-2xl font-bold text-gray-800">
                {weeklyInsight.total}
              </span>
              <span className="text-[10px] font-bold text-gray-400">
                Sessions
              </span>
            </div>
            <div className="bg-white rounded-xl p-3 text-center">
              <span
                className="block text-xl font-bold text-gray-800 truncate px-1"
                title={weeklyInsight.topVariant}
              >
                {weeklyInsight.topVariant.split("-")[0]}
              </span>
              <span className="text-[10px] font-bold text-gray-400">
                Top Variant
              </span>
            </div>
            <div className="bg-white rounded-xl p-3 text-center">
              <span className="block text-2xl font-bold text-brand-dark">
                -{weeklyInsight.avgReduction}
              </span>
              <span className="text-[10px] font-bold text-gray-400">
                Craving Points
              </span>
            </div>
          </div>

          <p className="text-sm font-medium text-brand-800 italic bg-white/50 p-3 rounded-xl">
            "{weeklyInsight.insight}"
          </p>
        </div>
      )}

      <section className="mb-8">
        <h2 className="font-bold text-gray-800 mb-3 flex items-center justify-between">
          Effectiveness per Variant
          <span className="text-xs font-bold text-gray-400 tracking-widest">
            Scoreboard
          </span>
        </h2>
        <div className="grid grid-cols-1 gap-3">
          {variantStats.map((v, i) => (
            <div
              key={v.id}
              className="bg-white text-left flex justify-between items-center p-4 rounded-2xl"
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center shadow-lg shadow-black/5 text-white",
                    v.color,
                  )}
                >
                  <Wind className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 text-sm">{v.name}</h4>
                  {v.stats.count > 0 ? (
                    <p className="text-xs font-bold text-brand-dark mt-0.5 tracking-tight flex items-center gap-0.5">
                      <CheckCircle2 className="w-3 h-3" /> Drops{" "}
                      {v.stats.avgReduction.toFixed(1)} points on avg
                    </p>
                  ) : (
                    <p className="text-xs font-medium text-gray-400 mt-0.5">
                      Not Tried Yet
                    </p>
                  )}
                </div>
              </div>
              {i === 0 && v.stats.count > 0 && (
                <div className="bg-brand/10 text-brand px-2 py-1 rounded-md text-[10px] font-extrabold tracking-wide">
                  Most Effective
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {logs.length > 0 && (
        <section className="mb-8 card-duo">
          <h2 className="font-bold text-gray-800 text-sm mb-4">
            Your Top Craving Contexts:
          </h2>
          <div className="space-y-3">
            {topContexts.map(([ctx, count], i) => (
              <div key={ctx}>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-gray-700">{ctx}</span>
                  <span className="text-gray-400">{count}x</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gray-800 rounded-full"
                    style={{ width: `${(count / topContexts[0][1]) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="font-bold text-gray-800 mb-3 flex items-center justify-between">
          Session History
        </h2>
        <div className="space-y-3">
          {logs.slice(0, 10).map((log) => {
            const v = VARIANTS.find((x) => x.id === log.variantUsed);
            const isExpanded = expandedLog === log.id;
            const reduction =
              log.intensityAfter !== null
                ? log.intensityBefore - log.intensityAfter
                : 0;
            return (
              <div
                key={log.id}
                className="bg-white p-4 rounded-2xl transition-all hover:border-gray-200"
              >
                <div
                  className="flex justify-between items-start cursor-pointer"
                  onClick={() => setExpandedLog(isExpanded ? null : log.id!)}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className={cn(
                          "w-2 h-2 rounded-full",
                          v ? v.color : "bg-gray-400",
                        )}
                      ></div>
                      <span className="font-bold text-sm text-gray-800">
                        {v ? v.name : "Inhaler-free (Fallback)"}
                      </span>
                      <span className="text-[10px] text-gray-400 font-medium">
                        {new Date(log.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 font-medium">
                      {log.context.join(", ")}
                    </p>
                  </div>
                  <div className="text-right">
                    {log.intensityAfter !== null ? (
                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1.5 font-bold text-xs">
                          <span className="text-brand">
                            {log.intensityBefore}
                          </span>
                          <ChevronRight className="w-3 h-3 text-gray-300" />
                          <span
                            className={
                              reduction > 0
                                ? "text-brand"
                                : "text-gray-500"
                            }
                          >
                            {log.intensityAfter}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs font-bold text-brand bg-brand-surface px-2 py-0.5 rounded-md">
                        Pending
                      </span>
                    )}
                  </div>
                </div>
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-gray-100 animate-in slide-in-from-top-2 flex justify-between items-center">
                    <button
                      onClick={() => deleteInhalerLog(log.id!)}
                      className="text-xs font-bold text-brand hover:bg-brand-surface px-2 py-1 rounded-md transition-colors"
                    >
                      Delete Record
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          {logs.length === 0 && (
            <div className="text-center p-8 bg-gray-50 border border-dashed border-gray-200 rounded-2xl">
              <Wind className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-500">
                Belum ada sesi tercatat.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Log Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-t-3xl shadow-2xl flex flex-col h-[90vh]">
            <div className="p-3 border-b border-gray-100 flex justify-between items-center shrink-0">
              <h2 className="font-bold text-xl text-gray-800">
                Log Penggunaan
              </h2>
              <button
                onClick={() => setShowLogModal(false)}
                className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-6">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm font-bold text-gray-800">
                    1. Varian yang dipakai
                  </label>
                </div>
                {inhalerAvailable ? (
                  <>
                    <div className="grid grid-cols-1 gap-2 mb-3">
                      {VARIANTS.map((v) => (
                        <button
                          onClick={() => setVariant(v.id)}
                          key={v.id}
                          className={cn(
                            "p-4 rounded-xl border flex items-center justify-between transition-all",
                            variant === v.id
                              ? `bg-gray-900 border-gray-900 text-white ${v.color.replace("bg-", "shadow-")}/20 shadow-lg`
                              : "bg-white border-gray-200 text-gray-700 hover:border-gray-300",
                          )}
                        >
                          <div>
                            <h4 className="font-bold text-sm">{v.name}</h4>
                            <p
                              className={cn(
                                "text-xs font-medium",
                                variant === v.id
                                  ? "text-gray-300"
                                  : "text-gray-400",
                              )}
                            >
                              {v.desc}
                            </p>
                          </div>
                          <div
                            className={cn(
                              "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                              variant === v.id
                                ? "border-brand bg-brand"
                                : "border-gray-300",
                            )}
                          >
                            {variant === v.id && (
                              <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                    <div className="flex flex-col gap-2 mt-4">
                       <button
                         onClick={() => setInhalerAvailable(false)}
                         className="text-xs font-bold text-gray-500 underline text-center w-full block hover:text-gray-700"
                       >
                         Craving but no inhaler?
                       </button>
                       <button onClick={() => { setShowLogModal(false); if(setActiveTab) setActiveTab('shop'); }} className="mt-2 bg-gradient-to-r from-brand to-brand-light text-white p-3 rounded-xl flex items-center justify-between shadow-[0_4px_0_var(--color-brand-dark)] active:translate-y-1 active:shadow-none transition-all">
                          <div>
                            <p className="text-[10px] font-bold text-white/80">Need more pods?</p>
                            <p className="text-sm font-bold">Visit the Inhaler Shop</p>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                             <ShoppingCart className="w-4 h-4 text-white" />
                          </div>
                       </button>
                    </div>
                  </>
                ) : (
                  <div className="bg-brand-surface border border-brand/30 p-4 rounded-2xl">
                    <h3 className="font-bold text-brand-dark flex items-center gap-2 mb-2">
                      <AlertCircle className="w-5 h-5" /> Sensory Hack Fallback
                    </h3>
                    <p className="text-sm font-medium text-brand-dark mb-3">
                      Try one of these options based on your situation:
                    </p>
                    <ul className="text-xs font-bold text-brand-dark space-y-2 mb-4">
                      <li>
                        • After eating: Drink ice water / chew strong gum.
                      </li>
                      <li>
                        • Stressed: Wash face with cold water / 4-7-8
                        breathing.
                      </li>
                      <li>• Bored: 2 minutes stretching / quick walk.</li>
                    </ul>
                    <button
                      onClick={() => setInhalerAvailable(true)}
                      className="btn-outline w-full bg-white border-brand/30 text-brand-dark"
                    >
                      Back to Inhaler
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-3">
                  2. Craving Context (Select &gt; 1)
                </label>
                <div className="flex flex-wrap gap-2">
                  {CONTEXTS.map((c) => (
                    <button
                      onClick={() => toggleContext(c)}
                      key={c}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-bold border transition-colors",
                        selectedContexts.includes(c)
                          ? "bg-brand text-white border-brand shadow-sm"
                          : "bg-white text-gray-600 border-gray-200 hover:border-gray-300",
                      )}
                    >
                      {c}
                    </button>
                  ))}
                </div>
                {selectedContexts.includes("Lainnya") && (
                  <input
                    type="text"
                    value={customContext}
                    onChange={(e) => setCustomContext(e.target.value)}
                    placeholder="Write context..."
                    className="mt-3 w-full border border-gray-200 bg-gray-50 rounded-lg p-3 text-sm focus:border-brand focus:outline-none"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1">
                  3. Intensity *Before* (1-10)
                </label>
                <p className="text-xs text-gray-500 font-medium mb-3">
                  How strong was the urge to smoke?
                </p>
                <div className="flex gap-4 items-center mb-2">
                  <span className="text-xs font-bold text-gray-400">Low</span>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={intensityBefore}
                    onChange={(e) => setIntensityBefore(Number(e.target.value))}
                    className="flex-1 accent-rose-500"
                  />
                  <span className="text-xs font-bold text-gray-800 w-4">
                    {intensityBefore}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1">
                  4. Intensity *After* (1-10)
                </label>
                <p className="text-xs text-gray-500 font-medium mb-3">
                  Fill it out now or skip it, we'll remind you later.
                </p>
                <div className="flex gap-4 items-center mb-2">
                  <span className="text-xs font-bold text-gray-400">Low</span>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={intensityAfter || 1}
                    onChange={(e) => setIntensityAfter(Number(e.target.value))}
                    className="flex-1 accent-emerald-500"
                  />
                  <span className="text-xs font-bold text-gray-800 w-4">
                    {intensityAfter !== null ? intensityAfter : "-"}
                  </span>
                </div>
                {intensityAfter === null && (
                  <button
                    onClick={() => setIntensityAfter(intensityBefore)}
                    className="text-xs font-bold text-brand bg-brand-50 px-3 py-1 rounded-full"
                  >
                    Same as Before
                  </button>
                )}
              </div>
            </div>

            <div className="p-3 border-t border-gray-100 bg-white shrink-0">
              <button
                onClick={saveLog}
                className="btn-primary w-full shadow-brand/20"
              >
                Save Inhaler Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
