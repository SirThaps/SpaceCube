import * as THREE from 'three'
import { Box, boxCollision, FireCube } from '../resources/box.js';

let randomMovement = 1;
let camera, mapCamera;
let insetHeight = window.innerHeight / 5;
let insetWidth = window.innerWidth / 5;
let scene = new THREE.Scene();
let renderer;
let ground;
let playerLight1, playerLight2;
let portalLight1, portalLight2;
let cube;
let enemies = [];
let frames = 0;
let PortalTicket = false;
let movementSpeed = 0.05;
let enemyMovementSpeed = 0.01;
let animationId;
let customUniforms;
let time = 30;
const keys = {
    a: {
      pressed: false
    },
    d: {
      pressed: false
    },
    s: {
      pressed: false
    },
    w: {
      pressed: false
    },
    esc: {
      pressed: false
    },
    c: {
        pressed: false
    }
}

//Start Game
init();
animate();
initAudio(); //start background music

function init(){
    const canvas = document.getElementById('canvas');
    //renderer
    renderer = new THREE.WebGLRenderer({canvas: canvas,
        antialias: true
    });
    renderer.shadowMap.enabled = true;
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    //cameras
    camera = new THREE.PerspectiveCamera(75,window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.6, 5);

    //mini map
    mapCamera = new THREE.PerspectiveCamera(90,window.innerWidth / window.innerHeight, 0.01, 500);
    mapCamera.position.set(0, 2, -5);
    mapCamera.lookAt(0, 0, -5);

    camera.add(mapCamera);
    scene.add(camera);

    //Skybox    (background)
    const loader = new THREE.CubeTextureLoader();
    const texture = loader.load([
        '../resources/skybox/space-posx.jpg',
        '../resources/skybox/space-negx.jpg',
        '../resources/skybox/space-posy.jpg',
        '../resources/skybox/space-negy.jpg',
        '../resources/skybox/space-posz.jpg',
        '../resources/skybox/space-negz.jpg',
    ]);
    scene.background = texture;

    //portal light
    portalLight1 = new THREE.PointLight( 0x800080, 20, 500 );
    portalLight1.position.set( -2, 2, -18 );
    scene.add( portalLight1 );

    portalLight2 = new THREE.PointLight( 0x800080, 20, 500 );
    portalLight2.position.set( 2, 2, -18 );
    scene.add( portalLight2 );

    //moving point lights for player
    playerLight1 = new THREE.PointLight( 0x00ff00, 0.5, 20 );
    playerLight1.position.set( 0, -0.5, 1 );
    scene.add( playerLight1 );

    playerLight2 = new THREE.PointLight( 0x00ff00, 0.5, 20 );
    playerLight2.position.set( 0, -0.5, -1 );
    scene.add( playerLight2 );
    
    //ground
    ground = new Box({
    width: 15,
    height: 0.1,
    depth: 110,
    position: {
        x: 0,
        y: -1.8,
        z: -44
    }
    });
    ground.receiveShadow = true;
    scene.add(ground);

    createLavaFloor();

    createPortal(); //portal

    //cube => player
    cube = new Box({
    width: 1,
    height: 1,
    depth: 1,
    position: {
        x: 0,
        y: 0,
        z: 0,
    },
    velocity: {
        x: 0,
        y: -0.001,
        z: 0
    }
    });
    cube.castShadow = true;
    scene.add(cube);
    
    //load enemies
    for(let i=0; i<30; i++){
        let enemy = new FireCube({
            width: 1 + (Math.random() * 2),
            height: 1 + (Math.random() * 2.5),
            depth:  1,
            position: {
                x: (Math.random() - 0.5) * 10,
                y: 3,
                z: Math.min( -70 * Math.random() - (i*2), -25 - (i*2))
            },
            velocity: {
                x: (Math.random()/5) * randomMovement,
                y: 0,
                z: enemyMovementSpeed
            },
            zAcceleration: true
        });
        scene.add(enemy);
        enemies.push(enemy);
        randomMovement *= -1;
    }

    window.addEventListener( 'resize', onWindowResize );
}

