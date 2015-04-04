(function(BT){
    var special = {
        '[' : 'BEGIN_COND',
        '|' : 'NEXT_COND',
        ']' : 'END_COND',
        '@' : 'DATA',
        '#' : 'MACRO',
    };

    BT.Stream = function(str){
        this.text = str;
        this.index = -1;
    };

    BT.Stream.prototype = {
        next: function(){
            var output = '';
            var ch = '';
            var chType;

            do{
                output += ch;

                if(ch === '@' || ch === '#') break;

                ++this.index;
                ch = this.text[this.index];
                chType = special[ch];
            } while(typeof(chType) === 'undefined' && this.index < this.text.length);

            if(this.index >= this.text.length){
                if(output.length > 0){
                    return {  type: 'TEXT', token: output };
                }
                return { type: 'EOF', token: '' };
            }
            else if(output.length === 0){
                if(ch === '@'){
                    //we expect a '{'
                    ch = this.text[++this.index];
                    if(ch !== '{'){
                        console.error('Expected "{" following "@"');
                        this.index = this.text.length;
                        return { type: 'EOF', token: '' };
                    }

                    output = '';
                    ch = this.text[++this.index];
                    while(ch !== '}'){
                        output += ch;
                        ch = this.text[++this.index];
                    }

                    //FIXME error catching

                    return { type: 'DATA', token: output };
                }
                else if(ch === '#'){
                    while(++this.index < this.text.length && this.text[this.index].match(/[a-zA-Z0-9]+/) !== null){
                        output += this.text[this.index];
                    }
                    
                    if(this.index >= this.text.length){
                        return { type: 'MACRO', token: output };
                    }

                    if(this.text[this.index] === ':'){
                        return { type: 'DEF', token: output };
                    }

                    --this.index;
                    return { type: 'MACRO', token: output };
                }
                else{
                    return { type: special[ch], token: ch };
                }
            }
            else{
                --this.index;
                return { type: 'TEXT', token: output };
            }
        }
    };
})(window.BiblioTeX = window.BiblioTeX || {});
