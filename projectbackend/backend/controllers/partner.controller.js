const PartnerPost = require('../models/PartnerPost');

// @desc    Create a new partner recruitment post
// @route   POST /api/partners
// @access  Member only
const createPost = async (req, res) => {
  console.log('--- PARTNER CREATE REQUEST RECEIVED ---');
  console.log('Body:', req.body);
  console.log('User:', req.user._id, req.user.role);
  
  const { sport, facility, date, time, description, maxPlayers } = req.body;

  try {
    const post = await PartnerPost.create({
      creator: req.user._id,
      sport,
      facility,
      date,
      time,
      description,
      maxPlayers,
      joinedPlayers: [req.user._id] // Creator is joined by default
    });

    res.status(201).json(post);
  } catch (err) {
    console.error('Create Post Error:', err);
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get all open recruitment posts
// @route   GET /api/partners
// @access  Authenticated users
const getPosts = async (req, res) => {
  try {
    const posts = await PartnerPost.find({ status: 'open' })
      .populate('creator', 'name email')
      .populate('facility', 'name type')
      .populate('joinedPlayers', 'name')
      .sort({ date: 1 });

    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Join a recruitment post
// @route   PUT /api/partners/:id/join
// @access  Member only
const joinPost = async (req, res) => {
  try {
    const post = await PartnerPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    if (post.status !== 'open') {
      return res.status(400).json({ message: 'This post is no longer accepting players' });
    }

    if (post.joinedPlayers.includes(req.user._id)) {
      return res.status(400).json({ message: 'You have already joined this post' });
    }

    if (post.joinedPlayers.length >= post.maxPlayers) {
      return res.status(400).json({ message: 'This game is already full' });
    }

    post.joinedPlayers.push(req.user._id);
    
    if (post.joinedPlayers.length === post.maxPlayers) {
      post.status = 'full';
    }

    await post.save();
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Cancel/Delete a post
// @route   DELETE /api/partners/:id
// @access  Creator only
const deletePost = async (req, res) => {
  try {
    const post = await PartnerPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    if (post.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await post.deleteOne();
    res.json({ message: 'Post removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createPost,
  getPosts,
  joinPost,
  deletePost
};