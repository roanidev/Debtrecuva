const AdminM = (req,res,next) =>{

console.log(req.session.loggedinuser);
console.log(req.session.usertype);


next();
}



const AgentM = (req,res,next) =>{
    console.log(req.session.loggedinuser);
    console.log(req.session.usertype);



next();
}


module.exports = {AdminM, AgentM}