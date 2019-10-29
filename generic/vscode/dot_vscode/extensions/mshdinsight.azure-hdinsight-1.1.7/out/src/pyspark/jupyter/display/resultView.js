'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
function getWebviewContent(serverPort) {
    // Fix for issue #669 "Results Panel not Refreshing Automatically" - always include a unique time
    // so that the content returned is different. Otherwise VSCode will not refresh the document since it
    // thinks that there is nothing to be updated.
    let timeNow = new Date().getTime();
    const htmlContent = `
                    <!DOCTYPE html>
                    <head><style type="text/css"> html, body{ height:100%; width:100%; } </style>
                    <script type="text/javascript">
                        function start(){
                            console.log('reloaded results window at time ${timeNow}ms');
                            var color = '';
                            var fontFamily = '';
                            var fontSize = '';
                            var theme = '';
                            var fontWeight = '';
                            try {
                                computedStyle = window.getComputedStyle(document.body);
                                color = computedStyle.color + '';
                                backgroundColor = computedStyle.backgroundColor + '';
                                fontFamily = computedStyle.fontFamily;
                                fontSize = computedStyle.fontSize;
                                fontWeight = computedStyle.fontWeight;
                                theme = document.body.className;
                            }
                            catch(ex){
                            }
                            document.getElementById('myframe').src = 'http://localhost:${serverPort}/?theme=' + theme + '&color=' + encodeURIComponent(color) + "&backgroundColor=" + encodeURIComponent(backgroundColor) + "&fontFamily=" + encodeURIComponent(fontFamily) + "&fontWeight=" + encodeURIComponent(fontWeight) + "&fontSize=" + encodeURIComponent(fontSize);
                        }
                    </script>
                    </head>
                    <body onload="start()">
                    <iframe id="myframe" frameborder="0" style="border: 0px solid transparent;height:100%;width:100%;" src="" seamless></iframe></body></html>`;
    return htmlContent;
}
exports.getWebviewContent = getWebviewContent;

//# sourceMappingURL=resultView.js.map
