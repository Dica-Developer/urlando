var randomInterval = null;
const options = {
  reload: false,
  nrOfiFrames: 0,
  duration:0,
  resolution:0,
  ratio: 0
};
function setOptions(storedOptions, urlsLength){
  options.relaod = storedOptions.reload;
  options.nrOfiFrames = urlsLength;
  options.duration = parseInt(storedOptions.duration)*1000;
  options.resolution = storedOptions.resolution;
  options.ratio = storedOptions.ratio;
}

function addIFrames(urls){
  $.tmpl('iFrame', urls).appendTo('#iFrames');
}
function getHeight(resolution, ratio){
  return  (resolution / ratio.split('/')[0]) * ratio.split('/')[1];
}
function getPosition(idx, width){//}, height){
  var position = {};
  if(idx <= 3){
    position.x = (idx * width) + (idx*150);
    position.y = 0;
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

function animate(iframe) {
  function getNextPosition(iframe) {
    var nextiFrame = $('#iFrame_' + iframe).parent();
    var x = nextiFrame.data('x');
    var y = nextiFrame.data('y');
    return {x:x, y:y};
  }
  if (iframe === -1) {
    $('#iFrames').css('-webkit-transform', 'translate(0px,0px) scale(.3,.3)');
    iframe = Math.floor(Math.random() * options.nrOfiFrames);
    if (options.reload) {
      var src = $('#iFrame_' + iframe).attr('src');
      $('#iFrame_' + iframe).attr('src', src);
    }
    if(randomInterval)clearInterval(randomInterval);
    randomInterval = setInterval(function(){
      animate(-1);
    },options.duration);
  }else{
    if(randomInterval)clearInterval(randomInterval);
  }
  console.log(options);
  $('#iFrames').css('-webkit-transform', 'translate(' + -getNextPosition(iframe).x + 'px,' + -getNextPosition(iframe).y + 'px) scale(1,1)');
}

$(function(){
  $(document).on('keyup',function(e){
    console.log(e);
    var keycode = e.which;
    if(keycode > 48 && keycode <58){
      var next = keycode - 49;
      if(next <= options.nrOfiFrames){
        animate(next);
      }else{
        animate(-1);
      }
    }else if(keycode === 48){
      animate(-1);
    }
  });
  if('undefined' !== typeof localStorage["urls"]){
    var urls = JSON.parse(localStorage["urls"]);
    setOptions(JSON.parse(localStorage["options"]), urls.length);
    var width = options.resolution;
    var height;
    if(width !== 'full'){
      height = getHeight(width, options.ratio);
    }else{
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
    addCSSStyles();
    randomInterval = setInterval(function(){
      animate(-1);
    },options.duration);
  }else{
    $('<span>No Urls defined. Please go to options page to setup web sites to display</span>').appendTo('#iFrames');
  }
});