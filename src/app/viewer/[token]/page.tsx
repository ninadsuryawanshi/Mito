'use client';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { MonoLabel, Badge, Spinner, Button } from '@/components/ui';

type ViewerData = {
    owner_name: string;
    permission_level: 'summary' | 'detailed';
    can_see_price: boolean;
    meals: any[];
    stats: any;
    insight?: string;
};

export default function ViewerPage({ params }: { params: { token: string } }) {
    const { token } = params;
    const [data, setData] = useState<ViewerData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [view, setView] = useState<'day' | 'week' | 'month'>('day');
    const [needsAuth, setNeedsAuth] = useState(false);
    const [email, setEmail] = useState('');
    const [verifying, setVerifying] = useState(false);

    const fetchData = () => {
        setLoading(true);
        fetch(`/api/viewer/${token}?view=${view}`)
            .then(r => r.json().then(d => ({ status: r.status, data: d })))
            .then(({ status, data: d }) => {
                if (status === 401 && d.needsAuth) {
                    setNeedsAuth(true);
                    setLoading(false);
                    return;
                }
                setNeedsAuth(false);
                if (d.error) { setError(d.error); }
                else { setData(d); }
                setLoading(false);
            })
            .catch(() => { setError('Failed to load'); setLoading(false); });
    };

    useEffect(() => {
        fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, view]);

    async function handleVerify(e: React.FormEvent) {
        e.preventDefault();
        setVerifying(true);
        setError('');
        try {
            const res = await fetch(`/api/viewer/${token}/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            if (res.ok) {
                fetchData();
            } else {
                const errData = await res.json();
                setError(errData.error || "This link isn't for your email address.");
            }
        } catch (err) {
            setError("Verification failed.");
        } finally {
            setVerifying(false);
        }
    }

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <Spinner size="lg" />
        </div>
    );

    if (needsAuth) return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-6">
            <div className="text-center mb-4">
                <div className="w-12 h-12 rounded-xl bg-[var(--accent)] flex items-center justify-center mx-auto mb-4">
                    <span className="text-[#0a0908] font-bold text-xl" style={{ fontFamily: 'Syne, serif' }}>M</span>
                </div>
                <h1 className="text-xl font-bold" style={{ fontFamily: 'Syne, serif' }}>Access Secured Food Log</h1>
                <p className="text-sm text-[var(--muted)] mt-2">Enter your email to view this log.</p>
            </div>
            
            <form onSubmit={handleVerify} className="w-full max-w-sm flex flex-col gap-4">
                <input 
                    type="email" 
                    placeholder="your@email.com" 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)] transition-colors"
                />
                {error && <p className="text-xs text-[var(--red)] text-center">{error}</p>}
                <Button type="submit" disabled={verifying} className="w-full">
                    {verifying ? 'Verifying...' : 'Verify Access'}
                </Button>
            </form>
        </div>
    );

    if (error) return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6">
            <div className="text-4xl">⊘</div>
            <p className="text-sm text-[var(--muted)] text-center font-mono">
                {error === 'Unauthorized' ? 'This link is invalid or has been revoked.' : error}
            </p>
        </div>
    );

    if (!data) return null;

    return (
        <div className="max-w-lg mx-auto px-4 py-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6 animate-fade-up">
                <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center">
                    <span className="text-[#0a0908] font-bold text-sm" style={{ fontFamily: 'Syne, serif' }}>M</span>
                </div>
                <div>
                    <p className="font-bold text-lg" style={{ fontFamily: 'Syne, serif' }}>Mito</p>
                    <p className="text-xs font-mono text-[var(--muted)]">
                        {data.owner_name}&apos;s food log · read-only
                    </p>
                </div>
                <span className="ml-auto text-[9px] font-mono text-[var(--muted)] border border-[var(--border)] px-2 py-1 rounded-full uppercase tracking-widest">
                    {data.permission_level}
                </span>
            </div>

            {/* Timeline toggle */}
            <div className="flex bg-[var(--surface)] border border-[var(--border)] rounded-xl p-1 mb-6">
                {(['day', 'week', 'month'] as const).map(v => (
                    <button key={v} onClick={() => setView(v)}
                        className={`flex-1 py-2 rounded-lg text-xs font-mono uppercase tracking-widest transition-all
              ${view === v ? 'bg-[var(--accent)] text-[#0a0908] font-bold' : 'text-[var(--muted)]'}`}>
                        {v}
                    </button>
                ))}
            </div>

            {/* Insight */}
            {data.insight && (
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 mb-4">
                    <MonoLabel className="mb-1 block">Today&apos;s observation</MonoLabel>
                    <p className="text-sm italic">&quot;{data.insight}&quot;</p>
                </div>
            )}

            {/* Stats summary */}
            {data.stats && (
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 mb-4">
                    <div className="grid grid-cols-2 gap-3">
                        <StatItem label="Calories" value={`${Math.round(data.stats.total_calories)} kcal`} color="var(--accent)" />
                        <StatItem label="Protein" value={`${Math.round(data.stats.total_protein_g)}g`} color="var(--blue)" />
                        <StatItem label="Sugar" value={`${Math.round(data.stats.total_sugar_g)}g`} color="var(--red)" />
                        <StatItem label="Sodium" value={`${Math.round(data.stats.total_sodium_mg)}mg`} color="var(--muted)" />
                        {data.can_see_price && (
                            <StatItem label="Spent" value={`₹${Math.round(data.stats.total_spend)}`} color="var(--green)" />
                        )}
                        <StatItem label="Meals" value={String(data.stats.total_meals)} />
                    </div>
                </div>
            )}

            {/* Meals */}
            <MonoLabel className="mb-3 block">
                {view === 'day' ? "Today's meals" : view === 'week' ? 'This week' : 'This month'}
            </MonoLabel>

            {data.meals.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-[var(--border)] rounded-2xl">
                    <p className="text-sm text-[var(--muted)]">No meals logged in this period.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {data.meals.map((meal: any) => (
                        <div key={meal.log_id} className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4">
                            <div className="pl-3 border-l-2 border-[var(--accent)]">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <div>
                                        <p className="font-medium text-sm" style={{ fontFamily: 'Syne, serif' }}>
                                            {data.permission_level === 'detailed'
                                                ? meal.items?.map((i: any) => i.food_entity?.name).filter(Boolean).join(', ')
                                                : meal.meal_type || 'Meal'}
                                        </p>
                                        <p className="text-[10px] font-mono text-[var(--muted)] mt-0.5 capitalize">
                                            {meal.meal_type && `${meal.meal_type} · `}
                                            {format(new Date(meal.logged_at), 'h:mm a, d MMM')}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <Badge color="accent">🔥 {Math.round(meal.total_calories || 0)} kcal</Badge>
                                    {data.permission_level === 'detailed' && (
                                        <>
                                            <Badge color="blue">P {Math.round(meal.total_protein_g || 0)}g</Badge>
                                            <Badge color="muted">C {Math.round(meal.total_carbs_g || 0)}g</Badge>
                                        </>
                                    )}
                                    {data.can_see_price && meal.price > 0 && (
                                        <Badge color="green">₹{meal.price}</Badge>
                                    )}
                                </div>

                                {/* Detailed items breakdown */}
                                {data.permission_level === 'detailed' && meal.items?.length > 0 && (
                                    <div className="mt-3 flex flex-col gap-1.5">
                                        {meal.items.map((item: any) => (
                                            <div key={item.item_id} className="flex items-center justify-between text-xs">
                                                <span className="text-[var(--text2)]">{item.food_entity?.name} · {item.quantity} {item.unit}</span>
                                                <span className="font-mono text-[var(--muted)]">{Math.round(item.calories || 0)} kcal</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <p className="text-center text-[10px] font-mono text-[var(--muted2)] mt-8">
                Powered by Mito · Read-only access · {format(new Date(), 'd MMM yyyy')}
            </p>
        </div>
    );
}

function StatItem({ label, value, color }: { label: string; value: string; color?: string }) {
    return (
        <div>
            <MonoLabel>{label}</MonoLabel>
            <p className="text-lg font-bold mt-0.5" style={{ fontFamily: 'Syne, serif', color: color || 'var(--text)' }}>{value}</p>
        </div>
    );
}