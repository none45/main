import express from "express"

const app = express()
const PORT = process.env.PORT || 3000

let latestState = {
    value: 0,
    timestamp: Date.now()
}

setInterval(() => {
    latestState = {
        value: Math.random(),
        timestamp: Date.now()
    }
}, 100)

app.get("/state", (req, res) => {
    res.json(latestState)
})

app.listen(PORT, () => {
    console.log("server running on port " + PORT)
})
