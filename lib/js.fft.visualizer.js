
// Constructor
function FFTPlayerVisualizer() {

	this.container = document.getElementById('container');

	this.uniforms = {
		u_time: { type: "f", value: 1.0 },
		u_volume: { type: "f", value: 1.0 },
		u_volume_minus: { type: "f", value: 0.3 }, //0.3 --- 0.56
		u_volume_multiply: { type: "f", value: 5.0 }, //6.0 --- 3.3
		u_resolution: { type: "v2", value: new THREE.Vector2() }
	};

	// create scene
	this.camera = new THREE.Camera();
	this.camera.position.z = 1;
	this.scene = new THREE.Scene();
	this.geometry = new THREE.PlaneBufferGeometry(2, 2);
	

	this.mesh = new THREE.Mesh(this.geometry);
	this.scene.add(this.mesh);

	this.renderer = new THREE.WebGLRenderer();
	//this.renderer.setPixelRatio(window.devicePixelRatio);
	this.container.appendChild(this.renderer.domElement);
}

FFTPlayerVisualizer.prototype.loadShader = function(vertexFilename, fragmentFilename) {
	// load shader
	function getSourceSynch(url) {
		var req = new XMLHttpRequest();
		req.open("GET", url, false);
		req.send(null);
		return (req.status == 200) ? req.responseText : null;
	}
	var vertexShader = getSourceSynch(vertexFilename);
	var fragmentShader = getSourceSynch(fragmentFilename);
	this.mesh.material = new THREE.ShaderMaterial( {
		transparent:true,
		uniforms: this.uniforms,
		vertexShader: vertexShader,
		fragmentShader: fragmentShader
	});
}

FFTPlayerVisualizer.prototype.resize = function(width, height) {
	this.renderer.setSize(window.innerWidth, window.innerHeight);
	this.uniforms.u_resolution.value.x = this.renderer.domElement.width;
	this.uniforms.u_resolution.value.y = this.renderer.domElement.height;
}

FFTPlayerVisualizer.prototype.renderValue = function(volume) {
	this.uniforms.u_time.value += 0.015;
	this.uniforms.u_volume.value = volume;
	this.renderer.render(this.scene, this.camera);
}