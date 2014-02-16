(function() {
    var fiddle = null,
        runBtn = document.querySelector('.run'),
        lintBtn = document.querySelector('.lint'),
        saveBtn = document.querySelector('.save'),
        iDoc = document.querySelector('.result').contentDocument,
        iHead = iDoc.getElementsByTagName('head')[0],
        traceur = document.createElement('script'),
        logger = document.createElement('script'),
        style = document.createElement('style'),
        lintLog = null,
        userInput = null,
        bootstrap = null;

    //set the global examples object
    window.es6Example = {};
    window.exampleSelector = document.querySelector('.examples');

    //add the fiddle area
    fiddle = window.CodeMirror(document.querySelector('.fiddle'), {
        lineNumbers: true
    });
    fiddle.focus();

    //add the logger script to the iframe
    logger.innerHTML =
        'window.console.log = (function() {\n' +
        '\tvar log = console.log;\n' +
        '\treturn function() {\n' +
        '\t\tlog.apply(window.console, arguments);\n' +
        '\t\tdocument.body.innerHTML +=\n' +
        '\t\t\t"<div>" + \n' +
        '\t\t\t\tArray.prototype.slice.call(arguments).join(" ") + \n' +
        '\t\t"</div>";\n' +
        '\t};\n' +
        '})();\n\n' +
        'window.console.error = (function() {\n' +
        '\tvar err = console.error;\n' +
        '\treturn function() {\n' +
        '\t\terr.apply(window.console, arguments);\n' +
        '\t\tdocument.body.innerHTML +=\n' +
        '\t\t\t"<div>" + \n' +
        '\t\t\t\tArray.prototype.slice.call(arguments).join(" ") + \n' +
        '\t\t"</div>";\n' +
        '\t};\n' +
        '})();\n\n';
    iHead.appendChild(logger);

    //set the iDoc css
    style.innerHTML =
        'body{font-family:monospace;padding:10px;color:#666}\n' +
        'div{border-bottom:1px solid #eee;padding: 2px 0;}';
    iHead.appendChild(style);

    //wait for traceur to load
    traceur.onload = function() {
        var saveId = window.location.href.split('/'),
            loadReq = new XMLHttpRequest(),
            loadResp;

        if (saveId.length > 4) { //load up the saved code
            loadReq.open('GET', '/fiddles/' + saveId[saveId.length - 2], true);
            loadReq.send();
            loadReq.onload = function() {
                if (this.status >= 200 && this.status < 400) {
                    loadResp = JSON.parse(this.response);
                    if (loadResp.value) {
                        fiddle.setValue(loadResp.value);
                    } else {
                        fiddle.setValue('\/* Sorry, but I could not load your code right now. *\/');
                    }
                }
            };
        }

        //run the input
        runBtn.onclick = function() {
            if (userInput) { //clean up the old code
                iHead.removeChild(userInput);
            }
            if (bootstrap) { //clean up the old code
                iHead.removeChild(bootstrap);
            }

            //create new script elements for the bootstrap and user input
            userInput = document.createElement('script');
            bootstrap = document.createElement('script');

            //user input needs to be a 'module' script for traceur
            userInput.setAttribute('type', 'module');

            //set the new script code
            userInput.innerHTML = fiddle.getValue();
            bootstrap.innerHTML =
                'document.body.innerHTML = \'\';\n' +
                'traceur.options.experimental = true;\n' +
                'new traceur.WebPageTranscoder(document.location.href).run();\n';

            //append the new scripts
            iHead.appendChild(userInput);
            iHead.appendChild(bootstrap);
        };

        //lint the result
        lintBtn.onclick = function() {
            var lint = window.JSHINT(fiddle.getValue(), {
                esnext: true,
                undef: true,
                devel: true
            });

            //clean up the old lint log script
            if (lintLog) {
                iHead.removeChild(lintLog);
            }

            //make a new lint log script
            lintLog = document.createElement('script');
            lintLog.innerHTML = 'document.body.innerHTML = \'\';\n';

            //remove the line error class from all lines
            fiddle.eachLine(function(line) {
                fiddle.removeLineClass(line, 'background', 'line-error');
            });

            if (!lint) {
                window.JSHINT.errors.forEach(function(err) {
                    fiddle.addLineClass(err.line - 1, 'background', 'line-error');
                    lintLog.innerHTML +=
                        'console.log(\'Line \' + ' +
                        err.line +
                        ' + \':\', \'' +
                        err.reason.replace(/'/g, '\\\'') + '\')\n';
                });
            } else {
                lintLog.innerHTML += 'console.log(\'Your code is lint free!\');';
            }

            iHead.appendChild(lintLog);
        };

        //save the code to gist
        saveBtn.onclick = function() {
            var code = fiddle.getValue(),
                saveReq = new XMLHttpRequest(),
                resp;

            if (code) {
                saveReq.open('POST', '/save', true);
                saveReq.setRequestHeader('Content-type','application/json');
                saveReq.onload = function() {
                    if (this.status >= 200 && this.status < 400) {
                        resp = JSON.parse(this.response);
                        window.location.href = '/' + resp.fiddle + '/';
                    }
                };
                saveReq.send(JSON.stringify({
                    value: fiddle.getValue()
                }));
            }
        };

        //load the selected code
        window.exampleSelector.onchange = function() {
            if (window.exampleSelector.value) {
                fiddle.setValue(window.es6Example[window.exampleSelector.value].code);
            }
        };
    };

    //add traceur to the iframe
    traceur.src = '/lib/traceur/src/traceur.js';
    iHead.appendChild(traceur);
})();
