import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Stats from 'three/addons/libs/stats.module.js';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff)
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );
renderer.setPixelRatio(window.devicePixelRatio)

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
    bevelSize: 0.1,
    bevelThickness: 0.05,
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

const lines = [
    -delta/2 + 0.15,
    delta/2 - 0.15,
    -0.5,
    0,
    0.5,
].map((pos, i) => {

    const start = i === 0 || i === 1
        ? -delta/2 + 0.15
        : -delta/2;
    const end = i === 0 || i === 1
        ? delta/2 - 0.15
        : delta/2
    
    const curvePoints = [
        [start, 0.06],
        [start + 0.05, 0.1],
        [end - 0.05, 0.1],
        [end, 0.06]
    ]

    const vCurve = new THREE.CatmullRomCurve3( [
    	new THREE.Vector3( pos, ...curvePoints[0] ),
    	new THREE.Vector3( pos, ...curvePoints[1] ),
    	new THREE.Vector3( pos, ...curvePoints[2] ),
    	new THREE.Vector3( pos, ...curvePoints[3] )
    ] );
    const vLinePoints = vCurve.getPoints( 50 )
    const vLineGeometry = new THREE.BufferGeometry().setFromPoints( vLinePoints );
    const vLine = new THREE.Line( vLineGeometry, lineMaterial );
    vLine.computeLineDistances();
    scene.add( vLine );

    const hCurve = new THREE.CatmullRomCurve3( [
    	new THREE.Vector3( curvePoints[0][0], pos, curvePoints[0][1] ),
    	new THREE.Vector3( curvePoints[1][0], pos, curvePoints[1][1] ),
    	new THREE.Vector3( curvePoints[2][0], pos, curvePoints[2][1] ),
    	new THREE.Vector3( curvePoints[3][0], pos, curvePoints[3][1] ),
    ] );
    const hLinePoints = hCurve.getPoints( 50 )
    const hLineGeometry = new THREE.BufferGeometry().setFromPoints( hLinePoints );
    const hLine = new THREE.Line( hLineGeometry, lineMaterial );
    hLine.computeLineDistances();
    scene.add( hLine );
    
    return [vLine, hLine];
}).flat();

[
    0.4,
    0.5,
    0.8
].forEach(radius => {
    const circleGeometry = new THREE.BufferGeometry().setFromPoints(
        new THREE.Path().absarc(0, 0, radius, 0, Math.PI * 2).getSpacedPoints(100)
    );
    const circle = new THREE.LineLoop( circleGeometry, lineMaterial )
    circle.computeLineDistances()
    circle.position.z = 0.15
    
    scene.add( circle );
})



const light = new THREE.HemisphereLight( 0xfffff, 0xcccccc, 2 ); 
scene.add( light );

camera.position.z = 5;

const controls = new OrbitControls( camera, renderer.domElement );


// instantiate a loader
const loader = new SVGLoader();
let svg;
// load a SVG resource
loader.load(
	// resource URL
	'logo.svg',
	// called when the resource is loaded
	function ( data ) {

		const paths = data.paths;
		svg = new THREE.Group();

		for ( let i = 0; i < paths.length; i ++ ) {
			const path = paths[ i ];

			const material = new THREE.MeshStandardMaterial( {
				color: path.color,
				side: THREE.DoubleSide,
				depthWrite: false,
                transparent: true,
                opacity: i === 0 ? 0 : 1
			} );

			const shapes = SVGLoader.createShapes( path );

			for ( let j = 0; j < shapes.length; j ++ ) {

				const shape = shapes[ j ];
				// const geometry = new THREE.ShapeGeometry( shape );

                let geometry = new THREE.ExtrudeGeometry( shape, {
                    amount: 1,
                    depth: 5
                  });
				const mesh = new THREE.Mesh( geometry, material );
                
				svg.add( mesh );

			}

		}

        svg.scale.set(-0.01, 0.01, -0.01);
        svg.rotation.set(0, 0, Math.PI)
        let bb = new THREE.Box3().setFromObject(svg);
        let size = bb.getSize(new THREE.Vector3());
        svg.position.x -= size.x / 2
        svg.position.y += size.y / 2
        svg.position.z += 0.14
		scene.add( svg );

	}
);


function animate() {
	requestAnimationFrame( animate );
	controls.update();
    stats.update();
    lines.forEach(line => {
        line.material.dashSize += 0.01;
        line.material.scale -= 0.1;
        if(line.material.scale <= 0){
            line.material.dashSize = 0.001;
            line.material.scale = 600;
        }
    })
	renderer.render( scene, camera );
}

animate();
