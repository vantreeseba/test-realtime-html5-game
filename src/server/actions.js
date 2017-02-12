var desteer = require('./desteer.js');

module.exports = (primus) => {
  let players = [];
  let lastProcessedMessage = {};
  let speed = 0.1;
  let physics = 15;

  for (var i = 0; i < 200; i++) {
    players['desteer-entity-' + i] = {
      x: 500 * Math.random(),
      y: 100 * Math.random(),
      vel: { x: 0, y: 0 },
      id: 'desteer-entity-' + i,
      ai: true,
      target: new desteer.de.math.Vector(Math.random()*600, Math.random()*480)
    };
  }

  let routes = {
    keyEvent(spark, data) {
      let player = players[spark.id];

      if (data.keys.w) {
        player.vel.y -= speed;
      } else if (data.keys.s) {
        player.vel.y += speed;
      } else {
        // player.vel.y = 0;
      }

      if (data.keys.a) {
        player.vel.x -= speed;
      } else if (data.keys.d) {
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
    primus.write({ type: 'client_left', id: spark.id });
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
      let player = players[id];
      primus.write({ type: 'player_joined', id , ai: player.ai});
    });

    players[spark.id] = {
      x: 100,
      y: 100,
      vel: { x: 0, y: 0 },
      id: spark.id
    };

    spark.write({ type: 'client_id', id: spark.id });
    console.log('client logged in with id:', spark.id);
  });

  let foo = 0;
  setInterval(function() {
    foo++;
    let pArray = [];

    if(foo > 60){
      Object.keys(players).forEach(id => {
        let player = players[id];
        player.target = new desteer.de.math.Vector(Math.random()*600, Math.random()*480);
      });
      foo = 0;
    }

    let ents = players.filter(p => p.ai).map(p => new desteer.de.math.Vector(p.x, p.y));
    // let entHeadings = players.filter(p => p.ai).map(p => new desteer.de.math.Vector(p.x, p.y));

    Object.keys(players).forEach(id => {
      let player = players[id];
      if (player.ai) {
        let pos = new desteer.de.math.Vector(player.x, player.y);

        // let sepVec = desteer.de.steer.behaviors.seperate(pos, ents).scale(0.01);
        // let cohVec = desteer.de.steer.behaviors.cohese(pos, ents).scale(0.01);

        var vel = desteer.de.steer.behaviors.seek(pos, player.target, 1);
        // var vel = sepVec.add(cohVec);
        player.vel.x = vel.x;
        player.vel.y = vel.y;
      }

      player.x += player.vel.x;
      player.y += player.vel.y;

      var bar = {
        vel: player.vel,
        x: player.x,
        y: player.y,
        id: player.id,
        ai: player.ai,
      };
      pArray.push(bar);
    });

    primus.write({ type: 'players', players: pArray, inputs: lastProcessedMessage });
  }, physics);
};
