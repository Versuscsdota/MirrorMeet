const getModels = async () => {
  // Placeholder: Replace with actual API call
  return [
    {
      name: 'Иванова Анна',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuART-Umn4Y8wYTGeeGYw9i8ma-wC8RemY8exYwMUCfxRueLPBgllUB62Xso2PJWAXPn7UlePOCXp_8Ynv5sQGbBYk1WFkwfIirHm1DjgVUnHqlYVVPskeIBjgqg0Dh7AT6XgUbRnUBRCJYE2LBow5cEdszrAUQRJFeW-XnU757FDqkbKI6XRmNTjNhzD0QZZp-g8nDqXSR-cDjNZ3VmSmU6bHQGxtI_2sVhszZW3V4t386lWLyCHMvWI9Il4UEwH2XOtPunfP38Wnw',
      handle: '@ivanova_a',
      phone: '+7 123 456-78-90'
    },
    {
      name: 'Петрова Мария',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA5JRNfZxtmdEYThYaR0X0Ir_4IBfokI39hjdOw-E3_2WKUNAoiUuloKyKYzfWhrK9yEYREhi2igXAL1lmUltcfGjpfo28t5K2bmgZn3Ud3_93tosI2mjEMG8cfNDeZAhL1V_5eZtRdtoIQfqJUfTUxswexJYR7iReTHGG1FUxy-zcWKRx2LtwPAdNVWgptWbhdQvzhZHaTLUeXCs2GLJyISxkPkRsYf7I5S9O3xgpFSCQWMJf0VQivKHzh7p71kmLkWu7eOimM3ws',
      handle: '@petrova_m',
      phone: '+7 987 654-32-10'
    },
    {
      name: 'Сидорова Ольга',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB8eu_Fp2NhFa5aXVoo2Krc2iNbGW0t2dF0-rlnZB25cmAdG83TGubWNY3vYZia1G1ctvcHZm7LQnAA5_F3BJIgFxc2aaFxR_Y62UwejRF8MdCvUbIXxW4JFPWFyZCRI7cZMydpkDuRpw42j5hc97YyZn9QL0YTr-ZPG1A9fpTm2xFElNJLhwGaHfhl8VYWkrFZExJ2gvUbc11r_R_Jh9zOIiY710gMkg2My-UGlHUK9kjBjff_w7_ZAlDhyhFD7DG1vV0KH14IZuA',
      handle: '@sidorova_o',
      phone: '+7 555 123-45-67'
    },
    {
      name: 'Кузнецова Елена',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAZOvE2e7iNzZnJeucJl-ARr9Vi9lkdlnd0E_1g-aMejuW4EkuhM0MOXIi1h-JH4LC3G4wjmDfTtJSO1PB2lGphWR8eeFphb6qP85iJj9kKcHH121s-3Jze9wPgTZ6r9tVYvGmqbZ9jIFLZEQAbl3dlKNeWgWxD997oZLA2YZtS2ln4BC8x9YsG2MP7dVVxeB9k_OjzXD76re0loAPoWPJ2t0_cOkRpFDgx9DMhqLqCIASPLlaABSQifJZ5sLpm0Wx9XB4c2ZWFV-E',
      handle: '@kuznetsova_e',
      phone: '+7 777 888-99-00'
    },
    {
      name: 'Соколова Дарья',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD3XoIWDimUunBO8zB4QBbhb5GXh_8RRiUKAqJylpQ4IkOgTdoq7WxtChalL2vr4qGVlAEKg5vgC16yWXkaN6xv7DDD8eYMS-sz5FRH31FUYghxr3qkEG2BCK-a6pNPM_t5YF0ABGV0le7RyyJhDw5J9ocHv9LVtglkAoOmdlKgT4bNPn6Y6F0ZAWBbCk7anDqbMQkwEb9EQIiXIYaPjuDmIx2XK6XWtPukiCb6M3MITo-1ysygOEo8DvfY8IKqVvrZLrhBy150v8A',
      handle: '@sokolova_d',
      phone: '+7 444 555-66-77'
    },
    {
      name: 'Васильева Ирина',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA4Ck46RDYxFVb9P1I5Wr1SChtc2IHxtslI7LsK_AUb99qJYJpisSNSG_9gOp421jveHJdF9mC5tPGni3D5F27VpZZd3CFPsXMDgAHW9GUNUVzgpoar0oACYbndo89wkGluCIun8qyrGnFvEhBuq_vzZmvFwd1tAI1cU9SrHelGkLNjEPLJXa9vY19gZmWz585W0MWzJ04x-eY01pX9SYvvURRayT9rpbV-pMC1c-esicH_Mab2j74es1ROcbKruYj96Pe9FqQw6Xg',
      handle: '@vasilieva_i',
      phone: '+7 222 333-44-55'
    }
  ];
};

const renderModelCard = (model) => `
  <div class="model-card">
    <img src="${model.avatar}" alt="Model avatar" class="model-avatar">
    <p class="model-name">${model.name}</p>
    <div class="model-contacts">
      <a href="#" class="model-contact-item">
        <span class="material-symbols-rounded">send</span>
        <span>${model.handle}</span>
      </a>
      <a href="#" class="model-contact-item">
        <span class="material-symbols-rounded">call</span>
        <span>${model.phone}</span>
      </a>
    </div>
  </div>
`;

export const renderModels = async () => {
  const models = await getModels();
  return `
    <div class="models-container">
      <div class="models-header">
        <h1>Модели</h1>
        <div class="search-bar">
          <span class="material-symbols-rounded">search</span>
          <input type="text" placeholder="Поиск моделей...">
        </div>
      </div>
      <div class="models-grid">
        ${models.map(renderModelCard).join('')}
      </div>
    </div>
  `;
};
