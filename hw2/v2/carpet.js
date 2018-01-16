var thetaValue = .0;
var delta = .001;
var rotating = true;
var gl;
var thetaVar;
var numItems


var oldTime = 0;
var currentTime = 0;
var deltaTime = 0;

window.onload = function main()
{
   
   oldTime = Date.now();
   currentTime = oldTime;
   
   run(3,1.0);
   update();
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

   //original square's verts
   var vertices = [
      0.3333,0.3333,  0.3333,-0.3333,  -0.3333,-0.3333,
	  -0.3333,0.3333,  0.3333,0.3333,  -0.3333,-0.3333,
	  
   ];
   //build the carpet
   vertices = recurseCarpet(vertices,carpetMaxLevel);
   var itemSize = 2;
   numItems = vertices.length/itemSize;
   //create a buffer for the verticies
   var buffer = gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
   gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

   //vertex shader
   var vertCode = document.getElementById('vertex-shader');
		
	//build the vertex shader
	var vertShader = buildShader(gl,gl.VERTEX_SHADER,vertCode.text);

   
   // frag shader
   var fragCode = document.getElementById('fragment-shader');
	  
   //build the frag shader  
   var fragShader = buildShader(gl,gl.FRAGMENT_SHADER,fragCode.text);
   

   //create a shader program from the vertex shader and frag shader
   var shaderProgram = buildShaderProgram(gl,vertShader,fragShader);

   
   //clear the drawing surface
   gl.clearColor(0.0, 0.0, 0.0, 1.0);
   gl.clear(gl.COLOR_BUFFER_BIT);

   //have to tell webGL what shader program to use
   gl.useProgram(shaderProgram);

   
   //gl needs a value for coordinates, so have to tell it to use the
   //	buffer that was made earlier(this is already on the GPU)
   var coordinatesVar = gl.getAttribLocation(shaderProgram, "coordinates");
   thetaVar = gl.getUniformLocation(shaderProgram,"theta");
   gl.enableVertexAttribArray(coordinatesVar);
   gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
   gl.vertexAttribPointer(coordinatesVar, 2, gl.FLOAT, false, 0, 0);
   
   gl.uniform1f(thetaVar, thetaValue);
   //tell gl to draw the carpet
   gl.drawArrays(gl.TRIANGLES, 0, numItems);
   
}
function update(){
	oldTime = currentTime;
	currentTime = Date.now();	
	deltaTime = currentTime - oldTime;
	
	if(rotating)
		thetaValue += delta * deltaTime;
	
    gl.clear(gl.COLOR_BUFFER_BIT);
	gl.uniform1f(thetaVar, thetaValue);
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
		currentOG = currentOG.map(function(x){ return x / 3.0});
			var topRight = currentOG.slice();
			topRight = translate(topRight,.6666,.6666);
			
			var topMid = currentOG.slice();
			topMid = translate(topMid,0.0,.6666);
			
			var topLeft = currentOG.slice();
			topLeft = translate(topLeft,-.6666,.6666);
			
			var left = currentOG.slice();
			left = translate(left,-.6666,0.0);
			
			var right = currentOG.slice();
			right = translate(right,0.6666,0.0);
			
			var bottomRight = currentOG.slice();
			bottomRight = translate(bottomRight,.6666,-.6666);
			
			var bottomMid = currentOG.slice();
			bottomMid = translate(bottomMid,0.0,-.6666);
			
			var bottomLeft = currentOG.slice();
			bottomLeft = translate(bottomLeft,-.6666,-.6666);
			
			ogMesh = ogMesh.concat(topRight);
			ogMesh = ogMesh.concat(topMid);
			ogMesh = ogMesh.concat(topLeft);
			ogMesh = ogMesh.concat(left);
			ogMesh = ogMesh.concat(right);			
			ogMesh = ogMesh.concat(bottomRight);
			ogMesh = ogMesh.concat(bottomMid);
			ogMesh = ogMesh.concat(bottomLeft);
			
			currentOG = ogMesh;
			
	}
	return ogMesh;
}
function translate(verts,x,y,z){
	//verts should be stored in x,y,z,x,y,z....format
	for(var i = 0; i < verts.length;i++){
		verts[i] = verts[i]+x;
		i++;
		verts[i] = verts[i]+y;
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








