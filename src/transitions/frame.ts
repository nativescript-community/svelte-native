// The display-synced frame loop of NativeScript core. `requestAnimationFrame` on the global object is
// replaced by svelte-native's 30 fps timer, which is not smooth enough to animate layout.
export { requestAnimationFrame, cancelAnimationFrame } from '@nativescript/core/animation-frame';
