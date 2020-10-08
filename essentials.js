let self = {
  name: "Essentials Module",
  id: "essentials",
  commands: [],
  start: function(environment) {
    environment.registerService("getPrefix", async function(){
        return (await environment.fetchGlobals())["prefix"] || ".";
    });
    environment.services.botEventService.on("modulebeforeload", async function(module){
      environment.services.registerPermisson(module.id+".enabled");
    });
    environment.services.botEventService.on("checkedAllowed", async function(data){
      return await environment.services.checkPerm(data.id+".enabled");
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
