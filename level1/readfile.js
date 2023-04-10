const {csv} = d3;
const parseRow = function(file){
    file.date = new Date(file.date);
    file.year = file.date.getFullYear();
    file.month = file.date.getMonth()+1;
    file.max_temperature = + file.max_temperature;
    file.min_temperature = + file.min_temperature;
    return file;
};

const main = async function(fileName){
    const data = await csv(fileName, parseRow)
    return data; 
};

export { parseRow, main };