console.log('lolkek');
const rootElement = document.getElementById('root');
const menuElement = document.createElement('aside');
const pageElement = document.createElement('main');

rootElement.appendChild(menuElement);
rootElement.appendChild(pageElement);


const config = {
  menu: {
    feed: {
      href: '/feed',
      text: 'Лента',
      render: renderFeed,
    },
    login: {
      href: '/login',
      text: 'Авторизоваться',
      render: renderLogin,
    },
    signup: {
      href: '/signup',
      text: 'Регистрация',
      render: renderSignup
    },
    profile: {
      href: '/profile',
      text: 'Профиль',
      render: renderProfile,
    }
  }
};

const state = {
  activeMenuLink: null,
  menuElements: {},
}

function renderMenu() {
  Object
      .entries(config.menu)
      .forEach(([key, {href, text}], index) => {
        const menuLink = document.createElement('a');
        menuLink.href = href;
        menuLink.textContent = text;
        menuLink.dataset.section = key;

        menuElement.appendChild(menuLink)

        state.menuElements[key] = menuLink;
      })
  ;

  menuElement.addEventListener('click', (e) => {
    const {target} = e;

    if (target.tagName.toLowerCase() === 'a'|| target instanceof HTMLAnchorElement) {
      e.preventDefault();

      goToPage(target);
    }
  });
}



function ajax(method, url, body = null, callback) {
  const xhr = new XMLHttpRequest();
  xhr.open(method, url, true);
  xhr.withCredentials = true;

  xhr.addEventListener('readystatechange', function () {
    if (xhr.readyState !== XMLHttpRequest.DONE) return;

    callback(xhr.status, xhr.responseText);
  });

  if (body) {
    xhr.setRequestHeader('Content-type', 'application/json; charset=utf8');
    xhr.send(JSON.stringify(body));
    return;
  }

  xhr.send();
}

function createInput(type, text, name) {
  const input = document.createElement('input');
  input.type = type;
  input.name = name;
  input.placeholder = text;

  return input;
}

function renderLogin() {
  const form = document.createElement('form');

  const emailInput = createInput('email', 'Емайл', 'email');
  const passwordInput = createInput('password', 'Пароль', 'password');

  const submitBtn = document.createElement('input');
  submitBtn.type = 'submit';
  submitBtn.value = 'Войти!';

  form.appendChild(emailInput);
  form.appendChild(passwordInput);
  form.appendChild(submitBtn);

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    ajax(
      'POST',
      '/login',
        {password, email},
        (status) => {
            if(status === 200) {
              goToPage(state.menuElements.profile);
              return;
            }

            alert('НЕВЕРНЫЙ ЕМЕЙЛ ИЛИ ПАРОЛЬ');
        }
    );
  })

  return form;
}

function renderSignup() {
  const form = document.createElement('form');

  const emailInput = createInput('email', 'Емайл', 'email');
  const passwordInput = createInput('password', 'Пароль', 'password');
  const ageInput = createInput('number', 'Возраст', 'age');

  const submitBtn = document.createElement('input');
  submitBtn.type = 'submit';
  submitBtn.value = 'Зарегистрироваться!';

  form.appendChild(emailInput);
  form.appendChild(passwordInput);
  form.appendChild(ageInput);
  form.appendChild(submitBtn);

  return form;
}

function renderFeed() {
  const feedElement = document.createElement('div');

  ajax(
      'GET',
      '/feed',
      null,
      (status, responseString) => {
        let isAuthorized = status === 200;

        if (!isAuthorized) {
          alert('Нет авторизации!');
          goToPage(state.menuElements.login);
          return;
        }

        const images = JSON.parse(responseString);

        if (images && Array.isArray(images)) {
          const div = document.createElement('div');
          feedElement.appendChild(div);

          images.forEach(({src, likes}) => {
            div.innerHTML += `<img src="${src}" width="500" /><div>${likes} лайков</div>`;
          });
        }
      }
  );

  return feedElement;
}

function goToPage(menuLinkElement) {
  pageElement.innerHTML = '';

  state.activeMenuLink?.classList.remove('active');
  menuLinkElement.classList.add('active');
  state.activeMenuLink = menuLinkElement;

  const element = config.menu[menuLinkElement.dataset.section].render();

  pageElement.appendChild(element);
}

function renderProfile() {
  const profileElement = document.createElement('div');

  ajax(
      'GET',
      '/me',
      null,
      (status, responseString) => {
        const isAuthorized = status === 200;

        if (!isAuthorized) {
          alert('АХТУНГ! нет авторизации');
          goToPage(state.menuElements.login);
          return;
        }

        const {email, age, images} = JSON.parse(responseString);

        const span = document.createElement('span');
        span.textContent = `${email} ${age} лет`;
        profileElement.appendChild(span);

        if (images && Array.isArray(images)) {
          const div = document.createElement('div');
          profileElement.appendChild(div);

          images.forEach(({src, likes}) => {
            div.innerHTML += `<img src="${src}" width="500"/><div>${likes} лайков</div>`
          });
        }
      }
  )

  return profileElement;
}


renderMenu();
goToPage(state.menuElements.feed);
