"use client";
import {useEffect,useState} from "react";

export function WorkshopStatus(){
 const [open,setOpen]=useState<boolean|null>(null);
 useEffect(()=>{function update(){const parts=new Intl.DateTimeFormat("en-GB",{timeZone:"Europe/Moscow",weekday:"short",hour:"2-digit",hourCycle:"h23"}).formatToParts(new Date());const weekday=parts.find(p=>p.type==="weekday")?.value;const hour=Number(parts.find(p=>p.type==="hour")?.value);setOpen(!["Sat","Sun"].includes(weekday||"")&&hour>=10&&hour<20);}update();const id=setInterval(update,60000);return()=>clearInterval(id);},[]);
 return <span className={`workshop-status ${open?"is-open":""}`}><i/><span className="status-long">{open===null?"ПН–ПТ · 10:00–20:00":open?"СЕЙЧАС ОТКРЫТО · ДО 20:00":"СЕЙЧАС ЗАКРЫТО · ПН–ПТ 10:00–20:00"}</span><span className="status-short">{open===null?"10:00–20:00":open?"ОТКРЫТО ДО 20:00":"СЕЙЧАС ЗАКРЫТО"}</span></span>;
}

export function PhotoPreview({file}:{file:File}){
 const [url,setUrl]=useState("");
 useEffect(()=>{const src=URL.createObjectURL(file);setUrl(src);return()=>URL.revokeObjectURL(src);},[file]);
 return url?<img className="attachment-thumbnail" src={url} alt={`Предпросмотр: ${file.name}`}/>:<span className="attachment-thumbnail"/>;
}

export function SiteEffects(){
 useEffect(()=>{
  let observer:IntersectionObserver|undefined;
  const elements=Array.from(document.querySelectorAll(".service-card,.about-picture,.process-step,.faq-list details"));
  if(!window.matchMedia("(prefers-reduced-motion: reduce)").matches){observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.remove("reveal-pending");observer?.unobserve(entry.target);}});},{threshold:.08});elements.forEach(el=>{if(el.getBoundingClientRect().top>window.innerHeight){el.classList.add("reveal-pending");observer?.observe(el);}});}
  return()=>{observer?.disconnect();elements.forEach(el=>el.classList.remove("reveal-pending"));};
 },[]);
 return null;
}
