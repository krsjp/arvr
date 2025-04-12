AFRAME.registerComponent('custom-orbit-controls', {
  schema: {
    distance: { type: 'number', default: 5 },
    minDistance: { type: 'number', default: 1 },
    maxDistance: { type: 'number', default: 10 },
    enableDamping: { type: 'boolean', default: true },
    dampingFactor: { type: 'number', default: 0.1 },
    rotateSpeed: { type: 'number', default: 0.5 },
  },

  init: function () {

    this.rotateStart = new THREE.Vector2();
    this.rotateEnd = new THREE.Vector2();
    this.rotateDelta = new THREE.Vector2();
    this.spherical = new THREE.Spherical();

    this.camera = this.el.sceneEl.camera;
    this.camera.position.set(0, 1, this.data.distance);
    this.isDragging = false;
    this.mouse = { x: 0, y: 0 };
    this.target = new THREE.Vector3();

    if (this.data.initialTarget) {
      this.target = this.data.initialTarget;
    }
    
    this.el.sceneEl.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.el.sceneEl.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.el.sceneEl.addEventListener('mouseup', this.onMouseUp.bind(this));
    this.el.sceneEl.addEventListener('wheel', this.onMouseWheel.bind(this));

    this.el.sceneEl.addEventListener('model-clicked', (event) => {
      this.target.copy(event.detail.position);
    });
  },
  
  onMouseDown: function (event) {
    this.isDragging = true;
    this.mouse.x = (event.clientX / window.innerWidth) * 2- 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    this.initialMouse = { x: this.mouse.x, y: this.mouse.y };
  },

  onMouseMove: function (event) {
    if (!this.isDragging) return;

    let currentMouse = {
      x: (event.clientX / window.innerWidth) * 2 - 1,
      y: -(event.clientY / window.innerHeight) * 2 + 1,
    };

    let deltaX = currentMouse.x - this.initialMouse.x;
    let deltaY = currentMouse.y - this.initialMouse.y;    
    this.rotate(deltaX, deltaY);    

    this.initialMouse.x = currentMouse.x;
    this.initialMouse.y = currentMouse.y;
  },
  
  onMouseUp: function () {
    this.isDragging = false;
  },
  
  onMouseWheel: function (event) {
    event.preventDefault();
    let delta = event.deltaY * 0.01;
    this.data.distance += delta;
    this.data.distance = Math.max( this.data.minDistance, Math.min( this.data.maxDistance, this.data.distance));
    this.updateCameraPosition();
  },

  rotate: function (deltaX, deltaY) {
    
    const offset = new THREE.Vector3();
    const quat = new THREE.Quaternion().setFromUnitVectors( this.camera.up, new THREE.Vector3( 0, 1, 0 ) );
    const quatInverse = quat.clone().invert();
  
    const position = this.camera.position;
    offset.copy(position).sub(this.target);
    
    offset.applyQuaternion(quat);

    this.spherical.setFromVector3(offset);
    this.spherical.theta -= deltaX * this.data.rotateSpeed;
    this.spherical.phi -= deltaY * this.data.rotateSpeed;

    this.spherical.makeSafe();
   
    offset.setFromSpherical(this.spherical);
    offset.applyQuaternion(quatInverse);
    position.copy(this.target).add(offset);
    this.camera.lookAt(this.target);
  },

  updateCameraPosition: function () {
    const offset = new THREE.Vector3();
    const quat = new THREE.Quaternion().setFromUnitVectors( this.camera.up, new THREE.Vector3( 0, 1, 0 ) );
    const quatInverse = quat.clone().invert();
    const position = this.camera.position;
    offset.copy(position).sub(this.target);
    offset.applyQuaternion(quat);
    this.spherical.setFromVector3(offset);

    this.spherical.radius = this.data.distance

    offset.setFromSpherical(this.spherical);
    offset.applyQuaternion(quatInverse);
    position.copy(this.target).add(offset);
    this.camera.lookAt(this.target);
  },

  updateCamera: function () {
    this.camera.lookAt(this.target);
  },

  tick: function () {
    if (this.data.enableDamping && !this.isDragging) {
      this.updateCameraPosition();
    }
  },

  remove: function () {
      this.el.sceneEl.removeEventListener('model-clicked');
  }
});

AFRAME.registerComponent('clickable-model', {
  init: function () {
    this.el.addEventListener('click', (event) => {
      let position = this.el.object3D.position;
      this.el.sceneEl.emit('model-clicked', { position: position });
    });
  },
});