// The only script on the site: respect "reduce motion" by not autoplaying the demo video.
const video = document.getElementById('demo');
if (video && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  video.removeAttribute('autoplay');
  video.pause();
  video.controls = true;
}
