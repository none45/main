const canvas = document.getElementById("canvas")
const ctx = canvas.getContext("2d")
const scale = 8
const size = 64
let currentColor = "#FF0000FF"

let pixels = Array.from({length:size}, () => Array(size).fill("#FFFFFFFF"))
drawCanvas()

function drawCanvas(){
  for(let y=0;y<size;y++){
    for(let x=0;x<size;x++){
      ctx.fillStyle = pixels[y][x]
      ctx.fillRect(x*scale, y*scale, scale, scale)
    }
  }
}

let drawing = false
let localChanges = {}
let loadInterval

// mouse events
canvas.addEventListener("mousedown", e=>{
  drawing = true
  clearInterval(loadInterval)
})

canvas.addEventListener("mouseup", async e=>{
  drawing = false
  await pushChanges()
  localChanges = {}
  startAutoLoad()
})

canvas.addEventListener("mouseleave", e=>{
  if(drawing){
    drawing = false
    pushChanges()
    localChanges = {}
    startAutoLoad()
  }
})

canvas.addEventListener("mousemove", e=>{
  if(!drawing) return
  const rect = canvas.getBoundingClientRect()
  const x = Math.floor((e.clientX - rect.left)/scale)
  const y = Math.floor((e.clientY - rect.top)/scale)
  if(x>=0 && y>=0 && x<size && y<size){
    pixels[y][x] = currentColor
    drawCanvas()
    if(!localChanges[y+1]) localChanges[y+1] = {}
    localChanges[y+1][x+1] = currentColor
  }
})

// color palette
const paletteColors = ["#FF0000FF","#00FF00FF","#0000FFFF","#FFFFFFFF","#000000FF","#FFFF00FF"]
const paletteDiv = document.getElementById("palette")
paletteColors.forEach(c=>{
  const div = document.createElement("div")
  div.className = "color"
  div.style.backgroundColor = c
  div.addEventListener("click", ()=>currentColor = c)
  paletteDiv.appendChild(div)
})

// push only local changes to server
async function pushChanges(){
  if(Object.keys(localChanges).length === 0) return
  try{
    await fetch("/paint/save", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify(localChanges)
    })
  }catch(e){ console.warn("Failed to push changes:", e) }
}

// auto-load function
async function autoLoad(){
  try{
    const res = await fetch("/paint/load")
    if(!res.ok) return
    const table = await res.json()
    let changed = false
    for(let y in table){
      for(let x in table[y]){
        let newColor = table[y][x]
        if(pixels[y-1][x-1] !== newColor){
          pixels[y-1][x-1] = newColor
          changed = true
        }
      }
    }
    if(changed) drawCanvas()
  }catch(e){ console.warn("Auto-load failed:", e) }
}

// start auto-load interval
function startAutoLoad(){
  loadInterval = setInterval(autoLoad, 250)
}

// initial load
autoLoad()
startAutoLoad()

// --- RESET CANVAS BUTTON ---
const resetBtn = document.getElementById("reset")
resetBtn.addEventListener("click", async ()=>{
  drawing = true
  clearInterval(loadInterval)
  localChanges = {}
  for(let y=0;y<size;y++){
    for(let x=0;x<size;x++){
      pixels[y][x] = "#FFFFFFFF"
      if(!localChanges[y+1]) localChanges[y+1]={}
      localChanges[y+1][x+1] = "#FFFFFFFF"
    }
  }
  drawCanvas()
  await pushChanges()
  localChanges = {}
  drawing = false
  startAutoLoad()
})
