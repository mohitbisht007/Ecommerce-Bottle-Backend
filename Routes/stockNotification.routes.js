import express from "express";

import {
  createStockNotification,
} from "../Controllers/stockNotification.controller.js";

const router = express.Router();

router.post(
  "/",
  createStockNotification
);

export default router;