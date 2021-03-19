import './scss/app.scss';
import LadyScene from "./Scene";
import {gsap, Power4} from 'gsap';
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger);

let ladyScene =  new LadyScene({
    dom: document.getElementById('container')
});

console.log('%c lumina.studio', 'text-align:center; color: #eeeeee; font-weight: bolder; padding:45px; font-size:48px; display:block; background-color: #000;');

let o = {a:0};
gsap.to(o,{
    a:1,
    scrollTrigger:{
        trigger: '.wrap',
        // markers: true,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (self) =>{
            console.log(ladyScene.model, self.progress)
            // ladyScene.model.rotation.z = 0.02*3.14 * self.progress
            // ladyScene.camera.rotation.x = -2*3.14 * (self.progress * 0.1)
            // ladyScene.camera.rotation.y = 2*3.14 * (self.progress * 0.1)

            // ladyScene.camera.position.z = .01*3.14 * (self.progress * 0.01)

            ladyScene.tick = self.progress;
        }
    }
})


let headers = [...document.querySelectorAll('.scroll')];

headers.forEach(header => {
    gsap.from(header, {
        scrollTrigger:{
            trigger: header,
            // start: 'top top',
            scrub: 1,
            end:"+=20%"
            // toggleActions: 'restart pause reverse pause'
        },
        duration: 2,
        y: 45,
        filter: 'blur(10px)',
        // scale: 1.1,
        autoAlpha: 0
    })

})

gsap.from(".welcome-1", {
    duration: 2,
    y: 15,
    filter: 'blur(20px)',
    // scale: 1.1,
    autoAlpha: 0,
    delay: 2.2,
    ease: Power4.easeOut,
})

// gsap.to(".welcome", {
//     scrollTrigger: {
//         trigger:  ".welcome",
//         scrub: true,
//         // end: 'bottom bottom',
//         end:"+=420%"
//     },
//     duration: 2,
//     opacity: 0,
// })



