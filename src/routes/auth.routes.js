const express=require("express")
const {registerUser,registerAdvisor,loginUser,getCurrentUser}=require("../controllers/auth.controller")
const {authenticate} = require("../middlewares/auth.middleware");
const router=express.Router()
router.post("/register",registerUser)
router.post("/register/advisor",registerAdvisor)
router.post("/login", loginUser);
router.get(
    "/me",
    authenticate,
    getCurrentUser
);

module.exports=router
