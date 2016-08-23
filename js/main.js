/*global window, chrome, Mousetrap*/
var intervalTimer = null;
var nextIframe = 0;
var options = {
  reload: false,
  nrOfiFrames: 0,
  duration: 10000,
  resolution: 'full',
  ratio: 0,
  random: false,
  animation: true,
  chromeScalingFix: false
};
var overviewMode = false;
var iFrameMarkupTemplate = '<div id="step_${idx}" class="iFrames" data-x="${x}" data-y="${y}"><webview id="iFrame_${idx}" data-url="${url}" src="${url}" style="width:${width}px; height:${height}px;"></webview></div>';

function displayStatus(status) {
  $('<div id="statusMessage" class="statusMessage">' + status + '</div>').appendTo('body');
  $('#statusMessage').animate({
    opacity: 1
  }, 1250, 'swing', function () {
    $('#statusMessage').animate({
      opacity: 0
    }, 1250, 'swing', function () {
      $('#statusMessage').remove();
    });
  });
}

function addIFrames(urls) {
  var i = 0;
  var iFrameMarkup;
  $('#iFrames').remove();
  $('<div id="iFrames"></div>').appendTo('body');
  for (i = 0; i < urls.length; i++) {
    iFrameMarkup = iFrameMarkupTemplate;
    iFrameMarkup = iFrameMarkup.replace('${url}', urls[i].url);
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

function addCSSStylesWithScaleFix() {
  $('.iFrames').each(function () {
    var x = $(this).data('x');
    var y = $(this).data('y');
    $(this).css('-webkit-transform', 'translate(' + (x + 946) + 'px,' + (y + 330) + 'px) scale(1.74, 1.41)');
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
  if (options.chromeScalingFix) {
    addCSSStylesWithScaleFix();
  }
}

function showOverview() {
  overviewMode = true;
  translateToNextFrame();
}

function animate(iframe) {
  if (overviewMode) {
    setTimeout(function () {
      nextIframe = nextPosition();
      if (options.reload) {
        var url = $('#iFrame_' + nextIframe).data('url');
        $('#iFrame_' + nextIframe).attr('src', url);
      }
    }, options.animation ? 5000 : 0);
  } else {
    translateToNextFrame();
    setTimeout(function () {
      var framePosition = getFramePosition(iframe);
      $('#iFrames').css('-webkit-transform', 'translate(' + -framePosition.x + 'px,' + -framePosition.y + 'px) scale(1,1)');
      if (options.chromeScalingFix) {
        addCSSStyles();
      }
      nextIframe = nextPosition();
      if (options.reload) {
        var url = $('#iFrame_' + nextIframe).data('url');
        $('#iFrame_' + nextIframe).attr('src', url);
      }
    }, options.animation ? 5000 : 0);
  }
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
        options.chromeScalingFix = items.chromeScalingFix;
        var width = items.resolution;
        var height;
        var idx;
        $('#iFrames').remove();
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
        if (!options.chromeScalingFix) {
          addCSSStyles();
        }
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
            "height": 550
          }
        });
      }
    } else {
      console.error(chrome.runtime.lastError);
    }
  });
}

function nextFrame(frame) {
  overviewMode = false;
  if (frame < options.nrOfiFrames) {
    animate(frame);
  }
}

$(function () {
  chrome.runtime.onMessage.addListener(loadOptions);
  Mousetrap.bind('mod+o', function () {
    chrome.app.window.create("../view/options.html", {
      "bounds": {
        "width": 684,
        "height": 550
      }
    });
  });
  Mousetrap.bind('mod+s', function () {
    if (!options.animation) {
      options.animation = true;
      intervalTimer = setInterval(function () {
        animate(nextIframe);
      }, options.duration);
      displayStatus('animation started');
    } else {
      options.animation = false;
      if (intervalTimer) {
        clearInterval(intervalTimer);
      }
      displayStatus('animation paused');
    }
  });
  Mousetrap.bind('mod+0', showOverview);
  Mousetrap.bind('mod+1', function () {
    nextFrame(0);
  });
  Mousetrap.bind('mod+2', function () {
    nextFrame(1);
  });
  Mousetrap.bind('mod+3', function () {
    nextFrame(2);
  });
  Mousetrap.bind('mod+4', function () {
    nextFrame(3);
  });
  Mousetrap.bind('mod+5', function () {
    nextFrame(4);
  });
  Mousetrap.bind('mod+6', function () {
    nextFrame(5);
  });
  Mousetrap.bind('mod+7', function () {
    nextFrame(6);
  });
  Mousetrap.bind('mod+8', function () {
    nextFrame(7);
  });
  Mousetrap.bind('mod+9', function () {
    nextFrame(8);
  });
  loadOptions();
});
