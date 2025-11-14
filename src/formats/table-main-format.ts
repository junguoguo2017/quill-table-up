import type TypeScroll from 'quill/blots/scroll';
import type { TableValue } from '../utils';
import { blotName, tableUpSize } from '../utils';
import { ContainerFormat } from './container-format';
import { TableCellInnerFormat } from './table-cell-inner-format';
import { TableColFormat } from './table-col-format';
import { TableRowFormat } from './table-row-format';

export class TableMainFormat extends ContainerFormat {
  static blotName = blotName.tableMain;
  static tagName = 'table';
  static className = 'ql-table';
  static allowDataAttrs = new Set(['table-id', 'full', 'align', 'extends']);
  static allowDataAttrsChangeHandler: Record<string, keyof TableMainFormat> = {
    align: 'updateAlign',
    full: 'colWidthFillTable',
    extends: 'handleExtendsAttrChange',
  };

  static create(value: TableValue) {
    const node = super.create() as HTMLElement;
    const { tableId, full, align, extends: extendsValue } = value;
    node.dataset.tableId = tableId;
    if (align === 'right' || align === 'center') {
      node.dataset.align = align;
    }
    else {
      node.removeAttribute('date-align');
    }
    full && (node.dataset.full = String(full));
    if (extendsValue !== undefined && extendsValue !== null && extendsValue !== false) {
      let stringValue: string;
      if (typeof extendsValue === 'object') {
        try {
          stringValue = JSON.stringify(extendsValue);
        }
        catch {
          stringValue = String(extendsValue);
        }
      }
      else if (typeof extendsValue === 'string') {
        stringValue = extendsValue.trim();
      }
      else {
        stringValue = String(extendsValue);
      }
      if (stringValue) {
        node.dataset.extends = stringValue;
      }
    }
    node.setAttribute('cellpadding', '0');
    node.setAttribute('cellspacing', '0');
    return node;
  }

  static formats(domNode: HTMLElement): TableValue {
    const { tableId } = domNode.dataset;
    const value: TableValue = {
      tableId: String(tableId),
    };
    if (Object.hasOwn(domNode.dataset, 'full')) {
      value.full = true;
    }
    const align = domNode.dataset.align;
    if (align === 'right' || align === 'center') {
      value.align = align;
    }
    const extendsValue = domNode.dataset.extends;
    if (extendsValue) {
      value.extends = extendsValue;
    }
    return value;
  }

  constructor(public scroll: TypeScroll, domNode: HTMLElement, _value: unknown) {
    super(scroll, domNode);
    this.updateAlign();
  }

  get extendsAttr() {
    return this.domNode.dataset.extends;
  }

  set extendsAttr(value: string | boolean | object | undefined | null) {
    if (value === undefined || value === null || value === false) {
      this.domNode.removeAttribute('data-extends');
      return;
    }
    let stringValue: string;
    if (typeof value === 'object') {
      try {
        stringValue = JSON.stringify(value);
      }
      catch {
        stringValue = String(value);
      }
    }
    else if (typeof value === 'string') {
      stringValue = value.trim();
    }
    else {
      stringValue = String(value);
    }
    if (stringValue) {
      this.domNode.dataset.extends = stringValue;
    }
    else {
      this.domNode.removeAttribute('data-extends');
    }
  }

  handleExtendsAttrChange(value: unknown) {
    this.extendsAttr = value as string | boolean | object | undefined | null;
  }

  setFormatValue(name: string, value?: unknown) {
    if (this.statics.allowDataAttrs.has(name)) {
      const attrName = `data-${name}`;
      if (value === undefined || value === null || value === false || value === '') {
        this.domNode.removeAttribute(attrName);
      }
      else {
        let stringValue: string;
        if (typeof value === 'object') {
          try {
            stringValue = JSON.stringify(value);
          }
          catch {
            stringValue = String(value);
          }
        }
        else {
          stringValue = String(value);
        }
        this.domNode.setAttribute(attrName, stringValue);
      }
      const handlerName = this.statics.allowDataAttrsChangeHandler[name];
      if (handlerName && typeof (this as any)[handlerName] === 'function') {
        (this as any)[handlerName](value);
      }
    }
  }

  colWidthFillTable() {
    if (this.full) {
      Object.assign(this.domNode.style, { width: null });
      return;
    }
    const cols = this.getCols();
    if (!cols) return;
    const colsWidth = cols.reduce((sum, col) => col.width + sum, 0);
    if (colsWidth === 0 || Number.isNaN(colsWidth)) return;
    this.domNode.style.width = `${colsWidth}px`;
    return colsWidth;
  }

  get tableId() {
    return this.domNode.dataset.tableId!;
  }

  get full() {
    return Object.hasOwn(this.domNode.dataset, 'full');
  }

  set full(value: boolean) {
    if (value) {
      this.domNode.dataset.full = String(true);
    }
    else {
      this.domNode.removeAttribute('data-full');
    }
    this.colWidthFillTable();
  }

