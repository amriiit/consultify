const pool = require("../config/db");

async function bookAppointment(req, res) {
    const userID = req.user.userID;

    const {
        advisorId,
        scheduledAt,
        notes
    } = req.body;

    if (!advisorId || !scheduledAt) {
        return res.status(400).json({
            message: "Advisor and scheduled time are required"
        });
    }

    try {
        // Make sure advisor actually exists
        const advisorResult = await pool.query(
            `
            SELECT id
            FROM advisor_profiles
            WHERE id = $1
            `,
            [advisorId]
        );

        if (advisorResult.rows.length === 0) {
            return res.status(404).json({
                message: "Advisor not found"
            });
        }

        const result = await pool.query(
            `
            INSERT INTO appointments (
                user_id,
                advisor_id,
                scheduled_at,
                notes
            )
            VALUES ($1, $2, $3, $4)
            RETURNING
                id,
                user_id,
                advisor_id,
                scheduled_at,
                status,
                notes,
                created_at,
                updated_at
            `,
            [
                userID,
                advisorId,
                scheduledAt,
                notes || null
            ]
        );

        return res.status(201).json({
            message: "Appointment booked successfully",
            appointment: result.rows[0]
        });

    } catch (error) {
        console.error("Book appointment error:", error.message);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}


async function getUserAppointments(req, res) {
    const userID = req.user.userID;

    try {
        const result = await pool.query(
            `
            SELECT
                a.id,
                a.scheduled_at,
                a.status,
                a.notes,
                a.created_at,
                ap.id AS advisor_id,
                u.name AS advisor_name,
                ap.domain,
                ap.specialization,
                ap.consultation_fee
            FROM appointments a
            JOIN advisor_profiles ap
                ON a.advisor_id = ap.id
            JOIN users u
                ON ap.user_id = u.id
            WHERE a.user_id = $1
            ORDER BY a.scheduled_at DESC
            `,
            [userID]
        );

        return res.status(200).json({
            appointments: result.rows
        });

    } catch (error) {
        console.error("Get user appointments error:", error.message);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}

async function getAdvisorAppointments(req, res) {
    const userID = req.user.userID;

    try {
        const result = await pool.query(
            `
            SELECT
                a.id,
                a.scheduled_at,
                a.status,
                a.notes,
                a.created_at,
                u.id AS user_id,
                u.name AS user_name
            FROM appointments a
            JOIN advisor_profiles ap
                ON a.advisor_id = ap.id
            JOIN users u
                ON a.user_id = u.id
            WHERE ap.user_id = $1
            ORDER BY a.scheduled_at DESC
            `,
            [userID]
        );

        return res.status(200).json({
            appointments: result.rows
        });

    } catch (error) {
        console.error("Get advisor appointments error:", error.message);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}

async function cancelAppointment(req, res) {
    const userID = req.user.userID;
    const appointmentID = req.params.id;

    try {
        const result = await pool.query(
            `
            UPDATE appointments
            SET
                status = 'CANCELLED',
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
              AND user_id = $2
              AND status IN ('PENDING', 'CONFIRMED')
            RETURNING *
            `,
            [appointmentID, userID]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Appointment not found or cannot be cancelled"
            });
        }

        return res.status(200).json({
            message: "Appointment cancelled successfully",
            appointment: result.rows[0]
        });

    } catch (error) {
        console.error("Cancel appointment error:", error.message);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}

async function updateAppointmentStatus(req, res) {
    const userID = req.user.userID;
    const appointmentID = req.params.id;
    const { status } = req.body;

    const allowedStatuses = ["CONFIRMED", "COMPLETED"];

    if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
            message: "Status must be CONFIRMED or COMPLETED"
        });
    }

    try {
        const result = await pool.query(
            `
            UPDATE appointments a
            SET
                status = $1,
                updated_at = CURRENT_TIMESTAMP
            FROM advisor_profiles ap
            WHERE a.id = $2
              AND a.advisor_id = ap.id
              AND ap.user_id = $3
              AND a.status != 'CANCELLED'
            RETURNING a.*
            `,
            [status, appointmentID, userID]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Appointment not found or status cannot be updated"
            });
        }

        return res.status(200).json({
            message: "Appointment status updated successfully",
            appointment: result.rows[0]
        });

    } catch (error) {
        console.error("Update appointment status error:", error.message);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}

module.exports = {
    bookAppointment,
    getUserAppointments,
    getAdvisorAppointments,
    updateAppointmentStatus
};