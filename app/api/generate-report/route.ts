import { NextResponse } from "next/server"
import { Mistral } from "@mistralai/mistralai"

const mistral = new Mistral({
  apiKey: process.env.MISTRAL_API_KEY!,
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { scores, diagnostics, profile } = body

    if (!scores || !diagnostics || !profile) {
      return NextResponse.json(
        { error: "Missing structured diagnostics payload" },
        { status: 400 }
      )
    }

    const structuredInput = {
      scores,
      diagnostics,
      profile: {
        riskCategory: profile.riskCategory,
        archetype: profile.archetype,
        alignmentSeverity: profile.alignmentSeverity,
        sequenceRiskExposure: profile.sequenceRiskExposure,
        calibrationRisk: profile.calibrationRisk,
        structuralCapacity: profile.structuralCapacity,
        riskPerceptionGap: profile.riskPerceptionGap,
      },
    }

    console.log("Sending structured input to Mistral")

    const completion = await mistral.chat.complete({
      model: "mistral-large-latest", // better for structured output
      temperature: 0.3,
      maxTokens: 1200,
      responseFormat: { type: "json_object" }, // forces valid JSON
      messages: [
        {
          role: "system",
          content: `

You are a behavioral risk analyst.

You are interpreting psychological and structural risk diagnostics derived from 18 behavioral assessment questions.

The individual does NOT necessarily have a financial plan or portfolio in place. 
Do NOT assume they have investments, an allocation, or an existing strategy.
Do NOT refer to “your plan,” “your portfolio,” or “your investments.”

Your task is to interpret:
- Behavioral risk tendencies
- Structural financial capacity
- Alignment gaps between perception and reality
- Emotional response patterns to uncertainty

This is a diagnostic interpretation, not investment advice.

Guidelines:
- Be analytical and psychologically insightful.
- Avoid generic financial planning language.
- Do not repeat ideas across sections.
- Each section must provide distinct insight.
- Do not use filler or motivational phrasing.
- Do not give allocation suggestions.
- Do not restate the same caution in multiple ways.
- Avoid phrases like “small adjustments” or “slight shifts.”
- Do not mention numeric scores.

Return ONLY valid JSON in this exact format:

{
  "summary": "",
  "alignmentAnalysis": "",
  "riskDynamics": "",
  "capacityPerspective": "",
  "behavioralInsight": ""
}
`

        },
        {
          role: "user",
          content: JSON.stringify(structuredInput),
        },
      ],
    })

    const rawContent = completion.choices?.[0]?.message?.content

    if (!rawContent) {
      return NextResponse.json(
        { error: "Empty AI response" },
        { status: 500 }
      )
    }

    let content: string

    if (typeof rawContent === "string") {
      content = rawContent
    } else {
      // Safely extract only text chunks
      content = rawContent
        .filter((chunk): chunk is { type: "text"; text: string } => chunk.type === "text")
        .map(chunk => chunk.text)
        .join("")
    }



    if (!content) {
      return NextResponse.json(
        { error: "Empty AI response" },
        { status: 500 }
      )
    }

    let aiReport

    try {
      aiReport = JSON.parse(content)
    } catch (err) {
      console.error("JSON Parse Error:", err)
      console.error("Raw AI content:", content)

      return NextResponse.json(
        { error: "AI returned invalid JSON", raw: content },
        { status: 500 }
      )
    }

    return NextResponse.json(aiReport)

  } catch (error: any) {
    console.error("Mistral API Error:", error?.message)

    return NextResponse.json(
      { error: error?.message || "Failed to generate report" },
      { status: 500 }
    )
  }
}
