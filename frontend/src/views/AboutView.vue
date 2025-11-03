<template>
  <div class="about-page">
    <section class="card">
      <h1>About Corto Brewery</h1>
      <p>
        Founded in 2024, Corto Brewery began as a passion project in a small garage, fueled by a love for traditional brewing techniques and a desire to experiment with bold, new flavors. Our name, "Corto," reflects our philosophy: life is short, drink great beer. We believe in quality over quantity, community over competition, and innovation rooted in tradition.
      </p>
      <p>
        Every batch we brew is a testament to our dedication. We source the finest local ingredients whenever possible, from crisp mountain water to fragrant hops and rich, flavorful malts. Our state-of-the-art facility allows us to maintain exacting standards of quality and consistency while still allowing for the creativity that makes our beers unique.
      </p>
    </section>
    
    <section class="brewers">
      <h2>Meet the Brewers</h2>
      <div class="brewer-profiles">
        <div class="card brewer-card">
          <img src="https://placehold.co/200x200/d8a152/4a2c1a?text=Jonny" alt="Jonny" class="brewer-img">
          <h3>Jonny Brewmaster</h3>
          <p>The heart and soul of Corto, Jonny's journey started with a homebrew kit and a dream. With a background in chemistry and an artist's palate, he is the mastermind behind our most beloved recipes. When he's not tweaking a mash schedule, you can find him exploring the backcountry for inspiration.</p>
        </div>
        <div class="card brewer-card">
          <img src="https://placehold.co/200x200/d8a152/4a2c1a?text=Alec" alt="Alec" class="brewer-img">
          <h3>Alec Hopsmith</h3>
          <p>Alec is our hop wizard. Obsessed with the aromatic compounds of lupulin, he travels the world to find the most unique and expressive hop varieties. His expertise is what gives our IPAs their signature punch and our lagers their subtle, floral notes. Alec believes every beer tells a story, and his starts with the hop bine.</p>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.about-page h1, .about-page h2 {
  text-align: center;
}
.about-page p {
  margin-bottom: 1rem;
  line-height: 1.8;
}

.brewers {
  margin-top: 3rem;
}
.brewer-profiles {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}
.brewer-card {
  text-align: center;
}
.brewer-img {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 1rem;
  border: 4px solid var(--primary-color);
}
</style>
