let self = {
  name: "Example command",
  id: "examplecmd",
  commands: ["exampletext"],
  start: function(environment) {
    environment.services.botEventService.on("memberJoin", function(data) {});
    environment.services.registerPermisson(self.id + ".exampletextcmd");
  },
  handle: async function(data) {
    let message = data.message;
    let allowed = await data.services.checkAllowed({
      message: data.message,
      id: self.id,
      name: self.name
    });
    if (!data.services.checkBot(message)) {
      return;
    }
    if (!allowed) {
      console.log("example module disabled");
      return;
    }
    if (
      data.message.content.startsWith(
        (await data.services.getPrefix(data)) + "exampletext"
      )
    ) {
      if (data.services.checkPerm(self.id + ".exampletextcmd")) {
        data.appendMessage("Untranslated Command Test");
      } else {
        data.appendMessage("Untranslated Test Command not allowed");
      }
    }
  }
};
module.exports = self;
