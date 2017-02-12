let server = {
  send(route, data) {
    data.ts = new Date().getTime();
    primus.write({route, data});
  }
};

function applyInput(player, input){
  if(!player){
    return;
  }

  if(input.w){
    player.vel.y -= foo.speed;
  } else if(input.s){
    player.vel.y += foo.speed;
  } else {
    // player.vel.y = 0;
  }

  if(input.a){
    player.vel.x -= foo.speed;
  } else if(input.d){
    player.vel.x += foo.speed;
  } else {
    // player.vel.x = 0;
  }
}

let foo = new Demo('test', function(dt){
  applyInput(foo.thisPlayer, foo.keyMap);

  pdt = Math.max(pdt - dt, 0);
  var blah = (foo.physics-pdt) / foo.physics;

  foo.players.forEach(p => {
    p.x = lerp(p.x, p._x + p.vel.x, blah);
    p.y = lerp(p.y, p._y + p.vel.y, blah);
  });
});

foo.players = new Map();
foo.pendingInputs = [];
foo.inputNum = 0;
foo.keyMap = {};
foo.speed = 0.1;
foo.physics = 15;

let ptime = new Date().getTime();
let pdt = new Date().getTime();

function setupInput(){
  keyDownHandler = function(e){
    var key = e.code.replace('Key','').toLowerCase();
    foo.keyMap[key] = true;
  };

  keyUpHandler = function(e){
    var key = e.code.replace('Key','').toLowerCase();
    foo.keyMap[key] = false;
  };

  document.addEventListener('keydown', keyDownHandler);
  document.addEventListener('keyup', keyUpHandler);

  foo.keyMap = new Proxy({}, {
    get: function(target, prop){
      if (prop === 'toJSON') {
        return () => target;
      }
      if (prop === 'toString') {
        return () => target;
      }
      return target[prop];
    },
    set: function(target, prop, val){
      if(target[prop] != val){
        foo.keysChanged = true;
      }
      target[prop] = val;

      return true;
    }
  });
}

function processInputs(){
  // if(foo.keysChanged){
    let input = {
      keys: foo.keyMap,
      num: foo.inputNum++,
    };

    server.send('keyEvent', input);
    // foo.keysChanged = false;
    // foo.pendingInputs.push(input);
  // }
}

function lerp(v0, v1, t) {
  return v0*(1-t)+v1*t;
}

function physicsLoopUpdate(){
  processInputs();

  let now = new Date().getTime();
  pdt = (now - ptime);
  ptime = now;
  foo.players.forEach(p => {
    p._x = p.x;
    p._y = p.y;
  });
}

function applyPlayerData(player){
  var p = foo.players.get(player.id);
  if(!p){
    return;
  }
  p.vel.x = player.vel.x;
  p.vel.y = player.vel.y;
  p.x = player.x;
  p.y = player.y;
}

function applyBatchPlayerData(data){
  data.players.forEach((player) => {
    applyPlayerData(player);
    if(player.id === foo.thisPlayer._id) {
      foo.pendingInputs.forEach((input, i) => {
        if(input.num <= data.inputs[player.id]){
          foo.pendingInputs.splice(i, 1);
        } else {
          // applyInput(input.keys);
        }
      });
    }
  });
}

function thisPlayerJoined(data){
  console.log('connected');
  foo.thisPlayer = createNewPlayer(data);
}

function createNewPlayer(data){
  // let player = foo.players.find(p => p._id === data.id) !== undefined;
  let player = foo.players.get(data.id);

  if(!player){
    console.log('new player joined');
    player = foo.createEntity(100, 100, !data.ai);
    player._id = data.id;
    player._x = player.x;
    player._y = player.y;
    foo.players.set(player._id,player);
    foo.stage.addChild(player);
  }

  return player;
}

function removePlayer(data) {
  players.delete(data.id);
}

setupInput();
setInterval(physicsLoopUpdate, foo.physics);
foo.animate();

primus.on('data', function received(data) {
  switch(data.type){
    case 'player': applyPlayerData(data.player);
      break;
    case 'players': applyBatchPlayerData(data);
      break;
    case 'client_id': thisPlayerJoined(data);
      break;
    case 'player_joined': createNewPlayer(data);
      break;
    case 'player_left': removePlayer(data);
      break;
  }
});
