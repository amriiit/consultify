const express = require("express");

const {
    bookAppointment,
    getUserAppointments
} = require("../controllers/appointment.controller");

const {
    authenticate,
    authorize
} = require("../middlewares/auth.middleware");

const router = express.Router();

router.post(
    "/",
    authenticate,
    authorize("USER"),
    bookAppointment
);

router.get(
    "/user",
    authenticate,
    authorize("USER"),
    getUserAppointments
);

router.get(
    "/advisor",
    authenticate,
    authorize("ADVISOR"),
    getAdvisorAppointments
);

router.patch(
    "/:id/cancel",
    authenticate,
    authorize("USER"),
    cancelAppointment
);

router.patch(
    "/:id/status",
    authenticate,
    authorize("ADVISOR"),
    updateAppointmentStatus
);


module.exports = router;