"use client"

export const dynamic = "force-dynamic"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { useEffect, useState, useRef, useMemo } from "react"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"

/* -------------------- REFINED TOOLTIP COMPONENT -------------------- */
const DiagnosticTooltip = ({ 
  title, 
  definition, 
  highMeaning, 
  lowMeaning 
}: { 
  title: string; 
  definition: string;
  highMeaning: string;
  lowMeaning: string;
}) => (
  <span className="group relative inline-block ml-1">
    <span className="cursor-help bg-gray-100 text-gray-400 rounded-full w-4 h-4 inline-flex items-center justify-center text-[10px] font-bold hover:bg-blue-600 hover:text-white transition-colors">?</span>
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 hidden group-hover:block w-72 p-4 bg-white text-slate-800 text-xs rounded-2xl shadow-2xl z-50 border border-slate-100 whitespace-normal normal-case font-normal leading-relaxed text-left">
      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100">
        <span className="font-bold text-[11px] uppercase tracking-wider text-blue-600">{title}</span>
      </div>
      <p className="mb-3 text-slate-500 italic">"{definition}"</p>
      <div className="space-y-2">
        <p><strong className="text-slate-900 italic">High Score:</strong> {highMeaning}</p>
        <p><strong className="text-slate-900 italic">Low Score:</strong> {lowMeaning}</p>
      </div>
      <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-white"></div>
    </div>
  </span>
)

