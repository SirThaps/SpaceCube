import * as THREE from 'three'

export class Box extends THREE.Mesh {
    constructor({
        width,
        height,
        depth,
        color = '#00ff00',
        velocity = {
        x: 0,
        y: 0,
        z: 0
        },
        position = {
        x: 0,
        y: 0,
        z: 0
        },
        zAcceleration = false
    }) {
        super(
        new THREE.BoxGeometry(width, height, depth),
        new THREE.MeshStandardMaterial({ color })
        )
    
        this.width = width
        this.height = height
        this.depth = depth
    
        this.position.set(position.x, position.y, position.z)
    
        this.right = this.position.x + this.width / 2
        this.left = this.position.x - this.width / 2
    
        this.bottom = this.position.y - this.height / 2
        this.top = this.position.y + this.height / 2
    
        this.front = this.position.z + this.depth / 2
        this.back = this.position.z - this.depth / 2
    
        this.velocity = velocity
        this.gravity = -0.003
    
        this.zAcceleration = zAcceleration
    }
    
    update(ground) { //apply physics
        this.updateSides()
    
        if (this.zAcceleration) this.velocity.z += 0.0003;
    
        this.position.x += this.velocity.x
        this.position.z += this.velocity.z
    
        this.applyGravity(ground)
    }

    updateSides() {
        this.right = this.position.x + this.width / 2
        this.left = this.position.x - this.width / 2
    
        this.bottom = this.position.y - this.height / 2
        this.top = this.position.y + this.height / 2
    
        this.front = this.position.z + this.depth / 2
        this.back = this.position.z - this.depth / 2
    }
    
    applyGravity(ground) {
        this.velocity.y += this.gravity
    
        // this is where we hit the ground
        if (boxCollision({box1: this, box2: ground})) {
            const friction = 0.5
            this.velocity.y *= friction
            this.velocity.y = -this.velocity.y
        } 
        else 
            this.position.y += this.velocity.y
    }
}

//shader for fire cubes in level 1
const textureLoader = new THREE.TextureLoader();
const lavaTexture = textureLoader.load( '../resources/lavatile.jpg' );
lavaTexture.colorSpace = THREE.SRGBColorSpace;
lavaTexture.wrapS = lavaTexture.wrapT = THREE.RepeatWrapping;

export class FireCube extends THREE.Mesh {
    constructor({
        width,
        height,
        depth,
        velocity = {
        x: 0,
        y: 0,
        z: 0
        },
        position = {
        x: 0,
        y: 0,
        z: 0
        },
        zAcceleration = false,
        uniforms = {
            'fogDensity': { value: 0.1 },
            'fogColor': { value: new THREE.Vector3( 0, 0, 0 ) },
            'time': { value: 1.0 },
            'uvScale': { value: new THREE.Vector2( 3.0, 1.0 ) },
            'texture2': { value: lavaTexture }
        }
    }) {
        super(
        new THREE.BoxGeometry(width, height, depth),
        new THREE.ShaderMaterial({ 
            uniforms: uniforms,
            vertexShader: document.getElementById( 'vertexShaderFire' ).textContent,
            fragmentShader: document.getElementById( 'fragmentShaderFire' ).textContent 
        })
        )
        this.uniforms = uniforms

        this.width = width
        this.height = height
        this.depth = depth
    
        this.position.set(position.x, position.y, position.z)
    
        this.right = this.position.x + this.width / 2
        this.left = this.position.x - this.width / 2
    
        this.bottom = this.position.y - this.height / 2
        this.top = this.position.y + this.height / 2
    
        this.front = this.position.z + this.depth / 2
        this.back = this.position.z - this.depth / 2
    
        this.velocity = velocity
        this.gravity = -0.002
    
        this.zAcceleration = zAcceleration
    }
    
