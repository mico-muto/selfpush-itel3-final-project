// ==============================
// Playlist + Tracks + Playback API
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

app.use(
  helmet.hsts({
    maxAge: 31536000, 
    includeSubDomains: true,
    preload: true
  })
);

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

// POST add a new track to playlist (MODIFIED FOR FLEXIBILITY)
app.post('/api/v1/playlists/:id/tracks', async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) return res.status(404).json({ message: 'Playlist not found' });

    let trackIdToAdd;
    let trackDetails; // Will hold the created or existing track document

    // Case 1: Client provides details (title) to CREATE a new Track
    if (req.body.title) {
      // Check if title is provided but trackId is also provided, which is ambiguous
      if (req.body.trackId) {
        return res.status(400).json({ message: 'Cannot provide both track details (like title) and an existing trackId.' });
      }
      
      const newTrack = new Track(req.body);
      trackDetails = await newTrack.save();
      trackIdToAdd = trackDetails._id;
      
    // Case 2: Client provides an ID to ADD an EXISTING Track
    } else if (req.body.trackId) {
      // Validate the ID is a valid MongoDB ObjectId format
      if (!mongoose.Types.ObjectId.isValid(req.body.trackId)) {
        return res.status(400).json({ message: 'Invalid existing trackId format.' });
      }
      
      trackIdToAdd = req.body.trackId;
      trackDetails = await Track.findById(trackIdToAdd);
      
      // Check if the Track actually exists
      if (!trackDetails) {
        return res.status(404).json({ message: 'The existing trackId provided does not correspond to a Track document.' });
      }

    // Case 3: Neither ID nor details provided (Error)
    } else {
      return res.status(400).json({ message: 'Missing trackId (to add existing) or track details (like title) to create a new track.' });
    }

    // Final check to ensure we have an ID to push
    if (!trackIdToAdd) {
        // This should theoretically not be reached, but is a good safeguard
        return res.status(500).json({ message: 'A valid Track ID could not be determined or created.' });
    }

    // Add the determined track ID to the playlist
    const trackEntry = { 
      trackId: trackIdToAdd, 
      // Set the order to the next position
      order: playlist.tracks.length + 1 
    };
    
    playlist.tracks.push(trackEntry);
    playlist.updatedAt = Date.now();
    await playlist.save();

    // Respond with the track details that were added/created
    res.status(201).json({ message: 'Track successfully added/created and linked to playlist.', track: trackDetails });
    
  } catch (err) {
    // Check for Mongoose Validation errors during new Track creation
    if (err.name === 'ValidationError') {
        // If the error is from missing a required field (like 'title' if creating)
        return res.status(400).json({ message: err.message });
    }
    // Catch all other server errors
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
    playlist.updatedAt = Date.now(); // Update the playlist timestamp too
    await playlist.save();
    
    // Fetch the full track details for the response
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

    // Use $pull to remove the item from the array where the trackId matches
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
    // NOTE: MongoDB connection must be successful for this to run
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');
    app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
  } catch (err) {
    console.error('❌ Failed to connect:', err.message);
  }
}

startServer();  