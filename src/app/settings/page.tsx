'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/db/client';
import { Button, Input, MonoLabel, OnboardingTour } from '@/components/ui';
import { useToast } from '@/components/ui/ToastContext';
import { computeWHORecommendations } from '@/lib/ai/gemini';
import { useWebPush } from '@/hooks/useWebPush';

const ACTIVITY_OPTIONS = [
  { value: 'sedentary', label: 'Sedentary', sub: 'Little/no exercise' },
  { value: 'light', label: 'Light', sub: '1–3 days/wk' },
  { value: 'moderate', label: 'Moderate', sub: '3–5 days/wk' },
  { value: 'active', label: 'Active', sub: '6–7 days/wk' },
] as const;

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const { toast } = useToast();
  const { isSupported: pushSupported, isSubscribed, loading: pushLoading, error: pushError, subscribe, unsubscribe, sendTestNotification } = useWebPush();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'share' | 'export'>('profile');
  const [viewers, setViewers] = useState<any[]>([]);
  const [newViewer, setNewViewer] = useState({ name: '', email: '', permission_level: 'summary', can_see_price: false });
  const [addingViewer, setAddingViewer] = useState(false);
  const [viewerLoading, setViewerLoading] = useState(false);
  const [copiedToken, setCopiedToken] = useState('');
  const [exportLoading, setExportLoading] = useState(false);

  // Account deletion
  const [deleteStep, setDeleteStep] = useState<0 | 1 | 2>(0); // 0=hidden, 1=warn1, 2=confirm
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch('/api/profile').then(r => r.json()).then(({ profile: p }) => setProfile(p));
    fetch('/api/viewer').then(r => r.json()).then(({ viewers: v }) => setViewers(v || []));

    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam === 'share' || tabParam === 'export' || tabParam === 'profile') {
      setActiveTab(tabParam);
    }
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
    toast('Profile saved', 'success');
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  async function handleDeleteAccount() {
    if (deleteConfirmText !== 'DELETE') return;
    setDeleting(true);
    try {
      const res = await fetch('/api/account/delete', { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Deletion failed');
      // Sign out locally and clear all local storage
      const supabase = createClient();
      await supabase.auth.signOut();
      localStorage.clear();
      sessionStorage.clear();
      router.push('/login?deleted=1');
    } catch (err: any) {
      toast(err.message || 'Could not delete account. Please try again.', 'error');
      setDeleting(false);
    }
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

            <div className="border-t border-[var(--border)] pt-4 mt-1 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--text)] font-medium">Smart Push Notifications</p>
                  <p className="text-xs font-mono text-[var(--muted)]">Witty meal reminders & streak alerts</p>
                </div>
                <button
                  disabled={pushLoading}
                  onClick={async () => {
                    if (isSubscribed) {
                      await unsubscribe();
                      toast('Notifications disabled', 'info');
                    } else {
                      const ok = await subscribe();
                      if (ok) {
                        toast('Push notifications enabled! 🔔', 'success');
                      } else {
                        toast(pushError || 'Could not enable notifications. Check browser permissions.', 'error');
                      }
                    }
                  }}
                  className={`w-11 h-6 rounded-full transition-all ${isSubscribed ? 'bg-[var(--accent)]' : 'bg-[var(--muted2)]'} disabled:opacity-50`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform mx-0.5 ${isSubscribed ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              {isSubscribed && (
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] font-mono text-[var(--accent)]">✓ Subscribed on this device</span>
                  <button
                    onClick={async () => {
                      const res = await sendTestNotification();
                      if (res.success) toast('Witty push notification sent! check your screen', 'success');
                      else toast(res.message || res.error || 'Failed to send test push', 'error');
                    }}
                    className="text-[11px] font-mono text-[var(--accent)] hover:underline border border-[rgba(244,162,77,0.3)] px-2.5 py-1 rounded-lg bg-[rgba(244,162,77,0.08)]"
                  >
                    🔔 Send test push
                  </button>
                </div>
              )}

              <div className="border-t border-[var(--border)] pt-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--text)] font-medium">Guided App Tour</p>
                  <p className="text-xs font-mono text-[var(--muted)]">Replay interactive spotlights</p>
                </div>
                <button
                  onClick={() => {
                    localStorage.removeItem('mito_tour_completed');
                    toast('Tour reset! Head to Dashboard to view it.', 'info');
                  }}
                  className="text-xs font-mono text-[var(--accent)] border border-[rgba(244,162,77,0.3)] px-3 py-1.5 rounded-xl hover:bg-[var(--accent)] hover:text-[#0a0908] transition-all"
                >
                  ▶ Replay Tour
                </button>
              </div>
            </div>
          </Section>

          <Button size="lg" onClick={handleSave} loading={saving} className="font-mono tracking-wide">
            Save Changes
          </Button>

          {/* ── DANGER ZONE ── */}
          <div className="mt-2 rounded-2xl border border-[var(--red)] border-opacity-40 bg-[rgba(224,92,92,0.04)] p-5">
            <h3 className="text-sm font-bold text-[var(--red)] mb-1" style={{ fontFamily: 'Syne, serif' }}>Danger Zone</h3>
            <p className="text-xs font-mono text-[var(--muted)] mb-4 leading-relaxed">
              Deleting your account is <strong className="text-[var(--text)]">permanent and irreversible</strong>. All your meal logs, rules, nutrition data, viewer access, and push subscriptions will be permanently erased from our servers.
            </p>
            <button
              onClick={() => setDeleteStep(1)}
              className="text-xs font-mono text-[var(--red)] border border-[rgba(224,92,92,0.4)] px-4 py-2 rounded-xl hover:bg-[var(--red)] hover:text-white transition-all"
            >
              Delete My Account
            </button>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRMATION MODAL – Step 1 ── */}
      {deleteStep === 1 && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#12100e] border border-[rgba(224,92,92,0.5)] rounded-2xl p-6 shadow-[0_20px_60px_rgba(0,0,0,0.9)] flex flex-col gap-4 animate-fade-up">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[rgba(224,92,92,0.12)] flex items-center justify-center text-xl">
                ⚠️
              </div>
              <div>
                <h2 className="font-bold text-[var(--text)]" style={{ fontFamily: 'Syne, serif' }}>Are you sure?</h2>
                <p className="text-[10px] font-mono text-[var(--red)] uppercase tracking-widest">This cannot be undone</p>
              </div>
            </div>
            <div className="text-xs font-mono text-[var(--muted)] leading-relaxed space-y-2">
              <p>You are about to permanently delete your Mito account. This will erase:</p>
              <ul className="list-disc pl-4 space-y-1 text-[var(--muted)]">
                <li>All meal logs and nutrition history</li>
                <li>All personal rules and streak records</li>
                <li>All viewer access links</li>
                <li>All push notification subscriptions</li>
                <li>Your profile and account credentials</li>
              </ul>
              <p className="text-[var(--text)] font-semibold">There is no way to recover this data after deletion.</p>
            </div>
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setDeleteStep(0)}
                className="flex-1 py-2.5 rounded-xl border border-[var(--border)] text-xs font-mono text-[var(--muted)] hover:text-[var(--text)] transition-colors"
              >
                Cancel — Keep My Account
              </button>
              <button
                onClick={() => setDeleteStep(2)}
                className="flex-1 py-2.5 rounded-xl bg-[var(--red)] text-white text-xs font-mono font-bold hover:opacity-90 transition-all"
              >
                I Understand, Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRMATION MODAL – Step 2 ── */}
      {deleteStep === 2 && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#12100e] border border-[rgba(224,92,92,0.6)] rounded-2xl p-6 shadow-[0_20px_60px_rgba(0,0,0,0.9)] flex flex-col gap-4 animate-fade-up">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[rgba(224,92,92,0.15)] flex items-center justify-center text-xl">
                🗑️
              </div>
              <div>
                <h2 className="font-bold text-[var(--red)]" style={{ fontFamily: 'Syne, serif' }}>Final Confirmation</h2>
                <p className="text-[10px] font-mono text-[var(--muted)] uppercase tracking-widest">Type to confirm</p>
              </div>
            </div>
            <p className="text-xs font-mono text-[var(--muted)] leading-relaxed">
              To confirm, type{' '}
              <code className="px-1.5 py-0.5 rounded bg-[rgba(224,92,92,0.12)] text-[var(--red)] font-bold tracking-widest">DELETE</code>
              {' '}in the box below. This will immediately and permanently delete your account and all associated data.
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={e => setDeleteConfirmText(e.target.value.toUpperCase())}
              placeholder="Type DELETE to confirm"
              autoFocus
              className="w-full bg-[var(--surface2)] border border-[rgba(224,92,92,0.4)] focus:border-[var(--red)] rounded-xl px-4 py-3 text-sm font-mono text-[var(--red)] placeholder:text-[var(--muted)] outline-none tracking-widest transition-all"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setDeleteStep(0); setDeleteConfirmText(''); }}
                className="flex-1 py-2.5 rounded-xl border border-[var(--border)] text-xs font-mono text-[var(--muted)] hover:text-[var(--text)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE' || deleting}
                className="flex-1 py-2.5 rounded-xl bg-[var(--red)] text-white text-xs font-mono font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-all flex items-center justify-center gap-2"
              >
                {deleting && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {deleting ? 'Deleting...' : 'Delete Forever'}
              </button>
            </div>
          </div>
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
            <h2 className="font-bold mb-1" style={{ fontFamily: 'Syne, serif' }}>Export & Share Your Logs</h2>
            <p className="text-xs font-mono text-[var(--muted)] mb-5 leading-relaxed">
              Download your food logs as CSV or HTML/PDF documents. Send them, print them out, share them with your dietitian, or upload them to LLMs (like ChatGPT or Gemini) to understand your eating habits even better!
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