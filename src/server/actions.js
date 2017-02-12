module.exports = (primus) => {
  let players = [];
  let lastProcessedMessage = {};
  let speed = 0.1;
  let physics = 15;

  let routes = {
    keyEvent(spark, data) {
      let player = players[spark.id];

      if(data.keys.w){
        player.vel.y -= speed;
      } else if(data.keys.s){
        player.vel.y += speed;
      } else {
        // player.vel.y = 0;
      }

      if(data.keys.a){
        player.vel.x -= speed;
      } else if(data.keys.d){
        player.vel.x += speed;
      } else {
        // player.vel.x = 0;
      }

      lastProcessedMessage[spark.id] = data.num;
    }
  };

  primus.on('disconnection', (spark) => {
    delete players[spark.id];
    delete lastProcessedMessage[spark.id];
    primus.write({type: 'client_left', id: spark.id});
  });

  primus.on('connection', (spark) => {
    spark.on('data', (req) => {
      let route = routes[req.route];
      if (route) {
        route(spark, req.data);
      } else {
        console.log('No route found for: ', req.route);
      }
    });

    Object.keys(players).forEach(id => {
      primus.write({type: 'player_joined', id});
    });

    players[spark.id] = {
      x: 100,
      y: 100,
      vel: {x: 0, y:0},
      id: spark.id
    };

    spark.write({type: 'client_id', id: spark.id});
    console.log('client logged in with id:', spark.id);
  });

  setInterval(function(){
    let pArray = [];
    Object.keys(players).forEach(id => {
      let player = players[id];

      player.x += player.vel.x;
      player.y += player.vel.y;
      pArray.push(player);
    });

    primus.write({type:'players', players: pArray, inputs: lastProcessedMessage});
  }, physics);
};
