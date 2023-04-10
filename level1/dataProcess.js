const {mean,rollup} = d3;

// 计算每个年份和月份的最高和最低温度平均值
const averageCalculate = function(inputData){
    const outputData = rollup(inputData, 
        dataValues => ({
          max_temp_avg: mean(dataValues, dataPoint => dataPoint.max_temperature),
          min_temp_avg: mean(dataValues, dataPoint => dataPoint.min_temperature),
        }), 
        d => d.year, d => d.month,);
    return outputData;
} 


const dataFlat = function(inputData){ 
    const outputData = 
    Array.from(averageCalculate(inputData), ([year, months]) =>
    Array.from(months, ([month, data]) => ({
        year,
        month,
        max_temperature: data.max_temp_avg,
        min_temperature: data.min_temp_avg,
    }))
    ).flat();
    return outputData;
};

export { averageCalculate, dataFlat};