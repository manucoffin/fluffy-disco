gameParametersInit = () => {
	let add_player_btn = document.getElementById('add-player-btn');
	let submit = document.getElementById('search-form-submit');

	add_player_btn.addEventListener('click', addPlayer, false);

	submit.addEventListener('click', (ev) => {
		setGameParameters(ev)
		.then((params) => {
			let tracks = params.tracks;
			let players = params.players;

			playerInit(tracks);
		});
	}, false);
}

setGameParameters = (ev) => {
	ev.preventDefault();

	let tracks = [];
	let players = [];

	let title = document.getElementById('playlist-title');
	let input_search = document.getElementById('search-form-query').value;
	let filter = document.querySelector('input[name="filter"]:checked').value;

	let query = ( filter != 'keywords') ? filter + ':' + input_search : input_search;

	return new Promise((resolve, reject) => {
		var xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = function() {
			if (this.readyState == 4 && this.status == 200) {
				const res = JSON.parse(this.responseText);
				for( let track of res.tracks){
					console.log(track);
					tracks.push(track);
				}
				players = createPlayers();

				let params = {tracks: tracks, players: players};
				resolve(params);
			}
			else{

			}
		};
		xhttp.open("GET", "/spotify/search/" + query + "/" + title.value, true);
		xhttp.send();
	});
	
}

createPlayers = () => {
	let players = [];

	// populate players array
	let players_nodes = document.querySelectorAll('.player-name');

	for(let player of players_nodes){
		players.push(player.value);
	}

	return players;
}

addPlayer = (ev) => {
	ev.preventDefault();

	let add_player_form = document.getElementById("add-player-form");

	let form_group = document.createElement('div');
	form_group.setAttribute('class', 'form-group');
	let label = document.createElement('label');
	label.textContent = "Player name:";
	let input = document.createElement('input');
	input.setAttribute('class', 'player-name');

	form_group.appendChild(label);
	form_group.appendChild(input);
	
	add_player_form.insertBefore(form_group, add_player_form.firstChild);
}