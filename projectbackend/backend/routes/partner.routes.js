const express = require('express');
const router = express.Router();
const {
  createPost,
  getPosts,
  joinPost,
  deletePost
} = require('../controllers/partner.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

router.get('/', protect, getPosts);
router.post('/', protect, createPost);
router.put('/:id/join', protect, joinPost);
router.delete('/:id', protect, deletePost);

module.exports = router;