/*global localStorage, window, chrome*/
var intervalTimer = null;
var nextIframe = 0;
var options = {
  reload: false,
  nrOfiFrames: 0,
  duration: 10000,
  resolution: 0,
  ratio: 0,
  random: false,
  animation: true
};

function setOptions(storedOptions, urlsLength) {
  options.reload = storedOptions.reload;
  options.nrOfiFrames = urlsLength;
  options.duration = parseInt(storedOptions.duration, 10) * 1000;
  options.resolution = storedOptions.resolution;
  options.ratio = storedOptions.ratio;
}

function addIFrames(urls) {
  $('#iframes').html('');
  $.tmpl('iFrame', urls).appendTo('#iFrames');
}

function getHeight(resolution, ratio) {
  return (resolution / ratio.split('/')[0]) * ratio.split('/')[1];
}

function getPosition(idx, width, height) {
  var position = {};
  position.x = ((idx % 3) * width) + ((idx % 3) * 50);
  position.y = (Math.floor(idx / 3) * height) + (Math.floor(idx / 3) * 50);
  return position;
}

function addCSSStyles() {
  $('.iFrames').each(function () {
    var x = $(this).data('x');
    var y = $(this).data('y');
    $(this).css('-webkit-transform', 'translate(' + x + 'px,' + y + 'px)');
  });
}

function getFramePosition(iframe) {
  var nextiFrame = $('#iFrame_' + iframe).parent();
  var x = nextiFrame.data('x');
  var y = nextiFrame.data('y');
  return {
    x: x,
    y: y
  };
}

function nextPosition() {
  if (options.random) {
    nextIframe = Math.floor(Math.random() * options.nrOfiFrames);
  } else {
    nextIframe = nextIframe + 1;
    if (nextIframe >= options.nrOfiFrames) {
      nextIframe = 0;
    }
  }
  return nextIframe;
}

function previousPosition() {
  if (options.random) {
    nextIframe = Math.floor(Math.random() * options.nrOfiFrames);
  } else {
    nextIframe = nextIframe - 1;
    if (nextIframe < 0) {
      nextIframe = options.nrOfiFrames - 1;
    }
  }
  return nextIframe;
}

function checkIfOptionsChanged() {
  var options = JSON.parse(localStorage.options);
  if (options.changed) {
    options.changed = false;
    localStorage.options = JSON.stringify(options);
    window.location.reload();
  }
}

function animate(iframe) {
  checkIfOptionsChanged();
  var scalingX;
  switch (options.nrOfiFrames) {
  case 1:
    scalingX = "1";
    break;
  case 2:
    scalingX = $(document).width() / ((2 * $(document).width()) + 50);
    break;
  default:
    scalingX = ".325";
  }
  var scalingY = $(document).height() / (((Math.ceil(options.nrOfiFrames / 3)) * $(document).height()) + (Math.floor(options.nrOfiFrames / 3) * 50));
  $('#iFrames').css('-webkit-transform', 'translate(0px,0px) scale(' + scalingX + ',' + scalingY + ')');
  setTimeout(function () {
    var framePosition = getFramePosition(iframe);
    $('#iFrames').css('-webkit-transform', 'translate(' + -framePosition.x + 'px,' + -framePosition.y + 'px) scale(1,1)');
    nextIframe = nextPosition();
    if (options.reload) {
      var src = $('#iFrame_' + nextIframe).attr('src');
      $('#iFrame_' + nextIframe).attr('src', src);
    }
  }, options.animation ? 5000 : 0);
}

function showOverview() {
  if (intervalTimer) {
    clearInterval(intervalTimer);
  }
  var scalingX;
  switch (options.nrOfiFrames) {
  case 1:
    scalingX = "1";
    break;
  case 2:
    scalingX = $(document).width() / ((2 * $(document).width()) + 50);
    break;
  default:
    scalingX = ".325";
  }
  var scalingY = $(document).height() / (((Math.ceil(options.nrOfiFrames / 3)) * $(document).height()) + (Math.floor(options.nrOfiFrames / 3) * 50));
  $('#iFrames').css('-webkit-transform', 'translate(0px,0px) scale(' + scalingX + ',' + scalingY + ')');
}

function loadOptions() {
  var urls = JSON.parse(localStorage.urls);
  setOptions(JSON.parse(localStorage.options), urls.length);
  var width = options.resolution;
  var height;
  var idx;
  if (width !== 'full') {
    height = getHeight(width, options.ratio);
  } else {
    width = $(document).width();
    height = $(document).height();
  }
  var iFrameOptions = [];
  var position;
  for (idx = 0; idx < urls.length; idx++) {
    position = getPosition(idx, width, height);
    iFrameOptions[iFrameOptions.length] = {
      url: urls[idx].url,
      width: width,
      height: height,
      idx: idx,
      x: position.x,
      y: position.y
    };
  }
  addIFrames(iFrameOptions);
}

$(function () {
  $(document).on('keyup', function (e) {
    var next = 0;
    var keycode = e.which;
    if (keycode > 48 && keycode < 58) { //1-9
      next = keycode - 49;
      if (next < options.nrOfiFrames) {
        animate(next);
      }
    } else if (keycode === 83) { //S
      if (!options.animation) {
        options.animation = true;
        intervalTimer = setInterval(function () {
          animate(nextIframe);
        }, options.duration);
      } else {
        options.animation = false;
        if (intervalTimer) {
          clearInterval(intervalTimer);
        }
      }
    } else if (keycode === 48) { //0
      showOverview();
    }
  });

  if ('undefined' !== typeof localStorage.urls) {
    loadOptions();
    addCSSStyles();
    intervalTimer = setInterval(function () {
      animate(nextIframe);
    }, options.duration);
  } else {
    document.location = chrome.extension.getURL("options/index.html");
  }
});