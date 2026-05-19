import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from 'next/server'

export async function POST(req) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Allow both root admin and managers to create users
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin' && profile?.role !== 'manager') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { email, password, role = 'candidate', name = '' } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Only root admin can create manager accounts
    if (role === 'manager' && profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Only the root admin can create manager accounts' }, { status: 403 });
    }

    // Prevent creating another root admin via UI
    if (role === 'admin') {
      return NextResponse.json({ error: 'Cannot create an admin account via this panel' }, { status: 403 });
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
      return NextResponse.json({ error: createError.message }, { status: 400 });
    }

    const userId = created.user.id;
    const profilePayload = {
      id: userId,
      role: role,
      ...(name?.trim() ? { name: name.trim() } : {}),
    };
    const { error: profileError } = await supabaseAdmin.from("profiles").insert(profilePayload);

    if (profileError) {
      // Cleanup auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error('[create-user] Internal error:', err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