function createLavaFloor(){
    // base image texture for mesh
    var lavaTexture = new THREE.TextureLoader().load( '../resources/lava.jpg');
    lavaTexture.wrapS = lavaTexture.wrapT = THREE.RepeatWrapping; 
    // multiplier for distortion speed 		
    var baseSpeed = 0.03;
    // number of times to repeat texture in each direction
    var repeatS = 4.0;
    var repeatT = 4.0;
    
    // texture used to generate "randomness", distort all other textures
    var noiseTexture = new THREE.TextureLoader().load( '../resources/cloud.png' );
    noiseTexture.wrapS = noiseTexture.wrapT = THREE.RepeatWrapping; 
    // magnitude of noise effect
    var noiseScale = 0.5;
    
    // texture to additively blend with base image texture
    var blendTexture = new THREE.TextureLoader().load( '../resources/lava.jpg' );
    blendTexture.wrapS = blendTexture.wrapT = THREE.RepeatWrapping; 
    // multiplier for distortion speed 
    var blendSpeed = 0.01;
    // adjust lightness/darkness of blended texture
    var blendOffset = 0.25;

    // texture to determine normal displacement
    var bumpTexture = noiseTexture;
    bumpTexture.wrapS = bumpTexture.wrapT = THREE.RepeatWrapping; 
    // multiplier for distortion speed 		
    var bumpSpeed   = 0.15;
    // magnitude of normal displacement
    var bumpScale   = 0.5;
    
    // use "this." to create global object
    customUniforms = {
        baseTexture: 	{ type: "t", value: lavaTexture },
        baseSpeed:		{ type: "f", value: baseSpeed },
        repeatS:		{ type: "f", value: repeatS },
        repeatT:		{ type: "f", value: repeatT },
        noiseTexture:	{ type: "t", value: noiseTexture },
        noiseScale:		{ type: "f", value: noiseScale },
        blendTexture:	{ type: "t", value: blendTexture },
        blendSpeed: 	{ type: "f", value: blendSpeed },
        blendOffset: 	{ type: "f", value: blendOffset },
        bumpTexture:	{ type: "t", value: bumpTexture },
        bumpSpeed: 		{ type: "f", value: bumpSpeed },
        bumpScale: 		{ type: "f", value: bumpScale },
        alpha: 			{ type: "f", value: 1.0 },
        time: 			{ type: "f", value: 1.0 }
    };
    
    // create custom material from the shader code above
    //   that is within specially labeled script tags
    var customMaterial = new THREE.ShaderMaterial( 
    {
        uniforms: customUniforms,
        vertexShader:   document.getElementById( 'vertexShaderLava'   ).textContent,
        fragmentShader: document.getElementById( 'fragmentShaderLava' ).textContent
    }   );
        

    const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(15, 32),
        customMaterial);
    plane.position.set(0, -1.85, -5);
    plane.material.side = THREE.DoubleSide; //make plane visible on both sides
    plane.rotation.x = -Math.PI / 2;
        
    scene.add(plane);
}

function createPortal(){
    //portal
    const portal_texture = new THREE.TextureLoader().load('../resources/blackhole.jpg' ); 
    let portal = createPlane(portal_texture, 10, 10, 0, -1.7, -20); 
    scene.add(portal);

    //blocks around the portal
    const block_texture = new THREE.TextureLoader().load( "../resources/block.png" );
    block_texture.wrapS = block_texture.wrapT = THREE.RepeatWrapping;
    block_texture.repeat.set( 1, 2 );

    let pillar1 = createPlane(block_texture, 2, 5, -6, 0.7, -20);
    scene.add(pillar1);

    let sidepillar1 = createPlane(block_texture, 2, 5, -7, 0.7, -22);
    sidepillar1.rotation.y = -Math.PI / 2;
    scene.add(sidepillar1);

    let pillar2 = createPlane(block_texture, 2, 5, 6, 0.7, -20);
    scene.add(pillar2);

    let sidePillar2 = createPlane(block_texture, 4, 5, 7, 0.7, -22);
    sidePillar2.rotation.y = Math.PI / 2;
    scene.add(sidePillar2);

    //top of portal (front)
    let topPillar = createPlane(block_texture, 2, 5, -2.5, 4.2, -20);
    topPillar.rotation.z = -Math.PI / 2;
    scene.add(topPillar);

    let topPillar2 = createPlane(block_texture, 2, 5, 2.5, 4.2, -20);
    topPillar2.rotation.z = -Math.PI / 2;
    scene.add(topPillar2);

    let sideTopPillar1 = createPlane(block_texture, 4, 5, 5, 2.75, -22); //right side
    sideTopPillar1.rotation.y = Math.PI / 2;
    scene.add(sideTopPillar1);

    let sideTopPillar2 = createPlane(block_texture, 4, 5, -5, 2.75, -22); //left side
    sideTopPillar2.rotation.y = -Math.PI / 2;
    scene.add(sideTopPillar2);

}

