import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/db/server';
import { getMealsForTimeline } from '@/lib/services/mealService';
import { format } from 'date-fns';

export async function GET(req: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const exportFormat = req.nextUrl.searchParams.get('format') || 'csv';
        const period = (req.nextUrl.searchParams.get('period') || 'week') as 'week' | 'month';

        const meals = await getMealsForTimeline(supabase, user.id, period);

        if (exportFormat === 'csv') {
            return exportCSV(meals, period);
        } else {
            return exportPDF(meals, period);
        }
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

function exportCSV(meals: any[], period: string): NextResponse {
    const totalCal = meals.reduce((s, m) => s + (m.total_calories || 0), 0);
    const totalProtein = meals.reduce((s, m) => s + (m.total_protein_g || 0), 0);
    const totalSpend = meals.reduce((s, m) => s + (m.price || 0), 0);
    const totalMeals = meals.length;

    const summaryBlock = [
        `"Export Summary - ${period}"`,
        `"Total Meals:",${totalMeals},,,,,"Total Kcal:",${Math.round(totalCal)}`,
        `"Total Protein:",${Math.round(totalProtein)}g,,,,,"Total Spend:",₹${Math.round(totalSpend)}`,
        ``
    ].join('\n');

    const headers = [
        'Date', 'Time', 'Meal Type', 'Foods', 'Calories (kcal)',
        'Protein (g)', 'Carbs (g)', 'Fat (g)', 'Fiber (g)',
        'Sugar (g)', 'Sodium (mg)', 'Eating Context', 'Mood', 'Price (₹)', 'AI Note'
    ];

    let sumC=0, sumP=0, sumCb=0, sumF=0, sumFi=0, sumSug=0, sumSod=0;

    const rows = meals.map(m => {
        sumC += m.total_calories || 0;
        sumP += m.total_protein_g || 0;
        sumCb += m.total_carbs_g || 0;
        sumF += m.total_fat_g || 0;
        sumFi += m.total_fiber_g || 0;
        sumSug += m.total_sugar_g || 0;
        sumSod += m.total_sodium_mg || 0;

        const foods = m.items?.map((i: any) => `${i.quantity} ${i.unit} ${i.food_entity?.name || ''}`).join('; ') || m.description_text || '';
        const moodScore = m.mood?.mood_score;
        const moodStr = moodScore === 4 ? 'Great' : moodScore === 3 ? 'Good' : moodScore === 2 ? 'Meh' : moodScore === 1 ? 'Bad' : '';

        return [
            format(new Date(m.logged_at), 'yyyy-MM-dd'),
            format(new Date(m.logged_at), 'HH:mm'),
            m.meal_type || '',
            foods,
            Math.round(m.total_calories || 0),
            Math.round(m.total_protein_g || 0),
            Math.round(m.total_carbs_g || 0),
            Math.round(m.total_fat_g || 0),
            Math.round(m.total_fiber_g || 0),
            Math.round(m.total_sugar_g || 0),
            Math.round(m.total_sodium_mg || 0),
            m.eating_context || '',
            moodStr,
            m.price || '',
            m.ai_note || '',
        ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
    });

    const totalsRow = [
        `"TOTALS"`, `""`, `""`, `""`, 
        `"${Math.round(sumC)}"`, `"${Math.round(sumP)}"`, `"${Math.round(sumCb)}"`, `"${Math.round(sumF)}"`,
        `"${Math.round(sumFi)}"`, `"${Math.round(sumSug)}"`, `"${Math.round(sumSod)}"`, `""`, `""`, `"${Math.round(totalSpend)}"`, `""`
    ].join(',');

    const csv = [summaryBlock, headers.join(','), ...rows, totalsRow].join('\n');

    return new NextResponse(csv, {
        headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="mito-${period}-${format(new Date(), 'yyyy-MM-dd')}.csv"`,
        },
    });
}

function exportPDF(meals: any[], period: string): NextResponse {
    const totalCal = meals.reduce((s, m) => s + (m.total_calories || 0), 0);
    const totalProtein = meals.reduce((s, m) => s + (m.total_protein_g || 0), 0);
    const totalSpend = meals.reduce((s, m) => s + (m.price || 0), 0);
    const days = period === 'week' ? 7 : 30;
    const limitSugar = 50, limitSodium = 2300;

    // Group meals by date
    const byDay: Record<string, any[]> = {};
    const dayStats: Record<string, number> = {};
    meals.forEach(m => {
        const d = format(new Date(m.logged_at), 'yyyy-MM-dd');
        if(!byDay[d]) { byDay[d] = []; dayStats[d] = 0; }
        byDay[d].push(m);
        dayStats[d] += (m.total_calories || 0);
    });

    const maxDayCal = Math.max(2000, ...Object.values(dayStats));

    // Generate bar chart bars
    const chartBars = Object.keys(dayStats).sort().map(d => {
        const cals = dayStats[d];
        const hPct = Math.min((cals / maxDayCal) * 100, 100);
        return `
        <div class="bar-wrap">
            <div class="bar"><div class="bar-fill" style="height: ${hPct}%;"></div></div>
            <div class="bar-lbl">${format(new Date(d), 'd')}</div>
        </div>`;
    }).join('');

    const timelineHTML = Object.entries(byDay).sort((a,b)=>b[0].localeCompare(a[0])).map(([d, mList]) => {
        const dayRows = mList.map(m => {
            const foods = m.items?.map((i: any) => `${i.quantity} ${i.unit} ${i.food_entity?.name || ''}`).join(', ') || m.description_text || '—';
            const sugarHTML = m.total_sugar_g > limitSugar 
                ? `<span class="pill red">Sugar: ${Math.round(m.total_sugar_g)}g!</span>` 
                : `Sugar: ${Math.round(m.total_sugar_g || 0)}g`;
            
            const sodiumHTML = m.total_sodium_mg > limitSodium 
                ? `<span class="pill red">Sodium: ${Math.round(m.total_sodium_mg)}mg!</span>` 
                : `Sodium: ${Math.round(m.total_sodium_mg || 0)}mg`;

            return `
            <div class="meal-card">
              <div class="meal-head">
                <strong>${format(new Date(m.logged_at), 'h:mm a')}</strong> — ${m.meal_type || 'Meal'}
                <span style="float:right; font-weight: bold; color: var(--accent);">🔥 ${Math.round(m.total_calories || 0)} kcal</span>
              </div>
              <p>${foods}</p>
              <div class="pills">
                <span class="pill blue">P ${Math.round(m.total_protein_g || 0)}g</span>
                <span class="pill default">C ${Math.round(m.total_carbs_g || 0)}g</span>
                <span class="pill default">F ${Math.round(m.total_fat_g || 0)}g</span>
                — ${sugarHTML} — ${sodiumHTML}
              </div>
            </div>`;
        }).join('');

        return `
        <div class="day-group">
            <h3>${format(new Date(d), 'EEEE, d MMM')}</h3>
            ${dayRows}
        </div>`;
    }).join('');

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Mito Export — ${period}</title>
  <style>
    :root {
       --accent: #f4a24d;
       --blue: #5bb8d4;
       --red: #e05c5c;
       --green: #5cb88a;
    }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1916; padding: 40px; max-width: 900px; margin: 0 auto; background: #fff; }
    .header { border-bottom: 2px solid var(--accent); padding-bottom: 16px; margin-bottom: 32px; display: flex; justify-content: space-between; align-items: flex-end; }
    h1 { font-size: 32px; font-weight: 900; margin: 0; color: #0a0908; }
    .sub { color: #6b6762; font-size: 13px; font-family: monospace; }
    .stats { display: flex; gap: 16px; margin-bottom: 40px; }
    .stat { flex: 1; border: 1px solid #e8e5df; border-radius: 12px; padding: 20px; text-align: center; }
    .stat-val { font-size: 32px; font-weight: 900; color: var(--accent); margin-bottom: 4px; }
    .stat-label { font-size: 11px; font-family: monospace; color: #6b6762; text-transform: uppercase; letter-spacing: 0.1em; }
    
    .chart { display: flex; height: 120px; gap: 8px; align-items: flex-end; border-bottom: 1px solid #e8e5df; padding-bottom: 8px; margin-bottom: 40px; }
    .bar-wrap { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; height: 100%; }
    .bar { width: 60%; background: #f5f3ef; border-radius: 4px 4px 0 0; height: 100%; position: relative; overflow: hidden; }
    .bar-fill { position: absolute; bottom: 0; left: 0; width: 100%; background: var(--accent); border-radius: 4px 4px 0 0; }
    .bar-lbl { font-size: 10px; font-family: monospace; color: #aaa; margin-top: 4px; }

    .day-group { margin-bottom: 32px; }
    .day-group h3 { font-size: 16px; color: #0a0908; margin-bottom: 12px; border-bottom: 1px solid #e8e5df; padding-bottom: 4px; }
    .meal-card { padding: 16px; border: 1px solid #e8e5df; border-radius: 12px; margin-bottom: 12px; page-break-inside: avoid; }
    .meal-head { font-size: 14px; margin-bottom: 8px; color: #6b6762; }
    .meal-card p { margin: 0 0 12px 0; font-size: 15px; font-weight: 500; }
    
    .pills { font-size: 11px; font-family: monospace; color: #6b6762; }
    .pill { display: inline-block; padding: 2px 6px; border-radius: 4px; margin-right: 4px; background: #f5f3ef; }
    .pill.blue { color: var(--blue); background: rgba(91,184,212,0.1); }
    .pill.red { color: var(--red); background: rgba(224,92,92,0.1); font-weight: bold; }
    .pill.default { color: #6b6762; }

    .footer { margin-top: 48px; text-align: center; font-family: monospace; font-size: 11px; color: #aaa; }
    
    @media print {
        body { background: transparent; padding: 0; max-width: none; }
        .stat, .meal-card { border-color: #ccc; }
        .pill { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .bar-fill { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="header">
      <div>
          <h1>Mito</h1>
          <div class="sub">Food log export · ${period === 'week' ? 'Last 7 days' : 'Last 30 days'}</div>
      </div>
      <div class="sub">Generated ${format(new Date(), 'd MMM yyyy, h:mm a')}</div>
  </div>

  <div class="stats">
    <div class="stat">
      <div class="stat-val">${Math.round(totalCal)}</div>
      <div class="stat-label">Total kcal</div>
    </div>
    <div class="stat">
      <div class="stat-val" style="color: var(--blue);">${Math.round(totalProtein)}g</div>
      <div class="stat-label">Total protein</div>
    </div>
    <div class="stat">
      <div class="stat-val" style="color: var(--green);">₹${Math.round(totalSpend)}</div>
      <div class="stat-label">Total spent</div>
    </div>
  </div>

  <div style="font-size: 12px; font-weight: bold; color: #6b6762; margin-bottom: 8px;">CALORIE TREND</div>
  <div class="chart">
      ${chartBars}
  </div>

  <div class="timeline">
    ${timelineHTML}
  </div>

  <p class="footer">Mito — Powerhouse of You · mito.app</p>
</body>
</html>`;

    return new NextResponse(html, {
        headers: {
            'Content-Type': 'text/html',
            'Content-Disposition': `attachment; filename="mito-${period}-${format(new Date(), 'yyyy-MM-dd')}.html"`,
        },
    });
}