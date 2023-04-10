const {csv, select, forceSimulation,forceManyBody,forceLink,forceCenter,scaleBand,scaleLinear,scaleSequential,max,min,extent,scaleThreshold} = d3;
const width = innerWidth;
const height = innerHeight;
const centerX = width / 2;
const centerY = height / 2;
const margin = {
    top: 100,
    right: 200,
    bottom: 200,
    left: 100,
  };
const tooltip = select('body')
    .append('div')
    .attr('class', 'tooltip')
    .style('position', 'absolute')
    .style('font', '14px sans-serif')
    .style('width', 'auto')
    .style('height', 'auto')
    .style('background-color', 'white')
    .style('border', 'solid')
    .style('border-width', '2px')
    .style('border-radius', '5px')
    .style('padding', '5px');

const tooltip_link = select('body')
    .append('div')
    .attr('class', 'tooltip')
    .style('position', 'absolute')
    .style('font', '14px sans-serif')
    .style('width', 'auto')
    .style('height', 'auto')
    .style('background-color', 'white')
    .style('border', 'solid')
    .style('border-width', '2px')
    .style('border-radius', '5px')
    .style('padding', '5px');

const tooltip_matrix = select('body')
    .append("div")
    .style("position", "absolute")
    .attr("class", "tooltip")
    .style('font', '14px sans-serif')
    .style('width', 'auto')
    .style('height', 'auto')
    .style('background-color', 'white')
    .style('border', 'solid')
    .style('border-width', '2px')
    .style('border-radius', '5px')
    .style('padding', '5px');

const svg = select('body')
    .append('svg')
    .attr('width', width/2)
    .attr('height', height);

const data = fetch("https://raw.githubusercontent.com/HKUST-VISLab/coding-challenge/master/HKUST_coauthor_graph.json")
    .then(response => response.json())
    .then(data => {
        const cseNodes = data.nodes.filter(node => node.dept === 'CSE');
        const cseEdges = data.edges.filter(edge => {
            const sourceNode = cseNodes.find(node => node.id === edge.source);
            const targetNode = cseNodes.find(node => node.id === edge.target);
            return sourceNode && targetNode;
        });

        const idMap = {};
        let id = 1;
        cseNodes.forEach(node => {
            idMap[node.id] = id;
            node.id = id;
            id ++;
        });

        cseEdges.forEach(edge => {
            edge.source = idMap[edge.source];
            edge.target = idMap[edge.target];
        });

        const cseData = {nodes:cseNodes, edges:cseEdges};
        
        return cseData;

        
    })
    .catch(err => console.log(err));



