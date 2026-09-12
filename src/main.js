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

	const player = new Sprite(playerSprite);
	const bullet = new Sprite(particleSprite);
	const gun = new Sprite(gunSPrite);

	app.stage.addChild(player);
	app.stage.addChild(gun);
	app.stage.addChild(bullet);

	player.position.set(20, app.screen.height - player.height - 20);
	bullet.anchor.set(0.5);
	gun.position.set(player.width * 2 / 3 + 20, app.screen.height - player.height / 2 - 20);
	gun.anchor.set(0.2, 0.5);

	// TODO: Add a bullet firing feature
	const aimingSpeed = 2000;
	const bulletSpeed = 200;
	let gunCopy = gun;
	let bulletVelocity = { x: 0, y: 0 };
	let isBulletFlying = false;
	let aimingTween = new Tween(gunCopy)
		.to({ angle: -60 }, aimingSpeed)
		.easing(yoyo(Easing.Linear.InOut))
		.repeat(Infinity);
	let lowerGunTween = new Tween(gunCopy)
		.to({ angle: 0 }, 100)
		.easing(Easing.Quadratic.Out);


	/*----[[ Updates ]]----*/
	app.ticker.add((time) => {

		// Update aim
		aimingTween.update();
		lowerGunTween.update();
		gun.angle = gunCopy.angle;

		// Update bullet position
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
		lowerGunTween.delay(100);
		lowerGunTween.startFromCurrentValues();

//		.onComplete(() => {
//			bullet.visible.set(true);
//			bullet.position.set(gun.x, gun.y);
//			bulletVelocity.x = Math.cos(gunCopy.angle * (Math.PI / 180)) * bulletSpeed;
	});
	app.stage.on('pointerupoutside', () => {
		aimingTween.stop();
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
