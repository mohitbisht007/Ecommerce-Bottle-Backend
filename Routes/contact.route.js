import express from "express";
import { contactUs } from "../Controllers/contact.controller.js";

const router = express.Router();

router.post("/contact", contactUs);

export default router;