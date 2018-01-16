var rotation = [.0,.0,.0];
var delta = .001;
var rotating = true;
var gl;
var thetaVar;
var numItems

var oldTime = 0;
var currentTime = 0;
var deltaTime = 0;
var planetShaderProgram;
var starsShaderProgram;
var texCoordArray;
var normals;
var projectionMatrix;
var modelViewMatrix;
var objCenter;
var camCenter;
var lightP;

window.onload = function main()
{
   oldTime = Date.now();
   currentTime = oldTime;
	
   run(2,1.0);
   update()
}

function GameObject(mesh, pos, rot){
	this.myMesh = mesh;
	this.position = pos;
	this.rotation = rot;
	
	
}

function run(){
	var slider = document.getElementById('myRange');
	var carpetMaxLevel = slider.value;
	document.getElementById("myRotateToggle").onclick = rotationButtonClicked;
	gl;
	
   //get a reference to the main canvas
   var canvas = document.getElementById('mainCanvas');
   canvas.onclick = changeRotDirClicked;
   try {
      gl = canvas.getContext('experimental-webgl');
   } catch (e) {
      throw new Error('brouser doesnt support webGL');
   }

   var planetVertCode = document.getElementById('planet-vertex-shader');		
   var planetVertShader = buildShader(gl,gl.VERTEX_SHADER,planetVertCode.text);   
   var planetFragCode = document.getElementById('planet-fragment-shader');    
   var planetFragShader = buildShader(gl,gl.FRAGMENT_SHADER,planetFragCode.text);
   planetShaderProgram = buildplanetShaderProgram(gl,planetVertShader,planetFragShader); 
   
   
   
   
   //clear the drawing surface
   gl.clearColor(0.0, 0.0, 0.0, 1.0);
   gl.clear(gl.COLOR_BUFFER_BIT);
   //have to tell webGL what shader program to use
   gl.useProgram(planetShaderProgram);
   gl.enable(gl.DEPTH_TEST);
   gl.depthFunc(gl.LESS);
   gl.enable(gl.CULL_FACE);
   gl.cullFace(gl.BACK);
   
   camCenter = [0.0,0.0,0.5,0.0];
   updateCamPos();
   objCenter = [0.0,0.0,0.0,0.0];
   projectionMatrix = perspective( 100.0, 1, 0, 100);//ortho(-1, 1, -1, 1, 0, 100);
   var eye = vec3(camCenter[0],camCenter[1],camCenter[2]);
   var at =  vec3(objCenter[0],objCenter[1],objCenter[2]);
   var up = vec3(0.0,1.0,0.0);
   modelViewMatrix = lookAt( eye, at, up );
   
   //original square's verts
   /*
   var vertices = [
      0.3333,0.3333,0.3333,1.0,  0.3333,-0.3333,0.3333,1.0,  -0.3333,-0.3333,0.3333,1.0,
	  -0.3333,0.3333,0.3333,1.0,  0.3333,0.3333,0.3333,1.0,  -0.3333,-0.3333,0.3333,1.0,
	  	  
   ];*/
   //original square's centers
   var centers = [
      0.0,0.0,0.0,1.0,  0.0,0.0,0.0,1.0,  0.0,0.0,0.0,1.0,
	  0.0,0.0,0.0,1.0,  0.0,0.0,0.0,1.0,  0.0,0.0,0.0,1.0,
	  
   ];
   //original squares normals
   normals = [
      .0,.0,-1.0,1.0,  .0,.0,-1.0,1.0,  .0,.0,-1.0,1.0,
	  .0,.0,-1.0,1.0,  .0,.0,-1.0,1.0,  .0,.0,-1.0,1.0,
	  
   ];
   
   texCoordArray = [
	0,0,
	0,1,
	1,1,
	1,0,
	0,0,
	1,1,
   ];
   /*
   = [
	0,0,
	0,1,
	1,1,
	1,0,
	0,0,
	1,1,
   ];
 
   */
   
   
   //console.log(vertices);
   //build the carpet
   var vertices = CubeSphere(carpetMaxLevel);//recurseCarpet(vertices,carpetMaxLevel);
   //centers = CubeSphere(carpetMaxLevel);//recurseCarpet(centers,carpetMaxLevel);
   normals = vertices.slice();
   //recurseNorms(carpetMaxLevel);
   
   
   //var data = vertices.concat(centers);
   //console.log(vertices);
   //console.log(normals);
   //console.log(centers);
   var itemSize = 4;
   numItems = vertices.length/itemSize;
   console.log(numItems);
   //create a buffer for the verticies
   var vBuffer = gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
   gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
   var coordinatesVar = gl.getAttribLocation(planetShaderProgram, "coordinates");  
   gl.enableVertexAttribArray(coordinatesVar);  
   gl.vertexAttribPointer(coordinatesVar, 4, gl.FLOAT, false, 0, 0);
   
	/*
   var cBuffer = gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
   gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(centers), gl.STATIC_DRAW);
   var centerVar = gl.getAttribLocation(planetShaderProgram, "center");
   gl.enableVertexAttribArray(centerVar);
   gl.vertexAttribPointer(centerVar, 4, gl.FLOAT, false, 0, 0);
   */
   
   //var nBuffer = gl.createBuffer();
   //gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
   //gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
   //var normalVar = gl.getAttribLocation(planetShaderProgram, "vNorm");
   //gl.enableVertexAttribArray(normalVar);
   //gl.vertexAttribPointer(normalVar, 4, gl.FLOAT, false, 0, 0);
   
   thetaVar = gl.getUniformLocation(planetShaderProgram,"theta");
   gl.uniform3fv(thetaVar, rotation);
   
   
   //material and light stuff here
   lightP = vec4(1.0, 1.0, 1.0, 1.0);//1.0 for point light, 0 for dir
   
   
   updateLightNMat();
   modelViewMatVar = gl.getUniformLocation(planetShaderProgram,"modelViewMatrix");
   gl.uniformMatrix4fv(modelViewMatVar, false, flatten(modelViewMatrix) );
   
   projectionMatVar = gl.getUniformLocation(planetShaderProgram,"projectionMatrix");
   gl.uniformMatrix4fv(projectionMatVar, false, flatten(projectionMatrix) );
   
   objCenterVar = gl.getUniformLocation(planetShaderProgram,"objCenter");
   gl.uniform4fv(objCenterVar, new Float32Array(objCenter));
   
   camPosVar = gl.getUniformLocation(planetShaderProgram,"camPos");
   gl.uniform4fv(camPosVar, new Float32Array(camCenter));
    var tBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, tBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, new Float32Array(texCoordArray), gl.STATIC_DRAW );

    var texVar = gl.getAttribLocation( planetShaderProgram, "vTexCoord" );
    gl.vertexAttribPointer( texVar, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( texVar );
   
   var image1 = document.getElementById("image");
   setImageToCarpet(image1);  
   var image2 = document.getElementById("normal");
   setNormalMaptoCarpet(image2);   
   var image3 = document.getElementById("bump");
   setBumpMaptoCarpet(image3);   
   
   gl.drawArrays(gl.TRIANGLES, 0, numItems);
   
   
	
}
function update(){
	oldTime = currentTime;
	currentTime = Date.now();
	
	deltaTime = currentTime - oldTime;
	
	if(rotating)
		rotation[2] += delta * deltaTime;
	

	updateCamPos();
	camCenter[0] = Math.sin(rotation[2])*camCenter[2];
	camCenter[2] = Math.cos(rotation[2])*camCenter[2];
	//projectionMatrix = ortho(-10, 10, -10, 10, 0, 100);
	projectionMatrix = perspective(60.0, 1, 0.1, 100);//ortho(-1, 1, -1, 1, 0, 100);
    var eye = vec3(camCenter[0],camCenter[1],camCenter[2]);
    var at =  vec3(objCenter[0],objCenter[1],objCenter[2]);
    var up = vec3(0.0,1.0,0.0);
    modelViewMatrix = lookAt( eye, at, up );
	gl.useProgram(planetShaderProgram);
	modelViewMatVar = gl.getUniformLocation(planetShaderProgram,"modelViewMatrix");
    gl.uniformMatrix4fv(modelViewMatVar, false, flatten(modelViewMatrix) ); 
    projectionMatVar = gl.getUniformLocation(planetShaderProgram,"projectionMatrix");
    gl.uniformMatrix4fv(projectionMatVar, false, flatten(projectionMatrix) );
	
	//console.log(lightP);
	lightVar = gl.getUniformLocation(planetShaderProgram,"lightPos");
    gl.uniform4fv(lightVar, flatten(lightP));
    gl.clear(gl.COLOR_BUFFER_BIT);
	gl.uniform3fv(thetaVar, new Float32Array(rotation));
	gl.uniform4fv(camPosVar, new Float32Array(camCenter));
    //tell gl to draw the carpet
	gl.drawArrays(gl.TRIANGLES, 0, numItems);
	
	window.requestAnimationFrame(update);
	
}
function updateLightNMat(){
	
	var x = document.getElementById('lightXRange');
	var y = document.getElementById('lightYRange');
	var z = document.getElementById('lightZRange');
	lightP = vec4(x.value,y.value,z.value,1.0);
	
   var litCol = document.getElementById('litC');
   var hexVal = litCol.value;   
   var r = parseInt(hexVal[1]+hexVal[2],16)/255;
   var g = parseInt(hexVal[3]+hexVal[4],16)/255;
   var b = parseInt(hexVal[5]+hexVal[6],16)/255;
   console.log("r="+r+"g="+g+"b="+b);
   var la = document.getElementById('lightA');
   var lightAmbient  = vec4(la.value*r,la.value*g,la.value*b,1.0);
   var ld = document.getElementById('lightD');
   var lightDiffuse  = vec4(ld.value*r,ld.value*g,ld.value*b,1.0);
   var ls = document.getElementById('lightS');
   var lightSpecular = vec4(ls.value*r,ls.value*g,ls.value*b,1.0);
   
   var matCol = document.getElementById('matC');
   hexVal = matCol.value;
   
   r = parseInt(hexVal[1]+hexVal[2],16)/255;
   g = parseInt(hexVal[3]+hexVal[4],16)/255;
   b = parseInt(hexVal[5]+hexVal[6],16)/255;
   console.log("r="+r+"g="+g+"b="+b);
   var ma = document.getElementById('matA');
   var materialAmbient  = vec4(ma.value*r,ma.value*g,ma.value*b,1.0);
   var md = document.getElementById('matD');
   var materialDiffuse  = vec4(md.value*r,md.value*g,md.value*b,1.0);
   var ms = document.getElementById('matS');
   var materialSpecular = vec4(ms.value*r,ms.value*g,ms.value*b,1.0);
   
   lightVar = gl.getUniformLocation(planetShaderProgram,"lightPos");
   gl.uniform4fv(lightVar, flatten(lightP));
   
   var ambientProduct = add(lightAmbient, materialAmbient);
   console.log("amb prod"+ambientProduct);
   var diffuseProduct = add(lightDiffuse, materialDiffuse);
   console.log("diff prod"+diffuseProduct);
   var specularProduct = add(lightSpecular, materialSpecular);
   console.log("spec prod"+specularProduct);
   gl.uniform4fv(gl.getUniformLocation(planetShaderProgram,"ambientProduct"), flatten(ambientProduct));
   gl.uniform4fv(gl.getUniformLocation(planetShaderProgram,"diffuseProduct"), flatten(diffuseProduct) );
   gl.uniform4fv(gl.getUniformLocation(planetShaderProgram,"specularProduct"), flatten(specularProduct) );

   shineVar = gl.getUniformLocation(planetShaderProgram,"shininess");
   gl.uniform1f(shineVar, document.getElementById('matSh').value);
}
function buildShader(gl,type,source){
	//all the stuff gl has to do to compile the shader
	var sh = gl.createShader(type);
    gl.shaderSource(sh, source);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS))
		throw new Error(gl.getShaderInfoLog(sh));
	return sh;
}
function buildplanetShaderProgram(gl,vertShader,fragShader){
	//all the stuff gl has to do to compile and link the shader program
	var planetShaderProgram = gl.createProgram();
    gl.attachShader(planetShaderProgram, vertShader);
    gl.attachShader(planetShaderProgram, fragShader);
    gl.linkProgram(planetShaderProgram);
    if (!gl.getProgramParameter(planetShaderProgram, gl.LINK_STATUS))
		throw new Error(gl.getProgramInfoLog(planetShaderProgram));
	return planetShaderProgram;
}
function recurseNorms(level){
	for(var i = 0; i < level; i++){
		var normArray = normals;
			normals = normals.concat(normArray);
			normals = normals.concat(normArray);
			normals = normals.concat(normArray);
			normals = normals.concat(normArray);
			normals = normals.concat(normArray);
			normals = normals.concat(normArray);
			normals = normals.concat(normArray);
			normals = normals.concat(normArray);
				
	}
}
function CubeSphere(r){
	var radius = parseInt(r);
	var unit_size = 1;//radius/grid_size;
	var XYquad = [
      unit_size,unit_size,0,1.0,  unit_size,0,0,1.0,  0,0,0,1.0,
	  0,unit_size,0,1.0,  unit_size,unit_size,0,1.0,  0,0,0,1.0,];
	var YZquad = [
      0,unit_size,unit_size,1.0,  0,0,unit_size,1.0,  0,0,0,1.0,
	  0,unit_size,0,1.0,  0,unit_size,unit_size,1.0,  0,0,0,1.0,];
	var ZXquad = [
      unit_size,0,unit_size,1.0,  unit_size,0,0,1.0,  0,0,0,1.0,
	  0,0,unit_size,1.0,  unit_size,0,unit_size,1.0,  0,0,0,1.0,];
	  
	  
	var reverXYquad = [
      0,0,0,1.0,  unit_size,0,0,1.0, unit_size,unit_size,0,1.0,
	  0,0,0,1.0, unit_size,unit_size,0,1.0,  0,unit_size,0,1.0,];
    var reverYZquad = [
       0,0,0,1.0,  0,0,unit_size,1.0,  0,unit_size,unit_size,1.0,
	   0,0,0,1.0,  0,unit_size,unit_size,1.0,  0,unit_size,0,1.0,];
	var reverZXquad = [
      0,0,0,1.0,  unit_size,0,0,1.0,  unit_size,0,unit_size,1.0, 
	   0,0,0,1.0, unit_size,0,unit_size,1.0,  0,0,unit_size,1.0,];
	console.log("loaded basis");
	//console.log(YZquad);
	//console.log(ZXquad);
	
	
	// front 
	var FBmesh = [];
	//create front
	for(var x = 0; x < radius; x+=unit_size){
		for(var y = 0; y < radius; y+=unit_size){
			//make a copy
			var copy = XYquad.slice();
			//console.log(XYquad);
			//traslate it by i,j in 
			copy = transl(copy,x,y,0);
			//concat
			FBmesh = FBmesh.concat(copy);
			
		}
	}
	//create back
	var reverFBmesh = [];
	//create front
	for(var x = 0; x < radius; x+=unit_size){
		for(var y = 0; y < radius; y+=unit_size){
			//make a copy
			var copy = reverXYquad.slice();
			//console.log(XYquad);
			//traslate it by i,j in 
			copy = transl(copy,x,y,0);
			//concat
			reverFBmesh = reverFBmesh.concat(copy);
			
		}
	}
	//console.log(FBmesh);	
	FBmesh = FBmesh.concat(transl(reverFBmesh.slice(),0,0,parseInt(radius)));
	
	//left right
	var LRmesh = [];
	for(var z = 0; z < radius; z+=unit_size){
		for(var y = 0; y < radius; y+=unit_size){
			//make a copy
			var copy = YZquad.slice();		
			//traslate it by i,j in 
			copy = transl(copy,0,y,z);
			//concat
			LRmesh = LRmesh.concat(copy);
		}
	}
	//create right
	
	var reverLRmesh = [];
	for(var z = 0; z < radius; z+=unit_size){
		for(var y = 0; y < radius; y+=unit_size){
			//make a copy
			var copy = reverYZquad.slice();		
			//traslate it by i,j in 
			copy = transl(copy,0,y,z);
			//concat
			reverLRmesh = reverLRmesh.concat(copy);
		}
	}
	
	LRmesh = reverLRmesh.concat(transl(LRmesh.slice(),parseInt(radius),0,0));
	
	//top bottom
	var TBmesh = [];
	for(var z = 0; z < radius; z+=unit_size){
		for(var x = 0; x < radius; x+=unit_size){
			//make a copy
			var copy = ZXquad.slice();		
			//traslate it by i,j in 
			copy = transl(copy,x,0,z);
			//concat
			TBmesh = TBmesh.concat(copy);
		}
	}
	//create botton
	var reverTBmesh = [];
	for(var z = 0; z < radius; z+=unit_size){
		for(var x = 0; x < radius; x+=unit_size){
			//make a copy
			var copy = reverZXquad.slice();		
			//traslate it by i,j in 
			copy = transl(copy,x,0,z);
			//concat
			reverTBmesh = reverTBmesh.concat(copy);
		}
	}
	TBmesh = reverTBmesh.concat(transl(TBmesh.slice(),0,parseInt(radius),0));
	
	//combine
	var mesh = [];
	mesh = mesh.concat(FBmesh);
	mesh = mesh.concat(LRmesh);
	mesh = mesh.concat(TBmesh);
	//move so centered at 0,0,0
	mesh = circlify(mesh, unit_size, radius);
	mesh = transl(mesh,-radius/2,-radius/2,-radius/2);
	//mesh = circlify(mesh, unit_size, radius);
	//console.log(mesh);
	
	//update the texCoords
	var texArray = texCoordArray;
	for(var i = 0; i < radius*radius*6;i++){
		texCoordArray = texCoordArray.concat(texArray);	
	}
	
	return mesh;
}

