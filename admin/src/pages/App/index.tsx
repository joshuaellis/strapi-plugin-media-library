import React from "react";
import styled from "styled-components";
import { NotFound } from "@strapi/helper-plugin";
import { Switch, Route } from "react-router-dom";
import { useIntl } from "react-intl";
import { Helmet } from "react-helmet";
import { Main } from "@strapi/design-system";
import { Provider } from "react-redux";

import { Finder, finderReducer } from "../Finder";

import { prefixTranslation } from "../../helpers/translations";

import pluginId from "../../pluginId";

import { createStore } from "../../store";

const store = createStore({
  // finder: finderReducer,
});

const App: React.FunctionComponent = () => {
  const { formatMessage } = useIntl();
  const title = formatMessage({
    id: prefixTranslation("plugin.name"),
    defaultMessage: "Media Library",
  });

  return (
    <Provider store={store}>
      <MediaMain>
        <Helmet title={title} />
        <Switch>
          <Route path={`/plugins/${pluginId}`} component={Finder} />
          <Route component={NotFound} />
        </Switch>
      </MediaMain>
    </Provider>
  );
};

const MediaMain = styled(Main)`
  background-color: #171717;
  color: #fafafa;
  display: grid;
  grid-template-columns: min-content 1fr 1fr;
  grid-template-rows: 60px 1fr;
  height: 100vh;
`;

export default App;
