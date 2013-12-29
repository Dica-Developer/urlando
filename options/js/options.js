/*global localStorage*/

function addUrl() {
  var urlInputDiv = $.tmpl('optionUrls');
  urlInputDiv.find('.minus').on('click', function (e) {
    $(this).parent().remove();
  }).show();
  urlInputDiv.find('.plus').on('click', function () {
    addUrl();
  });
  urlInputDiv.appendTo('#urlSetup');
}

var saveOptions = function () {
  var urlInputs = $('#urlSetup').find('input');
  var resolution = $('#resolution').find(':selected').val();
  var ratio = $('#ratio').find(':selected').val();
  var reload = $('#reload').is(':checked');
  var random = $('#random').is(':checked');
  var duration = $('#duration').find(':selected').val();
  var urls = [];
  var options;
  urlInputs.each(function () {
    urls[urls.length] = {
      url: $(this).val()
    };
  });
  localStorage.urls = JSON.stringify(urls);
  localStorage.options = JSON.stringify({
    resolution: resolution,
    ratio: ratio,
    reload: reload,
    duration: duration,
    random: random,
    changed: true
  });
};

function removeClick() {
  $(this).parent().remove();
}

$(function () {
  $('#resolution').on('change', function () {
    if ($(this).val() === 'full') {
      $('#ratio').attr('disabled', 'disabled');
    } else {
      $('#ratio').attr('disabled', null);
    }
  });
  $('#saveOptions').on('click', saveOptions);

  var urlInputDiv;
  var idx;
  if ('undefined' !== typeof localStorage.urls) {
    var urls = JSON.parse(localStorage.urls);
    for (idx = 0; idx < urls.length; idx++) {
      urlInputDiv = $.tmpl('optionUrls');
      if (urls.length > 1) {
        urlInputDiv.find('.minus').on('click', removeClick).show();
      }
      urlInputDiv.find('.plus').on('click', addUrl);
      urlInputDiv.find('.urlInput').val(urls[idx].url);
      urlInputDiv.appendTo('#urlSetup');
    }
  } else {
    urlInputDiv = $.tmpl('optionUrls');
    urlInputDiv.find('.plus').on('click', function () {
      addUrl();
    });
    urlInputDiv.appendTo('#urlSetup');
  }

  if ('undefined' !== typeof localStorage.options) {
    var options = JSON.parse(localStorage.options);
    $('#resolution option[value="' + options.resolution + '"]').attr('selected', true).trigger('change');
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
  }
});