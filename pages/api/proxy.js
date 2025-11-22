export default async function handler(req,res){
  const {url} = req.query;
  if(!url) return res.status(400).send('missing url');
  try{
    const u = decodeURIComponent(url);
    const r = await fetch(u);
    if(!r.ok) return res.status(r.status).send('fetch error');
    const buffer = await r.arrayBuffer();
    // Optimized caching
    res.setHeader('Content-Type', r.headers.get('content-type') || 'image/png');
    res.setHeader('Cache-Control','public, s-maxage=300, stale-while-revalidate=3600');
    return res.status(200).send(Buffer.from(buffer));
  }catch(e){ console.error(e); return res.status(500).send('proxy error'); }
}
