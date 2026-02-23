type Answers = {
  timeHorizon: number
  lossReaction: number
  volatilityPreference: number
  selfRiskLevel: number
}

export function analyzeRisk(answers: Answers) {
  const capacityScore = answers.timeHorizon * 25

  const lossAversion = (5 - answers.lossReaction) * 20
  const volatilityTolerance = answers.volatilityPreference * 25

  const behavioralScore =
    lossAversion * 0.4 +
    volatilityTolerance * 0.6

  const finalScore = Math.min(behavioralScore, capacityScore)

  const consistencyGap = Math.abs(
    finalScore / 25 - answers.selfRiskLevel
  )

  const archetype = classifyArchetype(finalScore, consistencyGap)

  return {
    capacityScore,
    behavioralScore,
    finalScore,
    consistencyGap,
    archetype
  }
}

function classifyArchetype(score: number, gap: number) {
  if (gap > 1.5) return "Inconsistent Risk Profile"
  if (score < 30) return "Capital Stability Protector"
  if (score < 50) return "Structured Growth Planner"
  if (score < 70) return "Balanced Strategic Investor"
  if (score < 85) return "Long-Term Growth Architect"
  return "Opportunistic Risk Taker"
}
