var uuid = require('uuid');
var SAT = require('sat');

var config = require('./config');

var HIT_DEFAULT_DAMAGE = 1;
var MAX_HITS_BY_PLAYER = 5;

var HitManager = function (options) {
  this.cellData = options.cellData;
  this.herosOptions = options.herosOptions;
  
  var cellBounds = options.cellBounds;
  this.cellBounds = cellBounds;
  this.cellX = cellBounds.minX;
  this.cellY = cellBounds.minY;
  this.cellWidth = cellBounds.maxX - cellBounds.minX;
  this.cellHeight = cellBounds.maxY - cellBounds.minY;

  this.hits = {};
  this.hitCount = 0;
};

HitManager.prototype.addHit = function (player) {
  var heroConfig = config.HEROS_OPTIONS[player.heroId];
  var hitId = heroConfig.hit === "melee" ? "hit-" + player.id : uuid.v4();
  var position = new SAT.Vector(player.x, player.y);
  var hit = {
    id: hitId,
    type: 'hit',
    playerId: player.id,
    subtype: heroConfig.hit,
    damage: heroConfig.damage,
    step: 0,
    x: position.x,
    y: position.y,
    r: heroConfig.radius
  };
  
  if (hit.subtype == "range") {
    hit.direction = player.direction;
    hit.speed = 10;
  }
  
  this.hits[hit.id] = hit;
  this.hitCount++;
  return hit;
};

HitManager.prototype.removeHit = function (playerId) {
  var hit = this.hits["hit-" + playerId];
  if (hit) {
    hit.delete = 1;
    delete this.hits[hit.id];
    this.hitCount--;
  }
};

HitManager.prototype.doesPlayerTouchHit = function (hitId, player) {
  var hit = this.hits[hitId];
  if (!hit) {
    return false;
  }
  var playerCircle = new SAT.Circle(new SAT.Vector(player.x, player.y), Math.ceil(player.width / 2));
  var hitCircle = new SAT.Circle(new SAT.Vector(hit.x, hit.y), hit.radius);
  return SAT.testCircleCircle(playerCircle, hitCircle);
};

module.exports.HitManager = HitManager;
