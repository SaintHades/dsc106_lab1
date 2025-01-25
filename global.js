console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

// let navLinks = $$("nav a");

// let currentLink = navLinks.find(
//     (a) => a.host === location.host && a.pathname === location.pathname
// );

// currentLink?.classList.add('current');

let pages = [
    { url: '', title: 'Home' },
    { url: 'projects/', title: 'Porjects' },
    { url: 'CV/', title: 'CV' },
    { url: 'contact/', title: 'Contact' },
    { url: 'https://github.com/SaintHades', title: 'Github' },
];

let nav = document.createElement('nav');
document.body.prepend(nav);
const ARE_WE_HOME = document.documentElement.classList.contains('home');
for (let p of pages) {
    let url = !ARE_WE_HOME && !p.url.startsWith('http') ? '../' + p.url : p.url;
    let title = p.title;

    let a = document.createElement('a');
    a.href = url;
    a.textContent = title;
    if (a.host !== location.host) {
        a.target = "_blank";
    }
    if (a.host === location.host && a.pathname === location.pathname) {
        a.classList.add('current');
    }
    nav.append(a);
}

let currentTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

document.body.insertAdjacentHTML(
    'afterbegin',
    `
    <label class="color-scheme">
        Theme:
        <select>
            <option value="light dark" selected>Automatic (${currentTheme})</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
        </select>
    </label>`
);

const select = document.querySelector(".color-scheme select");
select.addEventListener('input', function (event) {
    console.log('color scheme changed to', event.target.value);
    document.documentElement.style.setProperty('color-scheme', event.target.value);
    localStorage.colorScheme = event.target.value;
});

if ('colorScheme' in localStorage) {
    const savedScheme = localStorage.colorScheme;
    document.documentElement.style.setProperty('color-scheme', savedScheme);
    select.value = savedScheme;
}

const contact = document.querySelector("form.contact");
console.log(contact.action, 1);
contact?.addEventListener("submit", function (event) {
    event.preventDefault();
    let data = new FormData(contact);
    let url = contact.action + "?";
    console.log(url);
    for (let [name, value] of data) {
        console.log(name, value);
        url += `${encodeURIComponent(name)}=${encodeURIComponent(value)}&`;
    }
    url = url.slice(0, -1);
    console.log(url +"?");

    location.href = url;

});