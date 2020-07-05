module.exports = {
  patch: function(db){
    // Patch endb object to support stuff
    db.ensure = async function(key, value){
      // HOW DARE THEY REMOVE THIS METHOD
      if(!(await this.has(key))){
        this.set(key, value);
      }
    }
    db.getAll = function(queries){
      let funcs = queries.map(query => this.get(query));
      return Promise.all(funcs);
    }
    db.setAll = function(selected){
      let funcs = selected.map(selection => this.set(selection.key, selection.value));
      return Promise.all(funcs);
    }
    db.includes = db.has; 
  }
}