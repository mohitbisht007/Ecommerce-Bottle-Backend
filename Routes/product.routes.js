import express from "express"
import { productList, getProductBySlug, getProductById, createProduct, updateProduct, removeProduct, searchProduct } from "../Controllers/product.controller.js"

const router = express.Router()

router.get("/products", productList)
router.get('/search', searchProduct)
router.get('/:slug', getProductBySlug)

//Admin Routes
router.post("/product/add", createProduct)
router.get("/product/:id", getProductById)
router.patch("/product/update/:id", updateProduct)
router.delete("/product/delete/:id", removeProduct)

export default router