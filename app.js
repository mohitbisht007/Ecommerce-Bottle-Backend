import express from "express"
import dotenv from "dotenv"
import mongoose from "mongoose"
import userRouter from "./Routes/user.route.js"
import { authenticateUser } from "./Middlewares/authenticateUser.js"
import productRouter from "./Routes/product.routes.js"
import cors from "cors"
import reveiwsRoute from "./Routes/reveiws.routes.js"
import storefrontRoute from "./Routes/storefront.routes.js"
import orderRoute from "./Routes/orders.routes.js"
import categoryRoutes from "./Routes/category.routes.js"

const app = express()

dotenv.config()

app.use(cors({
    origin: "http://localhost:3000", // for development (allows all origins)
    credentials: true,
  }))

app.use(express.json())

mongoose.connect(process.env.MONGO_URI)
.then((req, res) => {
    console.log("DB Connected")
}).catch(err => {
    console.log(err)
})

app.use("/api/orders", orderRoute)
app.use("/api", categoryRoutes);

app.use("/api", userRouter)
app.use("/api", productRouter)
app.use("/api", reveiwsRoute)
app.use("/api", storefrontRoute)

app.get("/api/test", authenticateUser, (req, res) => {
    console.log(req.user)
})

app.listen(process.env.PORT, () => {
    console.log("App is Running on Port " + process.env.PORT)
})