function jThreePanoramaImageClick(imageElm,imageSrc) {

    var imageUA = navigator.userAgent;
    this.imageSP = false;

    if(/(iPhone|iPod|iPad|Android)/.test(imageUA)) {
        this.imageSP = true;
    }

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
    this.zoomSpeed = 10;
    this.deviceOrientationControls = false;

    this.reverse = true;
    this.defaultDistance = 1;
    this.defaultRotateX = 0;
    this.defaultRotateY = Math.PI/2;

    //
    this.raycaster;
    this.mouse = new THREE.Vector2();
    this.targetList = [];
    this.pointList = [];
    this.points = [];
    this.pointTexture = false;
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

jThreePanoramaImageClick.prototype.ImageInit = function() {

    this.image = new Image();
    this.image.src = this.imageSrc;

}

////

jThreePanoramaImageClick.prototype.initThree = function() {

    this.container = document.createElement( 'div' );
    this.imageElm.appendChild( this.container );

    this.scene = new THREE.Scene();

    this.raycaster = new THREE.Raycaster();

    this.renderer = new THREE.WebGLRenderer( {
        antialias:true,
        alpha: true
    } );
    this.renderer.setSize( this.imageWidth, this.imageHeight );
    this.renderer.setClearColor("#FFFFFF", 1);
    this.container.appendChild( this.renderer.domElement );

    if( this.deviceOrientationControls ){
        if (this.imageSP) {
            this.controls = new THREE.DeviceOrientationControls(this.camera,this.renderer.domElement);
        } else {
            this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        }

    } else {
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    }

    var that = this;
    window.addEventListener( 'resize', function() {
        that.onWindowResize(that);
    }, false );

    this.container.addEventListener( 'mousemove', function( event ) {
        that.onDocumentMouseMove( event, that );
    }, false );
    this.container.addEventListener( 'mousedown', function( event ) {
        that.onDocumentMouseDown( event, that );
    }, false );

}

////

jThreePanoramaImageClick.prototype.initCamera = function() {

    this.camera = new THREE.PerspectiveCamera(50, this.imageWidth / this.imageHeight, 1, 1000);
    this.camera.position.set(0,0,1);

}

////

jThreePanoramaImageClick.prototype.initObject = function() {

    this.initGeometry = new THREE.SphereGeometry( 5, 60, 40 );

    this.imageTexture = new THREE.TextureLoader().load( this.imageSrc );

    var material = new THREE.MeshBasicMaterial({
        map : this.imageTexture
    });

    var rotateFixX = this.reverse ? -this.defaultRotateX  : this.defaultRotateX;
    var rotateFixY = this.reverse ? -this.defaultRotateY  : this.defaultRotateY;

    this.screen = new THREE.Mesh( this.initGeometry, material );
    this.screen.material.map.minFilter = THREE.LinearFilter;

    this.screen.rotation.set( rotateFixX, rotateFixY, 0 );
    this.scene.add( this.screen );

}


////

jThreePanoramaImageClick.prototype.initSetPoint = function() {

    var sphere = new THREE.SphereGeometry( 0.12, 100, 60 );
    var cube = new THREE.CubeGeometry( 0.3, 0.3, 0.01, 5, 5, 5 );

    this.pointGeometry = this.pointTexture ? cube : sphere;
    this.pointGroup = new THREE.Group();

    var vector = new THREE.Vector3();

    for ( var i = 0; i < this.points.length; i ++ ) {

        var material = new THREE.MeshBasicMaterial( {
            map : this.points[i].texture && this.pointTexture ? new THREE.TextureLoader().load( this.points[i].texture ) : null,
            color: 0xffcc00,
            transparent: true,
            opacity: 1,
            alphaTest:0.2,
        } );

        var point = new THREE.Mesh( this.pointGeometry, material );

        var latitude = this.points[i].latitude;
        var longitude = this.points[i].longitude;
        point.position.copy( this.translateGeoCoords(latitude, longitude, 5) );

        //全て中心核向き
		vector.copy( point.position ).multiplyScalar( 2 );
		point.lookAt( vector );

        this.pointGroup.add( point );

        this.targetList.push( point );
        this.pointList.push( {
            "id": i,
            "latitude": latitude,
            "longitude": longitude
        } );

        point.name = i;

    }

    this.scene.add( this.pointGroup );

}


jThreePanoramaImageClick.prototype.onWindowResize = function(that) {

    that.camera.aspect = window.innerWidth / window.innerHeight;
    that.camera.updateProjectionMatrix();

    that.renderer.setSize( window.innerWidth, window.innerHeight );

}

////

jThreePanoramaImageClick.prototype.play = function() {

    this.initThree();
    this.initObject();
    this.initSetPoint();

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
        this.pointGroup.scale.set( -0.96, 0.96, 0.96 );
        this.initGeometry.scale( - 1, 1, 1 );
    }

    this.camera.position.z = this.defaultDistance;

    this.render();
    this.playing = true;
}


jThreePanoramaImageClick.prototype.start = function() {

    if(this.autoRotate) this.controls.autoRotate = true;
    this.playing = true;

}

jThreePanoramaImageClick.prototype.stop = function() {

    if(this.autoRotate) this.controls.autoRotate = false;
    this.playing = false;

}

////

jThreePanoramaImageClick.prototype.stopToggle = function() {
    this.playing ? this.stop() : this.start();
};

////

jThreePanoramaImageClick.prototype.onDocumentMouseMove = function( event, that ) {

    event.preventDefault();

    that.mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    that.mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

}
jThreePanoramaImageClick.prototype.onDocumentMouseDown = function( event, that ) {

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
                that.clickEnd(getPoint, this.pointList[i]);
            }
        }

    }
}

jThreePanoramaImageClick.prototype.translateGeoCoords = function( latitude, longitude, radius ) {
    // 仰角
    var phi = ( (latitude) * Math.PI / 180 ) - this.defaultRotateX;
    // 方位角
    var theta = ( (longitude - 180) * Math.PI / 180 ) + this.defaultRotateY;

    var x = -(radius) * Math.cos(phi) * Math.cos(theta);
    var y = (radius) * Math.sin(phi);
    var z = (radius) * Math.cos(phi) * Math.sin(theta);

    return new THREE.Vector3(x, y, z);

}

jThreePanoramaImageClick.prototype.transform = function( from, to, speed ) {

    var THAT = this;

    this.tween = new TWEEN.Tween( from )
        .to( to , speed )
        .onComplete(function(){
        })
        .easing( TWEEN.Easing.Quartic.InOut ).start();

}


////

jThreePanoramaImageClick.prototype.render = function() {

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

        if( that.deviceOrientationControls ){

            if (that.imageSP) {
                that.controls.connect();
                that.controls.update();
            } else {
                that.controls.update();
            }
        } else {
            that.controls.update();
        }
        TWEEN.update();

    }

    this.animate();

}