  get align() {
    return this.domNode.dataset.align || '';
  }

  set align(value: string) {
    if (value === 'right' || value === 'center') {
      this.domNode.dataset.align = value;
    }
    else {
      this.domNode.removeAttribute('data-align');
    }
    this.updateAlign();
  }

  setFull() {
    if (this.full) return;
    const cols = this.getCols();
    if (cols.length === 0) return;
    const tableWidth = Math.floor(this.domNode.getBoundingClientRect().width);
    for (const col of cols) {
      const value = col.width / tableWidth * 100;
      col.full = true;
      col.width = value;
    }
  }

  cancelFull() {
    if (!this.full) return;
    const cols = this.getCols();
    if (cols.length === 0) return;
    const tableWidth = Math.floor(this.domNode.getBoundingClientRect().width);
    for (const col of cols) {
      col.full = false;
      col.width = Math.max(col.width / 100 * tableWidth, tableUpSize.colMinWidthPx);
    }
  }

  updateAlign() {
    const value = this.align;
    const style: Record<string, string | null> = {
      marginLeft: null,
      marginRight: null,
    };
    switch (value) {
      case 'center': {
        style.marginLeft = 'auto';
        style.marginRight = 'auto';
        break;
      }
      case '':
      case 'left': {
        style.marginRight = 'auto';
        break;
      }
      case 'right': {
        style.marginLeft = 'auto';
        break;
      }
      default: {
        break;
      }
    }
    Object.assign(this.domNode.style, style);
  }

  getRows() {
    return Array.from(this.domNode.querySelectorAll(`${TableRowFormat.tagName}`))
      .map(el => this.scroll.find(el) as TableRowFormat)
      .filter(Boolean);
  }

  getRowIds() {
    return this.getRows().map(d => d.rowId);
  }

  getCols() {
    return this.descendants(TableColFormat);
  }

  getColIds() {
    return this.getCols().map(d => d.colId);
  }

  checkMerge(): boolean {
    const next = this.next;
    return (
      next !== null
      && next.statics.blotName === this.statics.blotName
      && next.domNode.dataset.tableId === this.tableId
    );
  }

  syncExtendsFromCols() {
    // 从第一个 col 中读取 extends 对象（所有 col 应该有相同的 extends）
    const cols = this.getCols();
    if (cols.length === 0) return;
    
    const firstCol = cols[0];
    const colValue = TableColFormat.value(firstCol.domNode);
    const extendsObj = colValue.extends;
    
    if (extendsObj && typeof extendsObj === 'object') {
      let needUpdate = false;
      
      // 检查 table 的 DOM 是否需要更新
      for (const [key, val] of Object.entries(extendsObj)) {
        const attrName = `data-${key}`;
        const currentValue = this.domNode.getAttribute(attrName);
        const expectedValue = val === undefined || val === null || val === '' 
          ? null 
          : (typeof val === 'object' ? JSON.stringify(val) : String(val));
        
        if (currentValue !== expectedValue) {
          needUpdate = true;
          break;
        }
      }
      
      // 只在需要更新时才修改 DOM，避免触发 optimize 循环
      if (needUpdate) {
        for (const [key, val] of Object.entries(extendsObj)) {
          const attrName = `data-${key}`;
          if (val === undefined || val === null || val === '') {
            this.domNode.removeAttribute(attrName);
          }
          else {
            const stringValue = typeof val === 'object' ? JSON.stringify(val) : String(val);
            this.domNode.setAttribute(attrName, stringValue);
          }
        }
      }
      
      // 同步到 wrapper 的 DOM
      try {
        const wrapper = this.parent;
        if (wrapper && wrapper.statics.blotName === blotName.tableWrapper) {
          let wrapperNeedUpdate = false;
          for (const [key, val] of Object.entries(extendsObj)) {
            const attrName = `data-${key}`;
            const currentValue = wrapper.domNode.getAttribute(attrName);
            const expectedValue = val === undefined || val === null || val === '' 
              ? null 
              : (typeof val === 'object' ? JSON.stringify(val) : String(val));
            
            if (currentValue !== expectedValue) {
              wrapperNeedUpdate = true;
              break;
            }
          }
          
          if (wrapperNeedUpdate) {
            for (const [key, val] of Object.entries(extendsObj)) {
              const attrName = `data-${key}`;
              if (val === undefined || val === null || val === '') {
                wrapper.domNode.removeAttribute(attrName);
              }
              else {
                const stringValue = typeof val === 'object' ? JSON.stringify(val) : String(val);
                wrapper.domNode.setAttribute(attrName, stringValue);
              }
            }
          }
        }
      }
      catch {
        // wrapper 不存在时忽略
      }
    }
  }

