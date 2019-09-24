import { createStore as _createStore } from "redux";
import { reducers } from "./reducers";

export default function createStore() {
  const store = _createStore(reducers);

  return store;
}
