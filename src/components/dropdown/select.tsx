import { Component, h } from "@stencil/core";
import { ObservableMap } from "@stencil/store";
import { RevoGrid } from "../../interfaces";
import DataStore, { DataSourceState } from "../../store/dataSource/data.store";
import DimensionStore from "../../store/dimension/dimension.store";
import ViewportStore from "../../store/viewPort/viewport.store";
import { ElementScroll } from "../viewport/gridScrollingService";

@Component({
  tag: 'revo-select',
  styleUrl: 'select-style.scss'
})
export class RevoSelect {
	private el: ElementScroll;
	private viewportRow: ViewportStore;
	private viewportCol: ViewportStore;
	private dimensionStore: DimensionStore;

	connectedCallback(): void {
		this.dimensionStore = new DimensionStore();
		this.dimensionStore.setStore({
			originItemSize: 30
		});
		this.viewportCol = new ViewportStore();
    this.viewportCol.setViewport({
      realCount: 1,
      virtualSize: 200,
      items: [{ size: 0, start: 0, end: 0, itemIndex: 0 }]
		});

		this.viewportRow = new ViewportStore();
	}
	render() {
		console.log('re');
		const itemCount = 100;

		this.dimensionStore.setRealSize(itemCount);
		this.dimensionStore.setDimensionSize({});
		

    this.viewportRow.setViewport({
      realCount: itemCount,
      virtualSize: 200
		});

		// this.viewportRow.setViewPortCoordinate(0, this.dimensionStore.getCurrentState());
		
		const colData = [{
			cellTemplate: (_h: Function, e: {rowIndex: number}) => {
				return e.rowIndex;
			}
		}];
		const type: RevoGrid.DimensionRows = 'row';
		const dataStoreService: DataStore<RevoGrid.DataType, RevoGrid.DimensionRows> = new DataStore<RevoGrid.DataType, RevoGrid.DimensionRows>(type);
		dataStoreService.setData({
			items: [{}]
		});
		const dimslice = this.dimensionStore.getCurrentState();
		const dataStore: ObservableMap<DataSourceState<RevoGrid.DataType, RevoGrid.DimensionRows>> = dataStoreService.store;
		return <revogr-viewport-scroll
			contentHeight={dimslice.realSize}
			contentWidth={0}
			style={{minWidth: '200px'}}
			ref={e => this.el = e}
      onScrollViewport={e => {
				e.cancelBubble = true;
				e.stopPropagation();
				if (e.detail.dimension === 'row') {
					this.el.setScroll(e.detail);
					this.viewportRow.setViewPortCoordinate(e.detail.coordinate, dimslice);
				}
			}}>
				<revogr-data
						slot='content'
						colData={colData}
						dataStore={dataStore}
						viewportCol={this.viewportCol.store}
						viewportRow={this.viewportRow.store}
						readonly={true}
						range={false}/>
	</revogr-viewport-scroll>;
	}
}