function circlify(verts, unit_size, radius){
	roundness = radius/document.getElementById('plRd').value;
	for(var i = 0; i < verts.length;i++){
		inner = vec3(verts[i],verts[i+1],verts[i+2]);
		x = verts[i];
		y = verts[i+1];
		z = verts[i+2];
		
		if (x < roundness) {
			inner[0] = roundness;
		}
		else if (x > radius - roundness) {
			inner[0] = radius - roundness;
		}
		if (y < roundness) {
			inner[1] = roundness;
		}
		else if (y > radius - roundness) {
			inner[1] = radius - roundness;
		}
		if (z < roundness) {
			inner[2] = roundness;
		}
		else if (z > radius - roundness) {
			inner[2] = radius - roundness;
		}
		
		subbed = subtract(vec3(x,y,z),inner);
		//console.log(subbed);
		norm = normalize(subbed);
		//console.log(inner[0]);
		//console.log(norm[0]);
		verts[i] = inner[0] + norm[0] * roundness;
		verts[i+1] = inner[1] + norm[1] * roundness;
		verts[i+2] = inner[2] + norm[2] * roundness;
		verts[i+3] = 1.0;
		i+=3;
		//normals[i] = (vertices[i] - inner).normalized;
		//vertices[i] = inner + normals[i] * roundness;
	}
	return verts;
	
}




