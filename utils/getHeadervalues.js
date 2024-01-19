function renderObjectsToTable(objects){

    const uniquePropertyNames = [];
     objects.forEach(obj => {
       for (const prop in obj) {
         if(!uniquePropertyNames.includes(prop))
           uniquePropertyNames.push(prop);
       }
     });
     
    return uniquePropertyNames;
    
   };



   module.exports= renderObjectsToTable;