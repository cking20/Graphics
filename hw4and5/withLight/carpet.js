var rotation = [.0,.0,.0];
var delta = .001;
var rotating = true;
var gl;
var thetaVar;
var numItems

var oldTime = 0;
var currentTime = 0;
var deltaTime = 0;
var shaderProgram;
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
   //vertex shader
   //var vertCode = document.getElementById(vertID);
   var vertCode = document.getElementById('vertex-shader');		
   //build the vertex shader
   var vertShader = buildShader(gl,gl.VERTEX_SHADER,vertCode.text);   
   // frag shader
   //var fragCode = document.getElementById(fragID);
   var fragCode = document.getElementById('fragment-shader');  
   //build the frag shader  
   var fragShader = buildShader(gl,gl.FRAGMENT_SHADER,fragCode.text);
   //create a shader program from the vertex shader and frag shader
   shaderProgram = buildShaderProgram(gl,vertShader,fragShader);   
   //clear the drawing surface
   gl.clearColor(0.0, 0.0, 0.0, 1.0);
   gl.clear(gl.COLOR_BUFFER_BIT);
   //have to tell webGL what shader program to use
   gl.useProgram(shaderProgram);
   
   
   camCenter = [0.0,0.0,0.5,0.0];
   updateCamPos();
   objCenter = [0.0,0.0,0.0,0.0];
   projectionMatrix = perspective( 100.0, 1, 0, 100);//ortho(-1, 1, -1, 1, 0, 100);
   var eye = vec3(camCenter[0],camCenter[1],camCenter[2]);
   var at =  vec3(objCenter[0],objCenter[1],objCenter[2]);
   var up = vec3(0.0,1.0,0.0);
   modelViewMatrix = lookAt( eye, at, up );
   
   //original square's verts
   var vertices = [
      0.3333,0.3333,0.0,1.0,  0.3333,-0.3333,0.0,1.0,  -0.3333,-0.3333,0.0,1.0,
	  -0.3333,0.3333,0.0,1.0,  0.3333,0.3333,0.0,1.0,  -0.3333,-0.3333,0.0,1.0,
	  
   ];
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
 
   
   
   
   //console.log(vertices);
   //build the carpet
   vertices = recurseCarpet(vertices,carpetMaxLevel);
   centers = recurseCarpet(centers,carpetMaxLevel);
   recurseNorms(carpetMaxLevel);
   //var data = vertices.concat(centers);
   //console.log(vertices);
   //console.log(centers);
   var itemSize = 4;
   numItems = vertices.length/itemSize;
   //create a buffer for the verticies
   var vBuffer = gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
   gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
   var coordinatesVar = gl.getAttribLocation(shaderProgram, "coordinates");  
   gl.enableVertexAttribArray(coordinatesVar);  
   gl.vertexAttribPointer(coordinatesVar, 4, gl.FLOAT, false, 0, 0);
      
   var cBuffer = gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
   gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(centers), gl.STATIC_DRAW);
   var centerVar = gl.getAttribLocation(shaderProgram, "center");
   gl.enableVertexAttribArray(centerVar);
   gl.vertexAttribPointer(centerVar, 4, gl.FLOAT, false, 0, 0);
   
   var nBuffer = gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
   gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
   var normalVar = gl.getAttribLocation(shaderProgram, "vNorm");
   gl.enableVertexAttribArray(normalVar);
   gl.vertexAttribPointer(normalVar, 4, gl.FLOAT, false, 0, 0);
   
   thetaVar = gl.getUniformLocation(shaderProgram,"theta");
   gl.uniform3fv(thetaVar, rotation);
   
   
   //material and light stuff here
   lightP = vec4(1.0, 1.0, 1.0, 1.0);//1.0 for point light, 0 for dir
   var lightAmbient  = vec4(0.2,0.2,0.2,1.0);
   var lightDiffuse  = vec4(0.01,0.01,1.0,1.0);
   var lightSpecular = vec4(1.0,1.0,1.0,1.0);
   
   var materialAmbient  = vec4(0.01,0.01,0.01,1.0);
   var materialDiffuse  = vec4(1.0,1.0,1.0,1.0);
   var materialSpecular = vec4(0.1,0.01,0.1,1.0);
   
   lightVar = gl.getUniformLocation(shaderProgram,"lightPos");
   gl.uniform4fv(lightVar, flatten(lightP));
   
   var ambientProduct = mult(lightAmbient, materialAmbient);
   var diffuseProduct = mult(lightDiffuse, materialDiffuse);
   var specularProduct = mult(lightSpecular, materialSpecular);
   gl.uniform4fv(gl.getUniformLocation(shaderProgram,"ambientProduct"), flatten(ambientProduct));
   gl.uniform4fv(gl.getUniformLocation(shaderProgram,"diffuseProduct"), flatten(diffuseProduct) );
   gl.uniform4fv(gl.getUniformLocation(shaderProgram,"specularProduct"), flatten(specularProduct) );

   shineVar = gl.getUniformLocation(shaderProgram,"shininess");
   gl.uniform1f(shineVar, 0.5);
   
   updateLightNMat();
   modelViewMatVar = gl.getUniformLocation(shaderProgram,"modelViewMatrix");
   gl.uniformMatrix4fv(modelViewMatVar, false, flatten(modelViewMatrix) );
   
   projectionMatVar = gl.getUniformLocation(shaderProgram,"projectionMatrix");
   gl.uniformMatrix4fv(projectionMatVar, false, flatten(projectionMatrix) );
   
   objCenterVar = gl.getUniformLocation(shaderProgram,"objCenter");
   gl.uniform4fv(objCenterVar, new Float32Array(objCenter));
   
   camPosVar = gl.getUniformLocation(shaderProgram,"camPos");
   gl.uniform4fv(camPosVar, new Float32Array(camCenter));
    var tBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, tBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, new Float32Array(texCoordArray), gl.STATIC_DRAW );

    var texVar = gl.getAttribLocation( shaderProgram, "vTexCoord" );
    gl.vertexAttribPointer( texVar, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( texVar );
   
   var image = document.getElementById("image");
   setImageToCarpet(image);
      
   
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
	projectionMatrix = perspective( 100.0, 1, 0, 100);//ortho(-1, 1, -1, 1, 0, 100);
    var eye = vec3(camCenter[0],camCenter[1],camCenter[2]);
    var at =  vec3(objCenter[0],objCenter[1],objCenter[2]);
    var up = vec3(0.0,1.0,0.0);
    modelViewMatrix = lookAt( eye, at, up );
	modelViewMatVar = gl.getUniformLocation(shaderProgram,"modelViewMatrix");
    gl.uniformMatrix4fv(modelViewMatVar, false, flatten(modelViewMatrix) ); 
    projectionMatVar = gl.getUniformLocation(shaderProgram,"projectionMatrix");
    gl.uniformMatrix4fv(projectionMatVar, false, flatten(projectionMatrix) );
	
	//console.log(lightP);
	lightVar = gl.getUniformLocation(shaderProgram,"lightPos");
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
   
   lightVar = gl.getUniformLocation(shaderProgram,"lightPos");
   gl.uniform4fv(lightVar, flatten(lightP));
   
   var ambientProduct = add(lightAmbient, materialAmbient);
   console.log("amb prod"+ambientProduct);
   var diffuseProduct = add(lightDiffuse, materialDiffuse);
   console.log("diff prod"+diffuseProduct);
   var specularProduct = add(lightSpecular, materialSpecular);
   console.log("spec prod"+specularProduct);
   gl.uniform4fv(gl.getUniformLocation(shaderProgram,"ambientProduct"), flatten(ambientProduct));
   gl.uniform4fv(gl.getUniformLocation(shaderProgram,"diffuseProduct"), flatten(diffuseProduct) );
   gl.uniform4fv(gl.getUniformLocation(shaderProgram,"specularProduct"), flatten(specularProduct) );

   shineVar = gl.getUniformLocation(shaderProgram,"shininess");
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
function buildShaderProgram(gl,vertShader,fragShader){
	//all the stuff gl has to do to compile and link the shader program
	var shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertShader);
    gl.attachShader(shaderProgram, fragShader);
    gl.linkProgram(shaderProgram);
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS))
		throw new Error(gl.getProgramInfoLog(shaderProgram));
	return shaderProgram;
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

function recurseCarpet(ogMesh,level){
	var firstMesh = ogMesh.splice();
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
    gl.bindTexture( gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGB,
         gl.RGB, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap( gl.TEXTURE_2D);
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
                      gl.NEAREST_MIPMAP_LINEAR);
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    gl.uniform1i(gl.getUniformLocation(shaderProgram, "texture"), 0);
}







