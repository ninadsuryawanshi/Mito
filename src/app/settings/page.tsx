'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/db/client';
import { Button, Input, MonoLabel } from '@/components/ui';
import { computeWHORecommendations } from '@/lib/ai/gemini';

const ACTIVITY_OPTIONS = [
  { value: 'sedentary', label: 'Sedentary', sub: 'Little/no exercise' },
  { value: 'light', label: 'Light', sub: '1–3 days/wk' },
  { value: 'moderate', label: 'Moderate', sub: '3–5 days/wk' },
  { value: 'active', label: 'Active', sub: '6–7 days/wk' },
] as const;

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'share' | 'export'>('profile');
  const [viewers, setViewers] = useState<any[]>([]);
  const [newViewer, setNewViewer] = useState({ name: '', email: '', permission_level: 'summary', can_see_price: false });
  const [addingViewer, setAddingViewer] = useState(false);
  const [viewerLoading, setViewerLoading] = useState(false);
  const [copiedToken, setCopiedToken] = useState('');
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    fetch('/api/profile').then(r => r.json()).then(({ profile: p }) => setProfile(p));
    fetch('/api/viewer').then(r => r.json()).then(({ viewers: v }) => setViewers(v || []));
  }, []);

  function updateField(field: string, value: any) {
    setProfile((p: any) => ({ ...p, [field]: value }));
  }

  function recomputeGoals() {
    if (!profile?.weight_kg || !profile?.height_cm || !profile?.age || !profile?.sex || !profile?.activity_level) return;
    const recs = computeWHORecommendations(
      profile.weight_kg, profile.height_cm, profile.age, profile.sex, profile.activity_level
    );
    updateField('recommended_calories', recs.recommended_calories);
    updateField('recommended_protein_g', recs.recommended_protein_g);
  }

  async function handleSave() {
    setSaving(true);
    await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  async function addViewer() {
    if (!newViewer.name || !newViewer.email) return;
    setViewerLoading(true);
    const res = await fetch('/api/viewer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newViewer),
    });
    const { viewer } = await res.json();
    setViewers(v => [...v, viewer]);
    setNewViewer({ name: '', email: '', permission_level: 'summary', can_see_price: false });
    setAddingViewer(false);
    setViewerLoading(false);
  }

  async function revokeViewer(access_id: string) {
    await fetch('/api/viewer', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_id, active: false }),
    });
    setViewers(v => v.filter(x => x.access_id !== access_id));
  }

  function copyLink(token: string) {
    const url = `${window.location.origin}/viewer/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(''), 2000);
  }

  async function handleExport(format: 'csv' | 'pdf', period: 'week' | 'month') {
    setExportLoading(true);
    const res = await fetch(`/api/export?format=${format}&period=${period}`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const fileExtension = format === 'pdf' ? 'html' : format;
    a.download = `mito-${period}-${new Date().toISOString().split('T')[0]}.${fileExtension}`;
    a.click();
    URL.revokeObjectURL(url);
    setExportLoading(false);
  }

  if (!profile) return (
    <div className="flex justify-center py-20">
      <div className="w-6 h-6 border-2 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6 animate-fade-up">
        <div className="flex-1">
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Syne, serif' }}>Settings</h1>
          <p className="text-xs font-mono text-[var(--muted)] uppercase tracking-widest mt-0.5">
            {profile.name || 'Your profile'}
          </p>
        </div>
        <button onClick={handleSignOut}
          className="text-xs font-mono text-[var(--muted)] hover:text-[var(--red)] transition-colors border border-[var(--border)] px-3 py-2 rounded-lg">
          Sign out
        </button>
      </div>

      {/* Tab switcher */}
      <div className="flex bg-[var(--surface)] border border-[var(--border)] rounded-xl p-1 mb-6 animate-fade-up delay-1">
        {(['profile', 'share', 'export'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-lg text-xs font-mono uppercase tracking-widest transition-all capitalize
              ${activeTab === tab ? 'bg-[var(--accent)] text-[#0a0908] font-bold' : 'text-[var(--muted)] hover:text-[var(--text)]'}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* ── PROFILE TAB ── */}
      {activeTab === 'profile' && (
        <div className="flex flex-col gap-5 animate-fade-up">

          {/* Identity */}
          <Section title="Identity">
            <Input label="Name" value={profile.name || ''} onChange={e => updateField('name', e.target.value)} />
            <div className="px-4 py-3 bg-[var(--surface2)] border border-[var(--border)] rounded-xl">
              <MonoLabel>Email</MonoLabel>
              <p className="text-sm text-[var(--text2)] mt-1">{profile.email}</p>
            </div>
          </Section>

          {/* Body */}
          <Section title="Body Profile">
            <div className="grid grid-cols-2 gap-3">
              <Input label="Weight (kg)" type="number" value={profile.weight_kg || ''}
                onChange={e => updateField('weight_kg', parseFloat(e.target.value))} />
              <Input label="Height (cm)" type="number" value={profile.height_cm || ''}
                onChange={e => updateField('height_cm', parseFloat(e.target.value))} />
            </div>
            <Input label="Age" type="number" value={profile.age || ''}
              onChange={e => updateField('age', parseInt(e.target.value))} />
            <div>
              <MonoLabel className="mb-2 block">Sex</MonoLabel>
              <div className="grid grid-cols-3 gap-2">
                {(['male', 'female', 'other'] as const).map(s => (
                  <button key={s} onClick={() => updateField('sex', s)}
                    className={`py-2 rounded-xl text-xs border transition-all capitalize
                      ${profile.sex === s ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--accent-glow)]' : 'border-[var(--border)] text-[var(--muted)]'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <MonoLabel className="mb-2 block">Activity Level</MonoLabel>
              <div className="grid grid-cols-2 gap-2">
                {ACTIVITY_OPTIONS.map(opt => (
                  <button key={opt.value} onClick={() => updateField('activity_level', opt.value)}
                    className={`py-2 px-3 rounded-xl text-left transition-all border
                      ${profile.activity_level === opt.value ? 'border-[var(--accent)] bg-[var(--accent-glow)]' : 'border-[var(--border)]'}`}>
                    <p className={`text-xs font-medium ${profile.activity_level === opt.value ? 'text-[var(--accent)]' : 'text-[var(--text)]'}`}>{opt.label}</p>
                    <p className="text-[10px] text-[var(--muted)] font-mono">{opt.sub}</p>
                  </button>
                ))}
              </div>
            </div>
            <button onClick={recomputeGoals}
              className="text-xs font-mono text-[var(--accent)] hover:underline text-left">
              ↻ Recompute WHO goals from profile
            </button>
          </Section>

          {/* Goals */}
          <Section title="Daily Goals" sub="Shown as context. Edit freely.">
            <div>
              <MonoLabel className="mb-1.5 block">Calories (kcal)</MonoLabel>
              <input type="number" value={profile.recommended_calories || ''}
                onChange={e => updateField('recommended_calories', parseInt(e.target.value))}
                className="w-full bg-[var(--surface2)] border border-[var(--border)] rounded-xl px-4 py-3 text-2xl font-bold text-[var(--accent)] outline-none focus:border-[var(--accent)]"
                style={{ fontFamily: 'Syne, serif' }} />
            </div>
            <div>
              <MonoLabel className="mb-1.5 block">Protein (g)</MonoLabel>
              <input type="number" value={profile.recommended_protein_g || ''}
                onChange={e => updateField('recommended_protein_g', parseInt(e.target.value))}
                className="w-full bg-[var(--surface2)] border border-[var(--border)] rounded-xl px-4 py-3 text-2xl font-bold text-[var(--blue)] outline-none focus:border-[var(--accent)]"
                style={{ fontFamily: 'Syne, serif' }} />
            </div>
          </Section>

          {/* Preferences */}
          <Section title="Preferences">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--text)]">Weekly digest email</p>
                <p className="text-xs font-mono text-[var(--muted)]">Plain language weekly summary</p>
              </div>
              <button onClick={() => updateField('weekly_digest_email', !profile.weekly_digest_email)}
                className={`w-11 h-6 rounded-full transition-all ${profile.weekly_digest_email ? 'bg-[var(--accent)]' : 'bg-[var(--muted2)]'}`}>
                <div className={`w-5 h-5 rounded-full bg-white transition-transform mx-0.5 ${profile.weekly_digest_email ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          </Section>

          <Button size="lg" onClick={handleSave} loading={saving} className="font-mono tracking-wide">
            {saved ? '✓ Saved' : 'Save Changes'}
          </Button>
        </div>
      )}

      {/* ── SHARE TAB ── */}
      {activeTab === 'share' && (
        <div className="flex flex-col gap-5 animate-fade-up">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5">
            <h2 className="font-bold mb-1" style={{ fontFamily: 'Syne, serif' }}>Viewer Access</h2>
            <p className="text-xs font-mono text-[var(--muted)] mb-4">
              Share a read-only view of your food log with a dietitian, parent, or trusted person. They see exactly what you see — nothing more.
            </p>

            {/* Existing viewers */}
            {viewers.length > 0 && (
              <div className="flex flex-col gap-3 mb-5">
                {viewers.map(v => (
                  <div key={v.access_id} className="bg-[var(--surface2)] border border-[var(--border)] rounded-xl p-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <p className="text-sm font-medium" style={{ fontFamily: 'Syne, serif' }}>{v.viewer_name}</p>
                        <p className="text-xs font-mono text-[var(--muted)]">{v.viewer_email}</p>
                        <div className="flex gap-2 mt-1.5">
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded-full border border-[var(--border)] text-[var(--muted)] uppercase tracking-widest">
                            {v.permission_level}
                          </span>
                          {v.can_see_price && (
                            <span className="text-[9px] font-mono px-2 py-0.5 rounded-full border border-[var(--green)] text-[var(--green)] uppercase tracking-widest">
                              sees price
                            </span>
                          )}
                        </div>
                      </div>
                      <button onClick={() => revokeViewer(v.access_id)}
                        className="text-xs font-mono text-[var(--muted)] hover:text-[var(--red)] transition-colors shrink-0">
                        Revoke
                      </button>
                    </div>
                    <button onClick={() => copyLink(v.access_token)}
                      className={`w-full py-2 rounded-lg text-xs font-mono border transition-all
                        ${copiedToken === v.access_token
                          ? 'border-[var(--green)] text-[var(--green)] bg-[rgba(92,184,138,0.08)]'
                          : 'border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]'}`}>
                      {copiedToken === v.access_token ? '✓ Link copied!' : '⎘ Copy viewer link'}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add viewer form */}
            {addingViewer ? (
              <div className="border border-[var(--accent)] rounded-xl p-4 flex flex-col gap-3 animate-scale-in">
                <Input label="Their name" placeholder="Dr. Sharma / Mom / Priya"
                  value={newViewer.name} onChange={e => setNewViewer(v => ({ ...v, name: e.target.value }))} />
                <Input label="Their email" type="email" placeholder="viewer@example.com"
                  value={newViewer.email} onChange={e => setNewViewer(v => ({ ...v, email: e.target.value }))} />

                <div>
                  <MonoLabel className="mb-2 block">Access level</MonoLabel>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { val: 'summary', label: 'Summary', sub: 'Meals + totals only' },
                      { val: 'detailed', label: 'Detailed', sub: 'Full macros + items' },
                    ].map(opt => (
                      <button key={opt.val} onClick={() => setNewViewer(v => ({ ...v, permission_level: opt.val }))}
                        className={`py-2 px-3 rounded-xl text-left border transition-all
                          ${newViewer.permission_level === opt.val ? 'border-[var(--accent)] bg-[var(--accent-glow)]' : 'border-[var(--border)]'}`}>
                        <p className={`text-xs font-medium ${newViewer.permission_level === opt.val ? 'text-[var(--accent)]' : 'text-[var(--text)]'}`}>{opt.label}</p>
                        <p className="text-[10px] text-[var(--muted)] font-mono">{opt.sub}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[var(--text)]">Show price data</p>
                    <p className="text-xs font-mono text-[var(--muted)]">They&apos;ll see ₹ amounts</p>
                  </div>
                  <button onClick={() => setNewViewer(v => ({ ...v, can_see_price: !v.can_see_price }))}
                    className={`w-11 h-6 rounded-full transition-all ${newViewer.can_see_price ? 'bg-[var(--accent)]' : 'bg-[var(--muted2)]'}`}>
                    <div className={`w-5 h-5 rounded-full bg-white transition-transform mx-0.5 ${newViewer.can_see_price ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>

                <div className="flex gap-3">
                  <Button variant="ghost" size="md" onClick={() => setAddingViewer(false)} className="text-xs">Cancel</Button>
                  <Button size="md" className="flex-1 font-mono" loading={viewerLoading}
                    onClick={addViewer} disabled={!newViewer.name || !newViewer.email}>
                    Generate Link
                  </Button>
                </div>
              </div>
            ) : (
              <button onClick={() => setAddingViewer(true)}
                className="w-full py-3 border-2 border-dashed border-[var(--border)] rounded-xl text-sm font-mono text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all">
                + Add viewer
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── EXPORT TAB ── */}
      {activeTab === 'export' && (
        <div className="flex flex-col gap-4 animate-fade-up">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5">
            <h2 className="font-bold mb-1" style={{ fontFamily: 'Syne, serif' }}>Export Your Data</h2>
            <p className="text-xs font-mono text-[var(--muted)] mb-5">
              Download your meal logs. Your data, your ownership.
            </p>

            <div className="flex flex-col gap-3">
              {[
                { period: 'week' as const, label: 'This week', sub: 'Last 7 days of meals' },
                { period: 'month' as const, label: 'This month', sub: 'Last 30 days of meals' },
              ].map(({ period, label, sub }) => (
                <div key={period} className="bg-[var(--surface2)] border border-[var(--border)] rounded-xl p-4">
                  <p className="text-sm font-medium mb-0.5" style={{ fontFamily: 'Syne, serif' }}>{label}</p>
                  <p className="text-xs font-mono text-[var(--muted)] mb-3">{sub}</p>
                  <div className="flex gap-2">
                    <button onClick={() => handleExport('csv', period)} disabled={exportLoading}
                      className="flex-1 py-2 rounded-lg text-xs font-mono border border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all disabled:opacity-50">
                      {exportLoading ? '...' : '↓ CSV'}
                    </button>
                    <button onClick={() => handleExport('pdf', period)} disabled={exportLoading}
                      className="flex-1 py-2 rounded-lg text-xs font-mono border border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all disabled:opacity-50">
                      {exportLoading ? '...' : '↓ PDF'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 flex flex-col gap-4">
      <div>
        <MonoLabel>{title}</MonoLabel>
        {sub && <p className="text-[11px] text-[var(--muted)] font-mono mt-0.5">{sub}</p>}
      </div>
      {children}
    </div>
  );
}