const request = async (path = 'http://localhost:3000/', method = 'GET', payload = {}, queryObj = {}, headers = {}) => {
  let url = path;
  const queryParams = Object.keys(queryObj).reduce((acc, key, index, arr) => {
    let str = `${key}=${queryObj[key]}`;
    if (index < arr.length - 1) str += '&';
    return acc += str;
  }, '');
  if (queryParams) url += '?' + queryParams;
  const tokenStr = localStorage.getItem('token') || '';
  if (tokenStr) {
    const { token } = JSON.parse(tokenStr);
    headers.token = token;
  };
  const init = { method, headers };
  if (method === 'PUT' || method === 'POST') {
    headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(payload);
  }
  try {
    const response = await fetch(url, init).then(res => res.json());
    return response; // response === { result: 'value', statusCode: 200 }
  } catch (err) {
    console.log(err);
  }
};

const displayError = (div, msg) => {
  div.style.display = 'block';
  div.innerHTML = '<p>' + msg + '</p>';
};

const setLoggedInClass = (isLoggedIn) => {
  const body = document.querySelector('body');
  isLoggedIn
    ? body.classList.add('loggedIn')
    : body.classList.remove('loggedIn');
};

const getToken = () => {
  const token = localStorage.getItem('token');
  setLoggedInClass(!!token);
  return token;
};

const updateToken = (tokenStr) => {
  const tokenObj = JSON.parse(tokenStr);
  const { token } = tokenObj;
  request('http://localhost:3000/api/tokens', 'PUT', { token, shouldExtend: true })
    .then(({ result: tokenData, statusCode }) => {
      if (statusCode !== 200) setLoggedInClass(false);
      const newTokenStr = JSON.stringify(tokenData);
      localStorage.setItem('token', newTokenStr);
      setLoggedInClass(true);
    }).catch(console.log);
};

const periodicTokenRenew = () => {
  const interval = setInterval(() => {
    const tokenStr = getToken();
    if (!tokenStr) return clearInterval(interval);
    updateToken(tokenStr);
  }, 1000 * 60);
};

const getForm = () => {
  const form = document.querySelector('form');
  form && form.addEventListener('submit', (e) => {
    e.preventDefault();
    const errDiv = document.querySelector(`#${form.id} .formError`);
    const { elements, action, method } = form;
    const payload = {};
    for (const element of elements) {
      let { name, value, type } = element;
      if (type === 'submit') continue;
      if (type === 'checkbox') {
        payload[name] = element.checked;
        continue;
      }
      if (type === 'tel') value = value.split('').filter(e => e !== ' ').join('');
      payload[name] = value;
    }
    return request(action, method.toUpperCase(), payload)
      .then(({ result, statusCode }) => {
        if (statusCode !== 200) return displayError(errDiv, result);
        errDiv.display = 'none';
        if (form.id === 'accountCreate') {
          const { password, phone } = payload;
          return request('http://localhost:3000/api/tokens', 'POST', { password, phone });
        }
        return { result, statusCode };
      }).then(({ result, statusCode }) => {
        if (statusCode !== 200) {
          setLoggedInClass(false);
          return displayError(errDiv, result);
        }
        errDiv.display = 'none';

        const str = JSON.stringify(result);
        localStorage.setItem('token', str);
        setLoggedInClass(true);
        window.location = 'http://localhost:3000/';
      }).catch(console.log);
  });
};

const deleteToken = () => {
  const tokenStr = getToken();
  const { token } = JSON.parse(tokenStr);
  localStorage.removeItem('token');
  setLoggedInClass(false);
  return request('http://localhost:3000/api/tokens', 'DELETE', {}, { token })
    .then(({ result, statusCode }) => {
      if (statusCode !== 200) {
        console.log(result);
        return;
      }
      window.location = 'http://localhost:3000/';
    }).catch(console.log);
};

const getLogoutButton = () => {
  const logoutButton = document.querySelector("#logout");
  logoutButton && logoutButton.addEventListener('click', deleteToken);
};

const checkToken = () => {
  const tokenStr = getToken();
  if (tokenStr) {
    const { expires } = JSON.parse(tokenStr);
    if (Date.now() > expires) {
      localStorage.removeItem('token');
      setLoggedInClass(false);
    }
  }
};

const getEditForm = () => {
  const editForm = document.querySelector('form#accountEdit');
  if (editForm) {
    const { elements } = editForm;
    const tokenStr = getToken();
    const { token, phone } = JSON.parse(tokenStr);

    request('http://localhost:3000/api/users', 'GET', {}, { phone }, { token })
      .then(({ result, statusCode }) => {
        if (statusCode !== 200) return displayError(errDiv, result);
        for (const element of elements) {
          let { name } = element;
          if (element.type === 'checkbox') {
            element.checked = true;
            continue;
          }
          element.value = result[name] || '';
        };
      }).catch(console.log);

    editForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const errDiv = document.querySelector(`#${editForm.id} .formError`);
      const { elements, action } = editForm;
      console.dir({ elements, action });
      const payload = {};
      for (const element of elements) {
        let { name, value, type } = element;
        if (type === 'submit') continue;
        if (type === 'checkbox') {
          payload[name] = element.checked;
          continue;
        }
        payload[name] = value;
      }
      const tokenStr = getToken();
      const { token, phone } = JSON.parse(tokenStr);
      request(action, 'PUT', payload, { phone }, { token })
        .then(({ result, statusCode }) => {
          if (statusCode !== 200) {
            if (statusCode !== 200) return displayError(errDiv, result);
            errDiv.display = 'none';
          }
          window.location = 'http://localhost:3000/';
        }).catch(console.log);
    });
  }
};

const getDeleteButton = () => {
  const confirmDeletion = document.querySelector('button#deleteAccount');
  confirmDeletion && confirmDeletion.addEventListener('click', (e) => {
    const tokenStr = getToken();
    const { token, phone } = JSON.parse(tokenStr);
    request('http://localhost:3000/api/users', 'DELETE', {}, { phone }, { token })
      .then(({ result, statusCode }) => {
        if (statusCode !== 200) console.log(result);
        localStorage.removeItem('token');
        window.location = 'http://localhost:3000/';
      }).catch(console.log);
  });
};

window.onload = () => {
  getForm();
  periodicTokenRenew();
  getToken();
  getLogoutButton();
  checkToken();
  getEditForm();
  getDeleteButton();
};