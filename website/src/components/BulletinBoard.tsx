"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { NoteWidget, TodoWidget, BookmarkWidget, ClockWidget, WeatherWidget } from "./widgets";

// ── Types ─────────────────────────────────────────────────────────────────────

export type WidgetKind = "note"|"todo"|"bookmark"|"clock"|"weather";
export type DrawTool   = "select"|"pen"|"line"|"eraser"|"circle"|"box"|"text";
type ResizeHandle      = "nw"|"ne"|"se"|"sw"|"n"|"s"|"e"|"w";

export interface Widget {
  id:string; kind:WidgetKind;
  x:number; y:number; w:number; h:number;
  data:Record<string,unknown>;
  rotation:number; z?:number;
}

export interface Stroke {
  id:string; points:[number,number][];
  color:string; width:number;
  tool:"pen"|"line"|"circle"|"box";
}

export interface TextLabel {
  id:string; x:number; y:number;
  text:string; color:string; size:number;
}

interface SelectionState {
  widgetIds:Set<string>;
  strokeIds:Set<string>;
  labelIds: Set<string>;
}

interface BulletinBoardProps {
  weather:{temp:number;condition:string;icon:string;city:string}|null;
  timeFormat:"24h"|"12h";
  tempUnit:"C"|"F";
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function uid() { return Math.random().toString(36).slice(2,9); }

function deg2rad(d:number) { return d*Math.PI/180; }

function pointNearSegment(p:[number,number],a:[number,number],b:[number,number],t:number) {
  const dx=b[0]-a[0],dy=b[1]-a[1],lenSq=dx*dx+dy*dy;
  if(lenSq===0){const ex=p[0]-a[0],ey=p[1]-a[1];return Math.sqrt(ex*ex+ey*ey)<t;}
  const k=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/lenSq));
  const px=a[0]+k*dx-p[0],py=a[1]+k*dy-p[1];
  return Math.sqrt(px*px+py*py)<t;
}

function strokeBounds(s:Stroke) {
  const xs=s.points.map(p=>p[0]),ys=s.points.map(p=>p[1]);
  const x=Math.min(...xs),y=Math.min(...ys);
  return {x,y,w:Math.max(...xs)-x,h:Math.max(...ys)-y};
}

function hitTestStroke(pt:[number,number],s:Stroke):boolean {
  const t=Math.max(s.width/2+4,6);
  if(s.tool==="pen"){for(let i=0;i<s.points.length-1;i++)if(pointNearSegment(pt,s.points[i],s.points[i+1],t))return true;return false;}
  if(s.tool==="line")return pointNearSegment(pt,s.points[0],s.points[1]??s.points[0],t);
  const b=strokeBounds(s);
  if(s.tool==="circle"){
    const cx=b.x+b.w/2,cy=b.y+b.h/2,rx=b.w/2,ry=b.h/2;
    if(rx<1||ry<1)return false;
    const outer=(pt[0]-cx)**2/(rx+t)**2+(pt[1]-cy)**2/(ry+t)**2;
    const inner=(pt[0]-cx)**2/Math.max(1,rx-t)**2+(pt[1]-cy)**2/Math.max(1,ry-t)**2;
    return outer<=1&&inner>=1;
  }
  if(s.tool==="box"){
    const inO=pt[0]>=b.x-t&&pt[0]<=b.x+b.w+t&&pt[1]>=b.y-t&&pt[1]<=b.y+b.h+t;
    const inI=pt[0]>b.x+t&&pt[0]<b.x+b.w-t&&pt[1]>b.y+t&&pt[1]<b.y+b.h-t;
    return inO&&!inI;
  }
  return false;
}

function hitTestLabel(pt:[number,number],l:TextLabel):boolean {
  const w=l.text.length*l.size*0.6;
  return pt[0]>=l.x-4&&pt[0]<=l.x+w+4&&pt[1]>=l.y-l.size-4&&pt[1]<=l.y+4;
}

function hitTestWidget(pt:[number,number],w:Widget):boolean {
  return pt[0]>=w.x&&pt[0]<=w.x+w.w&&pt[1]>=w.y&&pt[1]<=w.y+w.h;
}

function pointsToPath(pts:[number,number][]):string {
  if(pts.length<2)return pts.length===1?`M ${pts[0][0]} ${pts[0][1]}`:"";
  let d=`M ${pts[0][0]} ${pts[0][1]}`;
  for(let i=1;i<pts.length;i++)d+=` L ${pts[i][0]} ${pts[i][1]}`;
  return d;
}

function ellipsePath(a:[number,number],b:[number,number]):string {
  const cx=(a[0]+b[0])/2,cy=(a[1]+b[1])/2;
  const rx=Math.abs(b[0]-a[0])/2,ry=Math.abs(b[1]-a[1])/2;
  if(rx<1||ry<1)return "";
  return `M ${cx-rx} ${cy} A ${rx} ${ry} 0 0 1 ${cx+rx} ${cy} A ${rx} ${ry} 0 0 1 ${cx-rx} ${cy} Z`;
}

function rectPath(a:[number,number],b:[number,number]):string {
  const x=Math.min(a[0],b[0]),y=Math.min(a[1],b[1]);
  const w=Math.abs(b[0]-a[0]),h=Math.abs(b[1]-a[1]);
  if(w<1||h<1)return "";
  return `M ${x} ${y} L ${x+w} ${y} L ${x+w} ${y+h} L ${x} ${y+h} Z`;
}

function strokeToPath(s:Stroke):string {
  if(s.tool==="circle")return ellipsePath(s.points[0],s.points[1]??s.points[0]);
  if(s.tool==="box")   return rectPath(s.points[0],s.points[1]??s.points[0]);
  return pointsToPath(s.points);
}

function eraserHitsStroke(pts:[number,number][],s:Stroke,t:number) {
  for(const ep of pts){
    for(let j=0;j<s.points.length-1;j++)if(pointNearSegment(ep,s.points[j],s.points[j+1],t))return true;
    if(s.points.length===1){const dx=ep[0]-s.points[0][0],dy=ep[1]-s.points[0][1];if(Math.sqrt(dx*dx+dy*dy)<t)return true;}
  }
  return false;
}

