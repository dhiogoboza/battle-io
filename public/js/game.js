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
    
    var textStyle = {
      font: '16px Arial',
      fill: '#FFFFFF',
      align: 'center'
    };
    
    var HEROS_OPTIONS = [
      { // 0 bot
        baseHealth: 100,
        mana: 5,
        radius: 10, // radius from hit
        diameter: 50,
        mass: 20,
        skills: []
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
            radius: 200 // radius from hit
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
            damage: 25,
            radius: 200 // radius from hit
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
            damage: 15,
            shotSpeed: 15,
            shotRange: 500,
            radius: 50
          },
          {
            type:'range',
            damage: 15,
            shotSpeed: 15,
            shotRange: 500,
            radius: 50
          },
          {
            type:'melee' // FIXME: dash
          },
          {
            type:'melee',
            damage: 25,
            radius: 200 // radius from hit
          }
        ],
        diameter: 100,
        mass: 20
          
      }
    ];
    
    var HERO_1 = 1;
    var HERO_2 = 2;

    var WORLD_WIDTH = 2000;
    var WORLD_HEIGHT = 2000;
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
   

    // Map the score value to the texture.
    var orbTextures = {
      1: 'img/orb-1.png',
      2: 'img/orb-2.png',
      3: 'img/orb-3.png',
      4: 'img/orb-4.png'
    };
    
    // 1 means no smoothing. 0.1 is quite smooth.
    var CAMERA_SMOOTHING = 1;
    var BACKGROUND_TEXTURE = 'img/background-texture.png';

    function initLayout() {
      var x_start = 0;//(window.innerWidth - WORLD_WIDTH) / 2;
      var y_start = 0;//((window.innerHeight - WORLD_HEIGHT) / 2) - document.getElementById("game-top").innerHeight;
      
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
      
      if (WORLD_WIDTH < window.innerWidth && WORLD_HEIGHT < window.innerHeight) {
        centerContainer.style.width = WORLD_WIDTH + "px";
        centerContainer.style.height = WORLD_HEIGHT + "px";
      } else {
        centerContainer.style.width = window.innerWidth + "px";
        centerContainer.style.height = window.innerHeight + "px";
      }
      
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

        if (WORLD_WIDTH < window.innerWidth && WORLD_HEIGHT < window.innerHeight) {
            w = WORLD_WIDTH;
            h = WORLD_HEIGHT;
          } else {
            w = window.innerWidth;
            h = window.innerHeight;
          }

        game = new Phaser.Game(w, h, Phaser.AUTO, gameContainer, {
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
        attack: game.input.keyboard.addKey(Phaser.Keyboard.Z),
        skill1: game.input.keyboard.addKey(Phaser.Keyboard.X),
        skill2: game.input.keyboard.addKey(Phaser.Keyboard.C),
        skill3: game.input.keyboard.addKey(Phaser.Keyboard.V)
      };
      
      wasd = {
        up: game.input.keyboard.addKey(Phaser.Keyboard.W),
        down: game.input.keyboard.addKey(Phaser.Keyboard.S),
        right: game.input.keyboard.addKey(Phaser.Keyboard.D),
        left: game.input.keyboard.addKey(Phaser.Keyboard.A),
        attack: game.input.keyboard.addKey(Phaser.Keyboard.U),
        skill1: game.input.keyboard.addKey(Phaser.Keyboard.I),
        skill2: game.input.keyboard.addKey(Phaser.Keyboard.O),
        skill3: game.input.keyboard.addKey(Phaser.Keyboard.P)
      };

      game.load.image('background', BACKGROUND_TEXTURE);     
      game.load.audio('music', 'music/Star Commander1.wav');
      game.load.image('avatar', 'img/avatar1.png');
      game.load.image('skill0', 'img/skill0.png');
      game.load.image('skill1', 'img/skill1.png');
      game.load.image('skill2', 'img/skill2.png');
      game.load.image('skilln', 'img/skilln.png');
      game.load.image('z', 'img/z.png');
      game.load.image('x', 'img/x.png');
      game.load.image('c', 'img/c.png');
      game.load.image('hud', 'img/hub.png');

      // Initialize sprites
      var spriteId, spritePath, currentHero;
      var sprites = ["left","right","up", "down"];
      for (var i = 0; i < HEROS_OPTIONS.length; i++) {
        currentHero = HEROS_OPTIONS[i];
        
        for (var j = 0; j < sprites.length; j++) {
          for (var k = 1; k < 5; k++) {
            spriteId = i + '-' + sprites[j] + k;
            spritePath = "heros/" + i + "/" + sprites[j] + k;
            if (i == 1) {
              console.log(spriteId);
            }
            game.load.image(spriteId, "img/sprites/" + spritePath + ".png");
          }
          
          // Iterate over hero skills
          for (var k = 0; k < currentHero.skills.length; k++) {
            for (var l = 1; l < 5; l++) {
              // Hits
              spriteId = i + '-hit' + k + sprites[j] + l;
              spritePath = "heros/" + i + "/hits/" + k + "/" + sprites[j] + l;
              if (i == 1) {
                console.log(spriteId);
              }
              game.load.image(spriteId, "img/sprites/" + spritePath + ".png");
            }
            
            if (currentHero.skills[k].type == "range") {
              spriteId = i + '-shot' + k + sprites[j];
              spritePath = "heros/" + i + "/shots/" + k + "/" + sprites[j];
              if (i == 1) {
                console.log(spriteId);
              }
              game.load.image(spriteId, "img/sprites/" + spritePath + ".png");
            }
          }
        }
      }
      game.load.image('orb-1', orbTextures[1]);
      game.load.image('orb-2', orbTextures[2]);
      game.load.image('orb-3', orbTextures[3]);
      game.load.image('orb-4', orbTextures[4]);
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
        user.direction = 'down1';
      }
      var sprite;
      if (user.attackStep > 0) {
        // FIXME: do not split strings
        sprite = user.heroId + "-hit" + user.currentSkill + user.direction.substring(0, user.direction.length - 1) + user.attackStep;
      } else {
        sprite = user.heroId + "-" + user.direction;
      }
      user.sprite.loadTexture(sprite);
      user.label.alignTo(user.sprite, Phaser.BOTTOM_CENTER, 0, 10);

      if (user.lastHealth != user.health) {
        var lifePercentage = user.health / HEROS_OPTIONS[user.heroId].baseHealth;
        user.life.width = Math.round(user.lifeWidth * lifePercentage);
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
      user.currentSkill = userData.currentSkill || "";
      user.direction = "down1";
      user.health = userData.health;
      user.lastHealth = user.health;
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
      user.lifeWidth = user.sprite.width;
      
      var lifePercentage = user.health / HEROS_OPTIONS[user.heroId].baseHealth;
      user.life.width = Math.round(user.lifeWidth * lifePercentage)

      moveUser(userData.id, userData.x, userData.y);

      if (userData.id == playerId) {
        player = user;
        player.lastMana = -1;
        game.camera.setSize(window.innerWidth, window.innerHeight);
        game.camera.follow(user.sprite, null, CAMERA_SMOOTHING, CAMERA_SMOOTHING);
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
        user.currentSkill = userData.currentSkill;
        user.health = userData.health;

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
          texture: 'orb-' + (coinData.t || '1')
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
            var hit = shots[hitData.id];
            if (hit) {
              hit.sprite.x = hitData.x;
              hit.sprite.y = hitData.y;
            } else {
              hit = hitData;
              shots[hitData.id] = hit;
              hit.sprite = createTexturedSprite({
                texture: users[hitData.playerId].heroId +  "-shot" + hit.skillIndex + hit.direction
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
          var shotToRemove = shots[hit.id];
          if (shotToRemove) {
            shotToRemove.sprite.destroy();
            delete shots[shotToRemove.id];
          }
        break;
      }
    }
    
    function updateUserSword(user) {
      /*user.swordDirection = user.direction;
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
      }*/
    }
    var music;
    function create() {
      var w,h;
      music = game.add.audio('music');
      if (WORLD_WIDTH < window.innerWidth && WORLD_HEIGHT < window.innerHeight) {
        w = WORLD_WIDTH;
        h = WORLD_HEIGHT;
      } else {
        w = window.innerWidth;
        h = window.innerHeight;
      }
    
      background = game.add.tileSprite(0, 0, WORLD_WIDTH, WORLD_HEIGHT, 'background');
      //interface 
      // FIXME: Put objects according with screen size  
      hud = game.add.sprite(0,560,'hud');
      hud.fixedToCamera=true;
      avatar = game.add.sprite(0,560,'avatar');
      avatar.fixedToCamera=true;
      skill0 = game.add.sprite(110,600,'skill0');
      skill0.fixedToCamera=true;
      
      skill1 = game.add.sprite(170,600,'skill1');
      //skill1.z=2;
      skill1.fixedToCamera=true;
      skill2 = game.add.sprite(230,600,'skill2');
      skill2.fixedToCamera=true;
      
      skill1 = game.add.sprite(170,600,'skilln');
      skill1.fixedToCamera=true;
      skill2 = game.add.sprite(230,600,'skilln');
      skill2.fixedToCamera=true;
      
      game.time.advancedTiming = true;
      
      gameContainer.style.width = w + "px";
      gameContainer.style.height = h + "px";
      
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
        console.log("disconnected");
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
      if (keys.skill1.isDown || wasd.skill1.isDown) {
        playerOp.s1 = 1;
        didAction = true;
      }
      if (keys.skill2.isDown || wasd.skill2.isDown) {
        playerOp.s2 = 1;
        didAction = true;
      }
      if (keys.skill3.isDown || wasd.skill3.isDown) {
        playerOp.s3 = 1;
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
          game.debug.text('Mana: ' + player.score.toFixed(0) +' % ', 2, 30, "#00FF00");
          game.debug.text('hp :   ' + player.health, 2, 45, "#00FF00");
          // FIXME: change score to mana 
          // TODO: Generalize mana costs
          // FIXME: Put objects according with screen size  
          if(player.score !== player.lastMana){
            if(player.score>9){
              skill1.visible = false;
              skill2.visible = false;
            } else if (player.score>0){
              skill1.visible = true;
              skill2.visible = false;
            }else{
              skill1.visible = true;
              skill2.visible = true;
            }
            player.lastMana = player.score;
          }
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
