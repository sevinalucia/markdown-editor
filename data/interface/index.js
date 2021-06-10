var config  = {
  "container": {},
  "parser": new DOMParser(),
  "addon": {
    "homepage": function () {
      return chrome.runtime.getManifest().homepage_url;
    }
  },
  "markdown": {
    "html": null,
    "options": {
      "html": true,
      "breaks": false,
      "linkify": true,
      "_change": true,
      "_strict": false,
      "xhtmlOut": false,
      "typographer": true,
      "langPrefix": "language-"
    }
  },
  "codemirror": {
    "editor": null,
    "options": {
      "indentUnit": 2,
      "tabMode": "indent",
      "lineNumbers": true,
      "lineWrapping": true,
      "matchBrackets": true,
      "mode": "text/x-markdown"
    }
  },
  "load": function () {
    config.container.input = document.querySelector(".input");
    config.container.output = document.querySelector(".output");
    /*  */
    config.storage.load(function () {
      var storage = config.storage.read("markdown-options");
      config.markdown.options = storage !== undefined ? storage : config.markdown.options;
      /*  */
      config.app.start();
      config.update.app.editor();
    });
    /*  */
    window.removeEventListener("load", config.load, false);
  },
  "scroll": {
    "action": {
      "left": false,
      "right": false
    },
    "listener": function (e) {
      const output = document.querySelector(".output");
      /*  */
      if (e.target && e.target.className) {
        var left = e.target.className.toLowerCase().indexOf("codemirror-") !== -1;
        var right = e.target.querySelector("div").className.toLowerCase().indexOf("output-") !== -1;
        /*  */
        if (right && config.scroll.action.left) {
          config.codemirror.editor.scrollTo(null, e.target.scrollTop);
        }
        /*  */
        if (left && config.scroll.action.right) {
          output.scrollTop = config.codemirror.editor.getScrollInfo().top;
        }
      }
    }
  },
  "update": {
    "app": {
      "editor": function () {
        try {
          var code = config.storage.read("markdown-code");
          const compile = document.getElementById("compile");
          /*  */
          config.codemirror.editor = CodeMirror.fromTextArea(input, config.codemirror.options);
          config.codemirror.editor.on("change", function () {compile.click()});
          /*  */
          if (code !== undefined) {
            code = window.atob(code);
            config.codemirror.editor.setValue(code);
            window.setTimeout(function () {compile.click()}, 300);
          } else {
            fetch("resources/test.md").then(function (e) {return e.text()}).then(function (e) {
              if (e) {
                config.codemirror.editor.setValue(e);
                window.setTimeout(function () {compile.click()}, 300);
              }
            }).catch(function () {
              config.app.show.error.message("Error: could not find the input .md file!");
            });
          }
        } catch (e) {config.app.show.error.message(e)}
      }
    }
  },
  "download": function () {
    var a = document.createElement('a');
    var txt = config.codemirror.editor.getValue();
    /*  */
    a.style.display = "none";
    a.setAttribute("download", "markdown.md");
    a.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(txt));
    document.body.appendChild(a);
    a.click();
    window.setTimeout(function () {document.body.removeChild(a)});
  },
  "resize": {
    "timeout": null,
    "method": function () {
      var context = document.documentElement.getAttribute("context");
      if (context === "win") {
        if (config.resize.timeout) window.clearTimeout(config.resize.timeout);
        config.resize.timeout = window.setTimeout(function () {
          config.storage.write("interface.size", {
            "width": window.innerWidth || window.outerWidth,
            "height": window.innerHeight || window.outerHeight
          });
        }, 300);
      }
    }
  },
  "storage": {
    "local": {},
    "read": function (id) {
      return config.storage.local[id];
    },
    "load": function (callback) {
      chrome.storage.local.get(null, function (e) {
        config.storage.local = e;
        callback();
      });
    },
    "write": function (id, data) {
      if (id) {
        if (data !== '' && data !== null && data !== undefined) {
          var tmp = {};
          tmp[id] = data;
          config.storage.local[id] = data;
          chrome.storage.local.set(tmp, function () {});
        } else {
          delete config.storage.local[id];
          chrome.storage.local.remove(id, function () {});
        }
      }
    }
  },
  "port": {
    "name": '',
    "connect": function () {
      config.port.name = "webapp";
      var context = document.documentElement.getAttribute("context");
      /*  */
      if (chrome.runtime) {
        if (chrome.runtime.connect) {
          if (context !== config.port.name) {
            if (document.location.search === "?tab") config.port.name = "tab";
            if (document.location.search === "?win") config.port.name = "win";
            if (document.location.search === "?popup") config.port.name = "popup";
            /*  */
            if (config.port.name === "popup") {
              document.documentElement.style.width = "770px";
              document.documentElement.style.height = "570px";
            }
            /*  */
            chrome.runtime.connect({"name": config.port.name});
          }
        }
      }
      /*  */
      document.documentElement.setAttribute("context", config.port.name);
    }
  },
  "app": {
    "process": {
      "file": function (file, callback) {
        if (!file) return;
        /*  */
        var reader = new FileReader();
        reader.readAsText(file);
        reader.onload = function (e) {
          var content = e.target.result;
          if (content) callback(content);
        };
      }
    },
    "show": {
      "error": {
        "message": function (e) {
          const print = document.getElementById("print");
          const output = document.getElementById("output");
          const fileio = document.getElementById("fileio");
          const compile = document.getElementById("compile");
          const download = document.getElementById("download");
          const settings = document.getElementById("settings");
          /*  */
          fileio.disabled = false;
          print.removeAttribute("disabled");
          compile.removeAttribute("disabled");
          download.removeAttribute("disabled");
          settings.removeAttribute("disabled");
          var pre = document.createElement("pre");
          /*  */
          pre.textContent = JSON.stringify(e, null, 2);
          output.textContent = '';
          output.appendChild(pre);
        }
      }
    },
    "compile": {
      "to": {
        "markdown": {
          "document": function (txt, trusted, callback) {
            const print = document.getElementById("print");
            const output = document.getElementById("output");
            const fileio = document.getElementById("fileio");
            const compile = document.getElementById("compile");
            const download = document.getElementById("download");
            const settings = document.getElementById("settings");
            /*  */
            if (trusted) {
              fileio.disabled = true;
              output.setAttribute("empty", '');
              print.setAttribute("disabled", '');
              compile.setAttribute("disabled", '');
              download.setAttribute("disabled", '');
              settings.setAttribute("disabled", '');
              output.textContent = "Loading, please wait...";
            }
            /*  */
            window.setTimeout(function () {
              try {
                config.markdown.options.highlight = function (code, lang) {
                  var escapeHtml = config.markdown.html.utils.escapeHtml;
                  try {
                    if (lang && lang !== "auto" && hljs.getLanguage(lang)) {
                      var result = hljs.highlight(code, {"language": lang, "ignoreIllegals": true});
                      return '<pre class="hljs language-' + escapeHtml(lang.toLowerCase()) + '"><code>' + result.value + '</code></pre>';
                    } else if (lang === "auto") {
                      var result = hljs.highlightAuto(code);
                      return '<pre class="hljs language-' + escapeHtml(result.language) + '"><code>' + result.value + '</code></pre>';
                    }
                  } catch (e) {}
                  /*  */
                  return '<pre class="hljs"><code>' + escapeHtml(code) + '</code></pre>';
                };
                /*  */
                var options = config.markdown.options._strict ? "commonmark" : config.markdown.options;
                config.markdown.html = window.markdownit(options)
                  .use(window.markdownitIns)
                  .use(window.markdownitSub)
                  .use(window.markdownitSup)
                  .use(window.markdownitAbbr)
                  .use(window.markdownitMark)
                  .use(window.markdownitEmoji)
                  .use(window.markdownitDeflist)
                  .use(window.markdownitFootnote);
                /*  */
                var doc = config.parser.parseFromString(config.markdown.html.render(txt), "text/html");
                /*  */
                fileio.disabled = false;
                print.removeAttribute("disabled");
                compile.removeAttribute("disabled");
                download.removeAttribute("disabled");
                settings.removeAttribute("disabled");
                config.storage.write("markdown-code", window.btoa(txt));
                /*  */
                output.textContent = '';
                output.removeAttribute("empty");
                var nodes = [...doc.body.childNodes];
                nodes.map(function (node) {output.appendChild(node)});
                /*  */
                config.container.buttons.map(function (button) {
                  if (button.id !== "_strict") {
                    button.disabled = config.markdown.options._strict;
                  }
                });
                /*  */
                callback(true);
              } catch (e) {config.app.show.error.message(e)}
            }, (trusted ? 300 : 0));
          }
        }
      }
    },
    "start": function () {
      const print = document.getElementById("print");
      const fileio = document.getElementById("fileio");
      const reload = document.getElementById("reload");
      const compile = document.getElementById("compile");
      const support = document.getElementById("support");
      const donation = document.getElementById("donation");
      const download = document.getElementById("download");
      const settings = document.getElementById("settings");
      /*  */
      download.addEventListener("click", config.download, false);
      /*  */
      print.addEventListener("click", function () {
        window.print();
      }, false);
      /*  */
      reload.addEventListener("click", function () {
        document.location.reload();
      }, false);
      /*  */
      support.addEventListener("click", function () {
        var url = config.addon.homepage();
        chrome.tabs.create({"url": url, "active": true});
      }, false);
      /*  */
      donation.addEventListener("click", function () {
        var url = config.addon.homepage() + "?reason=support";
        chrome.tabs.create({"url": url, "active": true});
      }, false);
      /*  */
      config.container.input.addEventListener("mouseover", function () {
        config.scroll.action.left = false;
        config.scroll.action.right = true;
      }, false);
      /*  */
      config.container.output.addEventListener("mouseover", function () {
        config.scroll.action.left = true;
        config.scroll.action.right = false;
      }, false);
      /*  */
      fileio.addEventListener("change", function (e) {
        config.app.process.file(e.target.files[0], function (txt) {
          config.codemirror.editor.setValue(txt);
        });
      }, false);
      /*  */
      compile.addEventListener("click", function (e) {
        var txt = config.codemirror.editor.getValue();
        config.app.compile.to.markdown.document(txt, e.isTrusted, function () {
          var output = document.querySelector(".output");
          output.scrollTop = config.codemirror.editor.getScrollInfo().top;
        });
      }, false);
      /*  */
      settings.addEventListener("click", function () {
        var target = document.querySelector(".settings");
        var open = target.getAttribute("open");
        /*  */
        if (open !== null) {
          target.removeAttribute("open");
        } else {
          target.setAttribute("open", '');
        }
      }, false);
      /*  */
      config.container.buttons = [...document.querySelector(".settings").querySelectorAll("input")];
      config.container.buttons.map(function (button) {
        if (button.id in config.markdown.options) {
          button.checked = config.markdown.options[button.id];
        }
        /*  */
        button.addEventListener("change", function (e) {
          var tmp = config.markdown.options;
          tmp[e.target.id] = e.target.checked;
          config.markdown.options = tmp;
          /*  */
          config.storage.write("markdown-options", config.markdown.options);
          compile.click()
        }, false);
      });
    }
  }
};

config.port.connect();

window.addEventListener("load", config.load, false);
window.addEventListener("resize", config.resize.method, false);
window.addEventListener("scroll", config.scroll.listener, true);
window.addEventListener("dragover", function (e) {e.preventDefault()});
window.addEventListener("drop", function (e) {if (e.target.id !== "fileio") e.preventDefault()});