function eraserHitsText(pts:[number,number][],l:TextLabel,t:number) {
  for(const ep of pts){const dx=ep[0]-l.x,dy=ep[1]-l.y;if(Math.sqrt(dx*dx+dy*dy)<t+40)return true;}
  return false;
}

// Scale stroke points uniformly from a centre point
function scaleStroke(s:Stroke,sx:number,sy:number,cx:number,cy:number):Stroke {
  return {...s,points:s.points.map(([x,y])=>[(x-cx)*sx+cx,(y-cy)*sy+cy] as [number,number])};
}

// Rotate stroke points around a centre
function rotateStroke(s:Stroke,angleDeg:number,cx:number,cy:number):Stroke {
  const r=deg2rad(angleDeg);
  const cos=Math.cos(r),sin=Math.sin(r);
  return {...s,points:s.points.map(([x,y])=>{
    const dx=x-cx,dy=y-cy;
    return [cx+dx*cos-dy*sin, cy+dx*sin+dy*cos] as [number,number];
  })};
}

// ── Constants ─────────────────────────────────────────────────────────────────

const WIDGET_DEFAULTS:Record<WidgetKind,Omit<Widget,"id"|"x"|"y">>={
  note:    {kind:"note",    w:200,h:180,rotation:-1.2,data:{text:""}},
  todo:    {kind:"todo",    w:200,h:220,rotation:0.8, data:{items:[]}},
  bookmark:{kind:"bookmark",w:180,h:100,rotation:-0.5,data:{url:"",label:""}},
  clock:   {kind:"clock",  w:160,h:90, rotation:1.0, data:{}},
  weather: {kind:"weather",w:180,h:110,rotation:-0.8,data:{}},
};

const PALETTE=["#4ade80","#f87171","#facc15","#60a5fa","#e879f9","#34d399","#fb923c"];

const RESIZE_CURSORS:Record<ResizeHandle,string>={
  nw:"nw-resize",ne:"ne-resize",se:"se-resize",sw:"sw-resize",
  n:"n-resize",s:"s-resize",e:"e-resize",w:"w-resize",
};

// ── DrawCanvas ────────────────────────────────────────────────────────────────

interface DrawCanvasProps {
  strokes:Stroke[];labels:TextLabel[];selection:SelectionState;
  tool:DrawTool;color:string;brushSize:number;eraserSize:number;fontSize:number;active:boolean;
  onStrokeEnd:(s:Stroke)=>void;onErase:(pts:[number,number][])=>void;onAddLabel:(l:TextLabel)=>void;
}

function DrawCanvas({strokes,labels,selection,tool,color,brushSize,eraserSize,fontSize,active,onStrokeEnd,onErase,onAddLabel}:DrawCanvasProps){
  const svgRef=useRef<SVGSVGElement>(null);
  const currentPts=useRef<[number,number][]>([]);
  const shapeStart=useRef<[number,number]|null>(null);
  const drawing=useRef(false);
  const [eraserPos,setEraserPos]=useState<[number,number]|null>(null);
  const [livePath,setLivePath]=useState("");
  const [pendingText,setPendingText]=useState<{x:number;y:number;id:string}|null>(null);
  const [textValue,setTextValue]=useState("");
  const textInputRef=useRef<HTMLInputElement>(null);

  const stateRef=useRef({tool,color,brushSize,eraserSize,fontSize,active,onStrokeEnd,onErase,onAddLabel});
  useEffect(()=>{stateRef.current={tool,color,brushSize,eraserSize,fontSize,active,onStrokeEnd,onErase,onAddLabel};});

  const getPos=useCallback((e:PointerEvent):[number,number]=>{
    const r=svgRef.current!.getBoundingClientRect();
    return [e.clientX-r.left,e.clientY-r.top];
  },[]);

  const commitText=useCallback(()=>{
    if(!pendingText)return;
    const trimmed=textValue.trim();
    if(trimmed)onAddLabel({id:pendingText.id,x:pendingText.x,y:pendingText.y,text:trimmed,color,size:fontSize});
    setPendingText(null);setTextValue("");
  },[pendingText,textValue,color,fontSize,onAddLabel]);

  useEffect(()=>{
    const svg=svgRef.current;if(!svg)return;
    const onDown=(e:PointerEvent)=>{
      const{active,tool,onErase}=stateRef.current;
      if(!active||tool==="select"||tool==="text")return;
      const pos=getPos(e);
      drawing.current=true;svg.setPointerCapture(e.pointerId);
      if(tool==="pen"){currentPts.current=[pos];setLivePath(pointsToPath([pos]));}
      else if(tool==="line"||tool==="circle"||tool==="box"){shapeStart.current=pos;setLivePath("");}
      else if(tool==="eraser"){currentPts.current=[pos];onErase([pos]);}
    };
    const onMove=(e:PointerEvent)=>{
      const{active,tool,onErase}=stateRef.current;
      const pos=getPos(e);
      if(active&&tool==="eraser")setEraserPos(pos);else setEraserPos(null);
      if(!drawing.current||!active)return;
      if(tool==="pen"){currentPts.current.push(pos);setLivePath(pointsToPath(currentPts.current));}
      else if(tool==="line"&&shapeStart.current)setLivePath(pointsToPath([shapeStart.current,pos]));
      else if(tool==="circle"&&shapeStart.current)setLivePath(ellipsePath(shapeStart.current,pos));
      else if(tool==="box"&&shapeStart.current)setLivePath(rectPath(shapeStart.current,pos));
      else if(tool==="eraser"){currentPts.current.push(pos);onErase(currentPts.current);}
    };
    const onUp=(e:PointerEvent)=>{
      if(!drawing.current)return;
      drawing.current=false;
      const{tool,color,brushSize,onStrokeEnd}=stateRef.current;
      const pos=getPos(e);
      if(tool==="pen"&&currentPts.current.length>=2)
        onStrokeEnd({id:uid(),points:[...currentPts.current],color,width:brushSize,tool:"pen"});
      else if((tool==="line"||tool==="circle"||tool==="box")&&shapeStart.current){
        onStrokeEnd({id:uid(),points:[shapeStart.current,pos],color,width:brushSize,tool});
        shapeStart.current=null;
      }
      currentPts.current=[];setLivePath("");
    };
    const onLeave=()=>setEraserPos(null);
    svg.addEventListener("pointerdown",onDown);svg.addEventListener("pointermove",onMove);
    svg.addEventListener("pointerup",onUp);svg.addEventListener("pointerleave",onLeave);
    return()=>{
      svg.removeEventListener("pointerdown",onDown);svg.removeEventListener("pointermove",onMove);
      svg.removeEventListener("pointerup",onUp);svg.removeEventListener("pointerleave",onLeave);
    };
  },[getPos]);

  const handleTextClick=useCallback((e:React.MouseEvent<HTMLDivElement>)=>{
    if(!active||tool!=="text")return;
    if(pendingText){commitText();return;}
    const r=svgRef.current!.getBoundingClientRect();
    setPendingText({x:e.clientX-r.left,y:e.clientY-r.top,id:uid()});
    setTextValue("");
    setTimeout(()=>textInputRef.current?.focus(),0);
  },[active,tool,pendingText,commitText]);

  const isSelectTool=tool==="select";
  const liveStrokeDash=(tool==="line"||tool==="circle"||tool==="box")?"4 3":undefined;
  const cursor=!active?"default":tool==="eraser"?"none":tool==="text"?"text":tool==="select"?"default":"crosshair";

  return(
    <div className="absolute inset-0"
      style={{zIndex:active&&!isSelectTool?30:5,pointerEvents:active&&!isSelectTool?"all":"none",cursor}}
      onClick={handleTextClick}>
      <svg ref={svgRef} className="absolute inset-0 w-full h-full"
        style={{pointerEvents:tool==="text"?"none":"all"}}>
        {strokes.map(s=>(
          <path key={s.id} d={strokeToPath(s)} fill="none"
            stroke={s.color} strokeWidth={s.width} strokeLinecap="round" strokeLinejoin="round"/>
        ))}
        {strokes.filter(s=>selection.strokeIds.has(s.id)).map(s=>{
          const b=strokeBounds(s);
          return<rect key={`sel-${s.id}`} x={b.x-6} y={b.y-6} width={b.w+12} height={b.h+12}
            fill="none" stroke="var(--green)" strokeWidth={1} strokeDasharray="3 2"
            style={{pointerEvents:"none"}}/>;
        })}
        {livePath&&<path d={livePath} fill="none" stroke={color} strokeWidth={brushSize}
          strokeLinecap="round" strokeLinejoin="round" strokeDasharray={liveStrokeDash}/>}
        {active&&tool==="eraser"&&eraserPos&&
          <circle cx={eraserPos[0]} cy={eraserPos[1]} r={eraserSize/2}
            fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.35)"
            strokeWidth={1} style={{pointerEvents:"none"}}/>}
      </svg>
      {labels.map(l=>(
        <span key={l.id} className="absolute font-mono whitespace-pre"
          style={{left:l.x,top:l.y-l.size,color:l.color,fontSize:l.size,lineHeight:1.2,
            outline:selection.labelIds.has(l.id)?"1px dashed var(--green)":"none",
            outlineOffset:4,pointerEvents:"none",userSelect:"none"}}>
          {l.text}
        </span>
      ))}
      {pendingText&&(
        <input ref={textInputRef} value={textValue}
          onChange={e=>setTextValue(e.target.value)} onBlur={commitText}
          onKeyDown={e=>{if(e.key==="Enter")commitText();if(e.key==="Escape"){setPendingText(null);setTextValue("");}}}
          className="absolute bg-transparent outline-none font-mono caret-green border-b border-dashed border-green"
          style={{left:pendingText.x,top:pendingText.y-fontSize,color,fontSize,lineHeight:1.2,minWidth:80}}
          placeholder="type here..." spellCheck={false}/>
      )}
    </div>
  );
}

