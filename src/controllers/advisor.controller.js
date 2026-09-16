const pool = require("../config/db");

async function createAdvisorProfile(req, res) {
    const userID = req.user.userID;

    const {
        domain,
        bio,
        specialization,
        experienceYears,
        consultationFee
    } = req.body;

    // Basic validation
    if (
        !domain ||
        !bio ||
        !specialization ||
        experienceYears === undefined ||
        consultationFee === undefined
    ) {
        return res.status(400).json({
            message: "All advisor profile fields are required"
        });
    }

    // V1 supports Finance only
    if (domain !== "FINANCE") {
        return res.status(400).json({
            message: "Only FINANCE advisors are supported in V1"
        });
    }

    if (
        !Number.isInteger(experienceYears) ||
        experienceYears < 0
    ) {
        return res.status(400).json({
            message: "Experience years must be a non-negative integer"
        });
    }

    if (
        typeof consultationFee !== "number" ||
        consultationFee < 0
    ) {
        return res.status(400).json({
            message: "Consultation fee must be a non-negative number"
        });
    }

    try {
        const result = await pool.query(
            `
            INSERT INTO advisor_profiles (
                user_id,
                domain,
                bio,
                specialization,
                experience_years,
                consultation_fee
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING
                id,
                user_id,
                domain,
                bio,
                specialization,
                experience_years,
                consultation_fee,
                created_at,
                updated_at
            `,
            [
                userID,
                domain,
                bio.trim(),
                specialization.trim(),
                experienceYears,
                consultationFee
            ]
        );

        return res.status(201).json({
            message: "Advisor profile created successfully",
            advisorProfile: result.rows[0]
        });

    } catch (error) {
        console.error("Create advisor profile error:", error.message);

        if (error.code === "23505") {
            return res.status(409).json({
                message: "Advisor profile already exists"
            });
        }

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}


async function updateAdvisorProfile(req, res) {
    const userID = req.user.userID;

    const {
        bio,
        specialization,
        experienceYears,
        consultationFee
    } = req.body;

    if (
        experienceYears !== undefined &&
        (!Number.isInteger(experienceYears) || experienceYears < 0)
    ) {
        return res.status(400).json({
            message: "Experience years must be a non-negative integer"
        });
    }

    if (
        consultationFee !== undefined &&
        (typeof consultationFee !== "number" || consultationFee < 0)
    ) {
        return res.status(400).json({
            message: "Consultation fee must be a non-negative number"
        });
    }

    try {
        const result = await pool.query(
            `
            UPDATE advisor_profiles
            SET
                bio = COALESCE($1, bio),
                specialization = COALESCE($2, specialization),
                experience_years = COALESCE($3, experience_years),
                consultation_fee = COALESCE($4, consultation_fee),
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = $5
            RETURNING
                id,
                user_id,
                domain,
                bio,
                specialization,
                experience_years,
                consultation_fee,
                created_at,
                updated_at
            `,
            [
                bio,
                specialization,
                experienceYears,
                consultationFee,
                userID
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Advisor profile not found"
            });
        }

        return res.status(200).json({
            message: "Advisor profile updated successfully",
            advisorProfile: result.rows[0]
        });

    } catch (error) {
        console.error("Update advisor profile error:", error.message);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}


async function getAllAdvisors(req, res) {
    const domain = req.query.domain
        ? req.query.domain.toUpperCase()
        : null;

    const search = req.query.search
        ? req.query.search.trim()
        : null;

    const allowedDomains = ["FINANCE", "HEALTH", "ASTROLOGY"];

    if (domain && !allowedDomains.includes(domain)) {
        return res.status(400).json({
            message: "Invalid advisor domain"
        });
    }

    try {
        const searchPattern = search
            ? `%${search}%`
            : null;

        const result = await pool.query(
            `
            SELECT
                ap.id,
                u.name,
                ap.domain,
                ap.bio,
                ap.specialization,
                ap.experience_years,
                ap.consultation_fee,
                ap.created_at,
                ap.updated_at
            FROM advisor_profiles ap
            JOIN users u
                ON ap.user_id = u.id
            WHERE
                ($1::text IS NULL OR ap.domain = $1)
            AND
                (
                    $2::text IS NULL
                    OR u.name ILIKE $2
                    OR ap.specialization ILIKE $2
                    OR ap.bio ILIKE $2
                )
            ORDER BY ap.created_at DESC
            `,
            [domain, searchPattern]
        );

        return res.status(200).json({
            advisors: result.rows
        });

    } catch (error) {
        console.error("Get advisors error:", error.message);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}



async function getAdvisorById(req, res) {
    const { id } = req.params;

    try {
        const result = await pool.query(
            `
            SELECT
                ap.id,
                u.name,
                ap.domain,
                ap.bio,
                ap.specialization,
                ap.experience_years,
                ap.consultation_fee,
                ap.created_at,
                ap.updated_at
            FROM advisor_profiles ap
            JOIN users u
                ON ap.user_id = u.id
            WHERE ap.id = $1
            `,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Advisor not found"
            });
        }

        return res.status(200).json({
            advisor: result.rows[0]
        });

    } catch (error) {
        console.error("Get advisor error:", error.message);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}


module.exports = {
    createAdvisorProfile,
    updateAdvisorProfile,
    getAllAdvisors,
    getAdvisorById
};