// ==============================
// Playlist + Tracks + Playback API
// Node.js + Express + MongoDB Atlas
// ==============================

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3000;

// ====== Middleware ======
app.use(cors());
app.use(express.json());
app.use(helmet());

// Docs Route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(
  helmet.hsts({
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  })
);

// CSP Configuration
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
// TRACK ROUTES 🎶
// ==============================

// GET all tracks
app.get('/api/v1/tracks', async (req, res) => {
    try {
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

// POST create a new track
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

// DELETE a track
app.delete('/api/v1/tracks/:id', async (req, res) => {
    try {
        const track = await Track.findByIdAndDelete(req.params.id);
        if (!track) return res.status(404).json({ message: 'Track not found' });
        res.json({ message: 'Track deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// ==============================
// PLAYLIST ROUTES 🎧
// ==============================

// GET all playlists (REMOVED USERID FILTER)
app.get('/api/v1/playlists', async (req, res) => {
  try {
    // Simply return all playlists found in the database
    const playlists = await Playlist.find().populate('tracks.trackId');
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
// TRACK ROUTES (within playlists)
// ==============================

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

// POST add a track to playlist (Handles both NEW and EXISTING tracks)
app.post('/api/v1/playlists/:id/tracks', async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) return res.status(404).json({ message: 'Playlist not found' });

    let trackIdToAdd;
    let trackDetails; 

    // Case 1: provides details (title) to CREATE a new Track
    if (req.body.title) {
      if (req.body.trackId) {
        return res.status(400).json({ message: 'Cannot provide both track details (like title) and an existing trackId.' });
      }
      
      const newTrack = new Track(req.body);
      trackDetails = await newTrack.save();
      trackIdToAdd = trackDetails._id;
      
    // Case 2: provides an ID to ADD an EXISTING Track
    } else if (req.body.trackId) {
      if (!mongoose.Types.ObjectId.isValid(req.body.trackId)) {
        return res.status(400).json({ message: 'Invalid existing trackId format.' });
      }
      
      trackIdToAdd = req.body.trackId;
      trackDetails = await Track.findById(trackIdToAdd);
      
      if (!trackDetails) {
        return res.status(404).json({ message: 'The existing trackId provided does not correspond to a Track document.' });
      }
    } else {
      return res.status(400).json({ message: 'Missing trackId (to add existing) or track details (like title) to create a new track.' });
    }

    // Check for duplicates in playlist
    const isDuplicate = playlist.tracks.some(t => t.trackId.toString() === trackIdToAdd.toString());
    if (isDuplicate) return res.status(400).json({ message: 'Track already exists in this playlist.' });

    // Add to playlist
    const trackEntry = { 
      trackId: trackIdToAdd, 
      order: playlist.tracks.length + 1 
    };
    
    playlist.tracks.push(trackEntry);
    playlist.updatedAt = Date.now();
    await playlist.save();

    res.status(201).json({ message: 'Track successfully added/created and linked to playlist.', track: trackDetails });
    
  } catch (err) {
    if (err.name === 'ValidationError') {
        return res.status(400).json({ message: err.message });
    }
    console.error('Error adding track:', err);
    res.status(500).json({ message: 'An internal server error occurred while adding the track.' });
  }
});

// PUT update track details (order, metadata)
app.put('/api/v1/playlists/:id/tracks/:trackId', async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) return res.status(404).json({ message: 'Playlist not found' });

    const trackItem = playlist.tracks.find(t => t.trackId.toString() === req.params.trackId);
    if (!trackItem) return res.status(404).json({ message: 'Track not found in playlist' });

    // Only update properties relevant to the track-playlist relationship (like order or addedAt)
    const updates = {};
    if (req.body.order !== undefined) updates.order = req.body.order;
    if (req.body.addedAt !== undefined) updates.addedAt = req.body.addedAt;

    Object.assign(trackItem, updates);
    playlist.updatedAt = Date.now(); 
    await playlist.save();
    
    const populatedTrack = await Playlist.populate(trackItem, { path: 'trackId' });

    res.json({ 
        message: 'Track item updated within playlist.', 
        updatedTrackItem: populatedTrack 
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE remove track from playlist
app.delete('/api/v1/playlists/:id/tracks/:trackId', async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) return res.status(404).json({ message: 'Playlist not found' });

    const originalLength = playlist.tracks.length;
    
    playlist.tracks = playlist.tracks.filter(t => t.trackId.toString() !== req.params.trackId);

    if (playlist.tracks.length === originalLength) {
        return res.status(404).json({ message: 'Track not found in playlist or trackId was invalid.' });
    }
    
    playlist.updatedAt = Date.now();
    await playlist.save();

    res.json({ message: 'Track removed from playlist' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ==============================
// PLAYBACK ROUTES
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
    if(!process.env.MONGODB_URI) {
        console.error("❌ Error: MONGODB_URI is not defined in environment variables.");
        return;
    }
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');
    
    app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
  } catch (err) {
    console.error('❌ Failed to connect:', err.message);
  }
}

// Export for Vercel
module.exports = app;

if (require.main === module) {
    startServer();
}