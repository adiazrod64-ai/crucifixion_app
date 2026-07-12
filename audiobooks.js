import { supabase } from "./supabaseClient";
import { moderateText } from "./moderation";

const BUCKET = "audiobooks";

/**
 * Upload an audio file + save its metadata.
 * @param {File} file - the audio file from an <input type="file"> element
 * @param {{title: string, author: string, type: 'Audiobook'|'Sermon', tag?: string}} meta
 */
export async function uploadAudiobook(file, meta) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in to upload.");

  // Screen the title/author text before anything is saved
  const flagged = await moderateText(`${meta.title} ${meta.author || ""}`);
  if (flagged) throw new Error("This submission was flagged and needs review before it can be posted.");

  const path = `${user.id}/${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file);
  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);

  const { data, error } = await supabase
    .from("audiobooks")
    .insert({
      title: meta.title,
      author: meta.author,
      type: meta.type || "Audiobook",
      tag: meta.tag || null,
      file_url: urlData.publicUrl,
      uploaded_by: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** List all audiobooks/sermons, most recent first. */
export async function listAudiobooks() {
  const { data, error } = await supabase
    .from("audiobooks")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

/** Search by title or author. */
export async function searchAudiobooks(query) {
  const { data, error } = await supabase
    .from("audiobooks")
    .select("*")
    .or(`title.ilike.%${query}%,author.ilike.%${query}%`)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

/**
 * "Download" just means: fetch the file from its public URL.
 * In a web app, this triggers a normal browser download.
 * In a mobile app (Expo), you'd instead pass audiobook.file_url to
 * expo-file-system's downloadAsync() to save it for offline playback.
 */
export function getDownloadUrl(audiobook) {
  return audiobook.file_url;
}
