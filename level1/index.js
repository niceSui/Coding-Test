const {csv, select, group,mean,rollup,scaleBand,axisBottom,axisLeft,interpolateInferno,min,max,scaleSequential} = d3;
import {main} from './readfile.js';
import {dataFlat} from './dataProcess.js';
const datacsv = 'https://raw.githubusercontent.com/HKUST-VISLab/coding-challenge/master/temperature_daily.csv';
const width = innerWidth;
const height = innerHeight;
const margin = {
    top: 100,
    right: 300,
    bottom: 160,
    left: 300,
  };
const svg = select('body')
    .append('svg')
    .attr('width', width)
    .attr('height', height);

const radioDiv = select('body')
    .append('div')
    .attr('class', 'radioDiv')


const tooltip = select('body')
    .append("div")
    .attr("class", "tooltip");

const legendWidth = 500;
const legendHeight = 40;
const legendX = margin.left;
const legendY = height - 100;
const legendNumBlocks = 10;
const legendBlockWidth = legendWidth / legendNumBlocks;



main(datacsv)
  .then(data => {
    const transformedData = dataFlat(data);

    const xScale = scaleBand()
        .domain(transformedData.map(d => d.year))
        .range([margin.left, width - margin.right])
        .padding(0.1);

    const yScale = scaleBand()
        .domain(transformedData.map(d => d.month))
        .range([height - margin.bottom, margin.top])
        .padding(0.1);

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

    const mouseout = function() {
        tooltip
            .style('opacity', 0)
        select(this)
            .style("stroke", "none")
            .style("opacity", 0.8)
    };


    const updateHeatmap = (data, temp) => {
        svg.selectAll("rect").remove();
        svg.selectAll("g").remove();

        //添加颜色比例尺
        const myColor = scaleSequential()
            .interpolator(interpolateInferno)
            .domain([min(data, d => d.min_temperature), max(data, d => d.max_temperature)]);

        // 添加 X axis
        svg.append("g")
            .style("font-size", 15)
            .attr("transform", `translate(0, ${height - margin.bottom})`)
            .call(axisBottom(xScale).tickSize(10))
            .select(".domain").remove();
        // 添加 Y axis
        svg.append("g")
            .style("font-size", 15)
            .attr("transform", `translate(${margin.left}, 0)`)
            .call(axisLeft(yScale).tickSize(10))
            .select(".domain").remove();

        //添加heatmap的矩形 
        svg.selectAll()
            .data(transformedData)
            .join("rect")
                .attr("x", d => xScale(d.year))
                .attr("y", d => yScale(d.month))
                .attr("width", xScale.bandwidth())
                .attr("height", yScale.bandwidth())
                .style("fill", d => myColor(d[temp]))
                .style("stroke", "none")
                .style("opacity", 0.8)
                .on("mouseover", mouseover)
                .on("mouseout", mouseout);

        const legend = svg.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${legendX}, ${legendY})`);

        //为legend添加颜色矩形
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
        //为legend添加文字（最小值）
        legend.append("text")
            .attr("x", 0)
            .attr("y", legendHeight + 20)
            .text(min(data, d => d.min_temperature).toFixed(1));
        //为legend添加文字（最大值）
        legend.append("text")
            .attr("x", legendWidth)
            .attr("y", legendHeight + 20)
            .attr("text-anchor", "end")
            .text(max(data, d => d.max_temperature).toFixed(1));
    };

    let currentTemp = 'max_temperature';
    updateHeatmap(data, currentTemp);

    //添加温度选择按钮
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


    
  })
  .catch(error => {
    console.error(error);
  });


