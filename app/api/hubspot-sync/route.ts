import { NextResponse } from "next/server"

const HUBSPOT_BASE = "https://api.hubapi.com"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, firstName, lastName, investableAssets } = body

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 })
    }

    const today = new Date().toISOString().split("T")[0]

    // 🔍 SEARCH BY EMAIL
    const searchRes = await fetch(
      `${HUBSPOT_BASE}/crm/v3/objects/contacts/search`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filterGroups: [
            {
              filters: [
                {
                  propertyName: "email",
                  operator: "EQ",
                  value: email,
                },
              ],
            },
          ],
        }),
      }
    )

    const searchData = await searchRes.json()

    // ✅ IF EXISTS → UPDATE
    if (searchData.total > 0) {
      const contactId = searchData.results[0].id

      await fetch(
        `${HUBSPOT_BASE}/crm/v3/objects/contacts/${contactId}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            properties: {
              investable_assets: investableAssets,
              has_taken_risk_analyzer: "true",
              risk_analyzer_taken_on: today,
            },
          }),
        }
      )

      return NextResponse.json({ message: "Contact updated" })
    }

    // 🆕 IF NOT EXISTS → CREATE
    await fetch(`${HUBSPOT_BASE}/crm/v3/objects/contacts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        properties: {
          email,
          firstname: firstName,
          lastname: lastName,
          investable_assets: investableAssets,
          has_taken_risk_analyzer: "true",
          risk_analyzer_taken_on: today,
        },
      }),
    })

    return NextResponse.json({ message: "Contact created" })

  } catch (error) {
    console.error("HubSpot sync error:", error)
    return NextResponse.json(
      { error: "HubSpot sync failed" },
      { status: 500 }
    )
  }
}
