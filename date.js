exports.getDate = ()=>{

const today = new Date();

option ={
    weekday: "long",
    day: "numeric",
    month: "long"
}

return today.toLocaleDateString('en-us',option);
}

exports.getNum =()=>{
    const today = new Date();
    return today.getDay();
}