const { json } = require("express");
const { collectionsdb, agentsdb, admindb, smsdb, emailsdb } = require("../model/database");
const { collectionsSchema, agentsSchema, adminSchema, smsSchema} = require("../schema/systemSchema");
const sendResponse = require("../utils/resHandler");
const { sendSingle, sendBulk } = require("../utils/sendgrid");
const { sendSms, sendSmsBulk } = require("../utils/termii");
const csvtojsonV2 = require("csvtojson");
const renderObjectsToTable = require("../utils/getHeadervalues");
const { cryptr } = require("../utils/encrypt");
const { AdminM, AgentM } = require("../views/middleware/loggedinuser");
var request = require('request');
const session = require('express-session');
const cache = require('memory-cache');
const Web = (app) => {

    /* ------------------------------------------------------------------------------------------------------------------ */
    /*                                                        HOME                                                        */
    /* ------------------------------------------------------------------------------------------------------------------ */
    app.get("/", (req, res) => {
        res.render("pages/index", { name: "Home", page: "home" });
    })


    /* ------------------------------- ADMIN LOGIN ------------------------------ */
    app.all("/admin/login",  (req, res) => {
        switch (req.method){

            case "GET":
                
                 res.render("pages/adminlogin", { name: "Admin login", page: "admin" });
                break;

                case "POST":
                          /* ------------------------------------------------- CHECK FOR ADMIN ------------------------------------------------ */
                            admindb.search({
                                query: req.body.email,
                                fields: ['email'],
                                include_docs: true,
                                highlighting: true, mm: '80%'
                            }).then(function (result) {
                                // console.log(result);
                                if (result.rows.length > 0) {
                                    /* ------------------------------------------------------ USER ------------------------------------------------------ */
                                    let user = result.rows[0];
                                    let puserpass= cryptr.decrypt(user.doc.password);
                                    console.log(puserpass)
                                    console.log(req.body.password)
                                    /* ------------------------------   ------------------ SUCCESSFUL LOGIN ------------------------------------------------ */
                                    if (puserpass.trim()== req.body.password.trim()) {
                                        delete user.doc["password"];

                                        req.session.loggedinuser = user;
                                        req.session.usertype="admin";
                                        req.session.save(function(err) {
                                            // session saved
                                          })
                                        res.redirect("/dashboard?success= Logged In Successfully")

                                    } else {
                                        res.redirect("/admin/login?failure=Could not login, Please check email or password.")
                                    }


                                    /* ------------------------------------------------------------------------------------------------------------------ */
                                    /*                                                   IF LOGIN FAILED                                                  */
                                    /* ------------------------------------------------------------------------------------------------------------------ */
                                } else {

                                    res.redirect("/admin/login?failure=No such user with the email..");
                                }


                                /* ------------------------------------------------------------------------------------------------------------------ */
                                /*                                                   IF LOGIN FAILED                                                  */
                                /* ------------------------------------------------------------------------------------------------------------------ */
                            }).catch(err => {
                                console.log(err)
                              res.redirect("/admin/login?failure=Login failed, please check Email or Password.");

                            })
                break;
        }
        
    })

    /* ----------------------------------------------------------------------------------------------------------------- */
    /*                                 AGENT LOGIN                                                                       */
    /* ------------------------------------------------------------------------------------------------------------------ */
    app.all("/agent/login", (req,res)=>{
        
       
        switch (req.method){
            case "GET":
                res.render("pages/agentlogin", {name: "Agent Login", page: "agent"})
                break;

                case "POST":
                    agentsdb.search({
                        query: req.body.email,
                        fields: ['email'],
                        include_docs: true,
                        highlighting: true, mm: '80%'
                    }).then(function (result) {
                        if (result.rows.length > 0) {
                           
                            /* ------------------------------------------------------ USER ------------------------------------------------------ */
                            let user = result.rows[0];
                            
                            let agentpass = cryptr.decrypt(user.doc.password);
                            
                            // /* ------------------------------------------------ SUCCESSFUL LOGIN ------------------------------------------------ */
                            if (agentpass = req.body.password.trim()) {
                                 delete user.doc["password"];
                                 req.session.loggedinuser = user;
                                 
                                 req.session.loggedinemail= user.doc["email"];
                                //  console.log(req.session.loggedinuser)
                                 req.session.usertype="agent";
                             

                               res.redirect("/dashboard?success= Logged In Successfully")

                            } else {
                                res.redirect("/agent/login?failure=Could not login, Please check email or password.")
                            }
            
            
                            /* ------------------------------------------------------------------------------------------------------------------ */
                            /*                                                   IF LOGIN FAILED                                                  */
                            /* ------------------------------------------------------------------------------------------------------------------ */
                        } else {
                            res.redirect("/agent/login?failure=No such user with the email..");
                        }
            
            
                        /* ------------------------------------------------------------------------------------------------------------------ */
                        /*                                                   IF LOGIN FAILED                                                  */
                        /* ------------------------------------------------------------------------------------------------------------------ */
                    }).catch(err => {
                        res.redirect("/agent/login?failure=Login failed, please check Email or Password.");
            
                    })
                
                    break;
        }
    })
    /* ------------------------------------------------------------------------------------------------------------------ */
    /*                                                      DASHBOARD                                                     */
    /* ------------------------------------------------------------------------------------------------------------------ */
    app.get("/dashboard", AdminM,async (req, res) => {

        // all companies 
        let allcompanies = 0;
        await collectionsdb.allDocs({
            include_docs: true,
            attachments: true,  
        }).then(function (result){
            allcompanies = result.rows.length;
        }).catch(function (err){
            console.log(err)
        });

        // all agents 
        let allagents = 0;
        await agentsdb.allDocs({
            include_docs: true,
            attachments: true,  
        }).then(function (result){
            allagents = result.rows.length;
        }).catch(function (err){
            console.log(err)
        });

        // all emails sent 
        let allemails = 0;
        await emailsdb.allDocs({
            include_docs: true,
            attachments: true,  
        }).then(function (result){
            allemails = result.rows.length;
        }).catch(function (err){
            console.log(err)
        });

        // all sms 
        let allsms = 0;
        await smsdb.allDocs({
            include_docs: true,
            attachments: true,  
        }).then(function (result){
            allsms = result.rows.length;
        }).catch(function (err){
            console.log(err)
        });


        res.render("pages/dashboard", { name: "Dashboard", company:allcompanies, agent:allagents, email:allemails, sms:allsms, page: "dashboard" });
    })

    /* -------------------------------- dashboard ----------------------------------------------------------------------- */


        /* ------------------------------------------------------------------------------------------------------------------ */
    /*                                                     ADD ADMIN                                                   */
    /* ------------------------------------------------------------------------------------------------------------------ */
    app.all("/addadmin", (req, res) => {
        switch (req.method) {
            case "GET":
                res.render("pages/addadmin", { name: "Add Admin", page: "admin" });
                break;

            case "POST":
                console.log(req.body)
                let data = req.body;
                let newadmin = adminSchema(data);


                admindb.search({
                    query: req.body.email,
                    fields: ['email'],
                    include_docs: true,
                    highlighting: true, mm: '80%'
                }).then(function (result) {
                    console.log(result);
                    /* -------------------------------------------------- ADD THE ADMIN ------------------------------------------------- */
                    if (result.rows.length > 1) {

                        res.redirect("/addadmin?failure=Admin Account with this email already exists")
                    } else {
                        admindb.put(newadmin).then(function (result) {
                            res.redirect("/viewadmin?success=Admin Account created Successfully")
                        })

                    }



                }).catch(err => {
                    res.redirect("/addadmin?failure=Failed to create admin account");
                })

                break;
        }

    })

    /* ------------------------------- VIEW ALL ADMINISTRATORS ------------------------------------------------------------------ */

    app.get("/viewadmin", (req, res) => {

        admindb.allDocs({
            include_docs: true,
            attachments: true,
            skip: req.query.offset,
            limit: req.query.limit
        }).then(function (result) {
            res.render("pages/viewadmin", { name: "View Admin", administrators: result.rows, page: "admin" });
        }).catch(err => {
            res.render("pages/viewadmin", { name: "View Admin", administrators: [], page: "admin" });
        })

    })




    /* ------------------------------------------------------------------------------------------------------------------ */
    /*                                                     ADMIN                                                   */
    /* ------------------------------------------------------------------------------------------------------------------ */

    /* ---------------------------- VIEW SINGLE ADMIN --------------------------- */
    app.get("/singleadmin",(req,res)=>{
        let adminid = req.query.adminid;
        console.log(adminid)
        admindb.get(adminid).then(function(result){
            res.render("pages/singleadmin", { name: "View singleadmin", admin:result, page: "admin" })
        }).catch(err=>{
            res.redirect(`/viewadmin?adminid=${adminid}failure=Sorry Admin with this id does not exist`)
        })
    })

    /* --------------------------- DELETE ADMIN BY ID ------------------------------------------------------------------ */
    app.get("/deleteadmin/:adminid", (req, res) => {
        let adminid = req.params.adminid;
       admindb.get(adminid).then(function (doc) {
            // console.log(doc)
           admindb.remove(doc).then(function (result) {
                res.redirect("/viewadmin?success=Admin account removed successfully.");

            }).catch(err => {
                res.redirect("/viewadmin?failure=Failed to delete admin account.");

            })

        }).catch(err => {
            res.redirect("/viewadmin?failure=No Such admin with this id exists.");

        })

    })
    /* ------------------------------------------------------------------------------------------------------------------ */
    /*                                                     ADD COMPANY                                                    */
    /* ------------------------------------------------------------------------------------------------------------------ */
    app.all("/addcompany", (req, res) => {
        switch (req.method) {
            case "GET":
                res.render("pages/addcompany", { name: "Add Company", page: "company" });
                break;

            case "POST":
                console.log(req.body)
                let data = req.body;
                let newcollection = collectionsSchema(data);


                collectionsdb.search({
                    query: req.body.collectionsemail,
                    fields: ['collectionsemail', 'companyemail'],
                    include_docs: true,
                    highlighting: true, mm: '80%'
                }).then(function (result) {
                    /* -------------------------------------------------- ADD THE ADMIN ------------------------------------------------- */
                    if (result.rows.length > 1) {

                        res.redirect("/addcompany?failure=Collection Account with this email already exists")
                    } else {
                        collectionsdb.put(newcollection).then(function (result) {
                            res.redirect("/viewcompany?success=Collection Account created Successfully")
                        })

                    }



                }).catch(err => {
                    res.redirect("/addcompany?failure=Collection Account with that email already exists");
                })

                break;
        }

    })




    /* ------------------------------------------------------------------------------------------------------------------ */
    /*                                                     ADD COMPANY                                                    */
    /* ------------------------------------------------------------------------------------------------------------------ */


    /* ------------------------------------------------------------------------------------------------------------------ */
    /*                                                    VIEW COMPANY                                                    */
    /* ------------------------------------------------------------------------------------------------------------------ */
    app.get("/viewcompany", (req, res) => {

        collectionsdb.allDocs({
            include_docs: true,
            attachments: true,
            skip: req.query.offset,
            limit: req.query.limit
        }).then(function (result) {
            res.render("pages/viewcompany", { name: "View Company", companies: result.rows, page: "company" });
        }).catch(err => {
            res.render("pages/viewcompany", { name: "View Company", companies: [], page: "company" });
        })

    })

    /* ------------------------------------------------------------------------------------------------------------------ */
    /*                                                    VIEW COMPANY                                                    */
    /* ------------------------------------------------------------------------------------------------------------------ */


    /* ------------------------------------------------------------------------------------------------------------------ */
    /*                              VIEW SINGLE COMPANY                                                             */
    /* ------------------------------------------------------------------------------------------------------------------ */

    app.get("/singlecompany",(req,res)=>{
        let companyid = req.query.companyid;
        console.log(companyid)
        collectionsdb.get(companyid).then(function(result){
            res.render("pages/singlecompany", { name: "View Singlecompany", company:result, page: "company" })
        }).catch(err=>{
            res.redirect(`/viewcompany?companyid=${companyid}failure=Sorry no such company with this id`)
        })

    })

    /* ------------------------------------------------------------------------------------------------------------------ */
    /*                                          VIEW SINGLE COMPANY                                                      */
    /* ------------------------------------------------------------------------------------------------------------------ */


    /* ------------------------------------------------------------------------------------------------------------------ */
    /*                                                   REMOVE COMPANY                                                   */
    /* ------------------------------------------------------------------------------------------------------------------ */
    app.get("/deletecompany/:companyid", (req, res) => {
        let companyid = req.params.companyid;
        collectionsdb.get(companyid).then(function (doc) {
            console.log(doc)
            collectionsdb.remove(doc).then(function (result) {
                res.redirect("/viewcompany?success=Collection account removed successfully.")

            }).catch(err => {
                res.redirect("/viewcompany?failure=No Such Company with this id exists.")

            })

        }).catch(err => {
            res.redirect("/viewcompany?failure=No Such Company with this id exists.")

        })

    })

    /* -------------------------------------------------------------------------------------------------------------------- */
    /*                             ADD  DEBT PORTFOLIO                                                                         */
    /* -------------------------------------------------------------------------------------------------------------------- */

    
    app.get("/addportfolio", (req, res) => {

        collectionsdb.allDocs({
            include_docs: true,
            attachments: true,
            skip: req.query.offset,
            limit: req.query.limit
        }).then(function (result) {
            res.render("pages/addportfolio", { name: "Portfolio", portfolios: result.rows, page: "portfolio" });
        }).catch(err => {
            res.render("pages/addportfolio", { name: "Portfolio", portfolios: [], page: "portfolio" });
        })
      
    })

     /* --------------------------- ADD LIST OF DEBTORS -------------------------- */
     app.all("/adddebtors",(req,res)=>{

        switch(req.method){
            case "GET":
                let debtorsid = req.query.debtorsid;
                // console.log(req.query.debtorsid)
                collectionsdb.get(debtorsid).then(function(result){
                    res.render("pages/adddebtors", {name: "Portfolio", debtors:result, page:"portfolio"})
        
                }).catch(err=>{
                    res.redirect("/addportfolio?failure=Sorry no such portfolio with this id")
        
                })


            break;

            case "POST":
                let companydebtors;
                let companyid= req.body.company;
                const debtorlist = req.files.file;
                console.log("the file list");
                const filepath= "debtors/debtors.csv";
                debtorlist.mv(filepath,function(data){
                 /* ----------------------------------- CSV ---------------------------------- */
                 csvtojsonV2()
                .fromFile(filepath)
                .then((jsonObj)=>{                
                    companydebtors =jsonObj;
                    collectionsdb.get(companyid).then(function (result){
                      
                    
                        let updaterec=[...result.portfolio,...companydebtors];
                        result.portfolio=updaterec;
                        result._id=result._id;
                        result_rev=result._rev;

                        collectionsdb.put(result).then(function(result){
                            res.redirect(`/adddebtors?debtorsid=${companyid}&success=debtors added successfully`)

                        }).catch(err=>{
                            res.redirect(`/adddebtors?debtorsid=${companyid}&failure=sorry could not add debtors to the company`)

                        })


                    }).catch(err=>{
                        res.redirect(`/adddebtors?debtorsid=${companyid}&failure=sorry could not add debtors to the company`)
                    })


                })

                })


            break;


        }
         
     })

     /* -------------------------------------------------------------------------------------------------------------------- */
    /*                              ADD DEBT PORTFOLIO                                                                         */
    /* -------------------------------------------------------------------------------------------------------------------- */

    /* -------------------------------------------------------------------------------------------------------------------- */
    /*                              VIEW DEBT PORTFOLIO                                                                         */
    /* -------------------------------------------------------------------------------------------------------------------- */

    
    app.get("/viewportfolio", (req, res) => {


        collectionsdb.allDocs({
            include_docs: true,
            attachments: true,
            skip: req.query.offset,
            limit: req.query.limit
        }).then(function (result) {
            res.render("pages/viewportfolio", { name: "Portfolio", portfolios: result.rows, page: "portfolio" });
        }).catch(err => {
            res.render("pages/viewportfolio", { name: "Portfolio", portfolios: [], page: "portfolio" });
        })
       
    })

    /* --------------------- VIEW LIST OF INDIVIDUAL DEBTORS -------------------- */



    app.get("/listofdebtors",(req,res)=>{
        let debtorslistid = req.query.debtorslistid;
      
        collectionsdb.get(debtorslistid).then(function(result){
          
            /* --------------------------- SHOW DEBTORS LISTx --------------------------- */
            let debtors =result.portfolio;
            let headings= renderObjectsToTable(debtors);
            console.log(headings)
            let page= Number(req.query.page);
            // check if page query exists 
            (req.query.page!==undefined)?page =  Number(req.query.page) : page=1;
            var totalNoofrecords = debtors.length;

            
            let pagelimit= 20;

            let totalNoofPages = totalNoofrecords/pagelimit;
            let offset = (pagelimit*page)-pagelimit;
            /* --------------------------- SHOW DEBTORS LISTx --------------------------- */
            
          
            var newlist = result.portfolio;
           
            /* ----------------------------- take off offset ---------------------------- */
                newlist.splice(0,offset);
            /* ------------------------------- apply limit ------------------------------ */
           var thelist= newlist;
          thelist= thelist.slice(0,pagelimit);
          result.portfolio=thelist;

        
            
        
            res.render("pages/listofdebtors", {name: "Portfolio", debtorslist:result, headings:headings, currentpage:page, numberofpages:totalNoofPages, page:"portfolio" })

        }).catch(err=>{
            console.log(err);
            res.redirect(`/viewportfolio?debtorslistid${debtorslistid}failure=Sorry no such portfolio with this id`)

        })
         
     })

 
     /* -------------------------------------------------------------------------------------------------------------------- */
    /*                                                    VIEW DEBT PORTFOLIO                                                                         */
    /* -------------------------------------------------------------------------------------------------------------------- */


     /* --------------------------------------------------------------------------------------------------------------------- */
     /*                                                update debt portfolio list                                                 */
     /* ---------------------------------------------------------------------------------------------------------------------- */
    app.get("/updatedebtportfolio", (req, res) => {

        collectionsdb.allDocs({
            include_docs: true,
            attachments: true,
            skip: req.query.offset,
            limit: req.query.limit
        }).then(function (result) {
            res.render("pages/updatedebtportfolio", { name: "Portfolio", updateportfolios: result.rows, page: "portfolio" });
        }).catch(err => {
            res.render("pages/updatedebtportfolio", { name: "Portfolio", updateportfolios: [], page: "portfolio" });
        })
    })

    // update list of debtors 
    app.all("/updatelistofdebtors",(req,res)=>{

        switch(req.method){
            case "GET":
                let debtorsid = req.query.debtorsid;
                // console.log(req.query.debtorsid)
                collectionsdb.get(debtorsid).then(function(result){
                    res.render("pages/updatelistofdebtors", {name: "Portfolio", updatedebtlist:result, page:"portfolio"})
        
                }).catch(err=>{
                    res.redirect("/updatedebtportfolio?failure=Sorry no such portfolio with this id")
        
                })


            break;

            case "POST":
                let updatecompanydebtors;
                let companyid= req.body.company;
                const debtorlist = req.files.file;
                console.log("the file list");
                const filepath= "debtors/updatedebtors.csv";
                debtorlist.mv(filepath,function(data){
                 /* ----------------------------------- CSV ---------------------------------- */
                 csvtojsonV2()
                .fromFile(filepath)
                .then((jsonObj)=>{                
                    updatecompanydebtors =jsonObj;
                    collectionsdb.get(companyid).then(function (result){
                      
                    
                        let updaterec=[...result.portfolio,...updatecompanydebtors];
                        result.portfolio=updaterec;
                        result._id=result._id;
                        result_rev=result._rev;

                        collectionsdb.put(result).then(function(result){
                            res.redirect(`/updatedebtportfolio?debtorsid=${companyid}&success=debtors added successfully`)

                        }).catch(err=>{
                            res.redirect(`/updatedebtportfolio?debtorsid=${companyid}&failure=sorry could not update company's debtors list`)

                        })


                    }).catch(err=>{
                        res.redirect(`/updatedebtportfolio?debtorsid=${companyid}&failure=failure=sorry could not update company's debtors list`)
                    })


                })

                })

            break;
        } 
     })
    // **************************************************************************************************************************

                                            // AGENT 
    /* ------------------------------------------------------------------------------------------------------------------ */
    /*                                                   VIEW ALL AGENTS                                              */
    /* ------------------------------------------------------------------------------------------------------------------ */


       /* ------------------------------------------------------------------------------------------------------------------ */
    /*                                                  ASSIGN PORTFOLIO                                                  */
    /* ------------------------------------------------------------------------------------------------------------------ */
    app.get("/assignportfolio", (req, res) => {

        collectionsdb.allDocs({
            include_docs: true,
            attachments: true,
            skip: req.query.offset,
            limit: req.query.limit
        }).then(function (result) {
            res.render("pages/assignportfolio", { name: "Assign Agents", companies: result.rows, page: "agents" });
        }).catch(err => {
            res.render("pages/assignportfolio", { name: "Assign Agents", companies: [], page: "agents" });
        })

    })

    /* ----------------------------- view all agents ---------------------------- */

    app.get("/viewagents", (req, res) => {

        agentsdb.allDocs({
            include_docs: true,
            attachments: true,
            skip: req.query.offset,
            limit: req.query.limit
        }).then(function (result) {
            res.render("pages/viewagents", { name: "View Agents", agents: result.rows, page: "agents" });
        }).catch(err => {
            res.render("pages/viewagents", { name: "View Agents", agents: [], page: "agents" });
        })

    });


    /* ------------------------------------------------------------------------------------------------------------------ */
    /*                              VIEW SINGLE AGENT                                                              */
    /* ------------------------------------------------------------------------------------------------------------------ */

    app.get("/singleagent",(req,res)=>{
        let agentid = req.query.agentid;
        // console.log(agentid)
        agentsdb.get(agentid).then(function(result){
            res.render("pages/singleagent", { name: "View Singleagent", agent:result, page: "agents" })
        }).catch(err=>{
            res.redirect(`/viewagents?agentid=${agentid}failure=Sorry no such user with this id`)
        })

    })



    /* ------------------------------------------------------------------------------------------------------------------ */
    /*                                                   ADD AGENTS                                              */
    /* ------------------------------------------------------------------------------------------------------------------ */
    app.all("/addagents", (req, res) => {
        switch (req.method) {
            case "GET":
                res.render("pages/addagents", { name: "Add Agents", page: "agents" });

                break;

            case "POST":
                // console.log(req.body)
                let data = req.body;
                console.log("add agent")
                console.log(req.body)
                let newcollection = agentsSchema(data);


                agentsdb.search({
                    query: req.body.email,
                    fields: ['email'],
                    include_docs: true,
                    highlighting: true, mm: '80%'
                }).then(function (result) {
                    /* -------------------------------------------------- ADD THE ADMIN ------------------------------------------------- */
                    if (result.rows.length > 1) {

                        res.redirect("/addagents?failure=Agents with this email already exists")
                    } else {
                        agentsdb.put(newcollection).then(function (result) {
                            res.redirect("/addagents?success=Agent Account created Successfully")
                        })

                    }



                }).catch(err => {
                    res.redirect("/addagents?failure=Collection Account with that email already exists");
                })

                break;
        }

    })


    /* ------------------------    asign agent to a company ----------------------------------------------------------- */

        app.all('/asignagent',async (req,res)=>{
            if(req.query.companyid!==undefined){
                req.session.companyid=req.query.companyid     
            }
          
            switch (req.method){
                
                case "GET":
               
                   
                    // Get the list of all agents 
                    agentsdb.allDocs({
                        include_docs: true,
                        attachments: true,
                        skip: req.query.offset,
                        limit: req.query.limit
                    }).then(function (result) {
                        res.render("pages/asignagent", { name: "View Agents", agents: result.rows, page: "agents"});
                    }).catch(err => {
                        res.render("pages/asignagent", { name: "View Agents", agents: [], page: "agents"});
                    })

                    break;

                    case "POST":
                        let agent = req.body.agentid;
                        let company =  req.session.companyid;
                       
                   agentsdb.get(agent).then(function (result){
                    
                    console.log(result)
                    
                    if(result.companiesassigned.includes(company)){
                        res.redirect("/asignagent?failure= This agent has been assigned");

                    }else{
                        console.log(company)
                        result._id= result._id;
                        result._rev= result._rev;
                        result.companiesassigned.push(company);
                        agentsdb.put(result).then(function(feedback){
                            console.log(feedback)
                              
                        collectionsdb.get(company).then(function (result){
                           
                            let item=result;
                            item._id= result._id;
                            item._rev= result._rev;
                            item.agentsassigned.push(agent);
                            collectionsdb.put(item).then(function(){
                                  
                                res.redirect(`/allasignedagent?companyid=${company}&success= Agent assigned successfully`);
            
                            }).catch(err=>{
                                console.log(err)
                                res.redirect("/asignagent?failure= Failed to assign company to agent 0")

                            
                            });
                         
                           }).catch(err=>{
                            console.log(err);
                            res.redirect("/asignagent?failure= Failed to assign agent to company 1" );
        
                           })
                        
                        }).catch(err=>{ console.log(err);
                            res.redirect("/asignagent?failure= Failed to assign company to agent 2")

                        })
                    
    
                    }
                 
ƒ

                   }).catch(err=>{
                    console.log(err)
                    res.redirect("/asignagent?failure= Failed to assign company to agent 3")


                     });
                   

                


                    break;
                }
            
    
        });


    



        // ******************************************************************************************************* 

        /* -- // view all the agents that have been assigned to different companies - */

        app.get("/allasignedagent",(req,res)=>{
            let companyid = req.query.companyid;
            req.session.companyid=req.query.companyid;
            // console.log(companyid )

            collectionsdb.get(companyid).then(async function (result){
                // console.log(result)
                var allagents =[];
               result.agentsassigned.map(async item=>{
                    // console.log(item)
                  agentsdb.get(item).then(function (agentsingle){
                            
                        allagents.push(agentsingle);

                    }).catch(err=>{

                    })

                    
                })
                setTimeout(function(){
                    // console.log(allagents)
                    res.render("pages/allasignedagent", { name: "Agent", company:result, agents:allagents,   page: "agent" });
              
                },2000)
                
               

            }).catch(err=>{

            })

        })

        /* ---------------------------- UNASSIGN AN AGENT --------------------------- */
        app.post("/unassignagent",(req,res)=>{

            let theagent = req.body.agentid;
            let thecompany = req.body.companyid

            agentsdb.get(theagent).then(function (result){
                // console.log("theagent")
                var removecompany = result.companiesassigned.filter(element => element!==thecompany);
                result._id=result._id;
                result._rev=result._rev;
                result.companiesassigned=removecompany;
                agentsdb.put(result);


                collectionsdb.get(thecompany).then(function (result){
                    // console.log("the company")
                 var removeagent=  result.agentsassigned.filter(element => element!==theagent);
                 result._id=result._id;
                 result._rev=result._rev;
                result.agentsassigned=removeagent;
                collectionsdb.put(result)
    
                    res.redirect(`/allasignedagent?companyid=${req.session.companyid}&success=You have unassinged this agent from this company`)



                })

            }).catch(err=>{

                res.redirect(`/allasignedagents?companyid=${req.session.companyid}&failur=Failed to unassign agent`)


            });

          

            
        })

        

    /* ------------------------------------------------------------------------------------------------------------------ */
    /*                                                    DELETE AGENT                                                    */
    /* ------------------------------------------------------------------------------------------------------------------ */
    app.get("/deleteagent/:agentid", (req, res) => {
        let agentid = req.params.agentid;
        agentsdb.get(agentid).then(function (doc) {
            // console.log(doc)
            agentsdb.remove(doc).then(function (result) {
                res.redirect("/viewagents?success=Agent account removed successfully.");

            }).catch(err => {
                res.redirect("/viewagents?failure=No Such Agent with this id exists.");

            })

        }).catch(err => {
            res.redirect("/viewagents?failure=No Such Agent with this id exists.");

        })

    })


    /*
    ..######...#######..##.....##.##.....##..######.
    .##....##.##.....##.###...###.###...###.##....##
    .##.......##.....##.####.####.####.####.##......
    .##.......##.....##.##.###.##.##.###.##..######.
    .##.......##.....##.##.....##.##.....##.......##
    .##....##.##.....##.##.....##.##.....##.##....##
    ..######...#######..##.....##.##.....##..######.
    */

    /* ------------------------------------------------------------------------------------------------------------------ */
    /*                                                MARKETING DEPARTMENT                                                */
    /* ------------------------------------------------------------------------------------------------------------------ */
    /* ------------------------------------------------------------------------------------------------------------------ */
    /*                                                  SEND SINGLE EMAIL                                                 */
    /* ------------------------------------------------------------------------------------------------------------------ */
    
    app.all("/sendemail", async (req, res) => {

       
        switch (req.method) {
            case "GET":
                res.render("pages/emailsingle", { name: "Send Single Email", page: "email" });

                break;

            case "POST":
                let data = req.body;
                console.log(req.body)
                data.agent=req.session.loggedinuser.doc.email;
               
                let result = await sendSingle(data)
                if (result.error == false) {
                    res.redirect("/sendemail?success=Email sent successfully");

                } else {
                    res.redirect("/sendemail?failure=Sorry Could not send Email");
                }
                break;

        }

    })

    /* ------------------------------------------------------------------------------------------------------------------ */
    /*                                                   SEND BULK EMAIL                                                  */
    /* ------------------------------------------------------------------------------------------------------------------ */
    app.all("/sendbulkemail", async (req, res) => {
        switch (req.method) {
            case "GET":
                res.render("pages/emailbulk", { name: "Send Single Email", page: "email" });
                break;

            case "POST":

                try {

                    let data = req.body;
                    data.agent=req.session.loggedinuser.doc.email;
                    // console.log(req.body);
                    // console.log(req.files.file)


                    let requiredfile = req.files.file;
                    requiredfile.mv("tempfile/temp.csv", function (err) {
                        const csvFilePath = "./tempfile/temp.csv";
                        const csv = require('csvtojson')
                        csv()
                            .fromFile(csvFilePath)
                            .then(async (jsonObj) => {
                                console.log(jsonObj);
                                req.body.recipients = jsonObj;
                                let result = await sendBulk(data);
                                if (result.error == false) {
                                    res.redirect("/sendbulkemail?success=Bulk email sent successfully");

                                } else {
                                    res.redirect("/sendbulkemail?failure=Could not send bulk email");
                                }
                            })
                    });
                } catch (error) {
                    res.redirect("/sendbulkemail?failure=Could not send bulk email");
                }

        }



    })
    // view all emails 

    app.get("/allemails", (req, res) => {

        emailsdb.allDocs({
            include_docs: true,
            attachments: true,
            skip: req.query.offset,
            limit: req.query.limit
        }).then(function (result) {

            res.render("pages/allemails", { name: "All Emails", emails: result.rows, page: "email" });
        }).catch(err => {
            res.render("pages/allemails", { name: "View Emails", emails: [], page: "email" });
        })
    })


/* -------------------------------------------------------------------------------------------------------------------------- */
/*                                                        SINGLE AND BULK SMS                                                          */
/* --------------------------------------------------------------------------------------------------------------------------- */
app.all("/singlesms", async (req, res) => {

       
    switch (req.method) {
        case "GET":
            res.render("pages/singlesms", { name: "Send Single Sms", page: "sms" });

            break;

        case "POST":

        var error = true;
        var message = "";

        req.body.agent=req.session.loggedinuser.doc.email;
                       
            var ndata = {
                "to": "234" + req.body.to.substring(1),
                "from": "DEBTRECUVA",
                "sms": req.body.sms,
                "agent":req.body.agent,
                "type": "plain",
                "api_key": process.env.TERMIIAPIKEY,
                "channel": "generic",
                
        
            };
            
            var options = {
                'method': 'POST',
                'url': 'https://api.ng.termii.com/api/sms/send',
        
                'headers': {
                    'Content-Type': ['application/json', 'application/json']
                },
                body: JSON.stringify(ndata)
        
            };
        
            request(options, function (err, response) {
        
                if (err) {
                    error = true;
                    message = "Could not send sms"
                    // res.status(200).json(sendResponse(error, message));
                    res.redirect("/singlesms?failure=Failed to send sms")

                } else {
        
                    error = false;
        
                    let newsms = smsSchema(req.body);
                    console.log(response.body);
                  
                    message = JSON.parse(response.body);
                 
                   
                    smsdb.put(newsms).then(function (response) { 
                     
                        
                        
                       
                    }).catch(err => { console.log(err) });
                    
                    // res.status(200).json(sendResponse(error, message.message));
                    res.redirect(`/singlesms?success=${message.message}`)

        
                }
        
            })
            break;

    }

})

app.all("/bulksms", async (req, res) => {

       
    switch (req.method) {
        case "GET":
            res.render("pages/bulksms", { name: "Send Bulk Sms", page: "sms" });

            break;

        case "POST":

            let letNoofsuccessfulsms =0;
            let noOfFailedsms = 0;
            let requirefile = req.files.file;
            requirefile.mv("tempfile/tempsms.csv", function (err){
                const csvFilePath = "./tempfile/tempsms.csv";
                const csv = require('csvtojson')
                csv()
                .fromFile(csvFilePath).then(async (jsonObj)=>{
                    // console.log(jsonObj);
                    req.body.agent=req.session.loggedinuser.doc.email;
               await Promise.all( jsonObj.map(item => {
                console.log("234" + item.Mobile.substring(1).trim());
                       var data = {
                            "to":"234" + item.Mobile.substring(1).trim() ,
                            "from": "DEBTRECUVA",
                            "sms": req.body.sms,
                            "agent": req.body.agent,
                            "type": "plain",
                            "api_key": process.env.TERMIIAPIKEY,
                            "channel": "generic",
                
                        };
                        var options = {
                            'method': 'POST',
                            'url': 'https://api.ng.termii.com/api/sms/send',
                            'headers': {
                                'Content-Type': ['application/json', 'application/json']
                            },
                            body: JSON.stringify(data)
                
                        };
                        request(options, function (error, response) {
                           if(error){
                            noOfFailedsms++

                           }else{
                            letNoofsuccessfulsms++

                                var allSmsSent = {
                                    to: "234" + item.Mobile.substring(1).trim(),
                                    sms: req.body.sms,
                                    agent: req.body.agent,
                                    collectionaccount:""
                                }
                            let newsms = smsSchema(allSmsSent);
                               
                            smsdb.put(newsms)
                     
                    
                 

                           }
                            console.log(error);
                            console.log(response);
                
                        });

                    
                    }))
             res.redirect("bulksms?success=SMS sent successfully")

                })
            
            })
        
         
        
            break;
        
    }

});

/* --------------------------------------------------------------------------------------------------------------------- */
/*                                                 VIEW ALL SMS                                                          */
/* --------------------------------------------------------------------------------------------------------------------- */
app.get("/allsms", (req, res) => {

    smsdb.allDocs({
        include_docs: true,
        attachments: true,
        skip: req.query.offset,
        limit: req.query.limit
    }).then(function (result) {

        res.render("pages/allsms", { name: "All Sms", emails: result.rows, page: "email" });
    }).catch(err => {
        res.render("pages/allsms", { name: "View Sms", emails: [], page: "email" });
    })
})

/* ------------------------------- delete sms ------------------------------- */



/* -------------------------------------------------------------------------- */
/*                                 SINGLE AND BULK SMS                                 */
/* -------------------------------------------------------------------------- */

/* ------------------------------------------------------------------------------------------------------------------ */
/*                                                MARKETING DEPARTMENT                                                */
/* ------------------------------------------------------------------------------------------------------------------ */

}
module.exports = Web;