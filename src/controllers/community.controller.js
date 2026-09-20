const pool = require("../config/db");

async function createPost(req, res) {
    const userID = req.user.userID;

    let { domain, title, content } = req.body;

    if (!domain || !title || !content) {
        return res.status(400).json({
            message: "Domain, title and content are required"
        });
    }

    domain = domain.trim().toUpperCase();
    title = title.trim();
    content = content.trim();

    if (!title || !content) {
        return res.status(400).json({
            message: "Title and content cannot be empty"
        });
    }

    if (domain !== "FINANCE") {
        return res.status(400).json({
            message: "Only FINANCE community is available in V1"
        });
    }

    try {
        const result = await pool.query(
            `
            INSERT INTO community_posts (
                user_id,
                domain,
                title,
                content
            )
            VALUES ($1, $2, $3, $4)
            RETURNING
                id,
                user_id,
                domain,
                title,
                content,
                created_at,
                updated_at
            `,
            [
                userID,
                domain,
                title,
                content
            ]
        );

        return res.status(201).json({
            message: "Post created successfully",
            post: result.rows[0]
        });

    } catch (error) {
        console.error("Create community post error:", error.message);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}

async function getPosts(req, res) {
    let { domain, search } = req.query;

    try {
        let normalizedDomain = null;
        let normalizedSearch = null;

        if (domain) {
            normalizedDomain = domain.trim().toUpperCase();

            if (normalizedDomain !== "FINANCE") {
                return res.status(400).json({
                    message: "Only FINANCE community is available in V1"
                });
            }
        }

        if (search) {
            normalizedSearch = search.trim();

            if (!normalizedSearch) {
                normalizedSearch = null;
            }
        }

        const result = await pool.query(
            `
            SELECT
                cp.id,
                cp.domain,
                cp.title,
                cp.content,
                cp.created_at,
                cp.updated_at,

                u.id AS author_id,
                u.name AS author_name,

                (
                    SELECT COUNT(*)
                    FROM comments c
                    WHERE c.post_id = cp.id
                ) AS comment_count,

                (
                    SELECT COUNT(*)
                    FROM post_helpful ph
                    WHERE ph.post_id = cp.id
                ) AS helpful_count

            FROM community_posts cp

            JOIN users u
                ON cp.user_id = u.id

            WHERE
                ($1::TEXT IS NULL OR cp.domain = $1)

                AND

                (
                    $2::TEXT IS NULL
                    OR cp.title ILIKE '%' || $2 || '%'
                    OR cp.content ILIKE '%' || $2 || '%'
                )

            ORDER BY cp.created_at DESC
            `,
            [
                normalizedDomain,
                normalizedSearch
            ]
        );

        return res.status(200).json({
            posts: result.rows
        });

    } catch (error) {
        console.error("Get community posts error:", error.message);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}

async function getPostById(req, res) {
    const postID = req.params.id;

    try {
        const result = await pool.query(
            `
            SELECT
                cp.id,
                cp.domain,
                cp.title,
                cp.content,
                cp.created_at,
                cp.updated_at,

                u.id AS author_id,
                u.name AS author_name,

                (
                    SELECT COUNT(*)
                    FROM comments c
                    WHERE c.post_id = cp.id
                ) AS comment_count,

                (
                    SELECT COUNT(*)
                    FROM post_helpful ph
                    WHERE ph.post_id = cp.id
                ) AS helpful_count

            FROM community_posts cp

            JOIN users u
                ON cp.user_id = u.id

            WHERE cp.id = $1
            `,
            [postID]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Post not found"
            });
        }

        return res.status(200).json({
            post: result.rows[0]
        });

    } catch (error) {
        console.error("Get community post error:", error.message);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}

async function addComment(req, res) {
    const userID = req.user.userID;
    const postID = req.params.id;
    let { content } = req.body;

    if (!content) {
        return res.status(400).json({
            message: "Comment content is required"
        });
    }

    content = content.trim();

    if (!content) {
        return res.status(400).json({
            message: "Comment cannot be empty"
        });
    }

    try {
        const postResult = await pool.query(
            `
            SELECT id
            FROM community_posts
            WHERE id = $1
            `,
            [postID]
        );

        if (postResult.rows.length === 0) {
            return res.status(404).json({
                message: "Post not found"
            });
        }

        const result = await pool.query(
            `
            INSERT INTO comments (
                post_id,
                user_id,
                content
            )
            VALUES ($1, $2, $3)
            RETURNING
                id,
                post_id,
                user_id,
                content,
                created_at,
                updated_at
            `,
            [
                postID,
                userID,
                content
            ]
        );

        return res.status(201).json({
            message: "Comment added successfully",
            comment: result.rows[0]
        });

    } catch (error) {
        console.error("Add comment error:", error.message);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}

async function getComments(req, res) {
    const postID = req.params.id;

    try {
        const postResult = await pool.query(
            `
            SELECT id
            FROM community_posts
            WHERE id = $1
            `,
            [postID]
        );

        if (postResult.rows.length === 0) {
            return res.status(404).json({
                message: "Post not found"
            });
        }

        const result = await pool.query(
            `
            SELECT
                c.id,
                c.post_id,
                c.content,
                c.created_at,
                c.updated_at,
                u.id AS author_id,
                u.name AS author_name
            FROM comments c
            JOIN users u
                ON c.user_id = u.id
            WHERE c.post_id = $1
            ORDER BY c.created_at ASC
            `,
            [postID]
        );

        return res.status(200).json({
            comments: result.rows
        });

    } catch (error) {
        console.error("Get comments error:", error.message);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}

async function markPostHelpful(req, res) {
    const userID = req.user.userID;
    const postID = req.params.id;

    try {
        const postResult = await pool.query(
            `
            SELECT id
            FROM community_posts
            WHERE id = $1
            `,
            [postID]
        );

        if (postResult.rows.length === 0) {
            return res.status(404).json({
                message: "Post not found"
            });
        }

        const result = await pool.query(
            `
            INSERT INTO post_helpful (
                post_id,
                user_id
            )
            VALUES ($1, $2)
            ON CONFLICT (post_id, user_id)
            DO NOTHING
            RETURNING
                post_id,
                user_id,
                created_at
            `,
            [postID, userID]
        );

        if (result.rows.length === 0) {
            return res.status(409).json({
                message: "Post already marked as helpful"
            });
        }

        return res.status(201).json({
            message: "Post marked as helpful",
            helpful: result.rows[0]
        });

    } catch (error) {
        console.error("Mark post helpful error:", error.message);

        if (error.code === "22P02") {
            return res.status(400).json({
                message: "Invalid post ID"
            });
        }

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}

async function deletePost(req, res) {
    const userID = req.user.userID;
    const postID = req.params.id;

    try {
        const result = await pool.query(
            `
            DELETE FROM community_posts
            WHERE id = $1
              AND user_id = $2
            RETURNING id
            `,
            [postID, userID]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Post not found"
            });
        }

        return res.status(200).json({
            message: "Post deleted successfully"
        });

    } catch (error) {
        console.error("Delete community post error:", error.message);

        if (error.code === "22P02") {
            return res.status(400).json({
                message: "Invalid post ID"
            });
        }

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}

async function deleteComment(req, res) {
    const userID = req.user.userID;
    const commentID = req.params.id;

    try {
        const result = await pool.query(
            `
            DELETE FROM comments
            WHERE id = $1
              AND user_id = $2
            RETURNING id
            `,
            [commentID, userID]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Comment not found"
            });
        }

        return res.status(200).json({
            message: "Comment deleted successfully"
        });

    } catch (error) {
        console.error("Delete comment error:", error.message);

        if (error.code === "22P02") {
            return res.status(400).json({
                message: "Invalid comment ID"
            });
        }

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}

module.exports = {
    createPost,
    getPosts,
    getPostById,
    addComment,
    getComments,
    markPostHelpful,
    deletePost,
    deleteComment
};
