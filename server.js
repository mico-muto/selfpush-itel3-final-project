// ==============================
// Playlist + Tracks + Playback API (One File)
// Node.js + Express + MongoDB Atlas
// ==============================

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3000;

// ====== Middleware ======
app.use(cors());
app.use(express.json());
app.use(helmet());

// Docs Route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// CSP Configuration (Strict for an API)
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"], 
      styleSrc: ["'self'"], 
      imgSrc: ["'self'", "data:"], 
      connectSrc: ["'self'"], 
      objectSrc: ["'none'"],  
      baseUri: ["'self'"],
    },
  })
);


// ====== Mongoose Schemas & Models ======

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
  // Assuming 'User' model exists elsewhere for reference
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, 
  tracks: [
    {
      // Only store the reference to the Track
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
app.get('/', (req, res) => res.send('Playlist API is running!'));


// ==============================
// TRACK ROUTES 🎶 (New Dedicated Section)
// ==============================

// GET all tracks
app.get('/api/v1/tracks', async (req, res) => {
    try {
        // Option to add search/filter logic here if needed
        const tracks = await Track.find(); 
        res.json(tracks);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET one track by ID
app.get('/api/v1/tracks/:id', async (req, res) => {
    try {
        const track = await Track.findById(req.params.id);
        if (!track) return res.status(404).json({ message: 'Track not found' });
        res.json(track);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST create a new track (Track now exists independently)
app.post('/api/v1/tracks', async (req, res) => {
    try {
        const track = new Track(req.body);
        await track.save();
        res.status(201).json(track);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// PUT update track details
app.put('/api/v1/tracks/:id', async (req, res) => {
    try {
        const track = await Track.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!track) return res.status(404).json({ message: 'Track not found' });
        res.json(track);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE a track (Might break playlists, but for now, simple delete)
app.delete('/api/v1/tracks/:id', async (req, res) => {
    try {
        const track = await Track.findByIdAndDelete(req.params.id);
        if (!track) return res.status(404).json({ message: 'Track not found' });
        
        // OPTIONAL: Clean up references in all playlists where this track exists
        // await Playlist.updateMany(
        //     { 'tracks.trackId': req.params.id },
        //     { $pull: { tracks: { trackId: req.params.id } } }
        // );

        res.json({ message: 'Track deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// ==============================
// PLAYLIST ROUTES 🎧
// ==============================

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
// PLAYLIST TRACK MANIPULATION ROUTES (Modified Logic)
// ==============================

// GET all tracks in a playlist (Kept the same)
app.get('/api/v1/playlists/:id/tracks', async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id).populate('tracks.trackId');
    if (!playlist) return res.status(404).json({ message: 'Playlist not found' });
    res.json(playlist.tracks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST add an EXISTING track to playlist 
// Expects: { "trackId": "60c72b9f9b1d9c1b7c1e5f8a" } in req.body
app.post('/api/v1/playlists/:id/tracks', async (req, res) => {
  try {
    const { trackId } = req.body;
    if (!trackId) return res.status(400).json({ message: 'Missing trackId in request body.' });

    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) return res.status(404).json({ message: 'Playlist not found' });

    // 1. Validate if the trackId exists as an independent Track
    const track = await Track.findById(trackId);
    if (!track) return res.status(404).json({ message: 'Track to be added not found in database.' });

    // 2. Prevent duplicates (optional, but good practice)
    const isDuplicate = playlist.tracks.some(t => t.trackId.toString() === trackId);
    if (isDuplicate) return res.status(400).json({ message: 'Track already exists in this playlist.' });

    // 3. Add the track reference
    playlist.tracks.push({ trackId: trackId, order: playlist.tracks.length + 1 });
    await playlist.save();

    res.status(201).json({ 
        message: 'Track added to playlist',
        trackId: trackId
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update track details (order only on the playlist reference)
// The original code tried to use Object.assign(trackItem, req.body), 
// which is a bit broad. This is simplified to explicitly handle 'order'.
app.put('/api/v1/playlists/:id/tracks/:trackId', async (req, res) => {
  try {
    const { order } = req.body;

    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) return res.status(404).json({ message: 'Playlist not found' });

    const trackItem = playlist.tracks.find(t => t.trackId.toString() === req.params.trackId);
    if (!trackItem) return res.status(404).json({ message: 'Track not found in playlist' });

    // Only update order (or other playlist-specific metadata like 'metadata')
    if (order !== undefined) {
        trackItem.order = order;
    } else {
        return res.status(400).json({ message: 'No valid fields provided for update (e.g., "order").' });
    }

    await playlist.save();
    res.json(trackItem);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE remove track from playlist (Kept the same)
app.delete('/api/v1/playlists/:id/tracks/:trackId', async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) return res.status(404).json({ message: 'Playlist not found' });

    playlist.tracks = playlist.tracks.filter(t => t.trackId.toString() !== req.params.trackId);
    // OPTIONAL: Re-sort the 'order' field for remaining tracks
    playlist.tracks.forEach((t, index) => t.order = index + 1);

    await playlist.save();

    res.json({ message: 'Track removed from playlist' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ==============================
// PLAYBACK ROUTES ⏯️ (Kept the same)
// ==============================

// GET last played track
app.get('/api/v1/playback', async (req, res) => {
  try {
    const playback = await Playback.find().sort({ updatedAt: -1 }).limit(1).populate('trackId');
    res.json(playback);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

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
    // Ensure MONGODB_URI is correctly set in your .env file
    await mongoose.connect(process.env.MONGODB_URI); 
    console.log('Connected to MongoDB Atlas');
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  } catch (err) {
    console.error('Failed to connect:', err.message);
  }
}

startServer();