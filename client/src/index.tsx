import * as React from "react";
import { render } from "react-dom";
import { AppContainer } from "react-hot-loader";
import { Provider } from "react-redux";

import App from "./App";
import createStore from "./redux/create";

render(
  <AppContainer>
    <Provider store={createStore()}>
      <App/>
    </Provider>
  </AppContainer>,
  document.getElementById("root")
);
