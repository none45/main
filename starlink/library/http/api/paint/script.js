const canvas = document.getElementById("canvas")
const ctx = canvas.getContext("2d")
const scale = 8
const size = 64
let currentColor = "#FF0000FF"

// main pixel table
let pixels = Array.from({length:size}, () => Array(size).fill("#FFFFFFFF"))

// draw the full canvas
function drawCanvas(){
  for(let y=0;y<size;y++){
    for(let x=0;x<size;x++){
      ctx.fillStyle = pixels[y][x]
      ctx.fillRect(x*scale, y*scale, scale, scale)
    }
  }
}
drawCanvas()

// track local changes while drawing
let drawing = false
let localChanges = {} // {row:{col:"#RRGGBBAA"}}

// mouse events
canvas.addEventListener("mousedown", e=>drawing=true)
canvas.addEventListener("mouseup", async e=>{
  drawing=false
  await pushChanges()
  localChanges={}
})
canvas.addEventListener("mouseleave", e=>drawing=false)
canvas.addEventListener("mousemove", e=>{
  if(!drawing) return
  const rect = canvas.getBoundingClientRect()
  const x = Math.floor((e.clientX - rect.left)/scale)
  const y = Math.floor((e.clientY - rect.top)/scale)
  if(x>=0 && y>=0 && x<size && y<size){
    pixels[y][x] = currentColor
    drawCanvas()
    if(!localChanges[y+1]) localChanges[y+1]={}
    localChanges[y+1][x+1]=currentColor
  }
})

// color palette
const paletteColors = ["#FF0000FF","#00FF00FF","#0000FFFF","#FFFFFFFF","#000000FF","#FFFF00FF"]
const paletteDiv = document.getElementById("palette")
paletteColors.forEach(c=>{
  const div = document.createElement("div")
  div.className="color"
  div.style.backgroundColor=c
  div.addEventListener("click",()=>currentColor=c)
  paletteDiv.appendChild(div)
})

// send only local changes to server
async function pushChanges(){
  if(Object.keys(localChanges).length===0) return
  try{
    await fetch("/paint/save",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify(localChanges)
    })
  }catch(e){ console.warn("Failed to push changes:", e) }
}

// auto-load from server for live sync
async function autoLoad(){
  if(drawing) return // pause while user draws
  try{
    const res = await fetch("/paint/load")
    if(!res.ok) return
    const table = await res.json()
    let changed=false
    for(let y in table){
      for(let x in table[y]){
        let newColor = table[y][x]
        if(pixels[y-1][x-1] !== newColor){
          pixels[y-1][x-1] = newColor
          changed=true
        }
      }
    }
    if(changed) drawCanvas()
  }catch(e){ console.warn("Auto-load failed:", e) }
}

// poll every 250ms
setInterval(autoLoad, 250)

// initial load on page open
autoLoad()
