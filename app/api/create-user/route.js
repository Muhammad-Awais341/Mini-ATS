import { createClient } from "@supabase/supabase-js";

export async function POST(req) {
  try {
    const { email, password, role } = await req.json();

    if (!email || !password || !role) {
      return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: created, error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (createError) {
      return new Response(JSON.stringify({ error: createError.message }), { status: 400 });
    }

    const userId = created.user.id;
    const { error: profileError } = await supabaseAdmin.from("profiles").insert({
      id: userId,
      role,
    });

    if (profileError) {
      return new Response(JSON.stringify({ error: profileError.message }), { status: 400 });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
  }
}
