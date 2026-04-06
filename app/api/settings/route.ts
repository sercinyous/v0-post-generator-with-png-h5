import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const formatType = request.nextUrl.searchParams.get("format");

  if (!formatType) {
    return NextResponse.json({ error: "format required" }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from("format_settings")
      .select("*")
      .eq("format_type", formatType)
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  try {
    const { formatType, settings, locked } = await request.json();

    if (!formatType) {
      return NextResponse.json(
        { error: "formatType required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("format_settings")
      .upsert(
        {
          format_type: formatType,
          settings,
          locked,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "format_type" }
      )
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 }
    );
  }
}
