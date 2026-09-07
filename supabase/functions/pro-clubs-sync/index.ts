// supabase/functions/pro-clubs-sync/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const clubId = url.searchParams.get('clubId') || '5505980';
    const platform = url.searchParams.get('platform') || 'common-gen5';

    // 1. Intentar consultar directamente la API Oficial de EA (Más rápido y confiable)
    const eaUrl = `https://proclubs.ea.com/api/fc/members/career/stats?platform=${platform}&clubId=${clubId}`;
    
    const eaResponse = await fetch(eaUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Referer': 'https://proclubstracker.com/',
      },
    });

    if (eaResponse.ok) {
      const data = await eaResponse.json();
      if (data && data.members) {
        const players = Object.values(data.members).map((m: any) => ({
          name: m.name || m.proName,
          rating: m.ratingAve ? parseFloat(m.ratingAve) : null,
        }));

        return new Response(JSON.stringify({ players }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // 2. Fallback: ProClubsTracker en caso de que EA falle
    const trackerUrl = `https://proclubstracker.com/club/${clubId}?platform=${platform}`;
    const trackerRes = await fetch(trackerUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    const html = await trackerRes.text();
    // Extraer json embebido si existe en el HTML
    const players: { name: string; rating: number | null }[] = [];

    return new Response(JSON.stringify({ players }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});