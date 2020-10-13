import {RevoGrid} from "../../interfaces";

export interface ElementScroll {
    setScroll(e: RevoGrid.ViewPortScrollEvent): Promise<void>;
}
export default class GridScrollingService {
    private elements: ElementScroll[] = [];
    constructor(private setViewport?: (e: RevoGrid.ViewPortScrollEvent) => void) {}

    onScroll(e: RevoGrid.ViewPortScrollEvent, key?: RevoGrid.DimensionColPin|string): void {
        if (this.isPinnedColumn(key) && e.dimension === 'col') {
            return;
        }
        this.setViewport && this.setViewport(e);
        for (let el of this.elements) {
            el?.setScroll(e);
        }
    }

    private isPinnedColumn(key?: RevoGrid.DimensionColPin|string): key is RevoGrid.DimensionColPin {
        return ['colPinStart', 'colPinEnd'].indexOf(key) > -1;
    }

    registerElements(els: ElementScroll[]): void {
        this.elements = els;
    }
}
