/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-undef */
const fs = require('fs');
const path = require('path');

const patches = [
  {
    file: 'node_modules/expo-modules-core/android/CMakeLists.txt',
    search: `target_link_libraries(
  \${PACKAGE_NAME}
  CommonSettings
  \${LOG_LIB}
  fbjni::fbjni
  ReactAndroid::jsi
  android
  \${JSEXECUTOR_LIB}
  \${NEW_ARCHITECTURE_DEPENDENCIES}
)`,
    replace: `target_link_libraries(
  \${PACKAGE_NAME}
  CommonSettings
  \${LOG_LIB}
  c++_shared
  fbjni::fbjni
  ReactAndroid::jsi
  android
  \${JSEXECUTOR_LIB}
  \${NEW_ARCHITECTURE_DEPENDENCIES}
)`,
  },
  {
    file: 'node_modules/react-native-screens/android/CMakeLists.txt',
    search: `else()
    target_link_libraries(rnscreens
        ReactAndroid::jsi
        android
    )
endif()`,
    replace: `else()
    target_link_libraries(rnscreens
        ReactAndroid::jsi
        c++_shared
        android
    )
endif()`,
  },
  {
    file: 'node_modules/react-native-svg/android/src/main/jni/CMakeLists.txt',
    search: `target_link_libraries(
  react_codegen_rnsvg
  fbjni
)`,
    replace: `target_link_libraries(
  react_codegen_rnsvg
  c++_shared
  fbjni
)`,
  },
  {
    file: 'node_modules/react-native-safe-area-context/android/src/main/jni/CMakeLists.txt',
    search:
      /if \(REACTNATIVE_MERGED_SO\)\n  target_link_libraries\(\n          \$\{LIB_TARGET_NAME\}\n          fbjni\n          jsi\n          reactnative\n  \)\nelse\(\)\n  target_link_libraries\(\n          \$\{LIB_TARGET_NAME\}\n          fbjni\n          folly_runtime\n          glog\n          jsi\n          react_codegen_rncore\n          react_debug\n          react_nativemodule_core\n          react_render_core\n          react_render_debug\n          react_render_graphics\n          react_render_mapbuffer\n          react_render_componentregistry\n          react_utils\n          rrc_view\n          turbomodulejsijni\n          yoga\n  \)\nendif\(\)/,
    replace: `if (REACTNATIVE_MERGED_SO)
  target_link_libraries(
          \${LIB_TARGET_NAME}
          c++_shared
          fbjni
          jsi
          reactnative
  )
else()
  target_link_libraries(
          \${LIB_TARGET_NAME}
          c++_shared
          fbjni
          folly_runtime
          glog
          jsi
          react_codegen_rncore
          react_debug
          react_nativemodule_core
          react_render_core
          react_render_debug
          react_render_graphics
          react_render_mapbuffer
          react_render_componentregistry
          react_utils
          rrc_view
          turbomodulejsijni
          yoga
  )
endif()`,
  },
];

console.log('Applying CMake patches for Windows build...\n');

let patchedCount = 0;
let skippedCount = 0;

for (const patch of patches) {
  const filePath = path.join(__dirname, '..', patch.file);

  if (!fs.existsSync(filePath)) {
    console.log(`⏭️  Skipping ${patch.file} (file not found)`);
    skippedCount++;
    continue;
  }

  try {
    let content = fs.readFileSync(filePath, 'utf8');

    // Check if already patched
    if (patch.search instanceof RegExp) {
      if (!patch.search.test(content)) {
        console.log(`✅ Already patched: ${patch.file}`);
        patchedCount++;
        continue;
      }
      content = content.replace(patch.search, patch.replace);
    } else {
      if (!content.includes(patch.search)) {
        console.log(`✅ Already patched: ${patch.file}`);
        patchedCount++;
        continue;
      }
      content = content.replace(patch.search, patch.replace);
    }

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Patched: ${patch.file}`);
    patchedCount++;
  } catch (error) {
    console.error(`❌ Error patching ${patch.file}:`, error.message);
  }
}

console.log(`\nPatching complete: ${patchedCount} files patched, ${skippedCount} files skipped`);
