window.onload = function main()
{
   run(3);
}
function run(levelOfDetail){
	var slider = document.getElementById('myRange');
	
	var carpetMaxLevel = slider.value;
   var gl;
   //get a reference to the main canvas
   var canvas = document.getElementById('mainCanvas');
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
   var numItems = vertices.length/itemSize;
   //create a buffer for the verticies
   var buffer = gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
   gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

   //vertex shader
   var vertCode =
		//'precision mediump float;'+
        'attribute vec2 coordinates;' +
        'void main(void) {' +
        '  gl_Position = vec4(coordinates, 0.0, 1.0);' +
        '}';
	//build the vertex shader
	var vertShader = buildShader(gl,gl.VERTEX_SHADER,vertCode);

   
   // frag shader
   var fragCode =
	  //'precision mediump float;'+
      'void main(void) {' +
      '   gl_FragColor = vec4(.5, 1.0, 1.0, 1.0);' +
      '}';
   //build the frag shader  
   var fragShader = buildShader(gl,gl.FRAGMENT_SHADER,fragCode);
   

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
   gl.enableVertexAttribArray(coordinatesVar);
   gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
   gl.vertexAttribPointer(coordinatesVar, 2, gl.FLOAT, false, 0, 0);

   //tell gl to draw the carpet
   gl.drawArrays(gl.TRIANGLES, 0, numItems);
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










