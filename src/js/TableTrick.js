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
            const columnNumber = parseInt(TableTrick.getCell(quill).domNode.getAttribute('column'))
            let table = td.parent.parent;
            let table_id = table.domNode.getAttribute('table_id');
            table.children.forEach(function (tr) {
              let row_id = tr.domNode.getAttribute('row_id');
              let cell_id = TableTrick.random_id();
              let td = Parchment.create('td', table_id + '|' + row_id + '|' + cell_id +  '|' + columnNumber + '|white|1');
              const nextColumnBlot = tr.children.map(c=> {
                if (parseInt(c.domNode.getAttribute('column')) === (columnNumber+1)) {
                  return c
                }
              }).filter(c=>!!c)[0]
              if (nextColumnBlot) {
                tr.insertBefore(td, nextColumnBlot);
              } else {
                tr.appendChild(td);
              }
            });
            TableTrick.updateColumnNumbers(quill)
            quill.setSelection(index, length)
          }
        } else if (value === 'append-row') {
          let td = TableTrick.getSelectedTd(quill);
          if (td) {
            const { index, length } = quill.getSelection()
            const currentRow = td.parent
            const table = td.parent.parent;
            const newRow = Parchment.create('tr');
            const nextRow = td.parent.next
            const table_id = table.domNode.getAttribute('table_id');
            const row_id = TableTrick.random_id();
            const tdNodesInRow = Array.from(currentRow.domNode.children)
            newRow.domNode.setAttribute('row_id', row_id);
            tdNodesInRow.forEach((cell, i)=>{
                let cell_id = TableTrick.random_id();
                const colspan = cell.getAttribute('colspan')
                let td = Parchment.create('td', table_id + '|' + row_id + '|' + cell_id + '|' + i  + '|white|' + colspan);
                newRow.appendChild(td);
                let p = Parchment.create('block');
                td.appendChild(p);
                let br = Parchment.create('break');
                p.appendChild(br);
            })
            if (nextRow) {
              table.insertBefore(newRow, nextRow)
            } else {
              table.appendChild(newRow);
            }
            TableTrick.updateColumnNumbers(quill)
            quill.setSelection(index, length)
          }
        } else if (value === 'delete-col') {
          const cell = this.getCell(quill)
          const columnNumber = cell.domNode.getAttribute('column')
          const tableId = cell.domNode.getAttribute('table_id')
          const columnSelector = `td[table_id='${tableId}'][column='${columnNumber}']`
          const colCells = document.querySelectorAll(columnSelector)
          colCells.forEach(td => {
            // This handles reducing colspan of a merged cell only if delete
            // was fired on a cell STARTING at the same column as the merged cell
            // TODO it should also reduce colspan, when delete is fired on other cells
            // that are located under the merged one.
            const colspan = td.getAttribute('colspan')
            if (colspan>1) {
              td.setAttribute('colspan', colspan - 1)
            } else {
              td.remove()
            }
          })
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
          let firstElement = quill.getLeaf(index)[0].parent.parent;
          const firstElementId = firstElement.domNode.getAttribute('cell_id')
          const firstCellRow = firstElement.domNode.getAttribute('row_id')
          const cellsToRemoveMap = {}
          for (let i=0; i < length+1; i++) {
            const td = quill.getLeaf(index + i)[0].parent.parent;
            if (td instanceof TableCell) {
              const cellId = td.domNode.getAttribute('cell_id')
              const cellRow = td.domNode.getAttribute('row_id')
              if (cellId !== firstElementId && cellRow === firstCellRow) {
                cellsToRemoveMap[cellId] = td
              }
            }
          }
          const cellsToRemove = Object.values(cellsToRemoveMap)

          const totalColspan = [firstElement, ...cellsToRemove].map(td=>{
            return document.body.contains(td.domNode) ? parseInt((td.domNode.getAttribute('colspan'))) : 0
          }).reduce((a,b)=>a+b)

          const htmlToMerge = [firstElement, ...cellsToRemove].map(td=>{
            return document.body.contains(td.domNode) ? td.domNode.innerHTML : ''
          }).reduce((a,b)=>a+b)

          firstElement.domNode.setAttribute('colspan', `${totalColspan}`)
          firstElement.domNode.innerHTML = htmlToMerge
          cellsToRemove.forEach(cell => cell.remove())
          TableTrick.updateColumnNumbers(quill)
          quill.setSelection(index, length)
        } else if (value === 'border-outline') {
          let table = TableTrick.findTable(quill)
          const { index, length } = quill.getSelection()
          if (table) {
            this.resetGridBorders(table)
            table.domNode.classList.add('table-border-outline')
          }
          quill.setSelection(index+1, length)
        } else if (value === 'border-grid') {
          const { index, length } = quill.getSelection()
          let table = TableTrick.findTable(quill);
          if (table) {
            this.resetGridBorders(table)
          }
          quill.setSelection(index+1, length)
        } else if (value.startsWith('#')) {
          const { index, length } = quill.getSelection()
          const currentElement = TableTrick.getSelectedTd(quill)
          for (let i=0; i < length; i++) {
            const td = quill.getLeaf(index + i)[0].parent.parent
            if (td instanceof TableCell) {
              td.domNode.style.backgroundColor = value
              td.domNode.setAttribute('color', value)
            }
          }
          currentElement.domNode.style.backgroundColor = value
          currentElement.domNode.setAttribute('color', value)
          quill.setSelection(index+1, length)
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

