// Imports
require('dotenv').config();

const express = require('express')
const mongoose = require('mongoose');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const UserDB = require('./mongodb/user.js');
const PlaylistDB = require('./mongodb/playlist.js');

const path = require('path');
const { log } = require('console');
const { send } = require('process');
const app = express()
const port = 5000 //porta del server

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true })); // Middleware per analizzare dati del form

app.use(express.json()); // Middleware per analizzare il corpo delle richieste in formato JSON

app.use(cookieParser());

app.use(session({
  secret: process.env.COOKIE_SECRET, // Chiave segreta per firmare il cookie di sessione
  resave: false,
  saveUninitialized: true
}));

//CONNESSIONE AL DB
const uri = process.env.URI_DB;

async function connectDB() {
  mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }).then(()=> {
    console.log("Connected to DB")});
};
connectDB().catch(console.dir);

// Listen on Port 5000
app.listen(port, () => console.info(`App listening on port ${port}`));

//Creazione endpoint default -> index.html
app.get('/', (req,res)=> { res.sendFile(path.join(__dirname, 'public', 'index.html'))});
//Creazione endpoint /register -> register.html
app.get('/redirect/register', (req,res)=> { res.sendFile(path.join(__dirname, 'public', 'register.html'))});
//Creazione endpoint /login -> login.html
app.get('/redirect/login', (req,res)=> { 
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});
//Creazione endpoint per registrazione effettuata correttamente -> dashboard.html
app.get('/redirect/dashboard', authenticateMiddleware, (req,res)=> {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

//Creazione di un endpoint per passare informazioni relative all'account loggato
app.get('/user/info', authenticateMiddleware,  async (req, res) => {
  try {
    const user = await UserDB.findOne({ "email" : req.session.user.email});

    const username = user.username;
    const email = user.email;
    const password = user.password;
  
    const data = {
      username : username,
      email : email,
      password: password
    }

    res.json(data);
  } catch (err) {
    console.error("Errore durante il recupero delle informazioni dell'utente:", err);
    res.status(500).send('Errore durante il recupero delle informazioni dell\'utente.');
  }

})

//Creazione di un endpoint per restituire lista playlist dell'utente
app.get('/playlist/private', async (req, res) => {
  const user = await UserDB.findOne({ "email" : req.session.user.email});
  const userID = user._id.toString();

  try {
    const playlists = await PlaylistDB.find({ userID });

    res.json(playlists);    
  } catch (err) {
    console.error("Errore durante il recupero delle playlist dell'utente:", err);
    res.status(500).send('Errore durante il recupero delle playlist dell\'utente.');
  }
})

//Creazione di un endpoint per restituire informazioni sulla playlist cliccata
app.get('/playlist/private/info/:playlistID', async (req, res) => {
  const playlistID = new mongoose.Types.ObjectId(req.params.playlistID);

  try {
    const playlist = await PlaylistDB.findOne({ "_id": playlistID });
    res.json(playlist);    
  } catch (err) {
    console.error("Errore durante il recupero della playlist dell'utente:", err);
    res.status(500).send('Errore durante il recupero della playlist dell\'utente.');
  }
})


//Creazione di un enpoint per restituire tutte le playlist pubbliche a cui l'utente loggato ha messo like
app.get('/playlist/private/importate', async (req, res) => {
  try {
    const playlists = [];

    const user = await UserDB.findOne({ "email" : req.session.user.email})
    const importate = user.importate
    for (let index = 0; index < importate.length; index++) {
      const PLID = importate[index];
      const playlistID = new mongoose.Types.ObjectId(PLID);
      const playlist = await PlaylistDB.findOne({"_id" : playlistID});
      playlists.push(playlist)
    }
    
    res.json(playlists);    
  } catch (err) {
    console.error("Errore durante il recupero delle playlist importate: ", err);
    res.status(500).send('Errore durante il recupero delle playlist importate.');
  }
})

//Creazione di un endpoint per restituire tutte le playlist che hanno la canzone passata come parametro
app.get('/playlist/public/searchBySong/:trackId', async (req, res) => {
  const trackId = req.params.trackId;
  try {
    // Cerca tutte le playlist che contengono l'ID della traccia specificato
    const playlists = await PlaylistDB.find({ songsArray: trackId });

    if (playlists.length == 0) {
      return res.status(200).json({
        playlists: playlists,
        error: 'Playlist con questa canzone non trovata'
      })
    }
    res.status(200).json({
      playlists: playlists,
      message: 'Playlist trovate con successo'
    });

  } catch (err) {
    console.error("Errore durante la ricerca delle playlist per ID traccia:", err);
    res.status(500).json({error: 'Errore durante la ricerca delle playlist.'});
  }
});

//Creazione di un endpoint per restituire tutte le playlist che hanno il tag passato come parametro
app.get('/playlist/public/searchByTag/:tag', async (req, res) => {
  const tag = req.params.tag;

  try {
    // Cerca tutte le playlist che contengono l'ID della traccia specificato
    const playlists = await PlaylistDB.find({ tagsArray: tag });
    if (playlists.length == 0) {
      return res.status(200).json({
        playlists: playlists,
        error: 'Playlist con questo tag non trovata'
      })
    }

    res.status(200).json({
      playlists: playlists,
      message: 'Playlist trovate con successo'
    });

  } catch (err) {
    console.error("Errore durante la ricerca delle playlist per tag:", err);
    res.status(500).json({error: 'Errore durante la ricerca delle playlist.'});
  }
});


//Creazione di un endpoint per restituire il nome dell'utente dato il suo id
app.get('/playlist/public/nameUser/:userID', async (req, res) => {
  const userID = new mongoose.Types.ObjectId(req.params.userID);
  await getUsername(userID, res)
})

//funzione che restituisce il nome dell'utente dato il suo id
async function getUsername(userID, res) {
  try {
    const user = await UserDB.findOne({"_id": userID});
    res.json(user.username)
  } catch (err) {
    console.error("Errore durante il recuper dell'username dell'utente:", err);
    res.status(500).send("Errore durante il recupero dell'username dell'utente:", err)
  }
}

//Creazione di un endpoint per restituire lista playlist presenti nell'applicazione (non le proprie quando si é loggati)
app.get('/playlist/public', async (req, res) => {
  const user = await UserDB.findOne({ "email" : req.session.user.email});
  const userID = user._id.toString();

  try {
    const playlists = await PlaylistDB.find({
      "privacy" : "public",
      "userID": { $ne: userID } // Escludi le playlist dell'utente loggato
    });

    res.json(playlists);    
  } catch (error) {
    console.error("Errore durante il recupero delle playlist: ", err);
    res.status(500).send('Errore durante il recupero delle playlist: ');
  }
})

//Creazione di un endpoint per restituire informazioni sulla playlist cliccata tra quelle pubbliche
app.get('/playlist/public/info/:playlistID', async (req, res) => {
  const playlistID = new mongoose.Types.ObjectId(req.params.playlistID);
  try {
    const playlist = await PlaylistDB.findOne({ "_id": playlistID });
    res.json(playlist);    
  } catch (err) {
    console.error("Errore durante il recupero della playlist pubblica:", err);
    res.status(500).send('Errore durante il recupero della playlist pubblica.');
  }
})

//Creazione di un endpoint per restituire tutte le playlist pubbliche
app.get('/public/playlists', async (req, res) => {
  try {
    const playlists = await PlaylistDB.find({"privacy" : "public"});

    res.json(playlists);    
  } catch (error) {
    console.error("Errore durante il recupero delle playlist: ", err);
    res.status(500).send('Errore durante il recupero delle playlist: ');
  }
})

//Creazione endpoint per restituire il token con cui effettuare richieste API
app.get('/spotify/token', authenticateMiddleware, (req, res) => {
  res.json({
    "token": req.session.token
  });
})

// REGISTRAZIONE: invio tramite metodo POST per gestire i dati del form di registrazione
app.post('/user/register', async (req, res) => {
  const { username, email, password, confirm_password } = req.body;

  // Verifica se l'email è già presente nel database
  const existingUser = await UserDB.findOne({ email });

  //409 -> conflict
  if (existingUser) {
    res.status(409).json({error: 'Email già utilizzata. Si prega di utilizzare un\'altra email.'});
    return
  }
  // Verifica se le password corrispondono, 400 -> bad request 
  if (password !== confirm_password) {
    res.status(400).json({error: 'Le password non corrispondono.'});
    return
  }

  try {
    // Inserimento del nuovo utente nella collection 
    const user = await UserDB.create({
      username,
      email,
      password
    });

    req.session.user = user; // Salva l'utente nella sessione
    res.status(200).json({ success: true, redirectUrl: '/redirect/login' });
  } catch (err) {
    console.error("Errore durante il salvataggio dell'utente:", err);
    res.status(500).json({error: 'Errore durante la registrazione.'});
  }
});

// LOGIN: login tramite metodo POST per effettuare login nell'applicazione
app.post('/user/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Verifica se l'utente esiste nel database
    const user = await UserDB.findOne({ email });

    if (!user) {
      res.status(401).json({error: 'Email non corretta.'});
      return
    }
    // Verifica la password dell'utente
    if (user.password !== password) {
      res.status(401).json({error: 'Password non corretta.'});
      return
    }

    // Se l'utente è autenticato, imposta il flag isLoggedIn a true nella sessione
    req.session.isLoggedIn = true;

    // Reindirizza alla dashboard
    req.session.user = user; // Salva l'utente nella sessione
    req.session.token = await getToken();
    res.status(200).json({ success: true, redirectUrl: '/redirect/dashboard' });

  } catch (err) {
    console.error("Errore durante il login:", err);
    res.status(500).json('Errore durante il login.');
  }
});

