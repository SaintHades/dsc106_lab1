let data = [];
let xScale, yScale;
let selectedCommits = [];
let commitProgress = 100;
let timeScale; 
let commits = [];

let ITEM_HEIGHT = 50; 
let VISIBLE_COUNT = 4;

let FILE_ITEM_HEIGHT = 50;
let FILE_VISIBLE_COUNT = 4;

async function loadData() {
    data = await d3.csv('loc.csv', (row) => ({
      ...row,
      line: Number(row.line), // or just +row.line
      depth: Number(row.depth),
      length: Number(row.length),
      date: new Date(row.date + 'T00:00' + row.timezone),
      datetime: new Date(row.datetime),
    }));
    displayStats();
    timeScale = d3.scaleTime()
      .domain(d3.extent(commits, d => d.datetime))
      .range([0, 100]);
    createScatterplot();
  }

document.addEventListener('DOMContentLoaded', async () => {
  await loadData();

  scrollContainer = d3.select('#scroll-container');
  spacer = d3.select('#spacer');
  itemsContainer = d3.select('#items-container');
  NUM_ITEMS = commits.length;
  totalHeight = (NUM_ITEMS - 1) * ITEM_HEIGHT;
  spacer.style('height', `${totalHeight}px`);

  scrollContainer.on('scroll', () => {
    const scrollTop = scrollContainer.property('scrollTop');
    let startIndex = Math.floor(scrollTop / ITEM_HEIGHT);
    startIndex = Math.max(0, Math.min(startIndex, commits.length - VISIBLE_COUNT));
    renderItems(startIndex);
  });

  FILE_NUM_ITEMS = commits.length;
  fileTotalHeight = (FILE_NUM_ITEMS - 1) * FILE_ITEM_HEIGHT;
  fileScrollContainer = d3.select('#file-scroll-container');
  fileSpacer = d3.select('#file-spacer');
  fileItemsContainer = d3.select('#file-items-container');
  fileSpacer.style('height', `${fileTotalHeight}px`);

  fileScrollContainer.on('scroll', () => {
    const scrollTop = fileScrollContainer.property('scrollTop');
    let startIndex = Math.floor(scrollTop / FILE_ITEM_HEIGHT);
    startIndex = Math.max(0, startIndex);
    renderFileItems(startIndex);
  });
  renderItems(0);
  renderFileItems(0);
});

function processCommits() {
    commits = d3
      .groups(data, (d) => d.commit)
      .map(([commit, lines]) => {
        let first = lines[0];
        let { author, date, time, timezone, datetime } = first;
        let ret = {
          id: commit,
          url: 'https://github.com/vis-society/lab-7/commit/' + commit,
          author,
          date,
          time,
          timezone,
          datetime,
          hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
          totalLines: lines.length,
        };
  
        Object.defineProperty(ret, 'lines', {
          value: lines,
          // What other options do we need to set?
          // Hint: look up configurable, writable, and enumerable
          configurable: false,
          writable: false,
          enumerable: false,
        });
  
        return ret;
    });
}

function displayStats() {
    // Process commits first
    processCommits();
  
    // Create the dl element
    const dl = d3.select('#stats').append('dl').attr('class', 'stats');
  
    // Add total LOC
    dl.append('dt').html('Total <abbr title="Lines of code">LOC</abbr>');
    dl.append('dd').text(data.length);
  
    // Add total commits
    dl.append('dt').text('Total commits');
    dl.append('dd').text(commits.length);
  
    // Add more stats as needed...
    const fileCount = d3.groups(data, d => d.file).length;
    dl.append('dt').text('Files');
    dl.append('dd').text(fileCount);

    const maxDepth = d3.max(data, d => d.depth);
    dl.append('dt').text('Max Depth');
    dl.append('dd').text(maxDepth);
  
    const longestLineLength = d3.max(data, d => d.length);
    dl.append('dt').text('Longest Line');
    dl.append('dd').text(longestLineLength);
  
    const maxLinesInCommit = d3.max(commits, c => c.totalLines);
    dl.append('dt').text('Max Lines in Commit');
    dl.append('dd').text(maxLinesInCommit);
}

