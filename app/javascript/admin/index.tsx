/* eslint-env browser */

import 'whatwg-fetch';

import * as Sentry from '@sentry/browser';
Sentry.init({
  dsn: 'https://8a23e3e572a242059ecd4aa01ff8fbd2@sentry.io/1234584',
});

import 'normalize.css/normalize.css';

import '@blueprintjs/core/lib/css/blueprint';
import '@blueprintjs/datetime/lib/css/blueprint-datetime.css';
import '@blueprintjs/icons/lib/css/blueprint-icons.css';

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { AppContainer } from 'react-hot-loader';

import { ApolloProvider } from 'react-apollo';
import { Provider } from 'react-redux';
import { applyMiddleware, compose, createStore } from 'redux';
import { createEpicMiddleware } from 'redux-observable';

import apolloClient from './apolloClient';

import * as ActiveStorage from 'activestorage';

ActiveStorage.start();

import App from './App';
import rootEpic from './epics';
import rootReducer from './reducers';

const composeEnhancers = (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

const epicMiddleware = createEpicMiddleware();

const store = createStore(rootReducer, composeEnhancers(applyMiddleware(epicMiddleware)));

epicMiddleware.run(rootEpic);

const render = (RootContainer) =>
  ReactDOM.render(
    <AppContainer>
      <ApolloProvider client={apolloClient}>
        <Provider store={store}>
          <RootContainer />
        </Provider>
      </ApolloProvider>
    </AppContainer>,
    document.getElementById('app-root'),
  );

// #app-root element is not present on the admin login page
if (document.getElementById('app-root') !== null) {
  render(App);
}

if ((module as any).hot) {
  (module as any).hot.accept('./App', () => render(App));
}
