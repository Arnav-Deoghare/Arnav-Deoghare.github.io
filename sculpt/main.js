// Two small jobs:
// 1. Respect "reduce motion" by not autoplaying the demo video.
// 2. Ask GitHub which release is newest and point the download buttons at its APK, so the page
//    never has to be edited for a new version and no APK is stored in this repo.

const REPO = 'Arnav-Deoghare/Sculpt';
const RELEASES = `https://github.com/${REPO}/releases`;

const video = document.getElementById('demo');
if (video && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  video.removeAttribute('autoplay');
  video.pause();
  video.controls = true;
}

const chip = document.getElementById('version-chip');
const button = document.getElementById('dl-btn');
const buttonText = document.getElementById('dl-btn-text');
const heroButton = document.getElementById('hero-dl');
const note = document.getElementById('dl-note');
const checksum = document.getElementById('sha-link');

function setNote(text) {
  if (!note) return;
  note.textContent = '';
  note.append(text);
  note.append(document.createElement('br'));
  const link = document.createElement('a');
  link.href = RELEASES;
  link.target = '_blank';
  link.rel = 'noopener';
  link.textContent = 'All releases on GitHub →';
  note.append(link);
}

function show(release) {
  const tag = release.tag_name || 'latest';
  const assets = release.assets || [];
  const apk = assets.find((a) => /^Sculpt-.*\.apk$/.test(a.name)) || assets.find((a) => a.name.endsWith('.apk'));
  const sha = assets.find((a) => a.name.endsWith('.apk.sha256'));

  // No APK attached to the newest release: send people to its page instead.
  const url = apk ? apk.browser_download_url : release.html_url || `${RELEASES}/latest`;
  const label = apk ? `Download APK (${tag})` : `See release ${tag}`;

  if (chip) chip.textContent = tag;
  if (button) button.href = url;
  if (buttonText) buttonText.textContent = label;
  if (heroButton) {
    heroButton.href = url;
    heroButton.textContent = apk ? `Download ${tag}` : 'Download';
  }
  if (checksum && sha) {
    checksum.href = sha.browser_download_url;
    checksum.textContent = sha.name;
    checksum.hidden = false;
    checksum.parentElement.hidden = false;
  }

  const date = release.published_at
    ? new Date(release.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';
  const size = apk ? `${(apk.size / 1_048_576).toFixed(1)} MB` : '';
  const facts = [date && `Released ${date}`, size, 'Sideloaded APK'].filter(Boolean).join(' · ');
  setNote(`${facts}. Enable Install unknown apps in Android settings before installing.`);
}

function fallback() {
  if (chip) chip.textContent = 'Latest';
  if (buttonText) buttonText.textContent = 'See the latest release';
  setNote('Sideloaded APK. Enable Install unknown apps in Android settings before installing.');
}

async function latestRelease() {
  // Remember the answer for ten minutes, so moving between pages doesn't use up GitHub's request limit.
  try {
    const saved = JSON.parse(sessionStorage.getItem('sculpt-release') || 'null');
    if (saved && Date.now() - saved.at < 10 * 60 * 1000) return saved.release;
  } catch (e) { /* storage can be unavailable; just ask GitHub */ }

  const response = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
    headers: { Accept: 'application/vnd.github+json' }
  });
  if (!response.ok) throw new Error(`GitHub answered ${response.status}`);
  const release = await response.json();
  try { sessionStorage.setItem('sculpt-release', JSON.stringify({ at: Date.now(), release })); } catch (e) { /* ignore */ }
  return release;
}

if (button) {
  latestRelease().then(show).catch((error) => {
    console.warn('Could not look up the latest release:', error);
    fallback();
  });
}
