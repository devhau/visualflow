import { EventEnum } from "../core/Constant";
import { IMain } from "../core/IFlow";

export class TabProjectView {
  private $elBoby: Element | undefined | null;
  private $elWarp: Element | undefined | null;
  private $btnNext: Element | undefined | null;
  private $btnBack: Element | undefined | null;
  private $btnAdd: Element | undefined | null;
  private $btnZoomIn: Element | undefined | null;
  private $btnZoomOut: Element | undefined | null;
  private $btnZoomReset: Element | undefined | null;
  public constructor(public elNode: HTMLElement, public main: IMain) {
    this.elNode.classList.add('vs-tab-project');
    this.main.on(EventEnum.openProject, this.Render.bind(this));
    this.Render();
  }
  public Render() {
    let scrollLeftCache = this.$elWarp?.scrollLeft ?? 0;
    this.elNode.innerHTML = `
    <div class="tab-project__search"></div>
    <div class="tab-project__list">
      <div class="tab-project_button">
        <button class="btn-back"><i class="fas fa-angle-left"></i></button>
      </div>
      <div class="tab-project_warp">
        <div class="tab-project__body">
        </div>
      </div>
      <div class="tab-project_button">
        <button class="btn-next"><i class="fas fa-angle-right"></i></button>
      </div>
      <div class="tab-project_button">
        <button class="btn-add"><i class="fas fa-plus"></i></button>
      </div>
      <div class="tab-project_button">
        <button class="btn-zoom-in"><i class="fas fa-search-minus"></i></button>
      </div>
      <div class="tab-project_button">
        <button class="btn-zoom-out"><i class="fas fa-search-plus"></i></button>
      </div>
      <div class="tab-project_button">
        <button class="btn-zoom-reset"><i class="fas fa-redo"></i></button>
      </div>
    </div>
    `;
    this.$elWarp = this.elNode.querySelector('.tab-project_warp');
    this.$elBoby = this.elNode.querySelector('.tab-project__body');
    this.$btnBack = this.elNode.querySelector('.btn-back');
    this.$btnNext = this.elNode.querySelector('.btn-next');
    this.$btnAdd = this.elNode.querySelector('.btn-add');
    this.$btnZoomIn = this.elNode.querySelector('.btn-zoom-in');
    this.$btnZoomOut = this.elNode.querySelector('.btn-zoom-out');
    this.$btnZoomReset = this.elNode.querySelector('.btn-zoom-reset');
    const fnUpdateScroll = () => {
      if (this.$elWarp) {
        // let scrollLeft = this.$elWarp.scrollLeft;
        // var maxScrollLeft = this.$elWarp.scrollWidth - this.$elWarp.clientWidth;
        // console.log(scrollLeft);
        // if (this.$btnBack && scrollLeft <= 0) {
        //   this.$btnBack.setAttribute('style', `display:none;`)
        // } else if (this.$btnBack && scrollLeft > 0) {
        //   this.$btnBack.removeAttribute('style');
        // }
        // if (this.$btnNext && scrollLeft >= maxScrollLeft) {
        //   this.$btnNext.setAttribute('style', `display:none;`)
        // } else if (this.$btnNext && scrollLeft <= 0) {
        //   this.$btnNext.removeAttribute('style');
        // }
      }
    }
    this.$elWarp?.addEventListener("scroll", event => {
      fnUpdateScroll();
    }, { passive: true });
    fnUpdateScroll();
    this.$btnBack?.addEventListener('click', () => {
      if (this.$elWarp) {
        this.$elWarp.scrollLeft -= 100;
      }
    });
    this.$btnNext?.addEventListener('click', () => {
      if (this.$elWarp) {
        this.$elWarp.scrollLeft += 100;
      }
    });
    this.$btnAdd?.addEventListener('click', () => {
      this.main.newProject("");
    });
    this.$btnZoomIn?.addEventListener('click', () => {
      this.main.dispatch(EventEnum.zoom, { zoom: -1 });
    });
    this.$btnZoomOut?.addEventListener('click', () => {
      this.main.dispatch(EventEnum.zoom, { zoom: 1 });
    });
    this.$btnZoomReset?.addEventListener('click', () => {
      this.main.dispatch(EventEnum.zoom, { zoom: 0 });
    });
    let projects = this.main.getProjectAll();
    let itemActive: any = undefined;
    for (let project of projects) {
      let projectItem = document.createElement('div');
      let projectName = document.createElement('span');
      let projectButton = document.createElement('div');
      let projectButtonRemove = document.createElement('button');
      projectItem.setAttribute('data-project-id', project.Get('id'));
      projectName.innerHTML = project.Get('name');
      projectName.classList.add('pro-name');
      projectButton.classList.add('pro-button');
      projectButtonRemove.innerHTML = `<i class="fas fa-minus"></i>`;
      projectButton.appendChild(projectButtonRemove);
      projectItem.appendChild(projectName);
      projectItem.appendChild(projectButton);

      projectItem.classList.add('project-item');
      if (this.main.checkProjectOpen(project)) {
        projectItem.classList.add('active');
        itemActive = projectItem;
      }
      projectItem.addEventListener('click', (e) => {
        if (!projectButtonRemove.contains(e.target as Node) && e.target != projectButtonRemove) {
          this.main.setProjectOpen(project);
        }
      });
      projectButtonRemove.addEventListener('click', (e) => {
        this.main.removeProject(project);
      });
      this.$elBoby?.appendChild(projectItem);
      project.onSafe(EventEnum.dataChange + '_name', () => {
        projectName.innerHTML = project.Get('name');
      })
    }
    if (this.$elWarp) {
      if (itemActive != undefined) {
        this.$elWarp.scrollLeft = itemActive.offsetLeft - 20;
      } else {
        this.$elWarp.scrollLeft = scrollLeftCache;
      }
    }
  }
}
