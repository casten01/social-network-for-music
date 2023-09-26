

# Social-Network-for-Music
University project, a Node.js web app based on spotify api, a social network where users can create and shares music playlists.

## Testing e Deploy

### Instructions to Start the Application - **Testing Phase**:

- Create a database on [MongoDB](https://www.mongodb.com/it-it).
   - Visit the [Spotify Developer Section](https://developer.spotify.com/).
   - Log in with your Spotify credentials or create an account.
   - Click on **Create App**, give it a name and description.
   - In the dashboard, you will find the ClientID and Client Secret, which are needed to generate the token (valid for 1 hour).

- Run the following command to clone the repository:
  - `git clone https://github.com/casten01/social-network-for-music.git`
- Install the required `node_modules` by running:
  - `npm install`

- Add a `.env` file to the root of the project (refer to `.env-template`).
  - The `.env` file should contain the following environment variables:
     - `URI_DB`: MongoDB server URI.
     - `COOKIE_SECRET`: Secret word for signing session cookies.
     - `SPOTIFY_CLIENT_ID`: ID for generating Spotify tokens.
     - `SPOTIFY_CLIENT_SECRET`: Secret for generating Spotify tokens.

- Start the application by running `app.js` from the terminal:
  - `npm start`
- The site will be accessible at [`http://localhost:5000/`](http://localhost:5000/).


### Istruzioni per avviare l'applicazione - **fase di testing**:
- Creare un database su [MongoDB](https://www.mongodb.com/it-it)
- Per ottenere le chiavi api per Spotify:
   - Visitare la [sezione developer di Spotify](https://developer.spotify.com/) 
   - Effettuare l'accesso con le credenziali spotify o creare un account
   - Cliccare su **create app**, assegnare un nome e una descrizione
   - Nella dashboard troverai ClientID e Client Secret, serviranno per generare il token (validità 1h) 

- Clonare il codice sorgente:
  - `git clone https://github.com/casten01/social-network-for-music.git`
- Installare i `node_modules`:
  - `npm install;`
- Aggiungere file `.env` alla root del progetto (guardare `.env-template`):
  - Il file contiene le seguenti variabili di ambiente:
    - `URI_DB`: URI del server mongodb
    - `COOKIE_SECRET=`: parola segreta per firmare i cookie di sessione
    - `SPOTIFY_CLIENT_ID`: id per generare token Spotify
    - `SPOTIFY_CLIENT_SECRET`: segreto per generare token Spotify
- Eseguire `app.js` dal terminale con il comando:
  - `npm start`
- Il sito sarà raggiungibile all'indirizzo [`http://localhost:5000/`](http://localhost:5000/)
![JavaScript](https://img.shields.io/badge/JavaScript-Used-yellow.svg) ![HTML](https://img.shields.io/badge/HTML-Used-orange.svg) ![CSS](https://img.shields.io/badge/CSS-Used-blue.svg)