function ResultsContent() {
    const searchParams = useSearchParams()
    const data = searchParams.get("data")
    const reportRef = useRef<HTMLDivElement>(null)

    const [aiReport, setAiReport] = useState<any>(null)
    const [loadingAI, setLoadingAI] = useState(false)
    const [isExporting, setIsExporting] = useState(false)

    const result = useMemo(() => {
      if (!data) return null
      try { return JSON.parse(data) } catch { return null }
    }, [data])


    const hasFetched = useRef(false)

    useEffect(() => {
        // 1. Basic validation and duplicate prevention
        if (!result || hasFetched.current) return
        // 🔥 ADD THIS LOG HERE
        console.log("Full Result Object:", result);
        const { profile } = result
        
        // 2. Ensure we actually have data before trying to sync
        if (!profile?.email) {
            console.error("HubSpot Sync skipped: No email found in profile.")
            return
        }

        hasFetched.current = true

        const generateAIReport = async () => {
            setLoadingAI(true)

            try {
                // 1️⃣ Generate AI Report
                const res = await fetch("/api/generate-report", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(result),
                })

                if (res.ok) {
                    const aiData = await res.json()
                    setAiReport(aiData)

                    // 2️⃣ Sync to HubSpot using your Dropdown strings
                    console.log("Attempting HubSpot Sync with:", {
                        email: profile.email,
                        firstName: profile.firstName,
                        lastName: profile.lastName,
                        investableAssets: profile.investableAssets
                    })

                    const hubRes = await fetch("/api/hubspot-sync", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            email: profile.email,
                            firstName: profile.firstName,
                            lastName: profile.lastName,
                            investableAssets: profile.investableAssets, 
                        }),
                    })

                    const hubStatus = await hubRes.json()
                    console.log("HubSpot Sync Result:", hubStatus)
                }

            } catch (err) {
                console.error("Results page error:", err)
            } finally {
                setLoadingAI(false)
            }
        }

        generateAIReport()
    }, [result])


    if (!data || !result) return <div className="p-10 text-center text-gray-400">Analysis not found.</div>

    const { profile, scores, narrative } = result

    // Clean rounding for the UI
    const capacityScore = Math.round(scores.capacityScore || 0)
    const behavioralScore = Math.round(scores.behavioralScore || 0)
    const calibrationScore = Math.round(scores.calibrationScore || 0)
    const weightedScore = Math.round(scores.weightedScore || 0)

    const downloadPDF = async () => {
      if (!reportRef.current) return
      setIsExporting(true)
      const canvas = await html2canvas(reportRef.current, { scale: 2 })
      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF("p", "mm", "a4")
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight)
      pdf.save(`Risk-Archetype-Report.pdf`)
      setIsExporting(false)
    }

    return (
      <div className="min-h-screen bg-[#F8FAFC] py-16 px-4 font-sans text-slate-900">
        <div className="max-w-4xl mx-auto flex justify-end mb-8">
          <button onClick={downloadPDF} disabled={isExporting} className="bg-white border border-slate-200 text-slate-800 px-8 py-3 rounded-2xl text-xs font-bold shadow-sm hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50 tracking-widest uppercase">
            {isExporting ? "Building Report..." : "Export Assessment PDF"}
          </button>
        </div>

        <div ref={reportRef} className="max-w-4xl mx-auto bg-white rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] overflow-hidden border border-slate-100">
          
          {/* ARTISTIC HEADER */}
          <div className="p-20 text-center relative overflow-hidden bg-slate-50 border-b border-slate-100">
            <div className="relative z-10">
              <div className="inline-block px-4 py-1.5 rounded-full bg-white border border-slate-200 text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 mb-8 shadow-sm">
                Archetype Analysis
              </div>
              <h1 className="text-6xl font-black mb-6 tracking-tighter text-slate-900 uppercase italic">
                  {profile.archetype?.name}
              </h1>
              <p className="text-xl text-slate-500 max-w-xl mx-auto font-light leading-relaxed">
                {profile.archetype?.description}
              </p>
            </div>
            <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
          </div>

          <div className="p-16">
            {/* THE "ALIGNMENT BRIDGE" */}
            <div className="mb-20">
              <div className="flex justify-between items-end mb-4 px-2">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Emotional Comfort vs. Financial Ability</h3>
                <span className={`text-[10px] font-bold px-3 py-1 rounded-full border ${profile.alignmentSeverity === 'Severe' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                  Alignment: {profile.alignmentSeverity}
                </span>
              </div>
              <div className="h-20 bg-slate-50 rounded-3xl p-2 flex items-center relative border border-slate-100 shadow-inner">
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-200 border-dashed border-l"></div>
                
                <div className="absolute h-12 w-12 bg-white shadow-xl rounded-2xl border border-slate-100 flex flex-col items-center justify-center transition-all duration-1000" style={{ left: `calc(${behavioralScore}% - 24px)` }}>
                  <span className="text-[9px] font-black uppercase text-blue-500">Emotion</span>
                  <span className="text-xs font-bold">{behavioralScore}</span>
                </div>
                
                <div className="absolute h-12 w-12 bg-slate-900 shadow-xl rounded-2xl flex flex-col items-center justify-center transition-all duration-1000" style={{ left: `calc(${capacityScore}% - 24px)` }}>
                  <span className="text-[9px] font-black uppercase text-slate-300">Ability</span>
                  <span className="text-xs font-bold text-white">{capacityScore}</span>
                </div>
              </div>
              <div className="mt-4 flex justify-between text-[9px] font-bold uppercase tracking-widest text-slate-400 px-2">
                <span>Conservative</span>
                <span>Aggressive</span>
              </div>
            </div>

            {/* DIAGNOSTIC NUMBERS GRID */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-20">
              {[
                { 
                  label: "Financial Capacity", 
                  val: capacityScore, 
                  tip: "Capacity Score", 
                  color: "text-slate-900",
                  desc: "How much market volatility your financial structure can actually survive.",
                  hi: "You have significant room for error and can afford to take higher risks.",
                  lo: "Little margin for error; market losses could directly impact your security."
                },
                { 
                  label: "Behavioral Profile", 
                  val: behavioralScore, 
                  tip: "Behavioral Score", 
                  color: "text-blue-600",
                  desc: "Your psychological comfort level with uncertainty and market swings.",
                  hi: "You are comfortable with high volatility for potential long-term gain.",
                  lo: "You prioritize stability and are sensitive to short-term losses."
                },
                { 
                  label: "Self-Calibration", 
                  val: calibrationScore, 
                  tip: "Calibration Score", 
                  color: "text-emerald-600",
                  desc: "Measures the alignment between your perceived risk and your actual ability.",
                  hi: "Your perception of risk matches your financial reality perfectly.",
                  lo: "Significant disconnect; you may be taking more (or less) risk than you realize."
                },
                { 
                  label: "Composite Risk", 
                  val: weightedScore, 
                  tip: "Risk Orientation", 
                  color: "text-purple-600",
                  desc: "A combined view of your capacity, behavior, and structural needs.",
                  hi: "Growth-focused strategy with the capacity to support it.",
                  lo: "Preservation-focused strategy based on either preference or necessity."
                }
              ].map((item, idx) => (
                <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:border-slate-200 transition-colors group">
                  <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center justify-between">
                    {item.label}
                    <DiagnosticTooltip 
                      title={item.tip} 
                      definition={item.desc}
                      highMeaning={item.hi}
                      lowMeaning={item.lo}
                    />
                  </div>
                  <div className={`text-2xl font-black ${item.color}`}>
                    {item.val}<span className="text-[10px] text-slate-300 font-medium ml-0.5">/100</span>
                  </div>
                </div>
              ))}
            </div>

            {/* STRATEGIC INTERPRETATION CARD */}
            <div className="mb-20 bg-gradient-to-br from-slate-50 to-white p-12 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <h2 className="text-3xl font-bold mb-8 tracking-tight text-slate-900">Expert Insight</h2>
              <div className="space-y-6">
                {loadingAI ? (
                  <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                    <div className="h-4 bg-slate-200 rounded w-full"></div>
                  </div>
                ) : (
                  <>
                    <p className="text-xl font-medium text-slate-700 leading-snug">
                      {aiReport?.summary || narrative?.executiveSummary}
                    </p>
                    <div className="grid md:grid-cols-2 gap-8 pt-8 border-t border-slate-200/60">
                      <div>
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 mb-3">Alignment Perspective</h4>
                        <p className="text-sm text-slate-500 leading-relaxed">{aiReport?.alignmentAnalysis}</p>
                      </div>
                      <div>
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-600 mb-3">Risk Dynamics</h4>
                        <p className="text-sm text-slate-500 leading-relaxed">{aiReport?.riskDynamics}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* ACTION ROADMAP */}
            <div className="bg-slate-900 p-12 rounded-[3.5rem] text-white relative overflow-hidden">
              <h3 className="text-2xl font-bold mb-12 text-center tracking-tight relative z-10">Strategic Action Items</h3>
              <div className="grid md:grid-cols-2 gap-12 relative z-10">
                  <div className="bg-white/5 p-8 rounded-3xl border border-white/10">
                      <div className="text-blue-400 text-[10px] font-black uppercase tracking-[0.3em] mb-6">Strengths to Leverage</div>
                      <ul className="space-y-6">
                          {profile.archetype?.strengths?.map((s:any, i:any) => (
                              <li key={i} className="flex gap-4">
                                  <span className="text-blue-500 font-bold">0{i+1}</span>
                                  <p className="text-sm text-slate-300 leading-relaxed font-medium">{s}</p>
                              </li>
                          ))}
                      </ul>
                  </div>
                  <div className="bg-white/5 p-8 rounded-3xl border border-white/10">
                      <div className="text-orange-400 text-[10px] font-black uppercase tracking-[0.3em] mb-6">Hazards to Mitigate</div>
                      <ul className="space-y-6">
                          {profile.archetype?.watchouts?.map((w:any, i:any) => (
                              <li key={i} className="flex gap-4">
                                  <span className="text-orange-500 font-bold">/</span>
                                  <p className="text-sm text-slate-300 leading-relaxed font-medium">{w}</p>
                              </li>
                          ))}
                      </ul>
                  </div>
              </div>
              {aiReport?.behavioralInsight && (
                  <div className="mt-12 pt-10 border-t border-white/10 text-center relative z-10">
                      <p className="italic text-slate-400 text-sm max-w-xl mx-auto leading-relaxed">
                          "{aiReport?.behavioralInsight}"
                      </p>
                  </div>
              )}
              {/* Background design flair */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
            </div>
              {/* DISCOVERY CALL CTA - MINIMALIST & PROFESSIONAL */}
              <div className="mt-24 mb-10 pt-16 border-t border-slate-100 text-center">
                <div className="inline-block px-4 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-[0.3em] mb-6">
                  Strategic Next Step
                </div>
                
                <h3 className="text-4xl font-black mb-6 tracking-tight text-slate-900 italic uppercase">
                  Align Strategy With Insight
                </h3>

                <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed mb-10 font-light">
                  Your assessment highlights important behavioral and financial considerations. 
                  Let’s discuss how these insights can inform a <span className="text-slate-900 font-medium">thoughtful retirement strategy</span> specifically aligned with your goals.
                </p>

                <div className="flex flex-col items-center">
                  <a
                    href="https://GWMRetirementSimplified.as.me/?appointmentType=82720673"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative inline-flex items-center justify-center bg-slate-900 text-white font-bold px-12 py-5 rounded-2xl shadow-xl hover:bg-blue-600 transition-all duration-300 active:scale-95 tracking-widest uppercase text-xs"
                  >
                    Schedule Your Discovery Call
                    <svg className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </a>
                </div>
              </div>
            {/* FOOTER */}
            <div className="mt-16 text-center border-t border-slate-100 pt-10">
              <p className="text-[9px] text-slate-300 font-bold uppercase tracking-[0.5em] max-w-md mx-auto">
                {narrative?.advisoryNote}
              </p>
            </div>
          </div>
        </div>
      </div>
    )
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<div className="p-10">Loading results...</div>}>
      <ResultsContent />
    </Suspense>
  )
}