var uuid = require('uuid');
var SAT = require('sat');

var HIT_DEFAULT_DAMAGE = 1;
var MAX_HITS_BY_PLAYER = 5;

var heroHits = ["sword"];
var hitSubtypes = {
  "sword": {"radius": 10}
}

var HitManager = function (options) {
  this.cellData = options.cellData;

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
  var hitId = uuid.v4();
  var position = new SAT.Vector(player.x, player.y);
  var damage = player.damage || HIT_DEFAULT_DAMAGE;
  if (player.hitCount < MAX_HITS_BY_PLAYER) {
    var hit = {
      id: hitId,
      type: 'hit',
      playerId: player.id,
      subtype: heroHits[player.heroId],
      damage: damage,
      direction: player.direction,
      step: 0,
      x: position.x,
      y: position.y
    };
    this.hits[hitId] = hit;
    this.hitCount++;
    return hit;
  }
  return null;
};

HitManager.prototype.removeHit = function (hitId) {
  var hit = this.hits[hitId];
  if (hit) {
    hit.delete = 1;
    delete this.hits[hitId];
    this.hitCount--;
  }
};

HitManager.prototype.doesPlayerTouchHit = function (hitId, player) {
  var hit = this.hits[hitId];
  if (!hit) {
    return false;
  }
  var playerCircle = new SAT.Circle(new SAT.Vector(player.x, player.y), Math.ceil(player.width / 2));
  var hitCircle = new SAT.Circle(new SAT.Vector(hit.x, hit.y), hitSubtypes[hit.subtype].radius);
  return SAT.testCircleCircle(playerCircle, hitCircle);
};

module.exports.HitManager = HitManager;