// ── WidgetCard — pure rendering, no pointer logic for resize/rotate ────────────

const WIDGET_LABELS:Record<WidgetKind,string>={
  note:"note",todo:"tasks",bookmark:"bookmark",clock:"clock",weather:"weather",
};

interface WidgetCardProps {
  widget:Widget;selected:boolean;selectMode:boolean;
  timeFormat:"24h"|"12h";tempUnit:"C"|"F";
  weather:BulletinBoardProps["weather"];
  onChange:(id:string,data:Record<string,unknown>)=>void;
  onDelete:(id:string)=>void;
}

function WidgetCard({widget,selected,selectMode,timeFormat,tempUnit,weather,onChange,onDelete}:WidgetCardProps){
  return(
    <div className="absolute group select-none"
      style={{left:widget.x,top:widget.y,width:widget.w,height:widget.h,
        transform:`rotate(${widget.rotation}deg)`,
        cursor:selectMode?(selected?"grab":"default"):"grab",
        zIndex:widget.z??10,touchAction:"none"}}>
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-green border border-surface z-10 opacity-80"/>
      {selected&&<div className="absolute pointer-events-none"
        style={{inset:-3,border:"1px dashed var(--green)",zIndex:1}}/>}
      <div className="w-full h-full bg-surface border border-border2 p-3 flex flex-col overflow-hidden"
        style={{boxShadow:"2px 4px 16px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03)"}}>
        <div className="flex items-center justify-between mb-2 shrink-0">
          <span className="text-[8px] text-muted tracking-[0.15em] uppercase">{WIDGET_LABELS[widget.kind]}</span>
          <button onPointerDown={e=>e.stopPropagation()} onClick={()=>onDelete(widget.id)}
            className="text-[10px] text-muted opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all">×</button>
        </div>
        <div className="flex-1 min-h-0">
          {widget.kind==="note"    &&<NoteWidget     data={widget.data} onChange={d=>onChange(widget.id,d)}/>}
          {widget.kind==="todo"    &&<TodoWidget     data={widget.data} onChange={d=>onChange(widget.id,d)}/>}
          {widget.kind==="bookmark"&&<BookmarkWidget data={widget.data} onChange={d=>onChange(widget.id,d)}/>}
          {widget.kind==="clock"   &&<ClockWidget    timeFormat={timeFormat}/>}
          {widget.kind==="weather" &&<WeatherWidget  weather={weather} tempUnit={tempUnit}/>}
        </div>
      </div>
    </div>
  );
}

// ── SelectOverlay ─────────────────────────────────────────────────────────────

