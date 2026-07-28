import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/db/server';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const itemId = params.id;

        // Get the log_id for this item
        const { data: itemData, error: itemError } = await supabase
            .from('meal_items')
            .select('log_id')
            .eq('item_id', itemId)
            .single();

        if (itemError || !itemData) {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        }

        const logId = itemData.log_id;

        // Delete the item
        const { error: deleteError } = await supabase
            .from('meal_items')
            .delete()
            .eq('item_id', itemId);

        if (deleteError) {
            return NextResponse.json({ error: deleteError.message }, { status: 500 });
        }

        // Fetch remaining items to recompute totals
        const { data: remainingItems, error: itemsError } = await supabase
            .from('meal_items')
            .select('*')
            .eq('log_id', logId);
            
        if (!itemsError && remainingItems) {
            const tC = remainingItems.reduce((s: number, x: any) => s + (x.calories || 0), 0);
            const tP = remainingItems.reduce((s: number, x: any) => s + (x.protein_g || 0), 0);
            const tCb = remainingItems.reduce((s: number, x: any) => s + (x.carbs_g || 0), 0);
            const tF = remainingItems.reduce((s: number, x: any) => s + (x.fat_g || 0), 0);
            const tFi = remainingItems.reduce((s: number, x: any) => s + (x.fiber_g || 0), 0);
            const tS = remainingItems.reduce((s: number, x: any) => s + (x.sugar_g || 0), 0);
            const tSo = remainingItems.reduce((s: number, x: any) => s + (x.sodium_mg || 0), 0);

            // Update the meal log
            await supabase.from('meal_logs').update({
                total_calories: tC,
                total_protein_g: tP,
                total_carbs_g: tCb,
                total_fat_g: tF,
                total_fiber_g: tFi,
                total_sugar_g: tS,
                total_sodium_mg: tSo,
            }).eq('log_id', logId);
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
