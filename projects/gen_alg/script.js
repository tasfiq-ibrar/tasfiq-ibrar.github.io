const canvas = document.getElementById("sim");
const ctx = canvas.getContext("2d");
const graphCanvas = document.getElementById("graph");
const gctx = graphCanvas.getContext("2d");
let paused = false;
const pauseBtn = document.getElementById("pauseBtn");

pauseBtn.onclick = () => {
  paused = !paused;
  pauseBtn.textContent = paused ? "▶ Play" : "⏸ Pause";
};

let rockets=[], obstacles=[], targets=[], explosions=[];
let generation=0, step=0;
const start={x:window.innerWidth/2, y:window.innerHeight-40};
let bestHistory=[], successHistory=[];

let params = {
  population: 80,
  lifespan: 250,
  mutationRate: 0.02,
  turnSpeed: 0.35,
  moveSpeed: 0.4,
  stepSpeed: 4,
  learningFactor: 1
};

// ===== Elements =====
const pop=document.getElementById("pop"), popVal=document.getElementById("popVal");
const life=document.getElementById("life"), lifeVal=document.getElementById("lifeVal");
const mutation=document.getElementById("mutation"), mutVal=document.getElementById("mutVal");
const movespeed=document.getElementById("movespeed"), speedVal=document.getElementById("speedVal");
const turn=document.getElementById("turn"), turnVal=document.getElementById("turnVal");
const stepspeed=document.getElementById("stepspeed"), stepVal=document.getElementById("stepVal");
const learning=document.getElementById("learning"), learnVal=document.getElementById("learnVal");
const generationEl=document.getElementById("generation");
const successEl=document.getElementById("success");
const crashEl=document.getElementById("crash");
const acquiredEl=document.getElementById("acquired");
const restartBtn=document.getElementById("restart");
const toggleUI=document.getElementById("toggleUI");
const uiContent=document.getElementById("uiContent");
const toggleViz=document.getElementById("toggleViz");
const vizContent=document.getElementById("vizContent");
const vizHeader=document.getElementById("vizHeader");

// ===== Resize =====
function resize(){canvas.width=window.innerWidth; canvas.height=window.innerHeight; start.x=canvas.width/2; start.y=canvas.height-40;}
window.addEventListener("resize",resize); resize();