function createScatterplot() {
  processCommits()

  const width = 1000;
  const height = 600;
  const margin = { top: 10, right: 10, bottom: 30, left: 20 };

  const svg = d3
    .select('#chart')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible');

  xScale = d3
    .scaleTime()
    .domain(d3.extent(commits, (d) => d.datetime))
    .range([0, width])
    .nice();

  yScale = d3.scaleLinear().domain([0, 24]).range([height, 0]);

  const dots = svg.append('g').attr('class', 'dots');

  const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
  const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([2, 30]);

  const sortedCommits = d3.sort(commits, (d) => -d.totalLines);

  dots
    .selectAll('circle')
    .data(sortedCommits)
    .join('circle')
    .attr('cx', (d) => xScale(d.datetime))
    .attr('cy', (d) => yScale(d.hourFrac))
    .attr('r', (d) => rScale(d.totalLines))
    .style('fill-opacity', 0.7)
    .attr('fill', 'steelblue')
    .on('mouseenter', (event, commit) => {
      updateTooltipContent(commit);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
      d3.select(event.currentTarget).classed('selected', isCommitSelected(commit));
    })
    .on('mouseleave', (event, commit) => {
      updateTooltipContent({});
      updateTooltipVisibility(false);
      d3.select(event.currentTarget).classed('selected', false);
    });

    const usableArea = {
      top: margin.top,
      right: width - margin.right,
      bottom: height - margin.bottom,
      left: margin.left,
      width: width - margin.left - margin.right,
      height: height - margin.top - margin.bottom,
    };

    // Update scales with new ranges
    xScale.range([usableArea.left, usableArea.right]);
    yScale.range([usableArea.bottom, usableArea.top]);

    // Create the axes
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale).tickFormat((d) => String(d % 24).padStart(2, '0') + ':00');

    // Add X axis
    svg
      .append('g')
      .attr('transform', `translate(0, ${usableArea.bottom})`)
      .call(xAxis);

    // Add Y axis
    svg
      .append('g')
      .attr('transform', `translate(${usableArea.left}, 0)`)
      .call(yAxis);

    // Add gridlines BEFORE the axes
    const gridlines = svg
    .append('g')
    .attr('class', 'gridlines')
    .attr('transform', `translate(${usableArea.left}, 0)`);

    // Create gridlines as an axis with no labels and full-width ticks
    gridlines.call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width));

    brushSelector();
}

function updateTooltipContent(commit) {
  const link = document.getElementById('commit-link');
  const date = document.getElementById('commit-date');

  if (Object.keys(commit).length === 0) return;

  link.href = commit.url;
  link.textContent = commit.id;
  date.textContent = commit.datetime?.toLocaleString('en', {
    dateStyle: 'full',
  });
}

function updateTooltipPosition(event) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.style.left = `${event.clientX}px`;
  tooltip.style.top = `${event.clientY}px`;
}

function updateTooltipVisibility(isVisible) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.hidden = !isVisible;
}

function brushSelector() {
  const svg = document.querySelector('svg');
  // Create brush
  d3.select(svg).call(d3.brush().on('start brush end', brushed));

  // Raise dots and everything after overlay
  d3.select(svg).selectAll('.dots, .overlay ~ *').raise();
}

let brushSelection = null;

function brushed(evt) {
  brushSelection = evt.selection;
  selectedCommits = !brushSelection
    ? []
    : commits.filter((commit) => {
        const min = { x: brushSelection[0][0], y: brushSelection[0][1] };
        const max = { x: brushSelection[1][0], y: brushSelection[1][1] };
        const x = xScale(commit.datetime);
        const y = yScale(commit.hourFrac);
        return x >= min.x && x <= max.x && y >= min.y && y <= max.y;
      });
  updateSelection();
  updateSelectionCount();
  updateLanguageBreakdown();
}

