(function(BT){
    var dataGetter = {
        'au' : {
            'f' : function(data, num){ return data['author'] && data['author'][num] && data['author'][num]['first'] && data['author'][num]['first'][0] ? data['author'][num]['first'][0].toLowerCase() : undefined; },
            'F' : function(data, num){ return data['author'] && data['author'][num] && data['author'][num]['first'] && data['author'][num]['first'][0] ? data['author'][num]['first'][0].toUpperCase() : undefined; },
            'first' : function(data, num){ return data['author'] && data['author'][num] && data['author'][num]['first'] ? data['author'][num]['first'].toLowerCase() : undefined; },
            'First' : function(datanum ){ return data['author'] && data['author'][num] && data['author'][num]['first'] ? capitalize(data['author'][num]['first']) : undefined; },
            'FIRST' : function(datanum ){ return data['author'] && data['author'][num] && data['author'][num]['first'] ? data['author'][num]['first'].toUpperCase() : undefined; },

            'v' : function(data, num){ return data['author'] && data['author'][num] && data['author'][num]['von'] && data['author'][num]['von'][0] ? data['author'][num]['von'][0].toLowerCase() : undefined; },
            'V' : function(data, num){ return data['author'] && data['author'][num] && data['author'][num]['von'] && data['author'][num]['von'][0] ? data['author'][num]['von'][0].toUpperCase() : undefined; },
            'von' : function(data, num){ return data['author'] && data['author'][num] && data['author'][num]['von'] ? data['author'][num]['von'].toLowerCase() : undefined; },
            'Von' : function(data, num){ return data['author'] && data['author'][num] && data['author'][num]['von'] ? capitalize(data['author'][num]['von']) : undefined; },
            'VON' : function(data, num){ return data['author'] && data['author'][num] && data['author'][num]['von'] ? data['author'][num]['von'].toUpperCase() : undefined; },

            'l' : function(data, num){ return data['author'] && data['author'][num] && data['author'][num]['last'] && data['author'][num]['last'][0] ? data['author'][num]['last'][0].toLowerCase() : undefined; },
            'L' : function(data, num){ return data['author'] && data['author'][num] && data['author'][num]['last'] && data['author'][num]['last'][0] ? data['author'][num]['last'][0].toUpperCase() : undefined; },
            'last' : function(data, num){ return data['author'] && data['author'][num] && data['author'][num]['last'] ? data['author'][num]['last'].toLowerCase() : undefined; },
            'Last' : function(data, num){ return data['author'] && data['author'][num] && data['author'][num]['last'] ? capitalize(data['author'][num]['last']) : undefined; },
            'LAST' : function(data, num){ return data['author'] && data['author'][num] && data['author'][num]['last'] ? data['author'][num]['last'].toUpperCase() : undefined; },
        },
        'title' : function(data){ return data['title'] ? data['title'].toLowerCase() : undefined; },
        'Title' : function(data){ return data['title'] ? capitalize(data['title']) : undefined; },
        'TITLE' : function(data){ return data['title'] ? data['title'].toUpperCase() : undefined; },

        'year' : function(data){ return data['year']; },
        'yr' : function(data){ return ('00' + (parseInt(data['year']) % 100)).slice(-2); },

        'journal' : function(data){ return data['journal']; },
        'volume' : function(data){ return data['volume']; },
        'pg' : {
            'start' : function(data){ return data['pg'] ? data['pg']['start'] : undefined; },
            'end' : function(data){ return data['pg'] ? data['pg']['end'] : undefined; },
        },

        'publisher' : function(data){ return data['publisher'] ? data['publisher'].toLowerCase() : undefined; },
        'Publisher' : function(data){ return data['publisher'] ? capitalize(data['publisher']) : undefined; },
        'PUBLISHER' : function(data){ return data['publisher'] ? data['publisher'].toUpperCase() : undefined; },

        'key' : function(data){ return data['key']; }

    };

    var capitalize = function(str){
        return str.length === 0 ? '' : str.charAt(0).toUpperCase() + str.slice(1);
    }

    var dataMatch = function(nodeData, bibData){
        var path = nodeData.split('.');
        var x = dataGetter;
        var num = -1;

        for(var i = 0; i < path.length; ++i){
            if(path[i].slice(0,2) === 'au'){
                var match = path[i].match(/au\[(\d+)\]$/);
                if(match === null){
                    console.error('invalid author');
                }
                num = parseInt(match[1]);
                path[i] = 'au';
            }

            x = x[ path[i] ];

            if(typeof(x) === 'undefined'){
                return undefined;
            }
        }

        //num is only used for the author command. it is otherwise ignored
        return x(bibData, num);

    };

    BT.macros = {};

    BT.preprocess = function(str){
        var splitStr = ('\n\n' + str).replace(/\s*$/,'').split(/\n\n+\s*#([a-zA-z0-9]+):\n/);
        //if you find \n\n in one of the strings somewhere, you know there's a mistake
        for(var i = 0; i < splitStr.length; ++i){
            if(splitStr[i].match(/\n\n/) !== null){
                console.error('Format string not in definition');
                return '';
            }
        }
        for(var i = 1; i < splitStr.length; i += 2){
            BT.macros[ splitStr[i] ] = splitStr[i + 1];
        }
    }

    BT.parse = function(str){
        if(typeof(str) === 'undefined'){
            return undefined;
        }

        var currentMacro = '';
        var root = { parent: null, conditional: false, children: []};

        var cNode = root;

        var stream = new BT.Stream(str);
        while(true){
            //we guarantee that cNode will always be pointing to a non-conditional node
            var tk = stream.next();

            if(tk.type === 'TEXT'){
                cNode.children.push(tk.token);
            }
            else if(tk.type === 'BEGIN_COND'){
                var n = { parent: cNode, conditional: true, children: [] };
                cNode.children.push(n);
                var n2 = { parent: n, conditional: false, children: [] };
                n.children.push(n2);
                cNode = n2;
            }
            else if(tk.type === 'NEXT_COND'){
                var n = { parent: cNode.parent, conditional: false, children: [] };
                cNode.parent.children.push(n);
                cNode = n;
            }
            else if(tk.type === 'END_COND'){
                cNode = cNode.parent.parent;
            }
            else if(tk.type === 'MACRO'){
                //FIXME check if macro is defined
                var n = BT.parse(BT.macros[tk.token]);
                cNode.children.push(n);
                n.parent = cNode;
            }
            else if(tk.type === 'DEF'){
                currentMacro = tk.token;
            }
            else if(tk.type === 'DATA'){
                cNode.children.push({ parent: cNode, conditional: false, data: tk.token, children: [] });
            }
            else if(tk.type === 'HAS_DATA'){
                cNode.children.push({ parent: cNode, conditional: 'has data', data: tk.token, children: [] });
            }
            else if(tk.type === 'EOF'){
                break;
            }
            else{
                console.log(tk);
                throw 'What happened?';
            }
        }

        if(cNode !== root){
            console.error('Mismatch');
        }

        return root;
    };

    BT.createBibItem = function(data){
        if(typeof(BT.macros[ data['doctype'] ]) === 'undefined'){
            console.error('Unknown document type');
            return '';
        }
        return BT.evaluate(BT.parse('#' + data['doctype']), data) + '\n\n';
    };

    BT.evaluate = function(root, data){
        if(typeof(root) === 'string'){
            return root; //FIXME
        }

        if(root.conditional === 'has data'){
            if(typeof(root.data) === 'undefiend'){
                throw 'sanity check: impossible';
            }

            var dm = dataMatch(root.data, data);

            if(typeof(dm) === 'undefined'){
                return undefined;
            }
            return '';
        }

        if(typeof(root.data) !== 'undefined'){
            return dataMatch(root.data, data);
        }

        if(root.conditional){
            for(var i = 0; i < root.children.length; ++i){
                var output = BT.evaluate(root.children[i], data);
                if(typeof(output) !== 'undefined'){
                    return output;
                }
            }
            return '';
        }
        else{
            var output = '';
            for(var i = 0; i < root.children.length; ++i){
                var x = BT.evaluate(root.children[i], data);
                if(typeof(x) === 'undefined'){
                    return undefined;
                }

                output += x;
            }
            return output;
        }
    };

})(window.BiblioTeX = window.BiblioTeX || {});
