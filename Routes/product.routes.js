import express from "express"
import { productList, getProductBySlug, getProductById, getCategories, createProduct, updateProduct, removeProduct, searchProduct } from "../Controllers/product.controller.js"
import { authorizeAdmin, authenticateUser } from "../Middlewares/authenticateUser.js"

const router = express.Router()

router.get("/products", productList)
router.get('/search', searchProduct)
router.get('/categories', getCategories);
router.get('/:slug', getProductBySlug)

//Admin Routes
router.post("/product/add", authenticateUser, authorizeAdmin, createProduct)
router.get("/product/:id", authenticateUser, authorizeAdmin, getProductById)
router.patch("/product/update/:id", authenticateUser, authorizeAdmin, updateProduct)
router.delete("/product/delete/:id", authenticateUser, authorizeAdmin, removeProduct)

export default router