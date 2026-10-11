// Apps built with the iOS 27 SDK must adopt the UIScene life cycle; otherwise UIKit stops them at
// launch ("UIScene life cycle is required for apps built with this SDK"). Expo SDK 57's iOS
// template still creates the window in the app delegate, although expo 57.0.x ships
// `ExpoAppSceneDelegate` and `ExpoReactNativeFactoryProvider` for exactly this. This plugin applies
// the Expo SDK 58 template's setup to the generated project:
//   - `SceneDelegate.swift`, a subclass of `ExpoAppSceneDelegate`, which creates the window and
//     starts React Native;
//   - a single-scene `UIApplicationSceneManifest` in Info.plist;
//   - an app delegate that provides the React Native factory instead of creating its own window.
// Remove this plugin when the app moves to an Expo SDK whose template adopts scenes (58 or later).
const { IOSConfig, withAppDelegate, withInfoPlist } = require('expo/config-plugins');

const SCENE_DELEGATE = `internal import Expo

@objc(SceneDelegate)
class SceneDelegate: ExpoAppSceneDelegate {
  // Extension point for config plugins.
}
`;

const DECLARATION = 'class AppDelegate: ExpoAppDelegate {';
const PROVIDER_DECLARATION = 'class AppDelegate: ExpoAppDelegate, ExpoReactNativeFactoryProvider {';
// The template's window creation, which the scene delegate now owns.
const WINDOW_START = /\n#if os\(iOS\) \|\| os\(tvOS\)\n\s*window = UIWindow\(frame: UIScreen\.main\.bounds\)\n\s*factory\.startReactNative\([^)]*\)\n#endif\n/;

function fail(message) {
  throw new Error(`with-ios-scene-lifecycle: ${message} Compare ios/<app>/AppDelegate.swift with the Expo template and update this plugin.`);
}

function adoptSceneAppDelegate(contents) {
  let next = contents;
  if (!next.includes(PROVIDER_DECLARATION)) {
    if (!next.includes(DECLARATION)) fail('the AppDelegate declaration is not the Expo SDK 57 template\'s.');
    next = next.replace(DECLARATION, PROVIDER_DECLARATION);
  }
  if (WINDOW_START.test(next)) {
    next = next.replace(WINDOW_START, '\n    // SceneDelegate creates the window and starts React Native under the scene-based\n    // life cycle, which the iOS 27 SDK requires.\n');
  } else if (next.includes('UIWindow(frame:')) {
    fail('the AppDelegate still creates a window in a form this plugin does not recognize.');
  }
  return next;
}

const withIosSceneLifecycle = config => {
  config = withAppDelegate(config, mod => {
    if (mod.modResults.language !== 'swift') fail('a Swift AppDelegate is required.');
    mod.modResults.contents = adoptSceneAppDelegate(mod.modResults.contents);
    return mod;
  });
  config = withInfoPlist(config, mod => {
    mod.modResults.UIApplicationSceneManifest = {
      UIApplicationSupportsMultipleScenes: false,
      UISceneConfigurations: {
        UIWindowSceneSessionRoleApplication: [
          { UISceneConfigurationName: 'Default Configuration', UISceneDelegateClassName: '$(PRODUCT_MODULE_NAME).SceneDelegate' },
        ],
      },
    };
    return mod;
  });
  return IOSConfig.XcodeProjectFile.withBuildSourceFile(config, { filePath: 'SceneDelegate.swift', contents: SCENE_DELEGATE, overwrite: true });
};

module.exports = withIosSceneLifecycle;
module.exports.adoptSceneAppDelegate = adoptSceneAppDelegate;
