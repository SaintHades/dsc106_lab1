import { fetchJSON, renderProjects } from '../global.js';

async function loadProjects() {
    try {
        const projects = await fetchJSON('../lib/projects.json');
        const projectsContainer = document.querySelector('.projects');

        if (!projectsContainer) {
            console.error('Error: No element with class "projects" found.');
            return;
        }

        if (!projects || projects.length === 0) {
            projectsContainer.innerHTML = `<p>No projects available at the moment.</p>`;
            return;
        }


        renderProjects(projects, projectsContainer, 'h2');

        const projectsTitle = document.querySelector('.projects-title'); 

        if (projectsTitle) {
            projectsTitle.textContent = `${projects ? projects.length : 0} Projects`;
        } else {
            console.warn('Warning: No element with class "projects-title" found.');
        }


    } catch (error) {
        console.error('Error loading projects:', error);
    }
}

loadProjects();
