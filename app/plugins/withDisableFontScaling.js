const { withAndroidManifest } = require('@expo/config-plugins');

// Plugin for Android configuration
const withAndroidConfig = (config) => {
  // Modify AndroidManifest.xml to enable cleartext traffic
  config = withAndroidManifest(config, (config) => {
    const mainApplication = config.modResults.manifest.application[0];

    // Enable cleartext traffic for HTTP connections
    mainApplication.$['android:usesCleartextTraffic'] = 'true';

    return config;
  });

  return config;
};

module.exports = withAndroidConfig;