// UPDATE INFO USER: aggiornamento informazioni utente: username, email, user
app.post('/user/update', async (req, res) => {
  const { newUsername, newEmail, newPassword } = req.body;
  var oldEmail = req.session.user.email;
  try {

    if (newEmail) {
      // Verifica se l'email è già presente nel database
      const existingUser = await UserDB.findOne({ newEmail });

      //409 -> conflict
      if (existingUser) {
        res.status(409).json({error: 'Email già utilizzata. Si prega di utilizzare un\'altra email.'});
        return
      }

      await UserDB.updateOne(
        { "email" : oldEmail }, // Condizione di ricerca basata sull'email
        { $set: { "email": newEmail} }, // Dato da aggiornare
      );
      req.session.user.email = newEmail;
      oldEmail = newEmail;
    }

    if (newUsername) {
      await UserDB.updateOne(
        { "email" : oldEmail }, // Condizione di ricerca basata sull'email
        { $set: { "username": newUsername} }, // Dato da aggiornare
      );
    }

    if (newPassword) {

      await UserDB.updateOne(
        { "email": oldEmail }, // Condizione di ricerca basata sull'email
        { $set: { "password": newPassword} }, // Dato da aggiornare
      );
    }
    const user = await UserDB.findOne({ "email" : oldEmail });
    res.status(200).json({message : 'Informazioni aggiornate con successo.', success: true, redirectUrl : '/redirect/dashboard' });
    req.session.user = user; // Salva l'utente nella sessione
  } catch (err) {
    console.error("Errore durante l'aggiornamento delle informazioni del profilo:", err);
    res.status(500).send('Errore durante l\'aggiornamento delle informazioni del profilo.');
  }
});

