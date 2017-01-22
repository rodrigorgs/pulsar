// Mechanics:
// - Pick up the squares/targets and avoid the bullets!
//   - TODO: when captured the target explodes, destroying nearby objects
// - Arrows to move
// - Spacebar to slow down
//
// Dynamics
// - TODO: Ride the bullet to become closer of the targets
// - When the player is caught, she can deattach by moving away from the bullet

FRAMES = {
  PLAYER: 171,
  TOWER: 235,
  GOAL: 311
};

var game = new Phaser.Game(400, 300, Phaser.AUTO, 'fubajam17', { preload: preload, create: create, update: update });

function preload() {
  game.load.tilemap('fase1', 'assets/fase1.json', null, Phaser.Tilemap.TILED_JSON);
  game.load.spritesheet('spritesheet', 'assets/spritesheet.png', 21, 21, -1, 2, 2);


  game.load.image('player', 'assets/player.png');
  game.load.image('tower', 'assets/tower.png');
  game.load.image('bullet', 'assets/bullet.png');

  setas = game.input.keyboard.createCursorKeys();
  btnSlow = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
}

function createTilemap() {
  map = game.add.tilemap('fase1');
  map.addTilesetImage('spritesheet', 'spritesheet');

  layerFundo = map.createLayer('fundo');
  layerFrente = map.createLayer('frente');

  map.setCollisionBetween(1, 899);
  game.physics.p2.convertTilemap(map, 'frente');

  map.objects.Objetos.forEach(function (obj) {
    console.log(obj.gid);
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
    } else if (obj.gid == FRAMES.GOAL) { //goal
      var goal = game.add.sprite(obj.x + 10, obj.y + 10, 'spritesheet');
      goal.frame = FRAMES.GOAL - 1;
      game.physics.p2.enable(goal);
      goal.body.category = 'goal';
      goal.body.kinematic = true;
      goal.body.data.shapes[0].sensor = true;
    }
  });
}

function create() {
  game.physics.startSystem(Phaser.Physics.P2JS);
  // game.physics.p2.gravity.y = 1000;
  game.physics.p2.restitution = 0.1;

  bulletGroup = game.add.group();
  towerGroup = game.add.group();

  createTilemap();

  // player = new Player(game, 200, 200);
  // game.add.existing(player);

  // tower1 = new Tower(game, 100, 150, {x: 0.0, y: 0.0});
  // tower1.numBullets = 4;
  // tower1.phase = Math.PI / 4;
  // game.add.existing(tower1);
  
  // tower2 = new Tower(game, 300, 150, {x: 0.0, y: 0.0});
  // tower2.numBullets = 8;
  // tower2.phase = Math.PI / 8;
  // game.add.existing(tower2);

  // tower3 = new Tower(game, 230, 150, {x: 0.0, y: 0.0});
  // tower3.numBullets = 8;
  // tower3.timeLastExplosion = game.time.now - tower3.period / 2;
  // towerGroup.add(tower3);

  // tower4 = new Tower(game, 300, 150, {x: 0.0, y: 0.0});
  // tower4.numBullets = 8;
  // tower4.timeLastExplosion = game.time.now - tower4.period / 2;
  // towerGroup.add(tower4);


  debug = game.add.text(0, 0, '', { fill: '#ffffff', fontSize: '8pt' });
  // this.game.input.mouse.capture = true;
}

function update() {
  debug.text = 'DEBUG: ';
  checkCollisionWithBullets();
  checkCollisionWithTowers();
}

function checkCollisionWithBullets() {
  

  if (player.connectedBullet != null) {
    if (player.connectedBullet._bounds == null || !Phaser.Rectangle.intersects(player.getBounds(), player.connectedBullet.getBounds())) {
      player.connectedBullet = null;
    }
  } else {
    var activeBullet = null;
    game.world.children.forEach(function (obj) {
      if (obj instanceof TowerBullet) {
        if (Phaser.Rectangle.intersects(player.getBounds(), obj.getBounds())) {
          activeBullet = obj;
        }
      }
    });
    this.player.connectedBullet = activeBullet;
  }
}

function checkCollisionWithTowers() {
  // game.world.children.forEach(function (obj) {
  //   if (obj instanceof Tower) {
  //     if (Phaser.Rectangle.intersects(player.getBounds(), obj.getBounds())) {
  //       obj.destroy();
  //     }
  //   }
  // });
}

///////////////

function Player(game, x, y) {
  Phaser.Sprite.call(this, game, x, y, 'player');
  // this.frame = 171 - 1;
  
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
  console.log(bodyB.category)
  if (key == 'tower') {
    bodyB.sprite.destroy();
  } else if (key == 'bullet') {
    bodyB.sprite.destroy();
  }

  if (bodyB.category == 'goal') {
    console.log('GOAL!');
  }
}
Player.prototype.onClick = function () {
  console.log('click');
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
  this.bulletDragPeriod = 1000;
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
    // console.log(bullet.body.velocity);
    // bullet.maxDragDuration = this.bulletDragPeriod;
    // this.bullets.push(bullet);
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
  // this.x += this.vel.x;
  // this.y += this.vel.y;

  // var shouldDestroy = false;

  // if (Phaser.Rectangle.intersects(player.getBounds(), this.getBounds())) {
  //   if (this.dragDuration == null) {
  //     this.dragDuration = 0;
  //   } else {
  //     this.dragDuration += this.game.time.elapsedMS;
  //   }
  // } else {
  //   this.dragDuration = null;
  // }
  // shouldDestroy = (this.dragDuration > this.maxDragDuration) || 
  //     this.isLifespanComplete() || this.isOutOfBounds();

  // if (shouldDestroy) {
  //   this.destroy();
  // }
}

