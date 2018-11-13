var config = {
    type: Phaser.AUTO,
    parent: 'phaser-example',
    width: 15 * 35,
    height: 15 * 35,
    physics: {
        default: 'arcade',
        arcade: {
            debug: false,
            gravity: { y: 0 }
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var game = new Phaser.Game(config);

function preload() {
    this.load.image('tileset', 'assets/forest.png');
    this.load.image('tiletree', 'assets/tree.png');
    this.load.tilemapTiledJSON('map', 'assets/island.json');
    this.load.spritesheet('link', 'assets/linkfin.png', { frameWidth: (135 / 8), frameHeight: (101 / 4) })
    this.load.spritesheet('otherPlayer', 'assets/linkevil.png', { frameWidth: (135 / 8), frameHeight: (101 / 4) });
    this.load.spritesheet('bomb', 'assets/bomba.png', { frameWidth: (25), frameHeight: (350 / 14) });
}

var map
var layer
var aux
var blocks
var softblocks
var mirando = "espera"
var spacekey
var bombs

function create() {

    //mapa:
    map = this.add.tilemap('map', 35, 35);

    aux = map.addTilesetImage('forest', 'tileset');

    layer = map.createStaticLayer('ground', aux);
    blocks = map.createStaticLayer('blocks', aux);

    layer.debug = true;
    aux = map.addTilesetImage('tree', 'tiletree');
    softblocks = map.createStaticLayer('softblocks', aux);

    blocks.setCollisionBetween(0, 999, true);
    softblocks.setCollisionBetween(0, 999, true);
    //

    bombs = this.add.group();
    bombs.enableBody = true;
    bombs.physicsBodyType = Phaser.Physics.ARCADE;

    var self = this;
    this.socket = io();
    this.otherPlayers = this.physics.add.group();
    this.socket.on('currentPlayers', function (players) {
        Object.keys(players).forEach(function (id) {
            if (players[id].playerId === self.socket.id) {
                addPlayer(self, players[id]);
            } else {
                addOtherPlayers(self, players[id]);
            }
        });
    });
    this.socket.on('newPlayer', function (playerInfo) {
        addOtherPlayers(self, playerInfo);
    });
    this.socket.on('disconnect', function (playerId) {
        self.otherPlayers.getChildren().forEach(function (otherPlayer) {
            if (playerId === otherPlayer.playerId) {
                otherPlayer.destroy();
            }
        });
    });



    this.socket.on('playerMoved', function (playerInfo) {
        self.otherPlayers.getChildren().forEach(function (otherPlayer) {
            if (playerInfo.playerId === otherPlayer.playerId) {
                otherPlayer.setPosition(playerInfo.x, playerInfo.y);
                if (playerInfo.animation == "right") {
                    otherPlayer.anims.play('rightd', true);
                } else if (playerInfo.animation == "left") {
                    otherPlayer.anims.play('leftd', true);
                } else if (playerInfo.animation == "up") {
                    otherPlayer.anims.play('upd', true);
                } else if (playerInfo.animation == "down") {
                    otherPlayer.anims.play('downd', true);
                } else if (playerInfo.animation == "stop") {
                    otherPlayer.anims.stop();
                }

            }
        });
    });

    this.cursors = this.input.keyboard.createCursorKeys();
    spacekey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    this.socket.on('Bomba', function (bomba) {
        var size = 0
        bombs.children.iterate(function (child) {

            size += 1

        });
        if (size == 0) {
            bombs.create(bomba.x, bomba.y, 'bomb');
            bombs.children.iterate(function (child) {

                child.anims.play('bombmov', true);

            });
        }
    });

    this.anims.create({
        key: 'bombmov',
        frames: this.anims.generateFrameNumbers('bomb', {
            start: 0,
            end: 13
        }),
        frameRate: 10,
    });

    this.anims.create({
        key: 'right',
        frames: this.anims.generateFrameNumbers('link', {
            start: 8,
            end: 15
        }),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: 'up',
        frames: this.anims.generateFrameNumbers('link', {
            start: 16,
            end: 23
        }),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: 'left',
        frames: this.anims.generateFrameNumbers('link', {
            start: 0,
            end: 7
        }),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: 'down',
        frames: this.anims.generateFrameNumbers('link', {
            start: 24,
            end: 35
        }),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: 'rightd',
        frames: this.anims.generateFrameNumbers('otherPlayer', {
            start: 8,
            end: 15
        }),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: 'upd',
        frames: this.anims.generateFrameNumbers('otherPlayer', {
            start: 16,
            end: 23
        }),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: 'leftd',
        frames: this.anims.generateFrameNumbers('otherPlayer', {
            start: 0,
            end: 7
        }),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: 'downd',
        frames: this.anims.generateFrameNumbers('otherPlayer', {
            start: 24,
            end: 35
        }),
        frameRate: 10,
        repeat: -1
    });


}

function update() {
    if (this.link) {
        // emit player movement
        var x = this.link.x;
        var y = this.link.y;
        var r = this.link.rotation;
        if (this.link.oldPosition && (x !== this.link.oldPosition.x || y !== this.link.oldPosition.y || r !== this.link.oldPosition.rotation)) {
            var ani

            if (x > this.link.oldPosition.x) {
                ani = "right"
            } else if (x < this.link.oldPosition.x) {
                ani = "left"
            } else if (y < this.link.oldPosition.y) {
                ani = "up"
            } else if (y > this.link.oldPosition.y) {
                ani = "down"
            } else {
                ani = "stop"
            }

            this.socket.emit('playerMovement', { x: this.link.x, y: this.link.y, rotation: this.link.rotation }, ani);
        }

        // save old position data
        this.link.oldPosition = {
            x: this.link.x,
            y: this.link.y,

        };


        if (this.cursors.right.isDown) {
            this.link.setVelocityX(90);
            this.link.setVelocityY(0);
            this.link.anims.play('right', true);
            if (mirando != "right") {
                mirando = "right";
            }
        } else if (this.cursors.left.isDown) {
            this.link.setVelocityX(-90);
            this.link.setVelocityY(0);
            this.link.anims.play('left', true);
            if (mirando != "left") {
                mirando = "left";
            }
        } else if (this.cursors.up.isDown) {
            this.link.setVelocityY(-90)
            this.link.setVelocityX(0);
            this.link.anims.play('up', true);
            if (mirando != "up") {
                mirando = "up";
            }
        } else if (this.cursors.down.isDown) {
            this.link.setVelocityY(90)
            this.link.setVelocityX(0);
            this.link.anims.play('down', true);
            if (mirando != "down") {
                mirando = "down";
            }
        } else {
            if (mirando != "espera") {
                this.link.anims.stop();
                this.link.setVelocityX(0);
                this.link.setVelocityY(0);

            }
            mirando = "right";
        }

        this.physics.world.wrap(this.link, 5);//ya se para que es esto
    }

    if (Phaser.Input.Keyboard.JustDown(spacekey)) {
        this.socket.emit('PonerBomba', { x: this.link.x, y: this.link.y });

    }


}

function addPlayer(self, playerInfo) {
    self.link = self.physics.add.sprite(playerInfo.x, playerInfo.y, 'link', 24);
    self.link.setCollideWorldBounds(true);
    self.physics.add.collider(self.link, blocks);
    self.physics.add.collider(self.link, softblocks);


}


function addOtherPlayers(self, playerInfo) {
    const otherPlayer = self.physics.add.sprite(playerInfo.x, playerInfo.y, 'otherPlayer', 24);


    otherPlayer.playerId = playerInfo.playerId;
    self.otherPlayers.add(otherPlayer);
}
