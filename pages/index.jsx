import React, { useRef, useEffect, useState } from 'react';
import useTileCache from '../hooks/useTileCache';
import usePanZoom from '../hooks/usePanZoom';

const TILE_SIZE=256;

function formatHimaTime(date=new Date()){
  const pad=(n,d=2)=>String(n).padStart(d,'0');
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth()+1)}${pad(date.getUTCDate())}${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}`;
}

export default function Home(){
  const canvasRef=useRef(null);
  const bufferCanvasRef=useRef(null);
  const { zoom, offset, handleMouseDown, handleMouseMove, handleMouseUp, handleWheel } = usePanZoom(canvasRef);

  const { getTile, prefetchTiles, evictOldTiles } = useTileCache();

  const [timeA,setTimeA]=useState(formatHimaTime());
  const [timeB,setTimeB]=useState(formatHimaTime());
  const [frameIndex,setFrameIndex]=useState(0);
  const [interpolationFrames,setInterpolationFrames]=useState(Number(process.env.NEXT_PUBLIC_INTERPOLATION_FRAMES)||30);
  const [isPaused,setIsPaused]=useState(false);

  const MAX_LEVEL = Number(process.env.NEXT_PUBLIC_MAX_LEVEL)||4;
  const refreshInterval = Number(process.env.NEXT_PUBLIC_REFRESH_INTERVAL)||10;

  useEffect(()=>{
    const canvas=canvasRef.current;
    const bufferCanvas=bufferCanvasRef.current;
    const ctx=canvas.getContext('2d');
    bufferCanvas.width=canvas.width=window.innerWidth-20;
    bufferCanvas.height=canvas.height=window.innerHeight-160;
    const width=canvas.width;
    const height=canvas.height;
    const bufferCtx=bufferCanvas.getContext('2d');

    let animationFrame;

    const render=()=>{
      bufferCtx.clearRect(0,0,width,height);

      const level=Math.min(MAX_LEVEL,Math.max(1,Math.round(Math.log2(zoom*MAX_LEVEL))));
      const scaledTileSize=TILE_SIZE*zoom;
      const xStart=Math.floor(-offset.x/scaledTileSize);
      const yStart=Math.floor(-offset.y/scaledTileSize);
      const xEnd=Math.ceil((width-offset.x)/scaledTileSize);
      const yEnd=Math.ceil((height-offset.y)/scaledTileSize);

      prefetchTiles(level,xStart,yStart,xEnd,yEnd,timeA);
      prefetchTiles(level,xStart,yStart,xEnd,yEnd,timeB);

      const alpha = frameIndex/interpolationFrames;

      for(let y=yStart;y<=yEnd;y++){
        for(let x=xStart;x<=xEnd;x++){
          const tileA = getTile(level,x,y,timeA);
          const tileB = getTile(level,x,y,timeB);

          if(tileA.state==='loaded'){ bufferCtx.globalAlpha=1-alpha; bufferCtx.drawImage(tileA.img, offset.x+x*scaledTileSize, offset.y+y*scaledTileSize, scaledTileSize, scaledTileSize); }
          else{ bufferCtx.fillStyle='black'; bufferCtx.fillRect(offset.x+x*scaledTileSize, offset.y+y*scaledTileSize, scaledTileSize, scaledTileSize); }

          if(tileB.state==='loaded'){ bufferCtx.globalAlpha=alpha; bufferCtx.drawImage(tileB.img, offset.x+x*scaledTileSize, offset.y+y*scaledTileSize, scaledTileSize, scaledTileSize); }
        }
      }
      bufferCtx.globalAlpha=1;

      ctx.clearRect(0,0,width,height);
      ctx.drawImage(bufferCanvas,0,0);

      setFrameIndex((f)=> (f+1)%interpolationFrames);
      animationFrame=requestAnimationFrame(render);
    };

    render();

    const interval=setInterval(()=>{
      if(!isPaused && frameIndex===0){
        setTimeA(timeB);
        setTimeB(formatHimaTime());
        evictOldTiles([timeB, formatHimaTime()]);
      }
    },refreshInterval*1000);

    return ()=>{ cancelAnimationFrame(animationFrame); clearInterval(interval); };
  },[zoom,offset,isPaused,interpolationFrames]);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4 select-none">
      <header className="flex items-center justify-between w-full max-w-7xl mb-4">
        <h1 className="text-2xl font-bold">Himawari Ultra Viewer</h1>
        <div className="flex items-center gap-2">
          <button onClick={()=>setIsPaused(p=>!p)} className="px-3 py-1 bg-blue-600 rounded">{isPaused?'Resume':'Pause'}</button>
          <label className="text-sm">Frames:</label>
          <input type="number" min="1" max="100" value={interpolationFrames} onChange={e=>setInterpolationFrames(Number(e.target.value))} className="w-16 p-1 bg-gray-800 rounded text-white"/>
        </div>
      </header>

      <canvas
        ref={canvasRef}
        className="border border-gray-800 rounded-md shadow-lg cursor-grab"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />
      <canvas ref={bufferCanvasRef} style={{display:'none'}} />
    </div>
  );
}