    update(ground) { //apply physics
        this.updateSides()
    
        if (this.zAcceleration) this.velocity.z += Math.random() * 0.0002
        
        if(this.position.x >= 6.5 || this.position.x <= -6.5){
            this.velocity.x *= -1
        }
        
        this.position.x += this.velocity.x
        this.position.z += this.velocity.z
    
        this.applyGravity(ground)
    }

    updateSides() {
        this.right = this.position.x + this.width / 2
        this.left = this.position.x - this.width / 2
    
        this.bottom = this.position.y - this.height / 2
        this.top = this.position.y + this.height / 2
    
        this.front = this.position.z + this.depth / 2
        this.back = this.position.z - this.depth / 2
    }
    
    applyGravity(ground) {
        this.velocity.y += this.gravity
    
        // this is where we hit the ground
        if (boxCollision({box1: this, box2: ground})) {
            const friction = 0.5
            this.velocity.y *= friction
            this.velocity.y = -this.velocity.y
        } 
        else 
            this.position.y += this.velocity.y
    }
}


//rock texture for level 2
const moonbasecolor = textureLoader.load("../resources/moon/stucco1_albedo.png");
const moonnormalMap = textureLoader.load("../resources/moon/stucco1_Normal-dx.png");
const moonheightMap = textureLoader.load("../resources/moon/stucco1_Height.png");
const moonroughnessMap = textureLoader.load("../resources/moon/stucco1_Roughness.png");
const moonambientOcclusionMap = textureLoader.load("../resources/moon/stucco1_ao.png");
const moonsmetallic = textureLoader.load("../resources/moon/stucco1_Metallic.png");

export class Rock extends THREE.Mesh {
    constructor({
        position = {
        x: 0,
        y: 0,
        z: 0
        },
        velocity = {
            x: 0,
            y: 0,
            z: 0
            },
        zAcceleration = false
    }) {
        super(
            new THREE.SphereGeometry(0.8, 512, 512), 
            new THREE.MeshStandardMaterial({ 
                color: 0x5A5A5A, 
                map: moonbasecolor, 
                normalMap: moonnormalMap, 
                displacementMap: moonheightMap, 
                displacementScale: 0.2, 
                roughnessMap: moonroughnessMap, 
                roughness: 2, 
                aoMap: moonambientOcclusionMap, 
                metalnessMap: moonsmetallic, 
                metalness: 0.4
            })
        )
    
        this.position.set(position.x, position.y, position.z)
    
        this.right = this.position.x + 0.9
        this.left = this.position.x - 0.9
    
        this.bottom = this.position.y - 0.9
        this.top = this.position.y + 0.9
    
        this.front = this.position.z + 0.9
        this.back = this.position.z - 0.9
    
        this.velocity = velocity
        this.gravity = -0.002
    
        this.zAcceleration = zAcceleration
    }
    
    update(ground) { //apply physics
        this.updateSides()
    
        if (this.zAcceleration) this.velocity.z += 0.0001;

        this.position.x += this.velocity.x
        this.position.z += this.velocity.z
    
        this.applyGravity(ground)
    }

    updateSides() {
        this.right = this.position.x + 0.9
        this.left = this.position.x - 0.9
    
        this.bottom = this.position.y - 0.9
        this.top = this.position.y + 0.9
    
        this.front = this.position.z + 0.9
        this.back = this.position.z - 0.9
    }
    
    applyGravity(ground) {
        this.velocity.y += this.gravity
    
        // this is where we hit the ground
        if (boxCollision({box1: this, box2: ground})) {
            const friction = 0.5
            this.velocity.y *= friction
            this.velocity.y = -this.velocity.y
        } 
        else 
            this.position.y += this.velocity.y
    }
}


//checks if 2 boxes collided
export function boxCollision({ box1, box2 }) {
    const xCollision = box1.right >= box2.left && box1.left <= box2.right;
    const yCollision = box1.bottom + box1.velocity.y <= box2.top && box1.top >= box2.bottom;
    const zCollision = box1.front >= box2.back && box1.back <= box2.front;

    return xCollision && yCollision && zCollision;
}