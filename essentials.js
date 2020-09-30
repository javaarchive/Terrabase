let self = {
  name: "Essentials Module",
  id: "essentials",
  commands: [],
  start: function(environment) {
    environment.registerService("getPrefix", async function(){
      
    });
  },
  handle: function(data) {
    let message = data.message;
    let allowed = data.services.checkAllowed({
      message: message,
      id: self.id,
      name: self.name
    });
    if (!allowed) {
      return;
    }
  }
};
module.exports = self;