// ===== Rocket Class =====
class Rocket{
  constructor(dna){
    this.pos={...start}; this.vel={x:0,y:0}; this.acc={x:0,y:0};
    this.dna=dna||this.randomDNA();
    this.completed=false; this.crashed=false; this.targetIndex=0; this.fitness=0;
  }
  randomDNA(){
    let arr=[],angle=Math.random()*Math.PI*2;
    for(let i=0;i<params.lifespan;i++){
      angle+=(Math.random()-0.5)*params.turnSpeed;
      arr.push({x:Math.cos(angle)*params.moveSpeed, y:Math.sin(angle)*params.moveSpeed});
    }
    return arr;
  }
  applyForce(f){ this.acc.x+=f.x; this.acc.y+=f.y; }
  update(){
    if(this.completed||this.crashed) return;
    let gene=this.dna[step]; if(gene)this.applyForce(gene);
    this.vel.x+=this.acc.x; this.vel.y+=this.acc.y;
    this.pos.x+=this.vel.x; this.pos.y+=this.vel.y;
    this.acc.x=0; this.acc.y=0;

    // Sequential target acquisition
    if(this.targetIndex<targets.length){
      let t=targets[this.targetIndex];
      let d=Math.hypot(this.pos.x-t.x,this.pos.y-t.y);
      if(d<15){
        this.targetIndex++;
        explosions.push(new Explosion(this.pos.x,this.pos.y,"gold"));
        if(this.targetIndex===targets.length) this.completed=true;
      }
    }

    for(let o of obstacles){
      if(this.pos.x>o.x && this.pos.x<o.x+o.w && this.pos.y>o.y && this.pos.y<o.y+o.h){
        this.crashed=true;
        explosions.push(new Explosion(this.pos.x,this.pos.y,"red"));
      }
    }
  }
  calcFitness(){
    let score=0;
    if(targets.length){
      let t=targets[Math.min(this.targetIndex,targets.length-1)];
      let d=Math.hypot(this.pos.x-t.x,this.pos.y-t.y);
      score+=1/(d+1)+this.targetIndex*20;
      if(this.completed) score+=50;
    }
    if(this.crashed) score*=0.2;
    this.fitness=score**params.learningFactor;
  }
  draw(){
    ctx.save(); ctx.translate(this.pos.x,this.pos.y); ctx.rotate(Math.atan2(this.vel.y,this.vel.x));

    // Thruster
    if(!this.completed && !this.crashed){
      ctx.fillStyle="orange";
      ctx.beginPath(); ctx.moveTo(-5,0); ctx.lineTo(-10,2); ctx.lineTo(-10,-2); ctx.closePath(); ctx.fill();
    }

    ctx.fillStyle=this.completed?"gold":this.crashed?"#555":"#00ffff";
    ctx.beginPath(); ctx.moveTo(10,0); ctx.lineTo(-5,3); ctx.lineTo(-5,-3); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
}

// ===== Explosion =====
class Explosion{constructor(x,y,color){this.x=x; this.y=y; this.radius=0; this.maxRadius=20; this.color=color;}
update(){this.radius+=1;} draw(){ctx.strokeStyle=this.color; ctx.globalAlpha=1-this.radius/this.maxRadius;
ctx.beginPath(); ctx.arc(this.x,this.y,this.radius,0,Math.PI*2); ctx.stroke(); ctx.globalAlpha=1;}}

// ===== Init =====
function init(){rockets=[]; for(let i=0;i<params.population;i++) rockets.push(new Rocket()); generation=0; step=0; bestHistory=[]; successHistory=[];}
init();

// ===== Evolve =====
function evolve(){
  rockets.forEach(r=>r.calcFitness());
  rockets.sort((a,b)=>b.fitness-a.fitness);
  let best=rockets[0];
  let successCount=rockets.filter(r=>r.completed).length;
  let crashCount=rockets.filter(r=>r.crashed).length;
  let acquiredCount=rockets.reduce((sum,r)=>sum+r.targetIndex,0);

  generationEl.textContent=generation;
  successEl.textContent=successCount;
  crashEl.textContent=crashCount;
  acquiredEl.textContent=acquiredCount;

  bestHistory.push(best.fitness);
  successHistory.push(successCount/params.population);

  let pool=[];
  rockets.forEach(r=>{let n=r.fitness*10; for(let i=0;i<n;i++) pool.push(r);});
  if(pool.length===0) pool=[...rockets];
  //if(pool.length >= 1000000) pool=[];

  let newRockets=[new Rocket(best.dna)];
  for(let i=1;i<params.population;i++){
    let a=pool[Math.floor(Math.random()*pool.length)];
    let b=pool[Math.floor(Math.random()*pool.length)];
    let child=[];
    for(let j=0;j<params.lifespan;j++){
      child[j]=Math.random()<0.5?a.dna[j]:b.dna[j];
      if(Math.random()<params.mutationRate){let ang=Math.random()*Math.PI*2; child[j]={x:Math.cos(ang)*params.moveSpeed,y:Math.sin(ang)*params.moveSpeed};}
    }
    newRockets.push(new Rocket(child));
  }
  rockets=newRockets; generation++; step=0;
}

// ===== Loop =====
function drawGraph(){gctx.clearRect(0,0,200,100); let max=Math.max(...bestHistory,1); gctx.beginPath();
bestHistory.forEach((v,i)=>{let x=i*4,y=200-(v/max)*180; i===0?gctx.moveTo(x,y):gctx.lineTo(x,y);}); gctx.strokeStyle="lime"; gctx.stroke();}

let dragging=null, drawing=false;
function loop(){
  ctx.fillStyle="rgba(10,10,12,.25)"; ctx.fillRect(0,0,canvas.width,canvas.height);

    if(!paused){
    for(let s=0;s<params.stepSpeed;s++){
      rockets.forEach(r=>r.update());
      step++;
      if(step>=params.lifespan) evolve();
    }
  }
  //for(let s=0;s<params.stepSpeed;s++){rockets.forEach(r=>r.update()); step++; if(step>=params.lifespan) evolve();}
  rockets.forEach(r=>r.draw());

  // Draw sequential targets
  targets.forEach((t,i)=>{
    ctx.fillStyle=(rockets.some(r=>r.targetIndex===i)?"#ffff00":"#ff5555");
    ctx.beginPath(); ctx.arc(t.x,t.y,10,0,Math.PI*2); ctx.fill();
    ctx.fillStyle="#fff"; ctx.font="12px sans-serif"; ctx.fillText(i+1,t.x-4,t.y+4);
  });

  obstacles.forEach(o=>{ctx.fillStyle="#333"; ctx.fillRect(o.x,o.y,o.w,o.h);});
  explosions.forEach((ex,i)=>{ex.update(); ex.draw(); if(ex.radius>=ex.maxRadius) explosions.splice(i,1);});
  drawGraph();
  requestAnimationFrame(loop);
}
loop();

// ===== Controls =====
pop.addEventListener("input",()=>{params.population=+pop.value; popVal.textContent=pop.value;});
life.addEventListener("input",()=>{params.lifespan=+life.value; lifeVal.textContent=life.value;});
mutation.addEventListener("input",()=>{params.mutationRate=+mutation.value; mutVal.textContent=mutation.value;});
movespeed.addEventListener("input",()=>{params.moveSpeed=+movespeed.value; speedVal.textContent=movespeed.value;});
turn.addEventListener("input",()=>{params.turnSpeed=+turn.value; turnVal.textContent=turn.value;});
stepspeed.addEventListener("input",()=>{params.stepSpeed=+stepspeed.value; stepVal.textContent=stepspeed.value;});
learning.addEventListener("input",()=>{params.learningFactor=+learning.value; learnVal.textContent=learning.value;});

toggleUI.onclick=()=>{uiContent.classList.toggle("hidden");};
toggleViz.onclick=()=>{vizContent.classList.toggle("hidden");vizHeader.classList.toggle("hidden")};
restartBtn.onclick=()=>{init();};
// ===== Canvas Interactions =====
let longPressTimer = null;
let deleting = false;

// --- Helpers ---
function getTouchPos(e) {
  const touch = e.touches[0];
  return { x: touch.clientX, y: touch.clientY };
}

function deleteNearby(x, y) {
  obstacles = obstacles.filter(o => Math.hypot(o.x - x, o.y - y) > 15);
  targets   = targets.filter(t => Math.hypot(t.x - x, t.y - y) > 15);
}

// --- Mouse (desktop) ---
canvas.addEventListener("mousedown", e => {
  if (e.shiftKey) {
    targets.push({ x: e.clientX, y: e.clientY });
    return;
  }
  for (let t of targets) {
    if (Math.hypot(t.x - e.clientX, t.y - e.clientY) < 15) {
      dragging = t;
      return;
    }
  }
  drawing = true;
});

canvas.addEventListener("mousemove", e => {
  if (dragging) {
    dragging.x = e.clientX;
    dragging.y = e.clientY;
  } else if (drawing) {
    obstacles.push({ x: e.clientX, y: e.clientY, w: 8, h: 8 });
  }
});

canvas.addEventListener("mouseup", () => {
  dragging = null;
  drawing = false;
});

canvas.addEventListener("contextmenu", e => {
  e.preventDefault();
  deleteNearby(e.clientX, e.clientY);
});

// --- Touch (mobile) ---
canvas.addEventListener("touchstart", e => {
  const { x, y } = getTouchPos(e);

  // Long press detection for delete
  longPressTimer = setTimeout(() => {
    deleting = true;
    deleteNearby(x, y);
  }, 600);

  // Check if touching a target
  for (let t of targets) {
    if (Math.hypot(t.x - x, t.y - y) < 15) {
      dragging = t;
      return;
    }
  }

  // If not on target, just tap = add new target
  if (e.touches.length === 1 && e.targetTouches.length === 1) {
    targets.push({ x, y });
  }

  // If finger moves later, will start drawing obstacles
  drawing = true;
});

canvas.addEventListener("touchmove", e => {
  const { x, y } = getTouchPos(e);
  clearTimeout(longPressTimer);

  if (deleting) {
    deleteNearby(x, y); // drag while deleting
    return;
  }

  if (dragging) {
    dragging.x = x;
    dragging.y = y;
  } else if (drawing) {
    obstacles.push({ x, y, w: 8, h: 8 });
  }
});

canvas.addEventListener("touchend", () => {
  clearTimeout(longPressTimer);
  dragging = null;
  drawing = false;
  deleting = false;
});
