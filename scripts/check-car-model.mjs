import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {Box3,Vector3} from 'three';

const bytes=await readFile('public/models/mercedes-s65-w222-hq.glb');
assert.ok(bytes.length<5*1024*1024,'The model must stay within its download budget.');
const binary=bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength);
const {scene}=await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(binary,'');
const zones=new Set(),materials=new Map(),plateFaces=new Set();let triangles=0;
scene.traverse(m=>{if(!m.isMesh)return;triangles+=(m.geometry.index?.count||m.geometry.attributes.position.count)/3;if(m.userData.zone)zones.add(m.userData.zone);if(m.userData.registrationFace)plateFaces.add(m.userData.registrationFace);materials.set(m.material.name,m.material);});
for(const id of ['front-bumper','hood','front-left','front-right','door-left-front','door-right-front','door-left-rear','door-right-rear','sill-left','sill-right','roof','rear-left','rear-right','trunk','rear-bumper','underbody','arches','cavities'])assert.ok(zones.has(id),`Missing selectable zone: ${id}`);
assert.equal(plateFaces.size,0,'Registration plate surfaces have been removed.');
const paint=materials.get('sw222_paint');assert.ok(paint&&paint.color.r>.9&&paint.color.g>.9&&paint.color.b>.9,'Keep the white paint from the source model.');
const size=new Box3().setFromObject(scene).getSize(new Vector3());assert.ok(size.x>1.9&&size.y>1.3&&size.z>4.9,'Keep the complete car geometry.');
assert.ok(triangles>=550000&&triangles<560000,'Preserve the full source surface detail.');
console.log(`Model OK: ${zones.size} zones, white paint, no registration plates, ${triangles} triangles, ${(bytes.length/1024/1024).toFixed(2)} MiB.`);
