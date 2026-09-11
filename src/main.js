import { Application, Assets, Sprite } from 'pixi.js';

// Initialize the PixiJS Application
const app = new Application();
await app.init({ 
    resizeTo: window, 
    backgroundColor: 0x1099bb 
});

// Append the canvas element(like <div> element) to the HTML document
document.body.appendChild(app.canvas);

// Load a texture (using a placeholder image for testing)
const texture = await Assets.load(/* Load texture in here */);

// Create a sprite from the texture and center it
const sprite = new Sprite(texture);
bunny.anchor.set(0.5);				// Set center point (to half-texture)
bunny.x = app.screen.width / 2;
bunny.y = app.screen.height / 2;

// Add sprite to screen canvas
app.stage.addChild(sprite);

// Add a simple animation ticker (main game loop)
app.ticker.add((time) => {
    // Rotate the bunny continuously
    sprite.rotation += 0.1 * time.deltaTime;
});
