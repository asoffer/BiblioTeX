(function(BT){
    var dataGetter = {
        'au' : {
            'f' : function(data){ return data['author'] && data['author']['first'] && data['author']['first'][0] ? data['author']['first'][0].toLowerCase() : undefined; },
            'F' : function(data){ return data['author'] && data['author']['first'] && data['author']['first'][0] ? data['author']['first'][0].toUpperCase() : undefined; },
            'first' : function(data){ return data['author'] && data['author']['first'] ? data['author']['first'].toLowerCase() : undefined; },
            'First' : function(data){ return data['author'] && data['author']['first'] ? capitalize(data['author']['first']) : undefined; },
            'FIRST' : function(data){ return data['author'] && data['author']['first'] ? data['author']['first'].toUpperCase() : undefined; },

            'v' : function(data){ return data['author'] && data['author']['von'] && data['author']['von'][0] ? data['author']['von'][0].toLowerCase() : undefined; },
            'V' : function(data){ return data['author'] && data['author']['von'] && data['author']['von'][0] ? data['author']['von'][0].toUpperCase() : undefined; },
            'von' : function(data){ return data['author'] && data['author']['von'] ? data['author']['von'].toLowerCase() : undefined; },
            'Von' : function(data){ return data['author'] && data['author']['von'] ? capitalize(data['author']['von']) : undefined; },
            'VON' : function(data){ return data['author'] && data['author']['von'] ? data['author']['von'].toUpperCase() : undefined; },

            'l' : function(data){ return data['author'] && data['author']['last'] && data['author']['last'][0] ? data['author']['last'][0].toLowerCase() : undefined; },
            'L' : function(data){ return data['author'] && data['author']['last'] && data['author']['last'][0] ? data['author']['last'][0].toUpperCase() : undefined; },
            'last' : function(data){ return data['author'] && data['author']['last'] ? data['author']['last'].toLowerCase() : undefined; },
            'Last' : function(data){ return data['author'] && data['author']['last'] ? capitalize(data['author']['last']) : undefined; },
            'LAST' : function(data){ return data['author'] && data['author']['last'] ? data['author']['last'].toUpperCase() : undefined; },
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
        'Publisher' : function(data){ return data['publisher'] ? capitalize(data['publihser']) : undefined; },
        'PUBLISHER' : function(data){ return data['publisher'] ? data['publisher'].toUpperCase() : undefined; }
    };

    var capitalize = function(str){
        return str.length === 0 ? '' : str.charAt(0).toUpperCase() + str.slice(1);
    }

    BT.macros = {};

    BT.parse = function(str){
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
                var n = BT.parse(BT.macros[tk.token]);
                cNode.children.push(n);
                n.parent = cNode;
            }
            else if(tk.type === 'DATA'){
                cNode.children.push({ parent: cNode, conditional: false, data: tk.token, children: [] });
            }
            else if(tk.type === 'EOF'){
                break;
            }
            else{
                throw 'What happened?';
            }
        }

        if(cNode !== root){
            console.error('Mismatch');
        }

        return root;
    };

    BT.evaluate = function(root, data){
        if(typeof(root) === 'string'){
            return root; //FIXME
        }

        if(typeof(root.data) !== 'undefined'){
            var path = root.data.split('.');
            var x = dataGetter;

            for(var i = 0; i < path.length; ++i){
                x = x[ path[i] ];
                if(typeof(x) === 'undefined'){
                    return undefined;
                }
            }

            return x(data);
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
