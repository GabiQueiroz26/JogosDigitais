import { Math, Scene } from "phaser";
import Carrot from "../objects/Carrot";

export default class Level extends Scene {
    /** @type {Phaser.Physics.Arcade.Sprite} */
    player;

    /** @type {Phaser.Physics.Arcade.StaticGroup} */
    platforms;

    /** @type {Phaser.Types.Input.Keyboard.CursorKeys} */
    cursors;

    /** @type {Phaser.Physics.Arcade.Group} */
    carrots;

    points = 0;
    /** @type {Phaser.GameObjects.Text} */
    pointsText;

    constructor() {
        super('level');
    }

    preload() {
        this.load.image('background', 'assets/bg_layer1.png');
        this.load.image('platform', 'assets/ground_grass.png');
        this.load.image('bunny-stand', 'assets/bunny1_stand.png');
        this.load.image('carrot', 'assets/carrot.png');
        this.load.audio('jump', 'assets/sfx/jump.ogg');
        this.load.image('bunny-jump', 'assets/bunny1_jump.png');
        this.load.audio('gameover', 'assets/sfx/gameover.ogg');

    }

    create() {
        //background
        this.add.image(240, 320, 'background')
        .setScrollFactor(0,0);

        //Plataforma
        //const platform = this.physics.add.staticImage(240, 320, 'plataform')
            //.setScale(0.5);

        // Grupo de plataformas
        this.platforms = this.physics.add.staticGroup();

        for(let i = 0; i < 5; i++) {
            const x = Math.Between(80, 400);
            const y = 150 * i;

            const platform = this.platforms.create(x, y, 'platform');
            platform.setScale(0.5);
            platform.body.updateFromGameObject();
        }

        
        // Criando o Player
        this.player = this.physics.add.image(240, 120, 'bunny-stand')
            .setScale(0.5);
        //player.body.velocity.y = -400;

        // Faz os elementos colidirem
        this.physics.add.collider(this.player, this.platforms);

        // Disabilitar a colisão do coelho nas laterais e em cima
        this.player.body.checkCollision.up = false;
        this.player.body.checkCollision.left = false;
        this.player.body.checkCollision.rigth = false;

        // Câmera (segue o personagem)
        this.cameras.main.startFollow(this.player);

        // Definir uma dead zone para a Câmera 
        this.cameras.main.setDeadzone(this.scale.width * 1.5);

        // Cursores
        this.cursors = this.input.keyboard.createCursorKeys();

        // Cenouras 
        this.carrots = this.physics.add.group({
            classType: Carrot
        });

        this.physics.add.collider(this.carrots, this.platforms);

        this.physics.add.overlap(this.player, this.carrots, this.handleCollectCarrot, undefined, this); // só encosta

        // Texto de Pontuação
        const style = { color: '#000', frontSize: 24};
        this.pointsText = this.add.text(240, 10, 'Cenouras: 0', style);
        this.pointsText.setScrollFactor(0);
        this.pointsText.setOrigin(0.5, 0);
    }

    update(time, delta) {
        //Pulando
        const touchingGround = this.player.body.touching.down; // se ele tiver encostado em algo vai dar true

        
        if (touchingGround) {
            this.player.setVelocityY(-300);
            this.sound.play('jump');
            this.player.setTexture('bunny-jump');
        }

        let velocityY = this.player.body.velocity.y;
        if(velocityY > 0 && this.player.texture.key != 'bunny-stand') {
            this.player.setTexture('bunny-stand');
        }

        // Reusando as plataformas
        this.platforms.children.iterate(child => {
            /** @type {Phaser.Physics.Arcade.Sprite} */
            const plataform = child;

            // Pegar a posição Y da Câmera
            const scrollY = this.cameras.main.scrollY;
            if (plataform.y >= scrollY + 700) {
                plataform.x = Math.Between(80,400);
                plataform.y = scrollY - Math.Between(0,10);
                plataform.body.updateFromGameObject();

                // criar uma cenoura acima
                this.addCarrotAbove(plataform);
            }
        })

        // Cursores Direita e Esquerda
        if (this.cursors.left.isDown){
            this.player.setVelocityX(-200);
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(200);
        } else {
            this.player.setVelocityX(0);
        }

        //Testando se o coelho caiu
        let bottomPlatform = this.findBottomPlatform();
        if (this.player.y > bottomPlatform.y + 200) {
            this.scene.start('game-over');
            this.sound.play('gameover');
        }

    }

    addCarrotAbove(plataform) {
        const y = plataform.y - plataform.displayHeight;

        const carrot = this.carrots.get(plataform.x, y, 'carrot');

        carrot.setActive(true);
        carrot.setVisible(true);

        this.add.existing(carrot);

        carrot.body.setSize(carrot.width, carrot.height);
        this.physics.world.enable(carrot);
    }

    handleCollectCarrot(player, carrot) {
        this.carrots.killAndHide(carrot); // desabilita e tira da tela
        
        this.physics.world.disableBody(carrot.body);

        this.points++;
        this.pointsText.text = 'Cenouras: ' + this.points;
    }

    //Procura a plataforma mais baixa
    findBottomPlatform() {
        let platforms = this.platforms.getChildren();
        let bottomPlatform = platforms[0];
        
        for(let i = 1; i < platforms.length; i++){
            let platform = platforms[i];

            if (platform.y < bottomPlatform.y) {
                continue;
            }

            bottomPlatform = platform;
        }

        return bottomPlatform;
    }
}