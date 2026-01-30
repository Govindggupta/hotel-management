import express from "express"
import authRouter from "./routes/auth.routes"
import hotelRouter from "./routes/hotel.routes";
import bookingRouter from "./routes/booking.routes"

const PORT = process.env.PORT
const app = express();

app.use(express.json())

app.use('/api/auth' ,authRouter)
app.use('/api/hotels' ,hotelRouter)
app.use('/api/bookings' ,bookingRouter)

app.listen(PORT, () =>{
    console.log(`connected to the ${PORT}`)
})