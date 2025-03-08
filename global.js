console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

let pages = [
    { url: '', title: 'Home' },
    { url: 'projects/', title: 'Porjects' },
    { url: 'CV/', title: 'CV' },
    { url: 'contact/', title: 'Contact' },
    { url: 'meta/', title: 'Meta' },
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
            <option value="light dark" selected>Automatic (${currentTheme.charAt(0).toUpperCase() + currentTheme.slice(1)})</option>
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
contact?.addEventListener("submit", function (event) {
    event.preventDefault();
    let data = new FormData(contact);
    let url = contact.action + "?";
    for (let [name, value] of data) {
        console.log(name, value);
        url += `${encodeURIComponent(name)}=${encodeURIComponent(value)}&`;
    }
    url = url.slice(0, -1);

    location.href = url +"?";

});






export async function fetchJSON(url) {
    try {
        // Fetch the JSON file from the given URL
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch projects: ${response.statusText}`);
        }
        console.log(response)
        const data = await response.json();
        return data; 

    } catch (error) {
        console.error('Error fetching or parsing JSON data:', error);
    }

    
}

export function renderProjects(projects, containerElement, headingLevel = 'h2') {
    if (!(containerElement instanceof HTMLElement)) {
        console.error("Invalid container element provided.");
        return;
    }
    const validHeadings = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
    if (!validHeadings.includes(headingLevel)) {
        console.warn(`Invalid heading level "${headingLevel}". Defaulting to "h2".`);
        headingLevel = 'h2';
    }
    containerElement.innerHTML = '';
    projects.forEach(project => {
        const article = document.createElement('article');
        article.innerHTML = `
            <${headingLevel}>${project.title}</${headingLevel}>
            <img src="${project.image}" alt="${project.title}">
            <p id="summary">${project.description}</p>
            <p id="year">est. ${project.year}</p>
        `;
        containerElement.appendChild(article);
    });
}

export async function fetchGitHubData(username) {
    return fetchJSON(`https://api.github.com/users/${username}`);
}