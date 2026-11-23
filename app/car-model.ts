import * as T from "three";
import {GLTFLoader} from "three/addons/loaders/GLTFLoader.js";
import {MeshoptDecoder} from "three/addons/libs/meshopt_decoder.module.js";

// Converted from the user's s65.obj. Named source parts and surface regions
// were mapped to the same repair zones used by the form before compression.
export async function createCarModel(anisotropy=8){
 const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
 const {scene:source}=await loader.loadAsync("/models/mercedes-s65-w222-hq.glb");
 const bounds=new T.Box3().setFromObject(source),size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3());
 const scale=4.8/size.z;
 source.scale.setScalar(scale);source.position.set(-center.x*scale,-bounds.min.y*scale,-center.z*scale);
 const car=new T.Group();car.name="Mercedes-Benz S65 W222";car.add(source);
 const rubberTexture=createRubberTexture();rubberTexture.anisotropy=anisotropy;
 const materialCache=new Map<string,T.MeshStandardMaterial>();
 function finishMaterial(original:T.MeshStandardMaterial){
  const cached=materialCache.get(original.uuid);if(cached)return cached;
  const name=original.name;let m=original;
  if(name==="headlight-cover"||name.includes("glass")||name==="taillight-cover"){
   const lens=name==="headlight-cover",tail=name==="taillight-cover";
   m=new T.MeshPhysicalMaterial({name,color:lens?0xf2f6ff:tail?0xa30c18:0x77858d,metalness:0,roughness:lens?.025:tail?.13:.055,transmission:lens?.9:tail?.18:.48,thickness:lens?.005:.015,ior:1.52,clearcoat:1,clearcoatRoughness:.06,envMapIntensity:lens?1.25:1,side:T.DoubleSide});
  }else if(name==="sw222_paint"){
   const paint=m as T.MeshPhysicalMaterial;paint.metalness=0;paint.roughness=.3;paint.clearcoat=1;paint.clearcoatRoughness=.13;paint.specularIntensity=.65;paint.envMapIntensity=1;
  }else if(name==="tyre"){
   m.color.setHex(0x17191c);m.side=T.DoubleSide;m.metalness=0;m.roughness=.9;m.bumpMap=rubberTexture;m.bumpScale=.006;m.envMapIntensity=.35;
  }else if(name==="alloy"){m.metalness=1;m.roughness=.27;m.envMapIntensity=1.2;}
  else if(name==="chrome"){m.metalness=1;m.roughness=.18;m.envMapIntensity=1.15;}
  else if(/amg_texture28|amg_texture17/.test(name)){m.color.setHex(0x30251f);m.roughness=.8;m.metalness=0;}
  else if(/runninglight|reverselight/.test(name)){m.emissive.setHex(0xd4e8ff);m.emissiveIntensity=.3;}
  else if(/brakelight|taillight/.test(name)){m.emissive.setHex(0x390005);m.emissiveIntensity=.15;}
  m.needsUpdate=true;materialCache.set(original.uuid,m);return m;
 }
 const surfaces:{mesh:T.Mesh;material:T.MeshStandardMaterial;color:T.Color;emissive:T.Color;intensity:number;zone:string}[]=[];
 source.traverse(object=>{
  if(!(object instanceof T.Mesh))return;
  const sourceMaterial=finishMaterial(object.material as T.MeshStandardMaterial);object.material=sourceMaterial;
  object.castShadow=!(sourceMaterial instanceof T.MeshPhysicalMaterial&&sourceMaterial.transmission>0);object.receiveShadow=true;
  if(!object.userData.toneable||!object.userData.zone)return;
  const material=(object.material as T.MeshStandardMaterial).clone();object.material=material;
  surfaces.push({mesh:object,material,color:material.color.clone(),emissive:material.emissive.clone(),intensity:material.emissiveIntensity,zone:object.userData.zone});
 });
 return {car,dispose(){rubberTexture.dispose();},target:new T.Vector3(0,size.y*scale*.51,0),paintSelection(ids:string[],hover:string|null){
  for(const p of surfaces){const active=ids.includes(p.zone);p.material.color.copy(p.color);p.material.emissive.copy(p.emissive);p.material.emissiveIntensity=p.intensity;
   if(active){p.material.color.setHex(0xe6111c);p.material.emissive.setHex(0x450006);p.material.emissiveIntensity=.24;}
   else if(hover===p.zone){p.material.color.lerp(new T.Color(0xffffff),.24);p.material.emissive.setHex(0x141414);p.material.emissiveIntensity=.2;}
  }
 }};
}

function createRubberTexture(){
 const canvas=document.createElement("canvas");canvas.width=512;canvas.height=1024;const ctx=canvas.getContext("2d")!,pixels=ctx.createImageData(512,1024);let seed=43;
 for(let i=0;i<pixels.data.length;i+=4){seed=(Math.imul(seed,1664525)+1013904223)|0;const grey=125+((seed>>>25)&7);pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=grey;pixels.data[i+3]=255;}
 ctx.putImageData(pixels,0,0);ctx.strokeStyle="#484848";ctx.lineWidth=8;
 for(const x of [100,185,327,412]){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,1024);ctx.stroke();}
 ctx.lineWidth=4;for(let y=-32;y<1056;y+=42){ctx.beginPath();ctx.moveTo(80,y);ctx.lineTo(170,y+20);ctx.lineTo(256,y+6);ctx.lineTo(342,y+20);ctx.lineTo(432,y);ctx.stroke();}
 const texture=new T.CanvasTexture(canvas);texture.wrapS=texture.wrapT=T.RepeatWrapping;return texture;
}
