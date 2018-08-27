function jThreePanoramaImagePoints(imageElm,imageSrc) {

    this.onload = false;
    this.loadEnd = function(){};
    this.clickEnd = function(){};

    this.image;
    this.imageElm = imageElm;
    this.imageSrc = imageSrc;
    this.imageWidth = window.innerWidth;
    this.imageHeight = window.innerHeight;

    //
    this.container,
    this.scene,
    this.group,
    this.renderer,
    this.camera,
    this.imageTexture,
    this.screen,
    this.animate,
    this.animateFrame;

    //
    this.controls;
    this.enableRotate = true;
    this.rotateSpeed = 1;
    this.autoRotate = false;
    this.enablePan = false;
    this.autoRotateSpeed = 1;
    this.minDistance = 1;
    this.maxDistance = 6;
    this.enableZoom = true;
    this.zoomSpeed = 10;
    this.deviceOrientationControls = false;

    this.defaultDistance = 1;
    this.reverse = true;

    //
    this.raycaster;
    this.mouse = new THREE.Vector2();
    this.targetList = [];
    this.pointList = [];
    this.body = document.getElementsByTagName('body')[0];

    //
    this.playing = false;

    //
    this.initCamera();
    this.ImageInit();

    var that = this;
    this.image.onload = function(){
        that.loadEnd();
    };

}

////

jThreePanoramaImagePoints.prototype.ImageInit = function() {

    this.image = new Image();
    this.image.src = this.imageSrc;

}

////

jThreePanoramaImagePoints.prototype.initThree = function() {

    this.container = document.createElement( 'div' );
    this.imageElm.appendChild( this.container );

    this.scene = new THREE.Scene();

    this.raycaster = new THREE.Raycaster();

    this.renderer = new THREE.WebGLRenderer( {
        antialias:true,
        alpha: true
    } );
    this.renderer.setSize( this.imageWidth, this.imageHeight );
    this.renderer.setClearColor("#111111", 1);
    this.container.appendChild( this.renderer.domElement );

    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);

    var that = this;
    window.addEventListener( 'resize', function() {
        that.onWindowResize(that);
    }, false );

    this.container.addEventListener( 'mousemove', function( event ) {
        that.onDocumentMouseMove( event, that );
    }, false );
    this.container.addEventListener( 'dblclick', function( event ) {
        that.onDocumentMouseDown( event, that );
    }, false );

}

////

jThreePanoramaImagePoints.prototype.initCamera = function() {

    this.camera = new THREE.PerspectiveCamera(50, this.imageWidth / this.imageHeight, 1, 1000);
    this.camera.position.set(0,0,1);

}

////

jThreePanoramaImagePoints.prototype.initObject = function() {

    this.initGeometry = new THREE.SphereGeometry( 5, 60, 40 );

    this.imageTexture = new THREE.TextureLoader().load( this.imageSrc );

    var material = new THREE.MeshBasicMaterial({
        map : this.imageTexture
    });

    this.screen = new THREE.Mesh( this.initGeometry, material );
    this.screen.rotation.set(0,-Math.PI/2,0);
    this.scene.add( this.screen );

}

jThreePanoramaImagePoints.prototype.initWireframe = function( radius ) {

    this.geoWireframe = new THREE.SphereGeometry( radius, 180, 90 );

    var matWireframe = new THREE.MeshBasicMaterial({
        color: 0xbb3a3a,
        wireframe: true,
        transparent: true,
        opacity: 1
    });

    var wireframe = new THREE.Mesh( this.geoWireframe, matWireframe );
    wireframe.rotation.set(0,-Math.PI/2,0);
    this.scene.add( wireframe );

}

////

jThreePanoramaImagePoints.prototype.initGuidePoint = function() {

    this.pointGeometry = new THREE.SphereGeometry( 0.05, 10, 10 );
    this.pointGroup = new THREE.Group();

    var pointId = 0;

    for ( var i = 0; i < 180; i ++ ) {

        for (var j = 0; j < 180; j++) {

            var material = new THREE.MeshBasicMaterial( {
                color: 0xff0000,
                transparent: true,
                opacity: 0
            } );
            var point = new THREE.Mesh( this.pointGeometry, material );

            var latitude = (i - 90) * 2;
            var longitude = (j - 90) * 2;

            point.position.copy(this.translateGeoCoords(latitude, longitude, 5));
            point.renderOrder = 1;

            this.pointGroup.add( point );
            this.targetList.push( point );
            this.pointList.push( {
                "id": pointId,
                "latitude": latitude,
                "longitude": longitude
            } );

            point.name = pointId;
            pointId ++;

        }

    }

    this.scene.add( this.pointGroup );
    this.pointGroup.rotation.set(0,-Math.PI/2,0);

}

