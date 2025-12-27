import { listReviews, createReview } from "../Controllers/reveiws.contorller.js";
import express from "express"

const router = express.Router()

router.get('/', listReviews);
router.post('/', createReview);

export default router