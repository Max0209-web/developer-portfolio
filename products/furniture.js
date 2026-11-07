const featured = storefronts.nord.items.find(item => item.id === 'lin');
const swatches = ['#45634e', '#d2b58e', '#514b4a'];
const finishes = document.getElementById('featured-options');
const priceLabel = document.getElementById('featured-price');
const detailsButton = document.getElementById('featured-details');
const priceFormat = new Intl.NumberFormat('ru-RU', {
  style: 'currency', currency: 'RUB', maximumFractionDigits: 0,
});
const finishButtons = featured.options.map(([name, extra], index) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.setAttribute('aria-pressed', String(index === 0));
  const sample = document.createElement('span');
  sample.className = 'fabric-sample';
  sample.style.backgroundColor = swatches[index];
  sample.setAttribute('aria-hidden', 'true');
  button.append(sample, name);
  button.addEventListener('click', () => {
    for (const choice of finishButtons) {
      choice.setAttribute('aria-pressed', String(choice === button));
    }
    detailsButton.dataset.option = String(index);
    priceLabel.textContent = priceFormat.format(featured.price + extra);
  });
  return button;
});
finishes.append(...finishButtons);
