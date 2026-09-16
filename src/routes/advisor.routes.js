const express = require("express");

const {
    createAdvisorProfile,updateAdvisorProfile,getAllAdvisors,getAdvisorById
} = require("../controllers/advisor.controller");

const {
    authenticate,
    authorize
} = require("../middlewares/auth.middleware");

const router = express.Router();

router.post(
    "/profile",
    authenticate,
    authorize("ADVISOR"),
    createAdvisorProfile
);

router.patch(
    "/profile",
    authenticate,
    authorize("ADVISOR"),
    updateAdvisorProfile
);

router.get(
    "/",
    getAllAdvisors
);

router.get(
    "/:id",
    getAdvisorById
);


module.exports = router;