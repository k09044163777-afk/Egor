"use client";
import {useEffect,useRef,useState,type PointerEvent} from "react";
import {Maximize2,X,Camera,GripVertical,Check} from "lucide-react";

type View="before"|"after";
const works=[
 {id:"rear-wing",name:"Заднее крыло",title:"ЗАДНЕЕ КРЫЛО.",subtitle:"ВОССТАНОВЛЕННАЯ ФОРМА.",description:"Кузовной ремонт и покраска: состояние до работ и готовый результат.",position:"center",photos:{before:{src:"/images/works/rear-wing-before.webp",label:"ДО РЕМОНТА",alt:"Заднее крыло и колёсная арка до ремонта",width:2560,height:1920},after:{src:"/images/works/rear-wing-after.webp",label:"ПОСЛЕ РЕМОНТА",alt:"Заднее крыло и колёсная арка после кузовного ремонта и покраски",width:1448,height:1086}}},
 {id:"body-paint",name:"Покраска кузова",title:"ПОКРАСКА КУЗОВА.",subtitle:"ГЛУБОКИЙ ЧЁРНЫЙ.",description:"Подготовка кузова к окраске и покрытие после покраски — на фотографиях из мастерской.",position:"center bottom",photos:{before:{src:"/images/works/body-paint-before.webp",label:"ДО ПОКРАСКИ",alt:"Кузов автомобиля в процессе подготовки к покраске",width:2235,height:2559},after:{src:"/images/works/body-paint-after.webp",label:"ПОСЛЕ ПОКРАСКИ",alt:"Чёрный кузов автомобиля после нанесения лакокрасочного покрытия",width:1172,height:1342}}},
];

export default function WorkGallery({onBook}:{onBook:()=>void}){
 const [view,setView]=useState<View|null>(null);
 const [split,setSplit]=useState(50);
 const [selectedWork,setSelectedWork]=useState("body-paint");
 const work=works.find(item=>item.id===selectedWork)!;
 const photos=work.photos;
 const dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{if(view&&!dialog.current?.open)dialog.current?.showModal();},[view]);
 function move(e:PointerEvent<HTMLDivElement>){const box=e.currentTarget.getBoundingClientRect();setSplit(Math.round(Math.max(0,Math.min(100,(e.clientX-box.left)/box.width*100))));}
 return <>
  <div className="work-switcher" role="group" aria-label="Выберите работу">{works.map(item=><button key={item.id} className={selectedWork===item.id?"work-choice active":"work-choice"} aria-pressed={selectedWork===item.id} onClick={()=>{setSelectedWork(item.id);setSplit(50);setView(null);dialog.current?.close();}}><img src={item.photos.after.src} alt="" width="88" height="66" loading="lazy"/><span><strong>{item.name}</strong><small>СРАВНЕНИЕ ДО / ПОСЛЕ</small></span>{selectedWork===item.id&&<Check size={19}/>}</button>)}</div>
  <article className="real-work" key={work.id} aria-label={work.name}>
   <div className="work-slider">
    <img className="comparison-after" src={photos.after.src} alt={photos.after.alt} width={photos.after.width} height={photos.after.height} style={{objectPosition:work.position}} loading="lazy"/>
    <div className="comparison-before" style={{clipPath:`inset(0 ${100-split}% 0 0)`}}><img src={photos.before.src} alt={photos.before.alt} width={photos.before.width} height={photos.before.height} style={{objectPosition:work.position}} loading="lazy"/></div>
    <span className="work-badge">{photos.before.label}</span><span className="work-badge after">{photos.after.label}</span>
    <div className="comparison-divider" style={{left:`${split}%`}} aria-hidden="true"><span><GripVertical size={25}/></span></div>
    <div className="comparison-range" role="slider" tabIndex={0} aria-label="Сравнение до и после ремонта" aria-valuemin={0} aria-valuemax={100} aria-valuenow={split} aria-valuetext={`${split}% до ремонта, ${100-split}% после ремонта`} onPointerDown={e=>{e.preventDefault();e.currentTarget.focus({preventScroll:true});e.currentTarget.setPointerCapture(e.pointerId);move(e);}} onPointerMove={e=>{if(e.currentTarget.hasPointerCapture(e.pointerId))move(e);}} onPointerUp={e=>{if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);}} onPointerCancel={e=>{if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);}} onKeyDown={e=>{const delta=e.shiftKey?10:1;const changes:Record<string,number>={ArrowLeft:-delta,ArrowDown:-delta,ArrowRight:delta,ArrowUp:delta,PageDown:-10,PageUp:10};if(e.key==="Home"){e.preventDefault();setSplit(0);}else if(e.key==="End"){e.preventDefault();setSplit(100);}else if(e.key in changes){e.preventDefault();setSplit(value=>Math.max(0,Math.min(100,value+changes[e.key])));}}}/>
   </div>
   <div className="comparison-toolbar"><p><GripVertical size={18}/>Потяните бегунок, чтобы сравнить</p><div>{(["before","after"] as View[]).map(key=><button key={key} onClick={()=>setView(key)} aria-label={`Открыть фото ${key==="before"?"до":"после"} ремонта`}><Maximize2 size={16}/>{key==="before"?"ДО":"ПОСЛЕ"}</button>)}</div></div>
   <div className="work-caption"><div><p className="eyebrow"><span/>РЕАЛЬНАЯ РАБОТА МАЛЯРКА43</p><h3>{work.title}<br/>{work.subtitle}</h3><p>{work.description}</p></div><button className="button button-outline" onClick={onBook}><Camera size={18}/>ОЦЕНИТЬ МОЙ РЕМОНТ</button></div>
  </article>
  <dialog ref={dialog} className="photo-dialog" aria-label="Фото кузовного ремонта до и после" onClose={()=>setView(null)} onClick={e=>{if(e.target===e.currentTarget)dialog.current?.close();}} onKeyDown={e=>{if(e.key==="ArrowLeft")setView("before");if(e.key==="ArrowRight")setView("after");}}>
   {view&&<><div className="photo-dialog-header"><div className="photo-tabs" aria-label="Выбор фотографии">{(["before","after"] as View[]).map(key=><button key={key} aria-pressed={view===key} className={view===key?"active":""} onClick={()=>setView(key)}>{photos[key].label}</button>)}</div><button className="photo-close" aria-label="Закрыть фотографию" onClick={()=>dialog.current?.close()}><X size={24}/></button></div><img src={photos[view].src} alt={photos[view].alt}/><p>Малярка43 · {work.name}</p></>}
  </dialog>
 </>;
}
