var uuid = require('uuid');
var SAT = require('sat');

var config = require('./config');

var BOT_DEFAULT_DIAMETER = 80;
var BOT_DEFAULT_SPEED = 1;
var BOT_DEFAULT_MASS = 10;
var BOT_DEFAULT_CHANGE_DIRECTION_PROBABILITY = 0.01;

var BotManager = function (options) {
  this.worldWidth = options.worldWidth;
  this.worldHeight = options.worldHeight;
  if (options.botMoveSpeed == null) {
    this.botMoveSpeed = BOT_DEFAULT_SPEED;
  } else {
    this.botMoveSpeed = options.botMoveSpeed;
  }
  this.botMass = options.botMass || BOT_DEFAULT_MASS;
  this.botChangeDirectionProbability = options.botChangeDirectionProbability || BOT_DEFAULT_CHANGE_DIRECTION_PROBABILITY;
  this.botDefaultDiameter = options.botDefaultDiameter || BOT_DEFAULT_DIAMETER;

  this.botMoves = [
    {u: 1},
    {d: 1},
    {r: 1},
    {l: 1}
  ];
};

BotManager.prototype.generateRandomPosition = function (botRadius) {
  var botDiameter = botRadius * 2;
  var position = {
    x: Math.round(Math.random() * (this.worldWidth - botDiameter) + botRadius),
    y: Math.round(Math.random() * (this.worldHeight - botDiameter) + botRadius)
  };
  return position;
};

BotManager.prototype.addBot = function (options) {
  if (!options) {
    options = {};
  }
  
  var botId = uuid.v4();

  var bot = {
    id: botId,
    type: 'player',
    // bots with heroId = 0
    heroId: 0,
    lastAttackDelay: -5,
    subtype: 'bot',
    health: config.HEROS_OPTIONS[0].baseHealth,
    name: options.name || 'bot-' + Math.round(Math.random() * 10000),
    score: options.score || 0,
    speed: options.speed == null ? this.botMoveSpeed : options.speed,
    mass: options.mass || this.botMass,
    diam: config.HEROS_OPTIONS[0].diameter,
    direction: "down1",
    walkerStep: 1,
    attackStep: -1,
    auxAttackStep: -1,
    iddle: 0,
    changeDirProb: this.botChangeDirectionProbability,
    op: {}
  };
  if (options.x && options.y) {
    bot.x = options.x;
    bot.y = options.y;
  } else {
    var radius = Math.round(bot.diam / 2);
    var position = this.generateRandomPosition(radius);
    if (options.x) {
      bot.x = options.x;
    } else {
      bot.x = position.x;
    }
    if (options.y) {
      bot.y = options.y;
    } else {
      bot.y = position.y;
    }
  }

  return bot;
};

BotManager.prototype.removeBot = function (bot) {
  bot.delete = 1;
};

module.exports.BotManager = BotManager;
