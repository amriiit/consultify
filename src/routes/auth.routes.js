const express=require("express")
const {registerUser,loginUser,getCurrentUser}=require("../controllers/auth.controller")
const router=express.Router()
router.post("/register",registerUser)
router.post("/login", loginUser);
router.get(
    "/me",
    authenticate,
    getCurrentUser
);

module.exports=router
