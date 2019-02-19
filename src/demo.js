import tableToolbar from "./js/tableToolbar";

window.Quill = require('quill');
const quillTable = require('./index.js');

Quill.register(quillTable.TableCell);
Quill.register(quillTable.TableRow);
Quill.register(quillTable.Table);
Quill.register(quillTable.Contain);
Quill.register('modules/table', quillTable.TableModule);

import 'quill/dist/quill.core.css';
import 'quill/dist/quill.snow.css';

const defaultToolbar = [
    [...quillTable.tableToolbar],
    ['bold', 'italic', 'underline', 'strike'],
    ['blockquote', 'code-block', 'image'],

    [{'list': 'ordered'}, {'list': 'bullet'}],

    [{'indent': '-1'}, {'indent': '+1'}],
    [{'header': [1, 2, 3, 4, 5, 6, false]}],

    [{'color': []}, {'background': []}],
    [{'font': []}],
    [{'align': []}],

    ['clean']
];
const Editor = new Quill(document.getElementById('quillContainer'), {
        modules: {
            toolbar: {
              container: defaultToolbar,
              handlers: {
                'table-border': () => {}, //This seems to be needed to be overwritten by modules table-border handler
                'table-color': () => {} //This seems to be needed to be overwritten by modules table-border handler
              }
            },
            table: true,
            tableResize: true
        },
        placeholder: '',
        theme: 'snow',
        readOnly: false,
    }
);

const button = document.createElement('button')
button.textContent = 'content'
button.onclick = () => console.log(Editor.getContents())
document.getElementById('quillContainer').parentElement.appendChild(button)
