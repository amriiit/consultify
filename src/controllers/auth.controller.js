const pool = require("../config/db");
const bcrypt = require("bcrypt");
async function registerUser(req, res) {
    const { name, email, password } = req.body;

    if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({
            message: "Name is required"
        });
    }

    if (typeof email !== "string" || !email.trim()) {
        return res.status(400).json({
            message: "Email is required"
        });
    }

    if (typeof password !== "string" || !password) {
        return res.status(400).json({
            message: "Password is required"
        });
    }

    const cleanName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (cleanName.length > 100) {
        return res.status(400).json({
            message: "Name must not exceed 100 characters"
        });
    }

    if (normalizedEmail.length > 255) {
        return res.status(400).json({
            message: "Email must not exceed 255 characters"
        });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(normalizedEmail)) {
        return res.status(400).json({
            message: "Invalid email format"
        });
    }

    if (password.length < 12) {
        return res.status(400).json({
            message: "Password must be at least 12 characters long"
        });
    }

    if (Buffer.byteLength(password, "utf8") > 72) {
        return res.status(400).json({
            message: "Password is too long"
        });
    }
    try{
        const existingUser=await pool.query(
            "SELECT id FROM users WHERE email=$1",
            [normalizedEmail]
        );
            if(existingUser.rows.length>0){
            return res.status(409).json({
                message:"Email is already registered"
            });
        }
        const passwordHash=await bcrypt.hash(password,12)
        const result=await pool.query(
            `INSERT INTO users (name,email,password_hash)
             VALUES ($1,$2,$3)
             RETURNING id,name,email,role,created_at`,
             [cleanName,normalizedEmail,passwordHash]
        )
        return res.status(201).json({
            message: "User registered successfully",
            user: result.rows[0]
        });
    }
    catch(error){
        console.error("Registration error:",error.message)
        if (error.code === "23505") {
            return res.status(409).json({
                message: "Email is already registered"
            });
        }
        return res.status(500).json({
            message:"Internal server error"
        });
    }
}

module.exports = {
    registerUser
};