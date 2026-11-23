import { services } from "./site-data";

export type RepairScope = {id:string;label:string;zones?:string[];whole?:boolean;view?:"under"};
export const bodyPanelIds=["front-bumper","hood","front-left","front-right","door-left-front","door-right-front","door-left-rear","door-right-rear","sill-left","sill-right","roof","rear-left","rear-right","trunk","rear-bumper"];
const custom:RepairScope={id:"custom",label:"Выбрать участки"};
const sills=["sill-left","sill-right"];
export const repairPlans:Record<string,{hint:string;scopes:RepairScope[]}>={
 "Консультация":{hint:"Выберите услугу или отметьте участки, с которыми нужна помощь.",scopes:[custom]},
 "Кузовной ремонт":{hint:"Отметьте вмятины и повреждённые панели. Можно выбрать несколько деталей.",scopes:[custom,{id:"body-complex",label:"Несколько зон / весь кузов",whole:true}]},
 "Покраска автомобиля":{hint:"Выберите детали для покраски или укажите полную покраску кузова.",scopes:[custom,{id:"paint-full",label:"Полная покраска",whole:true}]},
 "Сварочные работы":{hint:"Пороги, днище или другой повреждённый металл — укажите, где требуется работа.",scopes:[custom,{id:"weld-sills",label:"Оба порога",zones:sills},{id:"weld-floor",label:"Ремонт днища",zones:["underbody"],view:"under"}]},
 "Восстановление после ДТП":{hint:"Отметьте видимые повреждения или выберите комплексное восстановление. Скрытые повреждения оценим на осмотре.",scopes:[custom,{id:"accident-complex",label:"Комплексное восстановление",whole:true}]},
 "Стапельные работы":{hint:"Укажите область удара. Необходимость работ с геометрией определит мастер после осмотра.",scopes:[custom,{id:"frame-front",label:"Передняя часть",zones:["front-bumper","hood","front-left","front-right"]},{id:"frame-rear",label:"Задняя часть",zones:["rear-bumper","trunk","rear-left","rear-right"]},{id:"frame-all",label:"Проверка всего кузова",whole:true}]},
 "Антикоррозийная обработка":{hint:"Выберите зону обработки: днище и арки, скрытые полости или комплексную защиту.",scopes:[custom,{id:"anticor-bottom",label:"Днище и арки",zones:["underbody","arches"],view:"under"},{id:"anticor-cavities",label:"Пороги и полости",zones:[...sills,"cavities"]},{id:"anticor-full",label:"Комплексная обработка",zones:["underbody","arches","cavities",...sills],view:"under"}]},
};
export function getRepairPlan(service:string){return repairPlans[service]||repairPlans["Консультация"];}
export function getRepairScope(service:string,id:string){return getRepairPlan(service).scopes.find(s=>s.id===id);}
export const plannerServices=[{title:"Консультация",label:"Не уверен",id:"consultation"},...services.map(s=>({...s,label:s.id==="paint"?"Покраска":s.id==="accident"?"После ДТП":s.id==="anticor"?"Антикор":s.title}))];
