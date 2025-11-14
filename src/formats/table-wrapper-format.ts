import type { Parchment as TypeParchment } from 'quill';
import Quill from 'quill';
import { blotName } from '../utils';
import { ContainerFormat } from './container-format';
import { TableBodyFormat } from './table-body-format';
import { TableColgroupFormat } from './table-colgroup-format';

const Parchment = Quill.import('parchment');

export class TableWrapperFormat extends ContainerFormat {
  static blotName = blotName.tableWrapper;
  static tagName = 'div';
  static className = 'ql-table-wrapper';
  static allowDataAttrs = new Set(['table-id', 'extends']);

  static create(value: string | { tableId: string; extends?: string }) {
    const node = super.create() as HTMLElement;
    const tableId = typeof value === 'string' ? value : value.tableId;
    const extendsValue = typeof value === 'object' ? value.extends : undefined;

    node.dataset.tableId = tableId;
    if (extendsValue) {
      node.dataset.extends = extendsValue;
    }
    node.addEventListener(
      'dragstart',
      (e) => {
        e.preventDefault();
        e.stopPropagation();
      },
      true,
    );
    // not allow drop content into table
    node.addEventListener('drop', (e) => {
      e.preventDefault();
    });
    node.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer!.dropEffect = 'none';
    });
    node.setAttribute('contenteditable', 'false');
    return node;
  }

  // quill scroll doesn't extends EventEmitter ts type. `on` and `off` will have dts error
  constructor(public scroll: any, node: Node, _value: string) {
    super(scroll, node);
    this.scroll.emitter.on(Quill.events.TEXT_CHANGE, this.insertLineAround);
  }

  get tableId() {
    return this.domNode.dataset.tableId!;
  }

  get extendsAttr() {
    return this.domNode.dataset.extends;
  }

  set extendsAttr(value: string | object | undefined | null) {
    if (value === undefined || value === null || value === '') {
      this.domNode.removeAttribute('data-extends');
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
      this.domNode.dataset.extends = stringValue;
    }
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
      if (name === 'extends') {
        this.extendsAttr = value as string | object | undefined | null;
      }
    }
  }

  checkMerge(): boolean {
    const next = this.next as TableWrapperFormat;
    return (
      next !== null
      && next.statics.blotName === this.statics.blotName
      && next.tableId === this.tableId
    );
  }

  deleteAt(index: number, length: number) {
    super.deleteAt(index, length);
    const tableBodys = this.descendants(TableBodyFormat);
    const tableColgroups = this.descendants(TableColgroupFormat);
    if (tableBodys.length === 0 || tableColgroups.length === 0) {
      this.remove();
    }
  }

  remove() {
    super.remove();
    this.scroll.emitter.off(Quill.events.TEXT_CHANGE, this.insertLineAround);
  }

  isBlockLine(blot: TypeParchment.Blot) {
    return blot instanceof Parchment.BlockBlot || new Set(['list-container', 'code-block-container']).has(blot.statics.blotName);
  }

  insertLineAround = () => {
    if (!this.prev || !this.isBlockLine(this.prev)) {
      this.parent.insertBefore(this.scroll.create('block'), this);
    }
    if (!this.next || !this.isBlockLine(this.next)) {
      this.parent.insertBefore(this.scroll.create('block'), this.next);
    }
  };
}
