const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Music Playlist CRUD API',
    version: '1.0.0',
    description: 'API documentation for managing music playlists, tracks, and playback state.',
  },
  components: {
    schemas: {
      Track: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '60d0fe4f5311236168a109ca' },
          title: { type: 'string', example: 'Bohemian Rhapsody' },
          artist: { type: 'string', example: 'Queen' },
          album: { type: 'string', example: 'A Night at the Opera' },
          duration: { type: 'integer', example: 354 },
        },
      },
      Playlist: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '60d0fe4f5311236168a109cb' },
          name: { type: 'string', example: 'Road Trip Mix' },
          description: { type: 'string', example: 'Songs for the drive' },
          tracks: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                trackId: { type: 'string', example: '60d0fe4f5311236168a109ca' },
                order: { type: 'integer', example: 1 },
              },
            },
          },
        },
      },
    },
  },
  paths: {
    // --- TRACKS ---
    '/api/v1/tracks': {
      get: {
        summary: 'Retrieve all tracks',
        tags: ['Tracks'],
        responses: {
          200: { description: 'A list of tracks', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Track' } } } } },
        },
      },
      post: {
        summary: 'Create a new track',
        tags: ['Tracks'],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', properties: { title: { type: 'string' }, artist: { type: 'string' } } } } },
        },
        responses: {
          201: { description: 'Track created' },
        },
      },
    },
    '/api/v1/tracks/{id}': {
      get: {
        summary: 'Get a track by ID',
        tags: ['Tracks'],
        parameters: [{ in: 'path', name: 'id', schema: { type: 'string' }, required: true }],
        responses: {
          200: { description: 'Track details', content: { 'application/json': { schema: { $ref: '#/components/schemas/Track' } } } },
          404: { description: 'Track not found' },
        },
      },
      put: {
        summary: 'Update a track',
        tags: ['Tracks'],
        parameters: [{ in: 'path', name: 'id', schema: { type: 'string' }, required: true }],
        requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/Track' } } } },
        responses: { 200: { description: 'Track updated' } },
      },
      delete: {
        summary: 'Delete a track',
        tags: ['Tracks'],
        parameters: [{ in: 'path', name: 'id', schema: { type: 'string' }, required: true }],
        responses: { 200: { description: 'Track deleted' } },
      },
    },

    // --- PLAYLISTS ---
    '/api/v1/playlists': {
      get: {
        summary: 'Retrieve all playlists',
        tags: ['Playlists'],
        responses: {
          200: { description: 'List of playlists', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Playlist' } } } } },
        },
      },
      post: {
        summary: 'Create a playlist',
        tags: ['Playlists'],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' }, description: { type: 'string' } } } } },
        },
        responses: { 201: { description: 'Playlist created' } },
      },
    },
    '/api/v1/playlists/{id}': {
      get: {
        summary: 'Get a playlist by ID',
        tags: ['Playlists'],
        parameters: [{ in: 'path', name: 'id', schema: { type: 'string' }, required: true }],
        responses: { 200: { description: 'Playlist found' } },
      },
      put: {
        summary: 'Update playlist details',
        tags: ['Playlists'],
        parameters: [{ in: 'path', name: 'id', schema: { type: 'string' }, required: true }],
        requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/Playlist' } } } },
        responses: { 200: { description: 'Playlist updated' } },
      },
      delete: {
        summary: 'Delete a playlist',
        tags: ['Playlists'],
        parameters: [{ in: 'path', name: 'id', schema: { type: 'string' }, required: true }],
        responses: { 200: { description: 'Playlist deleted' } },
      },
    },

    // --- PLAYLIST TRACKS ---
    '/api/v1/playlists/{id}/tracks': {
      get: {
        summary: 'Get all tracks in a playlist',
        tags: ['Playlist Tracks'],
        parameters: [{ in: 'path', name: 'id', schema: { type: 'string' }, required: true }],
        responses: { 200: { description: 'List of tracks' } },
      },
      post: {
        summary: 'Add a track to a playlist',
        description: 'Provide a `trackId` to add an existing track, or `title` to create and add a new one.',
        tags: ['Playlist Tracks'],
        parameters: [{ in: 'path', name: 'id', schema: { type: 'string' }, required: true }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  trackId: { type: 'string', description: 'ID of an existing track' },
                  title: { type: 'string', description: 'Title of a new track to create' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Track added to playlist' } },
      },
    },
    '/api/v1/playlists/{id}/tracks/{trackId}': {
      delete: {
        summary: 'Remove a track from a playlist',
        tags: ['Playlist Tracks'],
        parameters: [
          { in: 'path', name: 'id', schema: { type: 'string' }, required: true },
          { in: 'path', name: 'trackId', schema: { type: 'string' }, required: true },
        ],
        responses: { 200: { description: 'Track removed' } },
      },
    },

    // --- PLAYBACK ---
    '/api/v1/playback': {
      get: {
        summary: 'Get last played track',
        tags: ['Playback'],
        responses: { 200: { description: 'Playback state' } },
      },
      post: {
        summary: 'Save playback record',
        tags: ['Playback'],
        requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { trackId: { type: 'string' }, position: { type: 'integer' } } } } } },
        responses: { 201: { description: 'Record saved' } },
      },
    },

      //-- PLAYBACK :id ---
      '/api/v1/playback/{id}': {
      put: {
        summary: 'Update playback state',
        description: 'Update the position and playing status of a playback session.',
        tags: ['Playback'],
        parameters: [
          { in: 'path', name: 'id', schema: { type: 'string' }, required: true, description: 'Playback Record ID' }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  position: { type: 'integer', description: 'Current playback position in seconds' },
                  isPlaying: { type: 'boolean', description: 'Whether the track is currently playing' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Playback updated successfully' },
          404: { description: 'Playback record not found' },
        },
      },
      delete: {
        summary: 'Delete playback record',
        tags: ['Playback'],
        parameters: [
          { in: 'path', name: 'id', schema: { type: 'string' }, required: true, description: 'Playback Record ID' }
        ],
        responses: {
          200: { description: 'Playback record deleted successfully' },
          404: { description: 'Playback record not found' },
        },
      },
    },
  },
};
module.exports = swaggerDefinition;