interface SelectOverlayProps {
  widgets:Widget[];strokes:Stroke[];labels:TextLabel[];
  selection:SelectionState;
  onSetSelection:(s:SelectionState)=>void;
  onMoveSelected:(dx:number,dy:number)=>void;
  onMoveWidget:(id:string,x:number,y:number)=>void;
  onResizeWidget:(id:string,w:number,h:number,x:number,y:number)=>void;
  onRotateWidget:(id:string,rotation:number)=>void;
  onResizeStroke:(id:string,sx:number,sy:number,cx:number,cy:number)=>void;
  onRotateStroke:(id:string,angle:number,cx:number,cy:number)=>void;
  onBringForward:(id:string)=>void;
}

// All interact modes — coordinates are always overlay-relative
type InteractMode =
  | {kind:"none"}
  | {kind:"marquee";start:[number,number]}
  | {kind:"move";base:[number,number];widgetId?:string;widgetOrigin?:{wx:number;wy:number}}
  // Widget resize: startPos and ox/oy/ow/oh all overlay-relative
  | {kind:"resize-widget";widgetId:string;handle:ResizeHandle;startPos:[number,number];ox:number;oy:number;ow:number;oh:number}
  // Widget rotate: cx/cy are overlay-relative centre; startAngle is angle at pointer-down
  | {kind:"rotate-widget";widgetId:string;cx:number;cy:number;startAngle:number;origRotation:number}
  // Stroke resize: startPos overlay-relative; origStroke is a snapshot to scale from
  | {kind:"resize-stroke";strokeId:string;handle:ResizeHandle;origBounds:{x:number;y:number;w:number;h:number};origStroke:Stroke;startPos:[number,number]}
  // Stroke rotate: accumulate from snapshot each frame
  | {kind:"rotate-stroke";strokeId:string;cx:number;cy:number;startAngle:number;origStroke:Stroke};

