import { supabase } from "./supabaseClient";
import { moderateText } from "./moderation";

const BUCKET = "audiobooks";

export async function uploadAudiobook(file, meta) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in to upload.");

  const flagged = await moderateText(`${meta.title} ${meta.author || ""}`);
  if (flagged) throw new Error("This submission was flagged and needs review before it can be posted.");

  const path = `${user.id}/${Date.now()}-${file.name