data.then(cseData => {
    const nodes = cseData.nodes.sort((a,b) => a.id - b.id);
    const edges = cseData.edges.sort((a,b) => a.source - b.source);


    const collaborationCounts = {};
    edges.forEach(edge => {
        const source = edge.source;
        const target = edge.target;

        if (collaborationCounts[source]) {
            collaborationCounts[source] ++;
        } else {
            collaborationCounts[source] = 1;
        }

        if (collaborationCounts[target]) {
            collaborationCounts[target] ++;
        }
        else {
            collaborationCounts[target] = 1;
        }
    });

    const nodeRadii = nodes.map(node => collaborationCounts[node.id]*1.3+2 || 0);

    const simulation = forceSimulation(nodes)
        .force('charge',forceManyBody().strength(-120))
        .force('link', forceLink(edges).id (d => d.id).distance(20))
        .force('center',forceCenter(centerX/2, centerY))
    

    const mouseover_node = function(event,d) {
        tooltip
        .style('left', (event.pageX - 40) + 'px')
        .style('top', (event.pageY-40) + 'px')
        .style('opacity', 1)
        .text( "Name: " + d.fullname);

        select(this)
        .filter(d => d.id)
        .selectAll("circle")
        .style("fill", "blue");

        matrix
        .filter(e => e.source === d.id || e.target === d.id)
        .style("fill", "orange")
        .style("opacity", 0.8)
        .filter(e => e.source === d.id && e.target === d.id)
        .style("fill", "red");
    };

    const mouseout_node = function(d) {
        tooltip
        .style('opacity', 0);
        select(this)
        .style("fill", "red");
        select(this)
        .selectAll("circle")
        .style("fill", "red");
        matrix
        .style("fill", d => color_matrix(d.publications));
    };


    const mouseover_link = function(event,d) {
        select(this)
        .style("stroke", "blue")
        .style("stroke-width", 5)
        .style("opacity", 0.5);
        matrix
        .filter(e => e.source === d.source.id && e.target === d.target.id)
        .style("fill", "red");
        node
        .filter(nodes => nodes.id === d.source.id || nodes.id === d.target.id)
        .selectAll("circle")
        .style("fill", "blue");
        tooltip_link
        .style('left', (event.pageX - 40) + 'px')
        .style('top', (event.pageY-40) + 'px')
        .style('opacity', 1)
        .text(d.source.fullname+" and "+d.target.fullname);
    
    };


    const mouseout_link = function(d) {
        select(this)
        .style("stroke", "grey")
        .style("stroke-width", 2);

        matrix
        .style("fill", d => color_matrix(d.publications));

        node
        .selectAll("circle")
        .style("fill", "red");

        tooltip_link
        .style('opacity', 0);

    };

    simulation.on('tick', () => {
        node
        .attr('transform', d => `translate(${d.x}, ${d.y})`);

        links
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

    });

    const node = svg
        .selectAll('g')
        .data(nodes)
        .enter()
        .append('g')
        .call(drag(simulation))
        .on('mouseover', mouseover_node)
        .on('mouseout', mouseout_node);

    node
        .append('circle')
        .attr('r', (d,i) => nodeRadii[i])
        .attr('fill', 'red')
        .attr('opacity', 0.8);

    const links = svg
        .selectAll('line')
        .data(edges)
        .enter()
        .append('line')
        .attr('opacity', 0.3)
        .attr('stroke', 'grey')
        .attr('stroke-width', 2)
        .on('mouseover', mouseover_link)
        .on('mouseout', mouseout_link);

    function drag(simulation) {

        function dragstarted(event) {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          event.subject.fx = event.subject.x;
          event.subject.fy = event.subject.y;
        }
      
        function dragged(event) {
          event.subject.fx = event.x;
          event.subject.fy = event.y;
        }
      
        function dragended(event) {
          if (!event.active) simulation.alphaTarget(0);
          event.subject.fx = null;
          event.subject.fy = null;
        }
      
        return d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended);
      }


    //建立矩阵，用于贮存建marix的数据
    const e = [];

    for (let index1 = 1; index1 <= 46; index1++) {
        for(let index2 = 1; index2<=46;index2 ++){
            e.push({source:index1,target:index2,publications:0,sourcename:0,targetname:0})
        }
    }
    
    for(let index1 = 0; index1 <nodes.length; index1++){
        for(let index2 = 0; index2 <e.length; index2++){
            if(e[index2].source === nodes[index1].id){
                e[index2].sourcename = nodes[index1].fullname;
            }
            if(e[index2].target === nodes[index1].id){
                e[index2].targetname = nodes[index1].fullname;
            }

        }};

    for(let index1 = 0; index1 <edges.length; index1++){
        for(let index2 = 0; index2 <e.length; index2++){
            if(e[index2].source === edges[index1].source.id && e[index2].target === edges[index1].target.id){
                e[index2].publications = edges[index1].publications.length;

            }
            if(e[index2].source === edges[index1].target.id && e[index2].target === edges[index1].source.id){
                e[index2].publications = edges[index1].publications.length;

            }
        }};



    const Xscale = scaleBand()
        .domain(nodes.map(d => d.id))
        .range([margin.left,height-margin.right])
        .padding(0.1);

    const Yscale = scaleBand()
        .domain(nodes.map(d => d.id))
        .range([height-margin.right,margin.left])
        .padding(0.1);


const mouseover_matrix = function(event, d) {
    tooltip_matrix
        .html("Source: " + d.sourcename + "<br>" + "Target: " + d.targetname + "<br>" + "Pub: " + d.publications)
        .style("left", (event.x) + "px")
        .style("top", (event.y) + "px")
        .style('opacity', 1)
    d3.select(this)
        .style("stroke", "black")
        .style("opacity", 1)
    node
        .filter(nodes => d.source === nodes.id || nodes.id === d.target)
        .selectAll("circle")
        .style("fill", "blue");

    links
        .filter(links => d.source === links.source.id && d.target === links.target.id || d.source === links.target.id && d.target === links.source.id)
        .style("stroke-width", 5)
        .style("stroke", "blue");

};


const mouseout_matrix = function(event, d) {
    tooltip_matrix
        .style('opacity', 0)
    d3.select(this)
        .style("stroke", "none")
        .style("opacity", 0.8)

    node
        .selectAll("circle")
        .style("fill", "red");

    links
        .style("stroke-width", 2)
        .style("stroke", "grey");

};
    

    const color_matrix = scaleThreshold()
        .domain([1, 10, 20, 30, 40,50,60,70,80])
        .range(["#FFFFEE", "#EAF8AE", "#BEE6AF", "#70C6B3", "#31ADBB", "#0E86B5", "#0A5E9F", "#0A3C7A", "#0A1C54"]);


    const svg1 = select("body")
        .append("svg")
        .attr("width", width/2)
        .attr("height", height);

    const x_axis = svg1.append("g")
        .call(d3.axisBottom(Xscale).tickSize(10))
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .selectAll("text")
        .text(d => nodes[d-1].fullname)
        .attr("transform", "translate(-15,10)rotate(-90)")
        .style("text-anchor", "end")
        .style("font-size", "10px");

    const y_axis = svg1.append("g")
        .call(d3.axisLeft(Yscale).tickSize(10))
        .attr("transform", `translate(${margin.left},0)`)
        .selectAll("text")
        .text(d => nodes[d-1].fullname)
        .style("text-anchor", "end")
        .style("font-size", "10px");

    const matrix = svg1.selectAll("rect")
        .data(e)
        .enter()
        .append("rect")
        .attr("transform", d => `translate(${Xscale(d.source)},${Yscale(d.target)})`)
        .attr("width", Xscale.bandwidth())
        .attr("height", Yscale.bandwidth())
        .attr("fill", d => color_matrix(d.publications))
        .attr("stroke", "none")
        .attr("opacity", 0.8)
        .on("mouseover", mouseover_matrix)
        .on("mouseout", mouseout_matrix);

});







