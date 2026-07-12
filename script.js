const searchBlock = document.getElementById("search-block");
const input = document.getElementById("search-input");
const mainList = document.getElementById("main-list");
let searchValue;

// получение репозиториев с fetch
function getRepositories(query) {
  const encodedQuery = encodeURIComponent(query);

  return new Promise((resolve, reject) => {
    // Полный URL-адрес эндпоинта с параметром поиска q
    fetch(`https://api.github.com/search/repositories?q=${encodedQuery}`, {
      method: "GET",
      headers: {
        // GitHub настоятельно рекомендует указывать заголовок Accept с версией API
        Accept: "application/vnd.github+json",
        // Также полезно указывать User-Agent (для браузера не обязательно, но для Node.js критично)
        // "X-GitHub-Api-Version": "2026-03-10", // или актуальную версию, например '2026-03-10'
      },
    })
      .then((response) => response.json())
      .then((repositories) => resolve(repositories))
      .catch((error) => reject(error));
  });
}

// отрисовка сохраненных элементов
function loadSavedRepositories() {
  // Проходим циклом по всему localStorage
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    // Загружаем только те ключи, которые создало наше приложение
    if (key && key.startsWith("repo__")) {
      createNewItem(key);
    }
  }
}

loadSavedRepositories();

const debounce = (fn, ms) => {
  let timeout;
  return function (...args) {
    // Собираем все аргументы (включая event) в массив
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      fn.apply(this, args);
    }, ms);
  };
};

// создание новых элементов поисковых запросов
function createSearchItem(repo) {
  if (!repo) return;

  const searchList = document.querySelector(".search__list");
  if (!searchList) return;

  const newSearchItem = document.createElement("li");
  newSearchItem.classList.add("list-search-item");

  newSearchItem.textContent = repo.name;
  newSearchItem.addEventListener("click", () => {
    const repoDataToSave = {
      name: repo.name,
      owner: repo.owner.login,
      stars: repo.stargazers_count,
    };

    const isAlreadySaved = localStorage.getItem("repo__" + repo.name);

    if (!isAlreadySaved) {
      localStorage.setItem(
        "repo__" + repo.name,
        JSON.stringify(repoDataToSave),
      );
      createNewItem("repo__" + repo.name);
    }

    input.value = "";
    searchList.innerHTML = "";
    input.focus();
  });

  searchList.append(newSearchItem);
}

// запускаем получение репозиториев по введенному значению с задержкой
function searchRepositories(event) {
  searchValue = event.target.value;

  const searchList = document.querySelector(".search__list");
  if (!searchList) return;

  searchList.innerHTML = "";

  if (searchValue === "") return; // Если инпут пустой, ничего не делаем

  console.log("Ищем репозитории для:", searchValue);

  getRepositories(searchValue)
    .then((repositories) => {
      console.log("Результаты поиска:", repositories);
      const arrayOfRepositories = repositories.items;

      // Берем первые 5 репозиториев (или меньше, если пришло меньше 5)
      const count = Math.min(5, arrayOfRepositories.length);

      for (let i = 0; i < count; i++) {
        createSearchItem(arrayOfRepositories[i]);
      }
    })
    .catch((err) => console.error("Ошибка", err));
}

// оборачиваем всю эту цепочку в debounce
let getSearchValue = debounce(searchRepositories, 500);

// вешаем один дебаунс-слушатель на инпут
input.addEventListener("keyup", getSearchValue);

const listSearchItem = document.querySelectorAll(".list-search-item");

// создание нового элемента
function createNewItem(value) {
  // Создание элемента в памяти
  const newItem = document.createElement("li");
  const mainItemWrapper = document.createElement("div");

  const itemName = document.createElement("span");
  const itemOwner = document.createElement("span");
  const itemStars = document.createElement("span");

  const deleteBtn = document.createElement("button");

  // настройка элемента перед вставкой
  newItem.classList.add("main-list__item", "item");
  mainItemWrapper.classList.add("main-item__wrapper");
  itemName.classList.add("main-list-item__text", "item-name");
  itemOwner.classList.add("main-list-item__text", "item-owner");
  itemStars.classList.add("main-list-item__text", "item-stars");

  deleteBtn.classList.add(
    "main-list-item__delete-btn",
    "delete-btn",
    "btn-reset",
  );

  const repoObject = JSON.parse(localStorage.getItem("repoDataToSave"));

  const repoName = JSON.parse(localStorage.getItem(value))?.name;
  const repoOwner = JSON.parse(localStorage.getItem(value))?.owner;
  const repoStars = JSON.parse(localStorage.getItem(value))?.stars;

  // текст
  itemName.textContent = "Name: " + repoName;
  itemOwner.textContent = "Owner: " + repoOwner;
  itemStars.textContent = "Stars: " + repoStars;

  // вставляем элементы
  mainList.append(newItem);
  newItem.prepend(mainItemWrapper);
  mainItemWrapper.append(itemName, itemOwner, itemStars);

  newItem.append(deleteBtn);

  deleteNewItem(deleteBtn, newItem, value);
}

// функция удаления пункта из списка
function deleteNewItem(button, item, name) {
  button.addEventListener("click", (event) => {
    if (event.target === button) {
      item.remove();
      localStorage.removeItem(name);
      console.log("Элемент удален из списка!");
    }
  });
}
