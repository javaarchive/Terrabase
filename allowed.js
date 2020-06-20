let self = {
  name: "Command Controller",
  id: "cmdcontroller",
  commands: [],
  start: function(enviroment) {
    enviroment.services.registerService("checkAllowed", function(data){
      let message = data.message;
    })
  },
  handle: function(data) {
    
  }
};
module.exports = self;