// DELETE USER: elimina utente dal database e tutte le sue playlist
app.delete('/user/delete', async (req, res) => {
  const user_email = req.session.user.email
  const user_id = req.session.user._id
  try {
    await UserDB.findOneAndDelete({"email" : user_email});
    await PlaylistDB.deleteMany({"userID": user_id});
    res.status(202).json({message: 'Utente eliminato con successo', redirectUrl: '/', success: true});
  } catch (err) {
    console.error("Errore durante l'eliminazione del utente:", err);
    res.status(500).send('Errore durante l\'eliminazione dell\'utente.');
  }
})

//CREAZIONE PLAYLIST
app.post('/playlist/private/create', async (req, res) =>{
  let namePlaylist, privacy, description, tagsArray, songsArray;

  namePlaylist = req.body.namePlaylist;
  privacy = req.body.privacy;
  description = req.body.descPlaylist;
  tagsArray = JSON.parse(req.body.tagsArray);  
  songsArray = JSON.parse(req.body.newSongsArray);
  
  const user = await UserDB.findOne({ "email" : req.session.user.email});
  const userID = user._id.toString();

  try {
    // Inserimento della nuova playlist nella collection
    await PlaylistDB.create({
      namePlaylist,
      privacy,
      description,
      tagsArray,
      songsArray,
      userID
    });
    res.status(200).json({success: true, message: 'Playlist creata con successo.', redirectUrl: '/redirect/dashboard'})
  } catch (err) {
    console.error("Errore durante la creazione della playlist:", err);
    res.status(500).json({error: 'Errore durante la creazione.'});
  }
});