function isCommitSelected(commit) {
  return selectedCommits.includes(commit);
}

function updateSelection() {
  // Update visual state of dots based on selection
  d3.selectAll('circle').classed('selected', (d) => isCommitSelected(d));
}

function updateSelectionCount() {
  const selectedCommits = brushSelection
    ? commits.filter(isCommitSelected)
    : [];

  const countElement = document.getElementById('selection-count');
  countElement.textContent = `${
    selectedCommits.length || 'No'
  } commits selected`;

  return selectedCommits;
}

function updateLanguageBreakdown() {
  const selectedCommits = brushSelection
    ? commits.filter(isCommitSelected)
    : [];
  const container = document.getElementById('language-breakdown');

  if (selectedCommits.length === 0) {
    container.innerHTML = '';
    return;
  }
  const requiredCommits = selectedCommits.length ? selectedCommits : commits;
  const lines = requiredCommits.flatMap((d) => d.lines);

  // Use d3.rollup to count lines per language
  const breakdown = d3.rollup(
    lines,
    (v) => v.length,
    (d) => d.type
  );

  // Update DOM with breakdown
  container.innerHTML = '';

  for (const [language, count] of breakdown) {
    const proportion = count / lines.length;
    const formatted = d3.format('.1~%')(proportion);

    container.innerHTML += `
            <dt>${language}</dt>
            <dd>${count} lines (${formatted})</dd>
        `;
  }

  return breakdown;
}


function updateTimeDisplay() {
  const timeSlider = document.getElementById('timeSlider');
  commitProgress = Number(timeSlider.value);
  
  const commitMaxTime = timeScale.invert(commitProgress);
  const selectedTimeElem = document.getElementById('selectedTime');
  selectedTimeElem.textContent = commitMaxTime.toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" });
  
  const filteredCommits = commits.filter(d => d.datetime <= commitMaxTime);
  updateScatterplot(filteredCommits);
  updateFilesVisualization(filteredCommits);
}

function updateScatterplot(filteredCommits) {
  d3.select('svg').remove();

  const width = 1000;
  const height = 600;
  const margin = { top: 10, right: 10, bottom: 30, left: 20 };

  const svg = d3.select('#chart')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible');

  xScale = d3.scaleTime()
    .domain(d3.extent(filteredCommits, d => d.datetime))
    .range([0, width])
    .nice();

  yScale = d3.scaleLinear().domain([0, 24]).range([height, 0]);

  const dots = svg.append('g').attr('class', 'dots');

  const [minLines, maxLines] = d3.extent(filteredCommits, d => d.totalLines);
  const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([2, 30]);

  dots.selectAll('circle')
    .data(filteredCommits)
    .join('circle')
    .attr('cx', d => xScale(d.datetime))
    .attr('cy', d => yScale(d.hourFrac))
    .attr('r', d => rScale(d.totalLines))
    .style('fill-opacity', 0.7)
    .attr('fill', 'steelblue')
    .on('mouseenter', (event, commit) => {
      updateTooltipContent(commit);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
      d3.select(event.currentTarget).classed('selected', isCommitSelected(commit));
    })
    .on('mouseleave', (event, commit) => {
      updateTooltipContent({});
      updateTooltipVisibility(false);
      d3.select(event.currentTarget).classed('selected', false);
    });

  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };

  xScale.range([usableArea.left, usableArea.right]);
  yScale.range([usableArea.bottom, usableArea.top]);

  const xAxis = d3.axisBottom(xScale);
  svg.append('g')
    .attr('transform', `translate(0, ${usableArea.bottom})`)
    .call(xAxis);

  const yAxis = d3.axisLeft(yScale)
    .tickFormat(d => String(d % 24).padStart(2, '0') + ':00');
  svg.append('g')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .call(yAxis);

  const gridlines = svg.append('g')
    .attr('class', 'gridlines')
    .attr('transform', `translate(${usableArea.left}, 0)`);
  gridlines.call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width));

  brushSelector();
}

