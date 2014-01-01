/*global window, chrome*/
var intervalTimer = null;
var nextIframe = 0;
var options = {
  reload: false,
  nrOfiFrames: 0,
  duration: 10000,
  resolution: 'full',
  ratio: 0,
  random: false,
  animation: true
};
var iFrameMarkupTemplate = '<div id="step_${idx}" class="iFrames" data-x="${x}" data-y="${y}"><webview id="iFrame_${idx}" src="${url}" style="width:${width}px; height:${height}px;"></webview></div>';

function addIFrames(urls) {
  var i = 0;
  $('#iFrames').remove();
  $('<div id="iFrames"></div>').appendTo('body');
  for (i = 0; i < urls.length; i++) {
    var iFrameMarkup = iFrameMarkupTemplate;
    iFrameMarkup = iFrameMarkup.replace('${url}', urls[i].url);
    iFrameMarkup = iFrameMarkup.replace('${idx}', urls[i].idx);
    iFrameMarkup = iFrameMarkup.replace('${idx}', urls[i].idx);
    iFrameMarkup = iFrameMarkup.replace('${x}', urls[i].x);
    iFrameMarkup = iFrameMarkup.replace('${y}', urls[i].y);
    iFrameMarkup = iFrameMarkup.replace('${width}', urls[i].width);
    iFrameMarkup = iFrameMarkup.replace('${height}', urls[i].height);
    $(iFrameMarkup).appendTo('#iFrames');
  }
}

function getHeight(resolution, ratio) {
  return (resolution / ratio.split('/')[0]) * ratio.split('/')[1];
}

function getPosition(idx, width, height) {
  var position = {};
  position.x = (idx % 3) * width;
  position.y = Math.floor(idx / 3) * height;
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

function translateToNextFrame() {
  var scalingX;
  switch (options.nrOfiFrames) {
  case 1:
    scalingX = 1;
    break;
  case 2:
    scalingX = 1 / 2;
    break;
  default:
    scalingX = 1 / 3;
  }
  var scalingY = 1 / Math.ceil(options.nrOfiFrames / 3);
  $('#iFrames').css('-webkit-transform', 'translate(0px,0px) scale(' + scalingX + ',' + scalingY + ')');
}

function showOverview() {
  if (intervalTimer) {
    clearInterval(intervalTimer);
  }
  translateToNextFrame();
}

function animate(iframe) {
  checkIfOptionsChanged();
  translateToNextFrame();
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

function loadOptions() {
  chrome.storage.local.get(function (items) {
    if (!chrome.runtime.lastError) {
      if (items.hasOwnProperty('urls')) {
        var urls = JSON.parse(items.urls);
        options.reload = items.reload;
        options.nrOfiFrames = urls.length;
        options.duration = parseInt(items.duration, 10) * 1000;
        options.resolution = items.resolution;
        options.ratio = items.ratio;
        options.random = items.random;
        var width = items.resolution;
        var height;
        var idx;
        if (width !== 'full') {
          height = getHeight(width, items.ratio);
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

        // TODO throw an event here!
        addCSSStyles();
        if (intervalTimer) {
          clearInterval(intervalTimer);
        }
        intervalTimer = setInterval(function () {
          animate(nextIframe);
        }, options.duration);
      } else {
        // TODO throw an event here!
        chrome.app.window.create("../view/options.html", {
          "bounds": {
            "width": 684,
            "height": 481
          }
        });
      }
    } else {
      console.error(chrome.runtime.lastError);
    }
  });
}

function checkIfOptionsChanged() {
  chrome.storage.local.get(function (items) {
    if (!chrome.runtime.lastError) {
      if (items.hasOwnProperty('changed') && items.changed) {
        items.changed = false;
        chrome.storage.local.set({
          'changed': false
        });
        loadOptions();
      }
    } else {
      console.error(chrome.runtime.lastError);
    }
  });
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
    } else if (keycode === 79) { //O
      chrome.app.window.create("../view/options.html", {
        "bounds": {
          "width": 684,
          "height": 481
        }
      });
    }
  });

  loadOptions();
});