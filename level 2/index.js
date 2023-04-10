const {csv, select, group,mean,rollup,scaleBand,scaleLinear,extent,interpolateInferno,max,min,axisBottom,axisLeft,scaleSequential} = d3;
const datacsv = 'https://raw.githubusercontent.com/HKUST-VISLab/coding-challenge/master/temperature_daily.csv';
const width = innerWidth;
const height = innerHeight;

const svg = select('body')
    .append('svg')
    .attr('width', width)
    .attr('height', height);

const parseRow = (d) => {
    d.date = new Date(d.date);
    d.year = d.date.getFullYear();
    d.month = d.date.getMonth()+1;
    d.day = d.date.getDate();
    d.max_temperature = + d.max_temperature;
    d.min_temperature = + d.min_temperature;
    return d;
}

const margin = {
    top: 60,
    right: 300,
    bottom: 160,
    left: 300,
  };

const radioDiv = select('body')
    .append('div')
    .attr('class', 'radioDiv');

const legendWidth = 500;
const legendHeight = 40;
const legendX = margin.left;
const legendY = height - 100;
const legendNumBlocks = 10;
const legendBlockWidth = legendWidth / legendNumBlocks;



const tooltip = select('body')
    .append("div")
    .style("position", "absolute")
    .attr("class", "tooltip");

const mouseover = function(event, d) {
    tooltip
        .html("Year: " + d.year + "<br>" + "Month: " + d.month + "<br>" + "Max Temperature: " + d.max_temperature.toFixed(1) + "<br>" + "Min Temperature: " + d.min_temperature.toFixed(1))
        .style("left", (event.x) + "px")
        .style("top", (event.y) + "px")
        .style('opacity', 1)
    select(this)
        .style("stroke", "black")
        .style("opacity", 1) 
};

const mouseout = function(event, d) {
    tooltip
        .style('opacity', 0)
    select(this)
        .style("stroke", "none")
        .style("opacity", 0.8)
};


const main = async () => {
    const data = await csv(datacsv, parseRow);
    const latestData = data.filter(d => d.year >= 2008);
    const groupbyMonth = group(latestData, d => d.year,d => d.month);
    // 获取每天的最高和最低温度
    const linedata = Array.from(groupbyMonth, ([year, months]) => Array.from(months, ([month, data]) => ({
        year,
        month,
        max_temperature: data.map(d => d.max_temperature),
        min_temperature: data.map(d => d.min_temperature),
        day: data.map(d => d.day),
    }))).flat();

    // 计算每个年份和月份的最高和最低温度平均值
    const nestedData = rollup(latestData, 
        v => ({
          max_temp_avg: mean(v, d => d.max_temperature),
          min_temp_avg: mean(v, d => d.min_temperature),
        }), 
        d => d.year, d => d.month,);

    const transformedData = Array.from(nestedData, ([year, months]) =>
    Array.from(months, ([month, data]) => ({
        year,
        month,
        max_temperature: data.max_temp_avg,
        min_temperature: data.min_temp_avg,
    }))
    ).flat();

    const xScale_heatmap = scaleBand()
        .domain(transformedData.map(d => d.year))
        .range([margin.left, width - margin.right])
        .padding(0.1);


    const yScale_heatmap = scaleBand()
        .domain(transformedData.map(d => d.month))
        .range([height - margin.bottom, margin.top])
        .padding(0.1);



    const updateHeatmap = (data, temp) => {
        svg.selectAll("rect").remove();
        svg.selectAll("g").remove();

        const myColor = scaleSequential()
            .interpolator(interpolateInferno)
            .domain([min(data, d => d.min_temperature), max(data, d => d.max_temperature)]);

        const xScale_line = scaleLinear()
            .domain([1,31])
            .range([0,xScale_heatmap.bandwidth()])


        const yScale_line = scaleLinear()
            .domain([0, extent(data, d => d.max_temperature)[1]])
            .range([yScale_heatmap.bandwidth()-2, 2]);

        const line_max = d3.line()
            .x(d => xScale_line(d.day))
            .y(d => yScale_line(d.max_temperature));

        const line_min = d3.line()
            .x(d => xScale_line(d.day))
            .y(d => yScale_line(d.min_temperature));

        const cells = svg.selectAll("g")
            .data(transformedData)
            .enter()
            .append("g")
            .attr("transform", d => `translate(${xScale_heatmap(d.year)}, ${yScale_heatmap(d.month)})`)
            .attr("class", "cell");

        cells.append("rect")
            .attr("width", xScale_heatmap.bandwidth())
            .attr("height", yScale_heatmap.bandwidth())
            .style("fill", d => myColor(d[temp]))
            .style("opacity", 0.8)
            .style("stroke", "none")
            .on("mouseover", mouseover)
            .on("mouseout", mouseout);

        svg.append("g")
            .style("font-size", 15)
            .attr("transform", `translate(0, ${height - margin.bottom})`)
            .call(axisBottom(xScale_heatmap).tickSize(10))
            .select(".domain").remove();

        svg.append("g")
            .style("font-size", 15)
            .attr("transform", `translate(${margin.left}, 0)`)
            .call(axisLeft(yScale_heatmap).tickSize(10))
            .select(".domain").remove();


        let i = 0;
        cells.each(function() {
            let trans = linedata[i].day.map((d, t) => ({
                day: d,
                max_temperature: linedata[i].max_temperature[t],
                min_temperature: linedata[i].min_temperature[t],
            }));

            select(this)
            .datum(trans)
            .append("path")
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 1.5)
            .attr("d", line_max);

            select(this)
            .append("path")
            .datum(trans)
            .attr("fill", "none")
            .attr("stroke", "red")
            .attr("stroke-width", 1.5)
            .attr("d", line_min);

            i++;

        });

        const legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${legendX}, ${legendY})`);

        for (let i = 0; i < legendNumBlocks; i++) {
            legend.append("rect")
                .attr("x", i * legendBlockWidth)
                .attr("y", 0)
                .attr("width", legendBlockWidth)
                .attr("height", legendHeight)
                .style("fill", interpolateInferno(i / legendNumBlocks))
                .style('opacity', 0.8)
                .style("stroke", "none");
        }
        
        legend.append("text")
            .attr("x", 0)
            .attr("y", legendHeight + 20)
            .style('font', '15px sans-serif')
            .text(min(data, d => d.min_temperature).toFixed(1));
        
        legend.append("text")
            .attr("x", legendWidth)
            .attr("y", legendHeight + 20)
            .style('font', '15px sans-serif')
            .attr("text-anchor", "end")
            .text(max(data, d => d.max_temperature).toFixed(1));
    };

    let currentTemp = 'max_temperature';
    updateHeatmap(data, currentTemp);


    radioDiv.append('label')
        .text('Min Temperature')
        .append('input')
        .attr('type', 'radio')
        .attr('name', 'temp')
        .attr('value', 'min')
        .attr('checked', true)
        .on('change', function() {
            if(this.checked) {
                updateHeatmap(data, 'min_temperature');
            }});

    radioDiv.append('label')
        .text('Max Temperature')
        .append('input')
        .attr('type', 'radio')
        .attr('name', 'temp')
        .attr('value', 'max')
        .attr('checked', true)
        .on('change', function() {
            if(this.checked) {
                updateHeatmap(data, 'max_temperature');
            }});

}

main();