//MODIFICA DATI PLAYLIST (nome, privacy, descrizione, tags)
app.post('/playlist/private/update', async (req, res) => {
  let namePlaylist, privacy, description, tagsArray, playlistID;
  
  namePlaylist = req.body.newNamePlaylist;
  privacy = req.body.privacy;
  description = req.body.newDescPlaylist;
  tagsArray = JSON.parse(req.body.tagsArray2); 
  playlistID = new mongoose.Types.ObjectId(req.body.playlistID); 

  try {

    // Aggiornamento della playlist
    await PlaylistDB.updateOne(
      { "_id" : playlistID}, 
      { $set : {
        "namePlaylist" : namePlaylist,
        "privacy" : privacy,
        "description" : description,
        "tagsArray" : tagsArray
        }
      }
    );
    res.status(200).json({success: true, message: 'Playlist aggiornata con successo.', redirectUrl: '/redirect/dashboard'})
  } catch (err) {
    console.error("Errore durante aggiornamento delle informazioni della playlist:", err);
    res.status(500).json({error: 'Errore durante aggiornamento.'});
  }
})

//CANCELLAZIONE CANZONI DA PLAYLIST
app.delete('/playlist/private/delete/song', async (req, res) => {
  try {
    const playlistId = new mongoose.Types.ObjectId(req.body[0]);
    const songId = req.body[1];
    await PlaylistDB.updateOne(
        { "_id": playlistId },
        { $pull: { "songsArray": songId } }
    );
    res.status(200).json({message: 'Canzone eliminata con successo'});

  } catch (err) {
    console.error("Errore durante la cancellazione dalla playlist:", err);
    res.status(500).json({error: 'Errore durante la cancellazione dalla playlist.'});

  }
})

//AGGIUNTA DI CANZONI ALLA PLAYLIST
app.post('/playlist/private/add/song', async (req, res) => {
  try {
    const playlistId = new mongoose.Types.ObjectId(req.body[0]);

    for (let i = 1; i < req.body.length; i++) {
      const songId = req.body[i];

      const founded = await PlaylistDB.findOne({
        "_id": playlistId,
        "songsArray" : songId
      });

      if (!founded) {
        await PlaylistDB.updateOne(
          { "_id": playlistId },
          { $push: { "songsArray": songId } }
        );
      }

    }
    res.status(200).json({message: 'Canzoni aggiunte con successo.'});


  } catch (err) {
    console.error("Errore durante aggiornamento della playlist:", err);
    res.status(500).json({error: 'Errore durante l\'aggiunta di canzoni.'});

  }
})

