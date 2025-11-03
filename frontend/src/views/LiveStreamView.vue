<template>
  <div class="live-stream-page">
    <div class="card">
      <h1>Brewery Live Stream</h1>
      <p>Peek behind the curtain and see the magic happen! Our live stream is coming soon.</p>
      
      <div class="video-placeholder">
        <div class="play-icon" role="img" aria-label="Video play icon">▶</div>
        <p>Stream Offline</p>
      </div>

      <p>Check back later to watch our brewers craft your favorite beers in real-time, from mashing and boiling to fermentation and packaging.</p>
    </div>
  </div>
</template>

<style scoped>
.live-stream-page {
  max-width: 900px;
  margin: 0 auto;
  text-align: center;
}

.live-stream-page p {
  line-height: 1.8;
  margin-bottom: 1rem;
}

.video-placeholder {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background-color: #000;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #fff;
  margin: 2rem 0;
  overflow: hidden;
}

.video-placeholder::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, rgba(255,255,255,0.05) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.05) 75%, transparent 75%, transparent);
  background-size: 60px 60px;
  opacity: 0.3;
}

.play-icon {
  font-size: 4rem;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 1rem;
}

.video-placeholder p {
  font-size: 1.5rem;
  font-weight: bold;
  letter-spacing: 1px;
  color: rgba(255, 255, 255, 0.9);
}
</style>
