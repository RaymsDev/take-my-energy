module.exports = {
  configureHooks(api) {
    api.hooks.responseLogging.addHook('redactAuthHeader', (response) => {
      const headers = response.request?.headers;
      if (headers?.authorization) {
        const scheme = headers.authorization.split(' ')[0];
        headers.authorization = `${scheme} [REDACTED]`;
      }
    });
  },
};
