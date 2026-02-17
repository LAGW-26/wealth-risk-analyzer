"use client"

import { useState } from "react"

export default function RiskAssessmentPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleSubmit = async () => {
    setLoading(true)

    const sampleAnswers = {
      timeHorizon: 3,
      lossReaction: 2,
      volatilityPreference: 3,
      selfRiskLevel: 4
    }

    const res = await fetch("/api/analyze-risk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sampleAnswers)
    })

    const data = await res.json()
    setResult(data)
    setLoading(false)
  }

  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold mb-6">Risk Assessment Test</h1>

      <button
        onClick={handleSubmit}
        className="bg-black text-white px-4 py-2 rounded"
      >
        {loading ? "Analyzing..." : "Run Test Analysis"}
      </button>

      {result && (
        <pre className="mt-6 bg-gray-100 p-4 rounded">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  )
}
