import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface AnalyzeRequest {
  user_id: string;
  role: string;
  package: string;
  guideline_type: string;
  uploaded_file_url?: string;
  text_content?: string;
}

interface AnalyzeResponse {
  strengths: string[];
  improvements: string[];
  optimized_version: string[];
  detected_issues: string[];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const body: AnalyzeRequest = await req.json();

    if (!body.user_id || !body.role || !body.package || !body.guideline_type) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const mockResponse: AnalyzeResponse = {
      strengths: [
        "Klare Struktur und logischer Aufbau",
        "Gute Gesprächseröffnung mit Rapport-Aufbau",
        "Starker Abschluss mit klarer Handlungsaufforderung",
        "Professionelle Sprache durchgehend"
      ],
      improvements: [
        "Zu wenig Bedarfsanalyse und Qualifizierungsfragen",
        "Einwände werden nicht ausreichend antizipiert",
        "Kundenemotionen werden kaum berücksichtigt",
        "Fehlende Nutzenargumentation bei Features"
      ],
      optimized_version: [
        "1. Warmstart & Rapport aufbauen (30 Sek.)",
        "2. Situationsanalyse mit offenen Fragen (2 Min.)",
        "3. Qualifizierung & Bedarfsermittlung (3 Min.)",
        "4. Bedarf vertiefen mit emotionalen Triggern (2 Min.)",
        "5. Nutzenargumentation statt Feature-Liste (3 Min.)",
        "6. Einwandvorwegnahme proaktiv ansprechen (1 Min.)",
        "7. Testabschluss & Commitment einholen (1 Min.)",
        "8. Klare nächste Schritte vereinbaren"
      ],
      detected_issues: [
        "Zu produkt-fokussiert statt kunden-fokussiert",
        "Keine emotionale Ebene im Gespräch",
        "Zu schnell zum Abschluss, ohne echte Überzeugung"
      ]
    };

    return new Response(
      JSON.stringify(mockResponse),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in analyze-guideline function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});