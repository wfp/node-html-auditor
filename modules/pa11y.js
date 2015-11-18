/**
 * @callback _pa11y - Executing pa11y.
 *
 * @param {String} file
 * @param callback
 */
var _pa11y = function(file, callback) {
  // Prepare pa11y options.
  var options = {
    standard: 'WCAG2A',
    ignore: [
      'notice',
      'warning'
    ]
  };
  // Test file.
  pa11y(options).run(format('file:%s', file), function(error, data) {
    if (error) {
      throw new Error(format('%s'.red, error));
    }
    if (data.length) {
      // Push all report object in _data object.
      data.forEach(function(object) {
        _data.push(object);
      });
      // Calling callback - passing data object.
      callback(_data);
    }
  });
};
