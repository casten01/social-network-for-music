const mongoose = require('mongoose');

// Definizione dello schema e del modello del documento playlist
const playlistSchema = new mongoose.Schema({
  namePlaylist: String,
  privacy: String,
  description: String,
  tagsArray: [String],
  songsArray: [String],
  userID: String
});

//schema -> modello
const collectionName = 'playlists';
const playlist = mongoose.model('Playlist', playlistSchema, collectionName);
//-> un model è una class con cui costruiamo documenti

module.exports = playlist;