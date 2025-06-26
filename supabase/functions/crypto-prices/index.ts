import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

interface CoinGeckoPrice {
  [key: string]: {
    usd: number;
    usd_24h_change: number;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the crypto IDs from query parameters or use defaults
    const url = new URL(req.url)
    const ids = url.searchParams.get('ids') || 'bitcoin,ethereum,solana,cardano'
    
    // Fetch prices from CoinGecko API
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd,gbp&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`
    )

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`)
    }

    const data: CoinGeckoPrice = await response.json()

    // Transform the data to match our expected format
    const transformedData = Object.entries(data).reduce((acc, [coinId, priceData]) => {
      // Map CoinGecko IDs to our symbols
      const symbolMap: { [key: string]: string } = {
        'bitcoin': 'BTC',
        'ethereum': 'ETH', 
        'solana': 'SOL',
        'cardano': 'ADA'
      }

      const symbol = symbolMap[coinId] || coinId.toUpperCase()
      
      acc[symbol] = {
        price_usd: priceData.usd,
        price_gbp: (priceData as any).gbp || priceData.usd * 0.79, // Fallback conversion if GBP not available
        change_24h: priceData.usd_24h_change || 0,
        market_cap: (priceData as any).usd_market_cap || 0,
        volume_24h: (priceData as any).usd_24h_vol || 0,
        last_updated: new Date().toISOString()
      }
      
      return acc
    }, {} as any)

    return new Response(
      JSON.stringify(transformedData),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )

  } catch (error) {
    console.error('Error fetching crypto prices:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch crypto prices',
        message: error.message 
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  }
})