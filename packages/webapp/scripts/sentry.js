const SentryCli = require('@sentry/cli');

async function createReleaseAndUpload() {
  const release = process.env.REACT_APP_SENTRY_RELEASE;
  const environment = process.env.REACT_APP_SENTRY_ENV;
  const sentryAuthToken = process.env.SENTRY_AUTH_TOKEN;

  if (!release || !environment) {
    console.warn('REACT_APP_SENTRY_RELEASE or SENTRY_ENV is not set');

    return;
  }


  try {
    await cli.login()
    console.log('Creating sentry release ' + release);
    await cli.releases.new(release);

    console.log('Uploading source maps');
    await cli.releases.uploadSourceMaps(release, {
      include: ['build/static/js'],
      rewrite: true,
      validate: true,
    });

    console.log('Finalizing release');

    await cli.releases.newDeploy(release, environment)

    await cli.releases.finalize(release);
  } catch (e) {
    console.error('Creating a release on Sentry failed.', e);
  }
}

createReleaseAndUpload();