import express from "express"
import dotenv from "dotenv"
import mongoose from "mongoose"
import userRouter from "./Routes/user.route.js"
import { authenticateUser } from "./Middlewares/authenticateUser.js"
import productRouter from "./Routes/product.routes.js"

dotenv.config()

const app = express()
app.use(express.json())

mongoose.connect(process.env.MONGO_URI)
.then((req, res) => {
    console.log("DB Connected")
}).catch(err => {
    console.log(err)
})

app.use("/api", userRouter)
app.use("/api", productRouter)

app.get("/api/test", authenticateUser, (req, res) => {
    console.log(req.user)
})

app.listen(process.env.PORT, () => {
    console.log("App is Running on Port " + process.env.PORT)
})