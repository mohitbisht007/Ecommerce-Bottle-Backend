import { addReview, getProductReviews } from "../Controllers/reveiws.contorller.js";
import { authenticateUser } from "../Middlewares/authenticateUser.js";
import express from "express"

const router = express.Router()

router.get('/reviews/:productId', getProductReviews);
router.post('/reviews', authenticateUser, addReview);

export default router