  optimize(context: Record<string, any>) {
    const parent = this.parent;
    if (parent !== null && parent.statics.blotName !== blotName.tableWrapper) {
      this.wrap(blotName.tableWrapper, this.tableId);
    }

    super.optimize(context);
    this.mergeRow();
    // 延迟同步 extends 属性到 table 和 wrapper，避免在 optimize 过程中触发循环
    setTimeout(() => {
      try {
        this.syncExtendsFromCols();
      }
      catch {
        // 忽略错误
      }
    }, 0);
  }

  // ensure row id unique in same table
  mergeRow() {
    if (!this.parent) return;
    const rows = this.getRows();
    const rowGroup: Record<string, TableRowFormat[]> = {};
    for (const row of rows) {
      if (!rowGroup[row.rowId]) rowGroup[row.rowId] = [];
      rowGroup[row.rowId].push(row);
    }

    for (const rowList of Object.values(rowGroup)) {
      for (let i = 1; i < rowList.length; i++) {
        const row = rowList[i];
        row.moveChildren(rowList[0]);
        row.remove();
      }
    }
  }

  checkEmptyCol(autoMerge: boolean) {
    if (autoMerge) {
      const rowCount = this.getRows().length;
      const cols = this.getCols();
      const cells = this.descendants(TableCellInnerFormat);
      for (const cell of cells) {
        if (cell.colspan > 1 && cell.rowspan >= rowCount) {
          const index = cols.findIndex(col => col.colId === cell.colId);
          const currentCol = cols[index];
          for (let i = index + 1; i < index + cell.colspan; i++) {
            cols[i].remove();
            currentCol.width += cols[i].width;
          }
          cell.colspan = 1;
        }
      }
    }
  }

  checkEmptyRow(autoMerge: boolean) {
    const rows = this.getRows();
    const rowIds = new Set(rows.map(row => row.rowId));
    for (let i = rows.length - 1; i >= 0; i--) {
      const row = rows[i];
      if (autoMerge) {
        // reduce rowspan previou row
        if (row.children.length === 0) {
          for (let gap = 1, j = i - 1; j >= 0; j--, gap++) {
            const prev = rows[j];
            prev.foreachCellInner((cell) => {
              if (cell.rowspan > gap) {
                cell.rowspan -= 1;
                const emptyRow = new Set(cell.emptyRow);
                emptyRow.delete(row.rowId);
                cell.emptyRow = Array.from(emptyRow);
              }
            });
          }
          row.remove();
        }
      }
      else {
        if (row.children.length === 0 && row.prev) {
          // find the not empty row
          let prev: TableRowFormat = row.prev as TableRowFormat;
          while (prev && prev.children.length === 0) {
            prev = prev.prev as TableRowFormat;
          }
          prev.foreachCellInner((cell) => {
            const emptyRowIds = new Set(cell.emptyRow);
            // prevent order change. like currnet emptyRow ['1', '2'] add rowId '2' will be ['2', '1']
            if (!emptyRowIds.has(row.rowId)) {
              // the loop is from back to front, and the rowId should be added to the head
              cell.emptyRow = [row.rowId, ...emptyRowIds];
            }
          });
        }
        row.foreachCellInner((cell) => {
          for (const emptyRow of cell.emptyRow) {
            if (!rowIds.has(emptyRow)) {
              row.parent.insertBefore(this.scroll.create(blotName.tableRow, { tableId: this.tableId, rowId: emptyRow }), row.next);
            }
          }
        });
      }
    }
  }

  sortMergeChildren() {
    // move same type children to the first child
    const childs: Record<string, ContainerFormat[]> = {
      [blotName.tableCaption]: [],
      [blotName.tableColgroup]: [],
      [blotName.tableBody]: [],
    };
    // eslint-disable-next-line unicorn/no-array-for-each
    this.children.forEach((child) => {
      if (childs[child.statics.blotName]) {
        childs[child.statics.blotName].push(child as ContainerFormat);
      }
    });
    for (const formats of Object.values(childs)) {
      for (let i = 1; i < formats.length; i++) {
        formats[i].moveChildren(formats[0]);
      }
    }

    // check sort child
    const tableCaption = childs[blotName.tableCaption][0];
    const tableColgroup = childs[blotName.tableColgroup][0];
    const tableBody = childs[blotName.tableBody][0];

    const isCaptionFirst = tableCaption && this.children.head !== tableCaption;
    const isColgroupSecond = tableColgroup && tableCaption && tableCaption.next !== tableColgroup;
    const isColgroupFirst = tableColgroup && !tableCaption && this.children.head !== tableColgroup;
    const isBodyLast = tableBody && this.children.tail !== tableBody;

    // sort child
    if (isCaptionFirst || isColgroupSecond || isColgroupFirst || isBodyLast) {
      const tableMain = this.clone() as TableMainFormat;
      tableCaption && tableMain.appendChild(tableCaption);
      tableColgroup && tableMain.appendChild(tableColgroup);
      tableBody && tableMain.appendChild(tableBody);

      // eslint-disable-next-line unicorn/no-array-for-each
      this.children.forEach(child => child.remove());
      tableMain.moveChildren(this);
    }
  }
}
