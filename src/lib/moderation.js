import { supabase } from "./supabaseClient";

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
    return false;
  }
}

export async function checkImage(imageUrl) {
  console.warn("checkImage() is a stub — images are not being moderated yet.");
  return false;
}

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
  const { error } = await supabase.from("reports").update({ status }).eq("id", reportId);
  if (error) throw error;
}
