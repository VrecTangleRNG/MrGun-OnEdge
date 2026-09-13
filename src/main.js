// Import main dependencies
import { Application, Assets, Sprite, Container, Text, TextStyle } from 'pixi.js';
import { sound } from '@pixi/sound';
import { Tween, Easing } from '@tweenjs/tween.js';


(async () => {

	/*----[[ Initializations ]]----*/
	// Init application
	const app = new Application();
	await app.init({ 
	    resizeTo: window, 
	});
	document.body.appendChild(app.canvas);
	
	const gameContainer = new Container();
	const menuContainer = new Container();
	const overContainer = new Container();

	gameContainer.visible = false;
	gameContainer.eventMode = 'static';
	gameContainer.hitArea = app.screen;
	menuContainer.visible = true;
	overContainer.visible = false;

	app.stage.addChild(gameContainer);
	app.stage.addChild(menuContainer);
	app.stage.addChild(overContainer);

	// Init game objects
	const playSprite = await Assets.load('./assets/textures/Start_btn.png');
	const creditButtonSprite = await Assets.load('./assets/textures/credits_btn.png');
	const gunSprite = await Assets.load('./assets/textures/handtangan.png');
	const titlescreenSprite = await Assets.load('./assets/textures/12-removebg-preview.png');
	const playerSprite = await Assets.load('./assets/textures/nohandtangan.png');
	const bulletSprite = await Assets.load('./assets/textures/permen.png');
	const enemySprite = await Assets.load('./assets/textures/zombie.png');
	const backgroundTexture = await Assets.load('./assets/textures/background1.png');
	const gameOverSprite = await Assets.load('./assets/textures/component1.png');
	const restartSprite = await Assets.load('./assets/textures/group5.png');
	const returnSprite = await Assets.load('./assets/textures/group4.png');
	const fenceSprite = await Assets.load('./assets/textures/fance1.png');
	const enemyParticleSprite = await Assets.load('./assets/textures/jigongnaga.png');
	sound.add('click', './assets/sound/confirm.wav');
	sound.add('hit', './assets/sound/hit.wav');
	sound.add('fire', './assets/sound/fire.wav');
	sound.add('bgm', './assets/sound/bgm.wav');


	const background = new Sprite(backgroundTexture);
	const player = new Sprite(playerSprite);
	const gun = new Sprite(gunSprite);
	const titleScreen = new Sprite(titlescreenSprite);
	const playButton = new Sprite(playSprite);
	const gameOverScreen = new Sprite(gameOverSprite);
	const restartButton = new Sprite(restartSprite);
	const returnButton = new Sprite(returnSprite);
	const fence = new Sprite(fenceSprite);
	const creditsButton = new Sprite(creditButtonSprite);

	gameContainer.addChild(background);
	//gameContainer.addChild(fence);
	gameContainer.addChild(gun);
	gameContainer.addChild(player);
	menuContainer.addChild(titleScreen);
	menuContainer.addChild(playButton);
	overContainer.addChild(gameOverScreen);
	overContainer.addChild(restartButton);
	overContainer.addChild(returnButton);
	
	fence.position.set(0, 200);

	player.anchor.set(0.5);
	player.position.set(player.width, app.screen.height - player.height / 2 - 200);
	player.scale.set(1.5);

	gun.anchor.set(30/128, 0.5);
	gun.position.set(player.position.x - 50, player.position.y);
	gun.scale.set(1.5);

	titleScreen.scale.set(0.5);
	titleScreen.width = app.screen.width / 2;
	titleScreen.height = app.screen.height / 2;

	playButton.anchor.set(0.5);
	playButton.x = app.screen.width / 2;
	playButton.y = app.screen.height / 2 + 100;
	playButton.eventMode = 'static';
	playButton.cursor = 'pointer';
	playButton.scale.set(1.5);

	gameOverScreen.anchor.set(0.5);
	gameOverScreen.x = app.screen.width / 2;
	gameOverScreen.y = app.screen.height / 3;

	restartButton.anchor.set(0.5);
	restartButton.x = app.screen.width / 2 - 300;
	restartButton.y = app.screen.height / 2 + 50;
	restartButton.eventMode = 'static';
	restartButton.cursor = 'pointer';
	restartButton.scale.set(0.5);

	returnButton.anchor.set(0.5);
	returnButton.x = app.screen.width / 2 + 300;
	returnButton.y = app.screen.height / 2 + 50;
	returnButton.eventMode = 'static';
	returnButton.cursor = 'pointer';
	returnButton.scale.set(0.5);

	/*----[[ Core Game Systems Tuning ]]----*/
	const bulletSpeed = 20;
	const firerate = 500;
	const enemyFireRateMS = 1500;
	const enemyBulletSpeed = 8;
	const aimingSpeed = 2000;
	
	let score = 0;
	let gameStarted = false;
	let isPlayerDead = false;

	let enemies = [];
	let bullets = [];
	let enemyBullets = [];
	let spawnEnemyInterval = null;
	let recoil = 0;

	// TODO: modify this
	// UI Score Text Setup
	const scoreText = new Text({
		text: 'Score: 0',
		style: {
			fontSize: 32,
			fill: 0x000000
		}
	});
	scoreText.x = 20;
	scoreText.y = 20;
	gameContainer.addChild(scoreText);

	// Health System Variables
	let playerHealth = 3; 
	const healthText = new Text({
		text: 'Health: 3',
		style: {
			fontSize: 32
		}
	});
	healthText.x = 20;
	healthText.y = 60; // Positioned right under your score tracker
	gameContainer.addChild(healthText);

	/*----[[ Lane Mapping Setup ]]----*/
	const laneCount = 5;
	const laneSpacing = 120;
	const lanes = [];
	for (let i = 0; i < laneCount; i++) {
		lanes.push(laneSpacing * (i + 1));
	}

	// Tweens Declarations Mapping
	let gunCopy = gun;
	let playerCopy = player;

	let aimingTween = new Tween(gunCopy)
		.to({ angle: -70 }, aimingSpeed)
		.easing(yoyo(Easing.Linear.InOut))
		.repeat(Infinity);
	let lowerGunTween = new Tween(gunCopy)
		.to({ angle: 0 }, 100)
		.easing(Easing.Quadratic.Out);
	let gunFall = new Tween(gunCopy.position)
		.to({ y: app.screen.height + gun.width * 2 }, 1000)
		.easing(Easing.Quadratic.In);
	let fallOffTheScreen = new Tween(playerCopy.position)
		.to({ y: app.screen.height + 2 * player.height }, 1500)
		.easing(Easing.Quadratic.In)
		.onComplete(showsGameOver);
	let jumpPlayer = new Tween(playerCopy.position)
		.to({ y: app.screen.height / 2}, 1000)
		.easing(Easing.Quadratic.Out)
		.chain(fallOffTheScreen);

	/*----[[ Main Loop Update Loop Engine ]]----*/
	//
	app.ticker.add((time) => {
		if (!gameStarted) return;
		
		if (isPlayerDead) {
			jumpPlayer.update();
			fallOffTheScreen.update();
			gunFall.update();
			player.position.y = playerCopy.position.y;
			player.angle += 12 * time.deltaTime;
			return;
		}

		// Update weapon aiming configuration parameters
		aimingTween.update();
		lowerGunTween.update();
		gun.angle = gunCopy.angle;

		recoil += time.deltaMS;
		if (recoil >= firerate) {
			recoil = firerate;
		}

		// Update and move all active enemy clones
		for (let i = enemies.length - 1; i >= 0; i--) {
			const currentEnemy = enemies[i];

			if (currentEnemy.isFlying) {
				currentEnemy.x -= currentEnemy.speed * time.deltaTime;

				if (currentEnemy.x <= currentEnemy.stopX) {
					currentEnemy.x = currentEnemy.stopX;
					currentEnemy.isFlying = false;
				}
			}
			else {
				currentEnemy.shootTimer += time.deltaMS;
				if (currentEnemy.shootTimer >= enemyFireRateMS) {
					enemyShoot(currentEnemy, player.position.x, player.position.y);
					currentEnemy.shootTimer = 0;
				}
			}
		}

		// Move and Boundary Check Cloned Enemy Projectiles
		for (let eb = enemyBullets.length - 1; eb >= 0; eb--) {
			const activeEnemyBullet = enemyBullets[eb];
			
			activeEnemyBullet.x += activeEnemyBullet.velocity.x * time.deltaTime;
			activeEnemyBullet.y += activeEnemyBullet.velocity.y * time.deltaTime;

			// Handle Bullet Intercept Damage Processing Matrices
			const bulletBounds = activeEnemyBullet.getBounds();
			const playerBounds = player.getBounds();

			if (
				bulletBounds.x < playerBounds.x + playerBounds.width &&
				bulletBounds.x + bulletBounds.width > playerBounds.x &&
				bulletBounds.y < playerBounds.y + playerBounds.height &&
				bulletBounds.y + playerBounds.height > playerBounds.y
			) {
				gameContainer.removeChild(activeEnemyBullet);
				enemyBullets.splice(eb, 1);
				if (!isPlayerDead) {
					playerHealth--;
					healthText.text = `Health: ${playerHealth}`;
					if (playerHealth <= 0) {
						killPlayer();
					}
				}
				continue;
			}

			// Clean off-screen particles
			if (
				activeEnemyBullet.x < -50 || activeEnemyBullet.x > app.screen.width + 50 ||
				activeEnemyBullet.y < -50 || activeEnemyBullet.y > app.screen.height + 50
			) {
				gameContainer.removeChild(activeEnemyBullet);
				enemyBullets.splice(eb, 1);
			}
		}

		// Update, move, and bound-check all active friendly bullet clones
		for (let b = bullets.length - 1; b >= 0; b--) {
			const currentBullet = bullets[b];

			currentBullet.x += currentBullet.velocity.x * time.deltaTime;
			currentBullet.y += currentBullet.velocity.y * time.deltaTime;

			if (
				currentBullet.x < 0 || currentBullet.x > app.screen.width ||
				currentBullet.y < 0 || currentBullet.y > app.screen.height
			) {
				gameContainer.removeChild(currentBullet);
				bullets.splice(b, 1);
				continue;
			}

			// Intercept Enemy Hit Collision Checking Logic Matrix
			for (let e = enemies.length - 1; e >= 0; e--) {
				const currentEnemy = enemies[e];

				const friendlyBulletBounds = currentBullet.getBounds();
				const enemyBounds = currentEnemy.getBounds();

				if (
					friendlyBulletBounds.x < enemyBounds.x + enemyBounds.width &&
					friendlyBulletBounds.x + friendlyBulletBounds.width > enemyBounds.x &&
					friendlyBulletBounds.y < enemyBounds.y + enemyBounds.height &&
					friendlyBulletBounds.y + friendlyBulletBounds.height > enemyBounds.y
				) {
					gameContainer.removeChild(currentBullet);
					bullets.splice(b, 1);

					gameContainer.removeChild(currentEnemy);
					enemies.splice(e, 1);

					score += 10;
					scoreText.text = `Score: ${score}`;
					break;
				}
			}
		}
	});

	/*----[[ Global Device Input Signals Mapping ]]----*/
	playButton.on('pointerdown', (ev) => {
		sound.play('bgm', { loop: true, volume: 0.3 });
		ev.stopPropagation();
		menuContainer.visible = false;
		gameContainer.visible = true;
		gameStarted = true;
	player.position.set(player.width, app.screen.height - player.height / 2 - 200);
	player.scale.set(1.5);

	gun.anchor.set(30/128, 0.5);
	gun.position.set(player.position.x - 50, player.position.y);

		playerHealth = 3;
		healthText.text = "Health: 3";
		spawnEnemy();
		spawnEnemyInterval = setInterval(spawnEnemy, 2000);
		aimingTween.start();
	});
	gameContainer.on('pointerdown', () => {
		if (!gameStarted || isPlayerDead) return;
		aimingTween.start();
		lowerGunTween.stop();
	});
	gameContainer.on('pointerup', () => {
		releaseHoldCallback();
	});
	gameContainer.on('pointerupoutside', () => {
		releaseHoldCallback();
	});

	returnButton.on('pointerdown', (ev) => {
		ev.stopPropagation();
		overContainer.visible = false;
		gameContainer.visible = false;
		menuContainer.visible = true;
		gameStarted = false;
		isPlayerDead = false;
		score = 0;
		scoreText.text = 'Score: 0';

		enemies.forEach(e => gameContainer.removeChild(e));
		bullets.forEach(b => gameContainer.removeChild(b));
		enemyBullets.forEach(eb => gameContainer.removeChild(eb));
		enemies = [];
		bullets = [];
		enemyBullets = [];
	player.position.set(player.width, app.screen.height - player.height / 2 - 200);
	player.scale.set(1.5);

	gun.anchor.set(30/128, 0.5);
	gun.position.set(player.position.x - 50, player.position.y);

		player.angle = 0;
		playerHealth = 3;
		healthText.text = "Health: 3";
		
		if (!gameContainer.children.includes(gun)) {
			gameContainer.addChild(gun);
		}
		gun.angle = 0;
	});

	restartButton.on('pointerdown', (ev) => {
		ev.stopPropagation();
		overContainer.visible = false;
		isPlayerDead = false;
	player.position.set(player.width, app.screen.height - player.height / 2 - 200);
	player.scale.set(1.5);

	gun.anchor.set(30/128, 0.5);
	gun.position.set(player.position.x - 50, player.position.y);

		enemies.forEach(e => gameContainer.removeChild(e));
		bullets.forEach(b => gameContainer.removeChild(b));
		enemyBullets.forEach(eb => gameContainer.removeChild(eb));
		enemies = [];
		bullets = [];
		enemyBullets = [];
		score = 0;
		scoreText.text = 'Score: 0';
		player.angle = 0;
		playerHealth = 3;
		healthText.text = "Health: 3";

		if (!gameContainer.children.includes(gun)) {
			gameContainer.addChild(gun);
		}

		gun.angle = 0;

		spawnEnemy();
		spawnEnemyInterval = setInterval(spawnEnemy, 2000);
		aimingTween.start();
	});

	/*----[[ Functional Engine Subsystems Helpers ]]----*/
	function releaseHoldCallback() {
		if (!gameStarted || isPlayerDead) return;
		aimingTween.stop();
		shootBullet();
		lowerGunTween.delay(100);
		lowerGunTween.startFromCurrentValues();
	}

	function spawnEnemy() {
		if (!gameStarted || isPlayerDead) return;

		const newEnemy = new Sprite(enemySprite);
		newEnemy.width = 150;
		newEnemy.height = 100;

		const randomLane = Math.floor(Math.random() * laneCount);
		const laneY = lanes[randomLane];

		const enemySpeeds = [3, 8, 14];
		const randomSpeed = Math.floor(Math.random() * enemySpeeds.length);

		newEnemy.speed = enemySpeeds[randomSpeed];
		newEnemy.isFlying = true;
		newEnemy.shootTimer = 0;

		const minStopX = app.screen.width * 0.2;
		const maxStopX = app.screen.width * 0.8;
		newEnemy.stopX = Math.random() * (maxStopX - minStopX) + minStopX;

		newEnemy.position.set(app.screen.width + newEnemy.width, laneY);

		gameContainer.addChild(newEnemy);
		enemies.push(newEnemy);
	}

	function shootBullet() {
		if (recoil < firerate) return;

		const newBullet = new Sprite(bulletSprite);
		newBullet.width = 60;
		newBullet.height = 60;
		newBullet.anchor.set(0.5);
		newBullet.position.set(gun.x, gun.y);

		const angle = gunCopy.angle * (Math.PI / 180);
		newBullet.velocity = {
			x: Math.cos(angle) * bulletSpeed,
			y: Math.sin(angle) * bulletSpeed
		};

		gameContainer.addChild(newBullet);
		bullets.push(newBullet);
		recoil = 0;
	}

	function enemyShoot(shootingEnemy, targetX, targetY) {
		const enemyParticle = new Sprite(enemyParticleSprite);
		enemyParticle.width = 40;
		enemyParticle.height = 40;
		enemyParticle.anchor.set(0.5);
		
		enemyParticle.position.set(
			shootingEnemy.x + shootingEnemy.width / 4,
			shootingEnemy.y + shootingEnemy.height / 2
		);
		enemyParticle.tint = 0xff3333;

		const diffX = targetX - enemyParticle.x;
		const diffY = targetY - enemyParticle.y;
		const angle = Math.atan2(diffY, diffX);

		enemyParticle.velocity = {
			x: Math.cos(angle) * enemyBulletSpeed,
			y: Math.sin(angle) * enemyBulletSpeed
		};

		gameContainer.addChild(enemyParticle);
		enemyBullets.push(enemyParticle);
	}

	function killPlayer() {
		if (isPlayerDead) return;
		isPlayerDead = true;

		clearInterval(spawnEnemyInterval);
		aimingTween.stop();
		lowerGunTween.stop();

		jumpPlayer.start();
		gunFall.start();
		sound.stop('bgm');
	}

	function showsGameOver() {
		overContainer.visible = true;
	}
})();

function yoyo(easingFunction) {
    return (time) => {
        if (time < 0.5) return easingFunction(time * 2);
        return easingFunction((1 - time) * 2);
    };
}
