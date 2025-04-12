AFRAME.registerComponent("model-changer", {
  init: function () {
    this.changeModel = this.changeModel.bind(this);
    this.el.addEventListener("change-model", this.changeModel);
  },

  remove: function () {
    this.el.removeEventListener("change-model", this.changeModel);
  },

  init: function () {
    this.changeModel = this.changeModel.bind(this)
    this.el.addEventListener('change-model', this.changeModel)
  },

  changeModel: function (event) {    
    const modelPath = event.detail.path
    this.el.setAttribute('gltf-model', modelPath);
  }
})