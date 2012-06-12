(function($){
  var optionUrlMarkup = '<div class="urlInputDiv"><input type="text" size="50" class="urlInput"><div class="plus addRemoveIcons"></div><div class="minus addRemoveIcons"></div></div>';
  var iFrameMarkup = '<div id="step_${idx}" class="iFrames" data-x="${x}" data-y="${y}"><iframe id="iFrame_${idx}" src="${url}" width="${width}" height="${height}"></iframe></div>';
  $.template('optionUrls', optionUrlMarkup);
  $.template('iFrame', iFrameMarkup);
}(jQuery));
