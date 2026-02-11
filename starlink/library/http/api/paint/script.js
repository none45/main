const canvas = document.getElementById("canvas")
const ctx = canvas.getContext("2d")

const scale = 8
const size = 64
let currentColor = "#FF0000FF"

let pixels = Array.from({length:size},()=>Array(size).fill("#FFFFFFFF"))
let localChanges = {}
let drawing = false
let pushing = false

function drawPixel(x,y,color){
  ctx.fillStyle = color
  ctx.fillRect(x*scale,y*scale,scale,scale)
}

function drawCanvas(){
  for(let y=0;y<size;y++){
    for(let x=0;x<size;x++){
      drawPixel(x,y,pixels[y][x])
    }
  }
}

drawCanvas()

// ---------------- DRAWING ----------------

canvas.addEventListener("mousedown",()=>{
  drawing = true
})

canvas.addEventListener("mouseup",()=>{
  drawing = false
  forcePush()
})

canvas.addEventListener("mouseleave",()=>{
  if(drawing){
    drawing = false
    forcePush()
  }
})

canvas.addEventListener("mousemove",e=>{
  if(!drawing) return
  const rect = canvas.getBoundingClientRect()
  const x = Math.floor((e.clientX-rect.left)/scale)
  const y = Math.floor((e.clientY-rect.top)/scale)

  if(x<0||y<0||x>=size||y>=size) return

  if(pixels[y][x]===currentColor) return

  pixels[y][x]=currentColor
  drawPixel(x,y,currentColor)

  if(!localChanges[y+1]) localChanges[y+1]={}
  localChanges[y+1][x+1]=currentColor
})

// ---------------- PALETTE ----------------

const paletteColors=["#FF0000FF","#00FF00FF","#0000FFFF","#FFFFFFFF","#000000FF","#FFFF00FF"]
const paletteDiv=document.getElementById("palette")

paletteColors.forEach(c=>{
  const d=document.createElement("div")
  d.className="color"
  d.style.backgroundColor=c
  d.onclick=()=>currentColor=c
  paletteDiv.appendChild(d)
})

// ---------------- PUSH SYSTEM ----------------

async function pushChanges(){
  if(pushing) return
  if(Object.keys(localChanges).length===0) return

  pushing=true

  const payload = JSON.stringify(localChanges)
  localChanges={}

  try{
    await fetch("/paint/save",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:payload
    })
  }catch(e){
    console.warn("push failed, retrying")
    const failed=JSON.parse(payload)
    for(let y in failed){
      if(!localChanges[y]) localChanges[y]={}
      Object.assign(localChanges[y],failed[y])
    }
  }

  pushing=false
}

function forcePush(){
  pushChanges()
  setTimeout(pushChanges,150)
}

// push repeatedly while drawing (batched)
setInterval(()=>{
  if(drawing) pushChanges()
},300)

// ---------------- AUTO LOAD ----------------

async function autoLoad(){
  try{
    const res = await fetch("/paint/load")
    if(!res.ok) return
    const table = await res.json()

    for(let y in table){
      for(let x in table[y]){
        const yy = y-1
        const xx = x-1
        const serverColor = table[y][x]

        if(localChanges[y] && localChanges[y][x]) continue

        if(pixels[yy][xx]!==serverColor){
          pixels[yy][xx]=serverColor
          drawPixel(xx,yy,serverColor)
        }
      }
    }

  }catch(e){
    console.warn("autoload failed")
  }
}

setInterval(autoLoad,250)

// ---------------- RESET ----------------

document.getElementById("reset").onclick=()=>{
  for(let y=0;y<size;y++){
    for(let x=0;x<size;x++){
      pixels[y][x]="#FFFFFFFF"
      drawPixel(x,y,"#FFFFFFFF")
      if(!localChanges[y+1]) localChanges[y+1]={}
      localChanges[y+1][x+1]="#FFFFFFFF"
    }
  }
  forcePush()
}
