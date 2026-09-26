import { createElement } from "react";

const WIDGET = {
}

function createDevLogWidget() {
  WIDGET.DevLog.container = document.getElementById("devlog-widget-container");
  
}

/**
 * @typedef {"statistic"|"interactive"|"click"} WidgetType
 * @typedef {"default"|"image"|"styled"} ContainerType
 */

class MapWidget {
  /**
   * @param {object} params
   * @param {string|null} params.name
   * @param {string|null} params.id
   * @param {WidgetType} params.widgetType
   * @param {ContainerType} params.containerType
   * @param {string|null} params.imgSrc
   * @param {string|null} params.innerHTML
   * @param {Function|null} params.innerJS
   * @param {Function|null} params.event
   */
  constructor({
      name = null,
      id = null,
      widgetType,
      containerType = "default",
      imgSrc = null,
      innerHTML = null,
      innerJS = null,
      event = null,
    }) {
      this.widgetName = name
      this.widgetID = id
      this.widgetType = widgetType
      this.containerType = containerType
      this.img = imgSrc
      this.innerHTML = innerHTML
      this.innerJS = innerJS
      this.clickEvent = event
      this.widget = document.createElement("div")
      this.processwidget()
    }

  processwidget(){
    this.widget.classList.add("widget")
    this.widget.classList.add(this.widgetType)
    this.widget.classList.add(this.containerType)
    if (this.widgetID) {
      this.widget.id = this.widgetID
    }
    if (this.widgetName){
      this.widget.classList.add(this.widgetName)
    }
    if (this.innerHTML){
      this.widget.innerHTML = this.innerHTML
    }
    if (this.innerJS){
      this.insertInnerJS()
    }
    if (this.widgetType === "click") {
      this.widget.addEventListener("click", this.clickEvent)
    }
    if ((this.containerType === "image") && (this.img)){
      this.innerImg = document.createElement("img")
      this.innerImg.classList.add("widget-img")
      if (this.widgetName) this.innerImg.classList.add(this.widgetName)
      this.innerImg.src = this.img
      this.widget.appendChild(this.innerImg)
    }

  }

  insertInnerJS(){
    //placeholder
  }

  bind(container) {
    container.appendChild(this.widget)
  }

  remove(){
    this.widget.remove();
  }
}