function recurseCarpet(ogMesh,level){
	var firstMesh = ogMesh.slice();
	var currentOG = ogMesh;
	for(var i = 0; i < level; i++){
		//scale the whole image to 1/3
		//this part makes the 4th component not 1 or 0, is fixed in translate
		currentOG = currentOG.map(function(x){ return x / 3.0});
			var topRight = currentOG.slice();
			topRight = transl(topRight,.6666,.6666, .0);
			
			var topMid = currentOG.slice();
			topMid = transl(topMid,0.0,.6666, .0);
			
			var topLeft = currentOG.slice();
			topLeft = transl(topLeft,-.6666,.6666, .0);
			
			var left = currentOG.slice();
			left = transl(left,-.6666,0.0, .0);
			
			var right = currentOG.slice();
			right = transl(right,0.6666,0.0, .0);
			
			var bottomRight = currentOG.slice();
			bottomRight = transl(bottomRight,.6666,-.6666, .0);
			
			var bottomMid = currentOG.slice();
			bottomMid = transl(bottomMid,0.0,-.6666, 0);
			
			var bottomLeft = currentOG.slice();
			bottomLeft = transl(bottomLeft,-.6666,-.6666, .0);
		
			ogMesh = ogMesh.concat(topRight);
			ogMesh = ogMesh.concat(topMid);
			ogMesh = ogMesh.concat(topLeft);
			ogMesh = ogMesh.concat(left);
			ogMesh = ogMesh.concat(right);
			ogMesh = ogMesh.concat(bottomRight);
			ogMesh = ogMesh.concat(bottomMid);
			ogMesh = ogMesh.concat(bottomLeft);			
			currentOG = ogMesh;
			
			var texArray = texCoordArray;
			texCoordArray = texCoordArray.concat(texArray);
			texCoordArray = texCoordArray.concat(texArray);
			texCoordArray = texCoordArray.concat(texArray);
			texCoordArray = texCoordArray.concat(texArray);
			texCoordArray = texCoordArray.concat(texArray);
			texCoordArray = texCoordArray.concat(texArray);
			texCoordArray = texCoordArray.concat(texArray);
			texCoordArray = texCoordArray.concat(texArray);		
			
			
	}
	return ogMesh;
}

