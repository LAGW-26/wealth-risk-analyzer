import { NextResponse } from "next/server";

// 1. Type Safety Interface
interface RiskAssessmentRequest {
  timeHorizon?: string | number;
  assets?: string | number;
  incomeStability?: string | number;
  liquidityBuffer?: string | number;
  dependents?: string | number;
  lossReaction?: string | number;
  volatilityPreference?: string | number;
  regretSensitivity?: string | number;
  drawdownThreshold?: string | number;
  ambiguityTolerance?: string | number;
  downturnBehavior?: string | number;
  selfAssessment?: string | number;
  reverseLossGrowth?: string | number;
  marketExperience?: string | number;
  newsSensitivity?: string | number;
  decisionStyle?: string | number;
}

export async function POST(req: Request) {
  try {
    const data: RiskAssessmentRequest = await req.json();

    /* ============================================================
        1️⃣ HELPERS & VALIDATION (No Logic Skimming)
    ============================================================ */
    const safeNum = (val: unknown): number => {
      const parsed = Number(val);
      return Number.isFinite(parsed) ? parsed : NaN;
    };

    const normalize = (value: number, min: number, max: number): number => {
      if (!Number.isFinite(value) || isNaN(value)) return 0;
      if (max <= min) return 0;
      const clamped = Math.min(Math.max(value, min), max);
      return ((clamped - min) / (max - min)) * 100;
    };

    const requiredFields: (keyof RiskAssessmentRequest)[] = [
      "timeHorizon", "assets", "incomeStability", "liquidityBuffer", "dependents",
      "lossReaction", "volatilityPreference", "regretSensitivity", "drawdownThreshold",
      "ambiguityTolerance", "downturnBehavior", "selfAssessment", "reverseLossGrowth",
      "marketExperience", "newsSensitivity", "decisionStyle",
    ];

    for (const field of requiredFields) {
      if (!Number.isFinite(safeNum(data[field]))) {
        console.error(`❌ API VALIDATION FAILED: Field [${field}] is missing.`);
        return NextResponse.json({ error: `Missing field: ${field}` }, { status: 400 });
      }
    }

    /* ============================================================
        2️⃣ CORE CALCULATIONS (Raw Scores)
    ============================================================ */
    const capacityIndex = (
      normalize(safeNum(data.timeHorizon), 1, 4) +
      normalize(safeNum(data.assets), 1, 5) +
      normalize(safeNum(data.incomeStability), 1, 4) +
      normalize(safeNum(data.liquidityBuffer), 1, 4) +
      normalize(safeNum(data.dependents), 1, 4)
    ) / 5;

    const behavioralIndex = (
      normalize(safeNum(data.lossReaction), 1, 4) +
      normalize(safeNum(data.volatilityPreference), 1, 4) +
      normalize(safeNum(data.regretSensitivity), 1, 4) +
      normalize(safeNum(data.drawdownThreshold), 1, 4) +
      normalize(safeNum(data.ambiguityTolerance), 1, 4) +
      normalize(safeNum(data.downturnBehavior), 1, 4)
    ) / 6;

    const reverseLossGrowth = 6 - safeNum(data.reverseLossGrowth);
    const calibrationIndex = (
      normalize(safeNum(data.selfAssessment), 1, 4) +
      normalize(reverseLossGrowth, 1, 4) +
      normalize(safeNum(data.marketExperience), 1, 4) +
      normalize(safeNum(data.newsSensitivity), 1, 4) +
      normalize(safeNum(data.decisionStyle), 1, 3)
    ) / 5;

    /* ============================================================
        3️⃣ ARCHETYPE SELECTION (BASED ON BEHAVIOR ONLY)
        This is the "Mirror" - it shows WHO they are emotionally.
    ============================================================ */
    let archetype = { name: "", description: "", strengths: [] as string[], watchouts: [] as string[], color: "" };

    if (behavioralIndex <= 25) {
      archetype = {
        name: "Steady Guardian",
        description: "You prioritize protecting capital and maintaining stability. You value sleep-at-night capital over aggressive growth.",
        strengths: ["Strong downside awareness", "Emotional steadiness"],
        watchouts: ["Inflation risk", "Purchasing power erosion"],
        color: "#1E3A8A",
      };
    } else if (behavioralIndex <= 45) {
      archetype = {
        name: "Conservative Preserver",
        description: "You prefer steady progress with controlled volatility. Preserving capital while allowing measured growth is central.",
        strengths: ["Downside sensitivity", "Stability-focused"],
        watchouts: ["May miss upside expansions"],
        color: "#2563EB",
      };
    } else if (behavioralIndex <= 65) {
      archetype = {
        name: "Strategic Navigator",
        description: "You maintain a thoughtful balance between growth and stability. You are comfortable with moderate fluctuations.",
        strengths: ["Adaptable across cycles", "Long-term perspective"],
        watchouts: ["Sharp drawdowns cause stress"],
        color: "#059669",
      };
    } else if (behavioralIndex <= 85) {
      archetype = {
        name: "Confident Builder",
        description: "You are oriented toward long-term growth and accept volatility as part of the journey.",
        strengths: ["High tolerance for fluctuations", "Strong conviction"],
        watchouts: ["Overconfidence during rallies"],
        color: "#D97706",
      };
    } else {
      archetype = {
        name: "Dynamic Accelerator",
        description: "You display a strong appetite for growth and accept meaningful volatility to maximize returns.",
        strengths: ["High return orientation", "Decisive mindset"],
        watchouts: ["Sequence risk exposure", "Liquidity stress in downturns"],
        color: "#DC2626",
      };
    }

    /* ============================================================
        4️⃣ SUSTAINABILITY & CEILING LOGIC (The Safety Guard)
    ============================================================ */
    const fragilityFactors = [
      safeNum(data.timeHorizon) <= 2 ? 1 : 0,
      safeNum(data.liquidityBuffer) <= 2 ? 1 : 0,
      safeNum(data.incomeStability) <= 2 ? 1 : 0,
    ];
    const fragilityScore = fragilityFactors.reduce((a, b) => a + b, 0);
    const sustainabilitySeverity = fragilityScore === 0 ? "Stable" : fragilityScore === 1 ? "Moderate Constraint" : "High Constraint";

    let compositeIndex = (behavioralIndex * 0.4) + (capacityIndex * 0.5) + (calibrationIndex * 0.1);

    // Apply the Structural Ceiling (DO NOT DELETE)
    let structuralCeiling = 100;
    if (capacityIndex < 50) structuralCeiling = 65;
    if (capacityIndex < 40) structuralCeiling = 55;
    if (capacityIndex < 30) structuralCeiling = 45;

    if (safeNum(data.timeHorizon) <= 2) structuralCeiling = Math.min(structuralCeiling, 50);
    if (safeNum(data.timeHorizon) <= 1) structuralCeiling = Math.min(structuralCeiling, 40);
    if (fragilityScore >= 2) structuralCeiling = Math.min(structuralCeiling, 45);

    // This is the final recommendation score
    const finalWeightedScore = Math.min(compositeIndex, structuralCeiling);

    /* ============================================================
        5️⃣ CATEGORY & ALLOCATION
    ============================================================ */
    let riskCategory = "";
    if (finalWeightedScore <= 25) riskCategory = "Capital Preservation";
    else if (finalWeightedScore <= 45) riskCategory = "Conservative";
    else if (finalWeightedScore <= 60) riskCategory = "Balanced";
    else if (finalWeightedScore <= 80) riskCategory = "Growth";
    else riskCategory = "Aggressive Growth";

    /* ============================================================
        6️⃣ RISK TENSION & DIAGNOSTICS
    ============================================================ */
    const riskTension = behavioralIndex - capacityIndex;
    const tensionLevel = Math.abs(riskTension) < 10 ? "Aligned" : riskTension > 0 ? "Overreaching" : "Underutilizing";
    const alignmentSeverity = Math.abs(riskTension) < 10 ? "Aligned" : Math.abs(riskTension) < 25 ? "Moderate" : "Severe";
    const calibrationRisk = calibrationIndex > 75 ? "Overconfidence Bias" : calibrationIndex < 40 ? "Low Self-Awareness" : "Calibrated";
    const sequenceRiskExposure = (sustainabilitySeverity === "High Constraint" && tensionLevel === "Overreaching") ? "High" : (sustainabilitySeverity !== "Stable") ? "Elevated" : "Moderate";

    /* ============================================================
        7️⃣ NARRATIVE LAYER (The Truth Bomb)
    ============================================================ */
    let executiveSummary = `Your psychological profile identifies you as a ${archetype.name} (${Math.round(behavioralIndex)}/100). `;
    
    // Check if the ceiling was applied
    if (behavioralIndex > finalWeightedScore + 15) {
      executiveSummary += `However, because your financial capacity and sustainability factors are currently constrained (${Math.round(capacityIndex)}/100), we have applied a safety ceiling. Your recommended strategy is adjusted to ${riskCategory} to ensure long-term retirement security.`;
    } else {
      executiveSummary += `Your financial capacity supports your behavioral profile, resulting in a ${riskCategory} recommendation.`;
    }

    /* ============================================================
        8️⃣ FINAL RESPONSE
    ============================================================ */
    return NextResponse.json({
      scores: {
        capacityScore: capacityIndex,
        behavioralScore: behavioralIndex,
        calibrationScore: calibrationIndex,
        weightedScore: finalWeightedScore,
        alignmentGap: Math.abs(riskTension),
      },
      diagnostics: { riskTension, tensionLevel, sustainabilitySeverity, fragilityScore },
      profile: {
        riskCategory, 
        archetype, 
        alignmentSeverity, 
        sequenceRiskExposure,
        calibrationRisk, 
        structuralCapacity: capacityIndex, 
        riskPerceptionGap: riskTension,
      },
      narrative: {
        executiveSummary,
        structuralCapacityExplanation: "Financial Risk Capacity reflects how much risk someone can financially survive — regardless of how they feel.",
        sequenceRiskExplanation: "Sequence Risk refers to the danger of experiencing market losses early in retirement while withdrawals are occurring.",
        allocationGuidance: `Based on your structural safety ceiling, your allocation should focus on ${riskCategory.toLowerCase()} principles.`,
        advisoryNote: "This assessment is educational and should be integrated with personalized planning."
      },
    });

  } catch (error: any) {
    console.error("Internal API Error:", error);
    return NextResponse.json({ error: "Internal Server Error", message: error.message }, { status: 500 });
  }
}