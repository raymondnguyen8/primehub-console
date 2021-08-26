import React from 'react';
import ReactDOM from 'react-dom';
import { ApolloProvider } from 'react-apollo';
import { fakeData, schema as fakeDataSchema } from './fakeData';
import { createGraphqlClient } from 'utils/graphqlClient';
import {
  BrowserRouter as Router,
  Route,
  Switch,
  Redirect,
} from 'react-router-dom';
import { IntlProvider, addLocaleData } from 'react-intl';
import { LocaleProvider, notification, Button } from 'antd';
import en from 'react-intl/locale-data/en';
import en_US from 'antd/lib/locale-provider/en_US';
import 'moment/locale/zh-tw';
addLocaleData([...en]);
import CMSPage from './cms';
import schema from 'index-schema';
import myLocales from './utils/locales';
import { BackgroundTokenSyncer } from './workers/backgroundTokenSyncer';
import GroupList from 'components/admins/group/list';

const firstKey = Object.keys(schema.schema)[0];
const locales = {
  en: en_US,
};
const locale = window.LOCALE || 'en';
const appPrefix = window.APP_PREFIX || '/';

/**
 * Background worker
 */
function checkStatus(response) {
  if (response.status >= 200 && response.status < 300) {
    return response;
  } else {
    const error = new Error(response.statusText);
    (error as any).response = response;
    throw error;
  }
}

function parseJSON(response) {
  return response.json();
}

export const tokenSyncWorker = new BackgroundTokenSyncer({
  appPrefix,
  refreshTokenExp: window.refreshTokenExp,
  accessTokenExp: window.accessTokenExp,
  getNewTokenSet: () => {
    return fetch(`${appPrefix}oidc/refresh-token-set`, {
      method: 'POST',
    })
      .then(checkStatus)
      .then(parseJSON);
  },
  reLoginNotify: () => {
    // notify with fixed card
    notification.warning({
      message: 'Warning',
      description:
        "In less than 1 minute, you're going to be redirected to login page.",
      placement: 'bottomRight',
      duration: null,
      btn: (
        // @ts-ignore
        <Button
          type="primary"
          onClick={() => window.location.replace(`${appPrefix}oidc/logout`)}
        >
          Login Again
        </Button>
      ),
      key: 'refreshWarning',
    });
  },
});

const client = createGraphqlClient({
  fakeData,
  schema: fakeDataSchema,
});

tokenSyncWorker.run().catch(console.error);
/**
 * UI
 */
ReactDOM.render(
  <IntlProvider
    locale={locale}
    messages={{ ...schema.dict[locale], ...myLocales[locale] }}
  >
    <LocaleProvider locale={locales[locale]}>
      <Router>
        <React.Fragment>
          <Switch>
            <Route
              path={`${appPrefix}admin/:activeKey`}
              component={(props) => (
                <CMSPage
                  {...props}
                  schema={schema}
                  notification={<ApolloProvider client={client} {...props} />}
                />
              )}
            />
            <Redirect
              exact
              from={`${appPrefix}admin/`}
              to={`${appPrefix}admin/${firstKey}`}
            />
          </Switch>
        </React.Fragment>
      </Router>
    </LocaleProvider>
  </IntlProvider>,
  document.getElementById('root')
);

// @ts-ignore
if (module.hot) module.hot.accept();
