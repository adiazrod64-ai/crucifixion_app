import { supabase } from "./supabaseClient";

export async function listChurches() {
  const { data, error } = await supabase.from("churches").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createChurchPage({ name, city, description, paypalHandle, cashappHandle, venmoHandle }) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sign in first.");

  const { data, error } = await supabase
    .from("churches")
    .insert({
      name,
      city,
      description,
      paypal_handle: paypalHandle,
      cashapp_handle: cashappHandle,
      venmo_handle: venmoHandle,
      owned_by: user.id,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Build a real PayPal.me / Cash App deep link for a given amount. */
export function buildDonationLinks(church, amount) {
  return {
    paypal: church.paypal_handle ? `https://paypal.me/${church.paypal_handle}/${amount}` : null,
    cashapp: church.cashapp_handle
      ? `https://cash.app/$${church.cashapp_handle.replace("$", "")}/${amount}`
      : null,
  };
}

export async function getAppDonationConfig() {
  const { data, error } = await supabase.from("app_donation_config").select("*").eq("id", 1).single();
  if (error) throw error;
  return data;
}

export async function saveAppDonationConfig({ paypalHandle, cashappHandle }) {
  const { error } = await supabase
    .from("app_donation_config")
    .update({ paypal_handle: paypalHandle, cashapp_handle: cashappHandle })
    .eq("id", 1);
  if (error) throw error;
}
