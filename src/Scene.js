import * as THREE from 'three';
import {TimelineMax} from 'gsap';
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader";
import model from "./shaders/scene-processed-new.glb";
import sky from "./shaders/19.png";
import * as dat from "dat.gui"

// import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
// import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
// import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

// console.log(model)

let OrbitControls = require('three-orbit-controls')(THREE)

export default class    LadyScene {
    constructor(options) {
        this.scene = new THREE.Scene();

        this.container = options.dom;
        this.width = this.container.offsetWidth;
        this.height = this.container.offsetHeight;
        this.renderer = new THREE.WebGLRenderer({antialias: true});
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setClearColor(0x000000,1)

        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.physicallyCorrectLights = true;
        this.renderer.outputEncoding = THREE.sRGBEncoding;

        this.container.appendChild(this.renderer.domElement);

        this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.001, 1000);

        // var frustumSize = 1;
        // var aspect = window.innerWidth / window.innerHeight;
        // this.camera = new THREE.OrthographicCamera(frustumSize / -2, frustumSize / 2, frustumSize / 2, frustumSize / -2, -1000, 1000);
        this.camera.position.set(0, 0, .35);
        this.time = 0;
        this.tick = 0;
        this.clock = new THREE.Clock();

        // this.controls = new OrbitControls(this.camera, this.render.domElement);


        // this.scene.add( new THREE.AmbientLight( 0x404040 ) );
        // const pointLight = new THREE.PointLight( 0xffffff, 1 );
        //
        // this.camera.add( pointLight );
        //
        //
        // const renderScene = new RenderPass( this.scene, this.camera );
        //
        // const bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85 );
        // bloomPass.threshold = 1;
        // bloomPass.strength = 1.5;
        // bloomPass.radius = .5;
        //
        // this.composer = new EffectComposer( this.renderer );
        // this.composer.addPass( renderScene );
        // this.composer.addPass( bloomPass );

        this.spline = new Spline();

        this.addObject();
        // this.addLight();
        // this.addFloor();
        this.mouseEvents();
        this.resize();
        this.render();
        this.setupResize();
        this.scene.add(this.spline.splineObject);

