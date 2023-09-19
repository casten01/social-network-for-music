//----------------------------- SEZIONE MENU DASHBOARD ----------------------------

// Gestione della navigazione tra le sezioni -> FUNZIONA utilizzando indici del menu di sx
const sections = document.querySelectorAll('div section');
const navLinks = document.querySelectorAll(".col1 ul li a");
const form = document.querySelector(".updatePLform");
const homeDashboard = document.querySelector(".home-dashboard");
const searchPL = document.querySelector(".searchPL");
const pubMenu = document.querySelector(".pubPL-menu")

document.addEventListener('DOMContentLoaded', function() {
  var showUserPl = false;
  var showPubPl = false;

  navLinks.forEach((link, index) => {
    link.addEventListener('click', function(event) {
      counter = 0;
      event.preventDefault();

      // Nascondi tutte le sezioni
      sections.forEach(section  => section.style.display = 'none');
      navLinks.forEach(navLink => navLink.style.borderBottom = 'none');
      form.style.display = 'none';
      homeDashboard.style.display = 'none';
      searchPL.style.display = 'none'
    
      // Mostra la sezione corrispondente
      sections[index].style.display = 'flex';
      navLinks[index].style.borderBottom = '2px solid var(--yellow';
      if (index == 1 && showUserPl == false) {
        //Richiama funzioni per eventuali aggiornamenti alle playlist
        displayUserPlaylist();
        showUserPl = true;
      }else if (index == 2 && showPubPl == false) {
        //Richiama funzioni per eventuali aggiornamenti alle playlist
        displayPubPlaylist();
        showImportate();
        showPubPl = true;
      }else if (index == 3) {
        selectedTrackIds = [];
        document.getElementById('added-tracks').innerHTML = '';
      }
    });
  });
});

function showSectionFromIcon(section) {
  var link1 = document.querySelector(".col1 ul li a");
  var link2 = document.querySelector(".icon-text a")
  if (section == 'profile') {
    link1.click();
  }else{
    link2.click()
  }
}

//Mostra il form di aggiornamento delle informazioni della playlist
function showFormUpdatePlaylist() {
  const  pl = document.getElementById('modPlaylistButton');
  const playlistID = pl.getAttribute("plid")
  const hiddenID = document.getElementById('updatePLID')
  hiddenID.value = playlistID

  sections.forEach(section  => section.style.display = 'none');
  form.style.display = 'flex'
}

//Mostra la sezione di ricerca delle playlist (tag e canzone)
function showSearchSection() {
  sections.forEach(section  => section.style.display = 'none');
  searchPL.style.display = 'flex';
  titleSection[0].style.display = 'block'
  document.getElementById('search-container-pl').style.display = 'flex'
}

//----------------------------- SEZIONE UTENTE ----------------------------


// Esegui il fetch delle informazioni utente dal backend (username) e lo mostra nella navbar della dashboard
async function welcome() {
  await fetch('/user/info')
    .then(response => response.json())
    .then(data => {
      const userDiv = document.getElementById('user-info');
      userDiv.textContent = `${data.username}`;
    })
    .catch(error => console.error('Errore nel recupero delle informazioni utente:', error));
}

// Riempe con informazioni del profilo la sezione di gestione del profilo della dashboard
async function profile() {
  await fetch('/user/info')
    .then(response => response.json())
    .then(data => {
      const infoUser = document.querySelectorAll('form div span');
      infoUser[0].textContent = `${data.username}`;
      infoUser[1].textContent = `${data.email}`;
      infoUser[2].textContent = `${data.password}`;
    })
    .catch(error => console.error('Errore nel recupero delle informazioni utente:', error));
}


//Funzione che permette di modificare l'interfaccia una volta che si sceglie di modificare un campo nella gestione utente
function modProfile(element, info) {
  const inputName = "new" + info
  const input = document.getElementById(inputName);
  const spanName = info.toLowerCase() + "Box";
  const spanTag = document.getElementById(spanName);

  if (input.style.display === 'inline-block') {
    input.style.display = 'none';
    spanTag.style.display = 'inline-block';
    element.classList.add('fa-pen');
    element.classList.remove('fa-xmark');
  } else {
    spanTag.style.display = 'none';
    input.style.display = 'inline-block';

    element.classList.add('fa-xmark');
    element.classList.remove('fa-pen');
  }
}

