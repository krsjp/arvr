  const cameraRig = document.getElementById('cameraRig');
  const camera = cameraRig.querySelector('a-camera');

  let moveX = 0;
  let moveY = 0;
  let rotY = 0;

  // Joystick esquerdo – movimentação
  const joystickLeft = nipplejs.create({
    zone: document.getElementById('joystick-left'),
    mode: 'static',
    position: { left: '50%', top: '50%' },
    color: 'blue'
  });

  joystickLeft.on('move', function (evt, data) {
    const angle = data.angle.radian;
    const force = data.force;

    moveX = Math.cos(angle) * force * 0.05;
    moveY = Math.sin(angle) * force * 0.05;
  });

  joystickLeft.on('end', function () {
    moveX = 0;
    moveY = 0;
  });

  // Joystick direito – rotação da câmera
  const joystickRight = nipplejs.create({
    zone: document.getElementById('joystick-right'),
    mode: 'static',
    position: { left: '50%', top: '50%' },
    color: 'red'
  });

  joystickRight.on('move', function (evt, data) {
    const distance = data.distance;
    const angle = data.angle.degree;

    // Ajuste fino da rotação com base na direção do movimento
    if (angle > 45 && angle < 135) {
      rotY = distance * 0.2; // direita
    } else if (angle > 225 && angle < 315) {
      rotY = -distance * 0.2; // esquerda
    } else {
      rotY = 0;
    }
  });

  joystickRight.on('end', function () {
    rotY = 0;
  });

  // Componente A-Frame que atualiza posição e rotação
  AFRAME.registerComponent('dual-joystick', {
    tick: function () {
      const pos = cameraRig.getAttribute('position');
      const rot = camera.getAttribute('rotation');

      // Movimento baseado na rotação atual da câmera
      const angleRad = THREE.MathUtils.degToRad(rot.y);
      pos.x += Math.sin(angleRad) * moveY + Math.cos(angleRad) * moveX;
      pos.z += Math.cos(angleRad) * moveY - Math.sin(angleRad) * moveX;
      cameraRig.setAttribute('position', pos);

      // Rotação horizontal (eixo Y)
      rot.y += rotY * 0.05;
      camera.setAttribute('rotation', rot);
    }
  });

  cameraRig.setAttribute('dual-joystick', '');
