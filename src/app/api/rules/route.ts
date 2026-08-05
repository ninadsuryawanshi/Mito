import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/db/server';
import { expandRuleKeywords } from '@/lib/ai/gemini';
import { startOfMonth } from 'date-fns';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Fetch personal rules
    const { data: rules, error } = await supabase
      .from('personal_rules')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Fetch rule traces for the current month
    const startOfCurrentMonth = startOfMonth(new Date()).toISOString();
    const { data: traces } = await supabase
      .from('rule_traces')
      .select('rule_id')
      .eq('user_id', user.id)
      .gte('triggered_at', startOfCurrentMonth);

    // Count breaches per rule_id
    const breachCounts: Record<string, number> = {};
    (traces || []).forEach((t: { rule_id: string }) => {
      if (t.rule_id) {
        breachCounts[t.rule_id] = (breachCounts[t.rule_id] || 0) + 1;
      }
    });

    // Attach monthly_breaches_count to rules
    const rulesWithCounts = (rules || []).map((r: any) => ({
      ...r,
      monthly_breaches_count: breachCounts[r.rule_id] || 0,
    }));

    return NextResponse.json({ rules: rulesWithCounts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const description = String(body?.description || '').trim();

    if (!description) {
      return NextResponse.json({ error: 'description required' }, { status: 400 });
    }

    const expanded = await expandRuleKeywords(description);
    const keywordSet = new Set<string>([
      description.toLowerCase(),
      ...expanded.map((k) => String(k).toLowerCase().trim()).filter(Boolean),
    ]);

    const keywords = Array.from(keywordSet).slice(0, 20);

    const { data: rule, error } = await supabase
      .from('personal_rules')
      .insert({
        user_id: user.id,
        description,
        keywords,
        active: true,
      })
      .select('*')
      .single();

    if (error) throw error;

    return NextResponse.json({ rule, success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const ruleId = String(body?.rule_id || '');
    const active = body?.active;

    if (!ruleId || typeof active !== 'boolean') {
      return NextResponse.json({ error: 'rule_id and active required' }, { status: 400 });
    }

    const { data: rule, error } = await supabase
      .from('personal_rules')
      .update({ active })
      .eq('rule_id', ruleId)
      .eq('user_id', user.id)
      .select('*')
      .single();

    if (error) throw error;

    return NextResponse.json({ rule, success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const ruleId = String(body?.rule_id || '');

    if (!ruleId) {
      return NextResponse.json({ error: 'rule_id required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('personal_rules')
      .delete()
      .eq('rule_id', ruleId)
      .eq('user_id', user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}