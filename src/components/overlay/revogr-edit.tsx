import {Component, Event, EventEmitter, Prop, h, VNode, Element} from '@stencil/core';

import {Edition, RevoGrid} from '../../interfaces';
import {TextEditor} from './editors/text';

@Component({
    tag: 'revogr-edit'
})
export class Edit {
    @Element() element: HTMLElement;
    @Prop() editCell: Edition.EditCell;
    private currentEditor: Edition.EditorBase|null = null;

    @Prop() column: RevoGrid.ColumnDataSchemaRegular|null;
    /**
     * Custom editors register
     */
    @Prop() editor: Edition.EditorCtr|null;

    @Event({ cancelable: true }) cellEdit: EventEmitter<Edition.SaveDataDetails>;
    @Event() closeEdit: EventEmitter;
    onSave(e: Edition.SaveData): void {
        if (this.editCell) {
            this.cellEdit.emit({
                col: this.editCell.x,
                row: this.editCell.y,
                val: e
            });
        }
        setTimeout(() => this.closeEdit.emit(), 0);
    }

    componentWillRender(): void {
        if (!this.currentEditor) {
            if (this.editor) {
                this.currentEditor = new this.editor(this.column, (e) => this.onSave(e));
            } else {
                this.currentEditor = new TextEditor(this.column, (e) => this.onSave(e));
            }
        }
    }

    componentDidRender(): void {
        if (!this.currentEditor) {
            return;
        }
        this.currentEditor.element = this.element.firstElementChild;
        this.currentEditor.componentDidRender && this.currentEditor.componentDidRender();
    }

    disconnectedCallback(): void {
        if (!this.currentEditor) {
            return;
        }

        this.currentEditor.disconnectedCallback && this.currentEditor.disconnectedCallback();
        this.currentEditor.element = null;
        this.currentEditor = null;
    }

    render() {
        if (this.currentEditor) {
            this.currentEditor.editCell = this.editCell;
            return this.currentEditor.render(h as unknown as RevoGrid.HyperFunc<VNode>);
        }
        return '';
    }
}