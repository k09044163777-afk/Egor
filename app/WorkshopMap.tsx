"use client";
import {useEffect,useRef,useState} from "react";
import type {Map as LeafletMap} from "leaflet";
import {MapPin,LocateFixed} from "lucide-react";

// Exact business point from the owner's 2GIS listing, not a street geocoder.
const workshop:[number,number]=[58.588308,49.584263];
const directions="https://2gis.ru/kirov/geo/70000001105162492";

export default function WorkshopMap(){
 const container=useRef<HTMLDivElement>(null),map=useRef<LeafletMap|null>(null);
 const [zoom,setZoom]=useState(17),[ready,setReady]=useState(false),[failed,setFailed]=useState(false);
 useEffect(()=>{
  let disposed=false,instance:LeafletMap|undefined,resize:ResizeObserver|undefined;
  async function initialize(){
   try{
    const L=await import("leaflet");if(disposed||!container.current)return;
    instance=L.map(container.current,{zoomControl:false,attributionControl:false,scrollWheelZoom:true,touchZoom:true,dragging:true,minZoom:10,maxZoom:19}).setView(workshop,17);map.current=instance;
    L.control.zoom({position:"topright",zoomInTitle:"Приблизить карту",zoomOutTitle:"Отдалить карту"}).addTo(instance);
    const tiles=L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>'}).addTo(instance);
    let loaded=0;tiles.on("tileload",()=>{loaded++;if(!disposed)setFailed(false);});tiles.on("tileerror",()=>{if(!loaded&&!disposed)setFailed(true);});
    const pin=L.divIcon({className:"shop-pin",html:"<span><b>43</b></span>",iconSize:[44,54],iconAnchor:[22,46]});
    L.marker(workshop,{icon:pin,title:"Малярка43 — Ульяновская, 39/3",alt:"Малярка43"}).addTo(instance).bindTooltip("Малярка43 · Ульяновская, 39/3",{permanent:true,direction:"top",offset:[0,-48],className:"shop-map-label"});
    instance.on("zoomend",()=>{if(instance&&!disposed)setZoom(instance.getZoom());});
    resize=new ResizeObserver(()=>instance?.invalidateSize({pan:true,animate:false}));resize.observe(container.current);setReady(true);
   }catch{if(!disposed)setFailed(true);}
  }
  const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){observer.disconnect();void initialize();}},{rootMargin:"250px"});
  if(container.current)observer.observe(container.current);
  return()=>{disposed=true;observer.disconnect();resize?.disconnect();instance?.remove();map.current=null;};
 },[]);
 return <div className="map-panel interactive-map" data-zoom={zoom} data-ready={ready}>
  <div ref={container} className="leaflet-canvas" aria-label="Интерактивная карта: Малярка43, Киров, Ульяновская улица, 39/3"/>
  {ready&&<button className="map-recenter" aria-label="Вернуть карту к мастерской" onClick={()=>map.current?.setView(workshop,17,{animate:!window.matchMedia("(prefers-reduced-motion: reduce)").matches})}><LocateFixed size={18}/><span>К МАСТЕРСКОЙ</span></button>}
  {failed&&<p className="map-unavailable">Не удалось загрузить подложку карты. <a href={directions} target="_blank" rel="noopener noreferrer">Открыть в 2ГИС</a></p>}
  <a href={directions} className="button button-primary map-link" target="_blank" rel="noopener noreferrer"><MapPin size={18}/>МАРШРУТ В 2ГИС</a>
  <p className="map-source">Данные карты: <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap</a></p>
 </div>;
}