function transl(verts,x,y,z){
	//verts should be stored in x,y,z,x,y,z....format
	for(var i = 0; i < verts.length;i++){
		verts[i] = verts[i]+x;
		i++;
		verts[i] = verts[i]+y;
		i++;
		verts[i] = verts[i]+z;
		i++;
		verts[i] = 1.0;//keep the 1 or 0
	}
	return verts;
}

function updateCamPos(){
	//var x = document.getElementById('camXRange');
	var y = document.getElementById('camYRange');
	var z = document.getElementById('camZRange');
	//camCenter[0] = x.value;
	camCenter[1] = y.value;
	camCenter[2] = z.value;

	
}
function changeRotDirClicked(){
	delta = -delta;
	//run();
}
function rotationButtonClicked(){
	if(rotating){
		
		rotating = !rotating;
	}else{
		
		rotating = !rotating;
	}
	//run();
}

function setImageToCarpet(image){
	texture = gl.createTexture();
	gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture( gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGB,
         gl.RGB, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap( gl.TEXTURE_2D);
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
                      gl.NEAREST_MIPMAP_LINEAR);
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    gl.uniform1i(gl.getUniformLocation(planetShaderProgram, "texture"), 0);
	
}
function setNormalMaptoCarpet(image){
	texture = gl.createTexture();
	gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture( gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGB,
         gl.RGB, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap( gl.TEXTURE_2D);
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
                      gl.NEAREST_MIPMAP_LINEAR);
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    gl.uniform1i(gl.getUniformLocation(planetShaderProgram, "normalMap"), 1);
}

function setBumpMaptoCarpet(image){
	texture = gl.createTexture();
	gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture( gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGB,
         gl.RGB, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap( gl.TEXTURE_2D);
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
                      gl.NEAREST_MIPMAP_LINEAR);
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    gl.uniform1i(gl.getUniformLocation(planetShaderProgram, "bumpMap"), 2);
}