function createPlane(texture, width, height, x, y, z){
    let plane = new THREE.Mesh(
        new THREE.PlaneGeometry(width, height),
        new THREE.MeshStandardMaterial(
            { map:texture, side:THREE.DoubleSide }
        )
    );
    plane.position.set(x, y, z);
    plane.castShadow = false;
    plane.receiveShadow = true;

    return plane;
}

function initAudio(){ //Background audio
    const listener = new THREE.AudioListener();
    camera.add(listener);

    const sound = new THREE.Audio(listener);
    const loader = new THREE.AudioLoader();
    loader.load('../resources/upbeat.mp3', (buffer) => {
        sound.setBuffer(buffer);
        sound.setVolume(0.5);
        sound.play();
    });
}

function onWindowResize() {//adjust display based on the size of the window
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );

    insetHeight = window.innerHeight / 4;
    insetWidth = window.innerWidth / 4;

    mapCamera.aspect = insetWidth / insetHeight;
    mapCamera.updateProjectionMatrix();

}
  
//when a keys is pressed

window.addEventListener('keydown', (event) => {
switch (event.code) {
    case 'KeyA':
    keys.a.pressed = true
    break
    case 'KeyD':
    keys.d.pressed = true
    break
    case 'KeyS':
    keys.s.pressed = true
    break
    case 'KeyW':
    keys.w.pressed = true
    break
    case 'KeyC':
        if(keys.c.pressed){//change to 3rd person
            keys.c.pressed = false
            camera.position.set(cube.position.x, cube.position.y + 2, cube.position.z + 5);
            camera.rotation.y = -0.04;
        }
        else{//change to 2nd person
            keys.c.pressed = true
            camera.position.set(9, 2, 0);
            camera.rotation.y = 1.5;
        }
    break
    case 'Escape':
        if(keys.esc.pressed){//close in-game menu
            keys.esc.pressed = false
            closeMenu();
            animate();
        }
        else{//open in-game menu
            keys.esc.pressed = true
            cancelAnimationFrame(animationId);
            openMenu();
        }
    break
    case 'Space':
        if(cube.position.y <= -1){//prevent double jumping
            cube.velocity.y = 0.13
        }
    break
}
});

window.addEventListener('keyup', (event) => {
switch (event.code) {
    case 'KeyA':
    keys.a.pressed = false
    break
    case 'KeyD':
    keys.d.pressed = false
    break
    case 'KeyS':
    keys.s.pressed = false
    break
    case 'KeyW':
    keys.w.pressed = false
    break
}
});

