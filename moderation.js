import { supabase } from "./supabaseClient";

/**
 * Screens text with OpenAI's moderation endpoint before it's saved anywhere.
 * Returns true if the text was flagged (should be blocked), false if it's clear.
 *
 * SECURITY WARNING: this calls OpenAI directly from the browser using
 * VITE_OPENAI_API_KEY, which means that key is visible to anyone who opens
 * dev tools. That's fine while you're building/testing alone. Before you
 * let real strangers use the app, move this into a Supabase Edge Function
 * so the key stays server-side. See the bottom of this file for the
 * Edge Function version of this same code.
 */
export async function moderateText(text) {
  if (!text || !text.trim()) return false;
  const key = import.meta.env.VITE_OPENAI_API_KEY;
  if (!key) {
    console.warn("No OpenAI key set — skipping text moderation. Set VITE_OPENAI_API_KEY in .env.");
    return false;
  }

  try {
    const res = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({ input: text }),
    });
    const data = await res.json();
    return Boolean(data?.results?.[0]?.flagged);
  } catch (err) {
    console.error("Moderation check failed, allowing content through:", err);
    // Decide your own fallback behavior here. Failing open (allowing content)
    // keeps the app usable if the moderation API is briefly down; failing
    // closed (blocking content) is safer but can frustrate users during an outage.
    return false;
  }
}

/**
 * STUB — fill this in once you pick an image moderation provider.
 * Google Cloud Vision SafeSearch or AWS Rekognition both work well.
 * For now this always returns "not flagged" — real images are NOT
 * currently being screened. Don't launch publicly until this is wired up.
 */
export async function checkImage(imageUrl) {
  console.warn("checkImage() is a stub — images are not being moderated yet.");
  return false;
}

/** Lets any user flag a post/comment/audiobook for human review. */
export async function reportContent({ contentType, contentId, reason }) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sign in first.");

  const { error } = await supabase.from("reports").insert({
    content_type: contentType,
    content_id: contentId,
    reported_by: user.id,
    reason,
  });
  if (error) throw error;
}

/**
 * Pending reports for your admin review screen.
 * Build a simple page that calls this and shows a "Remove" / "Dismiss" button.
 */
export async function listPendingReports() {
  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function resolveReport(reportId, status) {
  // status: 'reviewed' or 'removed'
  const { error } = await supabase.from("reports").update({ status }).eq("id", reportId);
  if (error) throw error;
}

/*
==============================================================
EDGE FUNCTION VERSION (server-side, hides your OpenAI key)
Once you're ready for this, run: supabase functions new moderate-text
and paste this into supabase/functions/moderate-text/index.ts:

  import { serve } from "https://deno.land/std/http/server.ts";

  serve(async (req) => {
    const { text } = await req.json();
    const res = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("OPENAI_API_KEY")}`,
      },
      body: JSON.stringify({ input: text }),
    });
    const data = await res.json();
    return new Response(JSON.stringify({ flagged: data?.results?.[0]?.flagged ?? false }), {
      headers: { "Content-Type": "application/json" },
    });
  });

Then set the key with: supabase secrets set OPENAI_API_KEY=sk-...
And call it from moderateText() with supabase.functions.invoke("moderate-text", { body: { text } })
instead of calling OpenAI directly.
==============================================================
*/
