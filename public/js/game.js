var socket = socketCluster.connect({
        codecEngine: scCodecMinBin
    });

window.onload = function () {

        //  Note that this html file is set to pull down Phaser from our public/ directory.
        //  Although it will work fine with this tutorial, it's almost certainly not the most current version.
        //  Be sure to replace it with an updated version before you start experimenting with adding your own code.
    
    var gameContainer = document.getElementById("game-content");
    var preGameContainer = document.getElementById("pre-game");
    var game, playerId, player, playerHeroId;
    users = {};
    coins = {};
    shots = {};
    
    var HEROS_OPTIONS = [
      { // 0 bot
        baseHealth: 100,
        hit: "melee",
        radius: 10, // radius from hit
        damage: 5,
        diameter: 45,
        mass: 20
      },
      { // hero 1
        baseHealth: 100,
        hit: "melle",
        radius: 10, // radius from hit
        damage: 5,
        diameter: 45,
        mass: 20
      },
      { // hero 2
        baseHealth: 100,
        hit: "range",
        radius: 10, // radius from hit
        damage: 5,
        diameter: 45,
        mass: 20
      }
    ];
    
    var HERO_1 = 1;
    var HERO_2 = 2;

    var WORLD_WIDTH = 800;
    var WORLD_HEIGHT = 600;
    var WORLD_COLS;
    var WORLD_ROWS;
    var WORLD_CELL_WIDTH;
    var WORLD_CELL_HEIGHT;
    var PLAYER_LINE_OF_SIGHT = Math.round(window.innerWidth);
    var PLAYER_INACTIVITY_TIMEOUT = 700;
    var USER_INPUT_INTERVAL = 20;
    var COIN_INACTIVITY_TIMEOUT = 2200;
    var ENVIRONMENT;
    var SERVER_WORKER_ID;
    
    var herosTextures = [
      { // bot 0
        up: 'img/bot-back.gif',
        left: 'img/bot-side-left.gif',
        right: 'img/bot-side-right.gif',
        down: 'img/bot-front.gif'
      },
      { // hero 1
        up: 'img/you-back.gif',
        left: 'img/you-side-left.gif',
        right: 'img/you-side-right.gif',
        down: 'img/you-front.gif',
        downAttack: 'img/you-front-attack.gif'
      },
      { // hero 2
        up: 'img/others-back.gif',
        left: 'img/others-side-left.gif',
        right: 'img/others-side-right.gif',
        down: 'img/others-front.gif',
        downAttack: 'img/others-front-attack.gif',
        shotup: 'img/arrow-up.png',
        shotleft: 'img/arrow-left.png',
        shotright: 'img/arrow-right.png',
        shotdown: 'img/arrow-down.png'
      }
    ];

    // Map the score value to the texture.
    var grassTextures = {
      1: 'img/grass-1.gif',
      2: 'img/grass-2.gif',
      3: 'img/grass-3.gif',
      4: 'img/grass-4.gif'
    };
    
    var swordTextures = [
      'img/sword-down.png',
      'img/sword-left.png',
      'img/sword-up.png',
      'img/sword-right.png'
    ];

    // 1 means no smoothing. 0.1 is quite smooth.
    var CAMERA_SMOOTHING = 1;
    var BACKGROUND_TEXTURE = 'img/background-texture.png';

    function initLayout() {
      var x_start = (window.innerWidth - WORLD_WIDTH) / 2;
      var y_start = ((window.innerHeight - WORLD_HEIGHT) / 2) - document.getElementById("game-top").innerHeight;
      
      if (x_start < 0) {
        x_start = 0;
      }
      
      if (y_start < 0) {
        y_start = 0;
      }
      
      gameContainer.style.display = "none";
      preGameContainer.style.display = "block";
      
      centerContainer = document.getElementById("center-container");
      centerContainer.style.left = x_start + "px";
      centerContainer.style.top = y_start + "px";
      
      centerContainer.style.width = WORLD_WIDTH + "px";
      centerContainer.style.height = WORLD_HEIGHT + "px";
      
      var clickHandler = function(obj) { 
        playerHeroId = this.getAttribute("data-heroId");
        gameContainer.style.display = "block";
        preGameContainer.style.display = "none";
        startGame();
      };

      var cards = document.querySelectorAll(".card");
      for (var i = 0; i < cards.length; i++) {
        var current = cards[i];
        current.addEventListener('click', clickHandler, false);
      }
    }

    function startGame() {
      socket.emit('getWorldInfo', null, function (err, data) {
        WORLD_WIDTH = data.width;
        WORLD_HEIGHT = data.height;
        WORLD_COLS = data.cols;
        WORLD_ROWS = data.rows;
        WORLD_CELL_WIDTH = data.cellWidth;
        WORLD_CELL_HEIGHT = data.cellHeight;
        WORLD_CELL_OVERLAP_DISTANCE = data.cellOverlapDistance;
        SERVER_WORKER_ID = data.serverWorkerId;
        ENVIRONMENT = data.environment;

        channelGrid = new ChannelGrid({
          worldWidth: WORLD_WIDTH,
          worldHeight: WORLD_HEIGHT,
          rows: WORLD_ROWS,
          cols: WORLD_COLS,
          cellOverlapDistance: WORLD_CELL_OVERLAP_DISTANCE,
          exchange: socket
        });

        game = new Phaser.Game(WORLD_WIDTH, WORLD_HEIGHT, Phaser.AUTO, gameContainer, {
          preload: preload,
          create: create,
          render: render,
          update: update
        });
      });
    }

    function preload() {
      keys = {
        up: game.input.keyboard.addKey(Phaser.Keyboard.UP),
        down: game.input.keyboard.addKey(Phaser.Keyboard.DOWN),
        right: game.input.keyboard.addKey(Phaser.Keyboard.RIGHT),
        left: game.input.keyboard.addKey(Phaser.Keyboard.LEFT),
        attack: game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR)
      };
      
      wasd = {
        up: game.input.keyboard.addKey(Phaser.Keyboard.W),
        down: game.input.keyboard.addKey(Phaser.Keyboard.S),
        right: game.input.keyboard.addKey(Phaser.Keyboard.D),
        left: game.input.keyboard.addKey(Phaser.Keyboard.A),
        attack: game.input.keyboard.addKey(Phaser.Keyboard.K)
      };

      game.load.image('background', BACKGROUND_TEXTURE);

      var count = herosTextures.length;
      var heroId = 0;
      for (var i = 0; i < count; i++) {
        for (var key in herosTextures[i]) {
          if (herosTextures[i].hasOwnProperty(key)) {
            game.load.image(heroId + '-' + key, herosTextures[i][key]);
          }
        }
        heroId++;
      }

      game.load.image('grass-1', grassTextures[1]);
      game.load.image('grass-2', grassTextures[2]);
      game.load.image('grass-3', grassTextures[3]);
      game.load.image('grass-4', grassTextures[4]);
      
      game.load.image('sword-down', swordTextures[0]);
      game.load.image('sword-left', swordTextures[1]);
      game.load.image('sword-up', swordTextures[2]);
      game.load.image('sword-right', swordTextures[3]);
    }

    function handleCellData(stateList) {
      stateList.forEach(function (state) {
        if (state.type == 'player') {
          updateUser(state);
        } else if (state.type == 'coin') {
          if (state.delete) {
            removeCoin(state);
          } else {
            renderCoin(state);
          }
        } else if (state.type == 'hit') {
          if (state.delete) {
            removeHit(state);
          } else {
            renderHit(state);
          }
        }
      });
      updatePlayerZIndexes();
    }

    var watchingCells = {};

    /*
      Data channels within our game are divided a grids and we only watch the cells
      which are within our player's line of sight.
      As the player moves around the game world, we need to keep updating the cell subscriptions.
    */
    function updateCellWatchers(playerData, channelName, handler) {
      var options = {
        lineOfSight: PLAYER_LINE_OF_SIGHT
      };
      channelGrid.updateCellWatchers(playerData, channelName, options, handler);
    }

    function updateUserGraphics(user) {
      user.sprite.x = user.x;
      user.sprite.y = user.y;

      if (!user.direction) {
        user.direction = 'down';
      }
      
      user.sprite.loadTexture(user.heroId + '-' + user.direction);
      user.label.alignTo(user.sprite, Phaser.BOTTOM_CENTER, 0, 10);
      
      if (user.lastHealth != user.health) {
        var lifePercentage = user.health / HEROS_OPTIONS[user.heroId].baseHealth;
        user.life.width = Math.round(user.sprite.width * lifePercentage);
      }
    }

    function moveUser(userId, x, y) {
      var user = users[userId];
      user.x = x;
      user.y = y;
      updateUserGraphics(user);
      user.clientProcessed = Date.now();

      if (user.id == playerId) {
        updateCellWatchers(user, 'cell-data', handleCellData);
      }
    }

    function removeUser(userData) {
      var user = users[userData.id];
      if (user) {
        user.sprite.destroy();
        user.label.destroy();
        delete users[userData.id];
      }
    }

    function createTexturedSprite(options) {
      var sprite = game.add.sprite(0, 0, options.texture);
      sprite.anchor.setTo(0.5);

      return sprite;
    }

    function createUserSprite(userData) {
      var user = {};
      users[userData.id] = user;
      user.id = userData.id;
      user.swid = userData.swid;
      user.name = userData.name;
      user.heroId = userData.heroId;
      user.attackStep = userData.attackStep || 0;
      user.direction = "down";
      user.health = userData.health;
      user.lastHealth = user.health;

      var textStyle = {
        font: '16px Arial',
        fill: '#666666',
        align: 'center'
      };
      
      user.label = game.add.text(0, 0, user.name, textStyle);
      user.label.anchor.set(0.5);

      user.score = userData.score;
      user.sprite = createTexturedSprite({
        texture: user.heroId + '-' + user.direction
      });

      user.sprite.width = Math.round(userData.diam * 0.73);
      user.sprite.height = userData.diam;
      user.diam = user.sprite.width;

      user.w2 = user.sprite.width / 2;      
      user.h2 = user.sprite.height / 2;

      // User melle attack
      var attackHitbox = game.add.group();
      user.sprite.addChild(attackHitbox);
      
      // User life sprite
      var lifeHitbox = game.add.group();
      user.sprite.addChild(lifeHitbox);
      user.life = lifeHitbox.create(-(user.sprite.width / 2), -user.sprite.height, null);
      var lifeGraphics = game.add.graphics(0, 0);
      lifeGraphics.beginFill(0x00FF00);
      lifeGraphics.drawRect(0, 0, user.sprite.width, 10);
      lifeGraphics.endFill();
      user.life.loadTexture(lifeGraphics.generateTexture());
      
      var lifePercentage = user.health / HEROS_OPTIONS[user.heroId].baseHealth;
      user.life.width = Math.round(user.sprite.width * lifePercentage)

      moveUser(userData.id, userData.x, userData.y);

      if (userData.id == playerId) {
        player = user;
      }
    }

    function updatePlayerZIndexes() {
      var usersArray = [];
      for (var i in users) {
        if (users.hasOwnProperty(i)) {
          usersArray.push(users[i]);
        }
      }
      usersArray.sort(function (a, b) {
        if (a.y < b.y) {
          return -1;
        }
        if (a.y > b.y) {
          return 1;
        }
        return 0;
      });
      usersArray.forEach(function (user) {
        user.label.bringToTop();
        user.sprite.bringToTop();
      });
    }

    function updateUser(userData) {
      var user = users[userData.id];
      if (user) {
        user.score = userData.score;
        user.direction = userData.direction;
        user.heroId = userData.heroId;
        user.attackStep = userData.attackStep;
        user.health = userData.health;
        
        if (userData.attack) {
          user.attack = userData.attack;
        } else {
          user.attack = '';
        }
        
        moveUser(userData.id, userData.x, userData.y);
      } else {
        createUserSprite(userData);
      }
    }

    function removeCoin(coinData) {
      var coinToRemove = coins[coinData.id];
      if (coinToRemove) {
        coinToRemove.sprite.destroy();
        delete coins[coinToRemove.id];
      }
    }

    function renderCoin(coinData) {
      if (coins[coinData.id]) {
        coins[coinData.id].clientProcessed = Date.now();
      } else {
        var coin = coinData;
        coins[coinData.id] = coin;
        coin.sprite = createTexturedSprite({
          texture: 'grass-' + (coinData.t || '1')
        });
        coin.sprite.x = coinData.x;
        coin.sprite.y = coinData.y;
        coin.clientProcessed = Date.now();
      }
    }
    
    function renderHit(hitData) {
      var user = users[hitData.playerId];
      
      if (user) {
        switch(hitData.subtype) {
          case "melee":
            if (!user.sword) {
              var attackHitbox = user.sprite.getChildAt(0);
              user.sword = attackHitbox.create(0, 0, null);
              user.swordDirection = "";
            }
            
            if (user.swordDirection !== user.direction) {
              updateUserSword(user);
            }
            
            break;
          case "range":
            // TODO: add hit to shots list and draw it
            console.log("add shot");
            var hit = shots[hitData.id];
            if (hit) {
              hit.sprite.x = hitData.x;
              hit.sprite.y = hitData.y;
            } else {
              hit = hitData;
              shots[hitData.id] = hit;
              hit.sprite = createTexturedSprite({
                texture: users[hitData.playerId].heroId +  "-shot" + hit.direction
              });
              hit.sprite.x = hitData.x;
              hit.sprite.y = hitData.y;
            }
            
            break;
        }
      }
    }
    
    function removeHit(hit) {
      switch(hit.subtype) {
        case "melee":
          var user = users[hit.playerId];
          if (user && user.sword) {
            user.sword.kill();
            user.sword = undefined;
          }
        break;
        case "range":
          // TODO: remove shot from shots list
          console.log("remove shot");
        break;
      }
    }
    
    function updateUserSword(user) {
      user.swordDirection = user.direction;
      user.sword.loadTexture('sword-' + user.direction);
      switch (user.direction) {
        case "down":
          user.sword.y = user.h2;
          user.sword.x = -user.w2;
          break;
        case "up":
          user.sword.y = -user.sprite.height;
          user.sword.x = -user.w2;
          break;
        case "left":
          user.sword.y = -user.h2;
          user.sword.x = -user.sprite.width;
          break;
        case "right":
          user.sword.y = -user.h2;
          user.sword.x = 0;
          break;
      }
    }

    function create() {
      background = game.add.tileSprite(0, 0, WORLD_WIDTH, WORLD_HEIGHT, 'background');
      game.time.advancedTiming = true;
      
      gameContainer.style.width = WORLD_WIDTH + "px";
      gameContainer.style.height = WORLD_HEIGHT + "px";
      
      game.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

      // Generate a random name for the user.
      var playerName = 'user-' + Math.round(Math.random() * 10000);

      function joinWorld() {
        socket.emit('join', {
          name: playerName,
          heroId: playerHeroId
        }, function (err, playerData) {
          playerId = playerData.id;
          updateCellWatchers(playerData, 'cell-data', handleCellData);
        });
      }

      function removeAllUserSprites() {
        for (var i in users) {
          if (users.hasOwnProperty(i)) {
            removeUser(users[i]);
          }
        }
      }

      if (socket.state == 'open') {
        joinWorld();
      }
      // For reconnect
      socket.on('connect', joinWorld);
      socket.on('disconnect', removeAllUserSprites);
    }

    var lastActionTime = 0;

    function update() {
      var didAction = false;
      var playerOp = {};
      if (keys.up.isDown || wasd.up.isDown) {
        playerOp.u = 1;
        didAction = true;
      }
      if (keys.down.isDown || wasd.down.isDown) {
        playerOp.d = 1;
        didAction = true;
      }
      if (keys.right.isDown || wasd.right.isDown) {
        playerOp.r = 1;
        didAction = true;
      }
      if (keys.left.isDown || wasd.left.isDown) {
        playerOp.l = 1;
        didAction = true;
      }
      if (keys.attack.isDown || wasd.attack.isDown) {
        playerOp.a = 1;
        didAction = true;
      }
      if (didAction && Date.now() - lastActionTime >= USER_INPUT_INTERVAL) {
        lastActionTime = Date.now();
        // Send the player operations for the server to process.
        socket.emit('action', playerOp);
      }
    }

    function render() {
      var now = Date.now();

      if (ENVIRONMENT == 'dev') {
        game.debug.text('FPS:   ' + game.time.fps, 2, 14, "#00FF00");
        if (player) {
          game.debug.text('Score: ' + player.score, 2, 30, "#00FF00");
        }
      }

      for (var i in users) {
        if (users.hasOwnProperty(i)) {
          var curUser = users[i];
          if (now - curUser.clientProcessed > PLAYER_INACTIVITY_TIMEOUT) {
            removeUser(curUser);
          }
        }
      }

      for (var j in coins) {
        if (coins.hasOwnProperty(j)) {
          var curCoin = coins[j];
          if (now - curCoin.clientProcessed > COIN_INACTIVITY_TIMEOUT) {
            removeCoin(curCoin);
          }
        }
      }
    }
    
    initLayout();
};
