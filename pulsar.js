// Mechanics:
// - Pick up the squares/targets and avoid the bullets!
//   - TODO: when captured the target explodes, destroying nearby objects
// - Arrows to move
// - Spacebar to slow down
//
// Dynamics
// - TODO: Ride the bullet to become closer of the targets
// - When the player is caught, she can deattach by moving away from the bullet

FIRST_LEVEL = 1;

FRAMES = {
  PLAYER: 171,
  TOWER: 235,
  GOAL: 311
};

Scene = {};

Scene.Win = function () {
};
Scene.Win.prototype = {
  init: function (params) {
    this.params = params;
  },

  create: function () {
    var text = game.add.text(0.5, 0.5, 'You won!', { fill: '#ffffff', fontSize: '20pt' });
    text.anchor.x = 0.5;
    text.anchor.y = 0.5;
    text.x = game.canvas.width / 2;
    text.y = game.canvas.height / 2;
  },
};

Scene.Game = function () {
};
Scene.Game.prototype = {
  init: function (params) {
    this.params = params;
  },

  nextLevel: function () {
    game.state.start('game', true, false, {level: this.params.level + 1});
  },

  restartLevel: function () {
    game.state.start('game', true, false, {level: this.params.level});
  },

  preload: function () {
    if (!window.music) {
      game.load.audio('music', 'assets/music.mp3');
    }

    game.load.tilemap('fase' + this.params.level, 'assets/fase' + this.params.level + '.json', null, Phaser.Tilemap.TILED_JSON);
    game.load.spritesheet('spritesheet', 'assets/spritesheet.png', 21, 21, -1, 2, 2);

    game.load.image('player', 'assets/player.png');
    game.load.image('tower', 'assets/tower.png');
    game.load.image('bullet', 'assets/bullet.png');

    setas = game.input.keyboard.createCursorKeys();
    btnSlow = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
  },

  create: function () {
    // music.play();
    if (!window.music) {
      music = game.add.audio('music', 1, true);
      music.play();
    }

    game.physics.startSystem(Phaser.Physics.P2JS);
    // game.physics.p2.gravity.y = 1000;
    game.physics.p2.restitution = 0.1;

    bulletGroup = game.add.group();
    towerGroup = game.add.group();

    this.createTilemap();

    debug = game.add.text(0, 0, '', { fill: '#ffffff', fontSize: '8pt' });
  },

  update: function () {
    debug.text = 'DEBUG: ';
  },

  createTilemap: function () {
    try {
      map = game.add.tilemap('fase' + this.params.level);
    } catch (e) {
      game.state.start('win', true, false);
      return;
    }

    map.addTilesetImage('spritesheet', 'spritesheet');

    layerFundo = map.createLayer('fundo');
    layerFrente = map.createLayer('frente');

    map.setCollisionBetween(1, 899);
    game.physics.p2.convertTilemap(map, 'frente');

    map.objects.Objetos.forEach(function (obj) {
      obj.y -= 21;
      if (obj.gid == FRAMES.PLAYER) { // player
        player = new Player(game, obj.x + 10, obj.y + 10);
        game.add.existing(player);
      } else if (obj.gid == FRAMES.TOWER) { // tower
        var tower;
        tower = new Tower(game, obj.x + 10, obj.y + 10, {x: 0.0, y: 0.0});
        tower.numBullets = 8;
        tower.timeLastExplosion = game.time.now - tower.period / 2;
        towerGroup.add(tower);
        gtower = obj; // debug
        if (obj.properties) {
          for (var k in obj.properties) {
            tower[k] = obj.properties[k];
          }
        }
      } else if (obj.gid == FRAMES.GOAL) { //goal
        var goal = game.add.sprite(obj.x + 10, obj.y + 10, 'spritesheet');
        goal.frame = FRAMES.GOAL - 1;
        game.physics.p2.enable(goal);
        goal.body.category = 'goal';
        goal.body.kinematic = true;
        goal.body.data.shapes[0].sensor = true;
      }
    });
  },
};

///////////////

function Player(game, x, y) {
  Phaser.Sprite.call(this, game, x, y, 'player');
  // this.frame = 171 - 1;
  
  this.slowDownFactor = 1.0 / 3;

  game.physics.p2.enable(this);
  this.body.damping = 0.9;
  this.body.onBeginContact.add(this.handleCollision, this); 
  this.body.fixedRotation = true;

  this.speed = 1.5 * 50;
  this.acceleration = 200;
  this.connectedBullet = null;
  this.vel = { x: 0, y: 0 };
}
Player.prototype = Object.create(Phaser.Sprite.prototype);
Player.prototype.constructor = Player;

