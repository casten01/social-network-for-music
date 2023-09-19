const mongoose = require('mongoose');

// Definizione dello schema e del modello del documento utente
const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  importate: [String]
});

//schema -> modello
const collectionName = 'users';
const user = mongoose.model('User', userSchema, collectionName);

module.exports = user;