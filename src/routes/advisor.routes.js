const express = require("express");

const {
    createAdvisorProfile,updateAdvisorProfile,getAllAdvisors,getAdvisorById
} = require("../controllers/advisor.controller");

const {
    getAdvisorReviews
} = require("../controllers/review.controller");

const {
    authenticate,
    authorize
} = require("../middlewares/auth.middleware");

const router = express.Router();

// advisors making their own profile
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

router.get(
    "/:id/reviews",
    getAdvisorReviews
);

module.exports = router;