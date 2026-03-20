document.addEventListener("DOMContentLoaded",()=>{

const year=document.getElementById("year")
if(year) year.textContent=new Date().getFullYear()


/* reveal animation */

const reveals = document.querySelectorAll(".reveal");

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible");
    } else {
      entry.target.classList.remove("is-visible");
    }
  });
}, { threshold: 0.2 });

reveals.forEach(el => observer.observe(el));



/* constellation rotation */

const constellation=document.querySelector(".constellation")

if(constellation){

let rot=0

function spin(){

rot+=0.03
constellation.style.transform=`rotate(${rot}deg)`
requestAnimationFrame(spin)

}

spin()

}


/* cursor glow */

const glow=document.querySelector(".cursor-glow")

if(glow){

let tx=window.innerWidth/2
let ty=window.innerHeight/2

let cx=tx
let cy=ty

window.addEventListener("pointermove",e=>{
tx=e.clientX
ty=e.clientY
})

function animate(){

cx+=(tx-cx)*0.12
cy+=(ty-cy)*0.12

glow.style.transform=`translate(${cx}px,${cy}px) translate(-50%,-50%)`

requestAnimationFrame(animate)

}

animate()

}


/* scroll progress */

const progress=document.querySelector(".scroll-progress")

window.addEventListener("scroll",()=>{

const h=document.documentElement.scrollHeight-window.innerHeight
const sc=window.scrollY/h*100

progress.style.width=sc+"%"

})


/* 3D tilt */

document.querySelectorAll(".js-tilt").forEach(el=>{

let rect

function update(){rect=el.getBoundingClientRect()}
update()

window.addEventListener("resize",update)

el.addEventListener("pointermove",e=>{

const x=e.clientX-rect.left
const y=e.clientY-rect.top

const px=x/rect.width-0.5
const py=y/rect.height-0.5

el.style.transform=
`perspective(1000px) rotateX(${py*-1}deg) rotateY(${px*5}deg)`

})

el.addEventListener("pointerleave",()=>{
el.style.transform="perspective(1000px) rotateX(0) rotateY(0)"
})

})


/* word split */

document.querySelectorAll("[data-split-words]").forEach(el=>{

const words=el.textContent.split(" ")
el.textContent=""

words.forEach((w,i)=>{

const span=document.createElement("span")
span.textContent=w+" "
span.style.opacity=0
span.style.display="inline-block"
span.style.transform="translateY(10px)"
span.style.transition="all 500ms ease"
span.style.transitionDelay=i*40+"ms"

el.appendChild(span)

setTimeout(()=>{
span.style.opacity=1
span.style.transform="translateY(0)"
},100)

})

})


/* ⭐ ADVANCED STARFIELD */

const canvas=document.getElementById("starfield")

if(canvas){

const ctx=canvas.getContext("2d")

let stars=[]

function resize(){
canvas.width=window.innerWidth
canvas.height=420
}

resize()
window.addEventListener("resize",resize)


class Star{

constructor(){

this.reset()

this.y=Math.random()*canvas.height

}

reset(){

this.x=Math.random()*canvas.width
this.y=Math.random()*canvas.height

this.size=Math.random()*1.8+0.3

this.speed=0.05+Math.random()*0.25

this.glow=0
this.glowSpeed=0.02+Math.random()*0.05

}

update(){

this.x-=this.speed

this.glow+=this.glowSpeed

if(this.x<0){
this.x=canvas.width
this.y=Math.random()*canvas.height
}

}

draw(){

const brightness=(Math.sin(this.glow)+1)/2

const r=this.size*(1+brightness*1.5)

ctx.beginPath()
ctx.arc(this.x,this.y,r,0,Math.PI*2)

const g=180+brightness*75

ctx.fillStyle=`rgba(255,255,${g},${0.6+brightness*0.4})`
ctx.shadowColor=`rgba(255,255,255,${brightness})`
ctx.shadowBlur=10*brightness

ctx.fill()

}

}


for(let i=0;i<160;i++){
stars.push(new Star())
}


function animate(){

ctx.clearRect(0,0,canvas.width,canvas.height)

stars.forEach(s=>{
s.update()
s.draw()
})

requestAnimationFrame(animate)

}

animate()

}


/* mobile nav */

const navToggle=document.querySelector(".nav__toggle")
const nav=document.querySelector(".nav")

navToggle?.addEventListener("click",()=>{
nav.classList.toggle("is-open")
})

})