'use client';
import { useState, useEffect } from 'react';
import { PersonalRule } from '@/types';
import { Button, Input, MonoLabel, Badge, Spinner, useToast } from '@/components/ui';

export default function RulesPage() {
  const { toast } = useToast();
  const [rules, setRules] = useState<PersonalRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newRule, setNewRule] = useState('');
  const [saving, setSaving] = useState(false);

  async function fetchRules() {
    const res = await fetch('/api/rules');
    const { rules: r } = await res.json();
    setRules(r || []);
    setLoading(false);
  }

  useEffect(() => { fetchRules(); }, []);

  async function addRule() {
    if (!newRule.trim()) return;
    setSaving(true);
    await fetch('/api/rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: newRule.trim() }),
    });
    setNewRule('');
    setAdding(false);
    setSaving(false);
    toast('Rule added ✓', 'success');
    fetchRules();
  }

  async function toggleRule(rule: PersonalRule) {
    const nextState = !rule.active;
    await fetch('/api/rules', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rule_id: rule.rule_id, active: nextState }),
    });
    toast(nextState ? 'Rule activated' : 'Rule deactivated', 'info');
    fetchRules();
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-8 animate-fade-up">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Syne, serif' }}>Rules</h1>
          <p className="text-xs font-mono text-[var(--muted)] mt-1 uppercase tracking-widest">Your personal food rules</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => setAdding(!adding)}>
          {adding ? 'Cancel' : '+ Add rule'}
        </Button>
      </div>

      {adding && (
        <div className="bg-[var(--surface)] border border-[var(--accent)] rounded-2xl p-5 mb-6 animate-scale-in">
          <MonoLabel className="mb-2 block">New rule</MonoLabel>
          <p className="text-xs text-[var(--muted)] mb-4 font-mono">
            Describe it naturally — AI will expand keywords automatically.<br />
            e.g. &quot;no chocolate&quot;, &quot;limit fried food&quot;, &quot;avoid maida&quot;
          </p>
          <Input
            placeholder="e.g. no chocolate"
            value={newRule}
            onChange={e => setNewRule(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addRule()}
            autoFocus
          />
          <Button size="lg" className="mt-4 font-mono" loading={saving} onClick={addRule} disabled={!newRule.trim()}>
            {saving ? 'Expanding keywords...' : 'Add Rule'}
          </Button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : rules.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-[var(--border)] rounded-2xl animate-fade-up">
          <div className="text-4xl mb-3">⊘</div>
          <p className="text-sm text-[var(--muted)]">No rules yet.</p>
          <p className="text-xs text-[var(--muted2)] mt-1 font-mono">Add rules from your doctor, dietitian, or yourself.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-fade-up">
          {rules.map((rule, i) => (
            <div key={rule.rule_id}
              className={`bg-[var(--surface)] border rounded-2xl p-5 transition-all ${rule.active ? 'border-[var(--border)]' : 'border-[var(--border)] opacity-50'}`}
              style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="font-medium text-sm" style={{ fontFamily: 'Syne, serif' }}>{rule.description}</p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {rule.keywords.slice(0, 6).map(kw => (
                      <Badge key={kw} color="muted">{kw}</Badge>
                    ))}
                    {rule.keywords.length > 6 && (
                      <Badge color="muted">+{rule.keywords.length - 6}</Badge>
                    )}
                  </div>
                </div>
                <button onClick={() => toggleRule(rule)}
                  className={`shrink-0 w-11 h-6 rounded-full transition-all ${rule.active ? 'bg-[var(--accent)]' : 'bg-[var(--muted2)]'}`}>
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform mx-0.5 ${rule.active ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
