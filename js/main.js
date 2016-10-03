//detect webgl

if(!Detector.webgl){
	Detector.addGetWebGLMessage();
	document.getElementById('container').innerHTML = '';
}

//graphics variables
var container,stats;
var camera, controls,scene, renderer;
var textureLoader;
var clock = new THREE.Clock();
var mouseCoords = new THREE.Vector2();
var raycaster = new THREE.Raycaster();
var ballMaterial = new THREE.MeshPhongMaterial({
	color: 0x202020
});

//physics variables
var gravityConstant = 7.8;
var collisionConfiguration;
var dispatcher;
var broadphase;
var solver;
var physicsWorld;
var magin = 0.05;
var convexBreaker = new THREE.ConvexObjectBreaker();

//rigid bodies include all movable objects
var rigidBodies = [];
var pos = new THREE.Vector3();
var quat = new THREE.Quaternion();
var transformAux1 = new Ammo.btTransform();
var tempBtVec3_1 = new Ammo.btVector3(0,0,0);
var time = 0;
var objectsToRemove = [];
//?
for(var i = 0; i < 500; i++){
	objectsToRemove[i] = null;
}
var numObjectsToRemove = 0;
var impactPoint = new THREE.Vector3();
var impactNormal = new THREE.Vector3();

init();
animate();

//utility function
function init(){
	initGraphics();
	initPhysics();
	createObjects();
	initInput();
}
function initGraphics(){
	container = document.getElementById('container');
	camera = new THREE.PerspectiveCamera(60,window.innerWidth/window.innerHeight,1,10000);
	scene = new THREE.Scene();
	camera.position.x = -14;
	camera.position.y = 8;
	camera.position.z = 16;
	controls = new THREE.OrbitControls(camera);
	controls.target.y = 2;
	renderer = new THREE.WebGLRenderer();
	renderer.setClearColor(0xbfd1e5);
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth,window.innerHeight);
	renderer.shadowMap.enabled = true;
	textureLoader = new THREE.TextureLoader();
	var ambientLight = new THREE.AmbientLight(0x707070);
	scene.add(ambientLight);
	var light = new THREE.DirectionalLight(0xffffff,1);
	light.position.set(-10,18,5);
	light.castShadow = true;
	var d = 14;
	light.shadow.camera.left = -d;
	light.shadow.camera.right = d;
	light.shadow.camera.top = d;
	light.shadow.camera.bottom = -d;
	light.shadow.camera.near = 2;
	light.shadow.camera.far = 50;
	light.shadow.mapSize.x = 1024;
	light.shadow.mapSize.y = 1024;
	scene.add(light);
	container.innerHTML = '';
	container.appendChild(renderer.domElement);
	stats = new Stats();
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.top = '0px';
	container.appendChild(stats.domElement);

	window.addEventListener('resize',onWindowResize,false);
}

function initPhysics(){
	
}


