function SelectOverlay({
  widgets,strokes,labels,selection,
  onSetSelection,onMoveSelected,onMoveWidget,onResizeWidget,onRotateWidget,
  onResizeStroke,onRotateStroke,onBringForward,
}:SelectOverlayProps){
  const [marquee,setMarquee]=useState<{x:number;y:number;w:number;h:number}|null>(null);
  const overlayRef=useRef<HTMLDivElement>(null);
  const mode=useRef<InteractMode>({kind:"none"});

  const stateRef=useRef({widgets,strokes,labels,selection,onSetSelection,onMoveSelected,onMoveWidget,onResizeWidget,onRotateWidget,onResizeStroke,onRotateStroke,onBringForward});
  useEffect(()=>{stateRef.current={widgets,strokes,labels,selection,onSetSelection,onMoveSelected,onMoveWidget,onResizeWidget,onRotateWidget,onResizeStroke,onRotateStroke,onBringForward};});

  const getPos=useCallback((e:PointerEvent|React.PointerEvent):[number,number]=>{
    const r=overlayRef.current!.getBoundingClientRect();
    return [e.clientX-r.left,e.clientY-r.top];
  },[]);

  // Angle (degrees) from (cx,cy) to (px,py) — all overlay-relative
  const angleTo=useCallback((cx:number,cy:number,px:number,py:number)=>
    Math.atan2(py-cy,px-cx)*180/Math.PI
  ,[]);

  useEffect(()=>{
    const el=overlayRef.current;if(!el)return;

    const onDown=(e:PointerEvent)=>{
      if((e.target as HTMLElement).closest("[data-handle]"))return;
      const{widgets,strokes,labels,selection,onSetSelection,onBringForward}=stateRef.current;
      const pos=getPos(e);
      el.setPointerCapture(e.pointerId);

      const hitSelWidget=widgets.find(w=>selection.widgetIds.has(w.id)&&hitTestWidget(pos,w));
      if(hitSelWidget){
        mode.current={kind:"move",base:pos,widgetId:hitSelWidget.id,widgetOrigin:{wx:hitSelWidget.x,wy:hitSelWidget.y}};
        onBringForward(hitSelWidget.id);return;
      }
      const hitSelStroke=strokes.find(s=>selection.strokeIds.has(s.id)&&hitTestStroke(pos,s));
      const hitSelLabel =labels.find(l=>selection.labelIds.has(l.id)&&hitTestLabel(pos,l));
      if(hitSelStroke||hitSelLabel){mode.current={kind:"move",base:pos};return;}

      const clickedWidget=widgets.find(w=>hitTestWidget(pos,w));
      if(clickedWidget){
        const add=e.shiftKey;
        const nw=new Set(add?selection.widgetIds:[]);
        if(nw.has(clickedWidget.id)&&add)nw.delete(clickedWidget.id);else nw.add(clickedWidget.id);
        onSetSelection({widgetIds:nw,strokeIds:add?selection.strokeIds:new Set(),labelIds:add?selection.labelIds:new Set()});
        mode.current={kind:"move",base:pos,widgetId:clickedWidget.id,widgetOrigin:{wx:clickedWidget.x,wy:clickedWidget.y}};
        onBringForward(clickedWidget.id);return;
      }
      const clickedStroke=strokes.find(s=>hitTestStroke(pos,s));
      const clickedLabel =labels.find(l=>hitTestLabel(pos,l));
      if(clickedStroke||clickedLabel){
        const add=e.shiftKey;
        onSetSelection({
          widgetIds:add?selection.widgetIds:new Set(),
          strokeIds:new Set([...(add?selection.strokeIds:[]),...(clickedStroke?[clickedStroke.id]:[])]),
          labelIds: new Set([...(add?selection.labelIds:[]), ...(clickedLabel ?[clickedLabel.id]:[])]),
        });
        mode.current={kind:"move",base:pos};return;
      }

      if(!e.shiftKey)onSetSelection({widgetIds:new Set(),strokeIds:new Set(),labelIds:new Set()});
      mode.current={kind:"marquee",start:pos};
    };

    const onMove=(e:PointerEvent)=>{
      const{onMoveSelected,onMoveWidget,onResizeWidget,onRotateWidget,onResizeStroke,onRotateStroke}=stateRef.current;
      const pos=getPos(e);
      const m=mode.current;

      if(m.kind==="move"){
        if(m.widgetId&&m.widgetOrigin){
          onMoveWidget(m.widgetId,m.widgetOrigin.wx+(pos[0]-m.base[0]),m.widgetOrigin.wy+(pos[1]-m.base[1]));
        } else {
          const dx=pos[0]-m.base[0],dy=pos[1]-m.base[1];
          (m as {base:[number,number]}).base=pos;
          onMoveSelected(dx,dy);
        }
        return;
      }

      if(m.kind==="resize-widget"){
        // All coords overlay-relative — consistent coordinate space
        const{widgetId,handle,startPos,ox,oy,ow,oh}=m;
        const dx=pos[0]-startPos[0],dy=pos[1]-startPos[1],MIN=80;
        let nx=ox,ny=oy,nw=ow,nh=oh;
        if(handle.includes("e"))nw=Math.max(MIN,ow+dx);
        if(handle.includes("s"))nh=Math.max(MIN,oh+dy);
        if(handle.includes("w")){nw=Math.max(MIN,ow-dx);nx=ox+ow-nw;}
        if(handle.includes("n")){nh=Math.max(MIN,oh-dy);ny=oy+oh-nh;}
        onResizeWidget(widgetId,nw,nh,nx,ny);return;
      }

      if(m.kind==="rotate-widget"){
        // cx/cy overlay-relative, pos overlay-relative — same space ✓
        const{widgetId,cx,cy,startAngle,origRotation}=m;
        onRotateWidget(widgetId,origRotation+(angleTo(cx,cy,pos[0],pos[1])-startAngle));return;
      }

      if(m.kind==="resize-stroke"){
        // Scale from origStroke snapshot so there's no drift
        const{strokeId,handle,origBounds:b,origStroke,startPos}=m;
        const dx=pos[0]-startPos[0],dy=pos[1]-startPos[1];
        const cx=b.x+b.w/2,cy=b.y+b.h/2;
        // Compute new bounding box dimensions based on which handle moved
        let nw=b.w,nh=b.h;
        if(handle.includes("e"))nw=Math.max(4,b.w+dx);
        if(handle.includes("w"))nw=Math.max(4,b.w-dx);
        if(handle.includes("s"))nh=Math.max(4,b.h+dy);
        if(handle.includes("n"))nh=Math.max(4,b.h-dy);
        const sx=nw/Math.max(1,b.w), sy=nh/Math.max(1,b.h);
        onResizeStroke(strokeId,sx,sy,cx,cy);
        return;
      }

      if(m.kind==="rotate-stroke"){
        // Rotate origStroke snapshot by total delta — no accumulation drift
        const{strokeId,cx,cy,startAngle,origStroke}=m;
        const totalDelta=angleTo(cx,cy,pos[0],pos[1])-startAngle;
        // We pass the delta and let the parent apply it to origStroke snapshot
        onRotateStroke(strokeId,totalDelta,cx,cy);
        return;
      }

      if(m.kind==="marquee"){
        setMarquee({x:Math.min(m.start[0],pos[0]),y:Math.min(m.start[1],pos[1]),
          w:Math.abs(pos[0]-m.start[0]),h:Math.abs(pos[1]-m.start[1])});
        return;
      }
    };

    const onUp=(e:PointerEvent)=>{
      const{widgets,strokes,labels,selection,onSetSelection}=stateRef.current;
      const m=mode.current;
      if(m.kind==="marquee"){
        const mq=marquee;
        if(mq&&(mq.w>4||mq.h>4)){
          const inBox=(x:number,y:number)=>x>=mq.x&&x<=mq.x+mq.w&&y>=mq.y&&y<=mq.y+mq.h;
          onSetSelection({
            widgetIds:new Set([...(e.shiftKey?selection.widgetIds:[]),...widgets.filter(w=>inBox(w.x+w.w/2,w.y+w.h/2)).map(w=>w.id)]),
            strokeIds:new Set([...(e.shiftKey?selection.strokeIds:[]),...strokes.filter(s=>{const b=strokeBounds(s);return inBox(b.x+b.w/2,b.y+b.h/2);}).map(s=>s.id)]),
            labelIds: new Set([...(e.shiftKey?selection.labelIds:[]),...labels.filter(l=>inBox(l.x,l.y)).map(l=>l.id)]),
          });
        }
        setMarquee(null);
      }
      mode.current={kind:"none"};
    };

    el.addEventListener("pointerdown",onDown);
    el.addEventListener("pointermove",onMove);
    el.addEventListener("pointerup",onUp);
    return()=>{
      el.removeEventListener("pointerdown",onDown);
      el.removeEventListener("pointermove",onMove);
      el.removeEventListener("pointerup",onUp);
    };
  },[getPos,angleTo,marquee]);

  // ── Handle definitions ────────────────────────────────────────────────────

  const resizeHandleDefs:[ResizeHandle,React.CSSProperties][]=[
    ["nw",{top:-5,left:-5}],["ne",{top:-5,right:-5}],
    ["se",{bottom:-5,right:-5}],["sw",{bottom:-5,left:-5}],
    ["n",{top:-5,left:"calc(50% - 4px)"}],["s",{bottom:-5,left:"calc(50% - 4px)"}],
    ["e",{top:"calc(50% - 4px)",right:-5}],["w",{top:"calc(50% - 4px)",left:-5}],
  ];

  const RotateHandle=({onPDown}:{onPDown:(e:React.PointerEvent)=>void})=>(
    <>
      <div data-handle="rotate" className="absolute pointer-events-auto flex items-center justify-center"
        style={{top:-30,left:"calc(50% - 8px)",width:16,height:16,cursor:"crosshair",touchAction:"none",zIndex:21}}
        onPointerDown={onPDown}>
        <div className="w-3.5 h-3.5 rounded-full border-2 border-green bg-surface opacity-90"/>
      </div>
      <div className="absolute pointer-events-none"
        style={{top:-26,left:"calc(50% - 0.5px)",width:1,height:22,background:"var(--green)",opacity:0.5}}/>
    </>
  );

  return(
    <div ref={overlayRef} className="absolute inset-0" style={{zIndex:50}}>

      {/* Widget handles */}
      {widgets.filter(w=>selection.widgetIds.has(w.id)).map(w=>{
        // cx/cy in overlay coords — used for rotate angle calculation
        const cx=w.x+w.w/2, cy=w.y+w.h/2;
        return(
          <div key={`wh-${w.id}`} className="absolute pointer-events-none"
            style={{left:w.x,top:w.y,width:w.w,height:w.h,
              transform:`rotate(${w.rotation}deg)`,transformOrigin:"center center"}}>
            {resizeHandleDefs.map(([handle,style])=>(
              <div key={handle} data-handle="resize"
                className="absolute w-2.5 h-2.5 bg-surface border border-green z-20 pointer-events-auto"
                style={{...style,cursor:RESIZE_CURSORS[handle],touchAction:"none"}}
                onPointerDown={e=>{
                  e.stopPropagation();
                  (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                  const pos=getPos(e);
                  // startPos in overlay coords — same space as getPos in onMove
                  mode.current={kind:"resize-widget",widgetId:w.id,handle,startPos:pos,ox:w.x,oy:w.y,ow:w.w,oh:w.h};
                }}/>
            ))}
            <RotateHandle onPDown={e=>{
              e.stopPropagation();
              (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
              const pos=getPos(e);
              mode.current={kind:"rotate-widget",widgetId:w.id,cx,cy,startAngle:angleTo(cx,cy,pos[0],pos[1]),origRotation:w.rotation};
            }}/>
          </div>
        );
      })}

      {/* Stroke/shape handles */}
      {strokes.filter(s=>selection.strokeIds.has(s.id)).map(s=>{
        const b=strokeBounds(s);
        const pad=10;
        const cx=b.x+b.w/2, cy=b.y+b.h/2;
        return(
          <div key={`sh-${s.id}`} className="absolute pointer-events-none"
            style={{left:b.x-pad,top:b.y-pad,width:b.w+pad*2,height:b.h+pad*2}}>
            {resizeHandleDefs.map(([handle,style])=>(
              <div key={handle} data-handle="resize"
                className="absolute w-2.5 h-2.5 bg-surface border border-green z-20 pointer-events-auto"
                style={{...style,cursor:RESIZE_CURSORS[handle],touchAction:"none"}}
                onPointerDown={e=>{
                  e.stopPropagation();
                  (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                  const pos=getPos(e);
                  mode.current={kind:"resize-stroke",strokeId:s.id,handle,origBounds:b,origStroke:{...s,points:[...s.points]},startPos:pos};
                }}/>
            ))}
            <RotateHandle onPDown={e=>{
              e.stopPropagation();
              (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
              const pos=getPos(e);
              mode.current={kind:"rotate-stroke",strokeId:s.id,cx,cy,startAngle:angleTo(cx,cy,pos[0],pos[1]),origStroke:{...s,points:[...s.points]}};
            }}/>
          </div>
        );
      })}

      {marquee&&(
        <div className="absolute pointer-events-none"
          style={{left:marquee.x,top:marquee.y,width:marquee.w,height:marquee.h,
            border:"1px dashed var(--green)",background:"rgba(74,222,128,0.05)"}}/>
      )}
    </div>
  );
}

// ── ToolBtn ───────────────────────────────────────────────────────────────────

function ToolBtn({label,icon,active,onClick}:{label:string;icon:string;active:boolean;onClick:()=>void}){
  return(
    <button onClick={onClick} title={label}
      className={`flex items-center gap-1.5 text-[10px] tracking-[0.07em] border px-2.5 py-1.5 font-mono transition-colors
        ${active?"border-green text-green bg-green/10":"border-border2 text-muted hover:text-tx hover:border-muted"}`}>
      <span>{icon}</span>{label}
    </button>
  );
}

// ── BulletinBoard ─────────────────────────────────────────────────────────────

export function BulletinBoard({weather,timeFormat,tempUnit}:BulletinBoardProps){
  const [widgets,    setWidgets]    = useState<Widget[]>([]);
  const [strokes,    setStrokes]    = useState<Stroke[]>([]);
  const [labels,     setLabels]     = useState<TextLabel[]>([]);
  const [drawMode,   setDrawMode]   = useState(false);
  const [activeTool, setActiveTool] = useState<DrawTool>("pen");
  const [drawColor,  setDrawColor]  = useState(PALETTE[0]);
  const [brushSize,  setBrushSize]  = useState(2);
  const [eraserSize, setEraserSize] = useState(20);
  const [fontSize,   setFontSize]   = useState(14);
  const [showAddMenu,setShowAddMenu]= useState(false);
  const [,setZCounter]=useState(10);
  const [selection,setSelection]=useState<SelectionState>({widgetIds:new Set(),strokeIds:new Set(),labelIds:new Set()});
  const boardRef=useRef<HTMLDivElement>(null);

  // ── Widget ops ────────────────────────────────────────────────────────────

  const addWidget=useCallback((kind:WidgetKind)=>{
    const b=boardRef.current;
    const cx=b?b.clientWidth/2-100+(Math.random()-0.5)*120:200;
    const cy=b?b.clientHeight/2-100+(Math.random()-0.5)*80:200;
    const w:Widget={...WIDGET_DEFAULTS[kind],id:uid(),x:cx,y:cy};
    setZCounter(z=>{w.z=z+1;return z+1;});
    setWidgets(ws=>[...ws,w]);
    setShowAddMenu(false);
  },[]);

  const moveWidget  =useCallback((id:string,x:number,y:number)=>setWidgets(ws=>ws.map(w=>w.id===id?{...w,x,y}:w)),[]);
  const resizeWidget=useCallback((id:string,nw:number,nh:number,nx:number,ny:number)=>setWidgets(ws=>ws.map(w=>w.id===id?{...w,w:nw,h:nh,x:nx,y:ny}:w)),[]);
  const rotateWidget=useCallback((id:string,rotation:number)=>setWidgets(ws=>ws.map(w=>w.id===id?{...w,rotation}:w)),[]);
  const updateWidget=useCallback((id:string,data:Record<string,unknown>)=>setWidgets(ws=>ws.map(w=>w.id===id?{...w,data}:w)),[]);
  const deleteWidget=useCallback((id:string)=>setWidgets(ws=>ws.filter(w=>w.id!==id)),[]);
  const bringForward=useCallback((id:string)=>{setZCounter(z=>{const n=z+1;setWidgets(ws=>ws.map(w=>w.id===id?{...w,z:n}:w));return n;});},[]);

  // ── Stroke transform ops ──────────────────────────────────────────────────

  // resizeStroke accumulates scale from the *original* bounds on each frame,
  // so we keep a "resize origin snapshot" in a ref to avoid drift.
  // Resize/rotate origin snapshots — keyed by stroke id, cleared when selection changes
  const resizeOriginRef=useRef<Map<string,Stroke>>(new Map());
  const rotateOriginRef=useRef<Map<string,{stroke:Stroke;cx:number;cy:number}>>(new Map());
  useEffect(()=>{resizeOriginRef.current.clear();rotateOriginRef.current.clear();},[selection]);

  // sx/sy are relative to the original bounds — always apply to snapshot to avoid drift
  const handleResizeStroke=useCallback((id:string,sx:number,sy:number,cx:number,cy:number)=>{
    setStrokes(prev=>{
      if(!resizeOriginRef.current.has(id)){
        const orig=prev.find(s=>s.id===id);
        if(orig)resizeOriginRef.current.set(id,{...orig,points:[...orig.points]});
      }
      const orig=resizeOriginRef.current.get(id);
      if(!orig)return prev;
      return prev.map(s=>s.id===id?scaleStroke(orig,sx,sy,cx,cy):s);
    });
  },[]);

  // totalDelta is the full angle from drag-start — apply to snapshot each frame
  const handleRotateStroke=useCallback((id:string,totalDelta:number,cx:number,cy:number)=>{
    setStrokes(prev=>{
      if(!rotateOriginRef.current.has(id)){
        const orig=prev.find(s=>s.id===id);
        if(orig)rotateOriginRef.current.set(id,{stroke:{...orig,points:[...orig.points]},cx,cy});
      }
      const entry=rotateOriginRef.current.get(id);
      if(!entry)return prev;
      return prev.map(s=>s.id===id?rotateStroke(entry.stroke,totalDelta,entry.cx,entry.cy):s);
    });
  },[]);

  // ── Selection ops ─────────────────────────────────────────────────────────

  const clearSelection=useCallback(()=>setSelection({widgetIds:new Set(),strokeIds:new Set(),labelIds:new Set()}),[]);

  const handleMoveSelected=useCallback((dx:number,dy:number)=>{
    setStrokes(prev=>prev.map(s=>selection.strokeIds.has(s.id)?{...s,points:s.points.map(([x,y])=>[x+dx,y+dy] as [number,number])}:s));
    setLabels(prev=>prev.map(l=>selection.labelIds.has(l.id)?{...l,x:l.x+dx,y:l.y+dy}:l));
    setWidgets(prev=>prev.map(w=>selection.widgetIds.has(w.id)?{...w,x:w.x+dx,y:w.y+dy}:w));
  },[selection]);

  // ── Draw ops ──────────────────────────────────────────────────────────────

  const addStroke  =useCallback((s:Stroke)=>setStrokes(prev=>[...prev,s]),[]);
  const addLabel   =useCallback((l:TextLabel)=>setLabels(prev=>[...prev,l]),[]);
  const handleErase=useCallback((pts:[number,number][])=>{
    setStrokes(prev=>prev.filter(s=>!eraserHitsStroke(pts,s,eraserSize/2+s.width)));
    setLabels(prev=>prev.filter(l=>!eraserHitsText(pts,l,eraserSize/2)));
  },[eraserSize]);

  // ── Keyboard ─────────────────────────────────────────────────────────────

  useEffect(()=>{
    const h=(e:KeyboardEvent)=>{
      if(e.key!=="Delete"&&e.key!=="Backspace")return;
      if(document.activeElement instanceof HTMLInputElement||document.activeElement instanceof HTMLTextAreaElement)return;
      const{strokeIds,labelIds,widgetIds}=selection;
      if(!strokeIds.size&&!labelIds.size&&!widgetIds.size)return;
      setStrokes(prev=>prev.filter(s=>!strokeIds.has(s.id)));
      setLabels(prev=>prev.filter(l=>!labelIds.has(l.id)));
      setWidgets(prev=>prev.filter(w=>!widgetIds.has(w.id)));
      clearSelection();
    };
    document.addEventListener("keydown",h);
    return()=>document.removeEventListener("keydown",h);
  },[selection,clearSelection]);

  // ── Mode ──────────────────────────────────────────────────────────────────

  const isSelectTool=activeTool==="select";
  const selectMode  =drawMode&&isSelectTool;

  const enterDrawMode=useCallback((tool:DrawTool)=>{
    setActiveTool(tool);setDrawMode(true);setShowAddMenu(false);
    if(tool!=="select")clearSelection();
  },[clearSelection]);

  const exitDrawMode=useCallback(()=>{setDrawMode(false);clearSelection();},[clearSelection]);

  const isEraserTool   =activeTool==="eraser";
  const isTextTool     =activeTool==="text";
  const showColorPicker=drawMode&&!isEraserTool&&!isSelectTool;
  const showBrushSize  =drawMode&&!isEraserTool&&!isTextTool&&!isSelectTool;
  const showEraserSize =drawMode&&isEraserTool;
  const showFontSize   =drawMode&&isTextTool;
  const hasSelection   =selection.strokeIds.size>0||selection.labelIds.size>0||selection.widgetIds.size>0;
  const selCount       =selection.strokeIds.size+selection.labelIds.size+selection.widgetIds.size;

  return(
    <div ref={boardRef} className="relative w-full h-full overflow-hidden">

      <DrawCanvas
        strokes={strokes} labels={labels} selection={selection}
        tool={activeTool} color={drawColor} brushSize={brushSize}
        eraserSize={eraserSize} fontSize={fontSize} active={drawMode}
        onStrokeEnd={addStroke} onErase={handleErase} onAddLabel={addLabel}/>

      {widgets.map(w=>(
        <WidgetCard key={w.id} widget={w}
          selected={selection.widgetIds.has(w.id)} selectMode={selectMode}
          timeFormat={timeFormat} tempUnit={tempUnit} weather={weather}
          onChange={updateWidget} onDelete={deleteWidget}/>
      ))}

      {selectMode&&(
        <SelectOverlay
          widgets={widgets} strokes={strokes} labels={labels} selection={selection}
          onSetSelection={setSelection}
          onMoveSelected={handleMoveSelected}
          onMoveWidget={moveWidget}
          onResizeWidget={resizeWidget}
          onRotateWidget={rotateWidget}
          onResizeStroke={handleResizeStroke}
          onRotateStroke={handleRotateStroke}
          onBringForward={bringForward}/>
      )}

      {widgets.length===0&&!drawMode&&(
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-[11px] text-muted tracking-[0.12em] uppercase">empty board</p>
            <p className="text-[10px] text-dim mt-1">add a widget or start drawing</p>
          </div>
        </div>
      )}

      {/* ── Toolbar ── */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-[60] flex-wrap justify-center">

        <div className="relative">
          <button onClick={()=>{setShowAddMenu(m=>!m);exitDrawMode();}}
            className={`text-[10px] tracking-[0.08em] border px-3 py-1.5 font-mono transition-colors
              ${showAddMenu?"border-green text-green":"border-border2 text-muted hover:text-tx hover:border-muted"}`}>
            + widget
          </button>
          {showAddMenu&&(
            <div className="absolute bottom-[calc(100%+6px)] left-0 bg-surface border border-border2 py-1 shadow-xl min-w-30">
              {(["note","todo","bookmark","clock","weather"] as WidgetKind[]).map(k=>(
                <button key={k} onClick={()=>addWidget(k)}
                  className="block w-full text-left px-3 py-1.5 text-[10px] text-muted hover:text-tx hover:bg-border transition-colors font-mono tracking-wider">
                  {k}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="w-px h-5 bg-border2"/>

        <ToolBtn label="select" icon="↖" active={selectMode}
          onClick={()=>selectMode?exitDrawMode():enterDrawMode("select")}/>

        <div className="w-px h-5 bg-border2"/>

        <ToolBtn label="pen"    icon="✏" active={drawMode&&activeTool==="pen"}    onClick={()=>drawMode&&activeTool==="pen"    ?exitDrawMode():enterDrawMode("pen")}/>
        <ToolBtn label="line"   icon="╱" active={drawMode&&activeTool==="line"}   onClick={()=>drawMode&&activeTool==="line"   ?exitDrawMode():enterDrawMode("line")}/>
        <ToolBtn label="circle" icon="○" active={drawMode&&activeTool==="circle"} onClick={()=>drawMode&&activeTool==="circle" ?exitDrawMode():enterDrawMode("circle")}/>
        <ToolBtn label="box"    icon="□" active={drawMode&&activeTool==="box"}    onClick={()=>drawMode&&activeTool==="box"    ?exitDrawMode():enterDrawMode("box")}/>
        <ToolBtn label="text"   icon="T" active={drawMode&&activeTool==="text"}   onClick={()=>drawMode&&activeTool==="text"   ?exitDrawMode():enterDrawMode("text")}/>
        <ToolBtn label="eraser" icon="◻" active={drawMode&&activeTool==="eraser"} onClick={()=>drawMode&&activeTool==="eraser" ?exitDrawMode():enterDrawMode("eraser")}/>

        {drawMode&&(
          <>
            <div className="w-px h-5 bg-border2"/>

            {showColorPicker&&(
              <div className="flex items-center gap-1 border border-border2 px-2 py-1.5">
                {PALETTE.map(c=>(
                  <button key={c} onClick={()=>setDrawColor(c)}
                    className={`w-3.5 h-3.5 rounded-full transition-transform ${drawColor===c?"scale-125 ring-1 ring-white/40":""}`}
                    style={{background:c}}/>
                ))}
              </div>
            )}

            {showBrushSize&&(
              <div className="flex items-center gap-1.5 border border-border2 px-2 py-1.5">
                {[1,2,4,8].map(s=>(
                  <button key={s} onClick={()=>setBrushSize(s)}
                    className={`w-4 h-4 flex items-center justify-center transition-colors ${brushSize===s?"text-green":"text-muted hover:text-tx"}`}>
                    <div className="rounded-full bg-current" style={{width:s*2+2,height:s*2+2}}/>
                  </button>
                ))}
              </div>
            )}

            {showEraserSize&&(
              <div className="flex items-center gap-1 border border-border2 px-2 py-1.5">
                <span className="text-[9px] text-muted mr-1">size</span>
                {[12,20,36,56].map(s=>(
                  <button key={s} onClick={()=>setEraserSize(s)}
                    className={`flex items-center justify-center transition-colors ${eraserSize===s?"text-green":"text-muted hover:text-tx"}`}
                    style={{width:18,height:18}}>
                    <div className="rounded-full border border-current" style={{width:Math.min(s/3,14),height:Math.min(s/3,14)}}/>
                  </button>
                ))}
              </div>
            )}

            {showFontSize&&(
              <div className="flex items-center gap-1.5 border border-border2 px-2 py-1.5">
                <span className="text-[9px] text-muted mr-1">size</span>
                {[10,14,20,28].map(s=>(
                  <button key={s} onClick={()=>setFontSize(s)}
                    className={`font-mono transition-colors leading-none ${fontSize===s?"text-green":"text-muted hover:text-tx"}`}
                    style={{fontSize:Math.max(8,s*0.6)}}>A</button>
                ))}
              </div>
            )}

            {selectMode&&hasSelection&&(
              <button onClick={()=>{
                  setStrokes(p=>p.filter(s=>!selection.strokeIds.has(s.id)));
                  setLabels(p=>p.filter(l=>!selection.labelIds.has(l.id)));
                  setWidgets(p=>p.filter(w=>!selection.widgetIds.has(w.id)));
                  clearSelection();
                }}
                className="text-[10px] tracking-[0.08em] border border-red-900 text-red-500 hover:border-red-500 px-3 py-1.5 font-mono transition-colors">
                delete ({selCount})
              </button>
            )}

            <div className="w-px h-5 bg-border2"/>

            <button onClick={()=>{setStrokes([]);setLabels([]);clearSelection();}}
              className="text-[10px] tracking-[0.08em] border border-red-900 text-red-500 hover:border-red-500 px-3 py-1.5 font-mono transition-colors">
              clear
            </button>
          </>
        )}
      </div>
    </div>
  );
}