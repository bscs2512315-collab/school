"use client";

import { useState } from "react";
import { Check, RotateCcw, ZoomIn } from "lucide-react";
import BioHero from "./BioHero";

export type SlidePart = { id: string; label: string; lx: number; ly: number; tx: number; ty: number };
export type Slide = { key: string; name: string; parts: SlidePart[]; draw: (found: (id: string) => boolean, HL: string) => React.ReactNode };

export default function Microscope({badge,title,intro,slides}:{badge:string;title:string;intro:React.ReactNode;slides:Slide[]}){
  const [slideKey,setSlideKey]=useState(slides[0].key);
  const [mag,setMag]=useState(1);
  const [found,setFound]=useState<Record<string,Set<string>>>({});
  const [message,setMessage]=useState<string|null>(null);
  const slide=slides.find(s=>s.key===slideKey)!;
  const foundSet=found[slideKey]??new Set<string>();
  const target=slide.parts.find(p=>!foundSet.has(p.id));
  const done=!target;
  const allDone=slides.every(s=>s.parts.every(p=>found[s.key]?.has(p.id)));
  const pick=(id:string)=>{
    if(!target)return;
    if(id===target.id){setFound(previous=>({...previous,[slideKey]:new Set(previous[slideKey]??[]).add(id)}));setMessage(`Correct: ${target.label}. Look at its position and shape on the slide.`);}
    else {const other=slide.parts.find(p=>p.id===id);setMessage(`That marker shows ${other?.label}. Find ${target.label} instead.`);}
  };
  const chooseSlide=(key:string)=>{setSlideKey(key);setMag(1);setMessage(null);};
  const reset=()=>{setFound({});setSlideKey(slides[0].key);setMag(1);setMessage(null);};
  const count=slides.reduce((sum,s)=>sum+(found[s.key]?.size??0),0);
  const total=slides.reduce((sum,s)=>sum+s.parts.length,0);
  return <main className="h-[100dvh] overflow-y-auto overscroll-contain bg-[#eff4ef]">
    <div className="mx-auto w-full max-w-6xl px-3 py-3 sm:px-5 sm:py-4">
      <BioHero badge={badge} title={title}>{intro}</BioHero>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2"><div className="flex flex-wrap gap-2">{slides.map(s=><button key={s.key} onClick={()=>chooseSlide(s.key)} className={`min-h-10 rounded-xl px-3 text-xs font-black sm:text-sm ${s.key===slideKey?"bg-[#176b46] text-white":"border border-[#d7e6da] bg-white text-[#4a7156]"}`}>{s.name}{s.parts.every(p=>found[s.key]?.has(p.id))?" ✓":""}</button>)}</div><span className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-[#2b754b]">{count}/{total} found</span></div>
      <div className="mt-2 flex gap-1.5">{Array.from({length:total},(_,i)=><span key={i} className={`h-1.5 flex-1 rounded-full ${i<count?"bg-[#2a9158]":"bg-[#d5e5d8]"}`}/>)}</div>
      <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,.8fr)]">
        <section className="overflow-hidden rounded-[24px] border border-[#d8e7db] bg-white shadow-sm">
          <div className="border-b border-[#e3ece4] px-4 py-2 text-xs font-black uppercase tracking-widest text-[#66846e]">Digital slide · {slide.name}{target&&<span className="ml-2 text-[#258354] lg:hidden">· Find {target.label}</span>}</div>
          <div className="flex items-center justify-center p-4">
            <div className="relative aspect-square w-full max-w-[min(53dvh,500px)] overflow-hidden rounded-full border-[10px] border-[#263d30] bg-[#f3e9ef] shadow-inner">
              <div className="absolute inset-0" style={{transform:`scale(${mag})`,transformOrigin:"center"}}>
                <svg viewBox="0 0 300 300" className="absolute inset-0 h-full w-full" role="img" aria-label={`Study diagram of ${slide.name}`}>{slide.draw(id=>foundSet.has(id),"#258354")}</svg>
                {slide.parts.map((part,index)=><button key={part.id} type="button" onClick={()=>pick(part.id)} aria-label={`Marker ${index+1}: ${part.label}`} className={`absolute grid size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 text-xs font-black shadow-md transition hover:scale-110 sm:size-10 ${foundSet.has(part.id)?"border-white bg-[#258354] text-white":"border-[#4b7657] bg-white text-[#285e3f]"}`} style={{left:`${part.tx/3}%`,top:`${part.ty/3}%`}}>{foundSet.has(part.id)?<Check size={16}/>:index+1}</button>)}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 border-t border-[#e3ece4] px-3 py-2"><ZoomIn size={15} className="text-[#7e9583]"/>{[1,1.5,2].map((m,i)=><button key={m} onClick={()=>setMag(m)} className={`min-h-9 rounded-lg px-3 text-xs font-black ${mag===m?"bg-[#176b46] text-white":"bg-[#edf3ee] text-[#55745f]"}`}>{["4×","10×","40×"][i]}</button>)}</div>
        </section>
        <section className="rounded-[24px] border border-[#d8e7db] bg-white p-4 shadow-sm sm:p-5">
          <p className="text-xs font-black uppercase tracking-widest text-[#258354]">{done?"Slide complete":`Find ${foundSet.size+1} of ${slide.parts.length}`}</p>
          <h2 className="mt-2 text-2xl font-black text-[#193e2b]">{done?"All structures found":target?.label}</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#5d7363]">{done?"Compare this slide with the other stage or tissue type.":"Tap the corresponding numbered marker in the image. You can also choose a marker below."}</p>
          <div className="mt-4 grid grid-cols-3 gap-2">{slide.parts.map((part,index)=><button key={part.id} onClick={()=>pick(part.id)} disabled={done} className={`min-h-11 rounded-xl border text-sm font-black ${foundSet.has(part.id)?"border-[#288653] bg-[#288653] text-white":"border-[#d6e6d9] bg-[#f7faf7] text-[#286b47]"}`}>{foundSet.has(part.id)?<Check size={17} className="mx-auto"/>:index+1}</button>)}</div>
          <p role="status" className="mt-4 min-h-20 rounded-xl bg-[#f4f8f4] p-3 text-sm leading-relaxed text-[#5b7161]">{message??"Start with the named structure, then continue through the slide."}</p>
          {done&&<div className="mt-3 rounded-xl bg-[#e5f5e9] p-3 text-sm font-bold text-[#1b6942]">Slide complete! {allDone?"You identified every structure in the practical.":"Select the next slide to finish the practical."}</div>}
          <button onClick={reset} className="mt-4 inline-flex min-h-10 items-center gap-2 text-sm font-bold text-[#607b67]"><RotateCcw size={16}/> Restart practical</button>
        </section>
      </div>
    </div>
  </main>;
}
