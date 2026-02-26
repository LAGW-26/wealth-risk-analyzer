import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Destructure data from the Results page fetch
    const { 
      email = "", 
      firstName = "", 
      lastName = "", 
      investableAssets = "" 
    } = body;

    // Guard: Ensure we have an email before proceeding
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    const HUBSPOT_TOKEN = process.env.HUBSPOT_TOKEN;

    // STEP 1: Search for contact by email to prevent duplicates
    const searchResponse = await fetch("https://api.hubapi.com/crm/v3/objects/contacts/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HUBSPOT_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        filterGroups: [{
          filters: [{ propertyName: "email", operator: "EQ", value: email.trim() }]
        }],
        limit: 1
      }),
    });

    const searchData = await searchResponse.json();
    const existingContactId = searchData.results?.[0]?.id;

    // STEP 2: Prepare the properties
    // Ensure 'firstname' and 'lastname' are lowercase as per HubSpot default internal names
    const properties = {
      email: email.trim(),
      firstname: firstName,
      lastname: lastName,
      investable_assets: investableAssets, // e.g., "$100k-$500k"
      has_taken_risk_analyzer: "true",
      risk_analyzer_taken_on: new Date().toISOString().split("T")[0], 
    };

    // STEP 3: Create or Update (Upsert)
    const endpoint = existingContactId 
      ? `https://api.hubapi.com/crm/v3/objects/contacts/${existingContactId}`
      : "https://api.hubapi.com/crm/v3/objects/contacts";
    
    const method = existingContactId ? "PATCH" : "POST";

    const response = await fetch(endpoint, {
      method,
      headers: {
        Authorization: `Bearer ${HUBSPOT_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ properties }),
    });

    const responseData = await response.json();

    if (!response.ok) {
      // This log is vital: if the dropdown strings don't match, this will tell you why
      console.error("HubSpot API Error:", JSON.stringify(responseData, null, 2));
      return NextResponse.json({ error: "Sync failed", details: responseData }, { status: 400 });
    }

    return NextResponse.json({ success: true, mode: existingContactId ? "updated" : "created" });

  } catch (error) {
    console.error("Route Crash:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}