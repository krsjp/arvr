AFRAME.registerComponent('touch-joystick', {
  schema: {
    cameraRig: { type: 'selector' },
    camera: { type: 'selector' },
    maxDistance: { type: 'number', default: 50 },
    baseColor: { type: 'string', default: '#555' },
    handleColor: { type: 'string', default: '#aaa' },
    baseOpacity: { type: 'number', default: 0.5 },
    handleOpacity: { type: 'number', default: 0.8 }
  },

  



  init: function () {
    this.cameraRig = this.data.cameraRig;
    this.camera = this.data.camera;
    this.isDragging = false;//Indicates if the user is currently dragging the joystick.
    this.startTouchX = 0;//Stores the X coordinate of the touch when the touch starts.
    this.startTouchY = 0;//Stores the Y coordinate of the touch when the touch starts.
    this.currentTouchX = 0;//Stores the current X coordinate of the touch.
    this.currentTouchY = 0;//Stores the current Y coordinate of the touch.
    this.initialTouchX = 0; //Stores the initial x coordinate of the touch when the touch starts
    this.initialTouchY = 0; //Stores the initial y coordinate of the touch when the touch starts
    this.joystickBase = null;//Reference to the joystick base entity.
    this.joystickHandle = null;//Reference to the joystick handle entity.
    this.joystickRadius = 0;//Radius of the joystick base.
    this.handleRadius = 0;//Radius of the joystick handle.

    this.controller = null;
    this.controllerMove = { x: 0, y: 0 };
    this.controllerRotation = { x: 0, y: 0 };
    this.createJoystick();
    this.addEventListeners();
    this.addControllerEventListeners();
  },

  createJoystick: function () {
    const joystickSize = this.data.maxDistance * 2;
    const handleSize = this.data.maxDistance / 2;

    this.joystickBase = document.createElement('a-entity');
    this.joystickBase.setAttribute('geometry', { primitive: 'circle', radius: joystickSize, segments: 64 });
    this.joystickBase.setAttribute('material', { color: this.data.baseColor, opacity: this.data.baseOpacity, transparent: true });
    this.joystickBase.setAttribute('position', { x: -1.5, y: -1, z: -0.5 });
    this.joystickBase.setAttribute('visible', false);
    this.el.sceneEl.appendChild(this.joystickBase);

    this.joystickHandle = document.createElement('a-entity');
    this.joystickHandle.setAttribute('geometry', { primitive: 'circle', radius: handleSize, segments: 64 });
    this.joystickHandle.setAttribute('material', { color: this.data.handleColor, opacity: this.data.handleOpacity, transparent: true });
    this.joystickHandle.setAttribute('position', { x: -1.5, y: -1, z: -0.4 });
    this.joystickHandle.setAttribute('visible', false);
    this.el.sceneEl.appendChild(this.joystickHandle);

    this.joystickRadius = joystickSize;
    this.handleRadius = handleSize;
  },

  addEventListeners: function () {
    this.el.addEventListener('touchstart', this.onTouchStart.bind(this));
    this.el.addEventListener('touchmove', this.onTouchMove.bind(this));
    this.el.addEventListener('touchend', this.onTouchEnd.bind(this));
  },
  
  addControllerEventListeners: function () {
    this.el.sceneEl.addEventListener('controllerconnected', (event) => {
      console.log("Controller connected", event.detail.component);
      this.controller = event.detail.component;
    });

    this.el.sceneEl.addEventListener('axismove', () => {
        console.log("Axes values:", this.controller.axes);
        this.controllerMove.x = this.controller.axes[2];
        this.controllerMove.y = this.controller.axes[3];
        
        this.controllerRotation.y = this.controller.axes[0];
    });
    this.el.sceneEl.addEventListener('controllerdisconnected', () => {
    this.el.addEventListener('touchend', this.onTouchEnd.bind(this));
  },

  onTouchStart: function (event) {
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      this.initialTouchX = touch.clientX;
      this.initialTouchY = touch.clientY;
      this.currentTouchX = touch.clientX;
      this.currentTouchY = touch.clientY;
      this.isDragging = true;
      this.joystickBase.object3D.visible = true;
      this.joystickHandle.object3D.visible = true;
      this.joystickBase.object3D.position.set((touch.clientX / window.innerWidth) * 4 - 2, (-touch.clientY / window.innerHeight) * 4 + 2, -0.5);
      this.joystickHandle.object3D.position.copy(this.joystickBase.object3D.position);
    }
  },

  onTouchMove: function (event) {
    if (this.isDragging && event.touches.length === 1) {
      const touch = event.touches[0];
      this.currentTouchX = touch.clientX;
      this.currentTouchY = touch.clientY;

      const deltaX = (this.currentTouchX - this.startTouchX) / window.innerWidth;
      const deltaY = (this.currentTouchY - this.startTouchY) / window.innerHeight;

      const newHandleX = this.joystickBase.object3D.position.x + deltaX * this.data.maxDistance*2;
      const newHandleY = this.joystickBase.object3D.position.y - deltaY * this.data.maxDistance*2;

      const dx = newHandleX - this.joystickBase.object3D.position.x;
      const dy = newHandleY - this.joystickBase.object3D.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > this.joystickRadius) {
        const angle = Math.atan2(dy, dx);
        const clampedX = this.joystickBase.object3D.position.x + this.joystickRadius * Math.cos(angle);
        const clampedY = this.joystickBase.object3D.position.y + this.joystickRadius * Math.sin(angle);
      this.joystickHandle.object3D.position.set(clampedX, clampedY, -0.4);
      } else {
      this.joystickHandle.object3D.position.set(newHandleX, newHandleY, -0.4);
      }
      this.moveCamera(deltaX, deltaY);
      this.startTouchX = this.currentTouchX;
      this.startTouchY = this.currentTouchY;
    }
  },

  onTouchEnd: function (event) {
    this.isDragging = false;
    this.joystickHandle.object3D.position.copy(this.joystickBase.object3D.position);
    this.joystickBase.object3D.visible = false;
    this.joystickHandle.object3D.visible = false;
  },

  moveCamera: function (deltaX, deltaY) {
    

    const cameraRig = this.cameraRig.object3D;
    const camera = this.camera.object3D;

    if (this.controller) {
      const moveSpeed = 0.05;
      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
      const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
      const horizontalMovement = right.multiplyScalar(this.controllerMove.x * moveSpeed);
      const verticalMovement = forward.multiplyScalar(this.controllerMove.y * moveSpeed);
      const movement = horizontalMovement.add(verticalMovement);
      cameraRig.position.add(movement);
      cameraRig.rotation.y -= this.controllerRotation.y * 0.01;
      return;
    }

    const moveSpeed = 0.01;    
    const rotationSpeed = 0.005;

    const horizontalMovement = right.multiplyScalar(deltaX * moveSpeed);
    const verticalMovement = forward.multiplyScalar(deltaY * moveSpeed);
    
    const movement = horizontalMovement.add(verticalMovement);
    cameraRig.position.add(movement);
    cameraRig.rotation.y -= (touch.clientX - this.initialTouchX) * rotationSpeed;
  },
});