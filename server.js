// ==============================
// Playlist + Tracks + Playback API (One File)
// Node.js + Express + MongoDB Atlas
// ==============================

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');

const app = express();
const PORT = process.env.PORT || 3000;

// ====== Middleware ======
app.use(cors());
app.use(express.json());

// Docs Route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ====== Mongoose Schemas & Models ======H

// Track Schema
const TrackSchema = new mongoose.Schema({
  title: { type: String, required: true },
  artist: String,
  album: String,
  duration: Number, // in seconds
  metadata: Object,
  createdAt: { type: Date, default: Date.now }
});
const Track = mongoose.model('Track', TrackSchema);

// Playlist Schema
const PlaylistSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tracks: [
    {
      trackId: { type: mongoose.Schema.Types.ObjectId, ref: 'Track' },
      order: Number,
      addedAt: { type: Date, default: Date.now }
    }
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
const Playlist = mongoose.model('Playlist', PlaylistSchema);

// Playback Schema
const PlaybackSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  trackId: { type: mongoose.Schema.Types.ObjectId, ref: 'Track' },
  position: Number, // current playback position in seconds
  isPlaying: { type: Boolean, default: true },
  startedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
const Playback = mongoose.model('Playback', PlaybackSchema);

// ====== Routes ======

// Root
app.get('/', (req, res) => res.send('✅ Playlist API is running!'));

// ==============================
// PLAYLIST ROUTES
// ==============================

/**
 * @swagger
 * tags:
 *   name: Playlists
 *   description: Playlist management
 */

/**
 * @swagger
 * /api/v1/playlists:
 *   get:
 *     summary: Get all playlists (optionally filter by userId)
 *     tags: [Playlists]
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter playlists by user ID
 *     responses:
 *       200:
 *         description: List of playlists
 *         content:
 *           application/json:
 *             example:
 *               - _id: "64f123abc456def789012345"
 *                 name: "My Playlist"
 *                 description: "Favorite songs"
 *                 userId: "64f123abc456def789012345"
 *                 tracks: []
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             example:
 *               message: "Server error"
 */

// GET all playlists (optionally by user)
app.get('/api/v1/playlists', async (req, res) => {
  try {
    const filter = req.query.userId ? { userId: req.query.userId } : {};
    const playlists = await Playlist.find(filter).populate('tracks.trackId');
    res.json(playlists);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * /api/v1/playlists/{id}:
 *   get:
 *     summary: Get one playlist by ID
 *     tags: [Playlists]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Playlist ID
 *     responses:
 *       200:
 *         description: Playlist data
 *         content:
 *           application/json:
 *             example:
 *               _id: "64f123abc456def789012345"
 *               name: "My Playlist"
 *               description: "Favorite songs"
 *               userId: "64f123abc456def789012345"
 *               tracks: []
 *       404:
 *         description: Playlist not found
 *         content:
 *           application/json:
 *             example:
 *               message: "Playlist not found"
 */

// GET one playlist by ID
app.get('/api/v1/playlists/:id', async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id).populate('tracks.trackId');
    if (!playlist) return res.status(404).json({ message: 'Playlist not found' });
    res.json(playlist);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * /api/v1/playlists:
 *   post:
 *     summary: Create a new playlist
 *     tags: [Playlists]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             name: "New Playlist"
 *             description: "My favorite tracks"
 *             userId: "64f123abc456def789012345"
 *     responses:
 *       201:
 *         description: Playlist created successfully
 *         content:
 *           application/json:
 *             example:
 *               _id: "64f123abc456def789012345"
 *               name: "New Playlist"
 *               description: "My favorite tracks"
 *               userId: "64f123abc456def789012345"
 *               tracks: []
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             example:
 *               message: "Playlist validation failed"
 */

// POST create new playlist
app.post('/api/v1/playlists', async (req, res) => {
  try {
    const playlist = new Playlist(req.body);
    await playlist.save();
    res.status(201).json(playlist);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/**
 * @swagger
 * /api/v1/playlists/{id}:
 *   put:
 *     summary: Update playlist details
 *     tags: [Playlists]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Playlist ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             name: "Updated Playlist"
 *             description: "Updated description"
 *     responses:
 *       200:
 *         description: Playlist updated successfully
 *         content:
 *           application/json:
 *             example:
 *               _id: "64f123abc456def789012345"
 *               name: "Updated Playlist"
 *               description: "Updated description"
 *               userId: "64f123abc456def789012345"
 *               tracks: []
 *       404:
 *         description: Playlist not found
 *         content:
 *           application/json:
 *             example:
 *               message: "Playlist not found"
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             example:
 *               message: "Invalid data"
 */

// PUT update playlist details
app.put('/api/v1/playlists/:id', async (req, res) => {
  try {
    const playlist = await Playlist.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!playlist) return res.status(404).json({ message: 'Playlist not found' });
    res.json(playlist);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/**
 * @swagger
 * /api/v1/playlists/{id}:
 *   delete:
 *     summary: Delete a playlist
 *     tags: [Playlists]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Playlist ID
 *     responses:
 *       200:
 *         description: Playlist deleted
 *         content:
 *           application/json:
 *             example:
 *               message: "Playlist deleted"
 *       404:
 *         description: Playlist not found
 *         content:
 *           application/json:
 *             example:
 *               message: "Playlist not found"
 */

// DELETE a playlist
app.delete('/api/v1/playlists/:id', async (req, res) => {
  try {
    const playlist = await Playlist.findByIdAndDelete(req.params.id);
    if (!playlist) return res.status(404).json({ message: 'Playlist not found' });
    res.json({ message: 'Playlist deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ==============================
// TRACK ROUTES (within playlists)
// ==============================

/**
 * @swagger
 * tags:
 *   name: Tracks
 *   description: Manage tracks within playlists
 */

/**
 * @swagger
 * /api/v1/playlists/{id}/tracks:
 *   get:
 *     summary: Get all tracks in a playlist
 *     tags: [Tracks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Playlist ID
 *     responses:
 *       200:
 *         description: List of tracks
 *         content:
 *           application/json:
 *             example:
 *               - trackId: "64f124abc456def789012345"
 *                 order: 1
 *                 addedAt: "2025-11-30T12:00:00.000Z"
 *       404:
 *         description: Playlist not found
 *         content:
 *           application/json:
 *             example:
 *               message: "Playlist not found"
 */

// GET all tracks in a playlist
app.get('/api/v1/playlists/:id/tracks', async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id).populate('tracks.trackId');
    if (!playlist) return res.status(404).json({ message: 'Playlist not found' });
    res.json(playlist.tracks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * /api/v1/playlists/{id}/tracks:
 *   post:
 *     summary: Add a new track to playlist
 *     tags: [Tracks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Playlist ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             title: "Song Title"
 *             artist: "Artist Name"
 *             album: "Album Name"
 *             duration: 240
 *     responses:
 *       201:
 *         description: Track added successfully
 *         content:
 *           application/json:
 *             example:
 *               _id: "64f124abc456def789012345"
 *               title: "Song Title"
 *               artist: "Artist Name"
 *               album: "Album Name"
 *               duration: 240
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             example:
 *               message: "Invalid track data"
 */

// POST add a new track to playlist
app.post('/api/v1/playlists/:id/tracks', async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) return res.status(404).json({ message: 'Playlist not found' });

    const newTrack = new Track(req.body);
    await newTrack.save();

    playlist.tracks.push({ trackId: newTrack._id, order: playlist.tracks.length + 1 });
    await playlist.save();

    res.status(201).json(newTrack);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/**
 * @swagger
 * /api/v1/playlists/{id}/tracks/{trackId}:
 *   put:
 *     summary: Update track details (order, metadata)
 *     tags: [Tracks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Playlist ID
 *       - in: path
 *         name: trackId
 *         required: true
 *         schema:
 *           type: string
 *         description: Track ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             order: 2
 *             metadata: { genre: "Rock" }
 *     responses:
 *       200:
 *         description: Track updated successfully
 *         content:
 *           application/json:
 *             example:
 *               trackId: "64f124abc456def789012345"
 *               order: 2
 *               metadata: { genre: "Rock" }
 *       404:
 *         description: Playlist or Track not found
 *         content:
 *           application/json:
 *             example:
 *               message: "Track not found in playlist"
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             example:
 *               message: "Invalid track data"
 */

// PUT update track details (order, metadata)
app.put('/api/v1/playlists/:id/tracks/:trackId', async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) return res.status(404).json({ message: 'Playlist not found' });

    const trackItem = playlist.tracks.find(t => t.trackId.toString() === req.params.trackId);
    if (!trackItem) return res.status(404).json({ message: 'Track not found in playlist' });

    Object.assign(trackItem, req.body);
    await playlist.save();
    res.json(trackItem);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/**
 * @swagger
 * /api/v1/playlists/{id}/tracks/{trackId}:
 *   delete:
 *     summary: Remove track from playlist
 *     tags: [Tracks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Playlist ID
 *       - in: path
 *         name: trackId
 *         required: true
 *         schema:
 *           type: string
 *         description: Track ID
 *     responses:
 *       200:
 *         description: Track removed successfully
 *         content:
 *           application/json:
 *             example:
 *               message: "Track removed from playlist"
 *       404:
 *         description: Playlist or Track not found
 *         content:
 *           application/json:
 *             example:
 *               message: "Track not found in playlist"
 */

// DELETE remove track from playlist
app.delete('/api/v1/playlists/:id/tracks/:trackId', async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) return res.status(404).json({ message: 'Playlist not found' });

    playlist.tracks = playlist.tracks.filter(t => t.trackId.toString() !== req.params.trackId);
    await playlist.save();

    res.json({ message: 'Track removed from playlist' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ==============================
// PLAYBACK ROUTES
// ==============================

/**
 * @swagger
 * tags:
 *   name: Playback
 *   description: Manage playback records
 */

/**
 * @swagger
 * /api/v1/playback:
 *   get:
 *     summary: Get the last played track
 *     tags: [Playback]
 *     responses:
 *       200:
 *         description: Last playback record
 *         content:
 *           application/json:
 *             example:
 *               - _id: "64f125abc456def789012345"
 *                 userId: "64f123abc456def789012345"
 *                 trackId: "64f124abc456def789012345"
 *                 position: 120
 *                 isPlaying: true
 *                 startedAt: "2025-11-30T12:00:00.000Z"
 *                 updatedAt: "2025-11-30T12:05:00.000Z"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             example:
 *               message: "Server error"
 */

// GET last played track
app.get('/api/v1/playback', async (req, res) => {
  try {
    const playback = await Playback.find().sort({ updatedAt: -1 }).limit(1).populate('trackId');
    res.json(playback);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * /api/v1/playback:
 *   post:
 *     summary: Save a new playback record
 *     tags: [Playback]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             userId: "64f123abc456def789012345"
 *             trackId: "64f124abc456def789012345"
 *             position: 0
 *             isPlaying: true
 *     responses:
 *       201:
 *         description: Playback record created
 *         content:
 *           application/json:
 *             example:
 *               _id: "64f125abc456def789012345"
 *               userId: "64f123abc456def789012345"
 *               trackId: "64f124abc456def789012345"
 *               position: 0
 *               isPlaying: true
 *               startedAt: "2025-11-30T12:00:00.000Z"
 *               updatedAt: "2025-11-30T12:00:00.000Z"
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             example:
 *               message: "Invalid playback data"
 */

// POST save new playback record
app.post('/api/v1/playback', async (req, res) => {
  try {
    const playback = new Playback(req.body);
    await playback.save();
    res.status(201).json(playback);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/**
 * @swagger
 * /api/v1/playback/{id}:
 *   put:
 *     summary: Update playback info
 *     tags: [Playback]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Playback record ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             position: 150
 *             isPlaying: false
 *     responses:
 *       200:
 *         description: Playback record updated
 *         content:
 *           application/json:
 *             example:
 *               _id: "64f125abc456def789012345"
 *               userId: "64f123abc456def789012345"
 *               trackId: "64f124abc456def789012345"
 *               position: 150
 *               isPlaying: false
 *               startedAt: "2025-11-30T12:00:00.000Z"
 *               updatedAt: "2025-11-30T12:02:30.000Z"
 *       404:
 *         description: Playback not found
 *         content:
 *           application/json:
 *             example:
 *               message: "Playback not found"
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             example:
 *               message: "Invalid data"
 */

// PUT update playback info
app.put('/api/v1/playback/:id', async (req, res) => {
  try {
    const playback = await Playback.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!playback) return res.status(404).json({ message: 'Playback not found' });
    res.json(playback);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/**
 * @swagger
 * /api/v1/playback/{id}:
 *   delete:
 *     summary: Delete a playback record
 *     tags: [Playback]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Playback record ID
 *     responses:
 *       200:
 *         description: Playback record deleted
 *         content:
 *           application/json:
 *             example:
 *               message: "Playback record deleted"
 *       404:
 *         description: Playback not found
 *         content:
 *           application/json:
 *             example:
 *               message: "Playback not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             example:
 *               message: "Server error"
 */

// DELETE playback record
app.delete('/api/v1/playback/:id', async (req, res) => {
  try {
    const playback = await Playback.findByIdAndDelete(req.params.id);
    if (!playback) return res.status(404).json({ message: 'Playback not found' });
    res.json({ message: 'Playback record deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ====== Connect to MongoDB Atlas ======
async function startServer() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');
    app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
  } catch (err) {
    console.error('❌ Failed to connect:', err.message);
  }
}

startServer();