//Funzione per bottone per scorrere fino alla sezione di cui si passa il parametro
function scrollToSection(sectionId) {
  const section = document.getElementById(sectionId);
  section.scrollIntoView({ behavior: 'smooth' }); //comportamento fluido
  event.preventDefault();
}

//Sezione per mostrare playlist pubbliche nella homepage del sito
const public_playlists = document.getElementById("playlists");

async function displayPlaylists() {
  await fetch('/public/playlists')
    .then(response => response.json())
    .then(async data => {
      for (playlist of data) {
        const pubPL = document.createElement('div');
        pubPL.classList.add('grid-elem');
        const username = await getUsername(playlist.userID)
        pubPL.innerHTML = `<div>${playlist.namePlaylist} <span>di</span> @${username} </div>`

        public_playlists.appendChild(pubPL);
        pubPL.onclick = async function() {
          window.location.href = '/redirect/login';
        };
      }
    })
    .catch(error => console.error('Errore nel recupero delle playlist: ', error));
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

