const canvas = document.getElementById("canvas")
const ctx = canvas.getContext("2d")
const scale = 8
const size = 64
let currentColor = "#FF0000FF"

// create 64x64 pixel grid
let pixels = Array.from({length:size}, () => Array(size).fill("#FFFFFFFF"))

// draw grid on canvas
function drawCanvas() {
  for (let y=0;y<size;y++){
    for (let x=0;x<size;x++){
      ctx.fillStyle = pixels[y][x]
      ctx.fillRect(x*scale, y*scale, scale, scale)
    }
  }
}
drawCanvas()

// mouse drawing
let drawing = false
canvas.addEventListener("mousedown", e => drawing = true)
canvas.addEventListener("mouseup", e => drawing = false)
canvas.addEventListener("mouseleave", e => drawing = false)
canvas.addEventListener("mousemove", e => {
  if (!drawing) return
  const rect = canvas.getBoundingClientRect()
  const x = Math.floor((e.clientX - rect.left)/scale)
  const y = Math.floor((e.clientY - rect.top)/scale)
  if(x>=0 && y>=0 && x<size && y<size){
    pixels[y][x] = currentColor
    drawCanvas()
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

// save function
document.getElementById("save").addEventListener("click",async ()=>{
  let table={}
  for(let y=0;y<size;y++){
    table[y+1]={}
    for(let x=0;x<size;x++){
      table[y+1][x+1]=pixels[y][x]
    }
  }
  await fetch("/paint/save", {
    method:"POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify(table)
  })
  alert("Saved!")
})

// load function
document.getElementById("load").addEventListener("click", async ()=>{
  const res = await fetch("/paint/load")
  if(!res.ok){ alert("No save found"); return }
  const table = await res.json()
  for(let y in table){
    for(let x in table[y]){
      pixels[y-1][x-1] = table[y][x]
    }
  }
  drawCanvas()
  alert("Loaded!")
})
