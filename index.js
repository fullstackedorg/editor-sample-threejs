import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );


function createBoxWithRoundedEdges( width, height, depth, radius0, smoothness ) {
  let shape = new THREE.Shape();
  let eps = 0.4;
  let radius = radius0 - eps;
  shape.absarc( eps, eps, eps, -Math.PI / 2, -Math.PI, true );
  shape.absarc( eps, height -  eps, eps, Math.PI, Math.PI / 2, true );
  shape.absarc( width - eps, height -  eps, eps, Math.PI / 2, 0, true );
  shape.absarc( width - eps, eps, eps, 0, -Math.PI / 2, true );
  let geometry = new THREE.ExtrudeGeometry( shape, {
    amount: 1,
      depth,
    bevelEnabled: true,
    bevelSegments: 10,
    // steps: 1,
    bevelSize: 0.1,
    bevelThickness: 0.1,
    // curveSegments: smoothness
  });

    geometry.center();
  
  return geometry;
}


const geometry = createBoxWithRoundedEdges( 2, 2, 0.1, 0.1, 3 );
const material = new THREE.MeshStandardMaterial( { color: 0x00b0df } );
const cube = new THREE.Mesh( geometry, material );
scene.add( cube );

const light = new THREE.HemisphereLight( 0xfffff, 0x262626, 1 ); 
scene.add( light );

camera.position.z = 5;

const controls = new OrbitControls( camera, renderer.domElement );

function animate() {
	requestAnimationFrame( animate );
	controls.update();
	renderer.render( scene, camera );
}

animate();
