import Quill from 'quill';
import ContainBlot from './ContainBlot';

let Container = Quill.import('blots/container');
let Block = Quill.import('blots/block');
let BlockEmbed = Quill.import('blots/block/embed');
let Parchment = Quill.import('parchment');

class TableCell extends ContainBlot {

    static create(value) {
        let tagName = 'td';
        let node = super.create(tagName);
        let ids = value.split('|');
        node.setAttribute('table_id', ids[0]);
        node.setAttribute('row_id', ids[1]);
        node.setAttribute('cell_id', ids[2]);
        node.setAttribute('column', ids[3]);
        if (ids[4]) {
          node.setAttribute('color', ids[4]);
          node.setAttribute('style', `background-color: ${ids[4]}`);
          node.style.backgroundColor = value
        }
        if (ids[5]) {
          node.setAttribute('colspan', ids[5]);
        } else {
          node.setAttribute('colspan', 1);
        }
        return node;
    }

    format() {
        this.getAttribute('id');
    }

    formats() {
        // We don't inherit from FormatBlot
        return {
            [this.statics.blotName]:
            this.domNode.getAttribute('table_id') + '|' +
            this.domNode.getAttribute('row_id') + '|' +
            this.domNode.getAttribute('cell_id') + '|' +
            this.domNode.getAttribute('column') + '|' +
            this.domNode.getAttribute('color') + '|' +
            this.domNode.getAttribute('colspan')
        }
    }

    optimize(context) {
        super.optimize(context);

        let parent = this.parent;
        if (parent != null) {
            if (parent.statics.blotName === 'td') {
                this.moveChildren(parent, this);
                this.remove();
                return;
            } else if (parent.statics.blotName != 'tr') {
                // we will mark td position, put in table and replace mark
                let mark = Parchment.create('block');
                this.parent.insertBefore(mark, this.next);
                let table = Parchment.create('table', this.domNode.getAttribute('table_id'));
                let tr = Parchment.create('tr', this.domNode.getAttribute('row_id'));
                table.appendChild(tr);
                tr.appendChild(this);
                table.replace(mark);
            }
        }

        // merge same TD id
        let next = this.next;
        if (next != null && next.prev === this &&
            next.statics.blotName === this.statics.blotName &&
            next.domNode.tagName === this.domNode.tagName &&
            next.domNode.getAttribute('cell_id') === this.domNode.getAttribute('cell_id')) {
            next.moveChildren(this);
            next.remove();
        }
    }

    insertBefore(childBlot, refBlot) {
        if (this.statics.allowedChildren != null && !this.statics.allowedChildren.some(function (child) {
                return childBlot instanceof child;
            })) {
            let newChild = Parchment.create(this.statics.defaultChild);
            newChild.appendChild(childBlot);
            childBlot = newChild;
        }
        super.insertBefore(childBlot, refBlot)
    }

    replace(target) {
        if (target.statics.blotName !== this.statics.blotName) {
            let item = Parchment.create(this.statics.defaultChild);
            target.moveChildren(item);
            this.appendChild(item);
        }
        if (target.parent == null) return;
        super.replace(target)
    }

    moveChildren(targetParent, refNode) {
        this.children.forEach(function (child) {
            targetParent.insertBefore(child, refNode);
        });
    }
}

TableCell.blotName = 'td';
TableCell.tagName = 'td';
TableCell.scope = Parchment.Scope.BLOCK_BLOT;
TableCell.defaultChild = 'block';
TableCell.allowedChildren = [Block, BlockEmbed, Container];

export default TableCell;
