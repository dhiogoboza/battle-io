// Global configuration options for IOGrid back end

module.exports = {
  // Having a large world (lower player density) is more efficient.
  // You can divide it up into cells to split up the workload between
  // multiple CPU cores.
  //WORLD_WIDTH: 4000,
  //WORLD_HEIGHT: 4000,
  WORLD_WIDTH: 2000,
  WORLD_HEIGHT: 2000,
  // Dividing the world into tall vertical strips (instead of square cells)
  // tends to be more efficient (but this may vary depending on your use case
  // and world size).
  //WORLD_CELL_WIDTH: 1000,
  //WORLD_CELL_HEIGHT: 4000,
  WORLD_CELL_WIDTH: 2000,
  WORLD_CELL_HEIGHT: 2000,
  /*
    The WORLD_CELL_OVERLAP_DISTANCE allows players/states from two different
    cells on the grid to interact with one another.
    States from different cells will show up in your cell controller but will have a
    special 'external' property set to true.
    This represents the maximum distance that two states can be from one another if they
    are in different cells and need to interact with one another.
    A smaller value is more efficient. Since this overlap area requires coordination
    between multiple cells.
  */
  WORLD_CELL_OVERLAP_DISTANCE: 150,
  /*
    This is the interval (in milliseconds) within which the world updates itself.
    It also determines the frequency at which data is broadcast to users.
    Making this value higher will boost performance and reduce bandwidth consumption
    but will increase lag. 20ms is actually really fast - If you add some sort of
    motion smoothing on the front end, 50ms or higher should be more than adequate.
  */
  WORLD_UPDATE_INTERVAL: 20,
  // Delete states which have gone stale (not being updated anymore).
  WORLD_STALE_TIMEOUT: 1000,
  // Coins don't move, so we will only refresh them
  // once per second.
  SPECIAL_UPDATE_INTERVALS: {
    1000: ['coin']
  },

  PLAYER_DEFAULT_MOVE_SPEED: 10,
  PLAYER_DIAMETER: 45,
  PLAYER_MASS: 20,

  // Note that the number of bots needs to be either 0 or a multiple of the number of
  // worker processes or else it will get rounded up/down.
  BOT_COUNT: 10,
  BOT_MOVE_SPEED: 5,
  BOT_MASS: 10,
  BOT_DEFAULT_DIAMETER: 45,
  BOT_CHANGE_DIRECTION_PROBABILITY: 0.01,

  COIN_UPDATE_INTERVAL: 1000,
  COIN_DROP_INTERVAL: 400,
  COIN_MAX_COUNT: 5,
  COIN_PLAYER_NO_DROP_RADIUS: 80,
  // The probabilities need to add up to 1.
  COIN_TYPES: [
    {
      type: 4,//orb4
      value:1120,
      radius: 10,
      probability: 0.25
    },
    {
      type: 3,
      value: 101,//orb3
      radius: 10,
      probability: 0.6
    },
    {
      type: 2,
      value: 130,//orb2
      radius: 10,
      probability: 0.1
    },
    {
      type: 1,
      value: 130,//orb1
      radius: 10,
      probability: 0.05
    }
  ],

  // We can use this to filter out properties which don't need to be sent
  // to the front end.
  OUTBOUND_STATE_TRANSFORMERS: {
    coin: genericStateTransformer,
    hit: genericStateTransformer,
    player: genericStateTransformer
  },
  
  HEROS_OPTIONS: [
    { // 0 bot
      baseHealth: 100,
      mana: 5,
      radius: 10, // radius from hit
      diameter: 50,
      mass: 20
    },
    { // hero 1
      baseHealth: 100,
      diameter: 100,
      mass: 20,
      mana: 5,
      skills: [
        {
          type: 'melee',
          damage: 10,
          radius: 100 // radius from hit
        },
        {
          type: 'range',
          damage: 30,
          shotSpeed: 15,
          shotRange: 500,
          radius: 50 // radius from hit
        },
        {
          type:'melee' // FIXME: dash
        },
        {
          type:'melee',
          damage: 70,
          radius: 400 // radius from hit
        }
      ]

    },
    { // hero 2
      baseHealth: 100,
      radius: 5, // radius from hit
      mana: 5,
      skills: [
        {
          type:'range',
          damage: 10,
          shotSpeed: 15,
          shotRange: 500,
          radius: 50
        },
        {
          type:'range',
          damage: 35,
          shotSpeed: 25,
          shotRange: 500,
          radius: 100
        },
        {
          type:'melee' // FIXME: dash
        },
        {
          type:'melee',
          damage: 70,
          radius: 200 // radius from hit
        }
      ],
      diameter: 100,
      mass: 20
        
    }
  ]
};

var privateProps = {
  ccid: true,
  tcid: true,
  mass: true,
  speed: true,
  changeDirProb: true,
  repeatOp: true,
  swid: true,
  processed: true,
  pendingGroup: true,
  group: true,
  version: true,
  external: true,
  iddle: true,
  auxAttackStep: true,
  auxWalkerStep: true,
  lastAttackDelay: true
};

function genericStateTransformer(state) {
  var clone = {};
  Object.keys(state).forEach(function (key) {
    if (!privateProps[key]) {
      clone[key] = state[key];
    }
  });
  return clone;
}
