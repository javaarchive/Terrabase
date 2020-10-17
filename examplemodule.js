let self = {
  name: "Example command",
  id: "examplecmd",
  commands: ["exampletext"],
  start: function(environment) {
    environment.services.botEventService.on("memberJoin", function(data) {});
    environment.services.registerPermisson(self.id + ".exampletextcmd");
    environment.services.addTranslation("en", self.id, "testtext", "Test text");
    environment.services.addTranslation(
      "en",
      self.id,
      "commanddenied",
      "This command has been disabled"
    );
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
    let prefix = await data.services.getPrefix(data);
    if (data.message.content.startsWith(prefix + "exampletext")) {
      if ((await data.services.checkPerm(data, self.id + ".exampletextcmd"))) {
        data.appendMessage(
          await data.services.getTranslation("en", self.id, "testtext")
        );
      } else {
        data.appendMessage(
          await data.services.getTranslation("en", self.id, "commanddenied")
        );
      }
    }
  }
};
module.exports = self;
