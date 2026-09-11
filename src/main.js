// Import main dependencies
import { Application, Assets, Sprite } from 'pixi.js';


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
	const gun = new Sprite(gunSPrite);
	const bullet = new Sprite(particleSprite);
	app.stage.addChild(player);
	app.stage.addChild(gun);
	app.stage.addChild(bullet);


	/*----[[ Updates ]]----*/
	app.ticker.add((time) => {
	});


	/*----[[ Signals ]]----*/
})();