////

jThreePanoramaImagePoints.prototype.initAxis = function() {

    var axis = new THREE.AxisHelper(1000);
    axis.position.set(0,0,0);
    axis.rotation.set(0,-Math.PI/2,0);
    this.scene.add(axis);

}

////

jThreePanoramaImagePoints.prototype.onWindowResize = function(that) {

    that.camera.aspect = window.innerWidth / window.innerHeight;
    that.camera.updateProjectionMatrix();

    that.renderer.setSize( window.innerWidth, window.innerHeight );

}

////

jThreePanoramaImagePoints.prototype.play = function() {

    this.initThree();
    this.initObject();
    this.initGuidePoint();
    // this.initAxis();

    if (!this.deviceOrientationControls) {
        this.controls.minDistance = this.minDistance;
        this.controls.maxDistance = this.maxDistance;
        this.controls.enableZoom = this.enableZoom;
        this.controls.zoomSpeed = this.zoomSpeed;
        this.controls.autoRotate = this.autoRotate;
        this.controls.autoRotateSpeed = this.autoRotateSpeed;
        this.controls.rotateSpeed = this.rotateSpeed;
        this.controls.enableRotate = this.enableRotate;
        this.controls.enablePan = this.enablePan;
    }
    if( this.reverse ) {
        this.initGeometry.scale( - 1, 1, 1 );
        this.pointGroup.scale.set( -0.95, 0.95, 0.95 );
        var radius = 4.99;
    } else {
        var radius = 5.01;
    }

    this.initWireframe( radius );

    this.camera.position.z = this.defaultDistance;

    this.render();
    this.playing = true;
}


jThreePanoramaImagePoints.prototype.start = function() {

    if(this.autoRotate) this.controls.autoRotate = true;
    this.playing = true;

}

jThreePanoramaImagePoints.prototype.stop = function() {

    if(this.autoRotate) this.controls.autoRotate = false;
    this.playing = false;

}

////

jThreePanoramaImagePoints.prototype.stopToggle = function() {
    this.playing ? this.stop() : this.start();
};

////

jThreePanoramaImagePoints.prototype.onDocumentMouseMove = function( event, that ) {

    event.preventDefault();

    that.mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    that.mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

}
jThreePanoramaImagePoints.prototype.onDocumentMouseDown = function( event, that ) {

    // イベントの伝播の無効化
    event.preventDefault();

    // マウスポインタの位置座標の取得
    that.mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    that.mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

    // 光線を発射
    that.raycaster.setFromCamera( that.mouse, that.camera );

    // 光線と交わるオブジェクトを収集
    var intersects = that.raycaster.intersectObjects( that.targetList );

    // 交わるオブジェクトが１個以上の場合
    if ( intersects.length > 0 ) {

        var getPoint = intersects[0].object;
        var getPointId = getPoint.name;

        for (var i = 0; i < that.targetList.length; i++) {
            if (getPointId == that.pointList[i].id) {
                getPoint.material.opacity = 1;
                getPoint.scale.set(2,2,2);
                that.clickEnd(that.pointList[i].latitude, that.pointList[i].longitude);
            }
        }

    }
}

jThreePanoramaImagePoints.prototype.translateGeoCoords = function( latitude, longitude, radius ) {
    // 仰角
    var phi = (latitude) * Math.PI / 180;
    // 方位角
    var theta = (longitude - 180) * Math.PI / 180;

    var x = -(radius) * Math.cos(phi) * Math.cos(theta);
    var y = (radius) * Math.sin(phi);
    var z = (radius) * Math.cos(phi) * Math.sin(theta);

    return new THREE.Vector3(x, y, z);
}

////

jThreePanoramaImagePoints.prototype.render = function() {

    var that = this;

    this.animate = function () {

        that.animateFrame = requestAnimationFrame( that.animate );

		that.raycaster.setFromCamera( that.mouse, that.camera );

		var intersects = that.raycaster.intersectObjects( that.targetList );

		if ( intersects.length > 0 ) {

            that.body.style.cursor = "pointer";

		} else {

            that.body.style.cursor = "inherit";

		}

        that.renderer.render( that.scene, that.camera );
        that.controls.update();
    }

    this.animate();

}
