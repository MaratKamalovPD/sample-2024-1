const btn = document.getElementById('btn');
  
btn.addEventListener('click', (event) => {
  const titles = document.getElementsByClassName('title');
  titles[0].style.color = 'red';
  event.stopImmediatePropagation();
});

btn.addEventListener('click', () => {
  const titles = document.getElementsByClassName('title');
  titles[0].style.fontSize = '54px';
});