function animate() {
    animationId = requestAnimationFrame(animate);
    //render camera
    renderer.setViewport(0, 0,  window.innerWidth, window.innerHeight);
    renderer.render(scene, camera);

    //render minmap
    renderer.clearDepth();
    renderer.setScissorTest(true);
    renderer.setScissor(
        window.innerWidth - insetWidth - 16, 
        16,
        insetWidth,
        insetHeight
    );
    renderer.setViewport(
        window.innerWidth - insetWidth - 16, 
        16,
        insetWidth,
        insetHeight
    );
    renderer.render(scene, mapCamera);
    renderer.setScissorTest(false);

    if(frames == 10){
        document.getElementById("load").classList.add("close-loading"); //close loading screen
    }

    //timer
    if(frames % 60 == 0 && time != 0){
        time--;
        document.getElementById("timer").innerHTML = "Time: " + time;
    }

    //animate ground shader
    customUniforms.time.value += 0.02;

    //move player & pointlights & camera
    cube.velocity.x = 0;
    cube.velocity.z = 0;
    if (keys.a.pressed){
        cube.velocity.x = -movementSpeed;
        playerLight1.position.x += -movementSpeed;
        playerLight2.position.x += -movementSpeed;
        camera.position.x += -movementSpeed; 
    }
    else if (keys.d.pressed) {
        cube.velocity.x = movementSpeed;
        playerLight1.position.x += movementSpeed;
        playerLight2.position.x += movementSpeed;
        camera.position.x += movementSpeed; 
    }
    if (keys.s.pressed){
        cube.velocity.z = movementSpeed;
        playerLight1.position.z += movementSpeed;
        playerLight2.position.z += movementSpeed;
        camera.position.z += movementSpeed; 
    }
    else if (keys.w.pressed) {
        cube.velocity.z = -movementSpeed;
        playerLight1.position.z += -movementSpeed;
        playerLight2.position.z += -movementSpeed;
        camera.position.z += -movementSpeed; 
    }
    cube.update(ground);
    
    
    //Enemy movement
    if(time > 20){
        for(let i = 0; i < 10; i++ ){ //Wave 1
            enemies[i].update(ground);
            enemies[i].uniforms[ 'time' ].value += 0.2 ;
            if ( boxCollision({ box1: cube, box2: enemies[i]}) ) { //player collides with enemy
                cancelAnimationFrame(animationId);
                gameOver(); //screen
            }
        }
    }
    else if(time > 10 && time <= 20){ //Wave 2
        for(let i = 0; i < 20; i++ ){
            enemies[i].update(ground);
            enemies[i].uniforms[ 'time' ].value += 0.2 ;
            if ( boxCollision({ box1: cube, box2: enemies[i]}) ) { //player collides with enemy
                cancelAnimationFrame(animationId);
                gameOver(); //screen
            }
        }
    }
    else if(time > 1 && time <= 10){ //Wave 3
        for(let i = 0; i < 30; i++ ){
            enemies[i].update(ground);
            enemies[i].uniforms[ 'time' ].value += 0.2 ;
            if ( boxCollision({ box1: cube, box2: enemies[i]}) ) { //player collides with enemy
                cancelAnimationFrame(animationId);
                gameOver(); //screen
            }
        }
    }
    
   
    //Player fell off platform
    if(cube.position.y < -2.5){
        cancelAnimationFrame(animationId);
        gameOver(); //screen
    }
   
    //Win Condition
    if(time == 0){ 
        scene.remove(portalLight1);
        scene.remove(portalLight2);

        //change color of portal light
        portalLight1 = new THREE.PointLight( 0xffffff, 5, 200 );
        portalLight1.position.set( -1, 1, -18 );
        scene.add( portalLight1 );

        portalLight2 = new THREE.PointLight( 0xffffff, 5, 200 );
        portalLight2.position.set( 1, 1, -18 );
        scene.add( portalLight2 );

        PortalTicket = true;
        
        document.getElementById("mission_title").innerHTML = "Mission Completed";
        document.getElementById("mission").innerHTML = "Enter Portal!";
        document.getElementById("objective").style = "margin-left: 35%;"
    }

    if(PortalTicket){ //you may enter the portal
        if(cube.position.z <= -21){
            //go to level 2
            cancelAnimationFrame(animationId);
            window.location.href = "../level2/level2.html";
        }
    }

    frames++;
}
  
function gameOver(){//game over screen
    const openModalButtons = document.querySelectorAll('[data-modal-target]')
    const restartButton = document.querySelectorAll('[restart-button]')
    const overlay = document.getElementById('overlay')

    openModalButtons.forEach(button => {
        button.addEventListener('click', () => {
            const modal = document.querySelector(button.dataset.modalTarget)
            openModal(modal)
        })
    })

    overlay.addEventListener('click', () => {
        const modals = document.querySelectorAll('.modal.active')
        modals.forEach(modal => {
        })
    })

    function openModal(modal) {
        if (modal == null) return
        modal.classList.add('active')
        overlay.classList.add('active')
    }

    restartButton.forEach(button => { //restart the game => refresh page
        button.addEventListener('click', () => {
            location.reload();
        })
    })

    document.getElementById("open").click();  //click button
}

//in-Game Menu
function openMenu(){
    document.getElementById("popup").classList.add("open-popup");
}
function closeMenu(){
    document.getElementById("popup").classList.remove("open-popup");
}