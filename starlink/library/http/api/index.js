import express from "express"
import fs from "fs"
import path from "path"

const app = express()
const PORT = process.env.PORT || 3000

app.use(express.json())
app.use(express.static(path.join(process.cwd(), 'paint')))

let latestState = { value: 0, timestamp: Date.now() }

app.get("/state", (req, res) => {
  res.json(latestState)
})

app.post("/paint/save", (req, res) => {
  const table = req.body
  if (!table) return res.status(400).send("No data")

  let lua = "{\n"
  for (let row in table) {
    lua += `  [${row}] = {\n`
    for (let col in table[row]) {
      lua += `    [${col}]="${table[row][col]}",\n`
    }
    lua += "  },\n"
  }
  lua += "}\n"

  fs.writeFileSync(path.join(process.cwd(), "paint", "latest.lua"), lua)
  res.send("Saved!")
})

app.get("/paint/load", (req, res) => {
  const filePath = path.join(process.cwd(), "paint", "latest.lua")
  if (!fs.existsSync(filePath)) return res.status(404).send("No save found")
  const data = fs.readFileSync(filePath, "utf-8")
  res.type("text/plain").send(data)
})

app.listen(PORT, () => console.log("server running on port " + PORT))
