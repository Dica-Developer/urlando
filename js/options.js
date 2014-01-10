/*global chrome, Mousetrap*/

var optionUrlMarkupTemplate = '<div class="urlInputDiv"><input type="text" size="75" class="urlInput"><div class="plus addRemoveIcons"></div><div class="minus addRemoveIcons"></div></div>';

function addUrl() {
  var urlInputDiv = $(optionUrlMarkupTemplate);
  urlInputDiv.find('.minus').on('click', function (e) {
    $(this).parent().remove();
  }).show();
  urlInputDiv.find('.plus').on('click', function () {
    addUrl();
  });
  urlInputDiv.appendTo('#urlSetup');
}

var updateOptions = function (successCallback) {
  var urlInputs = $('#urlSetup').find('input');
  var resolution = $('#resolution').find(':selected').val();
  var ratio = $('#ratio').find(':selected').val();
  var reload = $('#reload').is(':checked');
  var random = $('#random').is(':checked');
  var duration = $('#duration').find(':selected').val();
  var urls = [];
  urlInputs.each(function () {
    urls[urls.length] = {
      url: $(this).val()
    };
  });
  var options = {
    resolution: resolution,
    ratio: ratio,
    reload: reload,
    duration: duration,
    random: random
  };
  if (urls.length > 0) {
    options.urls = JSON.stringify(urls);
  } else {
    chrome.storage.local.remove('urls');
  }
  chrome.storage.local.set(options, function () {
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError);
    } else {
      console.info('Options saved successfully.');
      chrome.runtime.sendMessage('options.updated');
      if (successCallback) {
        successCallback();
      }
    }
  });
};

var saveOptions = function () {
  updateOptions(function () {
    chrome.app.window.current().close();
  });
};

function removeClick() {
  $(this).parent().remove();
}

$(function () {
  Mousetrap.bind('esc', function () {
    chrome.app.window.current().close();
  });
  $('#resolution').on('change', function () {
    if ($(this).val() === 'full') {
      $('#ratio').attr('disabled', 'disabled');
    } else {
      $('#ratio').attr('disabled', null);
    }
  });
  $('#saveOptions').on('click', saveOptions);
  $('#updateOptions').on('click', updateOptions);

  var urlInputDiv;
  var idx;
  chrome.storage.local.get(function (options) {
    if (options.hasOwnProperty('urls') && options.urls.length > 4) {
      var urls = JSON.parse(options.urls);
      for (idx = 0; idx < urls.length; idx++) {
        urlInputDiv = $(optionUrlMarkupTemplate);
        if (urls.length > 1) {
          urlInputDiv.find('.minus').on('click', removeClick).show();
        }
        urlInputDiv.find('.plus').on('click', addUrl);
        urlInputDiv.find('.urlInput').val(urls[idx].url);
        urlInputDiv.appendTo('#urlSetup');
      }
    } else {
      urlInputDiv = $(optionUrlMarkupTemplate);
      urlInputDiv.find('.plus').on('click', function () {
        addUrl();
      });
      urlInputDiv.appendTo('#urlSetup');
    }
    if (options.hasOwnProperty('ratio')) {
      $('#ratio option[value="' + options.ratio + '"]').attr('selected', true);
      $('#duration option[value="' + options.duration + '"]').attr('selected', true);
      var reload = $('#reload');
      if (options.reload) {
        reload.attr('checked', 'checked');
      } else {
        reload.attr('checked', null);
      }
      var random = $('#random');
      if (options.random) {
        random.attr('checked', 'checked');
      } else {
        random.attr('checked', null);
      }
      $('#resolution option[value="' + options.resolution + '"]').attr('selected', true).trigger('change');
    }
  });
});