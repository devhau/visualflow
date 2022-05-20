import { EventEnum } from "../core/Constant";
import { IMain } from "../core/IFlow";

export class TabProjectView {
  private $elBoby: Element | undefined | null;
  private $elWarp: Element | undefined | null;
  private $btnNext: Element | undefined | null;
  private $btnBack: Element | undefined | null;
  private $btnAdd: Element | undefined | null;
  public constructor(public elNode: HTMLElement, public main: IMain) {
    this.elNode.classList.add('vs-tab-project');
    this.main.on(EventEnum.openProject, this.Render.bind(this));
    this.Render();
  }
  public Render() {
    this.elNode.innerHTML = `
    <div class="tab-project__search"></div>
    <div class="tab-project__list">
      <div class="tab-project_button">
        <button class="btn-back"><<</button>
      </div>
      <div class="tab-project_warp">
        <div class="tab-project__body">
        </div>
      </div>
      <div class="tab-project_button">
        <button class="btn-next">>></button>
      </div>
      <div class="tab-project_button">
        <button class="btn-add">+</button>
      </div>
    </div>
    `;
    this.$elWarp = this.elNode.querySelector('.tab-project_warp');
    this.$elBoby = this.elNode.querySelector('.tab-project__body');
    this.$btnBack = this.elNode.querySelector('.btn-back');
    this.$btnNext = this.elNode.querySelector('.btn-next');
    this.$btnAdd = this.elNode.querySelector('.btn-add');
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
    let projects = this.main.getProjectAll();
    for (let project of projects) {
      let projectItem = document.createElement('div');
      project.onSafe(EventEnum.dataChange + '_name', () => {
        projectItem.innerHTML = project.Get('name');
      })
      projectItem.setAttribute('data-project-id', project.Get('id'));
      projectItem.innerHTML = project.Get('name');
      projectItem.classList.add('project-item');
      if (this.main.checkProjectOpen(project)) {
        projectItem.classList.add('active');
      }
      projectItem.addEventListener('click', () => {
        this.main.setProjectOpen(project);
      });
      this.$elBoby?.appendChild(projectItem);
    }
  }
}
