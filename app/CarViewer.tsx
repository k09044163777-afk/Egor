"use client";
import {useEffect,useRef,useState} from "react";
import {Box,LoaderCircle,Minus,Plus,RotateCcw,Rotate3D} from "lucide-react";
import {damageZones} from "./damage-zones";
import type {Object3D} from "three";

export type CarView="perspective"|"front"|"left"|"right"|"top"|"rear"|"under";
type ViewerAPI={view:(view:CarView)=>void;zoom:(factor:number)=>void;paint:(ids:string[])=>void;dispose:()=>void};
const views:{id:CarView;label:string}[]=[{id:"perspective",label:"Общий вид"},{id:"front",label:"Спереди"},{id:"left",label:"Слева"},{id:"right",label:"Справа"},{id:"rear",label:"Сзади"},{id:"top",label:"Сверху"},{id:"under",label:"Днище"}];
export default function CarViewer({selected,onToggle,requestedView}:{selected:string[];onToggle:(id:string)=>void;requestedView:{id:CarView;key:number}}){
 const host=useRef<HTMLDivElement>(null),api=useRef<ViewerAPI|null>(null),selectedRef=useRef(selected),toggleRef=useRef(onToggle),viewRef=useRef(requestedView.id);
 const [status,setStatus]=useState<"loading"|"ready"|"fallback">("loading"),[hover,setHover]=useState<string|null>(null),[view,setView]=useState<CarView>(requestedView.id);
 selectedRef.current=selected;toggleRef.current=onToggle;viewRef.current=requestedView.id;
 useEffect(()=>{api.current?.paint(selected);},[selected]);
 useEffect(()=>{setView(requestedView.id);api.current?.view(requestedView.id);},[requestedView]);
 useEffect(()=>{
  const currentNode=host.current;if(!currentNode)return;const node:HTMLDivElement=currentNode;let cancelled=false,started=false;let loadingCleanup:(()=>void)|null=null;
  async function start(){
   if(started)return;started=true;
   try{
    const [T,{OrbitControls},{createCarModel},{createCarStudio}]=await Promise.all([import("three"),import("three/addons/controls/OrbitControls.js"),import("./car-model"),import("./car-studio")]);
    if(cancelled)return;
    const renderer=new T.WebGLRenderer({alpha:true,antialias:true,powerPreference:"high-performance"});renderer.setPixelRatio(Math.min(window.innerWidth<780?2:2.5,Math.max(2,window.devicePixelRatio)));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.86;renderer.transmissionResolutionScale=.75;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.VSMShadowMap;renderer.shadowMap.autoUpdate=false;
    const canvas=renderer.domElement;canvas.setAttribute("aria-label","Mercedes-Benz S65 W222 — вращаемая 3D-модель");canvas.setAttribute("aria-describedby","car-controls-hint");canvas.tabIndex=0;node.appendChild(canvas);
    const scene=new T.Scene();const camera=new T.PerspectiveCamera(35,1,.1,50);
    const controls=new OrbitControls(camera,canvas);controls.target.set(0,.9,0);controls.enableDamping=true;controls.dampingFactor=.09;controls.enablePan=false;controls.minDistance=4.3;controls.maxDistance=10.8;controls.minPolarAngle=.08;controls.maxPolarAngle=Math.PI-.12;controls.rotateSpeed=.65;controls.zoomSpeed=.65;
    const studio=createCarStudio(renderer);scene.environment=studio.environment.texture;scene.add(studio.lights,studio.ground);
    loadingCleanup=()=>{controls.dispose();studio.dispose();renderer.dispose();canvas.remove();};
    const model=await createCarModel(Math.min(16,renderer.capabilities.getMaxAnisotropy()));
    if(cancelled){model.car.traverse(o=>{if(o instanceof T.Mesh){o.geometry.dispose();const mats=Array.isArray(o.material)?o.material:[o.material];mats.forEach(m=>m.dispose());}});model.dispose();loadingCleanup?.();loadingCleanup=null;return;}
    scene.add(model.car);controls.target.copy(model.target);
    renderer.shadowMap.needsUpdate=true;
    const ray=new T.Raycaster(),pointer=new T.Vector2();const meshes:Object3D[]=[];model.car.traverse(o=>{if(o instanceof T.Mesh)meshes.push(o);});
    let hovered:string|null=null,down:{x:number;y:number}|null=null,moved=false,multi=false,dirty=true;const pointers=new Set<number>();
    function invalidate(){dirty=true;}controls.addEventListener("change",invalidate);
    function paint(ids=selectedRef.current){model.paintSelection(ids,hovered);dirty=true;}
    function pick(e:PointerEvent){const rect=canvas.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(pointer,camera);return ray.intersectObjects(meshes,false)[0]?.object.userData.zone as string|undefined;}
    function onDown(e:PointerEvent){pointers.add(e.pointerId);if(pointers.size>1)multi=true;else{multi=false;down={x:e.clientX,y:e.clientY};moved=false;}}
    function onMove(e:PointerEvent){if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)>5)moved=true;if(pointers.size)return;const id=pick(e)||null;if(id!==hovered){hovered=id;setHover(id);paint();}canvas.style.cursor=id?"pointer":"grab";}
    function onUp(e:PointerEvent){if(!multi&&!moved&&down&&e.button===0){const id=pick(e);if(id)toggleRef.current(id);}pointers.delete(e.pointerId);if(!pointers.size)down=null;}
    function onCancel(e:PointerEvent){pointers.delete(e.pointerId);down=null;hovered=null;setHover(null);paint();}
    function onLeave(){if(!pointers.size){hovered=null;setHover(null);paint();}}
    const poses:Record<CarView,[number,number,number]>={perspective:[4.05,2.25,5.25],front:[.01,1.9,7],left:[7.2,2.1,.05],right:[-7.2,2.1,.05],rear:[-.01,1.9,-7],top:[.01,8,0],under:[4,-4.5,5.5]};
    function setView(id:CarView){controls.enableDamping=false;controls.update();camera.position.fromArray(poses[id]);controls.target.copy(model.target);controls.update();controls.enableDamping=true;}
    function zoom(factor:number){camera.position.sub(controls.target).multiplyScalar(factor).clampLength(controls.minDistance,controls.maxDistance).add(controls.target);controls.update();}
    function onKey(e:KeyboardEvent){if(["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","+","=","-","Home"].includes(e.key)){e.preventDefault();if(e.key==="Home")setView("perspective");else if(e.key==="+"||e.key==="=")zoom(.86);else if(e.key==="-")zoom(1.16);else{const s=new T.Spherical().setFromVector3(camera.position.clone().sub(controls.target));s.theta+=(e.key==="ArrowLeft"?.16:e.key==="ArrowRight"?-.16:0);s.phi=T.MathUtils.clamp(s.phi+(e.key==="ArrowUp"?-.13:e.key==="ArrowDown"?.13:0),.1,Math.PI-.14);camera.position.setFromSpherical(s).add(controls.target);controls.update();}}}
    canvas.addEventListener("pointerdown",onDown);canvas.addEventListener("pointermove",onMove);canvas.addEventListener("pointerup",onUp);canvas.addEventListener("pointercancel",onCancel);canvas.addEventListener("pointerleave",onLeave);canvas.addEventListener("keydown",onKey);
    let frame=0,visible=true,last=0;
    const resize=new ResizeObserver(()=>{const w=node.clientWidth,h=node.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.fov=camera.aspect<1?43:35;camera.updateProjectionMatrix();dirty=true;});resize.observe(node);
    const visibility=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;},{rootMargin:"100px"});visibility.observe(node);
    function animate(time:number){if(cancelled)return;frame=requestAnimationFrame(animate);if(!visible||document.hidden||time-last<16)return;last=time;const changed=controls.update();if(!dirty&&!changed)return;studio.ground.visible=camera.position.y>.05;renderer.render(scene,camera);dirty=false;}
    function contextLost(e:Event){e.preventDefault();setStatus("fallback");}
    canvas.addEventListener("webglcontextlost",contextLost);
    setView(viewRef.current);paint();frame=requestAnimationFrame(animate);setStatus("ready");
    api.current={view:setView,zoom,paint,dispose(){cancelAnimationFrame(frame);resize.disconnect();visibility.disconnect();controls.removeEventListener("change",invalidate);controls.dispose();canvas.removeEventListener("pointerdown",onDown);canvas.removeEventListener("pointermove",onMove);canvas.removeEventListener("pointerup",onUp);canvas.removeEventListener("pointercancel",onCancel);canvas.removeEventListener("pointerleave",onLeave);canvas.removeEventListener("keydown",onKey);canvas.removeEventListener("webglcontextlost",contextLost);model.car.traverse(o=>{if(o instanceof T.Mesh||o instanceof T.Line){o.geometry.dispose();const mats=Array.isArray(o.material)?o.material:[o.material];mats.forEach(m=>m.dispose());}});model.dispose();studio.dispose();renderer.dispose();canvas.remove();}};
    loadingCleanup=null;
   }catch{loadingCleanup?.();loadingCleanup=null;if(!cancelled)setStatus("fallback");}
  }
  const observer=new IntersectionObserver(([entry])=>{if(entry.isIntersecting){observer.disconnect();void start();}},{rootMargin:"300px"});observer.observe(node);
  return()=>{cancelled=true;observer.disconnect();api.current?.dispose();api.current=null;loadingCleanup?.();loadingCleanup=null;};
 },[]);
 function changeView(id:CarView){setView(id);api.current?.view(id);}
 return <div className="car-viewer">
  <div className="viewer-topline"><span><Box size={17}/>МАЛЯРКА43 / 3D</span><span className="viewer-live">{status==="ready"?"ВРАЩАЙТЕ И ВЫБИРАЙТЕ":"ИНТЕРАКТИВНЫЙ ПОДБОР"}</span></div>
  <div className="car-stage" ref={host}>
   {status==="loading"&&<div className="viewer-placeholder"><LoaderCircle className="spin"/><span>Загружаем 3D-модель</span></div>}
   {status==="fallback"&&<div className="viewer-placeholder"><CarFallback/><strong>Выберите участки в списке</strong><span>На этом устройстве 3D недоступно. Все услуги и выбор деталей работают ниже.</span></div>}
  </div>
  <div className="viewer-feedback" aria-live="polite"><span className="viewer-swatch"/>{hover?damageZones.find(z=>z.id===hover)?.label:"Нажмите на панель — выделим её красным"}</div>
  <div className="viewer-views" role="group" aria-label="Ракурс автомобиля">{views.map(v=><button key={v.id} type="button" aria-pressed={view===v.id} disabled={status!=="ready"} onClick={()=>changeView(v.id)}>{v.label}</button>)}</div>
  <div className="viewer-bottom"><p id="car-controls-hint"><Rotate3D size={18}/>Тяните для вращения · касание для выбора<br/><small>Масштаб — колесом или двумя пальцами. С клавиатуры: стрелки, + / −.</small></p><div><button type="button" aria-label="Приблизить модель" disabled={status!=="ready"} onClick={()=>api.current?.zoom(.84)}><Plus size={18}/></button><button type="button" aria-label="Отдалить модель" disabled={status!=="ready"} onClick={()=>api.current?.zoom(1.19)}><Minus size={18}/></button><button type="button" aria-label="Сбросить ракурс" disabled={status!=="ready"} onClick={()=>changeView("perspective")}><RotateCcw size={17}/></button></div></div>
  <p className="viewer-note">Mercedes-Benz S65 · W222<br/>Модель для выбора участков. Записаться можно с автомобилем любой марки.<br/>Левая и правая стороны — по ходу движения.</p>
 </div>;
}
function CarFallback(){return <Rotate3D size={42} strokeWidth={1.2}/>;}
