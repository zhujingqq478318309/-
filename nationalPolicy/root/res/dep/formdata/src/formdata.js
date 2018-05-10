(function() {
  (function(self) {
    var BOUNDARY, BlobPart, CRLF, FormData, StringPart, support;
    if (self.FormData) {
      return;
    }
    support = {
      arrayBuffer: !!self.ArrayBuffer,
      blob: !!self.FileReader && !!self.Blob && (function() {
        try {
          new Blob();
          return true;
        } catch (error) {
          return false;
        }
      })()
    };
    CRLF = "\r\n";
    BOUNDARY = "--------FormData" + Math.random();
    StringPart = (function() {
      function StringPart(name, value1) {
        this.name = name;
        this.value = value1;
      }

      StringPart.prototype.convertToString = function() {
        var lines;
        lines = [];
        return new Promise((function(_this) {
          return function(resolve) {
            lines.push("--" + BOUNDARY + CRLF);
            lines.push("Content-Disposition: form-data; name=\"" + _this.name + "\";" + CRLF + CRLF);
            lines.push("" + _this.value + CRLF);
            return resolve(lines.join(''));
          };
        })(this));
      };

      return StringPart;

    })();
    BlobPart = (function() {
      function BlobPart(name, filename, souce) {
        this.name = name;
        this.filename = filename;
        this.souce = souce;
      }

      BlobPart.prototype._readArrayBufferAsString = function(buff) {
        var view;
        view = new Uint8Array(buff);
        return view.reduce(function(acc, b) {
          acc.push(String.fromCharCode(b));
          return acc;
        }, new Array(view.length)).join('');
      };

      BlobPart.prototype._readBlobAsArrayBuffer = function() {
        return new Promise((function(_this) {
          return function(resolve) {
            var reader;
            reader = new FileReader();
            reader.readAsArrayBuffer(_this.souce);
            return reader.onload = function() {
              return resolve(_this._readArrayBufferAsString(reader.result));
            };
          };
        })(this));
      };

      BlobPart.prototype._readBlobAsBinary = function() {
        return new Promise((function(_this) {
          return function(resolve) {
            return resolve(_this.souce.getAsBinary());
          };
        })(this));
      };

      BlobPart.prototype.convertToString = function() {
        var lines;
        lines = [];
        lines.push("--" + BOUNDARY + CRLF);
        lines.push("Content-Disposition: form-data; name=\"" + this.name + "\"; filename=\"" + this.filename + "\"" + CRLF);
        lines.push("Content-Type: " + this.souce.type + CRLF + CRLF);
        if (support.blob && support.arrayBuffer) {
          return this._readBlobAsArrayBuffer().then(function(strings) {
            lines.push(strings + CRLF);
            return lines.join('');
          });
        } else {
          return this._readBlobAsBinary().then(function(strings) {
            lines.push(strings + CRLF);
            return lines.join('');
          });
        }
      };

      return BlobPart;

    })();
    FormData = (function() {
      function FormData() {
        this.polyfill = true;
        this._parts = [];
        this.boundary = BOUNDARY;
      }

      FormData.prototype._stringToTypedArray = function(string) {
        var bytes;
        bytes = Array.prototype.map.call(string, function(s) {
          return s.charCodeAt(0);
        });
        return new Uint8Array(bytes);
      };

      FormData.prototype.append = function(key, value) {
        var part;
        part = null;
        if (typeof value === "string") {
          part = new StringPart(key, value);
        } else if (value instanceof Blob) {
          part = new BlobPart(key, value.name || "blob", value);
        } else {
          part = new StringPart(key, value);
        }
        if (part) {
          this._parts.push(part);
        }
        return this;
      };

      FormData.prototype.toString = function() {
        var parts;
        parts = this._parts;
        return Promise.all(this._parts.map(function(part) {
          return part.convertToString();
        })).then(function(lines) {
          lines.push("--" + BOUNDARY + "--");
          return lines.join('');
        }).then(this._stringToTypedArray);
      };

      return FormData;

    })();
    return self.FormData = FormData;
  })(typeof self !== 'undefined' ? self : this);

}).call(this);
