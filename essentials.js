let self = {
  name: "Essentials Module",
  id: "essentials",
  commands: [],
  start: function(environment) {
    environment.registerService("getPrefix", async function(data){
        return (await environment.services.fetchGlobals(data))["prefix"] || ".";
    });
    environment.services.botEventService.on("modulebeforeload", async function(module){
      environment.services.registerPermisson(module.id+".enabled");
    });
    environment.registerService("checkAllowed", async function(data){
      let allowed = (await environment.services.checkPerm(data,data.id+".enabled"));
      console.log("Allow state: "+allowed+" : "  +JSON.stringify(data))
      return allowed;
    });
    environment.registerService("checkBot", async function(message){
      return message.author.bot;
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
