import { supabase } from "./supabaseClient";

export async function signUp({ email, password, name, role, ministryName, city }) {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });
  if (authError) throw authError;
  if (!authData.user) throw new Error("Account created, but no session returned. Try signing in.");

  const { error: profileError } = await supabase.from("profiles").insert({
    id: authData.user.id,
    display_name: name,
    role,
    ministry_name: role === "ministry" ? ministryName : null,
    city,
    email,
  });
  if (profileError) throw profileError;

  return await getCurrentProfile();
}

export async function signIn({ email, password }) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return await getCurrentProfile();
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function getSession() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

export async function getCurrentProfile() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (error) throw error;
  return data;
}
