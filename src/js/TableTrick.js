import Quill from 'quill';
import TableCell from "./TableCellBlot";

let Parchment = Quill.import('parchment');
let Container = Quill.import('blots/container');
let Scroll = Quill.import('blots/scroll');

export default class TableTrick {
    static random_id() {
        return Math.random().toString(36).slice(2)
    }

    static getSelectedTd(quill) {
      const selection = quill.getSelection()
      if (!selection) {
        return null
      }
        let leaf = quill.getLeaf(quill.getSelection()['index']);
        let blot = leaf[0];
        for (; blot != null && blot.statics.blotName != 'td';) {
            blot = blot.parent;
        }
        return blot; // return TD or NULL
    }

    static getContainingTable(td) {
      return td && td.parent && td.parent.parent;
    }

    static findTable(quill) {
      const cell = TableTrick.getSelectedTd(quill);
      if (cell) {
        return TableTrick.getContainingTable(cell)
      }
      return null
    }

    static updateColumnNumbers(quill) {
      const table = TableTrick.findTable(quill)
      const rows = table.domNode.querySelectorAll(`tr`)
      rows.forEach(row => {
        const cells = row.querySelectorAll('td')
        cells.forEach((cell, i) => cell.setAttribute('column', i+1))
      })
    }

    static resetGridBorders(table) {
      if (table) {
        table.domNode.classList.remove('table-border-outline')
        table.domNode.classList.remove('table-border-none')
      }
    }

    static getCell(quill) {
      const range = quill.getSelection()
      if (range == null) return null;
      const [cell, offset] = quill.getLine(range.index);
      return cell.parent;
    }