        this.loader = new GLTFLoader();
        this.loader.load(model, (gltf) => {

            // console.log(gltf)
            // this.scene.add(gltf.scene)

            gltf.scene.traverse(o => {
                if (o.isBone) {
                    // console.log(o.name);
                }else{console.log('no bones')}
                if (o.isMesh) {
                    // o.castShadow = true
                    o.material = this.material
                    o.castShadow = true;
                    o.receiveShadow = true;
                }
                if (o.isBone) {
                    // console.log(o.name);
                }
                if (o.isBone && o.name === 'head_0100') {
                    this.head = o;
                }
                if (o.isBone && o.name === 'neck_01_099') {
                    this.neck = o;
                }
                if (o.isBone && o.name === 'spine_03_07') {
                    this.spine = o;
                }
                if (o.isBone && o.name === 'hand_l_011') {
                    this.indexFinger = o;
                }
                // if (o.isBone && o.name === 'calf_r_0106') {
                //     this.calf = o;
                // }


            })
            // this.scene.mesh = new THREE.Mesh( this.geometry, this.material );
            gltf.scene.scale.set(.0045, .0045, .0045);
            gltf.scene.position.y = -.6;
            gltf.scene.position.z = .17;
            gltf.scene.position.x = -.035;


            this.mixer = new THREE.AnimationMixer(gltf.scene);
            // console.log(gltf.animations[0])

            this.fileAnimations = gltf.animations
            let modelAnimation = THREE.AnimationClip.findByName(this.fileAnimations, 'human|humanAction');
            // console.log(modelAnimation);
            modelAnimation.tracks.splice(100, 2);
            modelAnimation.tracks.splice(99, 3);
            modelAnimation.tracks.splice(16, 1);
            // modelAnimation.tracks.splice(107, 2);
            this.mixer.clipAction(modelAnimation).play();

            this.scene.add(gltf.scene);
            this.model = gltf.scene;
        })

    }

    addLight(){
        let hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.61);
        hemiLight.position.set(0, 50, 0);
        this.scene.add(hemiLight);

        let d = 8.25;
        let dirLight = new THREE.DirectionalLight(0xffffff, 0.54);
        dirLight.position.set(-8, 12, 8);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize = new THREE.Vector2(1024, 1024);
        dirLight.shadow.camera.near = 0.1;
        dirLight.shadow.camera.far = 1500;
        dirLight.shadow.camera.left = d * -1;
        dirLight.shadow.camera.right = d;
        dirLight.shadow.camera.top = d;
        dirLight.shadow.camera.bottom = d * -1;
        this.scene.add(dirLight);
    }
    addFloor(){
        let floorGeometry = new THREE.PlaneGeometry(5000, 5000, 1, 1);
        let floorMaterial = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            shininess: 0,
        });

        let floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -0.5 * Math.PI; // This is 90 degrees by the way
        floor.receiveShadow = true;
        floor.position.y = -11;
        this.scene.add(floor);
    }


    addObject() {
        let that = this;
        // this.material = new THREE.MeshBasicMaterial({color: "#9E4300", skinning: true});

        this.material = new THREE.ShaderMaterial({
            morphTargets: true,
            skinning: true,
            extensions: {
                derivatives: "#extension GL_OES_standard_derivatives : enable"
            },
            side: THREE.DoubleSide,
            uniforms: {
                time: {type: "f", value: 0},
                sky: {type: "t", value: new THREE.TextureLoader().load(sky)},
                resolution: {value: new THREE.Vector4()},
                uVRate1: {
                    value: new THREE.Vector2(1, 1)
                }
            },
            // wireframe: true,
            vertexShader: this.vertexShader(),
            fragmentShader: this.fragmentShader()
        })
        this.geometry = new THREE.PlaneGeometry(1, 1, 1, 1);

        // this.plane = new THREE.Mesh( this.geometry, this.material );
        // this.mesh = new THREE.Mesh( this.geometry, this.material );
        // this.scene.add( this.mesh );

    }

    vertexShader() {
        return `
        // uniform float time;
        // varying vec3 vPosition; 
        // uniform vec2 pixels; 
        // float PI  = 3.141592653589793238;
        //
        varying vec3 vNormal;         
        \tvarying vec2 vUv;
        \t#ifdef USE_SKINNING
        \t\tuniform mat4 bindMatrix;
        \t\tuniform mat4 bindMatrixInverse;
        \t\t#ifdef BONE_TEXTURE
        \t\t\tuniform sampler2D boneTexture;
        \t\t\tuniform int boneTextureSize;
        \t\t\tmat4 getBoneMatrix( const in float i ) {
        \t\t\t\tfloat j = i * 4.0;
        \t\t\t\tfloat x = mod( j, float( boneTextureSize ) );
        \t\t\t\tfloat y = floor( j / float( boneTextureSize ) );
        \t\t\t\tfloat dx = 1.0 / float( boneTextureSize );
        \t\t\t\tfloat dy = 1.0 / float( boneTextureSize );
        \t\t\t\ty = dy * ( y + 0.5 );
        \t\t\t\tvec4 v1 = texture2D( boneTexture, vec2( dx * ( x + 0.5 ), y ) );
        \t\t\t\tvec4 v2 = texture2D( boneTexture, vec2( dx * ( x + 1.5 ), y ) );
        \t\t\t\tvec4 v3 = texture2D( boneTexture, vec2( dx * ( x + 2.5 ), y ) );
        \t\t\t\tvec4 v4 = texture2D( boneTexture, vec2( dx * ( x + 3.5 ), y ) );
        \t\t\t\tmat4 bone = mat4( v1, v2, v3, v4 );
        \t\t\t\treturn bone;
        \t\t\t}
        \t\t#else
        \t\t\tuniform mat4 boneMatrices[ MAX_BONES ];
        \t\t\tmat4 getBoneMatrix( const in float i ) {
        \t\t\t\tmat4 bone = boneMatrices[ int(i) ];
        \t\t\t\treturn bone;
        \t\t\t}
        \t\t#endif
        \t#endif
        \tvoid main() {
        \t\tvUv = uv;
        \t\t#ifdef USE_SKINNING
        \t\t\tmat4 boneMatX = getBoneMatrix( skinIndex.x );
        \t\t\tmat4 boneMatY = getBoneMatrix( skinIndex.y );
        \t\t\tmat4 boneMatZ = getBoneMatrix( skinIndex.z );
        \t\t\tmat4 boneMatW = getBoneMatrix( skinIndex.w );
        \t\t\tmat4 skinMatrix = mat4( 0.0 );
        \t\t\tskinMatrix += skinWeight.x * boneMatX;
        \t\t\tskinMatrix += skinWeight.y * boneMatY;
        \t\t\tskinMatrix += skinWeight.z * boneMatZ;
        \t\t\tskinMatrix += skinWeight.w * boneMatW;
        \t\t\tskinMatrix  = bindMatrixInverse * skinMatrix * bindMatrix;
        \t\t\tvec4 skinVertex = bindMatrix * vec4( position, 1.0 );
        \t\t\tvec4 skinned = vec4( 0.0 );
        \t\t\tskinned += boneMatX * skinVertex * skinWeight.x;
        \t\t\tskinned += boneMatY * skinVertex * skinWeight.y;
        \t\t\tskinned += boneMatZ * skinVertex * skinWeight.z;
        \t\t\tskinned += boneMatW * skinVertex * skinWeight.w;
        \t\t\tskinned  = bindMatrixInverse * skinned;
        \t\t\tvec4 mvPosition = modelViewMatrix * skinned;
        \t\t#else
        \t\t\tvec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
        \t\t#endif
        \t\tgl_Position = projectionMatrix * mvPosition;
            vNormal = normal;   
        \t}
        
  `
    }

    fragmentShader() {
        return `
        uniform float time;
        uniform float progress;
        uniform sampler2D sky;
        uniform vec4 resolution;
        varying vec2 vUv; 
        varying vec3 vPosition; 
        varying vec3 vNormal;         
        float PI  = 3.141592653589793238;
        
        vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
        vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
        vec4 fade(vec4 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}
        
        float cnoise(vec4 P, vec4 rep){
          vec4 Pi0 = mod(floor(P), rep); // Integer part modulo rep
          vec4 Pi1 = mod(Pi0 + 1.0, rep); // Integer part + 1 mod rep
          vec4 Pf0 = fract(P); // Fractional part for interpolation
          vec4 Pf1 = Pf0 - 1.0; // Fractional part - 1.0
          vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
          vec4 iy = vec4(Pi0.yy, Pi1.yy);
          vec4 iz0 = vec4(Pi0.zzzz);
          vec4 iz1 = vec4(Pi1.zzzz);
          vec4 iw0 = vec4(Pi0.wwww);
          vec4 iw1 = vec4(Pi1.wwww);
        
          vec4 ixy = permute(permute(ix) + iy);
          vec4 ixy0 = permute(ixy + iz0);
          vec4 ixy1 = permute(ixy + iz1);
          vec4 ixy00 = permute(ixy0 + iw0);
          vec4 ixy01 = permute(ixy0 + iw1);
          vec4 ixy10 = permute(ixy1 + iw0);
          vec4 ixy11 = permute(ixy1 + iw1);
        
          vec4 gx00 = ixy00 / 7.0;
          vec4 gy00 = floor(gx00) / 7.0;
          vec4 gz00 = floor(gy00) / 6.0;
          gx00 = fract(gx00) - 0.5;
          gy00 = fract(gy00) - 0.5;
          gz00 = fract(gz00) - 0.5;
          vec4 gw00 = vec4(0.75) - abs(gx00) - abs(gy00) - abs(gz00);
          vec4 sw00 = step(gw00, vec4(0.0));
          gx00 -= sw00 * (step(0.0, gx00) - 0.5);
          gy00 -= sw00 * (step(0.0, gy00) - 0.5);
        
          vec4 gx01 = ixy01 / 7.0;
          vec4 gy01 = floor(gx01) / 7.0;
          vec4 gz01 = floor(gy01) / 6.0;
          gx01 = fract(gx01) - 0.5;
          gy01 = fract(gy01) - 0.5;
          gz01 = fract(gz01) - 0.5;
          vec4 gw01 = vec4(0.75) - abs(gx01) - abs(gy01) - abs(gz01);
          vec4 sw01 = step(gw01, vec4(0.0));
          gx01 -= sw01 * (step(0.0, gx01) - 0.5);
          gy01 -= sw01 * (step(0.0, gy01) - 0.5);
        
          vec4 gx10 = ixy10 / 7.0;
          vec4 gy10 = floor(gx10) / 7.0;
          vec4 gz10 = floor(gy10) / 6.0;
          gx10 = fract(gx10) - 0.5;
          gy10 = fract(gy10) - 0.5;
          gz10 = fract(gz10) - 0.5;
          vec4 gw10 = vec4(0.75) - abs(gx10) - abs(gy10) - abs(gz10);
          vec4 sw10 = step(gw10, vec4(0.0));
          gx10 -= sw10 * (step(0.0, gx10) - 0.5);
          gy10 -= sw10 * (step(0.0, gy10) - 0.5);
        
          vec4 gx11 = ixy11 / 7.0;
          vec4 gy11 = floor(gx11) / 7.0;
          vec4 gz11 = floor(gy11) / 6.0;
          gx11 = fract(gx11) - 0.5;
          gy11 = fract(gy11) - 0.5;
          gz11 = fract(gz11) - 0.5;
          vec4 gw11 = vec4(0.75) - abs(gx11) - abs(gy11) - abs(gz11);
          vec4 sw11 = step(gw11, vec4(0.0));
          gx11 -= sw11 * (step(0.0, gx11) - 0.5);
          gy11 -= sw11 * (step(0.0, gy11) - 0.5);
        
          vec4 g0000 = vec4(gx00.x,gy00.x,gz00.x,gw00.x);
          vec4 g1000 = vec4(gx00.y,gy00.y,gz00.y,gw00.y);
          vec4 g0100 = vec4(gx00.z,gy00.z,gz00.z,gw00.z);
          vec4 g1100 = vec4(gx00.w,gy00.w,gz00.w,gw00.w);
          vec4 g0010 = vec4(gx10.x,gy10.x,gz10.x,gw10.x);
          vec4 g1010 = vec4(gx10.y,gy10.y,gz10.y,gw10.y);
          vec4 g0110 = vec4(gx10.z,gy10.z,gz10.z,gw10.z);
          vec4 g1110 = vec4(gx10.w,gy10.w,gz10.w,gw10.w);
          vec4 g0001 = vec4(gx01.x,gy01.x,gz01.x,gw01.x);
          vec4 g1001 = vec4(gx01.y,gy01.y,gz01.y,gw01.y);
          vec4 g0101 = vec4(gx01.z,gy01.z,gz01.z,gw01.z);
          vec4 g1101 = vec4(gx01.w,gy01.w,gz01.w,gw01.w);
          vec4 g0011 = vec4(gx11.x,gy11.x,gz11.x,gw11.x);
          vec4 g1011 = vec4(gx11.y,gy11.y,gz11.y,gw11.y);
          vec4 g0111 = vec4(gx11.z,gy11.z,gz11.z,gw11.z);
          vec4 g1111 = vec4(gx11.w,gy11.w,gz11.w,gw11.w);
        
          vec4 norm00 = taylorInvSqrt(vec4(dot(g0000, g0000), dot(g0100, g0100), dot(g1000, g1000), dot(g1100, g1100)));
          g0000 *= norm00.x;
          g0100 *= norm00.y;
          g1000 *= norm00.z;
          g1100 *= norm00.w;
        
          vec4 norm01 = taylorInvSqrt(vec4(dot(g0001, g0001), dot(g0101, g0101), dot(g1001, g1001), dot(g1101, g1101)));
          g0001 *= norm01.x;
          g0101 *= norm01.y;
          g1001 *= norm01.z;
          g1101 *= norm01.w;
        
          vec4 norm10 = taylorInvSqrt(vec4(dot(g0010, g0010), dot(g0110, g0110), dot(g1010, g1010), dot(g1110, g1110)));
          g0010 *= norm10.x;
          g0110 *= norm10.y;
          g1010 *= norm10.z;
          g1110 *= norm10.w;
        
          vec4 norm11 = taylorInvSqrt(vec4(dot(g0011, g0011), dot(g0111, g0111), dot(g1011, g1011), dot(g1111, g1111)));
          g0011 *= norm11.x;
          g0111 *= norm11.y;
          g1011 *= norm11.z;
          g1111 *= norm11.w;
        
          float n0000 = dot(g0000, Pf0);
          float n1000 = dot(g1000, vec4(Pf1.x, Pf0.yzw));
          float n0100 = dot(g0100, vec4(Pf0.x, Pf1.y, Pf0.zw));
          float n1100 = dot(g1100, vec4(Pf1.xy, Pf0.zw));
          float n0010 = dot(g0010, vec4(Pf0.xy, Pf1.z, Pf0.w));
          float n1010 = dot(g1010, vec4(Pf1.x, Pf0.y, Pf1.z, Pf0.w));
          float n0110 = dot(g0110, vec4(Pf0.x, Pf1.yz, Pf0.w));
          float n1110 = dot(g1110, vec4(Pf1.xyz, Pf0.w));
          float n0001 = dot(g0001, vec4(Pf0.xyz, Pf1.w));
          float n1001 = dot(g1001, vec4(Pf1.x, Pf0.yz, Pf1.w));
          float n0101 = dot(g0101, vec4(Pf0.x, Pf1.y, Pf0.z, Pf1.w));
          float n1101 = dot(g1101, vec4(Pf1.xy, Pf0.z, Pf1.w));
          float n0011 = dot(g0011, vec4(Pf0.xy, Pf1.zw));
          float n1011 = dot(g1011, vec4(Pf1.x, Pf0.y, Pf1.zw));
          float n0111 = dot(g0111, vec4(Pf0.x, Pf1.yzw));
          float n1111 = dot(g1111, Pf1);
        
          vec4 fade_xyzw = fade(Pf0);
          vec4 n_0w = mix(vec4(n0000, n1000, n0100, n1100), vec4(n0001, n1001, n0101, n1101), fade_xyzw.w);
          vec4 n_1w = mix(vec4(n0010, n1010, n0110, n1110), vec4(n0011, n1011, n0111, n1111), fade_xyzw.w);
          vec4 n_zw = mix(n_0w, n_1w, fade_xyzw.z);
          vec2 n_yzw = mix(n_zw.xy, n_zw.zw, fade_xyzw.y);
          float n_xyzw = mix(n_yzw.x, n_yzw.y, fade_xyzw.x);
          return 2.2 * n_xyzw;
        }

        
        
        void main(){
            float diff = dot(vec3(1.), vNormal);
            float phi = acos(vNormal.y);
            float angle = atan(vNormal.x,vNormal.z);
            
            float fresnel = abs(dot(cameraPosition, vNormal));
            fresnel = fresnel * 3.; 
            vec2 newFakeUV = vec2( (angle + PI)/(2.*PI), phi/PI ) ;
            vec2 fakeUV = vec2(dot(vec3(2), vNormal), dot(vec3(-1.,0.,1.), vNormal));
            
            fakeUV = fract(fakeUV + vec2(time/110., time/10.));
            
            vec4 txt = texture2D(sky, newFakeUV + 0.2 * cnoise(vec4(fakeUV * 5.,time/100.,0.), vec4(5.)));
            
            gl_FragColor = vec4(mix(vec3(0), txt.rgb, fresnel), 1.);
            // gl_FragColor = txt;
            // gl_FragColor = vec4(fresnel);
        }
  `
    }

    mouseEvents(){
        document.addEventListener('mousemove', (e) => {
            let mousecoords = this.getMousePos(e);
            if (this.head) {
                this.moveJoint( mousecoords, this.head, 20);
            }
            if (this.neck) {
                this.moveJoint( mousecoords, this.neck, 25);
            }
            if (this.spine) {
                this.moveJoint( mousecoords, this.spine, 4);
            }
            if (this.indexFinger) {
                this.moveJoint( mousecoords, this.indexFinger, 12);
            }
            // if (this.calf) {
            //     this.moveJoint( mousecoords, this.calf, 1);
            // }
        })
    }

    getMousePos(e) {
        return { x: e.clientX, y: e.clientY };
    }

    moveJoint(mouse, joint, degreeLimit) {
        let degrees = this.getMouseDegrees(mouse.x, mouse.y, degreeLimit);
        joint.rotation.y = THREE.Math.degToRad(degrees.x);
        joint.rotation.x = THREE.Math.degToRad(degrees.y);
    }

    getMouseDegrees(x, y, degreeLimit) {
        let dx = 0,
            dy = 0,
            xdiff,
            xPercentage,
            ydiff,
            yPercentage;

        let w = { x: window.innerWidth, y: window.innerHeight };

        if (x <= w.x / 2) {
            xdiff = w.x / 2 - x;
            xPercentage = (xdiff / (w.x / 2)) * 100;
            dx = ((degreeLimit * xPercentage) / 100) * -1; }
        if (x >= w.x / 2) {
            xdiff = x - w.x / 2;
            xPercentage = (xdiff / (w.x / 2)) * 100;
            dx = (degreeLimit * xPercentage) / 100;
        }
      
        if (y <= w.y / 2) {
            ydiff = w.y / 2 - y;
            yPercentage = (ydiff / (w.y / 2)) * 100;
            dy = (((degreeLimit * 0.5) * yPercentage) / 100) * -1;
        }

    
        if (y >= w.y / 2) {
            ydiff = y - w.y / 2;
            yPercentage = (ydiff / (w.y / 2)) * 100;
            dy = (degreeLimit * yPercentage) / 100;
        }
        return { x: dx, y: dy };
    }


    setupResize() {
        window.addEventListener('resize', this.resize.bind(this));
    }

    resize() {
        this.width = this.container.offsetWidth;
        this.height = this.container.offsetHeight;

        this.renderer.setSize(this.width, this.height);
        this.camera.aspect = this.width / this.height;

        this.imageAspect = 1;
        let a1;
        let a2;
        if (this.height / this.width * this.imageAspect) {
            a1 = (this.width / this.height) * this.imageAspect;
            a2 = 1;
        } else {
            a1 = 1;
            a2 = (this.height / this.width) / this.imageAspect;
        }
        //
        this.material.uniforms.resolution.value.x = this.width;
        this.material.uniforms.resolution.value.y = this.height;
        this.material.uniforms.resolution.value.z = a1;
        this.material.uniforms.resolution.value.w = a2;

        this.camera.updateProjectionMatrix();

    }

    render() {
        requestAnimationFrame(this.render.bind(this));

        this.time += 0.05;
        this.material.uniforms.time.value = this.time;
        // if(this.mouse){
        //     this.material.uniforms.mouse.value = this.mouse;
        // }

        //Spline
        let camPos = this.spline.curve.getPoint(this.tick);
        this.camera.position.z = camPos.z;
        this.camera.position.x = camPos.x;
        this.camera.position.y = camPos.y ;

        this.renderer.render(this.scene, this.camera);
        if (this.mixer) {
            this.mixer.update(this.clock.getDelta());
        }
    }
}

class Spline {
    constructor() {
        this.curve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, 0, .35),
            new THREE.Vector3(.3, -.1, .25),
            new THREE.Vector3(-.25, -.38, .35),
            new THREE.Vector3(-.03, -.62, .30),

        ]);

        this.geometry = new THREE.Geometry();
        this.geometry.vertices = this.curve.getPoints(50);
        this.material = new THREE.LineBasicMaterial({
            color: 0xFFFFFF
        });

        this.splineObject = new THREE.Line(this.geometry, this.material);
    }

}

