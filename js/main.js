var randomInterval = null;
var currentIframe = 0;
const options = {
  reload: false,
  nrOfiFrames: 0,
  duration:0,
  resolution:0,
  ratio: 0,
  random: false,
  animation: true
};
function setOptions(storedOptions, urlsLength){
  options.reload = storedOptions.reload;
  options.nrOfiFrames = urlsLength;
  options.duration = parseInt(storedOptions.duration)*1000;
  options.resolution = storedOptions.resolution;
  options.ratio = storedOptions.ratio;
}

function addIFrames(urls){
  $('#iframes').html('');
  $.tmpl('iFrame', urls).appendTo('#iFrames');
}
function getHeight(resolution, ratio){
  return  (resolution / ratio.split('/')[0]) * ratio.split('/')[1];
}
function getPosition(idx, width, height){
  var position = {};
  if(idx < 3){
    position.x = (idx * width) + (idx*150);
    position.y = 0;
  }else if(idx == 3 && idx < 6){
    position.x = ((idx-3)* width) + ((idx-3)*150);
    position.y = height+100;
  }
  return position;
}

function addCSSStyles(){
  $('.iFrames').each(function(){
    var x = $(this).data('x');
    var y = $(this).data('y');
    $(this).css('-webkit-transform', 'translate('+x+'px,'+y+'px)');
  });
}

function getFramePosition(iframe) {
  var nextiFrame = $('#iFrame_' + iframe).parent();
  var x = nextiFrame.data('x');
  var y = nextiFrame.data('y');
  return {x:x, y:y};
}

function nextPosition() {
  if (options.random) {
    currentIframe = Math.floor(Math.random() * options.nrOfiFrames);
  } else {
    currentIframe = currentIframe + 1
    if (currentIframe >= options.nrOfiFrames) {
      currentIframe = 0;
    }
  }
  return currentIframe;
}

function previousPosition() {
  if (options.random) {
    currentIframe = Math.floor(Math.random() * options.nrOfiFrames);
  } else {
    currentIframe = currentIframe - 1
    if (currentIframe < 0) {
      currentIframe = options.nrOfiFrames - 1;
    }
  }
  return currentIframe;
}

function animate(iframe) {
  checkIfOptionsChanged();
  if (randomInterval) {
    clearInterval(randomInterval);
  }
  if(options.animation){
    randomInterval = setInterval(function() {
      var nextP = nextPosition();
      animate(nextP);
    }, options.duration);
  }
  $('#iFrames').css('-webkit-transform', 'translate(0px,0px) scale(.3,.3)');
  if (options.reload) {
    var src = $('#iFrame_' + iframe).attr('src');
    $('#iFrame_' + iframe).attr('src', src);
  }
  setTimeout(function(){
    var framePosition = getFramePosition(iframe);
    $('#iFrames').css('-webkit-transform', 'translate(' + -framePosition.x + 'px,' + -framePosition.y + 'px) scale(1,1)');
  },options.animation?5000:0);
}

function showOverview(){
  if (randomInterval) {
    clearInterval(randomInterval);
  }
  $('#iFrames').css('-webkit-transform', 'translate(0px,0px) scale(.3,.3)');
}

function checkIfOptionsChanged(){
  var options = JSON.parse(localStorage["options"]);
  if(options.changed){
    options.changed = false;
    localStorage["options"] = JSON.stringify(options);
    window.location.reload();
  }
}

function loadOptions() {
  var urls = JSON.parse(localStorage["urls"]);
  setOptions(JSON.parse(localStorage["options"]), urls.length);
  var width = options.resolution;
  var height;
  if (width !== 'full') {
    height = getHeight(width, options.ratio);
  } else {
    width = $(document).width();
    height = $(document).height();
  }
  var iFrameOptions = [];
  for (var idx = 0; idx < urls.length; idx++) {
    iFrameOptions[iFrameOptions.length] = {
      url: urls[idx].url,
      width: width,
      height: height,
      idx: idx,
      x: getPosition(idx, width, height).x,
      y: getPosition(idx, width, height).y
    }
  }
  addIFrames(iFrameOptions);
}

$(function(){
  $(document).on('keyup',function(e){
    var next = 0;
    var keycode = e.which;
    if (keycode > 48 && keycode < 58) {
        next = keycode - 49;
      if (next > options.nrOfiFrames) {
        next = 0;
      }
      animate(next);
    }else if(keycode === 83){
      options.animation = !options.animation;
      if (randomInterval) clearInterval(randomInterval);
    }else{
      showOverview();
    }
  });

  if ('undefined' !== typeof localStorage["urls"]) {
    loadOptions();
    addCSSStyles();
    randomInterval = setInterval(function(){
      animate(0);
    },options.duration);
  }else{
    document.location = chrome.extension.getURL("options/index.html");
  }
});