import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Stats from 'three/addons/libs/stats.module.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const stats = new Stats();
document.body.appendChild( stats.dom );

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
    bevelThickness: 0.05,
    // curveSegments: smoothness
  });

    geometry.center();
  
  return geometry;
}


const geometry = createBoxWithRoundedEdges( 2, 2, 0.08, 0.1, 3 );

const count = geometry.attributes.position.count;
geometry.setAttribute( 'color', new THREE.BufferAttribute( new Float32Array( count * 3 ), 3 ) );

const positions = geometry.attributes.position;
const gradient = geometry.attributes.color;
const color = new THREE.Color();

// hsl(208, 68%, 44%)
const colorStop1 = [0.57, 0.68, 0.44];
// hsl(194, 87%, 50%)
const colorStop2 = [0.53, 0.87, 0.50];

let maxY = positions.getY(0), minY = positions.getY(0);
for ( let i = 0; i < count; i++ ) {
    const y = positions.getY( i );
    if(y < minY)
        minY = y;
    if(y > maxY)
        maxY = y;
}

const delta = maxY - minY;
for ( let i = 0; i < count; i++ ) {
    const y = positions.getY( i );
    const percent = (y - minY) / delta; 
    const hue = (colorStop2[0] - colorStop1[0]) * percent + colorStop1[0]
    const sat = (colorStop2[1] - colorStop1[1]) * percent + colorStop1[1]
    const lum = (colorStop2[2] - colorStop1[2]) * percent + colorStop1[2]
    color.setHSL( hue , sat, lum, THREE.SRGBColorSpace );
    gradient.setXYZ( i, color.r, color.g, color.b );
}

const material = new THREE.MeshPhongMaterial( {
					color: 0xffffff,
					flatShading: true,
					vertexColors: true,
					shininess: 0
				} );

const cube = new THREE.Mesh( geometry, material );
scene.add( cube );


const lineMaterial = new THREE.LineDashedMaterial( {
	color: 0x9DD1EC,
    scale: 1,
	dashSize: 0.001,
	gapSize: 10,
} );

const curve = new THREE.CatmullRomCurve3( [
	new THREE.Vector3( -delta/2 + 0.5, -delta/2, 0.06 ),
	new THREE.Vector3( -delta/2 + 0.5, -delta/2 + 0.05, 0.1 ),
	new THREE.Vector3( -delta/2 + 0.5, delta/2 - 0.05, 0.1 ),
	new THREE.Vector3( -delta/2 + 0.5, delta/2, 0.06 )
] );
const linePoints = curve.getPoints( 50 )

const lineGeometry = new THREE.BufferGeometry().setFromPoints( linePoints );

const line = new THREE.Line( lineGeometry, lineMaterial );
line.computeLineDistances();
scene.add( line );



const light = new THREE.HemisphereLight( 0xfffff, 0x262626, 1 ); 
scene.add( light );

camera.position.z = 5;

const controls = new OrbitControls( camera, renderer.domElement );

function animate() {
	requestAnimationFrame( animate );
	controls.update();
    stats.update();
    line.material.dashSize = line.material.dashSize + 0.01;
    if(line.material.dashSize >= 3)
        line.material.dashSize = 0.001
    line.computeLineDistances();
	renderer.render( scene, camera );
}

animate();