//Invio nuove informazioni utente con gestione degli errori
document.getElementById('updateUserForm').addEventListener('submit', async (event) =>{
  event.preventDefault()
  const formData = new FormData(event.target);
  const requestBody = {};
  formData.forEach((value, key) => {
    requestBody[key] = value;
  });

  try {
    const response = await fetch('/user/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    // Utilizza la funzione handleResponse per gestire la risposta dal server
    handleResponse(response);
  } catch (error) {
    console.error('Errore durante l\'aggiornamento dell\'utente', error);
  }
})

//Elimina il profilo dell'utente loggato
async function deleteProfile() {
  try {
    const response = await fetch('/user/delete', {
      method: "DELETE"
    });

    await handleResponse(response)

  } catch (error) {
    console.error('Errore durante la richiesta:', error);
  }
}

//Funzione che prende e salva in memoria il token con cui effettuare le richieste alle api di spotify
async function fetchToken() {
  try {
    const response = await fetch('/spotify/token');
    const tokenData = await response.json();
    const token = tokenData.token;
    localStorage.setItem('token', token);
    return token;
  } catch (error) {
    console.error("Errore durante il recupero del token:", error);
    throw error;
  }
}

// Avvia il processo di generazione del token ogni ora
const intervalMs = 60 * 60 * 1000;
fetchToken();
setInterval(fetchToken, intervalMs);


//----------------------------- SEZIONE PLAYLIST UTENTE ----------------------------

//Aggiungta dei tag descrittivi e delle canzoni aggiunte come array nel form per la creazione di una playlist
document.getElementById('create-form').addEventListener('submit', async (event) => {
  event.preventDefault();

  const tagsInput = document.getElementById('tagsInput').value;
  // Divide il testo in base alle virgole e rimuove eventuali spazi
  const tagsArray = tagsInput.split(',').map(tag => tag.trim());

  // Imposta l'array di tag nell'input hidden
  document.getElementById('tagsArray').value = JSON.stringify(tagsArray);
  document.getElementById('newSongsArray').value = JSON.stringify(selectedTrackIds);

  const formData = new FormData(event.target);
  const requestBody = {};
  formData.forEach((value, key) => {
    requestBody[key] = value;
  });

  try {
    const response = await fetch('/playlist/private/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    handleResponse(response);

    //Restore campi input
    const playlistNameInput = document.getElementById('namePlaylist');
    const descriptionInput = document.getElementById('descPlaylist');
    const tagsInputRefresh = document.getElementById('tagsInput');

    playlistNameInput.value = '';
    descriptionInput.value = '';
    tagsInputRefresh.value = '';
  } catch (error) {
    console.error('Errore durante la creazione della playlist:', error);
  }
});


//MOSTRARE PLAYLIST DELL'UTENTE LOGGATO
const user_playlists = document.getElementById('grid-pl-list1')

const titleSection = document.getElementsByClassName('title-hide');
const icon_privacy = document.querySelector('.userPL-details .info-PL i');


//Funzione per mostrare le proprie playlist
async function displayUserPlaylist() {
  await fetch('/playlist/private')
    .then(response => response.json())
    .then(data => {
      data.forEach((playlist, index) => {
        const userPL = document.createElement('div');
        userPL.classList.add('grid-elem');

        userPL.textContent = playlist.namePlaylist;
        user_playlists.appendChild(userPL);

        var playlistID = playlist._id;
        userPL.setAttribute("playlistID", `${playlistID}`)

        userPL.onclick = async function() {

          await showDetailsPlaylistUser(userPL.getAttribute("playlistID"))
          document.getElementById('modPlaylistButton').setAttribute("PLID", playlistID)
        };
      })
    })
    .catch(error => console.error('Errore nel recupero delle proprie playlist: ', error));
}

//Mostra i dettagli della playlist scelta
async function showDetailsPlaylistUser(playlistID) {
  await fetch(`/playlist/private/info/${playlistID}`)
    .then(response => response.json())
    .then(async playlist => {

      const songTableBody = document.querySelector('.userPL-details .song-table tbody');
      songTableBody.innerHTML = ''
      var durataTot = 0;
      selectedTrackIds[0] = playlistID //primo elemento dell'array è l'id della playlist 
      selectedTrackIds.length = 1
      
      document.getElementById('added-tracks2').innerHTML = '';
  
  
      const userPLDetailsSection = document.querySelector('.userPL-details');
      titleSection[1].style.display = 'none';

      user_playlists.style.display = 'none';
      userPLDetailsSection.style.display = 'block';
  
      //Riempio dettagli playlist (nome, descrizone, autore, tag, durata totale)
      document.querySelector('.userPL-details h1').textContent = playlist.namePlaylist;
      document.querySelector('.userPL-details h3').textContent = playlist.description;
      const tagsDiv = document.getElementById('tag-pl-usr');
      var tagsString = ""
      for (const tag of playlist.tagsArray) {
        tagsString  += " " +  tag;
      }
  
      tagsDiv.innerText = tagsString
  
      if (playlist.privacy == "private") {
        icon_privacy.classList.remove('fa-globe');
        icon_privacy.classList.add('fa-lock');
      }else{
        icon_privacy.classList.remove('fa-lock');
        icon_privacy.classList.add('fa-globe');
      }
  
      //Creazione dettagli playlist
      var counter = 0;
      while (songTableBody.firstChild) {
        songTableBody.removeChild(songTableBody.firstChild);
      }
  
      for (const idSong of playlist.songsArray) {
        counter += 1;
        const song = await getInfoSong(idSong);
        durataTot += song.duration_ms;
        const row = document.createElement('tr');
        const durata = MsToMin(song.duration_ms);
        
        row.innerHTML = `
          <td>${counter}</td>
          <td>${song.name}</td>
          <td>${song.artists.map(artist => artist.name).join(', ')}</td>
          <td>${durata}</td>
          <td>${song.album.release_date}</td>
          <td class="del-icons">
            <i class="fa-solid fa-trash del-song" song-id="${idSong}"></i>
          </td>
        `;
        songTableBody.appendChild(row);
      }
      // evento per eliminare canzoni da playlist
      const  button = document.getElementById('modPlaylistButton');

      document.querySelectorAll('.del-song').forEach(icon => {
        icon.addEventListener('click', async function() {
          const songId = this.getAttribute('song-id');
          icon.style.color = 'red'
          //chiamata per eliminare singola canzone (id playlist e id song)
          await deleteSong(button.getAttribute("PLID"), songId)
          await showDetailsPlaylistUser(button.getAttribute("PLID"))
        });
      });

      const durataTotDiv = document.getElementById('durata-pl-usr');
      durataTotDiv.textContent = MsToMin(durataTot) + " min";
    })
    .catch(error => console.error('Errore nel recupero della propria playlist: ', error));
}

//Manda al server la canzone da eliminare, ovvero id della canzone segnata con il cestino rosso
async function deleteSong(playlistID, songId) {
  let data = []
  data[0] = playlistID
  data[1] = songId

  try {
    const response = await fetch('/playlist/private/delete/song', {
      method: "DELETE",
      body: JSON.stringify(data),
      headers: {
        "Content-type": "application/json; charset=UTF-8"
      }
    })
  
    await handleResponse(response)
  } catch (error) {
    console.error('Errore durante la cancellazione dalla playlist:', error);
  }
}
//Permette di modificare una playlist di cui si è proprietari aggiungendo la barra di ricerca utilizzata per ricercare le canzoni 
async function addSong(button) {
  try {
    if (selectedTrackIds.length > 1) {
      button.disabled = true

      const response = await fetch('/playlist/private/add/song', {
        method: "POST",
        body: JSON.stringify(selectedTrackIds),
        headers: {
          "Content-type": "application/json; charset=UTF-8"
        }
      });
      await handleResponse(response)

    }
  } catch (error) {
    console.error('Errore durante l\'aggiunta alla playlist:', error);
  } finally {
    await showDetailsPlaylistUser(selectedTrackIds[0]);
    button.disabled = false
    selectedTrackIds.length = 1
    counter = 0
  }
}



//Permette di mostrare la barra di ricerca per aggiungere canzoni
function showAdding() {
  document.getElementById('search-container-add').style.display = 'flex'
}

//Form di aggiornamento della playlist
document.getElementById('updatePlaylistForm').addEventListener('submit', async (event) => {
  event.preventDefault();

  const tagsInput = document.getElementById('tagsInput2').value;
  const tagsArray = tagsInput.split(',').map(tag => tag.trim());
  document.getElementById('tagsArray2').value = JSON.stringify(tagsArray);

  const formData = new FormData(event.target);
  const requestBody = {};
  formData.forEach((value, key) => {
    requestBody[key] = value;
  });

  try {
    const response = await fetch('/playlist/private/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    handleResponse(response);
  } catch (error) {
    console.error('Errore durante l\'aggiornamento della playlist:', error);
  }

  const tagsInputRefresh = document.getElementById('tagsInput2');
  tagsInputRefresh.value = '';

})

//Elimina la playlist dal menu a tre punti
async function deletePlaylist() {
  const  pl = document.getElementById('modPlaylistButton');
  const playlistID = pl.getAttribute("plid")

  try {
    const response = await fetch(`/playlist/private/delete/${playlistID}`, {
      method: "DELETE",
    })

    handleResponse(response);
  } catch (error) {
    console.error('Errore durante l\'aggiornamento della playlist:', error);
  }
}

//----------------------------- SEZIONE PLAYLIST PUBBLICHE ----------------------------

//MOSTRARE PLAYLIST PUBBLICHE E IMPORTATE
const public_playlists = document.getElementById('grid-pl-list2');
const importate_playlists = document.getElementById('grid-pl-list3')

//Funzione per mostrare le  playlist pubbliche 
async function displayPubPlaylist() {
  await fetch('/playlist/public')
    .then(response => response.json())
    .then(async data => {

      //data.forEach(async (playlist, index) => {
      for (const playlist of data) {
        const pubPL = document.createElement('div');
        pubPL.classList.add('grid-elem');
        const username = await getUsername(playlist.userID)
        pubPL.innerHTML = `<div>${playlist.namePlaylist} <span>di</span> @${username} </div>`
        pubPL.setAttribute("playlistID", `${playlist._id}`)

        public_playlists.appendChild(pubPL);
        pubPL.onclick = async function() {
          await showDetailsPlaylistPub(pubPL.getAttribute("playlistID"), "pub")
        };
      }
      //});
    })
    .catch(error => console.error('Errore nel recupero delle playlist: ', error));
}

//Mostra i dettagli della playlist pubblica scelta
const iconLikeZone = document.getElementById('addPlaylistFav')
const iconLike = document.querySelector("#addPlaylistFav i")

async function showDetailsPlaylistPub(playlistID, fromSection) {
  await fetch(`/playlist/public/info/${playlistID}`)
    .then(response => response.json())
    .then(async playlist => {
      var durataTot = 0;

      const pubPLDetailsSection = document.querySelectorAll('.pubPL-details');
      pubMenu.style.display = 'none'
      searched_playlists.style.display = 'none'
      var title1, title3, tagsDiv, songTableBody, durataTotDiv;
      if (fromSection == 'search') {
        title1 = document.querySelector('.searchPL .pubPL-details h1')
        title3 = document.querySelector('.searchPL .pubPL-details h3')
        tagsDiv = document.getElementById('tag-pl-pub-search');
        songTableBody = document.querySelector('.searchPL .pubPL-details .song-table tbody');
        durataTotDiv = document.getElementById('durata-pl-pub-search');


        pubPLDetailsSection[0].style.display = 'block'
      } else {
        title1 = document.querySelector('#section-public-pl .pubPL-details h1')
        title3 = document.querySelector('#section-public-pl .pubPL-details h3')
        tagsDiv = document.getElementById('tag-pl-pub');
        songTableBody = document.querySelector('#section-public-pl .pubPL-details .song-table tbody');
        durataTotDiv = document.getElementById('durata-pl-pub');

        pubPLDetailsSection[1].style.display = 'block'
      }

      titleSection[0].style.display = 'none';
      document.getElementById('search-container-pl').style.display = 'none'


      //Riempio dettagli playlist (nome, descrizone, autore, tag, durata totale)
      title1.textContent = playlist.namePlaylist;
      title3.textContent = playlist.description;

      var tagsString = ""

      for (const tag of playlist.tagsArray) {
        tagsString += " " +  tag;
      }

      tagsDiv.innerText = tagsString

      //Creazione dettagli playlist
      while (songTableBody.firstChild) {
        songTableBody.removeChild(songTableBody.firstChild);
      }
      var counter = 0;
      for (const idSong of playlist.songsArray) {
        counter += 1;
        const song = await getInfoSong(idSong);
        durataTot += song.duration_ms;
        const row = document.createElement('tr');
        const durata = MsToMin(song.duration_ms)
        row.innerHTML = `
          <td>${counter}</td>
          <td>${song.name}</td>
          <td>${song.artists.map(artist => artist.name).join(', ')}</td>
          <td>${durata}</td>
          <td>${song.album.release_date}</td>
        `;
        songTableBody.appendChild(row);
      }

      durataTotDiv.textContent = MsToMin(durataTot) + " min";

      //Event listener per icona per importare playlist

      iconLikeZone.addEventListener('mouseover', function() {
        if (fromSection == "pub") {
          iconLike.classList.remove('fa-regular');
          iconLike.classList.remove('fa-x');
          iconLike.classList.add('fa-heart');
          iconLike.classList.add('fa-solid');
        } else {
          iconLike.classList.remove('fa-heart')
          iconLike.classList.add('fa-x')
        }
      });

      iconLikeZone.addEventListener('mouseout', function() {
        if (fromSection == "pub") {
          iconLike.classList.remove('fa-solid');
          iconLike.classList.add('fa-regular');
        } else {
          iconLike.classList.remove('fa-x');
          iconLike.classList.add('fa-heart');
          iconLike.classList.add('fa-solid')
        }

      });

      let isButtonDisabled = false; 
      
      iconLikeZone.addEventListener('click', async function() {
        if (iconLike.classList.contains("fa-x")) {
          await deleteImportata(playlistID);
          return
        }
        if (isButtonDisabled) {
          return; // Esci se il pulsante è disabilitato
        }
        
        isButtonDisabled = true;
      
        try {
          await addImportPL(playlistID);
        } finally {
          isButtonDisabled = false;
        }
      })
    })
}

//Funzione che al click dell'icona cuore aggiunga all'array 'importate' dell'utente l'id della playlist corrispondente
async function addImportPL(playlistID) {

  try {
    const response = await fetch('/playlist/private/importate/add', {
      method: "POST",
      body: JSON.stringify([playlistID]),
      headers: {
        "Content-type": "application/json; charset=UTF-8"
      }
    })
  
    await handleResponse(response)
  } catch (err) {
    console.error('Errore durante la richiesta:', err);
  }

}

//Mostra le playlist importate dall'utente
async function showImportate() {
  await fetch('/playlist/private/importate')
  .then(response => response.json())
  .then(async data => {
    for (const playlist of data) {
      const importataPL = document.createElement('div');
      importataPL.classList.add('grid-elem');

      //ulteriore personalizzazione della card della playlist
      importate_playlists.appendChild(importataPL);

      var playlistID = playlist._id;
      const username = await getUsername(playlist.userID)
      importataPL.innerHTML = `<div>${playlist.namePlaylist} <span>di</span> @${username} </div>`
      importataPL.setAttribute("playlistID", `${playlistID}`)

      importataPL.onclick = async function() {
        iconLike.classList.add('fa-solid')
        iconLikeZone.setAttribute("playlistID", `${playlistID}`)
        await showDetailsPlaylistPub(importataPL.getAttribute("playlistID"), "imp")
      }

    }
  })
  .catch(error => console.error('Errore nel recupero delle playlist importate: ', error));
}

//Elimina playlist importata
async function deleteImportata(playlistID) {
  try {
    const response = await fetch(`/playlist/private/importate/delete/${playlistID}`, {
      method: "DELETE"
    });

    await handleResponse(response)

  } catch (error) {
    console.error('Errore durante la richiesta:', error);
  }

}

//Permette di ottenere il nome dell'utente creatore della playlist tramite l'id dell'utente
async function getUsername(userID) {
  try {
    const response = await fetch(`/playlist/public/nameUser/${userID}`);

    if (!response.ok) {
      throw new Error('Errore nella richiesta');
    }
    const username = await response.json();
    return username; // Restituisci l'username ottenuto dalla richiesta
  } catch (error) {
    console.error('Errore durante la richiesta:', error);
  }
}



//-----------------------------
//TORNARE A LISTA PLAYLIST (si basa sulla sezione su cui si era)
function backToGrid(section) {
  selectedTrackIds = [];
  const pubPLDetailsSection = document.querySelectorAll('.pubPL-details');

  if (section == 'pl') {
    pubMenu.style.display = 'flex'
    pubPLDetailsSection[1].style.display = 'none';
  } else if(section == 'usr') {
    titleSection[1].style.display = 'block';

    document.getElementById('search-container-add').style.display = 'none'

    const userPLDetailsSection = document.querySelector('.userPL-details');
    userPLDetailsSection.style.display = 'none';
    user_playlists.style.display = 'flex';
  }else if (section == 'search') {
    document.getElementById('search-container-pl').style.display = 'flex'
    document.getElementById('searchButton').style.display = 'block'
    titleSection[0].style.display = 'block';
    pubPLDetailsSection[0].style.display = 'none';
    searched_playlists.style.display = 'flex';
  }else {
    sections[1].style.display = 'flex'
    form.style.display = 'none'
    const hiddenID = document.getElementById('updatePLID')
    showDetailsPlaylistUser(hiddenID.value)
  }
}

//Dato id della canzone nella playlist, restituisce le informazioni da mostrare
async function getInfoSong(idSong) {
  try {
    const token = localStorage.getItem('token');

    const response = await fetch(`https://api.spotify.com/v1/tracks/${idSong}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const responseData = await response.json();
    return responseData
  } catch (error) {
    console.error("Errore:", error);
  }
}

//Trasforma durata da ms a min
function MsToMin(durataMS) {
  const totalSeconds = Math.floor(durataMS / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

//-----------------------------
//RICERCA CANZONI E AGGIUNTA NELL'ARRAY DI CANZONI DA AGGIUNGERE ALLA PLAYLIST

//Creazione di una barra di ricerca per le canzoni dato il nome
const searchInput = document.getElementById('searchInput');
const searchInput2 = document.getElementById('searchInput2');
const searchInput3 = document.getElementById('searchInput3');
var counter = 0;

let selectedTrackIds = []; //array dei brani selezionati per la playlist

//Ricerca per aggiungere canzoni alla playlist
searchInput2.addEventListener('input', () => {
  const searchTerm = searchInput2.value;
  const resultsList = document.getElementById('resultsList2');
  const addedTracks = document.getElementById('added-tracks2');

  searchSongs(searchTerm, resultsList, addedTracks);
})

//Ricerca per creazione playlist
searchInput.addEventListener('input', () => {
  const searchTerm = searchInput.value;
  const resultsList = document.getElementById('resultsList');
  const addedTracks = document.getElementById('added-tracks');

  searchSongs(searchTerm, resultsList, addedTracks);
});

//Ricerca canzoni per cercare playlist

const searched_playlists = document.getElementById('grid-pl-list4');
const searchFilter = document.getElementById('searchFilter');

searchInput3.addEventListener('input', () => {
  const searchTerm = searchInput3.value;
  const resultsList = document.getElementById('resultsList3');
  resultsList.style.display = 'block'
  searchFilter.addEventListener('change', () => {
    resultsList.innerHTML = '';
  })
  if (searchFilter.value === 'songs') {
    selectedTrackIds = [];
    searchSongs(searchTerm, resultsList, null);
  }
})

//Sceglie ricerca per tag o per canzone
async function searchingPL() {
  searched_playlists.innerHTML = '';
  searched_playlists.style.display = 'flex'
  var playlists = []

  if (searchFilter.value === 'songs') {
    playlists = await searchBySong();
  } else {
    playlists = await searchByTag(searchInput3.value);
  }

  for (const playlist of playlists) {
    const pubPL = document.createElement('div');
    pubPL.classList.add('grid-elem');
    const username = await getUsername(playlist.userID)
    pubPL.innerHTML = `<div>${playlist.namePlaylist} <span>di</span> @${username} </div>`
    pubPL.setAttribute("playlistID", `${playlist._id}`)

    searched_playlists.appendChild(pubPL);
    pubPL.onclick = async function() {
      document.getElementById('searchButton').style.display = 'none'
      await showDetailsPlaylistPub(pubPL.getAttribute("playlistID"), "search")
    };
  }
}

//Ricerca per canzone
async function searchBySong() {
  // const playlists = await response.json();
  try {
    const response =  await fetch(`/playlist/public/searchBySong/${selectedTrackIds[0]}`, {
      method: "GET"
    });
    const data = await handleResponse(response)

    if (response.ok) {
      return data.playlists
    }  else {
      console.error(data.error);
    }
  } catch (error) {
    console.error('Errore durante la richiesta:', error);
  }
}

//Ricerca per tag
async function searchByTag(tag) {
  try {
    const response =  await fetch(`/playlist/public/searchByTag/${tag}`, {
      method: "GET"
    });
    const data = await handleResponse(response)
    if (response.ok) {
      return data.playlists
    } else {
      console.error(data.error);
    }
  } catch (error) {
    console.error('Errore durante la richiesta:', error);
  }

}

//Cerca canzoni attraverso le api e il titolo dato
async function searchSongs(searchTerm, resultsList, addedTracks) {
  // Toglie lista di risultati se clicco sullo schermo al di fuori di essa
  document.addEventListener('click', function(event) {
    // Verifica se il clic è avvenuto all'interno della lista dei risultati
    if (!resultsList.contains(event.target) && addedTracks === null) {
      // resultsList.style.display = 'none';
    }
  });

  if (searchTerm.trim() === '') {
    resultsList.innerHTML = '';
    return;
  }

  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`https://api.spotify.com/v1/search?q=${searchTerm}&type=track&limit=5`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await response.json();

    displayResults(data.tracks.items, resultsList, addedTracks);
  } catch (error) {
    console.error('Errore durante la ricerca delle canzoni:', error);
  }
}

//Mostra tramite html l'elenco di canzoni trovate
function displayResults(tracks, resultsList, addedTracks) {
  resultsList.innerHTML = '';

  if (tracks.length === 0) {
    resultsList.innerHTML = '<li>Nessun risultato trovato.</li>';
    return;
  }

  tracks.forEach(track => {
    const li = document.createElement('li');
    const i = document.createElement('i');
    i.classList.add('fa-solid');
    i.classList.add('fa-plus');
    li.innerHTML = `<span>${track.name} - ${track.artists.map(artist => artist.name).join(', ')}</span>`;

    i.addEventListener('click', () => {
      // Chiama la funzione passando i dati del brano
      addTrackPlaylist(track, addedTracks, resultsList);
    });


    resultsList.appendChild(li);
    li.appendChild(i)

    document.querySelectorAll('.clear-icon').forEach(icon => {
      icon.addEventListener('click', function() {
        searchInput.value = ''; 
        searchInput2.value = '';
  
        resultsList.innerHTML = ''; // Rimuovi i risultati della ricerca
      });
    });

  });
}

function addTrackPlaylist(track, addedTracks, resultsList) {
  const trackId = track.id;
  if (!selectedTrackIds.includes(trackId)) {
    selectedTrackIds.push(trackId);
    counter++;

    searchInput.value = ''; 
    searchInput2.value = ''; 
    resultsList.innerHTML = '';  

    if (addedTracks !== null) {
      const trackNameElement = document.createElement('p');
      trackNameElement.textContent = `${counter}) ${track.name} - ${track.artists.map(artist => artist.name).join(', ')}`;
      addedTracks.appendChild(trackNameElement);
    }else{
      searchInput3.value = `${track.name} - ${track.artists.map(artist => artist.name).join(', ')}`;
    }
  }
}


//HANDLING ERRORS 
const messageUser = document.getElementById('user-message')
const textMessage = document.getElementById('message-text')

async function handleResponse(response) {
  messageUser.style.display = 'block'

  setTimeout(function() {
    messageUser.style.display = 'none';
    messageUser.innerText = ''
  }, 2000); 

  if (response.ok) {
    const data = await response.json();
    if (data.error) {
      //Errore
      messageUser.style.backgroundColor = "red"
      textMessage.innerText = data.error
    } else if (data.message) {
      //Successo
      messageUser.style.backgroundColor = "green"
      messageUser.innerText = data.message
    }

    if (data.success && data.redirectUrl) {
      // Reindirizza l'utente alla pagina specificata
      setTimeout(function() {
        window.location.href = data.redirectUrl;
      }, 2000);
    }
    return data

  } else {
    try {
      const data = await response.json();
      if (data.error) {
        // Errore
        messageUser.style.backgroundColor = "red";
        textMessage.innerText = data.error;
      }
    } catch (error) {
      console.error(`Errore nella richiesta: ${response.status}`);
    }
  }

}

