/*********************************************************************
*  #### JS Motion Visualiser ####
*  Coded by Jason Mayes. www.jasonmayes.com
*  Please keep this disclaimer with my code if you use it anywhere. 
*  Thanks. :-)
*  Got feedback or questions, ask here:
*  Github: https://github.com/jasonmayes/JS-Motion-Detection/
*  Updates will be posted to this site.
*********************************************************************/

// Cross browser support to fetch the correct getUserMedia object.
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia
  || navigator.mozGetUserMedia || navigator.msGetUserMedia;

// Cross browser support for window.URL.
window.URL = window.URL || window.webkitURL || window.mozURL || window.msURL;

var area = 32;
var threshold = 96;    
  

var MotionDetector = (function() {
  var alpha = 0.5;
  var version = 0;
  var greyScale = false;
  var overlay = true;

  var canvas = document.getElementById('canvas');
  var canvasFinal = document.getElementById('canvasFinal');
  var video = document.getElementById('camStream');
  var ctx = canvas.getContext('2d');
  var ctxFinal = canvasFinal.getContext('2d');
  var localStream = null;
  var imgData = null;
  var imgDataPrev = [];
  var minPixelRatio = 0.5;

  document.getElementById('area1').value=area
  document.getElementById('threshold1').value=threshold
  document.getElementById('ratio1').value=minPixelRatio*10
  canvasFinal.setAttribute('class','flipped')


 
  function success(stream) {
    localStream = stream;
    // Create a new object URL to use as the video's source.
    video.srcObject = stream
    video.play();
  }

  
  function handleError(error) {
    console.error(error);
  }


  function snapshot() {
    if (localStream) {
      canvas.width = video.offsetWidth;
      canvas.height = video.offsetHeight;
      canvasFinal.width = video.offsetWidth;
      canvasFinal.height = video.offsetHeight;

      ctx.drawImage(video, 0, 0);

      // Must capture image data in new instance as it is a live reference.
      // Use alternative live referneces to prevent messed up data.
      imgDataPrev[version] = ctx.getImageData(0, 0, canvas.width, canvas.height);
      version = (version == 0) ? 1 : 0;

      imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      var length = imgData.data.length;
      var x = 0;
      var px = 0;
      var py = 0;
      var cw = canvas.width*4
      var mv = {};
      var minPixels = minPixelRatio*(area*area)
      var maxP = 0;
      var boxes = [];
      while (x < length) {
        px = Math.floor(x / 4) % canvas.width
        py = Math.floor(x / cw)
        if (overlay){
          var d1 = Math.abs(imgData.data[x]-imgDataPrev[version].data[x])
          var d2 = Math.abs(imgData.data[x+1]-imgDataPrev[version].data[x+1])
          var d3 = Math.abs(imgData.data[x+2]-imgDataPrev[version].data[x+2])
          var gsDiff = (d1+d2+d3)>threshold ? (d1+d2+d3) : 0
          imgData.data[x    ] = imgData.data[x];
          imgData.data[x + 1] = imgData.data[x+1];
          imgData.data[x + 2] = imgData.data[x+2];
          imgData.data[x + 3] = 255;
          if (gsDiff) {
            if (window.debug) imgData.data[x    ] = 255;
            var id = Math.floor(px/area)+':'+Math.floor(py/area)
            if (mv[id]){
              mv[id]+=(gsDiff/32)
            } else {
              mv[id]=1
            }
            maxP = Math.max(maxP,mv[id])
          }
        }
        else if (!greyScale) {
          // Alpha blending formula: out = (alpha * new) + (1 - alpha) * old.
          imgData.data[x]     = alpha * (255 - imgData.data[x]) + ((1-alpha) * imgDataPrev[version].data[x]);
          imgData.data[x + 1] = alpha * (255 - imgData.data[x+1]) + ((1-alpha) * imgDataPrev[version].data[x + 1]);
          imgData.data[x + 2] = alpha * (255 - imgData.data[x+2]) + ((1-alpha) * imgDataPrev[version].data[x + 2]);
          imgData.data[x + 3] = 255;
        } else {
          // GreyScale.
          var av = (imgData.data[x] + imgData.data[x + 1] + imgData.data[x + 2]) / 3;
          var av2 = (imgDataPrev[version].data[x] + imgDataPrev[version].data[x + 1] + imgDataPrev[version].data[x + 2]) / 3;
          var blended = alpha * (255 - av) + ((1-alpha) * av2);
          imgData.data[x] = blended;
          imgData.data[x + 1] = blended;
          imgData.data[x + 2] = blended;
          imgData.data[x + 3] = 255;
        }
        x += 4; 
      }
      //console.log('minPixel',minPixels,maxP)
      for(var key in mv){
        // var val = mv[key]
        // if (val<minVal) continue;
        // var pt = key.split(':')
        // var x = pt[1]*cw + pt[0]*4
        //console.log(key,pt[0]*area,pt[1]*area)
        //imgData.data[x] = 255;
        //imgData.data[x + 1] = 255;
      }
      ctxFinal.putImageData(imgData, 0, 0);
      ctxFinal.strokeStyle = "#c0c0c0"
      for(var key in mv){
        var val = mv[key]
        if (val<minPixels) continue;
        var pt = key.split(':')
        var x0 = pt[0]*area
        var y0= pt[1]*area
        //console.log(area,threshold,key,x0,y0)
        var box = Bodies.circle(x0, y0, area/2, {isStatic: true, hidden:!window.debug});
        boxes.push(box)
      }
      return boxes;
    }
  }

  
  function init_() {
    if (navigator.getUserMedia) { 
      navigator.getUserMedia({video:true}, success, handleError);
    } else { 
      console.error('Your browser does not support getUserMedia');
    }
    canvas.setAttribute('class','flipped')
  }

  return {
    init: init_,
    run: snapshot,
  };
})();

