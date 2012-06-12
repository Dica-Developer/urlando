(function($){
  var optionUrlMarkup = '<input type="text" size="50" value="${url}"><a href="#" onclick="addUrl()">Plus</a><br>';
  var optionUrlEmptyMarkup = '<input type="text" size="50""><a href="#" onclick="addUrl()">Plus</a><br>';
  var iFrameMarkup = '<div id="step_${idx}" class="iFrames" data-x="${x}" data-y="${y}"><iframe id="iFrame_${idx}" src="${url}" width="${width}" height="${height}"></iframe></div>';
  $.template('optionUrls', optionUrlMarkup);
  $.template('optionUrlsEmpty', optionUrlEmptyMarkup);
  $.template('iFrame', iFrameMarkup);
}(jQuery));
