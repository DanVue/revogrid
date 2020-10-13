import {Component, Event, EventEmitter, h, Method, Element, Prop, Host} from '@stencil/core';
import each from 'lodash/each';

import GridResizeService from '../viewport/gridResizeService';
import LocalScrollService from "../../services/localScrollService";
import {RevoGrid} from "../../interfaces";

@Component({
  tag: 'revogr-viewport-scroll',
  styleUrl: 'revogr-viewport-scroll-style.scss'
})
export class RevogrViewportScroll {
  @Element() horizontalScroll: HTMLElement;
  @Event({bubbles: false}) scrollViewport: EventEmitter<RevoGrid.ViewPortScrollEvent>;
  @Event() resizeViewport: EventEmitter<RevoGrid.ViewPortResizeEvent>;


  @Prop() contentWidth: number = 0;
  @Prop() contentHeight: number = 0;

  private oldValY: number = this.contentHeight;
  private oldValX: number = this.contentWidth;
  private verticalScroll: HTMLElement;

  private horizontalMouseWheel: (e: WheelEvent) => void;
  private verticalMouseWheel: (e: WheelEvent) => void;

  private gridResizeService: GridResizeService;
  private scrollService: LocalScrollService;

  /**
   * Last mw event time for trigger scroll function below
   * If mousewheel function was ignored we still need to trigger render
   */
  private mouseWheelScroll: {[T in RevoGrid.DimensionType]: number} = {col: 0, row: 0};

  @Method()
  async setScroll(e: RevoGrid.ViewPortScrollEvent): Promise<void> {
    this.latestScrollUpdate(e.dimension);
    this.scrollService?.setScroll(e);
  }


  connectedCallback(): void {
    this.scrollService = new LocalScrollService({
      beforeScroll: e => {
        this.scrollViewport.emit(e);
      },
      afterScroll: e => {
        switch (e.dimension) {
          case 'col':
            this.horizontalScroll.scrollLeft = e.coordinate;
            break;
          case 'row':
            this.verticalScroll.scrollTop = e.coordinate;
            break;
        }
      }
    });
  }

  componentDidLoad(): void {
    this.verticalMouseWheel = (e: WheelEvent) => {
      if (e.defaultPrevented) {
        return;
      }
      e.preventDefault();
      const y = this.verticalScroll.scrollTop + e.deltaY;
      this.scrollService?.scroll(y, 'row');
      this.latestScrollUpdate('row');
    };
    this.horizontalMouseWheel = (e: WheelEvent) => {
      if (e.defaultPrevented) {
        return;
      }
      e.preventDefault();
      const x = this.horizontalScroll.scrollLeft + e.deltaX;
      this.scrollService?.scroll(x, 'col');
      this.latestScrollUpdate('col');
    };
    this.gridResizeService = new GridResizeService(
        this.horizontalScroll,
        {
          resize: () => {
            const els = {row: {
              size: this.verticalScroll.clientHeight,
              scroll: this.verticalScroll.scrollTop
            }, col: {
              size: this.horizontalScroll.clientWidth,
              scroll: this.horizontalScroll.scrollLeft
            }};
            each(els, (item, dimension: RevoGrid.DimensionType) => {
              this.resizeViewport.emit({ dimension, size: item.size });
              this.scrollService?.scroll(item.scroll, dimension, true);
            });
          }
        }
    );
    this.verticalScroll.addEventListener('mousewheel', this.verticalMouseWheel);
    this.horizontalScroll.addEventListener('mousewheel', this.horizontalMouseWheel);
  }

  disconnectedCallback(): void {
    this.verticalScroll.removeEventListener('mousewheel', this.verticalMouseWheel);
    this.horizontalScroll.removeEventListener('mousewheel', this.horizontalMouseWheel);
    this.gridResizeService.destroy();
  }

  async componentDidRender(): Promise<void> {
    // scroll update if number of rows changed
    if (this.contentHeight < this.oldValY && this.verticalScroll) {
      this.verticalScroll.scrollTop += this.contentHeight - this.oldValY;
    }
    this.oldValY = this.contentHeight;

    // scroll update if number of cols changed
    if (this.contentWidth < this.oldValX) {
      this.horizontalScroll.scrollLeft += this.contentWidth - this.oldValX;
    }
    this.oldValX = this.contentWidth;

    this.scrollService.setParams({
      contentSize: this.contentHeight,
      clientSize: this.verticalScroll.clientHeight,
      virtualSize: 0
    }, 'row');

    this.scrollService.setParams({
      contentSize: this.contentWidth,
      clientSize: this.horizontalScroll.clientWidth,
      virtualSize: 0
    }, 'col');
  }

  render() {
    return <Host onScroll={(e: MouseEvent) => this.onScroll('col', e)}>
      <div class='inner-content-table' style={{ width: `${this.contentWidth}px` }}>
        <div class='header-wrapper'>
          <slot name='header'/>
        </div>
        <div class='vertical-inner'
          ref={el => {this.verticalScroll = el;}}
          onScroll={(e: MouseEvent) => this.onScroll('row', e)}>
          <div class='content-wrapper' style={{ height: `${this.contentHeight}px`,  }}>
            <slot name='content'/>
          </div>
        </div>
        <div class='footer-wrapper'>
          <slot name='footer'/>
        </div>
      </div>
    </Host>;
  }

  /**
   * Extra layer for scroll event monitoring, where MouseWheel event is not passing
   * We need to trigger scroll event in case there is no mousewheel event
   */
  private onScroll(dimension: RevoGrid.DimensionType, e: MouseEvent): void {
    const target = e.target as HTMLElement|undefined;
    let scroll = 0;
    switch(dimension) {
      case 'col':
        scroll = target?.scrollLeft;
        break;
      case 'row':
        scroll = target?.scrollTop;
        break;
    }
    const change = (new Date()).getTime() - this.mouseWheelScroll[dimension];
    if (change > 30) {
      this.scrollService?.scroll(scroll, dimension);
    }
  }

  /** remember last mw event time */
  private latestScrollUpdate(dimension: RevoGrid.DimensionType): void {
   this.mouseWheelScroll[dimension] = (new Date()).getTime();
  }
}