//DELETE PLAYLIST: elimina la playlist di cui si è proprietari e di cui è passato l'id come parametro
app.delete('/playlist/private/delete/:playlistID', async (req, res) => {

  const playlistID = new mongoose.Types.ObjectId(req.params.playlistID);
  try {
    const user = await UserDB.findOne({ "email": req.session.user.email });
    const playlistIsMine = await PlaylistDB.findOne({
      "_id" : playlistID,
      "userID" : user._id.toString()
    })  

    if (playlistIsMine) {
      await PlaylistDB.deleteOne({
        "_id" : playlistID
      })
    }else{
      res.status(500).send('Errore: la playlist non appartiene all\'utente loggato.');
    }

    await UserDB.updateMany(
      { importate: playlistID},
      { $pull: { importate: playlistID } }
    );
    res.status(200).json({message: 'Playlist eliminata con successo.', success: true, redirectUrl: '/redirect/dashboard'})
  } catch (err) {
    console.error("Errore durante l'eliminazione della playlist dell'utente:", err);
    res.status(500).send('Errore durante l\'eliminazione della playlist dell\'utente.');
  }

})

//AGGIUNTA DI UNA PLAYLIST IMPORTATA NEL PROFILO DELL'UTENTE
app.post('/playlist/private/importate/add', async (req, res) => {
  try {
    const user = await UserDB.findOne({ "email" : req.session.user.email});
    const userID = new mongoose.Types.ObjectId(user._id);
    const playlistImportata =  new mongoose.Types.ObjectId(req.body[0]);

    const founded = await UserDB.findOne({
      "_id": userID,
      "importate" : playlistImportata
    });

    if (!founded) {
      await UserDB.updateOne(
        { "_id": userID },
        { $push: { "importate": playlistImportata } }
      );
    }
    res.status(200).json({message: 'Playlist importata con successo, la pagina viene ricaricata.', success: true, redirectUrl: '/redirect/dashboard'});
  } catch (err) {
    console.error("Errore durante l'importazione della playlist: ", err)
    res.status(500).json({error:'Errore durante importazione playlist.'});
  }
})

//DELETE PLAYLIST IMPORTATA
app.delete('/playlist/private/importate/delete/:playlistID', async (req, res) => {
  const playlistID = new mongoose.Types.ObjectId(req.params.playlistID);

  try {
    const user = await UserDB.findOne({ "email" : req.session.user.email});

    await UserDB.updateOne(
        { "_id": user._id },
        { $pull: { "importate": playlistID } }
    );
    res.status(200).json({message: 'Playlist importata eliminata con successo', success: true, redirectUrl: '/redirect/dashboard'});

  } catch (err) {
    console.error("Errore durante la cancellazione della playlist importata:", err);
    res.status(500).json( {error: 'Errore durante la cancellazione della playlist importata.'});

  }
})



//-----------------------------
// Middleware per proteggere la sessione
function authenticateMiddleware(req, res, next) {
  if (req.session.isLoggedIn) {
    // L'utente è autenticato, passa alla prossima richiesta
    next();
  } else {
    // L'utente non è autenticato, reindirizza alla pagina di login
    res.redirect('/redirect/login');
  }
}


//INTEGRAZIONE CON API SPOTIFY

//Funzione che genera e restituisce un token, durata 1h
async function getToken()  {
  const client_id = process.env.SPOTIFY_CLIENT_ID
  const client_secret = process.env.SPOTIFY_SECRET_ID
  var url = "https://accounts.spotify.com/api/token"

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: "Basic " + btoa(`${client_id}:${client_secret}`),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ grant_type: "client_credentials" }),
    });
    const tokenResponse = await response.json();
    return tokenResponse.access_token;
  }catch (error) {
    console.error("Errore durante la richiesta del token:", error);
    throw error;
  }
}




