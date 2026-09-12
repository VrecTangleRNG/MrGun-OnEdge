// Import main dependencies
import { Application, Assets, Sprite, Container } from 'pixi.js';
import { Tween, Easing } from '@tweenjs/tween.js';


(async () => {

	/*----[[ Initializations ]]----*/
	// Init application
	const app = new Application();
	await app.init({ 
	    resizeTo: window, 
	    backgroundColor: 0x1099bb 
	});
	document.body.appendChild(app.canvas);
	
	const gameContainer = new Container();
	const menuContainer = new Container();

	// Start with game hidden, menu visible
	gameContainer.visible = false;
	menuContainer.visible = true;

	app.stage.addChild(gameContainer);
	app.stage.addChild(menuContainer);

	let gameStarted = false;

	// Init game objects
	const playerSprite = await Assets.load('./assets/textures/char0.png');
	const gunSPrite = await Assets.load('./assets/textures/glock.png');
	const particleSprite = await Assets.load('./assets/textures/particle.png');
	const enemySprite = await Assets.load('./assets/textures/enemy.png');
	const titlescreenSprite = await Assets.load('./assets/textures/titlescreen.png');
	const playSprite = await Assets.load('./assets/textures/playbutton.png');

	const player = new Sprite(playerSprite);
	const gun = new Sprite(gunSPrite);
	const titleScreen = new Sprite(titlescreenSprite);
	const playButton = new Sprite(playSprite);

	gameContainer.addChild(player);
	gameContainer.addChild(gun);

	player.position.set(20, app.screen.height - player.height - 20);
	gun.position.set(player.width * 2 / 3 + 20, app.screen.height - player.height / 2 - 20);
	gun.anchor.set(0.2, 0.5);


	/*----[[ Enemy System ]]----*/
	const laneCount = 5;
	const laneSpacing = 120;
	const lanes = [];
	for (let i = 0; i < laneCount; i++) {
		lanes.push(laneSpacing * (i + 1));
	}

	let enemies = [];
	let spawnEnemyInterval = null;

	let enemySpeed = 3;
	const enemySpeeds = [3, 8, 15];

	// Spawn enemy
	function spawnEnemy() {
		if (!gameStarted) return;

		const newEnemy = new Sprite(enemySprite);
		newEnemy.width = 150;
		newEnemy.height = 100;

		const randomLane = Math.floor(Math.random() * laneCount);
		const laneY = lanes[randomLane];

		const randomSpeed = Math.floor(Math.random() * enemySpeeds.length);
		enemySpeed = enemySpeeds[randomSpeed];

		newEnemy.speed = enemySpeeds[randomSpeed];
		newEnemy.isFlying = true;

		const minStopX = 150;
    	const maxStopX = app.screen.width - newEnemy.width * 1.5;

		newEnemy.stopX =
			Math.random() * (maxStopX - minStopX) + minStopX;

		newEnemy.position.set(
			app.screen.width + newEnemy.width,
			laneY
		);
		
		gameContainer.addChild(newEnemy);
		enemies.push(newEnemy);
	}

	// Gun and tweens
	const aimingSpeed = 2000;
	let gunCopy = gun;
	let isBulletFlying = false;
	let aimingTween = new Tween(gunCopy)
		.to({ angle: -60 }, aimingSpeed)
		.easing(yoyo(Easing.Linear.InOut))
		.repeat(Infinity);
	let lowerGunTween = new Tween(gunCopy)
		.to({ angle: 0 }, 100)
		.easing(Easing.Quadratic.Out);


	/*----[[ Bullet System ]]----*/
	const bulletSpeed = 20;
	let bullets = []; // Array to hold active bullet clones

	/*----[[ Shoot Bullet ]]----*/
	function shootBullet() {
		// Create a brand new bullet instance
		const newBullet = new Sprite(particleSprite);
		newBullet.anchor.set(0.5);
		newBullet.position.set(gun.x, gun.y);

		// Calculate individual velocity vector based on current gun angle
		const angle = gunCopy.angle * (Math.PI / 180);
		newBullet.velocity = {
			x: Math.cos(angle) * bulletSpeed,
			y: Math.sin(angle) * bulletSpeed
		};

		// Display it and add it to tracking structures
		gameContainer.addChild(newBullet);
		bullets.push(newBullet);
	}


	// Setup Title Background (Stretch to cover canvas or place centrally)
	titleScreen.width = app.screen.width;
	titleScreen.height = app.screen.height;

	// Setup Play Button
	playButton.anchor.set(0.5);
	playButton.x = app.screen.width / 2;
	playButton.y = app.screen.height / 2 + 100; // Positioned below center text
	
	// Make Play Button Interactive
	playButton.eventMode = 'static';
	playButton.cursor = 'pointer';

	// Add menu items to the MENU container
	menuContainer.addChild(titleScreen);
	menuContainer.addChild(playButton);


	/*----[[ Updates ]]----*/
	app.ticker.add((time) => {

		// Only calculate physics if game is active
		if (!gameStarted) return;

		// Update aim
		aimingTween.update();
		lowerGunTween.update();
		gun.angle = gunCopy.angle;

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
		}

		// Update, move, and bound-check all active bullet clones
		for (let b = bullets.length - 1; b >= 0; b--) {
			const currentBullet = bullets[b];

			currentBullet.x += currentBullet.velocity.x * time.deltaTime;
			currentBullet.y += currentBullet.velocity.y * time.deltaTime;

			/*---- Check if bullet left the screen bounds ----*/
			if (
				currentBullet.x < 0 ||
				currentBullet.x > app.screen.width ||
				currentBullet.y < 0 ||
				currentBullet.y > app.screen.height
			) {
				gameContainer.removeChild(currentBullet);
				bullets.splice(b, 1);
				continue;
			}

			/*---- Nested Bullet vs Enemy Collision Check ----*/
			for (let e = enemies.length - 1; e >= 0; e--) {
				const currentEnemy = enemies[e];

				const bulletBounds = currentBullet.getBounds();
				const enemyBounds = currentEnemy.getBounds();

				// AABB Collision Detection
				if (
					bulletBounds.x < enemyBounds.x + enemyBounds.width &&
					bulletBounds.x + bulletBounds.width > enemyBounds.x &&
					bulletBounds.y < enemyBounds.y + enemyBounds.height &&
					bulletBounds.y + bulletBounds.height > enemyBounds.y
				) {
					/*---- Collision Occurred! Cleanup both objects ----*/
					
					// Remove bullet clone
					gameContainer.removeChild(currentBullet);
					bullets.splice(b, 1);

					// Remove enemy clone
					gameContainer.removeChild(currentEnemy);
					enemies.splice(e, 1);
					break; 
				}
			}
		}
	});


	/*----[[ Menu Signals ]]----*/
	// Handle Clicking the Play Button to start the game
	playButton.on('pointerdown', () => {
		menuContainer.visible = false;
		gameContainer.visible = true;
		gameStarted = true;

		// Start your gameplay elements here
		spawnEnemy();
		spawnEnemyInterval = setInterval(spawnEnemy, 2000);
		aimingTween.start();
	});


	/*----[[ Signals ]]----*/
	// Make canvas able to receive touch input
	gameContainer.eventMode = 'static';
	gameContainer.hitArea = app.screen;

	gameContainer.on('pointerdown', () => {
		if (!gameStarted) return;
		aimingTween.start();
		lowerGunTween.stop();
	});
	gameContainer.on('pointerup', () => {
		if (!gameStarted) return;
		aimingTween.stop();
		shootBullet();
		lowerGunTween.delay(100);
		lowerGunTween.startFromCurrentValues();

	});
	gameContainer.on('pointerupoutside', () => {
		if (!gameStarted) return;
		aimingTween.stop();
		shootBullet();
		lowerGunTween.delay(100);
		lowerGunTween.startFromCurrentValues();
	});
})();

// Helper functions
function yoyo(easingFunction) {
	return (time) => {
		if (time < 0.5) {
			return easingFunction(time * 2);
		}
		else {
			return easingFunction((1 - time) * 2);
		}
	};
}