Player.prototype.handleCollision = function (bodyB, shapeA, shapeB, equation) {
  var key = bodyB && bodyB.sprite ? bodyB.sprite.key : null;
  if (key == 'tower') {
    bodyB.sprite.destroy();
  } else if (key == 'bullet') {
    this.game.state.getCurrentState().restartLevel();
    bodyB.sprite.destroy();
  }

  if (bodyB.category == 'goal') {
    game.state.getCurrentState().nextLevel();
  }
}
Player.prototype.onClick = function () {
  this.centerX = this.game.input.mousePointer.x;
  this.centerY = this.game.input.mousePointer.y;
}
Player.prototype.update = function () {
  this.handleInput();

  debug.text += this.body.velocity.x.toFixed(1) + ", " + this.body.velocity.y.toFixed(1);

  // this.x += this.vel.x;
  // this.y += this.vel.y;

  // if (this.connectedBullet) {
  //   var product = this.vel.x * this.connectedBullet.vel.x +
  //       this.vel.y * this.connectedBullet.vel.y;
  //   var movingAway = product > 0.4;
  //   debug.text += product.toFixed(2);
  //   if (movingAway) {
  //     // this.connectedBullet.destroy();
  //     // this.connectedBullet = null;
  //   } else {
  //     this.centerX = this.connectedBullet.centerX;
  //     this.centerY = this.connectedBullet.centerY;
  //   }
  // }
}
Player.prototype.handleInput = function () {
  this.body.force.x = 0;
  this.body.force.y = 0;

  var curSpeed = this.acceleration * (btnSlow.isDown ? this.slowDownFactor : 1.0);

  if (setas.right.isDown) {
    this.body.force.x += curSpeed;
  }
  if (setas.left.isDown) {
    this.body.force.x -= curSpeed;
  }
  if (setas.up.isDown) {
    this.body.force.y -= curSpeed;
  }
  if (setas.down.isDown) {
    this.body.force.y += curSpeed;
  }
}

///////

function Tower(game, x, y, vel) {
  Phaser.Sprite.call(this, game, x, y, 'tower');
  this.timeLastExplosion = -999999;
  this.period = 2000;
  this.bullets = [];
  this.numBullets = 20;
  this.phase = 0;
  this.bulletSpeed = 50;
  this.vel = vel;

  this.game.physics.p2.enable(this);
  this.body.kinematic = true;
  this.body.data.shapes[0].sensor = true;
  this.body.category = 'tower';
}

Tower.prototype = Object.create(Phaser.Sprite.prototype);
Tower.prototype.constructor = Tower;
Tower.prototype.update = function () {
  this.x += this.vel.x;
  this.y += this.vel.y;

  if (this.x > game.width) {
    this.vel.x = -this.vel.x;
  } else if (this.x < 0) {
    this.vel.x = -this.vel.x;
  }
  if (this.y > game.height) {
    this.vel.y = -this.vel.y;
  } else if (this.y < 0) {
    this.vel.y = -this.vel.y;
  }

  var now = this.game.time.now;
  if (now - this.timeLastExplosion > this.period) {
    this.timeLastExplosion = now;
    this.explode();
  }
}
Tower.prototype.explode = function() {
  var angle, bullet, vel;

  for (angle = this.phase; angle < 2 * Math.PI + this.phase; angle += 2 * Math.PI / this.numBullets) {
    vel = {
      x: this.bulletSpeed * Math.cos(angle) + this.vel.x,
      y: this.bulletSpeed * Math.sin(angle) + this.vel.y
    };
    bullet = new TowerBullet(game, this.centerX, this.centerY, vel);
    bulletGroup.add(bullet);
  }
}

////////

function TowerBullet(game, x, y, vel) {
  Phaser.Sprite.call(this, game, x, y, 'bullet');
  this.vel = vel;
  this.lifespan = 6000;
  this.creationTime = this.game.time.now;
  this.dragDuration = null;
  this.maxDragDuration = 999999999; //500;

  this.game.physics.p2.enable(this);
  this.body.category = 'bullet'
  this.body.kinematic = true;
  this.body.data.shapes[0].sensor = true;
  this.body.x = x;
  this.body.y = y;
  this.body.velocity.x = vel.x;
  this.body.velocity.y = vel.y;
}
TowerBullet.prototype = Object.create(Phaser.Sprite.prototype);
TowerBullet.prototype.constructor = TowerBullet;

TowerBullet.prototype.isOutOfBounds = function () {
  return this.centerX < 0 || this.centerX > this.game.width ||
    this.centerY < 0 || this.centerY > this.game.height;
}
TowerBullet.prototype.isLifespanComplete = function () {
  return this.game.time.now - this.creationTime > this.lifespan;
}
TowerBullet.prototype.update = function () {
}

/////////////////////////////////////////////////////////

var game = new Phaser.Game(400, 300, Phaser.AUTO, '');
// game.state.add('menu', Scene.Menu);
game.state.add('game', Scene.Game);
game.state.add('win', Scene.Win);
game.state.start('game', true, false, {level: FIRST_LEVEL});


