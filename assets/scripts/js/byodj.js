// Initialize your app
(function () {
  $(function(){
    $('body').on('change', '#locationToggle', toggleLocation);
    $('body').on('click', '#refinePartyList', refinePartyList);

  });

  var myApp = new Framework7();
  var $$ = myApp.$;

  //Soundcloud Shit
  SC.initialize({
      client_id: "b1551dcd4a2479fdd7fccfb9b345762c"
  });

  // My party stuff...
  var myParty = undefined;
  var ws = undefined; // websocket used updates broadcast from server
  var isHost = undefined;
  var playback = {isPlaying:false};
  var nowPlaying = undefined;
  var songsVoted = [];
  var refilling = false;
  // Add view
  var mainView = myApp.addView('.view-main', {
      // Because we use fixed-through navbar we can enable dynamic navbar
      dynamicNavbar: true
  });

  // Generate page to post data about party you're hosting
  function hostParty(){
          mainView.loadContent(
              '<!-- Top Navbar-->' +
              '<div class="navbar">' +
                '<div class="navbar-inner">' +
                  '<div class="left"><a href="index.html" class="back link"><i class="icon icon-back-blue"></i><span>Back</span></a></div>'+
                  '<div class="center sliding">You\'re looking to Party!</div>' +
                '</div>' +
              '<div class="pages">'+
                '<div data-page="hostParty" class="page">'+
                  '<div class="page-content">'+
                  '<div class="content-block-title">Party Details</div>'+
                   '<div class="list-block inset">'+
                     '<ul>'+
                       '<li>'+
                         '<div class="item-content">'+
                           '<div class="item-inner">'+
                             '<div id="nameLabel" class="item-title label">Name</div>'+
                             '<div class="item-input">'+
                               '<input id="partyName" type="text" placeholder="Party name"/>'+
                             '</div>'+
                           '</div>'+
                         '</div>'+
                       '</li>'+
                       '<li>'+
                         '<div class="item-content">'+
                           '<div class="item-inner">'+
                             '<div class="item-title label">Fallback<br> Genre [<small>'+
                             '<a href="#" class="wtf" name="fallback">wtf?</a>'+
                             '</small>]</div>'+
                             '<div class="item-input">'+
                               '<select id="fallBackGenre">'+
                                 '<option>Select a Genre</option>'+
                                 '<option>Classical</option>'+
                                 '<option>Country</option>'+
                                 '<option>Dance</option>'+
                                 '<option>Deep House</option>'+
                                 '<option>Dubstep</option>'+
                                 '<option>Electro</option>'+
                                 '<option>Electronic</option>'+
                                 '<option>Hardcore Techno</option>'+
                                 '<option>Hip Hop</option>'+
                                 '<option>House</option>'+
                                 '<option>Indie Rock</option>'+
                                 '<option>Metal</option>'+
                                 '<option>Pop</option>'+
                                 '<option>Punk</option>'+
                                 '<option>R&B</option>'+
                                 '<option>Rap</option>'+
                                 '<option>Rock</option>'+
                                 '<option>Tech House</option>'+
                                 '<option>Techno</option>'+
                                 '<option>Trance</option>'+
                                 '<option>Trap</option>'+
                               '</select>'+
                             '</div>'+
                           '</div>'+
                         '</div>'+
                       '</li>'+
                       '<li>'+
                         '<div class="item-content">'+
                           '<div class="item-inner">'+
                             '<div class="item-title label">Location [<small>'+
                             '<a href="#" class="wtf" name="location">?</a>'+
                             ']</small></div>'+
                             '<div class="item-input">'+
                               '<label class="label-switch">'+
                                 '<input id="locationToggle" type="checkbox"/>'+
                               '</label>'+
                             '</div>'+
                           '</div>'+
                         '</div>'+
                       '</li>'+
                       '<li class="align-top">'+
                         '<div class="item-content">'+
                           '<div class="item-inner">'+
                             '<div id="descriptionLabel" class="item-title label">Description</div>'+
                             '<div class="item-input">'+
                               '<textarea id="description"></textarea>'+
                             '</div>'+
                           '</div>'+
                         '</div>'+
                       '</li>'+
                     '</ul>'+
                     '<div class="row" style="margin-top:5px;">'+
                       '<div class="col-40" style="float:right;"><a href="#" id="createParty" class="button button-big button-submit">Submit</a></div>'+
                     '</div>'+
                   '</div>'
      );

      return;
  }

  // Generate page content to find a party
  function findParty(){
      mainView.loadContent(
          '<!-- Top Navbar-->' +
          '<div class="navbar">' +
          '  <div class="navbar-inner">' +
              '<div class="left"><a href="index.html" class="back link"><i class="icon icon-back-blue"></i><span>Back</span></a></div>'+
          '    <div class="center sliding">You\'re looking to Party!</div>' +
          '  </div>' +
          '<div class="pages">'+
            '<div data-page="joinParty" class="page">'+
              '<div class="page-content">'+
                '<div class="content-block">'+
                  '<p>You\'re here to party but are not sure how to get where you want to go. Below is a list of our most recent parties. Don\'t see it there? Try out our search or filter based on location. That doesn\'t work? You\'re pretty much <a href="#" class="wtf" name="sol"">SOL</a>...</p>'+
                '</div>'+
                '<div class="content-block-title">Find Party</div>'+
                 '<div class="list-block inset">'+
                   '<ul>'+
                     '<li>'+
                       '<div class="item-content">'+
                         '<div class="item-inner">'+
                           '<div class="item-input">'+
                             '<input id="partyName" type="text" placeholder="Party name"/>'+
                           '</div>'+
                         '</div>'+
                       '</div>'+
                     '</li>'+
                   '</ul>'+
                   '<div class="row" style="margin-top:5px;">'+
                     '<div class="col-40" style="float:right;"><a href="#" id="refinePartyList" class="button button-big button-submit">Submit</a></div>'+
                   '</div>'+
                 '</div>'+
                '<div class="content-block-title">Parties</div>'+
                '<div class="list-block media-list inset">'+
                  '<ul id="parties">'+
                    '<li>'+
                      '<div class="item-content">'+
                        '<div class="item-media">'+
                          '<img src="http://hhhhold.com/160/d/jpg?0" width="80">'+
                        '</div>'+
                        '<div class="item-inner">'+
                          '<div class="item-title-row">'+
                          '<div class="item-title">No parties right now <i class="fa fa-frown-o"></i></div>'+
                        '</div>'+
                        '<div class="item-subtitle">Go host a party!</div>'+
                      '</div>'+
                    '</div>'+
                  '</li>'+
                '</ul>'+
              '</div>'+
            '</div>'+
          '</div>'+
        '</div>'
      );
      var value = $.get('/parties', function(res, status) {
          isHost = false; // If you got to the party this way you ain't the host
          console.log(status);
          // console.dir(res);
          var party, _i, _len;
          var html = '';
          for (_i = 0, _len = res.parties.length; _i < _len; _i++) {
              party = res.parties[_i];
              html += '<li id="/party/' + party.id + '" ><a href="#" class="item-link item-content party">'+
                '<div class="item-media"><img src="http://hhhhold.com/160/d/jpg?'+ party.id +'" width="80"></div>'+
                '<div class="item-inner">'+
                  '<div class="item-title-row">'+
                    '<div class="item-title">'+ party.name + '</div>'+
                  '</div>'+
                  '<div class="item-subtitle">'+ party.genre +'</div>'+
                  '<div class="item-text">'+ party.description +'</div>'+
                '</div></a></li>'
          }
          if(res.parties.length > 0){
            $('#parties').html(html);
          }
      });
      return;
  }

  // Alert box to give details about possibly confusing things
  function wtf(){
    var what = this.name;
      if(what === 'fallback'){
          myApp.alert("Your playlist will be pre-populated and refilled with popular songs from your fallback genre.", "BYO-Dj");
      }
      if(what === 'sol'){
          myApp.alert('Acronym for the words of "Shit Out of Luck." It is used in reference to the state of having run out of all other options, wherein the remaining situation is less than desirable.', "BYO-Dj");
      }
      if(what === 'location'){
          myApp.alert('Allow your guests to find your party based on where it is?', "BYO-Dj");
      }
  }

  function refinePartyList(){
    var partyName = $('#partyName').val();
    $.post('/findParty', {name: partyName}, function(res, status) {
      console.log('refinePartyList[%s]', status);
      console.dir(res);
        var party, _i, _len;
        var html = '';
        for (_i = 0, _len = res.parties.length; _i < _len; _i++) {
            party = res.parties[_i];
            html += '<li id="/party/' + party.id + '" ><a href="#" class="item-link item-content party">'+
              '<div class="item-media"><img src="http://hhhhold.com/160/d/jpg?'+ party.id +'" width="80"></div>'+
              '<div class="item-inner">'+
                '<div class="item-title-row">'+
                  '<div class="item-title">'+ party.name + '</div>'+
                '</div>'+
                '<div class="item-subtitle">'+ party.genre +'</div>'+
                '<div class="item-text">'+ party.description +'</div>'+
              '</div></a></li>'
        }
        if(res.parties.length > 0){
          $('#parties').html(html);
        }else{
          $('#parties').html('<li>'+
                      '<div class="item-content">'+
                        '<div class="item-media">'+
                          '<img src="http://hhhhold.com/160/d/jpg?0" width="80">'+
                        '</div>'+
                        '<div class="item-inner">'+
                          '<div class="item-title-row">'+
                          '<div class="item-title">No parties matched your search... <i class="fa fa-frown-o"></i></div>'+
                        '</div>'+
                        '<div class="item-subtitle">Go host a party!</div>'+
                      '</div>'+
                    '</div>'+
                  '</li>'
                  );
        }
    });
  }

  // Get the location of where you are, used by the host party option to capture browser location.
  var partyLocation = undefined;
  function toggleLocation(){
    $('#locationToggle').css('background', 'orange');
    if(navigator.geolocation){
      navigator.geolocation.getCurrentPosition(function(position){
        partyLocation = {
          lat: position.coords.latitude,
          lon: position.coords.longitude
        }
        $('#locationToggle').css('background', '#4cd964');
        console.dir(partyLocation);
        return;
      });
    }
    else{
      $('#locationToggle').css('background', 'red');
      return;
    }
  }

  // Function to post party details, has form validation stuff
  function createParty(){
      var partyName = $('#partyName').val();
      var fallbackGenre = $('#fallBackGenre').val();
      var description = $('#description').val();
      valid = true;
      if(partyName.length === 0){
          $('#nameLabel').css('color', 'red');
          valid = false;
      }
      else{
          $('#nameLabel').css('color', 'black');
      }
      if(description.length === 0){
          $('#descriptionLabel').css('color', 'red');
          valid = false;
      }
      else{
          $('#descriptionLabel').css('color', 'black');
      }
      if(fallbackGenre === 'Select a Genre'){
          $('#fallBackGenre').css('color', 'red');
          valid = false;
      }
      else{
          $('#fallBackGenre').css('color', 'black');
      }
      if(!valid){
          $('#submitParty').css('background', 'red');
          $('#submitParty').css('border', 'black');
          return;
      }
      $.post(
          '/host',
          { name:partyName,
           genre:fallbackGenre,
           description:description,
           location:partyLocation
          },
          function(res, status) {
          console.log('Host Party[' + status + ']');
          // console.dir(res);
          isHost = true;
          joinParty(res.partyId);
          return;
      });
  }

  // Maybe dont need this...
  function joinParty(e){
    // console.dir(e);


    var html = '<div class="navbar">'+
      '<div class="navbar-inner">'+
        '<div class="left"><a href="#" id="home" class="back link"><i class="fa fa-home fa-lg"></i><span> Home</span></a></div>'+
        '<div id="title" class="center sliding">Party</div>'+
        '<div class="right"><a href="#" id="songSearchPane" data-panel="right" class="open-panel link icon-only"><span style="font-size:200%;padding-bottom:5px;">+</span></a></div>'+
      '</div>'+
    '</div>'+
    '<div class="pages navbar-through">'+
      '<div data-page="media-lists" class="page no-toolbar">'+
        '<div class="page-content">'+
          '<div class="content-block-title">Upcoming Songs</div>'+
          '<div class="list-block media-list inset">'+
            '<ul id="upcomingSongs" style="margin-bottom: 75px;">'+
            '</ul>'+
            '</div>'+
              '</div>'+
                '<div class="list-block media-list" style="position:absolute;bottom:0;left:0;width:100%;margin:0px;margin-top:20px;">'+
                  '<ul id="nowPlaying">'+
                    '<li>'+
                      '<div class="item-content">'+
                        '<div class="item-media"><img id="nowPlayingArtwork" src="'+ 'http://hhhhold.com/88/d/jpg?' + Math.ceil(Math.random() * 100) +'" width="44"/></div>';
                          if(isHost){
                            html += '<div style="margin:10px;margin-right:0px;">'+
                            '<a href="#" id="playPause"><i class="fa fa-play" style="padding:10px;"></i></a>'+
                            '</div>';
                          }
                          html += '<div style="margin:10px;margin-right:25px;">'+
                            '<a href="#" id="skip"><i class="fa fa-fast-forward" style="padding:10px"></i></a>'+
                          '</div>'+
                          '<div class="item-inner" style="padding:2px;">'+
                            '<div class="item-title-row">'+
                            '<div class="item-title"><p style="margin:0px;font-weight:200;margin-right:10px;overflow:hidden;" id="songTitle">Now Playing</p></div>'+
                              '</div>'+
                              '<div class="item-subtitle" style="margin-top:-5px;margin-right:10px;overflow:hidden;"><small ><strong id="username">Loading...</strong></small></div>';
                              if(isHost){
                                html+= '<div id="timeElapsed" style="position:absolute;height:10px;font-size:10px;margin-left:-25px;margin-top:2px;">0:00</div>'+
                                '<div id="timeRemaining" style="position:absolute;height:10px;font-size:10px;margin-top:2px;margin-left: 145px;"></div>'+
                                '<div style="position:absolute;bottom:10px;background:#DDDDDD;width:140px;height:5px;"></div>'+
                                '<div id="progress" style="color:red;margin-left:-2px;position:absolute;bottom:5px;width:2px;height:20px;font-weight:700;">|</div>';
                              }
                            html += '</div>'+
                          '</div>'+
                        '</li>'+
                  '</ul>'+
                '</div>'+
              '</div>'+
            '</div>';
    mainView.loadContent(html);

    var party = undefined;
    if(isNaN(parseInt(e))){
      party = e.target.offsetParent.id;
    }
    else{
      party = '/party/' + e;
    }

    $.get(party, function(res, status){
      console.log('GET party[' + status + ']');
      // console.dir(res);
      myParty = res;
      ws.send(JSON.stringify({joined:res.id}));
      $('#title').html(res.name);
      updateView(res);
    });
  }

  var searchResults = [];
  function songSearch(){
    var songName = $('#songSearch').val();
    if(songName.length > 0){
      soundCloudGET({q: songName, limit:15}, function(tracks){
        $('#searchResultType').html('Seach Results');
        $('#searchHelp').html('Click the + to add a search result to your playlist.');
        // console.dir(tracks);
        var track, _i, _len;
        var html = '';
        searchResults = [];
        for (_i = 0, _len = tracks.length; _i < _len; _i++) {
          track = tracks[_i];
          var artwork = track.artwork;
          var title = track.title;
          var username = track.username;
          var songId = track.id;
          songData = {
            id: songId,
            title: title,
            username: username,
            artwork:artwork,
            votes: 0
          };
          searchResults[songId] = songData;
          html += '<li>'+
            '<div class="item-content">'+
              '<div class="item-media"><img src="'+ artwork +'" style="width:40px"/></div>'+
              '<div class="item-inner">'+
                '<div class="item-title-row">'+
                  '<div class="item-title">'+ title +'</div>'+
                '</div>'+
                '<div class="item-subtitle">'+ username +'</div>'+
              '</div>'+
              '<div class="item-inner" style="width:auto;margin-right:10px;margin-top:7px;">'+
                '<a id="'+ songId +'" href="#" class="searchResult"><i class="fa fa-plus-square fa-2x"></i></a>'+
              '</div>'+
            '</div>'+
          '</li>'
        }
        $('#searchResults').html(html);
      });
    }
    else{
      if(!myParty){
        return;
      }
      getRandomSongsInGenre(myParty, 10, function(tracks){
        $('#searchResultType').html('Suggestions');
        $('#searchHelp').html('Enter title or artist above to search for a song or add one of the suggested tracks below.');

        // console.dir(tracks);
        var track, _i, _len;
        var html = '';
        searchResults = [];
        for (_i = 0, _len = tracks.length; _i < _len; _i++) {
          track = tracks[_i];
          var artwork = track.artwork;
          var title = track.title;
          var username = track.username;
          var songId = track.id;
          songData = {
            id: songId,
            title: title,
            username: username,
            artwork:artwork,
            votes: 0
          };
          searchResults[songId] = songData;
          html += '<li>'+
            '<div class="item-content">'+
              '<div class="item-media"><img src="'+ artwork +'" style="width:40px"/></div>'+
              '<div class="item-inner">'+
                '<div class="item-title-row">'+
                  '<div class="item-title">'+ title +'</div>'+
                '</div>'+
                '<div class="item-subtitle">'+ username +'</div>'+
              '</div>'+
              '<div class="item-inner" style="width:auto;margin-right:10px;margin-top:7px;">'+
                '<a id="'+ songId +'" href="#" class="searchResult"><i class="fa fa-plus-square fa-2x"></i></a>'+
              '</div>'+
            '</div>'+
          '</li>'
        }
        $('#searchResults').html(html);
      });
    }
  }

  function addSongToPlaylist(songs){
    var songData = [];
    if(songs.target){
      songData.push(searchResults[parseInt(this.id)]);
    }
    else{
      songData = songs;
    }
    $.post('/party/'+myParty.id+'/addSongs', {songs: songData}, function(res, status){
      console.log('POST addSongs[' + status + ']');
      // console.dir(res);
    });
  }

  function handleVote(){
    var songId = this.id;
    songsVoted[songId] = true;
    var change = ($(this).hasClass('fa-caret-up')) ? 1 : -1;
    $.post('/party/'+myParty.id+'/handleVote', {songId:songId, voteChange: change}, function(res, status){
      console.log('POST handleVote[' + status +']');
    });
  }


  function updateView(party){
    console.log('updateView');
    // Update upcoming songs
    var song, _i, _len;
    var now_playing = party.nowPlaying;
    if(now_playing === undefined){
      var artwork = 'http://hhhhold.com/88/d/jpg?' + Math.ceil(Math.random() * 100);
      now_playing = {title:'Now Playing', username: 'Loading...', artwork: artwork, duration:0};
    }
    var html = '';
    for (_i = 0, _len = party.songs.length; _i < _len; _i++) {
      song = party.songs[_i];
      var visibility = (songsVoted[song.id]) ? 'hidden' : 'visible';
      html += '<li>'+
        '<div class="item-content">'+
          '<div class="item-media"><img src="'+ song.artwork +'" style="width:40px"/></div>'+
          '<div class="item-inner">'+
            '<div class="item-title-row">'+
              '<div class="item-title">'+ song.title +'</div>'+
            '</div>'+
            '<div class="item-subtitle">'+ song.username +'</div>'+
          '</div>'+
          '<div class="item-inner" style="width:auto;padding-right:0px;">'+
            '<div style="position:absolute;width:auto;top:33px;padding-left:5px;">'+
              '<small>'+ parseInt(song.votes) +'</small>'+
            '</div>'+
            '<a href="#"><i id="'+ song.id +'" class="fa fa-caret-up fa-2x vote vote_'+ song.id +'" style="visibility:'+ visibility +'"></i></a>'+
            '<a href="#"><i id="'+ song.id +'" class="fa fa-caret-down fa-2x vote vote_'+ song.id +'" style="visibility:'+ visibility +'"></i></a>'+
          '</div>'+
        '</div>'+
      '</li>'
    }

    $('#upcomingSongs').html(html);
    $('#nowPlayingArtwork').attr('src', now_playing.artwork)
    $('#songTitle').html(now_playing.title);
    $('#username').html(now_playing.username);
    if(nowPlaying === undefined){
      $('#timeRemaining').html('-'+prettyTime(now_playing.duration));
    }

    // Host specific maintenance...
    if(isHost){
      if(party.songs.length <= 2 && !refilling){
        refilling = true;
        getRandomSongsInGenre(party, 5, function(tracks){
          refilling = false;
          addSongToPlaylist(tracks);
        })
      }
      if((nowPlaying === void 0) && (myParty.nowPlaying !== undefined)){
        if(myParty.nowPlaying.id){
          console.log('loadingNowPlaying');
          loadNowPlaying();
        }
      }
      else if((myParty.nowPlaying != undefined) && (nowPlaying.id != myParty.nowPlaying.id)){
        loadNowPlaying(function(){
          if(playback.isPlaying){
            nowPlaying.play();
          }
        });

      }
    }
    return;
  }

  function getRandomSongsInGenre(party, numSongs, callback){
    var duration = {
      from : randomInt(60000,80000),
      to : randomInt(150000, 600000)
    };
    soundCloudGET({genres: party.genre.toLowerCase(), duration:duration, limit:numSongs+20}, function(tracks){
      var randTracks = [];
      var have = [];
      var track = undefined;
      while(randTracks.length < numSongs){
        var track = tracks[randomInt(0, tracks.length - 1)];
        if(!have[track.id]){
          randTracks.push(track);
          have[track.id] = true;
        }
        if(have.length === tracks.length){
          break;
        }
      }
      callback(randTracks);
    });
  }
  function soundCloudGET(q, callback){
    results = [];
    // console.dir(q);
    SC.get('/tracks', q, function(tracks){
      // console.dir(tracks);
      var track, _i, _len;
      var html = '';
      results = [];
      for (_i = 0, _len = tracks.length; _i < _len; _i++) {
        track = tracks[_i];

        var artwork = track.artwork_url;
        if(!artwork){
          artwork = 'http://hhhhold.com/88/d/jpg?' + Math.ceil(Math.random() * 100);
        }
        songData = {
          id: track.id,
          title: track.title,
          username: track.user.username,
          artwork: artwork,
          duration: track.duration,
          votes: 0
        };
        results.push(songData);
      }
      callback(results);
    });
  }

  /* TODO

  Credit the uploader as the creator of the sound
  Credit SoundCloud as the source by including one of the logos found here
  Link to the SoundCloud URL containing the work
  If the sound is private link to the profile of the creator

  */

  function playPause(){
    // console.dir(myParty);

    if(nowPlaying === undefined){
      loadNowPlaying(function(){
        playPause();
      });
      return;
    }
    // Music playback is paused...
    if(!playback.isPlaying){
      nowPlaying.play();
      playback.isPlaying = true;
      $('#playPause').html('<i class="fa fa-pause" style="padding:10px;"></i>');
      playback.interval = setInterval(updatePlaybackStatus, 750);
    }
    else{ // Playback is ongoing
      nowPlaying.pause();
      clearInterval(playback.interval);
      $('#playPause').html('<i class="fa fa-play" style="padding:10px;"></i>');
      playback.isPlaying = false;
    }
  }

  function loadNowPlaying(callback){
    SC.streamStopAll();
    SC.stream('/tracks/' + myParty.nowPlaying.id, {autoLoad: true}, function(sound, error){
      if(error){
        console.log('streaming error: ' + error);
      }
      nowPlaying = sound;
      nowPlaying.id = myParty.nowPlaying.id;
      setTimeout(function(){
        if(nowPlaying.bytesLoaded === null){
          console.log('Song failed to load...');
          skipSong();
        }
      }, 2000);
      if(callback){
        callback();
      }
    });
  }

  function skipSong(){
    if(isHost){
      $.post('/party/'+myParty.id+'/skipSong', function(res, status){
        console.log('POST skipSong[' + status + ']');
      });
    }
    else{
      $.post('/party/'+myParty.id+'/voteSkipSong', function(res, status){
        console.log('POST voteSkipSong[' + status + ']');
      });
    }

  }

  function updatePlaybackStatus(){
    var width = 140; // progress bar is 140px
    var duration = nowPlaying.duration;
    var position = nowPlaying.position;
    var offset = Math.ceil(140 * (position / duration));
    $('#progress').css('padding-left', offset + 'px');
    $('#timeElapsed').html(prettyTime(position));
    $('#timeRemaining').html('-' + prettyTime(nowPlaying.durationEstimate - position));
    if(position !== null && duration !== null && position >= duration){
      console.log('position['+position+'] >= duration[' + duration + ']');
      skipSong();
    }
  }

  function prettyTime(ms){
    var x = ms / 1000
    var seconds = x % 60
    x /= 60
    var minutes = x % 60
    x /= 60
    var hours = x % 24
    x /= 24
    var days = x
    var time = '';
    if(Math.floor(hours) >= 1){
      time += Math.floor(hours) + ':';
      time += (Math.floor(minutes) > 10) ? Math.floor(minutes) + ':' : '0' + Math.floor(minutes) + ':';
      time += (Math.floor(seconds) > 10) ? Math.floor(seconds) : '0' + Math.floor(seconds);
    }
    else{
      time += Math.floor(minutes) + ':';
      time += (Math.floor(seconds) > 10) ? Math.floor(seconds) : '0' + Math.floor(seconds);
    }
    return(time);
  }

  function randomInt(min, max) {
    return min + Math.floor(Math.random() * (max - min + 1));
  }

  $(document).ready(function(){
    $$(document).tap('#goJoinParty', findParty);
    $$(document).tap('#goHostParty', hostParty);
    $$(document).tap('.party', joinParty);
    $$(document).tap('.searchResult', addSongToPlaylist);
    $$(document).tap('.vote', handleVote);
    $$(document).tap('#createParty', createParty);
    $$(document).tap('#playPause', playPause);
    $$(document).tap('#skip', skipSong);
    $$(document).tap('#songSearchPane', songSearch);
    $$(document).tap('.wtf', wtf);
    // $('.wtf').click(wtf);
    $$(document).tap('#me', function(){window.open('http://mgingras.ca', '_blank');});
    $$(document).tap('#home', function(){location.reload();});
    $$('#songSearch').on('keyup', songSearch);

    // Hackey workaround for IE
    if (!window.location.origin) {
      window.location.origin = window.location.protocol + "//" + window.location.hostname + (window.location.port ? ":" + window.location.port : "");
    }
    //Websocket config
    var host = location.origin.replace(/^http/, 'ws');
    ws = new WebSocket(host);
    ws.onmessage = function(msg){
      msg = JSON.parse(msg.data);
      // console.log('ws msg:');
      // console.dir(msg);
      if(msg.party){
        myParty = msg.party;
        updateView(msg.party);
      }
      if(msg.ping){
        ws.send(JSON.stringify({pong:true}));
      }
    }
    ws.onerror = function(err){
      console.dir(err);
    }
    ws.onclose = function(err){
      console.dir(err);
    }
  });
})();
