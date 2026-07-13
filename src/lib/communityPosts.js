import { supabase } from "./supabaseClient";
import { moderateText } from "./moderation";

const BUCKET = "community-media";

export async function listCommunities() {
  const { data, error } = await supabase.from("communities").select("*").eq("is_open", true);
  if (error) throw error;
  return data;
}

export async function createCommunity({ name, description, isOpen }) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sign in first.");

  const joinCode = isOpen ? null : Math.random().toString(36).slice(2, 8).toUpperCase();

  const { data, error } = await supabase
    .from("communities")
    .insert({ name, description, is_open: isOpen, join_code: joinCode, created_by: user.id })
    .select()
    .single();
  if (error) throw error;

  await supabase.from("community_members").insert({ community_id: data.id, user_id: user.id });
  return data;
}

export async function joinByCode(code) {
  const { data: community, error } = await supabase
    .from("communities")
    .select("*")
    .eq("join_code", code.toUpperCase())
    .single();
  if (error || !community) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sign in first.");

  await supabase.from("community_members").insert({ community_id: community.id, user_id: user.id });
  return community;
}

export async function joinOpenCommunity(communityId) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sign in first.");
  const { error } = await supabase
    .from("community_members")
    .insert({ community_id: communityId, user_id: user.id });
  if (error) throw error;
}

export async function listPosts(communityId) {
  const { data, error } = await supabase
    .from("community_posts")
    .select("*, post_comments(*)")
    .eq("community_id", communityId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createPost(communityId, { text, file }) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sign in first.");

  if (text) {
    const flagged = await moderateText(text);
    if (flagged) throw new Error("This post was flagged and needs review before it can be shared.");
  }

  let mediaUrl = null;
  let mediaType = null;
  if (file) {
    const path = `${communityId}/${user.id}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file);
    if (uploadError) throw uploadError;
    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
    mediaUrl = urlData.publicUrl;
    mediaType = file.type.startsWith("video") ? "video" : "image";
  }

  const { data, error } = await supabase
    .from("community_posts")
    .insert({ community_id: communityId, author_id: user.id, text, media_url: mediaUrl, media_type: mediaType })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function addComment(postId, text) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sign in first.");

  const flagged = await moderateText(text);
  if (flagged) throw new Error("This comment was flagged and needs review before it can be posted.");

  const { data, error } = await supabase
    .from("post_comments")
    .insert({ post_id: postId, author_id: user.id, text })
    .select()
    .single();
  if (error) throw error;
  return data;
}
