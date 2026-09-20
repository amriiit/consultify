const pool = require("../config/db");

async function createReview(req, res) {
    const userID = req.user.userID;

    let {
        appointmentId,
        rating,
        comment
    } = req.body;

    if (!appointmentId || rating === undefined) {
        return res.status(400).json({
            message: "Appointment ID and rating are required"
        });
    }

    rating = Number(rating);

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        return res.status(400).json({
            message: "Rating must be an integer between 1 and 5"
        });
    }

    if (comment !== undefined && comment !== null) {
        comment = comment.trim();

        if (!comment) {
            comment = null;
        }
    } else {
        comment = null;
    }

    try {
        const appointmentResult = await pool.query(
            `
            SELECT
                id,
                user_id,
                advisor_id,
                status
            FROM appointments
            WHERE id = $1
            `,
            [appointmentId]
        );

        if (appointmentResult.rows.length === 0) {
            return res.status(404).json({
                message: "Appointment not found"
            });
        }

        const appointment = appointmentResult.rows[0];

        if (appointment.user_id !== userID) {
            return res.status(403).json({
                message: "You cannot review this appointment"
            });
        }

        if (appointment.status !== "COMPLETED") {
            return res.status(400).json({
                message: "Only completed appointments can be reviewed"
            });
        }

        const existingReview = await pool.query(
            `
            SELECT id
            FROM reviews
            WHERE appointment_id = $1
            `,
            [appointmentId]
        );

        if (existingReview.rows.length > 0) {
            return res.status(409).json({
                message: "This appointment has already been reviewed"
            });
        }

        const result = await pool.query(
            `
            INSERT INTO reviews (
                appointment_id,
                rating,
                comment
            )
            VALUES ($1, $2, $3)
            RETURNING
                id,
                appointment_id,
                rating,
                comment,
                created_at,
                updated_at
            `,
            [
                appointmentId,
                rating,
                comment
            ]
        );

        return res.status(201).json({
            message: "Review created successfully",
            review: result.rows[0]
        });

    } catch (error) {
        if (error.code === "23505") {
            return res.status(409).json({
                message: "This appointment has already been reviewed"
            });
        }

        console.error("Create review error:", error.message);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}

async function getAdvisorReviews(req, res) {
    const advisorID = req.params.id;

    try {
        const advisorResult = await pool.query(
            `
            SELECT id
            FROM advisor_profiles
            WHERE id = $1
            `,
            [advisorID]
        );

        if (advisorResult.rows.length === 0) {
            return res.status(404).json({
                message: "Advisor not found"
            });
        }

        const reviewsResult = await pool.query(
            `
            SELECT
                r.id,
                r.rating,
                r.comment,
                r.created_at,
                r.updated_at,
                u.id AS reviewer_id,
                u.name AS reviewer_name

            FROM reviews r

            JOIN appointments a
                ON r.appointment_id = a.id

            JOIN users u
                ON a.user_id = u.id

            WHERE a.advisor_id = $1

            ORDER BY r.created_at DESC
            `,
            [advisorID]
        );

        const summaryResult = await pool.query(
            `
            SELECT
                COALESCE(AVG(r.rating), 0) AS average_rating,
                COUNT(*)::INT AS review_count

            FROM reviews r

            JOIN appointments a
                ON r.appointment_id = a.id

            WHERE a.advisor_id = $1
            `,
            [advisorID]
        );

        const summary = summaryResult.rows[0];

        return res.status(200).json({
            averageRating: Number(summary.average_rating),
            reviewCount: summary.review_count,
            reviews: reviewsResult.rows
        });

    } catch (error) {
        console.error("Get advisor reviews error:", error.message);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}

module.exports = {
    createReview,
    getAdvisorReviews
};