    static table_handler(value, quill) {
        if (value.includes('newtable_')) {
            let node = null;
            let sizes = value.split('_');
            let row_count = Number.parseInt(sizes[1]);
            let col_count = Number.parseInt(sizes[2]);
            let table_id = TableTrick.random_id();
            let table = Parchment.create('table', table_id)
            for (var ri = 0; ri < row_count; ri++) {
                let row_id = TableTrick.random_id();
                let tr = Parchment.create('tr', row_id);
                table.appendChild(tr);
                for (var ci = 0; ci < col_count; ci++) {
                    let cell_id = TableTrick.random_id();
                    const colspan = 1
                    const color = 'white'
                    const value = table_id + '|' + row_id + '|' + cell_id + '|' + (ci+1) + '|' + color + '|' + colspan;
                    let td = Parchment.create('td', value);
                    tr.appendChild(td);
                    let p = Parchment.create('block');
                    td.appendChild(p);
                    let br = Parchment.create('break');
                    p.appendChild(br);
                    node = p;
                }
            }
            let leaf = quill.getLeaf(quill.getSelection()['index']);
            let blot = leaf[0];
            let top_branch = null;
            for (; blot != null && !(blot instanceof Container || blot instanceof Scroll);) {
                top_branch = blot;
                blot = blot.parent;
            }
            blot.insertBefore(table, top_branch);
            return node;
        } else if (value === 'append-col') {
          let td = TableTrick.getSelectedTd(quill);
          const { index, length } = quill.getSelection()

          if (td) {
                const number = TableTrick.getCell(quill).domNode.getAttribute('column')
                let table = td.parent.parent;
                let table_id = table.domNode.getAttribute('table_id');
                table.children.forEach(function (tr) {
                  let row_id = tr.domNode.getAttribute('row_id');
                  let cell_id = TableTrick.random_id();
                  let td = Parchment.create('td', table_id + '|' + row_id + '|' + cell_id +  '|' + number + 1 + '|white|' + 1);
                  tr.insertBefore(td, tr.children.find(number)[0]);
                });
            }
          TableTrick.updateColumnNumbers(quill)
          quill.setSelection(index, length)

        } else if (value === 'append-row') {
            let td = TableTrick.getSelectedTd(quill);
            if (td) {
                let col_count = td.parent.children.length;
                let table = td.parent.parent;
                let new_row = td.parent.clone();
                let table_id = table.domNode.getAttribute('table_id');
                let row_id = TableTrick.random_id();
                new_row.domNode.setAttribute('row_id', row_id);
                for (let i = 1 ; i <= col_count; i++) {
                    let cell_id = TableTrick.random_id();
                    let td = Parchment.create('td', table_id + '|' + row_id + '|' + cell_id + '|' + i  + '|' + 'white');
                    new_row.appendChild(td);
                    let p = Parchment.create('block');
                    td.appendChild(p);
                    let br = Parchment.create('break');
                    p.appendChild(br);
                }
                table.appendChild(new_row);
            }
        } else if (value === 'delete-col') {
          const cell = this.getCell(quill)
          const columnNumber = cell.domNode.getAttribute('column')
          const tableId = cell.domNode.getAttribute('table_id')
          const columnSelector = `td[table_id='${tableId}'][column='${columnNumber}']`
          const colCells = document.querySelectorAll(columnSelector)
          colCells.forEach(td => td.remove())
          TableTrick.updateColumnNumbers(quill)
        } else if (value === 'delete-row') {
          const cell = this.getCell(quill)
          cell.parent.domNode.remove()
        } else if (value === 'border-none') {
          let table = TableTrick.findTable(quill)
          if (table) {
            this.resetGridBorders(table)
            table.domNode.classList.add('table-border-none')
          }
        } else if (value === 'merge') {


          const { index, length } = quill.getSelection()
          let firstElement = quill.getLeaf(index)[0].parent.parent.domNode;
          const firstElementId = firstElement.getAttribute('cell_id')
          const firstCellRow = firstElement.getAttribute('row_id')
          const cellsToRemoveMap = {}
          for (let i=0; i < length+1; i++) {
            const td = quill.getLeaf(index + i)[0].parent.parent;
            if (td instanceof TableCell) {
              const cellId = td.domNode.getAttribute('cell_id')
              const cellRow = td.domNode.getAttribute('row_id')
              if (cellId !== firstElementId && cellRow === firstCellRow) {
                cellsToRemoveMap[cellId] = td.domNode
              }
            }
          }
          const cellsToRemove = Object.values(cellsToRemoveMap)
          const colspans = [firstElement, ...cellsToRemove].map(td=>{
            return document.body.contains(td) ? parseInt((td.getAttribute('colspan'))) : 0
          })
          const totalColspan = colspans.reduce((a,b)=>a+b)
          const colspan = cellsToRemove.length + parseInt(firstElement.getAttribute('colspan'))
          firstElement.setAttribute('colspan', `${totalColspan}`)
          cellsToRemove.forEach(cell => cell.remove())

          TableTrick.updateColumnNumbers(quill)
          quill.setSelection(index, length)

        } else if (value === 'border-outline') {
          let table = TableTrick.findTable(quill)
          if (table) {
            this.resetGridBorders(table)
            table.domNode.classList.add('table-border-outline')
          }
        } else if (value === 'border-grid') {
          let table = TableTrick.findTable(quill);
          if (table) {
           this.resetGridBorders(table)
          }
        } else if (value.startsWith('#')) {
          const currentElement = TableTrick.getSelectedTd(quill)
          const { index, length } = quill.getSelection()
          for (let i=0; i < length; i++) {
            const td = quill.getLeaf(index + i)[0].parent.parent
            if (td instanceof TableCell) {
              td.domNode.style.backgroundColor = value
              td.domNode.setAttribute('color', value)
            }
          }
          currentElement.domNode.style.backgroundColor = value
        } else {
            let table_id = TableTrick.random_id();
            let table = Parchment.create('table', table_id);

            let leaf = quill.getLeaf(quill.getSelection()['index']);
            let blot = leaf[0];
            let top_branch = null;
            for (; blot != null && !(blot instanceof Container || blot instanceof Scroll);) {
                top_branch = blot;
                blot = blot.parent;
            }
            blot.insertBefore(table, top_branch);
            return table;
        }
    }
}

