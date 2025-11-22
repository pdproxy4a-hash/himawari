import { useState, useRef } from 'react';

export default function usePanZoom(canvasRef, initialZoom=1) {
  const [zoom,setZoom] = useState(initialZoom);
  const [offset,setOffset] = useState({x:0,y:0});
  const isDragging = useRef(false);
  const dragStart = useRef({x:0,y:0});
  const lastOffset = useRef({x:0,y:0});

  const handleMouseDown = e => { 
    isDragging.current=true; 
    dragStart.current={x:e.clientX,y:e.clientY}; 
    lastOffset.current={...offset}; 
  };
  const handleMouseMove = e => { 
    if(!isDragging.current) return;
    setOffset({x:lastOffset.current.x+(e.clientX-dragStart.current.x),
               y:lastOffset.current.y+(e.clientY-dragStart.current.y)});
  };
  const handleMouseUp = () => { isDragging.current=false; };

  const handleWheel = e => {
    e.preventDefault();
    const scaleFactor=1.2;
    const newZoom=e.deltaY<0?zoom*scaleFactor:zoom/scaleFactor;
    const mouseX=e.clientX, mouseY=e.clientY;
    const dx=(mouseX-offset.x)*(newZoom/zoom-1);
    const dy=(mouseY-offset.y)*(newZoom/zoom-1);
    setOffset({x:offset.x-dx,y:offset.y-dy});
    setZoom(newZoom);
  };

  return { zoom, offset, setZoom, setOffset, handleMouseDown, handleMouseMove, handleMouseUp, handleWheel };
}