let fileTypeColors = d3.scaleOrdinal(d3.schemeTableau10);

function updateFilesVisualization(filteredCommits) {
  let lines = filteredCommits.flatMap(d => d.lines);
  
  let files = d3.groups(lines, d => d.file)
    .map(([name, lines]) => ({ name, lines }));
  
  files = d3.sort(files, d => -d.lines.length);
  
  const filesSelection = d3.select('.files');
  filesSelection.selectAll('div').remove();
  
  let filesContainer = filesSelection
    .selectAll('div')
    .data(files)
    .enter()
    .append('div');
  
  filesContainer.append('dt')
    .html(d => `<code>${d.name}</code><small>${d.lines.length} lines</small>`);
  
  let dd = filesContainer.append('dd');
  
  dd.selectAll('div')
    .data(d => d.lines)
    .enter()
    .append('div')
    .attr('class', 'line')
    .style('background', d => fileTypeColors(d.type));
}

function renderItems(startIndex) {
  itemsContainer.selectAll('div').remove();
  const endIndex = Math.min(startIndex + VISIBLE_COUNT, commits.length);
  let newCommitSlice = commits.slice(startIndex, endIndex);
  
  updateScatterplot(newCommitSlice);

  itemsContainer.selectAll('div')
    .data(commits)
    .enter()
    .append('div')
    .attr('class', 'item')
    .html((d, idx) => `
      <p>
        On ${d.datetime.toLocaleString("en-US", { dateStyle: "full", timeStyle: "short" })}, I made 
        <a href="${d.url}" target="_blank">
          ${idx > 0 ? 'another glorious commit' : 'my first commit, and it was glorious'}
        </a>.
        I edited ${d.totalLines} lines.
      </p>
    `)
    .style('position', 'relative')
    .style('top', (_, idx) => `${idx * ITEM_HEIGHT}px`)

}

function displayCommitFiles(filteredCommits) {
  const lines = filteredCommits.flatMap((d) => d.lines);
  let fileTypeColors = d3.scaleOrdinal(d3.schemeTableau10);
  let files = d3.groups(lines, (d) => d.file).map(([name, lines]) => {
    return { name, lines };
  });
  files = d3.sort(files, (d) => -d.lines.length);
  d3.select('.files').selectAll('div').remove();
  let filesContainer = d3.select('.files').selectAll('div').data(files).enter().append('div');
  filesContainer.append('dt').html(d => `<code>${d.name}</code><small>${d.lines.length} lines</small>`);
  filesContainer.append('dd')
                .selectAll('div')
                .data(d => d.lines)
                .enter()
                .append('div')
                .attr('class', 'line')
                .style('background', d => fileTypeColors(d.type));
}

function renderFileItems(startIndex) {
  fileItemsContainer.selectAll('div').remove();

  const endIndex = Math.min(startIndex + VISIBLE_COUNT, commits.length);
  let newCommitSlice = commits.slice(startIndex, endIndex);

  let [minTime, maxTime] = d3.extent(newCommitSlice, d => d.datetime);
  const filteredCommits = commits.filter(d => d.datetime <= maxTime && d.datetime >= minTime);

  displayCommitFiles(filteredCommits);
  
  fileItemsContainer.selectAll('div')
    .data(commits)
    .enter()
    .append('div')
    .attr('class', 'item')
    .html((d, idx) => `
      <p>
        On ${d.datetime.toLocaleString("en-US", { dateStyle: "full", timeStyle: "short" })}, I made 
        <a href="${d.url}" target="_blank">
          ${idx > 0 ? 'another glorious commit' : 'my first commit, and it was glorious'}
        </a>.
        I edited ${d.totalLines} lines.
      </p>
    `)
    .style('position', 'relative')
    .style('top', (_, idx) => `${idx * FILE_ITEM_HEIGHT}px`);
}