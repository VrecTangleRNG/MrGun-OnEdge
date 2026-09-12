// Import main dependencies
import { Application, Assets, Sprite } from 'pixi.js';
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


	// Init game objects
	const playerSprite = await Assets.load('./assets/textures/char0.png');
	const gunSPrite = await Assets.load('./assets/textures/glock.png');
	const particleSprite = await Assets.load('./assets/textures/particle.png');
	const enemySprite = await Assets.load('./assets/textures/enemy.png');

	const player = new Sprite(playerSprite);
	const bullet = new Sprite(particleSprite);
	const gun = new Sprite(gunSPrite);
	const enemy = new Sprite(enemySprite);

	enemy.width = 150;
	enemy.height = 100;
	
	app.stage.addChild(player);
	app.stage.addChild(gun);
	app.stage.addChild(bullet);
	app.stage.addChild(enemy);

	player.position.set(20, app.screen.height - player.height - 20);
	bullet.anchor.set(0.5);
	gun.position.set(player.width * 2 / 3 + 20, app.screen.height - player.height / 2 - 20);
	gun.anchor.set(0.2, 0.5);

/*----[[ Enemy System ]]----*/

	// Jumlah jalur
	const laneCount = 5;

	// Jarak antar jalur
	const laneSpacing = 120;

	// Posisi Y untuk setiap jalur
	const lanes = [];

	for (let i = 0; i < laneCount; i++) {
		lanes.push(laneSpacing * (i + 1));
	}


	// Enemy speed
	let enemySpeed = 3;
	const enemySpeeds = [3, 8, 15];

	// Status enemy
	let isEnemyFlying = false;


	// Spawn enemy
	function spawnEnemy() {

		// Pilih jalur secara random
		const randomLane = Math.floor(Math.random() * laneCount);

		// Ambil posisi Y berdasarkan jalur yang dipilih
		const laneY = lanes[randomLane];

		const randomSpeed = Math.floor(Math.random() * enemySpeeds.length);
		enemySpeed = enemySpeeds[randomSpeed];

		// Spawn dari sebelah kanan layar
		enemy.position.set(
			app.screen.width + enemy.width,
			laneY
		);

		// Aktifkan enemy
		enemy.visible = true;

		// Tandai enemy sedang bergerak
		isEnemyFlying = true;
	}


	// Spawn enemy pertama
	spawnEnemy();

	// TODO: Add a bullet firing feature
	const aimingSpeed = 2000;
	const bulletSpeed = 200;
	let gunCopy = gun;
	let bulletVelocity = { x: 0, y: 0 };
	let isBulletFlying = false;
	bullet.visible = false;
	let aimingTween = new Tween(gunCopy)
		.to({ angle: -60 }, aimingSpeed)
		.easing(yoyo(Easing.Linear.InOut))
		.repeat(Infinity);
	let lowerGunTween = new Tween(gunCopy)
		.to({ angle: 0 }, 100)
		.easing(Easing.Quadratic.Out);

/*----[[ Shoot Bullet ]]----*/

	function shootBullet() {

		// Jika masih ada bullet yang terbang,
		// jangan menembak lagi
		if (isBulletFlying) {
			return;
		}


		// Tampilkan bullet
		bullet.visible = true;

		// Bullet mulai dari posisi gun
		bullet.position.set(
			gun.x,
			gun.y
		);


		// Ambil angle pistol
		const angle =
			gunCopy.angle * (Math.PI / 180);


		// Hitung kecepatan berdasarkan arah pistol
		bulletVelocity.x =
			Math.cos(angle) * bulletSpeed;

		bulletVelocity.y =
			Math.sin(angle) * bulletSpeed;


		// Bullet sedang terbang
		isBulletFlying = true;
	}
	/*----[[ Updates ]]----*/
	app.ticker.add((time) => {

		// Update aim
		aimingTween.update();
		lowerGunTween.update();
		gun.angle = gunCopy.angle;

		if (isEnemyFlying) {

			// Gerakkan enemy dari kanan ke kiri
			enemy.x -= enemySpeed * time.deltaTime;

			// Jika enemy sudah keluar dari layar
			if (enemy.x < -enemy.width) {

				// Spawn enemy berikutnya
				spawnEnemy();
			}
		}
		// Update bullet position
		if (isBulletFlying) {

			// Gerakkan bullet
			bullet.x +=
				bulletVelocity.x * time.deltaTime;

			bullet.y +=
				bulletVelocity.y * time.deltaTime;


			/*---- Bullet keluar layar ----*/

			if (
				bullet.x < 0 ||
				bullet.x > app.screen.width ||
				bullet.y < 0 ||
				bullet.y > app.screen.height
			) {

				// Sembunyikan bullet
				bullet.visible = false;

				// Bullet tidak terbang
				isBulletFlying = false;
			}


			/*---- Bullet Collision Enemy ----*/

			if (isBulletFlying && enemy.visible) {

				const bulletBounds =
					bullet.getBounds();

				const enemyBounds =
					enemy.getBounds();


				// Cek apakah bullet menyentuh enemy
				if (
					bulletBounds.x < enemyBounds.x + enemyBounds.width &&
					bulletBounds.x + bulletBounds.width > enemyBounds.x &&
					bulletBounds.y < enemyBounds.y + enemyBounds.height &&
					bulletBounds.y + bulletBounds.height > enemyBounds.y
				) {

					/*---- Enemy Eliminated ----*/

					// Sembunyikan bullet
					bullet.visible = false;

					// Bullet sudah tidak terbang
					isBulletFlying = false;


					// Hilangkan enemy
					enemy.visible = false;

					// Enemy sudah tidak bergerak
					isEnemyFlying = false;


					// Spawn enemy berikutnya
					spawnEnemy();
				}
			}
		}
	});


	/*----[[ Signals ]]----*/
	// Make canvas able to receive touch input
	app.stage.eventMode = 'static';
	app.stage.hitArea = app.screen;

	app.stage.on('pointerdown', () => {
		aimingTween.start();
		lowerGunTween.stop();
	});
	app.stage.on('pointerup', () => {
		aimingTween.stop();
		shootBullet();
		lowerGunTween.delay(100);
		lowerGunTween.startFromCurrentValues();

//		.onComplete(() => {
//			bullet.visible.set(true);
//			bullet.position.set(gun.x, gun.y);
//			bulletVelocity.x = Math.cos(gunCopy.angle * (Math.PI / 180)) * bulletSpeed;
	});
	app.stage.on('pointerupoutside', () => {
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
