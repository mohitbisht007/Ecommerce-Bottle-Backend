import express from "express"
import { registerUser, loginUser, getMyProfile, updateMyProfile, addAddress, editAddress, removeAddress, googleLogin } from "../Controllers/user.controller.js"
import { authenticateUser } from "../Middlewares/authenticateUser.js"

const router = express.Router()

router.post("/register", registerUser)
router.post("/login", loginUser)
router.get("/me", authenticateUser, getMyProfile);
router.put("/update-profile", authenticateUser, updateMyProfile);
router.post("/google-login", googleLogin)

// Adress Routes

router.post("/add-address", authenticateUser, addAddress)
router.put('/edit-address/:addressId', authenticateUser, editAddress);
router.delete('/remove-address/:addressId', authenticateUser, removeAddress);

export default router
