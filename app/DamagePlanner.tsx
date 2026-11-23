"use client";
import {useState} from "react";
import {Check,Plus,RotateCcw,Car,Paintbrush,Flame,Wrench,ScanLine,ShieldCheck,HelpCircle} from "lucide-react";
import {damageZones} from "./damage-zones";
import {bodyPanelIds,getRepairPlan,getRepairScope,plannerServices} from "./repair-plan";
import CarViewer,{type CarView} from "./CarViewer";

const icons=[HelpCircle,Car,Paintbrush,Flame,Wrench,ScanLine,ShieldCheck];
export default function DamagePlanner({selected,onChange,service,onServiceChange,scope,onScopeChange,onContinue}:{selected:string[];onChange:(value:string[])=>void;service:string;onServiceChange:(service:string)=>void;scope:string;onScopeChange:(scope:string)=>void;onContinue:()=>void}){
 const [requestedView,setRequestedView]=useState<{id:CarView;key:number}>({id:"perspective",key:0});
 const plan=getRepairPlan(service),current=getRepairScope(service,scope);
 const highlighted=current?.whole?bodyPanelIds:selected;
 function toggle(id:string){onScopeChange("custom");onChange(selected.includes(id)?selected.filter(v=>v!==id):[...selected,id]);}
 function chooseScope(id:string){const next=getRepairScope(service,id);onScopeChange(id);onChange(next?.zones?[...next.zones]:[]);if(next?.view)setRequestedView(v=>({id:next.view!,key:v.key+1}));}
 return <section className="section damage-section" id="damage"><div className="container">
  <div className="section-heading"><div><p className="eyebrow"><span/>ВАШ АВТОМОБИЛЬ. ВАША ЗАДАЧА.</p><h2>ПОКАЖИТЕ,<br/><span>ЧТО НУЖНО СДЕЛАТЬ.</span></h2></div><p>Поверните автомобиль, выберите услугу и нужные участки. Всё перенесём в заявку мастеру.</p></div>
  <div className="planner-services" role="group" aria-label="Выберите услугу для автомобиля">{plannerServices.map((s,i)=>{const Icon=icons[i];return <button type="button" key={s.id} aria-pressed={service===s.title} onClick={()=>onServiceChange(s.title)}><Icon size={20} strokeWidth={1.5}/>{s.label}</button>;})}</div>
  <div className="damage-layout"><CarViewer selected={highlighted} onToggle={toggle} requestedView={requestedView}/>
   <div className="damage-controls"><div className="planner-service-title"><span>ВЫБРАННАЯ УСЛУГА</span><h3>{service==="Консультация"?"Поможем определиться":service}</h3><p>{plan.hint}</p></div>
   {plan.scopes.length>1&&<div className="planner-scopes" role="group" aria-label="Объём работ">{plan.scopes.map(s=><button type="button" key={s.id} aria-pressed={scope===s.id} onClick={()=>chooseScope(s.id)}>{scope===s.id&&<Check size={14}/>}<span>{s.label}</span></button>)}</div>}
   <div className="damage-controls-top"><strong>ДЕТАЛИ И УЧАСТКИ</strong><span aria-live="polite">{current?.whole?"Весь кузов":`Выбрано: ${selected.length}`}</span></div>
   <div className="damage-options" role="group" aria-label="Детали и участки автомобиля">{damageZones.map(zone=><button key={zone.id} type="button" aria-pressed={highlighted.includes(zone.id)} className={highlighted.includes(zone.id)?"damage-option active":"damage-option"} onClick={()=>toggle(zone.id)}><span>{zone.label}</span>{highlighted.includes(zone.id)?<Check size={16}/>:<Plus size={16}/>}</button>)}</div>
   <div className="damage-summary"><p>{current?.whole?`${current.label}. При желании выберите конкретные панели на модели или в списке.`:selected.length?"Участки отмечены. Добавьте фотографии и пожелания — мастер оценит задачу.":"Не знаете, какую деталь выбрать? Можно продолжить с услугой и приложить фото."}</p><button className="button button-primary" onClick={onContinue}>ПРОДОЛЖИТЬ К ЗАЯВКЕ</button>{(selected.length>0||scope!=="custom")&&<button className="damage-reset" onClick={()=>{onChange([]);onScopeChange("custom");}}><RotateCcw size={14}/>Сбросить участки</button>}</div></div>
  </div></div></section>;
}
