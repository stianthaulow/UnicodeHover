const fs = require('fs');
const csstree = require('css-tree');

console.log('Generating UnicodeHover data file for Nerd Fonts codepoints');

const nerdFontsCssInputPath = '../nerd-fonts-generated.css';
const nerdFontsDataOutputPath = '../../src/nerd_fonts_data.json';

let nerdFontsData = fs.readFileSync(nerdFontsCssInputPath);
let ast = csstree.parse(nerdFontsData);

let codePoints = {};
codePoints["__comment"] = "Generated by /scripts/NerdFontGenerator"

let inRule = false;
let inBlock = false;
let inContentDeclaration = false;
let classSelectorName = '';
let codepoint = undefined; //string
let count = 0;

//For a sample of the AST we're walking, paste the CSS snippet below into
// https://astexplorer.net/#/gist/244e2fb4da940df52bf0f4b94277db44/e79aff44611020b22cfd9708f3a99ce09b7d67a8

/*
.nf-custom-c:before {
  content: "\e61e";
}
*/

csstree.walk(ast, {
    enter: function(node) {
        if (node.type === "StyleSheet"){
            return;
        }
        if (!inRule && node.type !== 'Rule'){
            return this.skip;
        }
        if (!inRule && node.type === 'Rule'){
            inRule = true;
            return;
        }
        if (node.type === 'ClassSelector' && node.name.startsWith('nf-')){
            classSelectorName = node.name;
            return;
        }
        if (node.type === "Block"){
            inBlock = true;
            return;
        }
        if (node.type === "Declaration" && node.property === 'content'){
            inContentDeclaration = true;
            return;
        }
        if (inContentDeclaration && node.type === "String"){
            codepoint = node.value;
            return;
        }
    },
    leave: function(node){
        if (inRule && node.type === "Rule" && classSelectorName !== ''){
            codePoints[codepoint?.replace("\"\\", "").replace("\"", "").toUpperCase()] = classSelectorName;
            count++;
            inRule = false;
            classSelectorName = '';
            inContentDeclaration = false;
            inBlock = false;
            codepoint = undefined;
        }
        if (inContentDeclaration && node.type === "Declaration" && node.property === 'content'){
            inContentDeclaration = false;
        }
        if (inBlock && node.type === "Block"){
            inBlock = false;
        }
    }
});

fs.writeFileSync(nerdFontsDataOutputPath, JSON.stringify(codePoints, null, 2));

console.log('Wrote name and codepoint data for ' + count + ' Nerd Font codepoints to ' + nerdFontsDataOutputPath);
