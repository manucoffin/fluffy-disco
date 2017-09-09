var playerInit = function(tracks){
	var current = 0;
	var current_track = new Audio();

	let music_trigger = document.getElementById('trigger');
	let next_button = document.getElementById('next');
	let answer_button = document.getElementById('answer');
	let answer_container = document.getElementById('answer-container');

	next_button.addEventListener('click', ()=>{
		if( !current_track.paused ){
			current_track.pause();	
		}

		current += 1;
		current_track.src = tracks[current].preview_url;
		current_track.play();	

		music_trigger.innerHTML = 'Pause';

		if( answer_container.innerHTML != ""){
			answer_container.innerHTML = "";
		}
	})

	music_trigger.addEventListener('click', (ev)=>{
		if( current_track.paused ){
			current_track.src = tracks[current].preview_url;
			current_track.play();

			ev.target.innerHTML = 'Pause';
		}
		else{
			current_track.pause();

			ev.target.innerHTML = 'Play';
		}
	})

	answer_button.addEventListener('click', (ev)=>{
		answer_container.innerHTML = "";

		var img = document.createElement('img');
		img.src = tracks[current].album.images[0].url;

		var artist_title = document.createElement('h1');
		artist_title.innerHTML = tracks[current].artists[0].name;

		var song_title = document.createElement('h2');
		song_title.innerHTML = tracks[current].name;

		answer_container.appendChild(artist_title);
		answer_container.appendChild(song_title);
		answer_container.appendChild(img);
	})
}