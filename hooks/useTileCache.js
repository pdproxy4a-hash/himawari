import { useRef } from 'react';

export default function useTileCache() {
  const cache = useRef({}); // { key: { state:'loading'|'loaded'|'error', img: Image } }

  function getTile(level,x,y,time) {
    const key = `${level}_${x}_${y}_${time}`;
    if(cache.current[key]) return cache.current[key];
    const img = new Image();
    img.crossOrigin="anonymous";
    cache.current[key] = { state:'loading', img };
    img.src = `/api/proxy?url=${encodeURIComponent(
      process.env.NEXT_PUBLIC_TILE_URL_TEMPLATE
        .replace('{level}',level)
        .replace('{x}',x)
        .replace('{y}',y)
        .replace('{time}',time)
    )}`;
    img.onload = ()=>cache.current[key].state='loaded';
    img.onerror = ()=>cache.current[key].state='error';
    return cache.current[key];
  }

  function prefetchTiles(level,xStart,yStart,xEnd,yEnd,time,radius=3){
    for(let y=yStart-radius;y<=yEnd+radius;y++){
      for(let x=xStart-radius;x<=xEnd+radius;x++){
        getTile(level,x,y,time);
      }
    }
  }

  function evictOldTiles(currentTimes){
    for(const key in cache.current){
      if(!currentTimes.some(t=>key.includes(t))){
        delete cache.current[key];
      }
    }
  }

  return { getTile, prefetchTiles, evictOldTiles };
}
