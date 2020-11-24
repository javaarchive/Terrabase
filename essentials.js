let self = {
  name: "Essentials Module",
  id: "essentials",
  commands: [],
  start: function(environment) {
    environment.registerService("getPrefix", async function(data) {
      return (await environment.services.fetchGlobals(data))["prefix"] || ".";
    });
    environment.services.botEventService.on("modulebeforeload", async function(
      module
    ) {
      environment.services.registerPermisson(module.id + ".enabled");
    });
    environment.registerService("checkAllowed", async function(data) {
      let allowed = await environment.services.checkPerm(
        data,
        data.id + ".enabled"
      );
//      console.log("Allow state: " + allowed + " : " + JSON.stringify(data));
      return allowed;
    });
    environment.registerService("checkBot", async function(message) {
      return message.author.bot;
    });
  },
  handle: async function(data) {
    let message = data.message;
    let additional = { id: self.id };
    let allowed = data.services.checkAllowed({ ...data, ...additional });
    if (data.message.author.id) {
    }
    let prefix = await data.services.getPrefix(data);
    if (
      data.services.isAdmin(message.author) &&
      message.content.startsWith(prefix)
    ) {
      let cmdData = message.content.substring(prefix.length).split(" ");
      data.appendMessage(JSON.stringify(cmdData));
    }
    if (!allowed) {
      return;
    }
  }
};
module.exports = self;
