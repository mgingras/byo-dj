// Schemas:
// *Party:
// {
//  name: String,
//  description: String,
//  genre: String,
//  id: int (auto increments),
//  nowPlaying:song,
//  songs: [song],
//  guests: [Int(clientId)]
// }
//
// *song:
// {
//  title: String,
//  username: String,
//  atwork: String,
//  votes: Int
// }
//
// *client
// {
//   ws_id: int,
//   partyId: int,
//   songsVotedFor: [song]
// }
//

module.exports = function(app, wss){
  var http = require('http');
  var fs = require('fs');


  var ws_connections = []; // Array of ws_connections
  var clients = [];        // Array of client data
  var parties = [];        // Array of parties

  app.get("/", function(req, res){
    fs.readFile(__dirname + '/../public/index.html',function (err, data){
      if(err){
        console.log('Error loading index.html: ' + err);
      }
      res.writeHead(200, {'Content-Type': 'text/html','Content-Length':data.length});
      res.write(data);
      res.end();
    });
  });

  // Get list of parties
  app.get('/parties', function(req, res){
    console.log('GET "/"');
    var openParties = [];
    var party, _i, _len;

    for (_i = 0, _len = parties.length; _i < _len; _i++) {
      party = parties[_i];
      if(party){
        openParties.push(party);
      }
    }
    res.send({parties:openParties});
  });

  // Host a party
  app.post('/host', function(req, res){
    console.log('POST "/host"');
    party = req.body;
    party.id = parties.length;
    party.songs = [];
    party.clients = [];
    party.nowPlaying = undefined;

    parties.push(party);
    res.send({partyId:party.id});
  });

  // Get details for a party
  app.get('/party/:id', function(req, res){
    console.log('GET "/party/:id"');
    var partyId = parseInt(req.params.id);
    res.send(getParty(partyId));
  });

  // Post to this route if you've added a song
  app.post('/party/:id/addSongs', function(req, res){
    console.log('POST "/party/:id/addSongs"');
    var song, _i, _len;

    var songs = req.body.songs;
    var partyId = parseInt(req.params.id);
    var party = getParty(partyId);

    for (_i = 0, _len = songs.length; _i < _len; _i++) {
      song = songs[_i];
      song.votes = parseInt(song.votes);
      party.songs.push(song);
    }
    party.songs.sort(compareSongs);

    if(party.nowPlaying === undefined){
      playNextSong(party);
    }

    updateClients(party);
    res.send({status:'success'});
  });

  app.post('/party/:id/handleVote', function(req, res){
    console.log('POST "/party/:id/handleVote');
    var partyId = parseInt(req.params.id);
    var party = getParty(partyId);
    var body = req.body;

    var song, _i, _len;
    for (_i = 0, _len = party.songs.length; _i < _len; _i++) {
      song = party.songs[_i];
      if(body.songId === song.id){
        // console.log('votes: ' + song.votes);
        song.votes += parseInt(body.voteChange);
        party.songs.sort(compareSongs);
        updateClients(party);
        res.send({status:'success'});
      }
      else{
        res.send({status:'failure', msg:'Couldn\'t find song in party...'});
      }
    }
  });

  app.post('/party/:id/skipSong', function(req,res){
    console.log('POST "/party/:id/skipSong');
    var partyId = parseInt(req.params.id);
    var party = getParty(partyId);
    playNextSong(party);
    updateClients(party);
    res.send({status:'success'});
  });

  /************************** Helper functions... ********************/
  function getParty(partyId){
    console.dir('Looking for party with id: ' + partyId);
    var party, _i, _len;
    for (_i = 0, _len = parties.length; _i < _len; _i++) {
      party = parties[_i];
      if(party !== undefined && party.id === partyId){
        return party;
      }
    }
  }
  // Compare two songs to swee which has more votes
  function compareSongs(a,b){
    return (a.votes >= b.votes) ? -1 : 1;
  }
  // Update current song and upcomign songs
  function playNextSong(party){
    party.nowPlaying = party.songs.shift();
  }

  /************************** End of Helpers... ********************/
  /************************** WS Shit... ********************/
  wss.on('connection', function(ws) {
    var client = {
      ws: ws,
      partyId: -1,
      songsVotedFor: []
    };
    var inParty = false; // Are they in a party and need to be taken out of...
    var id = clients.push(client) - 1;
    var pong = true;
    client.id = id;
    console.log("client connection: " + id);
    ws.send(JSON.stringify({id:id}));

    var interval = setInterval(function(){
      if(!pong){
        clearInterval(interval);
        ws.close();
        return;
      }
      ws.send(JSON.stringify({ping:true}));
      pong = false;
    }, 7500);

    ws.on('message', function(msg) {
      msg = JSON.parse(msg);
      // console.dir(msg);
      if(msg.pong !== void 0){
        pong = true;
      }
      if(msg.joined !== void 0){
        // console.dir(parties);
        clients[id].partyId = msg.joined;
        parties[msg.joined].clients.push(id);
        inParty = true;
      }
    });
    ws.on('close', function() {
      if(interval){
        clearInterval(interval);
      }
      // Take client out of party...
      if(inParty){
        var index = parties[clients[id].partyId].clients.indexOf(id);
        if (index > -1) {
            parties[clients[id].partyId].clients.splice(index, 1);
            // console.dir(parties);
            if(parties[clients[id].partyId].clients.length === 0){
              parties[clients[id].partyId] = undefined;
            }
        }
      }
      clients[id] = undefined;
      console.log('client disconnected: ' + id);
    });
  });

  function updateClients(party){
    // console.dir(party);
    var client, _i, _len;
    for (_i = 0, _len = party.clients.length; _i < _len; _i++) {
      client = clients[party.clients[_i]];
      client.ws.send(JSON.stringify({party:party}));
    }
  }
  /************************** WS Shit ends ********************/
}