import { LitElement, html, css } from 'lit';
import { connect } from "pwa-helpers";
import { store } from "./store.js";
import { selectors } from "../index.js";
import "./index.js";

export class DemoPage extends connect(store)(LitElement) {
  static styles = [
    css`
      :host {
        display: block;
      }
    `
  ];

  static get properties() {
    return {
      _task1Status: { type: String },
      _task2Status: { type: String },
      _task3Status: { type: String },
      _task4Status: { type: String },
    };
  }

  render() {
    return html`
      <p>Open Redux-dev-tool to see redux state</p>
      <h4>Resolve</h4>
      <button @click="${this._task1}">Task 1</button>
      <p>Status: ${this._task1Status}</p>
      <h4>Reject</h4>
      <button @click="${this._task2}">Task 2</button>
      <p>Status: ${this._task2Status}</p>
      <h4>Cancellable</h4>
      <button @click="${this._task3}">Task 3</button> <button @click="${this._cancelTask}">Cancel</button>
      <p>Status: ${this._task3Status}</p>
      <h4>Timeout</h4>
      <button @click="${this._task4}">Task 4</button>
      <p>Status: ${this._task4Status}</p>
    `;
  }

  _task1() {
    store.dispatch({ type: "TASK", taskId: "task-1" });
  }

  _task2() {
    store.dispatch({ type: "TASK", taskId: "task-2" });
  }

  _task3() {
    store.dispatch({ type: "TASK", taskId: "task-3" });
  }

  _task4() {
    store.dispatch({ type: "TASK", taskId: "task-4" });
  }

  _cancelTask() {
    store.dispatch({ type: "CANCEL", taskId: "task-3" });
  }

  stateChanged(state) {
    this._task1Status = selectors.status(state, "task-1");
    this._task2Status = selectors.status(state, "task-2");
    this._task3Status = selectors.status(state, "task-3");
    this._task4Status = selectors.status(state, "task-4");

    // let task1 = selectors.get(state, "task-1");
    // let task2 = selectors.get(state, "task-2");
    // let task3 = selectors.get(state, "task-3");
    // let task4 = selectors.get(state, "task-4");
    // console.log(task1, task2, task3, task4);

    // let task1 = selectors.result(state, "task-1");
    // let task2 = selectors.result(state, "task-2");
    // let task3 = selectors.result(state, "task-3");
    // let task4 = selectors.result(state, "task-4");
    // console.log(task1, task2, task3, task4);
  }
}
customElements.define('demo-page', DemoPage);
