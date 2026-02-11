import express from "express"
import fs from "fs"
import path from "path"

const app = express()
const PORT = process.env.PORT || 3000

app.use(express.json())
app.use('/paint', express.static(path.join(process.cwd(), 'paint')))

let latestState = { value: 0, timestamp: Date.now() }

app.get("/state", (req, res) => {
  res.json(latestState)
})

// Save canvas as JSON
app.post("/paint/save", (req, res) => {
  const table = req.body
  if (!table) return res.status(400).send("No data")
  const json = JSON.stringify(table, null, 2) // pretty print
  fs.writeFileSync(path.join(process.cwd(), "paint", "latest.json"), json)
  res.send("Saved as JSON!")
})

// Load JSON table
app.get("/paint/load", (req, res) => {
  const filePath = path.join(process.cwd(), "paint", "latest.json")
  if (!fs.existsSync(filePath)) return res.status(404).send("No save found")
  const data = fs.readFileSync(filePath, "utf-8")
  res.type("application/json").send(data)
})

app.listen(PORT, () => console.log("server running on port " + PORT))
