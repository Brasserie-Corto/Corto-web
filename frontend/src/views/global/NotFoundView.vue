<template>
  <div class="not-found-page">
    <div class="card content">
      <div class="beer-spill">🍺</div>
      <h1>404</h1>
      <h2>Oups, t'as bu combien là ?</h2>
      <p>Cette page n'existe pas... ou alors t'as trop forcé sur la Corto !</p>
      <div class="suggestions">
        <p>Tu cherchais peut-être :</p>
        <div class="links">
          <router-link to="/" class="btn">🍻 La Boutique</router-link>
          <router-link to="/about" class="btn secondary">📖 À propos</router-link>
        </div>
      </div>
      <p class="hint">Conseil : bois un verre d'eau et réessaie 💧</p>
    </div>
  </div>
</template>

<style scoped>
.not-found-page {
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.content {
  text-align: center;
  padding: 3rem;
  max-width: 500px;
}

.beer-spill {
  font-size: 5rem;
  animation: wobble 2s ease-in-out infinite;
  display: inline-block;
}

@keyframes wobble {
  0%, 100% { transform: rotate(-10deg); }
  50% { transform: rotate(10deg); }
}

h1 {
  font-size: 6rem;
  color: var(--primary-color);
  margin: 0;
  line-height: 1;
}

h2 {
  font-size: 1.5rem;
  margin: 1rem 0;
  color: var(--secondary-color);
}

p {
  color: #666;
  margin-bottom: 1rem;
}

.suggestions {
  margin: 2rem 0;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 12px;
}

.suggestions p {
  margin-bottom: 1rem;
  font-weight: 500;
}

.links {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.btn {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background: var(--primary-color);
  color: white;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  transition: transform 0.2s, box-shadow 0.2s;
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn.secondary {
  background: var(--secondary-color);
}

.hint {
  margin-top: 2rem;
  font-style: italic;
  font-size: 0.9rem;
}
</style>
