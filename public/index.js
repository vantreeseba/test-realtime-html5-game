/**
 * Demo
 *
 * @access public
 * @param {string} id Id for dom element to render to
 * @param {function} frameCallback Function to be called every animation frame
 */
function Demo(id, frameCallback) {
  this.renderer = PIXI.autoDetectRenderer(640, 480, { backgroundColor: 0x1099bb });
  document.querySelector('#' + id).appendChild(this.renderer.view);

  // create the root of the scene graph
  this.stage = new PIXI.Container();

  // create a texture from an image path
  this.e1Texture = PIXI.Texture.fromImage('assets/v1-small.png');
  this.e2Texture = PIXI.Texture.fromImage('assets/v2-small.png');
  this.gridTexture = PIXI.Texture.fromImage('assets/grid-small.png');
  this.targetTexture = PIXI.Texture.fromImage('assets/target.png');

  this.background = new PIXI.TilingSprite(
    this.gridTexture, this.renderer.width, this.renderer.height);

  this.stage.addChild(this.background);
  // start animating
  this.frameCallback = frameCallback;
  this.time = new Date().getTime();
}

Demo.prototype.animate = function animate() {
  requestAnimationFrame(animate.bind(this));

  let now = new Date().getTime();
  let dt = now - (this.time || now);

  this.time = now;

  // just for fun, let's rotate mr rabbit a little
  this.frameCallback(dt);

  // render the container
  this.renderer.render(this.stage);
};

Demo.prototype.createEntity = function createEntity(x, y, tex){
  var r = tex !== undefined ? tex : Math.random() > 0.5;
  var entity = new PIXI.Sprite(r ? this.e1Texture : this.e2Texture);
  entity.vel = {x:0, y:0, maxVelocity: 3, maxForce: 0.25};

  // center the sprite 's anchor point
  entity.anchor.x = 0.5;
  entity.anchor.y = 0.5;

  // move the sprite to the center of the screen
  entity.position.x = x;
  entity.position.y = y;
  return entity;
};

