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

window.onload = function main()
{
   oldTime = Date.now();
   currentTime = oldTime;
	
   run(0,1.0);
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
   
   
   
   //original square's verts
   var vertices = [
      0.3333,0.3333,0.0,1.0,  0.3333,-0.3333,0.0,1.0,  -0.3333,-0.3333,0.0,1.0,
	  -0.3333,0.3333,0.0,1.0,  0.3333,0.3333,0.0,1.0,  -0.3333,-0.3333,0.0,1.0,
	  
   ];
   var texCoord = [
	0,0,
	0,1,
	1,1,
	1,0,
   ];
   
   texCoordArray = [
	0,0,
	0,1,
	1,1,
	1,0,
	0,0,
	1,1,
   ];
 
   
   //original square's centers
   var centers = [
      0.0,0.0,0.0,1.0,  0.0,0.0,0.0,1.0,  0.0,0.0,0.0,1.0,
	  0.0,0.0,0.0,1.0,  0.0,0.0,0.0,1.0,  0.0,0.0,0.0,1.0,
	  
   ];
   
   var center = [0.0,0.0,0.0,1.0];
   
   //build the carpet
   vertices = recurseCarpet(vertices,carpetMaxLevel);
   centers = recurseCarpet(centers,carpetMaxLevel);
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
   
   thetaVar = gl.getUniformLocation(shaderProgram,"theta");
   gl.uniform3fv(thetaVar, rotation);
  
   
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
	
    gl.clear(gl.COLOR_BUFFER_BIT);
	gl.uniform3fv(thetaVar, new Float32Array(rotation));
    //tell gl to draw the carpet
	gl.drawArrays(gl.TRIANGLES, 0, numItems);
	
	window.requestAnimationFrame(update);
	
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
function recurseCarpet(ogMesh,level){
	var firstMesh = ogMesh.splice();
	var currentOG = ogMesh;
	for(var i = 0; i < level; i++){
		//scale the whole image to 1/3
		//this part makes the 4th component not 1 or 0, is fixed in translate
		currentOG = currentOG.map(function(x){ return x / 3.0});
			var topRight = currentOG.slice();
			topRight = translate(topRight,.6666,.6666, .0);
			
			var topMid = currentOG.slice();
			topMid = translate(topMid,0.0,.6666, .0);
			
			var topLeft = currentOG.slice();
			topLeft = translate(topLeft,-.6666,.6666, .0);
			
			var left = currentOG.slice();
			left = translate(left,-.6666,0.0, .0);
			
			var right = currentOG.slice();
			right = translate(right,0.6666,0.0, .0);
			
			var bottomRight = currentOG.slice();
			bottomRight = translate(bottomRight,.6666,-.6666, .0);
			
			var bottomMid = currentOG.slice();
			bottomMid = translate(bottomMid,0.0,-.6666, 0);
			
			var bottomLeft = currentOG.slice();
			bottomLeft = translate(bottomLeft,-.6666,-.6666, .0);
		
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

function translate(verts,x,y,z){
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
function changeRotDirClicked(){
	delta = -delta;
	run();
}
function rotationButtonClicked(){
	if(rotating){
		
		rotating = !rotating;
	}else{
		
		rotating = !rotating;
	}
	run();
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







