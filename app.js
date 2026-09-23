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
import { createOrder, verifyPayment } from "./Controllers/orders.controller.js"
import categoryRoutes from "./Routes/category.routes.js"
import contactRoutes from "./Routes/contact.route.js"
import helmet from "helmet"
import { getShiprocketToken } from "./utils/shiprocket.js"

const app = express()
app.use(helmet());

dotenv.config()

app.use(cors({
  origin: ["https://bouncybucket.com", "https://www.bouncybucket.com", "http://localhost:3000"],
  credentials: true,
}));

app.use(express.json())

mongoose.connect(process.env.MONGO_URI)
.then((req, res) => {
    console.log("DB Connected")
}).catch(err => {
    console.log(err)
})

app.get("/health", (req, res) => {
  res.status(200).send("Server is healthy");
});

app.get("/api/shiprocket/test", async (req, res) => {
  try {
    const token = await getShiprocketToken();

    res.status(200).json({
      success: true,
      message: "Shiprocket authentication successful",
      tokenReceived: !!token,
    });
  } catch (error) {
    console.error("Shiprocket test failed:", error.message);

    res.status(500).json({
      success: false,
      message: "Shiprocket authentication failed",
      error: error.message,
    });
  }
});

app.use("/api/orders", orderRoute)
app.post("/api/create-order", createOrder)
app.post("/api/verify-payment", verifyPayment)
app.use("/api", categoryRoutes);

app.use("/api", userRouter)
app.use("/api", productRouter)
app.use("/api", reveiwsRoute)
app.use("/api", storefrontRoute)
app.use("/api", contactRoutes);

app.get("/api/test", authenticateUser, (req, res) => {
    console.log(req.user)
})

app.listen(process.env.PORT, () => {
    console.log("App is Running on Port " + process.env.PORT)
})