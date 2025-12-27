<template>
  <div class="about-page">
    <section class="card">
      <h1>À propos de la Brasserie Corto</h1>
      <p>
        Deux potes, une appétence certaine pour la bière, et une cave dans une maison du Cantal. L'aventure Corto commence en 2024 avec l'envie de brasser nos propres bières artisanales, sans prétention, pour le plaisir de partager avec nos amis et notre famille.
      </p>
      <p>
        On utilise principalement des ingrédients bio et locaux (dans la mesure du possible) et bientôt nos propres houblons cultivés dans le jardin de super Grands Parents.
        N'étant pas des professionnels, on expérimente des recettes et des techniques. Chaque brassin est une nouvelle aventure, parfois réussie, parfois moins, mais c'est ok.
        C'est pourquoi certaines bières peuvent être un peu différentes d'un lot à l'autre, avec parfois des mousses un peu trop présentes. Nous vous demandons donc de prévoir une éponge en cas de débordement. En cas de problème majeur sur votre commande, n'hésitez pas à nous contacter.
      </p>
      <p>
        Nous n'avons aucune prétention de concurrencer des professionnels, le prix des bières est donc calculé en fonction de nos coûts de production en ajoutant une petite marge pour nous permettre de racheter du matériel et des ingrédients.
      </p>
    </section>
    
    <!-- <section class="brewers">
      <h2>Meet the Brewers</h2>
      <div class="brewer-profiles">
        <div class="card brewer-card">
          <img src="https://placehold.co/200x200/d8a152/4a2c1a?text=Thomas" alt="Thomas" class="brewer-img">
          <h3></h3>
          <p></p>
        </div>
        <div class="card brewer-card">
          <img src="https://placehold.co/200x200/d8a152/4a2c1a?text=Paco" alt="Paco" class="brewer-img">
          <h3></h3>
          <p></p>
        </div>
      </div>
    </section> -->
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
