const express = require("express");

const {
    createReview
} = require("../controllers/review.controller");

const {
    authenticate,
    authorize
} = require("../middlewares/auth.middleware");

const router = express.Router();

router.post(
    "/",
    authenticate,
    authorize("USER"),
    createReview
);

module.exports = router;