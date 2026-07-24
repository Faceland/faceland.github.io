// FaceGem confetti — the same drop effect as the faceorbs in MainBanner.js
// (identical randomisation and timings), with the FaceGem texture instead.
//
// It deliberately reuses the global `.forb-confetti-container` / `.forb-confetti`
// classes and the `forb-fall` keyframes declared in
// components/MainBanner/mainBanner.scss, so the motion stays defined in one
// place; `.pixelImage` (App.scss) keeps the gem texture pixel-crisp.

const GEM_SRC = '/assets/images/XAhGG80.png';

// `parent` lets the caller mount the layer inside a modal overlay so the gems
// fall in front of the backdrop but behind the dialog. A fixed-position overlay
// with a z-index forms its own stacking context, so a body-level sibling could
// never be slotted between its backdrop and its child.
export const dropGemConfetti = (parent = document.body, count = 200) => {
  const container = document.createElement('div');
  container.className = 'forb-confetti-container gemConfettiLayer';
  (parent || document.body).appendChild(container);

  for (let i = 0; i < count; i += 1) {
    const gem = document.createElement('img');
    gem.src = GEM_SRC;
    gem.alt = '';
    gem.className = 'forb-confetti pixelImage';

    const startX = Math.random() * 100; // horizontal start, %
    const rotation = Math.random() * 240 - 120; // -120deg .. +120deg
    const scale = 0.25 + Math.random() * 1.25; // 25% .. 150%
    const duration = 1.5 + Math.random() * 2.5; // 1.5s .. 4s
    const delay = Math.random() * 2; // staggered start
    const drift = (Math.random() - 0.5) * 200; // sideways drift

    gem.style.cssText = `
      left: ${startX}%;
      transform: rotate(${rotation}deg) scale(${scale});
      animation-duration: ${duration}s;
      animation-delay: ${delay}s;
      --drift: ${drift}px;
    `;

    container.appendChild(gem);
  }

  // Self-cleaning once every gem has finished falling, so closing the modal
  // doesn't cut the celebration short.
  setTimeout(() => container.remove(), 12000);
};
