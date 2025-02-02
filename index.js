import { fetchJSON, renderProjects, fetchGitHubData } from './global.js';

async function loadProjects() {
    try {
        const projects = await fetchJSON('./lib/projects.json');
        const latestProjects = projects.slice(0, 3);
        const projectsContainer = document.querySelector('.projects');

        if (!projectsContainer) {
            console.error('Error: No element with class "projects" found.');
            return;
        }

        if (!projects || projects.length === 0) {
            projectsContainer.innerHTML = `<p>No projects available at the moment.</p>`;
            return;
        }


        renderProjects(latestProjects, projectsContainer, 'h3');

    } catch (error) {
        console.error('Error loading projects:', error);
    }
}

async function loadGitHubData() {
    const githubData = await fetchGitHubData('SaintHades');
    const profileStats = document.querySelector('#profile-stats');

    if (profileStats) {
        profileStats.innerHTML = `
              <dl>
                <dt>Public Repos:</dt><dd>${githubData.public_repos}</dd>
                <dt>Public Gists:</dt><dd>${githubData.public_gists}</dd>
                <dt>Followers:</dt><dd>${githubData.followers}</dd>
                <dt>Following:</dt><dd>${githubData.following}</dd>
              </dl>
          `;
      }
}

loadProjects();
loadGitHubData();