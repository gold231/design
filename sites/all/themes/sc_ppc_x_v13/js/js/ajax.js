//ajax methods used as workaround for jQuery 1.3 ajax IE bug
module.exports = {

  ajax: {

    x: function() {
      if (typeof XMLHttpRequest !== 'undefined') {
        return new XMLHttpRequest();
      }
      var versions = [
        "MSXML2.XmlHttp.5.0",
        "MSXML2.XmlHttp.4.0",
        "MSXML2.XmlHttp.3.0",
        "MSXML2.XmlHttp.2.0",
        "Microsoft.XmlHttp"
      ];

      var xhr;
      for (var i = 0; i < versions.length; i++) {
        try {
          xhr = new ActiveXObject(versions[i]);
          break;
        }
        catch (e) {}
      }
      return xhr;
    },

    send: function(url, callback, method, data, sync) {
      var x = module.exports.ajax.x();
      x.open(method, url, sync);
      x.onreadystatechange = function() {
        if (x.readyState == 4) {
          callback(x.responseText)
        }
      };
      if (method == 'POST') {
        x.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
      }
      x.send(data); // Need to check back here, the .send was taken out to get passed an undefined function
    },

    get: function(url, data, callback, sync) {
      var query = [];
      for (var key in data) {
        query.push(encodeURIComponent(key) + '=' + encodeURIComponent(data[key]));
      }
      module.exports.ajax.send(url + '?' + query.join('&'), callback, 'GET', null, sync)
    },

    post: function(url, data, callback, sync) {
      var query = [];
      for (var key in data) {
        query.push(encodeURIComponent(key) + '=' + encodeURIComponent(data[key]));
      }
      module.exports.ajax.send(url, callback, 'POST', query.join('&'), sync);
    }
  }
};