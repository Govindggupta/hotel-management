import express from "express"
import authRouter from "./routes/auth.routes"

const PORT = process.env.PORT
const app = express();

app.use(express.json())

app.use('/api/auth' ,authRouter)

app.listen(PORT, () =>{
    console.log(`connected to the ${PORT}`)
})