import {vectorSubtract, vectorAdd, vectorEqual, vectorScalar} from "./mathUtils.js"

const AGENTS = {}

const BASEAGENTDATA = [
  {
    id: "wealth",
    iconId: "preview_wealth",
    iconSrc: "/assets/othersvg/content_preview_wealth.svg",
    relativeLocation: {X: -36, Y: 48}
  },
]

export function initContentPreview() {
  createAgents();
  commandToAllAgents("start");
}

export function switchAgentTarget(marker) {
  if (marker) {
    const contentList = marker._previewIds
    for (const id of Object.keys(AGENTS)) {
      if (contentList.includes(id)) {
        commandToAgent(id, "setTarget", marker._id, {...marker._location})
        commandToAgent(id, "show")
      } else {
        commandToAgent(id, "hide")
      }
    }
  } else {
    commandToAllAgents("hide")
  }
}

export function commandToAllAgents(command, ...args) {
  if ((command !== null) || ((typeof command) === Object)) {
    command
    for (const agent of Object.values(AGENTS)) {
      const c = command[agent.id]
      if (c !== null) {
        agent.commandTerminal(c, ...args)
      }
    }
  } 
  if ((typeof command) === String) {
    for (const agent of Object.values(AGENTS)) {
      agent.commandTerminal(command, ...args)
    }
  }
  return "Unknown command"
}

export function commandToAgent(agId, command, ...args) {
  AGENTS[agId].commandTerminal(command, ...args)
  return "Unknown command"
}

function createAgents() {
  for (const data of BASEAGENTDATA) {
    const agent = new ContentIconAgent(data)
    AGENTS[data.id] = agent
  }
}

class ContentIconAgent {
  constructor(data) {
    this.id = data.id
    this.iconId = data.iconId
    this.iconSrc = data.iconSrc
    this.relativeLocation = data.relativeLocation
    this.scalarRelativeLocation = vectorScalar(this.relativeLocation)
    this.cutFactor = 0.6
    this.cutedScalarRelativeLocation = this.scalarRelativeLocation * this.cutFactor

    this.container = null
    this.imgContainer = null;
    this.stiffness = 100
    this.damping = 0.9
    this.velocity = {}
    this.velocity.X = 0
    this.velocity.Y = 0
    this.location = {}
    this.location.X = 0
    this.location.Y = 0
    this.opacity = 0
    this.baseOpacity = 0.85

    this.anchorId = null
    this.anchorLocation = {}
    this.anchorLocation.X = 0
    this.anchorLocation.Y = 0

    this.hideAnchor = null
    this.hideAnchorLocation = {}
    this.hideAnchorLocation.X = 0
    this.hideAnchorLocation.Y = 0
    


    this.created = false
    this.started = false
    this.paused = false
    this.resumePromise = null;
    this.resumeResolver = null;
    this.active = false
    this.teleported = true


    this.commandList = {
      "play": () => {this._resume()},
      "pause": () => {this._pause()},
      "start": () => {this._start()},
      "stop": () => {this.started = false; this._resume();},
      "setTarget": (targetId, targetLocation = {}) => {this._setTarget(targetId, targetLocation)},
      "createContainer": () => {this._createAgentContainer()},
      "removeContainer": () => {this._removeAgentContainer()},
      "show": () => {this.active = true},
      "hide": () => {this.active = false; this._dropTarget()},
    }
    this._createAgentContainer()
  }

  commandTerminal(cmd, ...args) {
    const command = this.commandList[cmd];

    if (!command) {
      throw new Error(`Unknown command: ${cmd}`);
    }

    return command(...args);
  }

  _start() {
    if (this.started) return;

    this.started = true;
    this._resume();
    this._startAgent();
  }

  _pause() {
    if (this.paused) return;

    this.paused = true;

    this.resumePromise = new Promise(resolve => {
      this.resumeResolver = resolve;
    });
  }

  _resume() {
    if (!this.paused) return;

    this.paused = false;

    this.resumeResolver?.();

    this.resumePromise = null;
    this.resumeResolver = null;
  }

  _createAgentContainer() {
    if (!this.created) {
      this.container = document.createElement('div');
      this.imgContainer = document.createElement('img');
      this.imgContainer.src = this.iconSrc
      this.imgContainer.classList.add('content-preview-img');
      this.container.classList.add('content-preview');
      this.container.append(this.imgContainer);
      const p = document.getElementById('custom-cursor')
      p.after(this.container)
      this.created = true
    }
  }
  _removeAgentContainer() {
    if (!this.created) return;
    this.container.remove()
    this.container = null;
    this.imgContainer = null;
    this.created = false
  }

  _setTarget(targetId, targetLocation) {
    this.hideAnchor = this.anchorId
    this.hideAnchorLocation = {...this.anchorLocation}
    this.anchorId = targetId
    this.anchorLocation = {...targetLocation}
    if (this.opacity < 0.15) {
      this.location = {...this.anchorLocation};
      this.velocity.X = 0;
      this.velocity.Y = 0;
    }
  }
  _dropTarget() {
    if (this.hideAnchor === null) return;
    if (vectorEqual(this.anchorLocation, this.hideAnchorLocation)) return
    const absVector = vectorSubtract(this.anchorLocation, this.hideAnchorLocation)
    const realVector = vectorSubtract(this.location, this.anchorLocation)
    if (vectorScalar(realVector) > (vectorScalar(absVector) / 2)) {
      this.anchorId = this.hideAnchor
      this.anchorLocation = {...this.hideAnchorLocation}
    }
  }

  async _startAgent() {
    this.started = true;

    let lastTime = performance.now();

    while (this.started) {
      if (this.paused) {
        await this.resumePromise;
        lastTime = performance.now();
      }

      if (!this.started) break;

      const time = await new Promise(requestAnimationFrame);
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;
      this._positionDriver(dt);
      this._hideDriver();
    }
  }

  _positionDriver(dt) {
    const targetLocation = this.active ? vectorAdd(this.anchorLocation, this.relativeLocation) : this.anchorLocation
    const dx = targetLocation.X - this.location.X;
    const dy = targetLocation.Y - this.location.Y;

    this.velocity.X += dx * this.stiffness * dt;
    this.velocity.Y += dy * this.stiffness * dt;

    this.velocity.X *= Math.pow(this.damping, dt * 60);
    this.velocity.Y *= Math.pow(this.damping, dt * 60);

    this.location.X += this.velocity.X * dt;
    this.location.Y += this.velocity.Y * dt;

    this.container.style.transform =
      `translate3d(${this.location.X}px, ${this.location.Y}px, 0)`;
  }

  _hideDriver() {
    const realDistance = vectorSubtract(this.location, this.anchorLocation)
    const realDistanceScalar = vectorScalar(realDistance)

    this.opacity = Math.max((Math.min(this.cutedScalarRelativeLocation, realDistanceScalar) / this.cutedScalarRelativeLocation) - (1 - this.baseOpacity), 0)
    const scale = (Math.min(0.5, this.opacity) + 0.5)

    this.imgContainer.style.opacity =
      `${this.opacity}`;
    this.imgContainer.style.transform = `scale(${scale})`
  }
}