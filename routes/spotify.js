/**
 * This is an example of a basic node.js script that performs
 * the Authorization Code oAuth2 flow to authenticate against
 * the Spotify Accounts.
 *
 * For more information, read
 * https://developer.spotify.com/web-api/authorization-guide/#authorization_code_flow
 */

var express = require('express'); // Express web server framework
var router = express.Router();
var request = require('request'); // "Request" library
var querystring = require('querystring');
var cookieParser = require('cookie-parser');

var client_id = '96263c9c41634fe8b5ca6b8750d09af7'; // Your client id
var client_secret = '98389435816641ddbea66939b2961397'; // Your secret
var redirect_uri = 'http://localhost:3000/spotify/callback/'; // Your redirect uri

var access_token,
    refresh_token,
    user_id,
    playlist_id;

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var stateKey = 'spotify_auth_state';

router.get('/login', function(req, res) {

  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  var scope = 'user-read-private user-read-email playlist-modify-public playlist-modify-private playlist-read-private';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});

router.get('/callback', function(req, res) {
  // your application requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {

        access_token = body.access_token;
        refresh_token = body.refresh_token;

        var options = {
          url: 'https://api.spotify.com/v1/me',
          headers: { 'Authorization': 'Bearer ' + access_token },
          json: true
        };

        // use the access token to access the Spotify Web API
        request.get(options, function(error, response, body) {
        	res.cookie('user_id', body.id);
        	res.cookie('refresh_token', refresh_token);

          res.redirect('/main/' + querystring.stringify({
            access_token: access_token,
            refresh_token: refresh_token
          }));
        });

      } else {
        res.redirect('/#' +
          querystring.stringify({
            error: 'invalid_token'
          }));
      }
    });
  }
});

router.get('/refresh_token', function(req, res) {

  // requesting access token from refresh token
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;
      res.send({
        'access_token': access_token
      });
    }
  });
});

router.get('/search/:query/:title', function(req, res){
	var searchFilters = req.params.query;
	var title = req.params.title;
	// Create a playlist
	user_id = req.cookies.user_id;

	var refresh_token = req.cookies.refresh_token;

	var authOptions = {
	  url: 'https://accounts.spotify.com/api/token',
	  form: {
	    grant_type: 'refresh_token',
	    refresh_token: refresh_token
	  },
	  headers: {
	    'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
	  },
	  json: true
	};

	// Connect to API
	request.post(authOptions, function(error, response, body) {
	  if (!error && response.statusCode === 200) {
	    var access_token = body.access_token

			// Create a playlist named with the variable 'title'	  
			var playlistOptions = {
		    url: "https://api.spotify.com/v1/users/"+ user_id +"/playlists",
		    headers: { 'Authorization': 'Bearer ' + access_token, 'Content-Type': 'application/json' },
		    json: true,
		    body: {
		    	"name": title
		    }
		  };

			request.post(playlistOptions, function(error, response, body){
				playlist_id = body.id;
				let playlist_uri = body.uri;
				const limit = 6;
				const offset = Math.round(Math.random() * 500);
				let searchQuery = "https://api.spotify.com/v1/search?q="+ searchFilters +"&type=track&limit="+ limit + "&offset=" + offset;

				searchSongs(res, searchQuery, offset, searchFilters, limit);
			});	
	  }      	
	})  
})

searchSongs = (res, searchQuery, previousOffset, searchFilters, limit) => {
	// Search for tracks to add to the playlist
	var searchOptions = {
    url: searchQuery,
    headers: { 'Authorization': 'Bearer ' + access_token, 'Content-Type': 'application/json' }
  };

	request.get(searchOptions, function(error, response, body){
		console.log(searchQuery);

		if(response.statusCode !== 200){
			console.log('status !== 200', error );
			const offset = Math.round(Math.random() * previousOffset);
			let newSearchQuery = "https://api.spotify.com/v1/search?q="+ searchFilters +"&type=track&limit="+ limit + "&offset=" + offset;

			searchSongs(res, newSearchQuery, offset, searchFilters, limit);			
		}
	  else if (!error && response.statusCode === 200) {

	  	tracks = JSON.parse(body).tracks.items;
			console.log(tracks.length);

	  	// If the query return no tracks, make a new query with a lower offset
	  	if(tracks.length < limit) {
				const offset = Math.round(Math.random() * previousOffset);
				let newSearchQuery = "https://api.spotify.com/v1/search?q="+ searchFilters +"&type=track&limit="+ limit + "&offset=" + offset;

				searchSongs(res, newSearchQuery, offset, searchFilters, limit);
	  	}
	  	else {
		  	let ids = '';
		  	let uris = '';

		  	tracks.forEach( (track, index) => {
		  		let comma = (index != tracks.length - 1)? ',': '';
		  		ids += track.id + comma;
		  		uris += track.uri + comma;
		  	});

		  	// Add tracks to the playlist
		  	var addTrackOptions = {
		  		url: 'https://api.spotify.com/v1/users/'+ user_id +'/playlists/'+ playlist_id +'/tracks?uris=' + uris,
		  		headers: { 'Authorization': 'Bearer ' + access_token, 'Content-Type': 'application/json' },
		  		json: true,
		  	}
		  	
		  	request.post(addTrackOptions, function(error, response, body){

		  		// Relink tracks so that we always get valid preview_url
			  	var relinkTracksOptions = {
				    url: 'https://api.spotify.com/v1/tracks/?ids=' + ids + '&market=FR',
				    headers: { 'Authorization': 'Bearer ' + access_token, 'Content-Type': 'application/json' }
				  };
			  	request.get(relinkTracksOptions, (error, response, body) => {
			  		res.send(body);
			  	});
		  	})
		  }
	  }
	});
}

module.exports = router;
