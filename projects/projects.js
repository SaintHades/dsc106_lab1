import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";

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

        let query = '';
        let selected = {
            selectedIndex: -1,
            allprojects: projects,
            filteredByYear: projects,
            filtered: projects
        }

        let searchInput = document.querySelector('.searchBar');

        renderPieChart(selected);

        searchInput.addEventListener('input', (event) => {
            // update query value
            query = event.target.value;
            // TODO: filter the projects
            let filteredProjects = selected.allprojects.filter((project) => {
                let values = Object.values(project).join('\n').toLowerCase();
                return values.includes(query.toLowerCase());
            });
            selected.filtered = filteredProjects;
            
            let filteredProjectsByYear = selected.filteredByYear.filter((project) => {
                let values = Object.values(project).join('\n').toLowerCase();
                return values.includes(query.toLowerCase());
            });
            
            renderProjects(filteredProjectsByYear, projectsContainer, 'h2');
            renderPieChart(selected);

            let svg = d3.select('svg');
            let legend = d3.select('.legend');
            svg
                .selectAll('path')
                .attr('class', (_, idx) => (
                    (idx === selected.selectedIndex ? 'selected' : '')
                ));
            legend
                .selectAll('li')
                .attr('class', (_, idx) => (
                    (idx === selected.selectedIndex ? 'selected' : '')
                ));

        });


    } catch (error) {
        console.error('Error loading projects:', error);
    }
}

function renderPieChart(selected) {
    let projectsGiven = selected.filtered;
    // re-calculate rolled data
    let newRolledData = d3.rollups(
      projectsGiven,
      (v) => v.length,
      (d) => d.year,
    );
    // re-calculate data
    let newData = newRolledData.map(([year, count]) => {
        return { value: count, label: year };
    });
    // re-calculate slice generator, arc data, arc, etc.
    let newSliceGenerator = d3.pie().value((d) => d.value);
    let newArcData = newSliceGenerator(newData);
    let newArcs = newArcData.map((d) => d3.arc().innerRadius(0).outerRadius(50)(d));
    // TODO: clear up paths and legends
    let svg = d3.select('svg');
    let legend = d3.select('.legend');
    svg.selectAll("path").remove();
    legend.selectAll("li").remove();

    // update paths and legends, refer to steps 1.4 and 2.2
    let colors = d3.scaleOrdinal(d3.schemeTableau10);
    newArcs.forEach((arc, idx) => {
        svg
        .append('path')
        .attr('d', arc)
        .attr('fill', colors(idx))
        .on('click', () => {
            selected.selectedIndex = selected.selectedIndex === idx ? -1 : idx;
            selected.filteredByYear = selected.selectedIndex === -1
                    ? selected.allprojects
                    : selected.allprojects.filter(p => p.year === newData[selected.selectedIndex].label);

            svg
                .selectAll('path')
                .attr('class', (_, idx) => (
                    (idx === selected.selectedIndex ? 'selected' : '')
                ));

            legend
                .selectAll('li')
                .attr('class', (_, idx) => (
                    (idx === selected.selectedIndex ? 'selected' : '')
                ));

            let filteredProjects = selected.selectedIndex === -1
                ? selected.filtered
                : selected.filtered.filter(p => p.year === newData[selected.selectedIndex].label);
            renderProjects(filteredProjects, document.querySelector('.projects'), 'h2');

        });
    })

    newData.forEach((d, idx) => {
        legend.append('li')
            .attr('style', `--color:${colors(idx)}`)
            .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
            .on('click', () => {
                selected.selectedIndex = selected.selectedIndex === idx ? -1 : idx;
                selected.filteredByYear = selected.selectedIndex === -1
                        ? selected.allprojects
                        : selected.allprojects.filter(p => p.year === newData[selected.selectedIndex].label);

                svg
                    .selectAll('path')
                    .attr('class', (_, idx) => (
                        (idx === selected.selectedIndex ? 'selected' : '')
                    ));

                legend
                    .selectAll('li')
                    .attr('class', (_, idx) => (
                        (idx === selected.selectedIndex ? 'selected' : '')
                    ));

                let filteredProjects = selected.selectedIndex === -1
                    ? selected.filtered
                    : selected.filtered.filter(p => p.year === newData[selected.selectedIndex].label);
                renderProjects(filteredProjects, document.querySelector('.projects'), 'h2');

            });
            
    })
  }

loadProjects();