import * as T from "three";

export function createCarStudio(renderer:T.WebGLRenderer){
 const room=new T.Scene();
 const shell=new T.Mesh(new T.BoxGeometry(24,18,24),new T.MeshBasicMaterial({color:0x101319,side:T.BackSide}));room.add(shell);
 function softbox(w:number,h:number,position:[number,number,number],intensity:number,tint=0xffffff){
  const material=new T.MeshBasicMaterial({color:new T.Color(tint).multiplyScalar(intensity),side:T.DoubleSide,toneMapped:false});
  const panel=new T.Mesh(new T.PlaneGeometry(w,h),material);panel.position.fromArray(position);panel.lookAt(0,0,0);room.add(panel);
 }
 // Long studio strips describe panel curvature without washing out the paint.
 softbox(2.4,8,[-4.8,4.2,1.5],5);
 softbox(1.2,7,[5.2,2.8,-1],3.4,0xe7f0ff);
 softbox(7,1.3,[0,5.8,-.5],4.5);
 softbox(3,4,[0,2.8,-6],2.5);
 const generator=new T.PMREMGenerator(renderer),environment=generator.fromScene(room,.008,.1,50,{size:512});
 room.traverse(o=>{if(o instanceof T.Mesh){o.geometry.dispose();(o.material as T.Material).dispose();}});generator.dispose();

 const lights=new T.Group();lights.add(new T.HemisphereLight(0xc4d5e5,0x242020,.28));
 const key=new T.DirectionalLight(0xfff8ee,2.1);key.position.set(-3.5,8,3.5);key.castShadow=true;
 key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-3.7,right:3.7,top:3.7,bottom:-3.7,near:.5,far:18});key.shadow.camera.updateProjectionMatrix();key.shadow.bias=-.00015;key.shadow.normalBias=.014;key.shadow.radius=4;key.shadow.blurSamples=8;lights.add(key);
 const fill=new T.DirectionalLight(0xd7e7ff,.65);fill.position.set(4,2.5,1);lights.add(fill);
 const rim=new T.DirectionalLight(0xffffff,.85);rim.position.set(1,3,-4);lights.add(rim);
 const under=new T.DirectionalLight(0xbcc8d5,.35);under.position.set(0,-3,0);lights.add(under);
 const floor=new T.Mesh(new T.PlaneGeometry(20,20),new T.ShadowMaterial({color:0x000000,opacity:.28}));floor.rotation.x=-Math.PI/2;floor.position.y=-.015;floor.receiveShadow=true;
 const ring=new T.Mesh(new T.RingGeometry(2.68,2.685,160),new T.MeshBasicMaterial({color:0x8a929d,transparent:true,opacity:.12,side:T.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=-.018;
 const ground=new T.Group();ground.add(floor,ring);
 return {environment,lights,ground,dispose(){environment.dispose();key.shadow.dispose();floor.geometry.dispose();floor.material.dispose();ring.geometry.dispose();ring.material.dispose();}};
}
