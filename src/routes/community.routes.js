const express = require("express");

const {
    createPost,
    getPosts,
    getPostById,
    addComment,
    getComments,
    markPostHelpful,
    deletePost,
    deleteComment
} = require("../controllers/community.controller");

const {
    authenticate
} = require("../middlewares/auth.middleware");

const router = express.Router();

router.post(
    "/posts",
    authenticate,
    createPost
);

router.get(
    "/posts",
    getPosts
);

router.get(
    "/posts/:id",
    getPostById
);

router.post(
    "/posts/:id/comments",
    authenticate,
    addComment
);

router.get(
    "/posts/:id/comments",
    getComments
);

router.post(
    "/posts/:id/helpful",
    authenticate,
    markPostHelpful
);

router.delete(
    "/posts/:id",
    authenticate,
    deletePost
);

router.delete(
    "/comments/:id",
    authenticate,
    deleteComment
);

module.exports = router;
